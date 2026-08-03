from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from moviqo.building_blocks.api.problem_details import (
    Conflict,
    ProblemDetailsSerializer,
)


class SystemPingSerializer(serializers.Serializer):
    status = serializers.CharField()


class SystemPingView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        operation_id="system_ping",
        responses={
            200: SystemPingSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (500, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request) -> Response:
        fail = request.query_params.get("fail")
        if fail == "validation":
            raise ValidationError({"fail": ["Unsupported diagnostic value."]})
        if fail == "unsafe-validation":
            raise ValidationError(
                {"fail": ["process-field-secret hidden-resource-123 token /private/path"]}
            )
        if fail == "authorization":
            raise PermissionDenied("hidden-resource-123")
        if fail == "not-found":
            raise Http404("hidden-resource-123")
        if fail == "conflict":
            raise Conflict("process-field-secret")
        if fail == "unexpected":
            raise RuntimeError("process-field-secret at /private/path")
        return Response({"status": "ok"})
