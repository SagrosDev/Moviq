from __future__ import annotations

import pytest
from django.conf import settings
from django.db import DatabaseError, connection

from moviqo.building_blocks.tenancy import TENANT_SETTING_NAME, runtime_role_name
from moviqo.building_blocks.tenancy.runtime import TenantContext, tenant_atomic_context
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip(
            "Tenant isolation integration coverage requires PostgreSQL integration settings."
        )


@pytest.mark.django_db(transaction=True)
def test_tenant_context_scopes_reads_counts_searches_and_joins(django_user_model) -> None:
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
    Membership.objects.create(
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
        assert Organization.objects.count() == 1
        assert Membership.objects.count() == 1
        assert list(Organization.objects.values_list("slug", flat=True)) == ["alpha"]
        assert list(
            Membership.objects.select_related("organization").values_list(
                "organization__display_name", flat=True
            )
        ) == ["Alpha"]
        assert Membership.objects.filter(user__username__icontains="owner").count() == 1


@pytest.mark.django_db(transaction=True)
def test_tenant_context_blocks_cross_tenant_writes_and_organization_reassignment(
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

    with pytest.raises(DatabaseError):
        with tenant_atomic_context(
            TenantContext(
                organization_id=organization_a.id,
                membership_id=membership_a.id,
                user_id=user_a.id,
            )
        ):
            Membership.objects.create(
                organization=organization_b,
                user=user_a,
                role=MembershipRole.MEMBER,
            )

    with pytest.raises(DatabaseError):
        with tenant_atomic_context(
            TenantContext(
                organization_id=organization_b.id,
                membership_id=membership_b.id,
                user_id=user_b.id,
            )
        ):
            membership_b.organization = organization_a
            membership_b.save(update_fields=["organization"])


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
