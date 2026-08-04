from __future__ import annotations

import pytest
from django.test import Client

from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


@pytest.mark.django_db
def test_protected_membership_endpoint_hides_cross_tenant_resources(django_user_model) -> None:
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

    response = client.get(
        f"/api/v1/organizations/protected-memberships/{membership_b.id}/",
        HTTP_X_MOVIQO_ORGANIZATION_ID=str(organization_a.id),
    )

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"

    ok_response = client.get(
        f"/api/v1/organizations/protected-memberships/{membership_a.id}/",
        HTTP_X_MOVIQO_ORGANIZATION_ID=str(organization_a.id),
    )
    assert ok_response.status_code == 200
    assert ok_response.json()["organizationId"] == str(organization_a.id)


@pytest.mark.django_db
def test_protected_membership_endpoint_rejects_ambiguous_membership_selection(
    django_user_model,
) -> None:
    user = django_user_model.objects.create_user(username="multi-org-user", password="test")
    organization_a = Organization.objects.create(slug="org-a", display_name="Org A")
    organization_b = Organization.objects.create(slug="org-b", display_name="Org B")
    membership_a = Membership.objects.create(
        organization=organization_a,
        user=user,
        role=MembershipRole.OWNER,
    )
    Membership.objects.create(
        organization=organization_b,
        user=user,
        role=MembershipRole.ADMINISTRATOR,
    )

    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/organizations/protected-memberships/{membership_a.id}/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"
