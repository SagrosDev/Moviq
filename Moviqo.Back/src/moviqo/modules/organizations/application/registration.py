from __future__ import annotations

import hashlib
import hmac
import json
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from zoneinfo import available_timezones

from django.conf import settings
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.db import IntegrityError, transaction
from django.utils import timezone as django_timezone
from django.utils.text import slugify

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.building_blocks.tenancy.runtime import (
    TenantContext,
    apply_tenant_context,
    registration_verification_bootstrap_context,
    tenant_background_atomic_context,
    tenant_bootstrap_context,
)
from moviqo.modules.governance.application import (
    append_transactional_audit,
    complete_command_result,
    create_pending_command_result,
)
from moviqo.modules.messaging.application import (
    OutboxRecipientLookupStatus,
    enqueue_outbox_message,
    read_latest_outbox_message_payload_for_recipient,
)
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
SYNTHETIC_JOURNEY_SALT = "organizations.synthetic_journey"
SYNTHETIC_JOURNEY_MAX_AGE = timedelta(minutes=30)
SYNTHETIC_EMAIL_SUFFIX = "@synthetic.moviqo.test"
VERIFICATION_LINK_PATTERN = re.compile(r"https://[^\s]+/verify-email\?token=[^\s]+")


class SyntheticVerificationDiagnosticReason(StrEnum):
    SCOPE_INVALID = "scope-invalid"
    USER_MISSING = "user-missing"
    MEMBERSHIP_MISSING = "membership-missing"
    MESSAGE_NOT_ENQUEUED = "message-not-enqueued"
    MESSAGE_PENDING_DELIVERY = "message-pending-delivery"
    MESSAGE_PROCESSING = "message-processing"
    MESSAGE_LEASE_EXPIRED = "message-lease-expired"
    MESSAGE_RETRYING = "message-retrying"
    MESSAGE_DEAD_LETTERED = "message-dead-lettered"
    PAYLOAD_INVALID = "payload-invalid"
    RECIPIENT_MISMATCH = "recipient-mismatch"
    LOOKUP_TRUNCATED = "lookup-truncated"
    VERIFICATION_LINK_MISSING = "verification-link-missing"
    UNKNOWN = "unknown"


OUTBOX_LOOKUP_DIAGNOSTIC_REASONS = {
    OutboxRecipientLookupStatus.MESSAGE_NOT_ENQUEUED: (
        SyntheticVerificationDiagnosticReason.MESSAGE_NOT_ENQUEUED
    ),
    OutboxRecipientLookupStatus.MESSAGE_PENDING_DELIVERY: (
        SyntheticVerificationDiagnosticReason.MESSAGE_PENDING_DELIVERY
    ),
    OutboxRecipientLookupStatus.MESSAGE_PROCESSING: (
        SyntheticVerificationDiagnosticReason.MESSAGE_PROCESSING
    ),
    OutboxRecipientLookupStatus.MESSAGE_LEASE_EXPIRED: (
        SyntheticVerificationDiagnosticReason.MESSAGE_LEASE_EXPIRED
    ),
    OutboxRecipientLookupStatus.MESSAGE_RETRYING: (
        SyntheticVerificationDiagnosticReason.MESSAGE_RETRYING
    ),
    OutboxRecipientLookupStatus.MESSAGE_DEAD_LETTERED: (
        SyntheticVerificationDiagnosticReason.MESSAGE_DEAD_LETTERED
    ),
    OutboxRecipientLookupStatus.PAYLOAD_INVALID: (
        SyntheticVerificationDiagnosticReason.PAYLOAD_INVALID
    ),
    OutboxRecipientLookupStatus.RECIPIENT_MISMATCH: (
        SyntheticVerificationDiagnosticReason.RECIPIENT_MISMATCH
    ),
    OutboxRecipientLookupStatus.LOOKUP_TRUNCATED: (
        SyntheticVerificationDiagnosticReason.LOOKUP_TRUNCATED
    ),
}


@dataclass(frozen=True)
class RegistrationValidationError(Exception):
    invalid_params: list[dict[str, str]]
    problem_code: str = "registration_invalid"
    title: str = "Registration failed"

    def __post_init__(self) -> None:
        Exception.__init__(self, self.problem_code)


@dataclass(frozen=True)
class VerificationActivationError(Exception):
    problem_code: str = "verification_link_invalid"
    title: str = "Verification failed"

    def __post_init__(self) -> None:
        Exception.__init__(self, self.problem_code)


@dataclass(frozen=True)
class VerificationLinkLookupError(Exception):
    problem_code: str = "verification_link_unavailable"
    title: str = "Verification link unavailable"
    diagnostic_reason: SyntheticVerificationDiagnosticReason = (
        SyntheticVerificationDiagnosticReason.UNKNOWN
    )

    def __post_init__(self) -> None:
        Exception.__init__(self, self.problem_code)


@dataclass(frozen=True)
class SyntheticJourneyScope:
    email: str
    issued_at: datetime


@dataclass(frozen=True)
class SyntheticJourneyScopeError(Exception):
    problem_code: str = "synthetic_journey_unavailable"
    diagnostic_reason: SyntheticVerificationDiagnosticReason = (
        SyntheticVerificationDiagnosticReason.SCOPE_INVALID
    )

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
                    apply_tenant_context(
                        TenantContext(
                            organization_id=organization.id,
                            membership_id=membership.id,
                            user_id=user.id,
                        )
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


def verify_initial_registration(*, token: str) -> dict[str, str]:
    verification_id = _verification_id_from_token(token)
    activated_at = django_timezone.now()

    with transaction.atomic():
        with registration_verification_bootstrap_context(verification_id=verification_id):
            verification = RegistrationVerification.objects.filter(id=verification_id).first()
        if verification is None:
            raise VerificationActivationError()

        apply_tenant_context(
            TenantContext(
                organization_id=verification.organization_id,
                membership_id=verification.membership_id,
                user_id=verification.user_id,
            )
        )
        verification = (
            RegistrationVerification.objects.select_for_update(of=("self",))
            .select_related("organization", "membership", "user")
            .filter(id=verification_id)
            .first()
        )
        if verification is None:
            raise VerificationActivationError()

        membership = (
            Membership.objects.select_for_update(of=("self",))
            .select_related("organization", "user")
            .filter(id=verification.membership_id)
            .first()
        )
        if membership is None:
            raise VerificationActivationError()

        organization = Organization.objects.select_for_update().filter(
            id=verification.organization_id
        ).first()
        user = MoviqoUser.objects.select_for_update().filter(id=verification.user_id).first()
        if organization is None or user is None:
            raise VerificationActivationError()

        if not _verification_rows_match(
            verification=verification,
            membership=membership,
            organization=organization,
            user=user,
        ):
            raise VerificationActivationError()

        if verification.consumed_at is not None or verification.expires_at <= activated_at:
            raise VerificationActivationError()

        if _has_newer_unconsumed_verification(
            verification=verification,
            activated_at=activated_at,
        ):
            raise VerificationActivationError()

        if not _pending_activation_state_is_valid(
            membership=membership,
            organization=organization,
            user=user,
        ):
            raise VerificationActivationError()

        if _active_organization_count() >= settings.MOVIQO_ACTIVE_ORGANIZATION_CAPACITY:
            raise VerificationActivationError()

        verification.consumed_at = activated_at
        verification.save(update_fields=["consumed_at"])

        user.is_active = True
        user.save(update_fields=["is_active"])

        organization.is_active = True
        organization.registration_state = RegistrationWorkflowState.ACTIVE
        organization.save(update_fields=["is_active", "registration_state", "updated_at"])

        membership.is_active = True
        membership.registration_state = RegistrationWorkflowState.ACTIVE
        membership.save(update_fields=["is_active", "registration_state", "updated_at"])

        append_transactional_audit(
            organization_id=organization.id,
            command_type="organizations.registration.verify-email",
            event_type="organizations.registration.activated",
            actor_membership_id=membership.id,
            actor_user_id=user.id,
            payload={"outcome": "activated"},
        )

    return {
        "status": "activated",
        "email": user.normalized_email,
        "language": user.preferred_language,
        "nextStep": "sign_in",
    }


def create_synthetic_journey_scope(*, email: str) -> dict[str, str]:
    normalized_email = normalize_identity_email(email)
    if (
        not normalized_email.endswith(SYNTHETIC_EMAIL_SUFFIX)
        or MoviqoUser.objects.filter(normalized_email=normalized_email).exists()
    ):
        raise SyntheticJourneyScopeError()

    issued_at = django_timezone.now()
    run_token = signing.dumps(
        {
            "email": normalized_email,
            "issuedAt": int(issued_at.timestamp()),
            "nonce": secrets.token_urlsafe(24),
        },
        salt=SYNTHETIC_JOURNEY_SALT,
        compress=True,
    )
    return {"email": normalized_email, "runToken": run_token}


def read_latest_verification_link_for_run(*, run_token: str) -> dict[str, str]:
    scope = _read_synthetic_journey_scope(run_token)
    membership = _synthetic_scope_membership(scope)
    with tenant_background_atomic_context(organization_id=membership.organization_id):
        lookup = read_latest_outbox_message_payload_for_recipient(
            organization_id=membership.organization_id,
            message_type="email.registration_verification",
            recipient_email=scope.email,
            created_at_or_after=scope.issued_at,
        )
    payload = lookup.payload
    if payload is not None:
        text = str(payload.get("text", ""))
        match = VERIFICATION_LINK_PATTERN.search(text)
        if match:
            return {
                "email": scope.email,
                "verificationUrl": match.group(0),
            }

        raise VerificationLinkLookupError(
            diagnostic_reason=SyntheticVerificationDiagnosticReason.VERIFICATION_LINK_MISSING
        )

    diagnostic_reason = OUTBOX_LOOKUP_DIAGNOSTIC_REASONS.get(
        lookup.status,
        SyntheticVerificationDiagnosticReason.UNKNOWN,
    )
    raise VerificationLinkLookupError(diagnostic_reason=diagnostic_reason)


def rotate_synthetic_journey(*, run_token: str) -> dict[str, str]:
    scope = _read_synthetic_journey_scope(run_token)
    membership = _synthetic_scope_membership(scope)
    organization_id = membership.organization_id
    with tenant_background_atomic_context(organization_id=organization_id):
        Membership.objects.filter(id=membership.id).update(
            is_active=False,
            registration_state=RegistrationWorkflowState.RETIRED,
        )
        Organization.objects.filter(id=organization_id).update(
            is_active=False,
            registration_state=RegistrationWorkflowState.RETIRED,
        )
        MoviqoUser.objects.filter(id=membership.user_id).update(is_active=False)
    return {
        "status": "rotated",
        "organizationRef": str(organization_id)[:8],
    }


def _read_synthetic_journey_scope(run_token: str) -> SyntheticJourneyScope:
    try:
        payload = signing.loads(
            run_token,
            salt=SYNTHETIC_JOURNEY_SALT,
            max_age=SYNTHETIC_JOURNEY_MAX_AGE,
        )
        email = normalize_identity_email(str(payload["email"]))
        issued_at = datetime.fromtimestamp(int(payload["issuedAt"]), tz=UTC)
    except (BadSignature, KeyError, SignatureExpired, TypeError, ValueError) as exc:
        raise SyntheticJourneyScopeError() from exc
    if not email.endswith(SYNTHETIC_EMAIL_SUFFIX):
        raise SyntheticJourneyScopeError()
    return SyntheticJourneyScope(email=email, issued_at=issued_at)


def _synthetic_scope_membership(scope: SyntheticJourneyScope) -> Membership:
    user = MoviqoUser.objects.filter(
        normalized_email=scope.email,
        date_joined__gte=scope.issued_at,
    ).first()
    if user is None:
        raise SyntheticJourneyScopeError(
            diagnostic_reason=SyntheticVerificationDiagnosticReason.USER_MISSING
        )
    with tenant_bootstrap_context(user_id=user.id):
        membership_reference = (
            Membership.objects.filter(user_id=user.id)
            .values_list("id", "organization_id")
            .first()
        )
    if membership_reference is None:
        raise SyntheticJourneyScopeError(
            diagnostic_reason=SyntheticVerificationDiagnosticReason.MEMBERSHIP_MISSING
        )

    membership_id, organization_id = membership_reference
    with tenant_background_atomic_context(organization_id=organization_id):
        membership = (
            Membership.objects.select_related("organization", "user")
            .filter(
                id=membership_id,
                user_id=user.id,
                registration_state__in=(
                    RegistrationWorkflowState.PENDING,
                    RegistrationWorkflowState.ACTIVE,
                ),
                organization__created_at__gte=scope.issued_at,
                organization__registration_state__in=(
                    RegistrationWorkflowState.PENDING,
                    RegistrationWorkflowState.ACTIVE,
                ),
            )
            .first()
        )
    if membership is None:
        raise SyntheticJourneyScopeError(
            diagnostic_reason=SyntheticVerificationDiagnosticReason.MEMBERSHIP_MISSING
        )
    return membership


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


def _verification_id_from_token(token: str) -> uuid.UUID:
    try:
        unsigned = signing.TimestampSigner(salt=VERIFICATION_SALT).unsign(
            token,
            max_age=timedelta(hours=24),
        )
    except (BadSignature, SignatureExpired) as exc:
        raise VerificationActivationError() from exc

    try:
        return uuid.UUID(unsigned)
    except ValueError as exc:
        raise VerificationActivationError() from exc


def _verification_rows_match(
    *,
    verification: RegistrationVerification,
    membership: Membership,
    organization: Organization,
    user: MoviqoUser,
) -> bool:
    return (
        membership.organization_id == organization.id
        and membership.user_id == user.id
        and verification.organization_id == organization.id
        and verification.membership_id == membership.id
        and verification.user_id == user.id
    )


def _has_newer_unconsumed_verification(
    *,
    verification: RegistrationVerification,
    activated_at,
) -> bool:
    return RegistrationVerification.objects.filter(
        user_id=verification.user_id,
        created_at__gt=verification.created_at,
        consumed_at__isnull=True,
        expires_at__gt=activated_at,
    ).exists()


def _pending_activation_state_is_valid(
    *,
    membership: Membership,
    organization: Organization,
    user: MoviqoUser,
) -> bool:
    return (
        not user.is_active
        and not membership.is_active
        and not organization.is_active
        and membership.registration_state == RegistrationWorkflowState.PENDING
        and organization.registration_state == RegistrationWorkflowState.PENDING
    )


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
