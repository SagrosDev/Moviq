from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.db import transaction
from django.utils import timezone

from moviqo.building_blocks.secure_payloads import encrypt_secret_payload
from moviqo.modules.messaging.application import enqueue_outbox_message
from moviqo.modules.organizations.application.password_policy import (
    CredentialValidationError,
    set_user_password,
)
from moviqo.modules.organizations.models import (
    Membership,
    MoviqoUser,
    PasswordRecoveryThrottle,
    PasswordRecoveryToken,
    RegistrationWorkflowState,
)
from moviqo.modules.organizations.user_managers import MoviqoUserManager

RECOVERY_TOKEN_TTL = timedelta(hours=1)
RECOVERY_RATE_LIMIT = 5
RECOVERY_RATE_WINDOW_SECONDS = 900


class PasswordRecoveryError(Exception):
    pass


@dataclass(frozen=True)
class RecoveryRequestResult:
    status: str = "recovery_requested"


def request_password_recovery(
    *, email: str, remote_address: str, language: str = "es"
) -> RecoveryRequestResult:
    normalized_email = MoviqoUserManager.normalize_identity_email(email)
    risk_keys = _recovery_risk_keys(normalized_email, remote_address)
    if _is_recovery_rate_limited(risk_keys):
        return RecoveryRequestResult()

    user = MoviqoUser.objects.filter(normalized_email=normalized_email).first()
    membership = _eligible_membership(user)
    if membership is None:
        get_user_model()().set_password(secrets.token_urlsafe(24))
        return RecoveryRequestResult()

    raw_token = secrets.token_urlsafe(48)
    now = timezone.now()
    with transaction.atomic():
        locked_user = MoviqoUser.objects.select_for_update().get(pk=user.pk)
        locked_membership = _eligible_membership(locked_user)
        if locked_membership is None:
            return RecoveryRequestResult()
        PasswordRecoveryToken.objects.filter(
            user=locked_user, consumed_at__isnull=True
        ).update(consumed_at=now)
        recovery = PasswordRecoveryToken.objects.create(
            user=locked_user,
            token_digest=_digest_token(raw_token),
            expires_at=now + RECOVERY_TOKEN_TTL,
        )
        enqueue_outbox_message(
            organization_id=locked_membership.organization_id,
            message_type="email.password_recovery",
            payload={
                "language": language if language in {"es", "en"} else "es",
                "recoveryEnvelope": encrypt_secret_payload(
                    {
                        "to": locked_user.email,
                        "token": raw_token,
                    }
                ),
                "tokenId": str(recovery.id),
            },
        )
    return RecoveryRequestResult()


@transaction.atomic
def reset_password(*, token: str, password: str, language: str = "es") -> None:
    recovery = PasswordRecoveryToken.objects.filter(token_digest=_digest_token(token)).first()
    now = timezone.now()
    if recovery is None:
        raise PasswordRecoveryError()
    user = MoviqoUser.objects.select_for_update().get(pk=recovery.user_id)
    recovery = PasswordRecoveryToken.objects.select_for_update().get(pk=recovery.pk)
    if recovery.consumed_at is not None or recovery.expires_at <= now:
        raise PasswordRecoveryError()
    if _eligible_membership(user) is None:
        raise PasswordRecoveryError()
    try:
        set_user_password(user, password, locale=language)
    except CredentialValidationError:
        raise
    recovery.consumed_at = now
    recovery.save(update_fields=["consumed_at"])
    _revoke_all_sessions(user.pk)


def _eligible_membership(user: MoviqoUser | None) -> Membership | None:
    if user is None or not user.is_active:
        return None
    return (
        Membership.objects.select_related("organization")
        .filter(
            user=user,
            is_active=True,
            registration_state=RegistrationWorkflowState.ACTIVE,
            organization__is_active=True,
            organization__registration_state=RegistrationWorkflowState.ACTIVE,
        )
        .first()
    )


def _digest_token(token: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"), token.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _recovery_risk_keys(email: str, remote_address: str) -> tuple[str, str]:
    email_digest = hashlib.sha256(email.encode("utf-8")).hexdigest()
    address_digest = hashlib.sha256(remote_address[:128].encode("utf-8")).hexdigest()
    return (
        f"moviqo:recovery-risk:identity:{email_digest}",
        f"moviqo:recovery-risk:network:{address_digest}",
    )


@transaction.atomic
def _is_recovery_rate_limited(keys: tuple[str, str]) -> bool:
    now = timezone.now()
    rows = []
    for key in keys:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        row, _ = PasswordRecoveryThrottle.objects.get_or_create(
            key_digest=digest,
            defaults={"window_started_at": now, "request_count": 0},
        )
        rows.append(PasswordRecoveryThrottle.objects.select_for_update().get(pk=row.pk))
    if any(
        now.timestamp() - row.window_started_at.timestamp() >= RECOVERY_RATE_WINDOW_SECONDS
        for row in rows
    ):
        for row in rows:
            row.window_started_at = now
            row.request_count = 0
    if any(row.request_count >= RECOVERY_RATE_LIMIT for row in rows):
        return True
    for row in rows:
        row.request_count += 1
        row.save(update_fields=["window_started_at", "request_count"])
    return False


def _revoke_all_sessions(user_id: int) -> None:
    for session in Session.objects.filter(expire_date__gt=timezone.now()).iterator():
        if str(session.get_decoded().get("_auth_user_id")) == str(user_id):
            session.delete()
