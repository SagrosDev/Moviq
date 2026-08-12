from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
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
    WorkflowDraftRevisionConflictError,
    WorkflowDraftValidationAPIError,
    WorkflowNameConflictError,
    WorkflowNameValidationError,
    create_workflow_definition,
    list_workflow_catalog,
    publish_workflow_version,
    read_workflow_draft,
    save_workflow_draft,
    validate_workflow_publication,
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


class WorkflowStarterConfigurationSerializer(serializers.Serializer):
    mode = serializers.CharField(required=False, allow_blank=True)
    teamIds = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
    )
    membershipIds = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
    )


class WorkflowAssignmentConfigurationSerializer(serializers.Serializer):
    mode = serializers.CharField(required=False, allow_blank=True)
    membershipId = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class WorkflowPublicationSerializer(serializers.Serializer):
    starter = WorkflowStarterConfigurationSerializer(required=False)
    assignment = WorkflowAssignmentConfigurationSerializer(required=False)


class WorkflowDirectoryMembershipSerializer(serializers.Serializer):
    membershipId = serializers.UUIDField()
    displayName = serializers.CharField()
    role = serializers.CharField()


class WorkflowDirectoryTeamSerializer(serializers.Serializer):
    teamId = serializers.UUIDField()
    name = serializers.CharField()
    activeMemberCount = serializers.IntegerField(min_value=1)
    membershipIds = serializers.ListField(child=serializers.UUIDField())


class WorkflowConfigurationDirectorySerializer(serializers.Serializer):
    memberships = WorkflowDirectoryMembershipSerializer(many=True)
    teams = WorkflowDirectoryTeamSerializer(many=True)


class WorkflowDraftDocumentSerializer(serializers.Serializer):
    schemaVersion = serializers.IntegerField(min_value=1)
    draftId = serializers.CharField()
    workflowId = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()

    class WorkflowElementSerializer(serializers.Serializer):
        id = serializers.CharField(allow_blank=True)
        type = serializers.CharField()
        label = serializers.CharField()

    class WorkflowConnectionSerializer(serializers.Serializer):
        id = serializers.CharField(allow_blank=True)
        type = serializers.CharField()
        sourceId = serializers.CharField(allow_blank=True)
        targetId = serializers.CharField(allow_blank=True)
        label = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class WorkflowProcessFieldSerializer(serializers.Serializer):
        id = serializers.CharField(required=False, allow_blank=True)
        kind = serializers.CharField()
        label = serializers.CharField(allow_blank=True)
        helpText = serializers.CharField(required=False, allow_blank=True)
        placeholder = serializers.CharField(required=False, allow_blank=True)
        defaultValue = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        minimumLength = serializers.IntegerField(required=False, min_value=0)
        maximumLength = serializers.IntegerField(required=False, min_value=0)

    class WorkflowFormBindingSerializer(serializers.Serializer):
        id = serializers.CharField(required=False, allow_blank=True)
        taskElementId = serializers.CharField(allow_blank=True)
        fieldId = serializers.CharField(allow_blank=True)
        position = serializers.IntegerField(required=False, min_value=0)
        width = serializers.CharField(required=False, allow_blank=True)
        label = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    elements = WorkflowElementSerializer(many=True, required=False)
    connections = WorkflowConnectionSerializer(many=True, required=False)
    processFields = WorkflowProcessFieldSerializer(many=True, required=False)
    formBindings = WorkflowFormBindingSerializer(many=True, required=False)
    publication = WorkflowPublicationSerializer(required=False)


class WorkflowDraftSaveRequestSerializer(serializers.Serializer):
    expectedRevision = serializers.CharField()
    draft = WorkflowDraftDocumentSerializer()


class WorkflowPublicationValidationRequestSerializer(serializers.Serializer):
    expectedRevision = serializers.CharField()


class WorkflowPublishRequestSerializer(serializers.Serializer):
    expectedRevision = serializers.CharField()


class WorkflowCreateResponseSerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    organizationId = serializers.UUIDField()
    createdByMembershipId = serializers.UUIDField()
    configurationDirectory = WorkflowConfigurationDirectorySerializer()
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


class WorkflowPublicationIssueSerializer(serializers.Serializer):
    code = serializers.CharField()
    severity = serializers.CharField()
    target = serializers.CharField()
    elementId = serializers.CharField(allow_null=True)
    fieldId = serializers.CharField(allow_null=True)
    bindingId = serializers.CharField(allow_null=True)
    message = serializers.CharField()
    actionLabel = serializers.CharField()


class WorkflowPublicationValidationResponseSerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    revision = serializers.CharField()
    publishable = serializers.BooleanField()
    issues = WorkflowPublicationIssueSerializer(many=True)


class WorkflowPublishedVersionSerializer(serializers.Serializer):
    versionNumber = serializers.IntegerField(min_value=1)
    publishedAt = serializers.DateTimeField()
    sourceRevision = serializers.CharField()
    schemaVersion = serializers.IntegerField(min_value=1)


class WorkflowPublishResponseSerializer(WorkflowCreateResponseSerializer):
    publishedVersion = WorkflowPublishedVersionSerializer()


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

    @extend_schema(
        operation_id="workflow_design_draft_save",
        request=WorkflowDraftSaveRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            200: WorkflowCreateResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def put(self, request, workflow_id: UUID) -> Response:
        unexpected_response = _reject_unexpected_request_fields(
            request,
            allowed_fields={"expectedRevision", "draft"},
            title="Workflow draft save failed",
            reason="Remove this field; the draft endpoint owns integrity validation.",
        )
        if unexpected_response is not None:
            return unexpected_response
        serializer = WorkflowDraftSaveRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow draft save failed",
                ),
                invalid_params=_workflow_draft_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow draft save failed",
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
            result = save_workflow_draft(
                tenant_context=tenant_context,
                workflow_id=workflow_id,
                expected_revision=serializer.validated_data["expectedRevision"],
                draft=serializer.validated_data["draft"],
                idempotency_key=idempotency_key,
                request_hash=_workflow_request_hash(serializer.validated_data),
            )
        except WorkflowDraftValidationAPIError as exc:
            return problem_response(
                request,
                ProblemTemplate(400, "workflow_draft_invalid", "Workflow draft save failed"),
                invalid_params=exc.invalid_params,
            )
        except WorkflowDraftRevisionConflictError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    409,
                    "workflow_draft_revision_conflict",
                    "Workflow draft save failed",
                ),
                invalid_params=exc.invalid_params,
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        if result is None:
            raise NotFound("workflow")

        return Response(result, status=200)


class WorkflowPublicationValidationView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_design_publication_validation",
        request=WorkflowPublicationValidationRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            200: WorkflowPublicationValidationResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request, workflow_id: UUID) -> Response:
        candidate_response = _reject_publication_candidate(
            request,
            title="Workflow publication validation failed",
        )
        if candidate_response is not None:
            return candidate_response
        serializer = WorkflowPublicationValidationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow publication validation failed",
                ),
                invalid_params=_workflow_draft_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow publication validation failed",
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
            result = validate_workflow_publication(
                tenant_context=tenant_context,
                workflow_id=workflow_id,
                expected_revision=serializer.validated_data["expectedRevision"],
                idempotency_key=idempotency_key,
                request_hash=_workflow_request_hash(serializer.validated_data),
            )
        except WorkflowDraftValidationAPIError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    400,
                    "workflow_draft_invalid",
                    "Workflow publication validation failed",
                ),
                invalid_params=exc.invalid_params,
            )
        except WorkflowDraftRevisionConflictError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    409,
                    "workflow_draft_revision_conflict",
                    "Workflow publication validation failed",
                ),
                invalid_params=exc.invalid_params,
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        if result is None:
            raise NotFound("workflow")

        return Response(result, status=200)


class WorkflowPublishView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_design_publish",
        request=WorkflowPublishRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            200: WorkflowPublishResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request, workflow_id: UUID) -> Response:
        candidate_response = _reject_publication_candidate(
            request,
            title="Workflow publish failed",
        )
        if candidate_response is not None:
            return candidate_response
        serializer = WorkflowPublishRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow publish failed",
                ),
                invalid_params=_workflow_draft_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_draft_invalid",
                    title="Workflow publish failed",
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
            result = publish_workflow_version(
                tenant_context=tenant_context,
                workflow_id=workflow_id,
                expected_revision=serializer.validated_data["expectedRevision"],
                idempotency_key=idempotency_key,
                request_hash=_workflow_request_hash(serializer.validated_data),
            )
        except WorkflowDraftValidationAPIError as exc:
            return problem_response(
                request,
                ProblemTemplate(400, "workflow_draft_invalid", "Workflow publish failed"),
                invalid_params=exc.invalid_params,
            )
        except WorkflowDraftRevisionConflictError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    409,
                    "workflow_draft_revision_conflict",
                    "Workflow publish failed",
                ),
                invalid_params=exc.invalid_params,
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        if result is None:
            raise NotFound("workflow")

        return Response(result, status=200)


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


def _reject_publication_candidate(request, *, title: str) -> Response | None:
    return _reject_unexpected_request_fields(
        request,
        allowed_fields={"expectedRevision"},
        title=title,
        reason="Remove this field and validate the saved revision.",
    )


def _reject_unexpected_request_fields(
    request,
    *,
    allowed_fields: set[str],
    title: str,
    reason: str,
) -> Response | None:
    if not isinstance(request.data, Mapping):
        return problem_response(
            request,
            ProblemTemplate(400, "workflow_draft_invalid", title),
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "invalid_request",
                    "reason": "Send a JSON object and try again.",
                }
            ],
        )
    unexpected_fields = sorted(set(request.data) - allowed_fields)
    if not unexpected_fields:
        return None
    field_name = unexpected_fields[0]
    return problem_response(
        request,
        ProblemTemplate(400, "workflow_draft_invalid", title),
        invalid_params=[
            {
                "name": field_name,
                "code": "unexpected",
                "reason": reason,
            }
        ],
    )


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


def _workflow_draft_invalid_params(errors) -> list[dict[str, str]]:
    invalid_params: list[dict[str, str]] = []

    if "expectedRevision" in errors:
        invalid_params.append(
            {
                "name": "expectedRevision",
                "code": "required",
                "reason": "Reload the last saved draft before saving again.",
            }
        )

    if "draft" in errors:
        invalid_params.append(
            {
                "name": "draft",
                "code": "invalid",
                "reason": "Correct the workflow draft and try again.",
            }
        )

    if invalid_params:
        return invalid_params

    return [
        {
            "name": "nonFieldErrors",
            "code": "invalid_request",
            "reason": "Correct the marked values and try again.",
        }
    ]
