import pytest
from django.test import Client

from moviqo.building_blocks.secure_payloads import decrypt_secret_payload
from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    PasswordRecoveryToken,
)


@pytest.fixture
def active_identity(django_user_model):
    user = django_user_model.objects.create_user(
        username="recovery-user",
        email="ana@example.com",
        password="old-password-that-is-long-enough",
        is_active=True,
    )
    organization = Organization.objects.create(slug="recovery-org", display_name="Recovery Org")
    Membership.objects.create(organization=organization, user=user, role=MembershipRole.OWNER)
    return user


def _csrf(client: Client) -> str:
    client.get("/api/v1/auth/csrf/")
    return client.cookies["csrftoken"].value


@pytest.mark.django_db
def test_recovery_request_is_generic_and_unknown_accounts_create_no_token(active_identity):
    client = Client(enforce_csrf_checks=True)
    csrf = _csrf(client)
    existing = client.post(
        "/api/v1/auth/password-recovery/",
        {"email": "ana@example.com"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    unknown = client.post(
        "/api/v1/auth/password-recovery/",
        {"email": "unknown@example.com"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    assert existing.status_code == unknown.status_code == 200
    assert existing.json() == unknown.json() == {"status": "recovery_requested"}
    assert PasswordRecoveryToken.objects.count() == 1
    assert OutboxMessage.objects.count() == 1


@pytest.mark.django_db
def test_reset_consumes_digest_only_token_and_revokes_sessions(active_identity):
    client = Client(enforce_csrf_checks=True)
    client.force_login(active_identity)
    csrf = _csrf(client)
    client.post(
        "/api/v1/auth/password-recovery/",
        {"email": "ana@example.com"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    envelope = OutboxMessage.objects.get().payload["recoveryEnvelope"]
    raw_token = decrypt_secret_payload(envelope)["token"]
    stored_payload = str(OutboxMessage.objects.get().payload)
    assert raw_token not in stored_payload
    assert raw_token not in PasswordRecoveryToken.objects.get().token_digest

    response = client.post(
        "/api/v1/auth/password-reset/",
        {"token": raw_token, "password": "new-password-that-is-long-enough"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    assert response.status_code == 200
    assert client.get("/api/v1/auth/session/").status_code in {403, 404}
    assert PasswordRecoveryToken.objects.get().consumed_at is not None
    assert active_identity.refresh_from_db() is None
    active_identity.refresh_from_db()
    assert active_identity.check_password("new-password-that-is-long-enough")


@pytest.mark.django_db
def test_invalid_reset_password_does_not_consume_token(active_identity):
    client = Client()
    csrf = _csrf(client)
    client.post(
        "/api/v1/auth/password-recovery/",
        {"email": "ana@example.com"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    raw_token = decrypt_secret_payload(
        OutboxMessage.objects.get().payload["recoveryEnvelope"]
    )["token"]
    response = client.post(
        "/api/v1/auth/password-reset/",
        {"token": raw_token, "password": "short"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf,
    )
    assert response.status_code == 400
    assert response.json()["code"] == "password_invalid"
    assert PasswordRecoveryToken.objects.get().consumed_at is None
