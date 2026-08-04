from __future__ import annotations

import json

import pytest
from django.test import Client


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
