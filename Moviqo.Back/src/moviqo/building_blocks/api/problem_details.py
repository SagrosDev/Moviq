from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from django.http import Http404
from rest_framework import serializers, status
from rest_framework.exceptions import APIException, NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from moviqo.building_blocks.api.correlation import safe_correlation_id

PROBLEM_BASE_TYPE = "https://api.moviqo.local/problems"
SAFE_INVALID_PARAM_NAME = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")
SAFE_PASSWORD_REASON_CODES = {
    "password_too_short",
    "password_too_long",
    "password_blocklisted",
}


class ProblemDetailsSerializer(serializers.Serializer):
    type = serializers.URLField()
    title = serializers.CharField()
    status = serializers.IntegerField()
    code = serializers.CharField()
    detail = serializers.CharField(required=False)
    correlationId = serializers.CharField()
    invalidParams = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        required=False,
    )


@dataclass(frozen=True)
class ProblemTemplate:
    status_code: int
    code: str
    title: str
    detail: str | None = None


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The resource state conflicts with this request."
    default_code = "conflict"


def problem_response(
    request,
    template: ProblemTemplate,
    *,
    invalid_params: list[dict[str, str]] | None = None,
    headers: Mapping[str, str] | None = None,
) -> Response:
    body: dict[str, Any] = {
        "type": f"{PROBLEM_BASE_TYPE}/{template.code.replace('_', '-')}",
        "title": template.title,
        "status": template.status_code,
        "code": template.code,
        "correlationId": safe_correlation_id(getattr(request, "correlation_id", None)),
    }
    if template.detail:
        body["detail"] = template.detail
    if invalid_params:
        body["invalidParams"] = [
            {
                "name": _safe_invalid_param_name(param.get("name")),
                "reason": str(param.get("reason", "Invalid value.")),
            }
            for param in invalid_params
        ]
    response = Response(
        body,
        status=template.status_code,
        headers=headers,
        content_type="application/problem+json",
    )
    response["Content-Type"] = "application/problem+json"
    return response


def problem_details_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    request = context.get("request")
    response = drf_exception_handler(exc, context)
    from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
    from moviqo.modules.organizations.application.identity_boundary import (
        IdentityBoundaryViolation,
        UnsupportedIdentityState,
    )

    if isinstance(exc, ValidationError):
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="validation_failed",
                title="Validation failed",
            ),
            invalid_params=_invalid_params_from(exc.detail),
        )

    if isinstance(exc, IdentityBoundaryViolation | UnsupportedIdentityState):
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status.HTTP_404_NOT_FOUND,
                code="resource_not_found",
                title="Resource not found",
            ),
        )

    if isinstance(exc, PermissionDenied | NotFound | Http404):
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status.HTTP_404_NOT_FOUND,
                code="resource_not_found",
                title="Resource not found",
            ),
        )

    if isinstance(exc, Conflict):
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status.HTTP_409_CONFLICT,
                code="conflict",
                title="Conflict",
            ),
        )

    if isinstance(exc, IdempotencyKeyReuseConflict):
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status.HTTP_409_CONFLICT,
                code="idempotency_key_reused",
                title="Conflict",
            ),
        )

    if response is not None:
        code = getattr(exc, "default_code", "api_error")
        status_code = response.status_code
        return problem_response(
            request,
            ProblemTemplate(
                status_code=status_code,
                code=str(code),
                title=_status_title(status_code),
            ),
            headers=_preserved_headers(response.headers),
        )

    return problem_response(
        request,
        ProblemTemplate(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="internal_error",
            title="Internal server error",
        ),
    )


def _invalid_params_from(detail: Any) -> list[dict[str, str]]:
    if not isinstance(detail, dict):
        return [{"name": "nonFieldErrors", "reason": "Invalid request."}]

    invalid_params: list[dict[str, str]] = []
    for field_name, errors in detail.items():
        safe_name = _safe_invalid_param_name(field_name)
        invalid_params.append(
            {
                "name": safe_name,
                "reason": _safe_invalid_param_reason(safe_name, errors),
            }
        )
    return invalid_params


def _status_title(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "API error"


def _preserved_headers(headers: Mapping[str, str]) -> dict[str, str]:
    return {key: value for key, value in headers.items() if key.lower() != "content-type"}


def _safe_invalid_param_name(field_name: Any) -> str:
    normalized_name = str(field_name)
    if SAFE_INVALID_PARAM_NAME.fullmatch(normalized_name):
        return normalized_name
    return "nonFieldErrors"


def _safe_invalid_param_reason(field_name: str, errors: Any) -> str:
    if field_name != "password":
        return "Invalid value."

    for error in _flatten_error_details(errors):
        if getattr(error, "code", None) in SAFE_PASSWORD_REASON_CODES:
            return str(error)
    return "Invalid value."


def _flatten_error_details(errors: Any) -> list[Any]:
    if isinstance(errors, list | tuple):
        flattened: list[Any] = []
        for item in errors:
            flattened.extend(_flatten_error_details(item))
        return flattened
    return [errors]
