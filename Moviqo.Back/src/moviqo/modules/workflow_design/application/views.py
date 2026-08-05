from __future__ import annotations

import hashlib
import json
from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from moviqo.building_blocks.api.problem_details import (
    ProblemDetailsSerializer,
    ProblemTemplate,
    problem_response,
)
from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.building_blocks.tenancy.runtime import apply_tenant_context, tenant_bootstrap_context
from moviqo.modules.organizations.application import (
    active_membership_for_user,
    resolve_tenant_context,
)
from moviqo.modules.organizations.application.views import AuthenticatedRequestPermission
from moviqo.modules.workflow_design.application.services import (
    WorkflowNameConflictError,
    WorkflowNameValidationError,
    create_workflow_definition,
    list_workflow_catalog,
    read_workflow_draft,
)

ALLOWED_WORKFLOW_DESIGN_ROLES = frozenset(
    {
        "owner",
        "administrator",
        "designer",
    }
)


class WorkflowCreateRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, allow_blank=True)


class WorkflowDraftDocumentSerializer(serializers.Serializer):
    schemaVersion = serializers.IntegerField(min_value=1)
    draftId = serializers.CharField()
    workflowId = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    elements = serializers.ListField(child=serializers.DictField(), required=False)


class WorkflowCreateResponseSerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    organizationId = serializers.UUIDField()
    createdByMembershipId = serializers.UUIDField()
    name = serializers.CharField()
    revision = serializers.CharField()
    draft = WorkflowDraftDocumentSerializer()


class WorkflowCatalogItemSerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    name = serializers.CharField()
    revision = serializers.CharField()
    schemaVersion = serializers.IntegerField(min_value=1)
    updatedAt = serializers.DateTimeField()


class WorkflowCatalogResponseSerializer(serializers.Serializer):
    items = WorkflowCatalogItemSerializer(many=True)


class WorkflowCollectionView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_design_catalog_list",
        responses={
            200: WorkflowCatalogResponseSerializer,
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request) -> Response:
        try:
            tenant_context, _membership = _require_design_membership(request)
        except WorkflowDesignForbidden:
            return _workflow_design_forbidden_response(request)
        items = list_workflow_catalog(tenant_context=tenant_context)
        return Response(
            {
                "items": [
                    {
                        "workflowId": item.workflow_id,
                        "name": item.name,
                        "revision": item.revision,
                        "schemaVersion": item.schema_version,
                        "updatedAt": item.updated_at,
                    }
                    for item in items
                ]
            }
        )

    @extend_schema(
        operation_id="workflow_design_workflow_create",
        request=WorkflowCreateRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            201: WorkflowCreateResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request) -> Response:
        serializer = WorkflowCreateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_name_invalid",
                    title="Workflow creation failed",
                ),
                invalid_params=_workflow_create_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_name_invalid",
                    title="Workflow creation failed",
                ),
                invalid_params=[
                    {
                        "name": "idempotencyKey",
                        "code": "required",
                        "reason": "Provide an idempotency key to continue.",
                    }
                ],
            )

        try:
            tenant_context, _membership = _require_design_membership(request)
        except WorkflowDesignForbidden:
            return _workflow_design_forbidden_response(request)

        try:
            result = create_workflow_definition(
                tenant_context=tenant_context,
                name=serializer.validated_data.get("name", ""),
                idempotency_key=idempotency_key,
                request_hash=_workflow_request_hash(serializer.validated_data),
            )
        except WorkflowNameValidationError as exc:
            return problem_response(
                request,
                ProblemTemplate(400, "workflow_name_invalid", "Workflow creation failed"),
                invalid_params=exc.invalid_params,
            )
        except WorkflowNameConflictError as exc:
            return problem_response(
                request,
                ProblemTemplate(409, "workflow_name_conflict", "Workflow creation failed"),
                invalid_params=exc.invalid_params,
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        return Response(result, status=201)


class WorkflowDraftDetailView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_design_draft_detail",
        responses={
            200: WorkflowCreateResponseSerializer,
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request, workflow_id: UUID) -> Response:
        try:
            tenant_context, _membership = _require_design_membership(request)
        except WorkflowDesignForbidden:
            return _workflow_design_forbidden_response(request)
        draft = read_workflow_draft(tenant_context=tenant_context, workflow_id=workflow_id)
        if draft is None:
            raise NotFound("workflow")
        return Response(draft)


def _require_design_membership(request):
    with tenant_bootstrap_context(user_id=request.user.pk):
        tenant_context = resolve_tenant_context(request)
        apply_tenant_context(tenant_context)
        membership = active_membership_for_user(request.user)
        if (
            membership is None
            or membership.id != tenant_context.membership_id
            or membership.organization_id != tenant_context.organization_id
        ):
            raise NotFound("workflow-design")
        if membership.role not in ALLOWED_WORKFLOW_DESIGN_ROLES:
            raise WorkflowDesignForbidden()
        return tenant_context, membership


class WorkflowDesignForbidden(Exception):
    pass


def _workflow_design_forbidden_response(request) -> Response:
    return problem_response(
        request,
        ProblemTemplate(
            status_code=403,
            code="workflow_design_forbidden",
            title="Workflow design access denied",
        ),
    )


def _workflow_request_hash(payload: dict[str, object]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _workflow_create_invalid_params(errors) -> list[dict[str, str]]:
    if "name" not in errors:
        return [
            {
                "name": "nonFieldErrors",
                "code": "invalid_request",
                "reason": "Correct the marked values and try again.",
            }
        ]

    error_messages = [str(message).lower() for message in errors["name"]]
    error_code = "required"
    error_reason = "Complete this field to continue."

    if any("120" in message for message in error_messages):
        error_code = "too_long"
        error_reason = "Use 120 characters or fewer for the workflow name."

    return [
        {
            "name": "name",
            "code": error_code,
            "reason": error_reason,
        }
    ]
