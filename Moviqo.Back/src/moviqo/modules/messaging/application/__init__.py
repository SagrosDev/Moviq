from __future__ import annotations

import logging
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import timedelta
from email.utils import parseaddr
from enum import StrEnum
from urllib import error as urllib_error
from urllib import request as urllib_request
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from moviqo.building_blocks.secure_payloads import decrypt_secret_payload
from moviqo.building_blocks.tenancy import tenant_background_atomic_context
from moviqo.modules.messaging.models import OutboxMessage

logger = logging.getLogger(__name__)

SYNTHETIC_EMAIL_SUFFIX = "@synthetic.moviqo.test"
RESEND_USER_AGENT = "moviqo-back/1.0"
OUTBOX_RECIPIENT_LOOKUP_LIMIT = 100


class LeaseOwnershipLost(RuntimeError):
    """Raised when a worker no longer owns a claimed outbox row."""


class OutboxRecipientLookupStatus(StrEnum):
    DELIVERED = "delivered"
    MESSAGE_NOT_ENQUEUED = "message-not-enqueued"
    MESSAGE_PENDING_DELIVERY = "message-pending-delivery"
    MESSAGE_PROCESSING = "message-processing"
    MESSAGE_LEASE_EXPIRED = "message-lease-expired"
    MESSAGE_RETRYING = "message-retrying"
    MESSAGE_DEAD_LETTERED = "message-dead-lettered"
    PAYLOAD_INVALID = "payload-invalid"
    RECIPIENT_MISMATCH = "recipient-mismatch"
    LOOKUP_TRUNCATED = "lookup-truncated"


@dataclass(frozen=True)
class OutboxRecipientLookupResult:
    payload: dict | None
    status: OutboxRecipientLookupStatus


def module_health() -> dict[str, object]:
    adapter = settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER

    if adapter == "resend-outbox":
        return {
            "adapter": "resend-outbox",
            "provider": "resend",
            "job_runners": {"outboxEmailDrain": "outbox-email-drain"},
        }

    if adapter == "console":
        return {
            "adapter": "console",
            "provider": "local",
            "job_runners": {"outboxEmailDrain": "inline-console"},
        }

    raise RuntimeError(f"Unsupported messaging adapter: {adapter}")


def enqueue_outbox_message(
    *,
    organization_id,
    message_type: str,
    payload: dict,
) -> OutboxMessage:
    return OutboxMessage.objects.create(
        organization_id=organization_id,
        message_type=message_type,
        payload=payload,
    )


def read_latest_outbox_message_payload_for_recipient(
    *,
    organization_id,
    message_type: str,
    recipient_email: str,
    created_at_or_after,
) -> OutboxRecipientLookupResult:
    candidate_rows = list(
        OutboxMessage.objects.filter(
            organization_id=organization_id,
            message_type=message_type,
            created_at__gte=created_at_or_after,
        )
        .order_by("-created_at", "-id")
        .values(
            "payload",
            "delivered_at",
            "dead_lettered_at",
            "attempt_count",
            "lease_owner",
            "lease_expires_at",
        )[: OUTBOX_RECIPIENT_LOOKUP_LIMIT + 1]
    )
    if not candidate_rows:
        return OutboxRecipientLookupResult(
            payload=None,
            status=OutboxRecipientLookupStatus.MESSAGE_NOT_ENQUEUED,
        )

    truncated = len(candidate_rows) > OUTBOX_RECIPIENT_LOOKUP_LIMIT
    candidate_rows = candidate_rows[:OUTBOX_RECIPIENT_LOOKUP_LIMIT]
    saw_valid_recipient = False
    saw_invalid_payload = False
    matching_rows = []
    for candidate in candidate_rows:
        payload = candidate["payload"]
        if not isinstance(payload, dict):
            saw_invalid_payload = True
            continue
        recipients = payload.get("to")
        if (
            not isinstance(recipients, list)
            or len(recipients) != 1
            or not isinstance(recipients[0], str)
        ):
            saw_invalid_payload = True
            continue
        saw_valid_recipient = True
        if recipients != [recipient_email]:
            continue
        matching_rows.append(candidate)

    for candidate in matching_rows:
        if (
            candidate["delivered_at"] is not None
            and candidate["dead_lettered_at"] is None
        ):
            return OutboxRecipientLookupResult(
                payload=dict(candidate["payload"]),
                status=OutboxRecipientLookupStatus.DELIVERED,
            )

    if matching_rows:
        candidate = matching_rows[0]
        if candidate["dead_lettered_at"] is not None:
            return OutboxRecipientLookupResult(
                payload=None,
                status=OutboxRecipientLookupStatus.MESSAGE_DEAD_LETTERED,
            )
        status = (
            OutboxRecipientLookupStatus.MESSAGE_RETRYING
            if candidate["attempt_count"] > 0
            else _pending_outbox_lookup_status(candidate)
        )
        return OutboxRecipientLookupResult(payload=None, status=status)

    if truncated:
        status = OutboxRecipientLookupStatus.LOOKUP_TRUNCATED
    elif saw_valid_recipient:
        status = OutboxRecipientLookupStatus.RECIPIENT_MISMATCH
    elif saw_invalid_payload:
        status = OutboxRecipientLookupStatus.PAYLOAD_INVALID
    else:
        status = OutboxRecipientLookupStatus.MESSAGE_NOT_ENQUEUED
    return OutboxRecipientLookupResult(
        payload=None,
        status=status,
    )


def _pending_outbox_lookup_status(candidate: dict) -> OutboxRecipientLookupStatus:
    lease_owner = candidate["lease_owner"]
    lease_expires_at = candidate["lease_expires_at"]
    if not lease_owner or lease_expires_at is None:
        return OutboxRecipientLookupStatus.MESSAGE_PENDING_DELIVERY
    if lease_expires_at <= timezone.now():
        return OutboxRecipientLookupStatus.MESSAGE_LEASE_EXPIRED
    return OutboxRecipientLookupStatus.MESSAGE_PROCESSING


def claim_outbox_messages(
    *,
    limit: int,
    lease_owner: str,
    now,
    lease_for: timedelta,
    organization_id=None,
) -> list[OutboxMessage]:
    with transaction.atomic():
        query = (
            OutboxMessage.objects.select_for_update(skip_locked=True)
            .filter(delivered_at__isnull=True, dead_lettered_at__isnull=True)
            .filter(next_attempt_at__lte=now)
            .filter(Q(lease_expires_at__isnull=True) | Q(lease_expires_at__lt=now))
        )
        if organization_id is not None:
            query = query.filter(organization_id=organization_id)
        claimed = list(
            query.order_by("next_attempt_at", "created_at")[:limit]
        )
        for message in claimed:
            message.lease_owner = lease_owner
            message.lease_expires_at = now + lease_for
            message.save(update_fields=["lease_owner", "lease_expires_at", "updated_at"])
        return claimed


def acknowledge_outbox_message(
    *,
    message_id,
    lease_owner: str,
    now,
) -> None:
    updated = _with_owned_lease(message_id=message_id, lease_owner=lease_owner).update(
        delivered_at=now,
        lease_owner=None,
        lease_expires_at=None,
    )
    if updated != 1:
        raise LeaseOwnershipLost("outbox lease ownership was lost before acknowledgement")


def release_outbox_message(
    *,
    message_id,
    lease_owner: str,
    now,
    retry_delay: timedelta,
    reason: str,
) -> None:
    with transaction.atomic():
        message = (
            _with_owned_lease(message_id=message_id, lease_owner=lease_owner)
            .select_for_update()
            .first()
        )
        if message is None:
            raise LeaseOwnershipLost("outbox lease ownership was lost before release")
        message.attempt_count += 1
        message.next_attempt_at = now + retry_delay
        message.lease_owner = None
        message.lease_expires_at = None
        message.last_error = reason
        message.save(
            update_fields=[
                "attempt_count",
                "next_attempt_at",
                "lease_owner",
                "lease_expires_at",
                "last_error",
                "updated_at",
            ]
        )


def dead_letter_outbox_message(
    *,
    message_id,
    lease_owner: str,
    now,
    reason: str,
) -> None:
    updated = _with_owned_lease(message_id=message_id, lease_owner=lease_owner).update(
        dead_lettered_at=now,
        dead_letter_reason=reason,
        lease_owner=None,
        lease_expires_at=None,
        last_error=reason,
    )
    if updated != 1:
        raise LeaseOwnershipLost("outbox lease ownership was lost before dead-lettering")


def _with_owned_lease(*, message_id, lease_owner: str):
    return OutboxMessage.objects.filter(id=message_id, lease_owner=lease_owner)


def drain_outbox_messages(
    *,
    batch_size: int = 25,
    lease_owner: str | None = None,
    now=None,
    lease_for: timedelta = timedelta(minutes=2),
    max_attempts: int = 3,
) -> int:
    current_time = now or timezone.now()
    owner = lease_owner or f"drain-outbox-{uuid4()}"
    processed = 0
    for organization_id in _claimable_organization_ids(now=current_time, limit=batch_size):
        remaining = batch_size - processed
        if remaining <= 0:
            break
        with tenant_background_atomic_context(organization_id=organization_id):
            claimed = claim_outbox_messages(
                limit=remaining,
                lease_owner=owner,
                now=current_time,
                lease_for=lease_for,
                organization_id=organization_id,
            )
        for message in claimed:
            processed += 1
            finished_at = now or timezone.now()
            try:
                with tenant_background_atomic_context(organization_id=message.organization_id):
                    _deliver_outbox_message(message)
                    acknowledge_outbox_message(
                        message_id=message.id,
                        lease_owner=owner,
                        now=finished_at,
                    )
            except LeaseOwnershipLost:
                logger.warning("Outbox lease lost before finalization for message %s.", message.id)
                continue
            except Exception as exc:
                failure_reason = _delivery_failure_reason(exc)
                logger.warning(
                    "Outbox delivery failed for message %s (%s); reason=%s.",
                    message.id,
                    message.message_type,
                    failure_reason,
                )
                try:
                    with tenant_background_atomic_context(organization_id=message.organization_id):
                        if message.attempt_count + 1 >= max_attempts:
                            dead_letter_outbox_message(
                                message_id=message.id,
                                lease_owner=owner,
                                now=finished_at,
                                reason="delivery-attempts-exhausted",
                            )
                        else:
                            release_outbox_message(
                                message_id=message.id,
                                lease_owner=owner,
                                now=finished_at,
                                retry_delay=_retry_delay_for_attempt(message.attempt_count + 1),
                                reason=failure_reason,
                            )
                except LeaseOwnershipLost:
                    logger.warning(
                        "Outbox lease lost before retry/dead-letter finalization for message %s.",
                        message.id,
                    )
                    continue
    return processed


def _claimable_organization_ids(*, now, limit: int) -> list:
    candidate_rows: Iterable = (
        OutboxMessage.objects.filter(delivered_at__isnull=True, dead_lettered_at__isnull=True)
        .filter(next_attempt_at__lte=now)
        .filter(Q(lease_expires_at__isnull=True) | Q(lease_expires_at__lt=now))
        .order_by("next_attempt_at", "created_at")
        .values_list("organization_id", flat=True)[: max(limit * 4, limit)]
    )
    seen = set()
    organization_ids = []
    for organization_id in candidate_rows:
        if organization_id in seen:
            continue
        seen.add(organization_id)
        organization_ids.append(organization_id)
    return organization_ids


def _deliver_outbox_message(message: OutboxMessage) -> None:
    if settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER == "console":
        _deliver_console_outbox_message(message)
        return
    if settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER == "resend-outbox":
        _deliver_resend_outbox_message(message)
        return
    raise RuntimeError(
        "Unsupported messaging adapter for outbox drain: "
        f"{settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER}"
    )


def _deliver_console_outbox_message(message: OutboxMessage) -> None:
    logger.info("Console outbox delivery for %s (%s)", message.id, message.message_type)


def _deliver_resend_outbox_message(message: OutboxMessage) -> None:
    api_key = getattr(settings, "MOVIQO_RESEND_API_KEY", None)
    if not api_key:
        raise RuntimeError("resend-credentials-missing")

    payload = _resend_delivery_payload(message)
    request = urllib_request.Request(
        "https://api.resend.com/emails",
        data=_json_payload(payload),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": RESEND_USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(request, timeout=10) as response:
            if getattr(response, "status", 200) not in {200, 201, 202}:
                raise RuntimeError("resend-delivery-rejected")
    except urllib_error.HTTPError as exc:
        raise RuntimeError(f"resend-delivery-http-{exc.code}") from exc
    except urllib_error.URLError as exc:
        raise RuntimeError("resend-delivery-network-failed") from exc


def _resend_payload(message: OutboxMessage) -> dict:
    if message.message_type != "email.password_recovery":
        return message.payload
    envelope = decrypt_secret_payload(message.payload["recoveryEnvelope"])
    language = message.payload.get("language", "es")
    token = envelope["token"]
    recovery_url = (
        f"{settings.MOVIQO_PUBLIC_APP_BASE_URL.rstrip('/')}/password-reset?token={token}"
    )
    localized = {
        "es": {
            "subject": "Restablece tu contrasena de Moviqo",
            "text": f"Usa este enlace de un solo uso para restablecerla: {recovery_url}",
        },
        "en": {
            "subject": "Reset your Moviqo password",
            "text": f"Use this single-use link to reset it: {recovery_url}",
        },
    }.get(language, None) or {
        "subject": "Reset your Moviqo password",
        "text": f"Use this single-use link to reset it: {recovery_url}",
    }
    return {
        "from": "Moviqo <noreply@moviqo.local>",
        "to": [envelope["to"]],
        **localized,
    }


def _resend_delivery_payload(message: OutboxMessage) -> dict:
    payload = dict(_resend_payload(message))
    payload["from"] = _resend_sender()
    recipients = payload.get("to")
    if settings.MOVIQO_ENVIRONMENT_CLASS != "synthetic-only" or not isinstance(
        recipients, list
    ):
        return payload

    synthetic_recipients = [
        recipient
        for recipient in recipients
        if isinstance(recipient, str)
        and recipient.lower().endswith(SYNTHETIC_EMAIL_SUFFIX)
    ]
    if not synthetic_recipients:
        return payload
    if len(recipients) != 1 or len(synthetic_recipients) != 1:
        raise RuntimeError("resend-recipient-mix-invalid")

    # The deployed journey owns a non-deliverable .test identity. Route only that
    # reserved address to the secret-backed UAT mailbox after genuine Resend delivery.
    payload["to"] = [_resend_test_recipient()]
    return payload


def _resend_sender() -> str:
    sender = getattr(settings, "MOVIQO_RESEND_FROM_EMAIL", "").strip()
    if not sender:
        raise RuntimeError("resend-sender-missing")
    display_name, address = parseaddr(sender)
    try:
        validate_email(address)
    except ValidationError as exc:
        raise RuntimeError("resend-sender-invalid") from exc
    if not display_name or not sender.endswith(f"<{address}>"):
        raise RuntimeError("resend-sender-invalid")
    return sender


def _resend_test_recipient() -> str:
    recipient = getattr(settings, "MOVIQO_RESEND_TEST_RECIPIENT", "").strip()
    if not recipient:
        raise RuntimeError("resend-test-recipient-missing")
    try:
        validate_email(recipient)
    except ValidationError as exc:
        raise RuntimeError("resend-test-recipient-invalid") from exc
    return recipient


def _json_payload(payload: dict) -> bytes:
    import json

    return json.dumps(payload).encode("utf-8")


def _delivery_failure_reason(exc: Exception) -> str:
    reason = str(exc)
    if reason in {
        "resend-credentials-missing",
        "resend-delivery-rejected",
        "resend-delivery-failed",
        "resend-delivery-network-failed",
        "resend-sender-missing",
        "resend-sender-invalid",
        "resend-recipient-mix-invalid",
        "resend-test-recipient-missing",
        "resend-test-recipient-invalid",
    }:
        return reason
    http_status = reason.removeprefix("resend-delivery-http-")
    if http_status.isdigit() and 400 <= int(http_status) <= 599:
        return reason
    return "delivery-failed"


def _retry_delay_for_attempt(attempt_number: int) -> timedelta:
    return timedelta(minutes=min(2**attempt_number, 30))
