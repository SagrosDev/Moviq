from __future__ import annotations

import re
from uuid import uuid4

SAFE_CORRELATION_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$")


def safe_correlation_id(value: str | None) -> str:
    if value and SAFE_CORRELATION_ID.fullmatch(value):
        return value
    return uuid4().hex


class CorrelationIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.correlation_id = safe_correlation_id(request.headers.get("X-Correlation-ID"))
        response = self.get_response(request)
        response["X-Correlation-ID"] = request.correlation_id
        return response
