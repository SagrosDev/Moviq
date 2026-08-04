import pytest
from django.test import Client

from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


@pytest.fixture
def active_member(django_user_model):
    user = django_user_model.objects.create_user(
        username="my-work-owner",
        email="owner@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Owner",
    )
    organization = Organization.objects.create(slug="my-work-org", display_name="My Work Org")
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )
    return user, organization, membership


@pytest.mark.django_db
def test_my_work_dashboard_returns_tenant_scoped_empty_contract(active_member) -> None:
    user, organization, membership = active_member
    client = Client()
    client.force_login(user)

    response = client.get(
        f"/api/v1/my-work/?organizationId={organization.id}&membershipId={membership.id}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "startWorkflows": {"items": [], "limit": 6, "hasMore": False},
        "myTasks": {"items": [], "limit": 12, "hasMore": False},
        "myProcesses": {"items": [], "limit": 12, "hasMore": False},
    }
    assert "organizationId" not in str(payload)
    assert "membershipId" not in str(payload)


@pytest.mark.django_db
def test_my_work_dashboard_rejects_anonymous_requests() -> None:
    response = Client().get("/api/v1/my-work/")

    assert response.status_code in {401, 403}


@pytest.mark.django_db
def test_my_work_dashboard_fails_closed_for_pending_membership(django_user_model) -> None:
    user = django_user_model.objects.create_user(
        username="pending-member",
        email="pending@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    organization = Organization.objects.create(
        slug="pending-org",
        display_name="Pending Org",
        registration_state="pending",
    )
    Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
        is_active=False,
        registration_state="pending",
    )
    client = Client()
    client.force_login(user)

    response = client.get("/api/v1/my-work/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"
