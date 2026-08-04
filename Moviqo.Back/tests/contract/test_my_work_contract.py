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
    other_user = user.__class__.objects.create_user(
        username="my-work-other-owner",
        email="other-owner@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Owner",
    )
    other_organization = Organization.objects.create(
        slug="my-work-other-org",
        display_name="Other Org",
    )
    other_membership = Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=MembershipRole.OWNER,
    )
    client = Client()
    client.force_login(user)

    response = client.get(
        (
            f"/api/v1/my-work/?organizationId={other_organization.id}"
            f"&membershipId={other_membership.id}"
        )
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
    assert str(organization.id) not in str(payload)
    assert str(membership.id) not in str(payload)
    assert str(other_organization.id) not in str(payload)
    assert str(other_membership.id) not in str(payload)


@pytest.mark.django_db
def test_my_work_dashboard_rejects_anonymous_requests() -> None:
    response = Client().get("/api/v1/my-work/")

    assert response.status_code == 403
    assert response.json()["code"] == "not_authenticated"


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


@pytest.mark.django_db
def test_my_work_dashboard_hides_inactive_organization_membership(active_member) -> None:
    user, organization, _membership = active_member
    organization.is_active = False
    organization.save(update_fields=["is_active"])
    client = Client()
    client.force_login(user)

    response = client.get("/api/v1/my-work/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"
