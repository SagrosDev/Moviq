from __future__ import annotations

import pytest
from django.test import Client

from moviqo.modules.organizations.application.identity_boundary import (
    IdentityBoundaryViolation,
    ensure_identity_membership,
)
from moviqo.modules.organizations.application import tenant_access
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
    )

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"
    assert str(membership_b.id) not in response.content.decode("utf-8")
    assert str(organization_b.id) not in response.content.decode("utf-8")

    ok_response = client.get(
        f"/api/v1/organizations/protected-memberships/{membership_a.id}/",
    )
    assert ok_response.status_code == 200
    assert ok_response.json()["organizationId"] == str(organization_a.id)


@pytest.mark.django_db
def test_protected_membership_endpoint_fails_closed_for_unsupported_multi_membership_state(
    django_user_model, monkeypatch
) -> None:
    user = django_user_model.objects.create_user(username="single-org-user", password="test")
    organization_a = Organization.objects.create(slug="org-a", display_name="Org A")
    membership_a = Membership.objects.create(
        organization=organization_a,
        user=user,
        role=MembershipRole.OWNER,
    )

    class FakeMembershipQuerySet:
        def order_by(self, *_args):
            return self

        def values_list(self, *_args):
            return [
                (membership_a.id, organization_a.id),
                (membership_a.id, organization_a.id),
            ]

    monkeypatch.setattr(
        tenant_access.Membership.objects,
        "filter",
        lambda **_kwargs: FakeMembershipQuerySet(),
    )

    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/organizations/protected-memberships/{membership_a.id}/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"


@pytest.mark.django_db
def test_identity_boundary_rejects_duplicate_email_for_another_organization(
    django_user_model,
) -> None:
    existing_organization = Organization.objects.create(
        slug="existing-org",
        display_name="Existing Org",
    )
    other_organization = Organization.objects.create(
        slug="other-org",
        display_name="Other Org",
    )
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="Owner@Example.com",
    )
    Membership.objects.create(
        organization=existing_organization,
        user=user,
        role=MembershipRole.OWNER,
    )

    with pytest.raises(IdentityBoundaryViolation):
        ensure_identity_membership(
            organization=other_organization,
            email=" owner@example.com ",
            username="owner-b",
            role=MembershipRole.ADMINISTRATOR,
        )
