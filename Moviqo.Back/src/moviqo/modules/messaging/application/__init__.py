from __future__ import annotations

import logging
from collections.abc import Iterable
from datetime import timedelta
from urllib import error as urllib_error
from urllib import request as urllib_request
from uuid import uuid4

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from moviqo.building_blocks.secure_payloads import decrypt_secret_payload
from moviqo.building_blocks.tenancy import tenant_background_atomic_context
from moviqo.modules.messaging.models import OutboxMessage

logger = logging.getLogger(__name__)


class LeaseOwnershipLost(RuntimeError):
    """Raised when a worker no longer owns a claimed outbox row."""


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
    message_type: str,
    recipient_email: str,
) -> dict | None:
    messages = OutboxMessage.objects.filter(message_type=message_type).order_by("-created_at")
    for message in messages:
        recipients = message.payload.get("to", [])
        if recipients == [recipient_email]:
            return dict(message.payload)
    return None


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
                                reason=_delivery_failure_reason(exc),
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

    payload = _resend_payload(message)
    request = urllib_request.Request(
        "https://api.resend.com/emails",
        data=_json_payload(payload),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(request, timeout=10) as response:
            if getattr(response, "status", 200) not in {200, 201, 202}:
                raise RuntimeError("resend-delivery-rejected")
    except urllib_error.URLError as exc:
        raise RuntimeError("resend-delivery-failed") from exc


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


def _json_payload(payload: dict) -> bytes:
    import json

    return json.dumps(payload).encode("utf-8")


def _delivery_failure_reason(exc: Exception) -> str:
    if str(exc) in {
        "resend-credentials-missing",
        "resend-delivery-rejected",
        "resend-delivery-failed",
    }:
        return str(exc)
    return "delivery-failed"


def _retry_delay_for_attempt(attempt_number: int) -> timedelta:
    return timedelta(minutes=min(2**attempt_number, 30))
