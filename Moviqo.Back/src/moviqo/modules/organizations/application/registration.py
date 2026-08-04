from __future__ import annotations

import hashlib
import hmac
import json
import uuid
from dataclasses import dataclass
from datetime import timedelta
from zoneinfo import available_timezones

from django.conf import settings
from django.core import signing
from django.db import IntegrityError, transaction
from django.utils import timezone as django_timezone
from django.utils.text import slugify

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.modules.governance.application import (
    append_transactional_audit,
    complete_command_result,
    create_pending_command_result,
)
from moviqo.modules.messaging.application import enqueue_outbox_message
from moviqo.modules.organizations.application.identity_boundary import normalize_identity_email
from moviqo.modules.organizations.application.password_policy import (
    CredentialValidationError,
    create_user_with_validated_password,
    normalize_password,
)
from moviqo.modules.organizations.models import (
    InitialRegistrationCommandResult,
    Membership,
    MembershipRole,
    MoviqoUser,
    Organization,
    OrganizationRegistrationConsent,
    RegistrationVerification,
    RegistrationWorkflowState,
)

SUPPORTED_LANGUAGES = frozenset({"es", "en"})
SUPPORTED_REGIONS = frozenset({"CO", "US", "MX", "ES", "AR", "CL", "PE"})
SUPPORTED_CURRENCIES = frozenset({"COP", "USD", "MXN", "EUR", "ARS", "CLP", "PEN"})
VERIFICATION_SALT = "organizations.registration_verification"


@dataclass(frozen=True)
class RegistrationValidationError(Exception):
    invalid_params: list[dict[str, str]]
    problem_code: str = "registration_invalid"
    title: str = "Registration failed"

    def __post_init__(self) -> None:
        Exception.__init__(self, self.problem_code)


def register_initial_owner(
    *,
    owner_name: str,
    organization_name: str,
    email: str,
    password: str,
    language: str,
    region: str,
    timezone: str,
    currency: str,
    terms_accepted: bool,
    privacy_accepted: bool,
    terms_version: str,
    privacy_version: str,
    prohibited_data_acknowledged: bool,
    idempotency_key: str,
) -> dict[str, str]:
    normalized_email = normalize_identity_email(email)
    normalized_password = normalize_password(password)
    request_hash = _request_hash(
        {
            "owner_name": owner_name.strip(),
            "organization_name": organization_name.strip(),
            "email": normalized_email,
            "password_digest": _password_digest(normalized_password),
            "language": language,
            "region": region,
            "timezone": timezone,
            "currency": currency,
            "terms_accepted": terms_accepted,
            "privacy_accepted": privacy_accepted,
            "terms_version": terms_version.strip(),
            "privacy_version": privacy_version.strip(),
            "prohibited_data_acknowledged": prohibited_data_acknowledged,
        }
    )
    _validate_registration_input(
        owner_name=owner_name,
        organization_name=organization_name,
        normalized_email=normalized_email,
        language=language,
        region=region,
        timezone_name=timezone,
        currency=currency,
        terms_accepted=terms_accepted,
        privacy_accepted=privacy_accepted,
        terms_version=terms_version,
        privacy_version=privacy_version,
        prohibited_data_acknowledged=prohibited_data_acknowledged,
    )

    try:
        for _attempt in range(4):
            try:
                with transaction.atomic():
                    command_result = _load_or_create_registration_command_result(
                        normalized_email=normalized_email,
                        idempotency_key=idempotency_key,
                        request_hash=request_hash,
                    )
                    if command_result.completed_at is not None:
                        return dict(command_result.result_payload)

                    if (
                        _reserved_organization_count()
                        >= settings.MOVIQO_ACTIVE_ORGANIZATION_CAPACITY
                    ):
                        raise RegistrationValidationError(
                            invalid_params=[
                                {
                                    "name": "nonFieldErrors",
                                    "code": "capacity_full",
                                    "reason": "Registration is temporarily unavailable.",
                                }
                            ]
                        )

                    organization_slug = _unique_organization_slug(organization_name)

                    if MoviqoUser.objects.filter(normalized_email=normalized_email).exists():
                        raise RegistrationValidationError(
                            invalid_params=[
                                {
                                    "name": "email",
                                    "code": "email_unavailable",
                                    "reason": "Registration is unavailable for this email.",
                                }
                            ]
                        )

                    organization = Organization.objects.create(
                        slug=organization_slug,
                        display_name=organization_name.strip(),
                        is_active=False,
                        registration_state=RegistrationWorkflowState.PENDING,
                        preferred_language=language,
                        region_code=region,
                        timezone_name=timezone,
                        currency_code=currency,
                    )
                    user = create_user_with_validated_password(
                        username=_generated_username(),
                        email=normalized_email,
                        password=normalized_password,
                        locale=language,
                        is_active=False,
                        display_name=owner_name.strip(),
                        preferred_language=language,
                        region_code=region,
                        timezone_name=timezone,
                        currency_code=currency,
                    )
                    membership = Membership.objects.create(
                        organization=organization,
                        user=user,
                        role=MembershipRole.OWNER,
                        is_active=False,
                        registration_state=RegistrationWorkflowState.PENDING,
                    )
                    accepted_at = timezone_now = django_timezone.now()
                    OrganizationRegistrationConsent.objects.create(
                        organization=organization,
                        user=user,
                        terms_accepted=terms_accepted,
                        privacy_accepted=privacy_accepted,
                        terms_version=terms_version.strip(),
                        privacy_version=privacy_version.strip(),
                        prohibited_data_acknowledged=True,
                        accepted_at=accepted_at,
                    )
                    verification = RegistrationVerification.objects.create(
                        organization=organization,
                        user=user,
                        membership=membership,
                        expires_at=timezone_now + timedelta(hours=24),
                    )
                    governance_result = create_pending_command_result(
                        organization_id=organization.id,
                        command_type="organizations.registration.submit",
                        idempotency_key=idempotency_key,
                        request_hash=request_hash,
                    )
                    append_transactional_audit(
                        organization_id=organization.id,
                        command_type="organizations.registration.submit",
                        event_type="organizations.registration.pending-created",
                        actor_membership_id=membership.id,
                        actor_user_id=user.id,
                        payload={
                            "language": language,
                            "region": region,
                            "timezone": timezone,
                            "currency": currency,
                        },
                    )
                    enqueue_outbox_message(
                        organization_id=organization.id,
                        message_type="email.registration_verification",
                        payload=_verification_email_payload(
                            email=normalized_email,
                            language=language,
                            verification=verification,
                        ),
                    )
                    result = {
                        "status": "pending_verification",
                        "email": normalized_email,
                        "language": language,
                    }
                    complete_command_result(
                        command_result=governance_result,
                        result_payload=result,
                    )
                    complete_command_result(
                        command_result=command_result,
                        result_payload=result,
                    )
                    return result
            except IntegrityError as exc:
                if MoviqoUser.objects.filter(normalized_email=normalized_email).exists():
                    raise RegistrationValidationError(
                        invalid_params=[
                            {
                                "name": "email",
                                "code": "email_unavailable",
                                "reason": "Registration is unavailable for this email.",
                            }
                        ]
                    ) from exc
                if "organizations_organization_slug" in str(exc):
                    continue
                raise

        raise RuntimeError("registration slug generation exhausted")
    except CredentialValidationError as exc:
        raise RegistrationValidationError(
            invalid_params=[
                {
                    "name": "password",
                    "code": code,
                    "reason": message,
                }
                for code, message in zip(exc.codes, exc.messages, strict=False)
            ]
        ) from exc


def _validate_registration_input(
    *,
    owner_name: str,
    organization_name: str,
    normalized_email: str,
    language: str,
    region: str,
    timezone_name: str,
    currency: str,
    terms_accepted: bool,
    privacy_accepted: bool,
    terms_version: str,
    privacy_version: str,
    prohibited_data_acknowledged: bool,
) -> None:
    invalid_params: list[dict[str, str]] = []

    if not owner_name.strip():
        invalid_params.append(
            {
                "name": "ownerName",
                "code": "required",
                "reason": "Complete this field to continue.",
            }
        )
    if not organization_name.strip():
        invalid_params.append(
            {
                "name": "organizationName",
                "code": "required",
                "reason": "Complete this field to continue.",
            }
        )
    if not normalized_email:
        invalid_params.append(
            {
                "name": "email",
                "code": "invalid_email",
                "reason": "Enter a valid email address.",
            }
        )
    if language not in SUPPORTED_LANGUAGES:
        invalid_params.append(
            {
                "name": "language",
                "code": "unsupported_language",
                "reason": "Choose a supported language.",
            }
        )
    if region not in SUPPORTED_REGIONS:
        invalid_params.append(
            {
                "name": "region",
                "code": "unsupported_region",
                "reason": "Choose a supported region.",
            }
        )
    if currency not in SUPPORTED_CURRENCIES:
        invalid_params.append(
            {
                "name": "currency",
                "code": "unsupported_currency",
                "reason": "Choose a supported currency.",
            }
        )
    if timezone_name not in available_timezones():
        invalid_params.append(
            {
                "name": "timezone",
                "code": "unsupported_timezone",
                "reason": "Choose a supported timezone.",
            }
        )
    if not terms_accepted:
        invalid_params.append(
            {
                "name": "termsAccepted",
                "code": "consent_required",
                "reason": "Complete the required acceptance to continue.",
            }
        )
    if not privacy_accepted:
        invalid_params.append(
            {
                "name": "privacyAccepted",
                "code": "consent_required",
                "reason": "Complete the required acceptance to continue.",
            }
        )
    if not terms_version.strip():
        invalid_params.append(
            {
                "name": "termsVersion",
                "code": "consent_required",
                "reason": "Complete the required acceptance to continue.",
            }
        )
    if not privacy_version.strip():
        invalid_params.append(
            {
                "name": "privacyVersion",
                "code": "consent_required",
                "reason": "Complete the required acceptance to continue.",
            }
        )
    if not prohibited_data_acknowledged:
        invalid_params.append(
            {
                "name": "prohibitedDataAcknowledged",
                "code": "consent_required",
                "reason": "Complete the required acceptance to continue.",
            }
        )

    if invalid_params:
        raise RegistrationValidationError(invalid_params=invalid_params)


def _generated_username() -> str:
    return f"pending-owner-{uuid.uuid4().hex[:20]}"


def _unique_organization_slug(display_name: str) -> str:
    base_slug = slugify(display_name).strip("-")[:60] or "organization"
    candidate = base_slug
    suffix = 1
    while Organization.objects.filter(slug=candidate).exists():
        candidate = f"{base_slug[:55]}-{suffix}"
        suffix += 1
    return candidate


def _verification_email_payload(
    *,
    email: str,
    language: str,
    verification: RegistrationVerification,
) -> dict[str, object]:
    token = signing.TimestampSigner(salt=VERIFICATION_SALT).sign(str(verification.id))
    verification_link = (
        f"{settings.MOVIQO_PUBLIC_APP_BASE_URL.rstrip('/')}/verify-email?token={token}"
    )
    localized = {
        "es": {
            "subject": "Verifica tu correo para entrar a Moviqo",
            "text": (
                "Verifica tu correo para continuar con Moviqo. "
                f"Usa este enlace de un solo uso: {verification_link}"
            ),
        },
        "en": {
            "subject": "Verify your email to enter Moviqo",
            "text": (
                "Verify your email to continue with Moviqo. "
                f"Use this single-use link: {verification_link}"
            ),
        },
    }[language]
    return {
        "from": "Moviqo <noreply@moviqo.local>",
        "to": [email],
        "subject": localized["subject"],
        "text": localized["text"],
    }


def _active_organization_count() -> int:
    return Organization.objects.filter(is_active=True).count()


def _reserved_organization_count() -> int:
    return Organization.objects.filter(
        registration_state__in=(
            RegistrationWorkflowState.ACTIVE,
            RegistrationWorkflowState.PENDING,
        )
    ).count()


def _load_or_create_registration_command_result(
    *,
    normalized_email: str,
    idempotency_key: str,
    request_hash: str,
) -> InitialRegistrationCommandResult:
    with transaction.atomic():
        command_result = (
            InitialRegistrationCommandResult.objects.select_for_update()
            .filter(normalized_email=normalized_email, idempotency_key=idempotency_key)
            .first()
        )
        if command_result is not None:
            _ensure_matching_request_hash(command_result=command_result, request_hash=request_hash)
            return command_result

        try:
            return InitialRegistrationCommandResult.objects.create(
                normalized_email=normalized_email,
                idempotency_key=idempotency_key,
                request_hash=request_hash,
                result_payload={},
            )
        except IntegrityError:
            command_result = (
                InitialRegistrationCommandResult.objects.select_for_update()
                .filter(normalized_email=normalized_email, idempotency_key=idempotency_key)
                .first()
            )
            if command_result is None:
                raise
            _ensure_matching_request_hash(command_result=command_result, request_hash=request_hash)
            return command_result


def _ensure_matching_request_hash(
    *,
    command_result: InitialRegistrationCommandResult,
    request_hash: str,
) -> None:
    if command_result.request_hash != request_hash:
        raise IdempotencyKeyReuseConflict()


def _request_hash(payload: dict[str, str]) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def _password_digest(password: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
