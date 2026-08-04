from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import pytest
from django.conf import settings
from django.core import signing
from django.db import close_old_connections

from moviqo.modules.organizations.application.registration import (
    VERIFICATION_SALT,
    VerificationActivationError,
    register_initial_owner,
    verify_initial_registration,
)
from moviqo.modules.organizations.models import (
    Membership,
    MoviqoUser,
    Organization,
    RegistrationVerification,
    RegistrationWorkflowState,
)


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("Verification concurrency coverage requires PostgreSQL integration settings.")


def _payload(**overrides):
    payload = {
        "owner_name": "Ana Gomez",
        "organization_name": "Equipo Norte",
        "email": "ana@example.com",
        "password": "frase segura para moviqo 2026",
        "language": "es",
        "region": "CO",
        "timezone": "America/Bogota",
        "currency": "COP",
        "terms_accepted": True,
        "privacy_accepted": True,
        "terms_version": "beta-2026-08-04",
        "privacy_version": "privacy-2026-08-04",
        "prohibited_data_acknowledged": True,
    }
    payload.update(overrides)
    return payload


def _verification_token(verification: RegistrationVerification) -> str:
    return signing.TimestampSigner(salt=VERIFICATION_SALT).sign(str(verification.id))


@dataclass(frozen=True)
class AttemptResult:
    kind: str
    payload: dict[str, str] | str


def _attempt_activation(token: str) -> AttemptResult:
    close_old_connections()
    try:
        return AttemptResult(
            kind="success",
            payload=verify_initial_registration(token=token),
        )
    except VerificationActivationError as exc:
        return AttemptResult(kind="error", payload=exc.problem_code)
    finally:
        close_old_connections()


@pytest.mark.django_db(transaction=True)
def test_concurrent_verification_attempts_activate_at_most_once() -> None:
    _integration_only()
    register_initial_owner(
        **_payload(),
        idempotency_key="registration-1",
    )
    verification = RegistrationVerification.objects.get()
    token = _verification_token(verification)

    with ThreadPoolExecutor(max_workers=2) as executor:
        first_future = executor.submit(_attempt_activation, token)
        second_future = executor.submit(_attempt_activation, token)
        results = [first_future.result(), second_future.result()]

    verification.refresh_from_db()
    membership = Membership.objects.get()
    organization = Organization.objects.get()
    user = MoviqoUser.objects.get()

    assert sorted(result.kind for result in results) == ["error", "success"]
    success_result = next(result for result in results if result.kind == "success")
    error_result = next(result for result in results if result.kind == "error")
    assert success_result.payload == {
        "status": "activated",
        "email": "ana@example.com",
        "language": "es",
        "nextStep": "sign_in",
    }
    assert error_result.payload == "verification_link_invalid"
    assert verification.consumed_at is not None
    assert user.is_active is True
    assert organization.is_active is True
    assert organization.registration_state == RegistrationWorkflowState.ACTIVE
    assert membership.is_active is True
    assert membership.registration_state == RegistrationWorkflowState.ACTIVE
