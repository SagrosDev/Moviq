from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass

import pytest
from django.conf import settings
from django.db import DatabaseError, connection, transaction
from django.test import Client
from django.utils import timezone

from moviqo.building_blocks.api.logging import (
    RedactDiagnosticLogFilter,
    RedactUuidRequestLogFilter,
)
from moviqo.building_blocks.tenancy import (
    PROTECTED_TENANT_RESOURCES,
    TENANT_SETTING_NAME,
    runtime_role_name,
)
from moviqo.building_blocks.tenancy.runtime import TenantContext, tenant_atomic_context
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    OrganizationRegistrationConsent,
    RegistrationVerification,
)
from moviqo.modules.workflow_runtime.models import AtomicCommandProbe


class ListHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(record.getMessage())


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip(
            "Tenant isolation integration coverage requires PostgreSQL integration settings."
        )


@dataclass(frozen=True)
class IsolationSeed:
    user_a: object
    user_b: object
    organization_a: Organization
    organization_b: Organization
    membership_a: Membership
    membership_b: Membership


def _seed_isolation_fixture(django_user_model) -> IsolationSeed:
    user_a = django_user_model.objects.create_user(username="owner-a")
    user_b = django_user_model.objects.create_user(username="owner-b")
    organization_a = Organization.objects.create(
        slug="alpha-shared",
        display_name="Shared Organization",
    )
    organization_b = Organization.objects.create(
        slug="bravo-shared",
        display_name="Shared Organization",
    )
    membership_a = Membership.objects.create(
        organization=organization_a,
        user=user_a,
        role=MembershipRole.OWNER,
    )
    membership_b = Membership.objects.create(
        organization=organization_b,
        user=user_b,
        role=MembershipRole.OWNER,
    )
    return IsolationSeed(
        user_a=user_a,
        user_b=user_b,
        organization_a=organization_a,
        organization_b=organization_b,
        membership_a=membership_a,
        membership_b=membership_b,
    )


def _assert_organization_isolation(seed: IsolationSeed) -> None:
    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert Organization.objects.count() == 1
        assert list(Organization.objects.values_list("slug", flat=True)) == ["alpha-shared"]
        assert Organization.objects.filter(display_name="Shared Organization").count() == 1
        assert (
            Organization.objects.get(id=seed.organization_a.id).display_name
            == "Shared Organization"
        )
        assert not Organization.objects.filter(id=seed.organization_b.id).exists()

        updated = Organization.objects.filter(id=seed.organization_b.id).update(
            slug="cross-tenant-update",
        )
        assert updated == 0

    seed.organization_b.refresh_from_db()
    assert seed.organization_b.slug == "bravo-shared"


def _assert_membership_isolation(seed: IsolationSeed) -> None:
    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert Membership.objects.count() == 1
        assert list(
            Membership.objects.select_related("organization").values_list(
                "organization__display_name",
                flat=True,
            )
        ) == ["Shared Organization"]
        assert Membership.objects.filter(user__username__icontains="owner").count() == 1
        assert not Membership.objects.filter(id=seed.membership_b.id).exists()

        with pytest.raises(DatabaseError) as exc_info:
            with transaction.atomic():
                Membership.objects.create(
                    organization=seed.organization_b,
                    user=seed.user_a,
                    role=MembershipRole.MEMBER,
                )
        assert str(seed.organization_b.id) not in str(exc_info.value)
        assert "count" not in str(exc_info.value).lower()

        updated = Membership.objects.filter(id=seed.membership_b.id).update(
            role=MembershipRole.ADMINISTRATOR,
        )
        assert updated == 0

    seed.membership_b.refresh_from_db()
    assert seed.membership_b.role == MembershipRole.OWNER


def _assert_registration_consent_isolation(seed: IsolationSeed) -> None:
    OrganizationRegistrationConsent.objects.create(
        organization=seed.organization_a,
        user=seed.user_a,
        terms_version="beta-2026-08-04",
        privacy_version="privacy-2026-08-04",
        prohibited_data_acknowledged=True,
        accepted_at=timezone.now(),
    )
    row_b = OrganizationRegistrationConsent.objects.create(
        organization=seed.organization_b,
        user=seed.user_b,
        terms_version="beta-2026-08-04",
        privacy_version="privacy-2026-08-04",
        prohibited_data_acknowledged=True,
        accepted_at=timezone.now(),
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert OrganizationRegistrationConsent.objects.count() == 1
        assert not OrganizationRegistrationConsent.objects.filter(id=row_b.id).exists()
        updated = OrganizationRegistrationConsent.objects.filter(id=row_b.id).update(
            privacy_version="cross-tenant"
        )
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.privacy_version == "privacy-2026-08-04"


def _assert_registration_verification_isolation(seed: IsolationSeed) -> None:
    row_a_membership = Membership.objects.get(id=seed.membership_a.id)
    row_b_membership = Membership.objects.get(id=seed.membership_b.id)
    RegistrationVerification.objects.create(
        organization=seed.organization_a,
        user=seed.user_a,
        membership=row_a_membership,
        expires_at=timezone.now(),
    )
    row_b = RegistrationVerification.objects.create(
        organization=seed.organization_b,
        user=seed.user_b,
        membership=row_b_membership,
        expires_at=timezone.now(),
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert RegistrationVerification.objects.count() == 1
        assert not RegistrationVerification.objects.filter(id=row_b.id).exists()
        updated = RegistrationVerification.objects.filter(id=row_b.id).update(
            consumed_at=timezone.now()
        )
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.consumed_at is None


def _assert_command_result_isolation(seed: IsolationSeed) -> None:
    CommandResult.objects.create(
        organization=seed.organization_a,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="alpha",
        request_hash="hash-alpha",
        result_payload={"reference": "alpha"},
    )
    row_b = CommandResult.objects.create(
        organization=seed.organization_b,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="bravo",
        request_hash="hash-bravo",
        result_payload={"reference": "bravo"},
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert CommandResult.objects.count() == 1
        assert not CommandResult.objects.filter(id=row_b.id).exists()
        updated = CommandResult.objects.filter(id=row_b.id).update(request_hash="cross-tenant")
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.request_hash == "hash-bravo"


def _assert_transactional_audit_record_isolation(seed: IsolationSeed) -> None:
    TransactionalAuditRecord.objects.create(
        organization=seed.organization_a,
        command_type="workflow-runtime.probe.execute",
        event_type="alpha",
        payload={"reference": "alpha"},
    )
    row_b = TransactionalAuditRecord.objects.create(
        organization=seed.organization_b,
        command_type="workflow-runtime.probe.execute",
        event_type="bravo",
        payload={"reference": "bravo"},
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert TransactionalAuditRecord.objects.count() == 1
        assert not TransactionalAuditRecord.objects.filter(id=row_b.id).exists()
        updated = TransactionalAuditRecord.objects.filter(id=row_b.id).update(
            event_type="cross-tenant"
        )
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.event_type == "bravo"


def _assert_outbox_message_isolation(seed: IsolationSeed) -> None:
    OutboxMessage.objects.create(
        organization=seed.organization_a,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    row_b = OutboxMessage.objects.create(
        organization=seed.organization_b,
        message_type="email.probe.created",
        payload={"reference": "bravo"},
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert OutboxMessage.objects.count() == 1
        assert not OutboxMessage.objects.filter(id=row_b.id).exists()
        updated = OutboxMessage.objects.filter(id=row_b.id).update(
            dead_letter_reason="cross-tenant"
        )
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.dead_letter_reason == ""


def _assert_atomic_command_probe_isolation(seed: IsolationSeed) -> None:
    AtomicCommandProbe.objects.create(
        organization=seed.organization_a,
        reference="alpha",
        payload={"reference": "alpha"},
    )
    row_b = AtomicCommandProbe.objects.create(
        organization=seed.organization_b,
        reference="bravo",
        payload={"reference": "bravo"},
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=seed.organization_a.id,
            membership_id=seed.membership_a.id,
            user_id=seed.user_a.id,
        )
    ):
        assert AtomicCommandProbe.objects.count() == 1
        assert not AtomicCommandProbe.objects.filter(id=row_b.id).exists()
        updated = AtomicCommandProbe.objects.filter(id=row_b.id).update(reference="cross-tenant")
        assert updated == 0

    row_b.refresh_from_db()
    assert row_b.reference == "bravo"


def _assertion_for_registration(
    registration,
) -> Callable[[IsolationSeed], None]:
    assertion = globals().get(f"_assert_{registration.isolation_test_id}_isolation")
    if callable(assertion):
        return assertion

    pytest.fail(
        "Missing tenant isolation assertion "
        f"for resource '{registration.resource_name}'. "
        f"Add _assert_{registration.isolation_test_id}_isolation and keep "
        f"{registration.evidence_hint} aligned with the registration."
    )


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    "registration",
    [
        pytest.param(
            registration,
            id=registration.resource_name,
        )
        for registration in PROTECTED_TENANT_RESOURCES
    ],
)
def test_registered_resource_classes_enforce_tenant_isolation(
    django_user_model,
    registration,
) -> None:
    _integration_only()
    seed = _seed_isolation_fixture(django_user_model)

    _assertion_for_registration(registration)(seed)

@pytest.mark.django_db(transaction=True)
def test_tenant_context_is_transaction_local_and_does_not_bleed_across_connection_reuse(
    django_user_model,
) -> None:
    _integration_only()
    user_a = django_user_model.objects.create_user(username="owner-a")
    user_b = django_user_model.objects.create_user(username="owner-b")
    organization_a = Organization.objects.create(slug="alpha", display_name="Alpha")
    organization_b = Organization.objects.create(slug="bravo", display_name="Bravo")
    membership_a = Membership.objects.create(
        organization=organization_a,
        user=user_a,
        role=MembershipRole.OWNER,
    )
    membership_b = Membership.objects.create(
        organization=organization_b,
        user=user_b,
        role=MembershipRole.OWNER,
    )

    with tenant_atomic_context(
        TenantContext(
            organization_id=organization_a.id,
            membership_id=membership_a.id,
            user_id=user_a.id,
        )
    ):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT current_setting(%s, true), current_role",
                [TENANT_SETTING_NAME],
            )
            tenant_setting, current_role = cursor.fetchone()
        assert tenant_setting == str(organization_a.id)
        assert current_role == runtime_role_name()
        assert Membership.objects.count() == 1

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT current_setting(%s, true), current_role, current_user",
            [TENANT_SETTING_NAME],
        )
        tenant_setting, current_role, current_user = cursor.fetchone()
    assert tenant_setting in (None, "")
    if current_user == runtime_role_name():
        assert current_role == runtime_role_name()
    else:
        assert current_role != runtime_role_name()

    with tenant_atomic_context(
        TenantContext(
            organization_id=organization_b.id,
            membership_id=membership_b.id,
            user_id=user_b.id,
        )
    ):
        assert list(Organization.objects.values_list("slug", flat=True)) == ["bravo"]


@pytest.mark.django_db(transaction=True)
def test_protected_membership_endpoint_bootstraps_tenant_context_under_rls(
    django_user_model,
) -> None:
    _integration_only()
    user = django_user_model.objects.create_user(username="owner-a", password="test")
    other_user = django_user_model.objects.create_user(username="owner-b", password="test")
    organization_a = Organization.objects.create(slug="org-a", display_name="Org A")
    organization_b = Organization.objects.create(slug="org-b", display_name="Org B")
    membership_a = Membership.objects.create(
        organization=organization_a,
        user=user,
        role=MembershipRole.OWNER,
    )
    membership_b = Membership.objects.create(
        organization=organization_b,
        user=other_user,
        role=MembershipRole.OWNER,
    )

    client = Client()
    client.force_login(user)
    logger = logging.getLogger("django.request")
    assert any(
        isinstance(log_filter, RedactDiagnosticLogFilter | RedactUuidRequestLogFilter)
        for handler in logger.handlers
        for log_filter in handler.filters
    )
    log_capture = ListHandler()
    logger.addHandler(log_capture)

    try:
        ok_response = client.get(
            f"/api/v1/organizations/protected-memberships/{membership_a.id}/",
        )
        assert ok_response.status_code == 200
        assert ok_response.json()["organizationId"] == str(organization_a.id)

        hidden_response = client.get(
            f"/api/v1/organizations/protected-memberships/{membership_b.id}/",
        )
        assert hidden_response.status_code == 404
        assert hidden_response.json()["code"] == "resource_not_found"
        hidden_payload = hidden_response.content.decode("utf-8")
        assert str(membership_b.id) not in hidden_payload
        assert str(organization_b.id) not in hidden_payload
        assert "count" not in hidden_payload.lower()

        hidden_messages = [
            message
            for message in log_capture.messages
            if "Protected membership resource hidden for current tenant" in message
        ]
        assert hidden_messages
        assert all(str(membership_b.id) not in message for message in hidden_messages)
        assert all(str(organization_b.id) not in message for message in hidden_messages)
        assert all("[redacted-uuid]" in message for message in hidden_messages)
    finally:
        logger.removeHandler(log_capture)
