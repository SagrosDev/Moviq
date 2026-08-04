from __future__ import annotations

from datetime import timedelta

import pytest
from django.core import signing
from django.test import override_settings
from django.utils import timezone

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.modules.governance.models import TransactionalAuditRecord
from moviqo.modules.messaging import application as messaging_application
from moviqo.modules.messaging.application import drain_outbox_messages
from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.application.registration import (
    VERIFICATION_SALT,
    RegistrationValidationError,
    VerificationActivationError,
    register_initial_owner,
    verify_initial_registration,
)
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    MoviqoUser,
    Organization,
    OrganizationRegistrationConsent,
    RegistrationVerification,
    RegistrationWorkflowState,
)


def _payload(**overrides):
    payload = {
        "owner_name": "Ana Gomez",
        "organization_name": "Equipo Norte",
        "email": "ana@example.com",
        "password": "frase segura para moviqo 2026",
        "language": "es",
        "region": "CO",
        "timezone": "America/Bogota",
        "currency": "COP",
        "terms_accepted": True,
        "privacy_accepted": True,
        "terms_version": "beta-2026-08-04",
        "privacy_version": "privacy-2026-08-04",
        "prohibited_data_acknowledged": True,
    }
    payload.update(overrides)
    return payload


def _verification_token(verification: RegistrationVerification) -> str:
    return signing.TimestampSigner(salt=VERIFICATION_SALT).sign(str(verification.id))


@pytest.mark.django_db
def test_register_initial_owner_creates_pending_records_and_one_verification_outbox_message(
) -> None:
    result = register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    organization = Organization.objects.get()
    membership = Membership.objects.get()
    user = MoviqoUser.objects.get()
    consent = OrganizationRegistrationConsent.objects.get()
    verification = RegistrationVerification.objects.get()
    outbox_message = OutboxMessage.objects.get()

    assert result == {
        "status": "pending_verification",
        "email": "ana@example.com",
        "language": "es",
    }
    assert organization.display_name == "Equipo Norte"
    assert organization.is_active is False
    assert organization.registration_state == RegistrationWorkflowState.PENDING
    assert organization.preferred_language == "es"
    assert organization.region_code == "CO"
    assert organization.timezone_name == "America/Bogota"
    assert organization.currency_code == "COP"
    assert membership.organization_id == organization.id
    assert membership.user_id == user.id
    assert membership.role == MembershipRole.OWNER
    assert membership.is_active is False
    assert membership.registration_state == RegistrationWorkflowState.PENDING
    assert user.email == "ana@example.com"
    assert user.normalized_email == "ana@example.com"
    assert user.is_active is False
    assert user.display_name == "Ana Gomez"
    assert consent.organization_id == organization.id
    assert consent.user_id == user.id
    assert consent.terms_accepted is True
    assert consent.privacy_accepted is True
    assert consent.terms_version == "beta-2026-08-04"
    assert consent.privacy_version == "privacy-2026-08-04"
    assert consent.prohibited_data_acknowledged is True
    assert verification.organization_id == organization.id
    assert verification.user_id == user.id
    assert verification.membership_id == membership.id
    assert verification.consumed_at is None
    assert verification.expires_at > timezone.now()
    assert verification.expires_at <= timezone.now() + timedelta(hours=25)
    assert outbox_message.organization_id == organization.id
    assert outbox_message.message_type == "email.registration_verification"
    assert outbox_message.payload["to"] == ["ana@example.com"]
    assert outbox_message.payload["subject"] == "Verifica tu correo para entrar a Moviqo"
    assert "token=" in outbox_message.payload["text"]


@pytest.mark.django_db
def test_register_initial_owner_rejects_duplicate_email_without_disclosing_existence() -> None:
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    with pytest.raises(RegistrationValidationError) as exc_info:
        register_initial_owner(
            **_payload(organization_name="Otro equipo"),
            idempotency_key="registration-2",
        )

    assert exc_info.value.problem_code == "registration_invalid"
    assert exc_info.value.invalid_params == [
        {
            "name": "email",
            "code": "email_unavailable",
            "reason": "Registration is unavailable for this email.",
        }
    ]
    assert Organization.objects.count() == 1
    assert Membership.objects.count() == 1
    assert MoviqoUser.objects.count() == 1
    assert OutboxMessage.objects.count() == 1


@pytest.mark.django_db
def test_register_initial_owner_replays_completed_result_for_same_idempotency_key() -> None:
    first = register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    second = register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    assert second == first
    assert Organization.objects.count() == 1
    assert Membership.objects.count() == 1
    assert MoviqoUser.objects.count() == 1
    assert OutboxMessage.objects.count() == 1


@pytest.mark.django_db
def test_register_initial_owner_rejects_same_idempotency_key_for_different_payload() -> None:
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    with pytest.raises(IdempotencyKeyReuseConflict):
        register_initial_owner(
            **_payload(organization_name="Otro equipo"),
            idempotency_key="registration-1",
        )


@pytest.mark.django_db
def test_register_initial_owner_rolls_back_all_rows_when_consent_is_invalid() -> None:
    with pytest.raises(RegistrationValidationError) as exc_info:
        register_initial_owner(
            **_payload(prohibited_data_acknowledged=False),
            idempotency_key="registration-1",
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "prohibitedDataAcknowledged",
            "code": "consent_required",
            "reason": "Complete the required acceptance to continue.",
        }
    ]
    assert Organization.objects.count() == 0
    assert Membership.objects.count() == 0
    assert MoviqoUser.objects.count() == 0
    assert OrganizationRegistrationConsent.objects.count() == 0
    assert RegistrationVerification.objects.count() == 0
    assert OutboxMessage.objects.count() == 0


@pytest.mark.django_db
def test_register_initial_owner_rejects_missing_terms_acceptance() -> None:
    with pytest.raises(RegistrationValidationError) as exc_info:
        register_initial_owner(
            **_payload(terms_accepted=False),
            idempotency_key="registration-1",
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "termsAccepted",
            "code": "consent_required",
            "reason": "Complete the required acceptance to continue.",
        }
    ]


@pytest.mark.django_db
@override_settings(MOVIQO_ACTIVE_ORGANIZATION_CAPACITY=1)
def test_register_initial_owner_rolls_back_when_capacity_is_full() -> None:
    Organization.objects.create(
        slug="active-org",
        display_name="Active Org",
        is_active=True,
        registration_state=RegistrationWorkflowState.ACTIVE,
    )

    with pytest.raises(RegistrationValidationError) as exc_info:
        register_initial_owner(
            **_payload(),
            idempotency_key="registration-1",
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "nonFieldErrors",
            "code": "capacity_full",
            "reason": "Registration is temporarily unavailable.",
        }
    ]
    assert Organization.objects.count() == 1
    assert Membership.objects.count() == 0
    assert MoviqoUser.objects.count() == 0
    assert OutboxMessage.objects.count() == 0


@pytest.mark.django_db
@override_settings(MOVIQO_ACTIVE_ORGANIZATION_CAPACITY=1)
def test_register_initial_owner_counts_pending_organizations_against_capacity() -> None:
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )

    with pytest.raises(RegistrationValidationError) as exc_info:
        register_initial_owner(
            **_payload(email="other@example.com"),
            idempotency_key="registration-2",
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "nonFieldErrors",
            "code": "capacity_full",
            "reason": "Registration is temporarily unavailable.",
        }
    ]


@pytest.mark.django_db
def test_outbox_retry_does_not_create_duplicate_registration_business_rows(monkeypatch) -> None:
    register_initial_owner(
        **_payload(language="en", email="owner@example.com"),
        idempotency_key="registration-1",
    )
    organization_ids = set(Organization.objects.values_list("id", flat=True))
    membership_ids = set(Membership.objects.values_list("id", flat=True))
    user_ids = set(MoviqoUser.objects.values_list("id", flat=True))

    def fail_delivery(_message) -> None:
        raise RuntimeError("delivery failed")

    monkeypatch.setattr(messaging_application, "_deliver_outbox_message", fail_delivery)

    processed = drain_outbox_messages(
        batch_size=1,
        lease_owner="worker-a",
        now=timezone.now(),
        max_attempts=2,
    )

    assert processed == 1
    assert set(Organization.objects.values_list("id", flat=True)) == organization_ids
    assert set(Membership.objects.values_list("id", flat=True)) == membership_ids
    assert set(MoviqoUser.objects.values_list("id", flat=True)) == user_ids
    assert OutboxMessage.objects.count() == 1


@pytest.mark.django_db
def test_verify_initial_registration_activates_pending_rows_and_records_audit() -> None:
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )
    verification = RegistrationVerification.objects.get()

    result = verify_initial_registration(token=_verification_token(verification))

    verification.refresh_from_db()
    membership = Membership.objects.get()
    organization = Organization.objects.get()
    user = MoviqoUser.objects.get()
    audit_record = TransactionalAuditRecord.objects.get(
        event_type="organizations.registration.activated"
    )

    assert result == {
        "status": "activated",
        "email": "ana@example.com",
        "language": "es",
        "nextStep": "sign_in",
    }
    assert verification.consumed_at is not None
    assert user.is_active is True
    assert organization.is_active is True
    assert organization.registration_state == RegistrationWorkflowState.ACTIVE
    assert membership.is_active is True
    assert membership.registration_state == RegistrationWorkflowState.ACTIVE
    assert audit_record.organization_id == organization.id
    assert audit_record.actor_membership_id == membership.id
    assert audit_record.actor_user_id == user.id
    assert audit_record.payload == {"outcome": "activated"}


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("token_factory", "setup_mismatch"),
    [
        pytest.param(
            lambda verification: "not-a-valid-token",
            lambda _verification: None,
            id="malformed",
        ),
        pytest.param(
            _verification_token,
            lambda verification: RegistrationVerification.objects.filter(
                id=verification.id
            ).update(expires_at=timezone.now() - timedelta(minutes=1)),
            id="expired",
        ),
        pytest.param(
            _verification_token,
            lambda verification: RegistrationVerification.objects.filter(
                id=verification.id
            ).update(consumed_at=timezone.now()),
            id="consumed",
        ),
        pytest.param(
            _verification_token,
            lambda verification: RegistrationVerification.objects.create(
                organization=verification.organization,
                user=verification.user,
                membership=verification.membership,
                expires_at=timezone.now() + timedelta(hours=24),
            ),
            id="superseded",
        ),
        pytest.param(
            _verification_token,
            lambda verification: RegistrationVerification.objects.filter(
                id=verification.id
            ).update(
                user=MoviqoUser.objects.create_user(
                    username="mismatch-user",
                    email="different@example.com",
                    is_active=False,
                )
            ),
            id="mismatched",
        ),
    ],
)
def test_verify_initial_registration_rejects_invalid_or_unsafe_tokens_without_state_change(
    token_factory,
    setup_mismatch,
) -> None:
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )
    verification = RegistrationVerification.objects.get()
    membership = Membership.objects.get()
    organization = Organization.objects.get()
    user = MoviqoUser.objects.get()

    setup_mismatch(verification)
    expected_consumed_at = (
        RegistrationVerification.objects.get(id=verification.id).consumed_at
    )
    token = token_factory(verification)

    with pytest.raises(VerificationActivationError) as exc_info:
        verify_initial_registration(token=token)

    verification.refresh_from_db()
    membership.refresh_from_db()
    organization.refresh_from_db()
    user.refresh_from_db()

    assert exc_info.value.problem_code == "verification_link_invalid"
    assert verification.consumed_at == expected_consumed_at
    assert user.is_active is False
    assert organization.is_active is False
    assert organization.registration_state == RegistrationWorkflowState.PENDING
    assert membership.is_active is False
    assert membership.registration_state == RegistrationWorkflowState.PENDING
    assert not TransactionalAuditRecord.objects.filter(
        event_type="organizations.registration.activated"
    ).exists()
