from __future__ import annotations

import json
from datetime import timedelta

import pytest
from django.core import signing
from django.test import Client
from django.utils import timezone

from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.application.registration import VERIFICATION_SALT
from moviqo.modules.organizations.models import (
    MoviqoUser,
    Organization,
    RegistrationVerification,
    RegistrationWorkflowState,
)


def _verification_token(verification: RegistrationVerification) -> str:
    return signing.TimestampSigner(salt=VERIFICATION_SALT).sign(str(verification.id))


def _payload(**overrides):
    payload = {
        "ownerName": "Ana Gomez",
        "organizationName": "Equipo Norte",
        "email": "ana@example.com",
        "password": "frase segura para moviqo 2026",
        "language": "es",
        "region": "CO",
        "timezone": "America/Bogota",
        "currency": "COP",
        "termsAccepted": True,
        "privacyAccepted": True,
        "termsVersion": "beta-2026-08-04",
        "privacyVersion": "privacy-2026-08-04",
        "prohibitedDataAcknowledged": True,
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
def test_registration_endpoint_returns_minimal_pending_verification_response() -> None:
    response = Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload()),
        content_type="application/json",
    )

    assert response.status_code == 201
    assert response.json() == {
        "status": "pending_verification",
        "email": "ana@example.com",
        "language": "es",
    }


@pytest.mark.django_db
def test_registration_endpoint_returns_safe_duplicate_email_problem_details() -> None:
    client = Client()
    client.post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload()),
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY="registration-1",
    )

    response = client.post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(organizationName="Otro equipo")),
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY="registration-2",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    body = response.json()
    assert body["code"] == "registration_invalid"
    assert body["invalidParams"] == [
        {
            "name": "email",
            "code": "email_unavailable",
            "reason": "Registration is unavailable for this email.",
        }
    ]
    assert "existing" not in json.dumps(body).lower()


@pytest.mark.django_db
def test_registration_endpoint_returns_field_specific_problem_details_for_missing_consent() -> None:
    response = Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(termsAccepted=False)),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    body = response.json()
    assert body["code"] == "registration_invalid"
    assert body["invalidParams"] == [
        {
            "name": "termsAccepted",
            "code": "consent_required",
            "reason": "Complete the required acceptance to continue.",
        }
    ]


@pytest.mark.django_db
def test_registration_endpoint_requires_idempotency_key() -> None:
    response = Client().post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload()),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    assert response.json()["invalidParams"] == [
        {
            "name": "idempotencyKey",
            "code": "required",
            "reason": "Provide an idempotency key to continue.",
        }
    ]


@pytest.mark.django_db
def test_registration_endpoint_maps_serializer_errors_to_registration_problem_details() -> None:
    response = Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(email="", termsVersion="")),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    assert response.json()["invalidParams"] == [
        {
            "name": "email",
            "code": "invalid_email",
            "reason": "Enter a valid email address.",
        },
        {
            "name": "termsVersion",
            "code": "consent_required",
            "reason": "Complete the required acceptance to continue.",
        },
    ]


@pytest.mark.django_db
def test_verification_endpoint_returns_minimal_activation_response() -> None:
    Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload()),
        content_type="application/json",
    )
    verification = RegistrationVerification.objects.get()

    response = Client().post(
        "/api/v1/organizations/registrations/verify-email/",
        data=json.dumps({"token": _verification_token(verification)}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "activated",
        "email": "ana@example.com",
        "language": "es",
        "nextStep": "sign_in",
    }


@pytest.mark.django_db
def test_verification_endpoint_returns_safe_problem_details_for_invalid_token() -> None:
    response = Client().post(
        "/api/v1/organizations/registrations/verify-email/",
        data=json.dumps({"token": "not-a-valid-token"}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    body = response.json()
    assert body["code"] == "verification_link_invalid"
    assert body["title"] == "Verification failed"
    assert "invalidParams" not in body


@pytest.mark.django_db
def test_verification_endpoint_hides_expired_and_consumed_distinctions() -> None:
    Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload()),
        content_type="application/json",
    )
    verification = RegistrationVerification.objects.get()
    RegistrationVerification.objects.filter(id=verification.id).update(
        expires_at=timezone.now()
    )

    expired_response = Client().post(
        "/api/v1/organizations/registrations/verify-email/",
        data=json.dumps({"token": _verification_token(verification)}),
        content_type="application/json",
    )

    RegistrationVerification.objects.filter(id=verification.id).update(
        expires_at=timezone.now() + timedelta(hours=1),
        consumed_at=timezone.now(),
    )
    consumed_response = Client().post(
        "/api/v1/organizations/registrations/verify-email/",
        data=json.dumps({"token": _verification_token(verification)}),
        content_type="application/json",
    )

    assert expired_response.status_code == 400
    assert consumed_response.status_code == 400
    assert expired_response.json()["code"] == consumed_response.json()["code"]


@pytest.mark.django_db
def test_synthetic_verification_link_endpoint_returns_latest_safe_link(settings) -> None:
    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = "synthetic-link-key"
    email = "owner.run-one@synthetic.moviqo.test"
    operator = Client(HTTP_X_MOVIQO_SYNTHETIC_KEY="synthetic-link-key")
    run_response = operator.post(
        "/api/v1/organizations/testing/synthetic-runs/",
        data=json.dumps({"email": email}),
        content_type="application/json",
    )
    assert run_response.status_code == 201
    run_token = run_response.json()["runToken"]

    Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(email=email)),
        content_type="application/json",
    )

    pending_response = operator.post(
        "/api/v1/organizations/testing/synthetic-runs/verification-link/",
        data=json.dumps({"runToken": run_token}),
        content_type="application/json",
    )
    assert pending_response.status_code == 404

    OutboxMessage.objects.filter(message_type="email.registration_verification").update(
        delivered_at=timezone.now()
    )
    response = operator.post(
        "/api/v1/organizations/testing/synthetic-runs/verification-link/",
        data=json.dumps({"runToken": run_token}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["email"] == email
    assert "/verify-email?token=" in response.json()["verificationUrl"]
    assert "subject" not in response.content.decode("utf-8")
    assert "text" not in response.content.decode("utf-8")


@pytest.mark.django_db
def test_synthetic_verification_link_endpoint_is_hidden_outside_synthetic_only(settings) -> None:
    settings.MOVIQO_ENVIRONMENT_CLASS = "test"
    settings.MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = "synthetic-link-key"

    response = Client(HTTP_X_MOVIQO_SYNTHETIC_KEY="synthetic-link-key").post(
        "/api/v1/organizations/testing/synthetic-runs/",
        data=json.dumps({"email": "owner.hidden@synthetic.moviqo.test"}),
        content_type="application/json",
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_synthetic_verification_link_endpoint_is_hidden_without_matching_key(settings) -> None:
    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = "synthetic-link-key"

    response = Client(HTTP_X_MOVIQO_SYNTHETIC_KEY="wrong-key").post(
        "/api/v1/organizations/testing/synthetic-runs/",
        data=json.dumps({"email": "owner.hidden@synthetic.moviqo.test"}),
        content_type="application/json",
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_synthetic_run_scope_cannot_be_created_for_an_existing_account(settings) -> None:
    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = "synthetic-link-key"
    email = "owner.existing@synthetic.moviqo.test"
    Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(email=email)),
        content_type="application/json",
    )

    response = Client(HTTP_X_MOVIQO_SYNTHETIC_KEY="synthetic-link-key").post(
        "/api/v1/organizations/testing/synthetic-runs/",
        data=json.dumps({"email": email}),
        content_type="application/json",
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_synthetic_run_rotation_releases_capacity_and_deactivates_identity(settings) -> None:
    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = "synthetic-link-key"
    settings.MOVIQO_ACTIVE_ORGANIZATION_CAPACITY = 1
    operator = Client(HTTP_X_MOVIQO_SYNTHETIC_KEY="synthetic-link-key")
    first_email = "owner.rotate-one@synthetic.moviqo.test"
    run_response = operator.post(
        "/api/v1/organizations/testing/synthetic-runs/",
        data=json.dumps({"email": first_email}),
        content_type="application/json",
    )
    run_token = run_response.json()["runToken"]
    first_registration = Client(HTTP_IDEMPOTENCY_KEY="registration-1").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(_payload(email=first_email)),
        content_type="application/json",
    )
    assert first_registration.status_code == 201

    rotation = operator.post(
        "/api/v1/organizations/testing/synthetic-runs/rotate/",
        data=json.dumps({"runToken": run_token}),
        content_type="application/json",
    )
    assert rotation.status_code == 200
    assert rotation.json()["status"] == "rotated"
    assert MoviqoUser.objects.get(normalized_email=first_email).is_active is False
    organization = Organization.objects.get(memberships__user__normalized_email=first_email)
    assert organization.is_active is False
    assert organization.registration_state == RegistrationWorkflowState.RETIRED

    second_registration = Client(HTTP_IDEMPOTENCY_KEY="registration-2").post(
        "/api/v1/organizations/registrations/",
        data=json.dumps(
            _payload(
                email="owner.rotate-two@synthetic.moviqo.test",
                organizationName="Equipo Sur",
            )
        ),
        content_type="application/json",
    )
    assert second_registration.status_code == 201
