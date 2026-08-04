from __future__ import annotations

import pytest
from django.test import Client, override_settings
from rest_framework.exceptions import Throttled
from rest_framework.test import APIRequestFactory

from moviqo.building_blocks.api.problem_details import (
    ProblemTemplate,
    problem_details_exception_handler,
    problem_response,
)

FORBIDDEN_FRAGMENTS = [
    "Traceback",
    "SELECT ",
    "authorization",
    "cookie",
    "token",
    "MOVIQO_SECRET_KEY",
    "process-field-secret",
    "hidden-resource-123",
]


def _assert_problem(response, *, status: int, code: str) -> dict:
    assert response.status_code == status
    assert response["Content-Type"].startswith("application/problem+json")

    body = response.json() if hasattr(response, "json") else response.data
    assert body["type"].startswith("https://api.moviqo.local/problems/")
    assert body["title"]
    assert body["status"] == status
    assert body["code"] == code
    assert body["correlationId"]
    assert "detail" not in body or "process-field-secret" not in body["detail"]
    assert "status_code" not in body

    serialized = str(body)
    for fragment in FORBIDDEN_FRAGMENTS:
        assert fragment not in serialized
    return body


@pytest.mark.parametrize(
    ("path", "status", "code"),
    [
        ("/api/v1/system/ping/?fail=validation", 400, "validation_failed"),
        ("/api/v1/system/ping/?fail=authorization", 404, "resource_not_found"),
        ("/api/v1/system/ping/?fail=not-found", 404, "resource_not_found"),
        ("/api/v1/system/ping/?fail=conflict", 409, "conflict"),
    ],
)
def test_known_api_errors_use_problem_details(path: str, status: int, code: str) -> None:
    response = Client(HTTP_X_CORRELATION_ID="safe-correlation-123").get(path)

    body = _assert_problem(response, status=status, code=code)
    assert body["correlationId"] == "safe-correlation-123"


def test_unsafe_inbound_correlation_id_is_replaced() -> None:
    response = Client(HTTP_X_CORRELATION_ID="bad\r\nX-Injected: yes").get(
        "/api/v1/system/ping/?fail=not-found"
    )

    body = _assert_problem(response, status=404, code="resource_not_found")
    assert body["correlationId"] != "bad\r\nX-Injected: yes"


def test_validation_problem_includes_safe_invalid_params() -> None:
    response = Client().get("/api/v1/system/ping/?fail=validation")

    body = _assert_problem(response, status=400, code="validation_failed")
    assert body["invalidParams"] == [{"name": "fail", "reason": "Invalid value."}]


def test_validation_problem_does_not_echo_unsafe_validator_text() -> None:
    response = Client().get("/api/v1/system/ping/?fail=unsafe-validation")

    body = _assert_problem(response, status=400, code="validation_failed")
    assert body["invalidParams"] == [{"name": "fail", "reason": "Invalid value."}]


@override_settings(DEBUG=True)
def test_unexpected_errors_are_safe_problem_details() -> None:
    response = Client().get("/api/v1/system/ping/?fail=unexpected")

    _assert_problem(response, status=500, code="internal_error")


def test_wrapped_drf_exceptions_preserve_protocol_headers() -> None:
    request = APIRequestFactory().get("/api/v1/system/ping/")
    request.correlation_id = "safe-correlation-123"

    response = problem_details_exception_handler(Throttled(wait=30), {"request": request})

    _assert_problem(response, status=429, code="throttled")
    assert response["Retry-After"] == "30"


def test_problem_details_preserve_safe_detail_and_invalid_param_names() -> None:
    request = APIRequestFactory().get("/api/v1/system/ping/")
    request.correlation_id = "safe-correlation-123"

    response = problem_response(
        request,
        ProblemTemplate(
            status_code=400,
            code="validation_failed",
            title="Validation failed",
            detail="Membership 00000000-0000-0000-0000-000000000001 is invalid.",
        ),
        invalid_params=[{"name": "member_id", "reason": "Invalid value."}],
    )

    body = _assert_problem(response, status=400, code="validation_failed")
    assert body["detail"] == "Membership 00000000-0000-0000-0000-000000000001 is invalid."
    assert body["invalidParams"] == [{"name": "member_id", "reason": "Invalid value."}]


def test_problem_details_replace_unsafe_invalid_param_names() -> None:
    request = APIRequestFactory().get("/api/v1/system/ping/")
    request.correlation_id = "safe-correlation-123"

    response = problem_response(
        request,
        ProblemTemplate(
            status_code=400,
            code="validation_failed",
            title="Validation failed",
        ),
        invalid_params=[{"name": "process-field-secret/private", "reason": "Invalid value."}],
    )

    body = _assert_problem(response, status=400, code="validation_failed")
    assert body["invalidParams"] == [{"name": "nonFieldErrors", "reason": "Invalid value."}]


def test_protected_endpoint_does_not_serve_cleartext_requests() -> None:
    membership_id = "00000000-0000-0000-0000-000000000001"

    with override_settings(
        SECURE_SSL_REDIRECT=True,
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
        ALLOWED_HOSTS=["testserver"],
    ):
        response = Client().get(
            f"/api/v1/organizations/protected-memberships/{membership_id}/",
            secure=False,
        )

    assert response.status_code == 301
    assert response["Location"].startswith(
        f"https://testserver/api/v1/organizations/protected-memberships/{membership_id}/"
    )


def test_protected_endpoint_rejects_untrusted_hosts() -> None:
    membership_id = "00000000-0000-0000-0000-000000000001"

    with override_settings(ALLOWED_HOSTS=["app.moviqo.example"]):
        response = Client(HTTP_HOST="evil.example").get(
            f"/api/v1/organizations/protected-memberships/{membership_id}/",
            secure=True,
        )

    assert response.status_code == 400
