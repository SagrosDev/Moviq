import pytest
from django.test import Client

from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


@pytest.fixture
def active_identity(django_user_model):
    user = django_user_model.objects.create_user(
        username="generated-user",
        email="ana@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Ana",
    )
    organization = Organization.objects.create(slug="ana-org", display_name="Ana Org")
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )
    return user, membership


@pytest.mark.django_db
def test_sign_in_returns_safe_context_and_rotates_session(active_identity):
    client = Client(enforce_csrf_checks=True)
    client.get("/api/v1/auth/csrf/")
    csrf = client.cookies["csrftoken"].value
    response = client.post(
        "/api/v1/auth/sign-in/",
        {"email": "ana@example.com", "password": "a-secure-password-123"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    assert response.status_code == 200
    assert response.json()["membership"]["role"] == "owner"
    assert "password" not in response.json()
    assert client.session.get("_auth_user_id") == str(active_identity[0].id)


@pytest.mark.django_db
def test_sign_in_is_generic_and_csrf_protected(active_identity):
    client = Client(enforce_csrf_checks=True)
    response = client.post(
        "/api/v1/auth/sign-in/",
        {"email": "unknown@example.com", "password": "wrong"},
        content_type="application/json",
    )
    assert response.status_code == 403
    client.get("/api/v1/auth/csrf/")
    response = client.post(
        "/api/v1/auth/sign-in/",
        {"email": "unknown@example.com", "password": "wrong"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=client.cookies["csrftoken"].value,
    )
    assert response.status_code == 401
    assert response.json()["code"] == "authentication_failed"


@pytest.mark.django_db
def test_sign_out_invalidates_current_session(active_identity):
    csrf_client = Client(enforce_csrf_checks=True)
    csrf_client.force_login(active_identity[0])
    csrf_client.get("/api/v1/auth/csrf/")
    response = csrf_client.post(
        "/api/v1/auth/sign-out/",
        HTTP_X_CSRFTOKEN=csrf_client.cookies["csrftoken"].value,
    )
    assert response.status_code == 204
    assert csrf_client.get("/api/v1/auth/session/").status_code in {403, 404}
