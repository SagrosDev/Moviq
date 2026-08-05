from __future__ import annotations

import hashlib
import json

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
from moviqo.modules.organizations.application import active_membership_for_user
from moviqo.modules.organizations.application.tenant_access import resolve_tenant_context
from moviqo.modules.organizations.application.views import AuthenticatedRequestPermission
from moviqo.modules.workflow_runtime.application.my_work import read_my_work_dashboard
from moviqo.modules.workflow_runtime.application.start_process import start_process
from moviqo.modules.workflow_runtime.application.task_form import (
    TaskFormRevisionConflictError,
    TaskFormValidationAPIError,
    read_task_form,
    save_task_form_draft,
)


class StartWorkflowSummarySerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    availability = serializers.CharField()
    versionNumber = serializers.IntegerField(min_value=1)


class StartProcessAcceptedWorkflowSerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    title = serializers.CharField()
    versionNumber = serializers.IntegerField(min_value=1)


class StartProcessAcceptedSerializer(serializers.Serializer):
    processId = serializers.UUIDField()
    taskId = serializers.UUIDField()
    workflow = StartProcessAcceptedWorkflowSerializer()
    destinationRoute = serializers.CharField()


class StartProcessRequestSerializer(serializers.Serializer):
    pass


class MyTaskSummarySerializer(serializers.Serializer):
    taskId = serializers.UUIDField()
    title = serializers.CharField()
    workflowName = serializers.CharField()
    status = serializers.CharField()
    processId = serializers.UUIDField()
    activatedAt = serializers.DateTimeField()
    openTaskRoute = serializers.CharField()


class MyProcessSummarySerializer(serializers.Serializer):
    processId = serializers.UUIDField()
    workflowName = serializers.CharField()
    involvement = serializers.CharField()
    currentStep = serializers.CharField()
    instanceState = serializers.CharField()
    systemStatus = serializers.CharField()
    startedAt = serializers.DateTimeField()
    lastActivityAt = serializers.DateTimeField()


class StartWorkflowCollectionSerializer(serializers.Serializer):
    items = StartWorkflowSummarySerializer(many=True)
    limit = serializers.IntegerField(min_value=1)
    hasMore = serializers.BooleanField()


class MyTaskCollectionSerializer(serializers.Serializer):
    items = MyTaskSummarySerializer(many=True)
    limit = serializers.IntegerField(min_value=1)
    hasMore = serializers.BooleanField()


class MyProcessCollectionSerializer(serializers.Serializer):
    items = MyProcessSummarySerializer(many=True)
    limit = serializers.IntegerField(min_value=1)
    hasMore = serializers.BooleanField()


class MyWorkDashboardSerializer(serializers.Serializer):
    startWorkflows = StartWorkflowCollectionSerializer()
    myTasks = MyTaskCollectionSerializer()
    myProcesses = MyProcessCollectionSerializer()


class TaskFormControlSerializer(serializers.Serializer):
    controlId = serializers.CharField()
    fieldId = serializers.CharField()
    kind = serializers.CharField()
    label = serializers.CharField()
    helpText = serializers.CharField(allow_blank=True)
    placeholder = serializers.CharField(allow_blank=True)
    width = serializers.CharField()
    position = serializers.IntegerField(min_value=0)
    value = serializers.CharField(allow_blank=True)


class TaskFormActionsSerializer(serializers.Serializer):
    saveDraft = serializers.BooleanField()
    complete = serializers.BooleanField()


class TaskFormBodySerializer(serializers.Serializer):
    controls = TaskFormControlSerializer(many=True)


class TaskFormDocumentSerializer(serializers.Serializer):
    taskId = serializers.UUIDField()
    processId = serializers.UUIDField()
    workflowId = serializers.UUIDField()
    workflowName = serializers.CharField()
    taskTitle = serializers.CharField()
    taskElementId = serializers.CharField()
    status = serializers.CharField()
    taskRevision = serializers.CharField()
    definitionRevision = serializers.CharField()
    actions = TaskFormActionsSerializer()
    form = TaskFormBodySerializer()


class TaskFormSaveControlSerializer(serializers.Serializer):
    controlId = serializers.CharField()
    fieldId = serializers.CharField()
    value = serializers.CharField(allow_blank=True)


class TaskFormSaveRequestSerializer(serializers.Serializer):
    expectedTaskRevision = serializers.CharField()
    controls = TaskFormSaveControlSerializer(many=True)


class MyWorkDashboardView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_runtime_my_work_dashboard",
        responses={
            200: MyWorkDashboardSerializer,
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request) -> Response:
        tenant_context = _require_runtime_membership(request)
        return Response(read_my_work_dashboard(tenant_context))


class StartWorkflowProcessView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_runtime_start_process",
        request=StartProcessRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            200: StartProcessAcceptedSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request, workflow_id) -> Response:
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="workflow_start_invalid",
                    title="Workflow start failed",
                ),
                invalid_params=[
                    {
                        "name": "idempotencyKey",
                        "code": "required",
                        "reason": "Provide an idempotency key to continue.",
                    }
                ],
            )

        tenant_context = _require_runtime_membership(request)
        try:
            result = start_process(
                tenant_context=tenant_context,
                workflow_id=workflow_id,
                idempotency_key=idempotency_key,
                request_hash=_workflow_start_request_hash(
                    workflow_id=str(workflow_id),
                    membership_id=str(tenant_context.membership_id),
                ),
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        if result is None:
            raise NotFound("workflow-start")

        return Response(result)


class TaskFormDetailView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_runtime_task_form_detail",
        responses={
            200: TaskFormDocumentSerializer,
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request, task_id) -> Response:
        tenant_context = _require_runtime_membership(request)
        document = read_task_form(tenant_context=tenant_context, task_id=task_id)
        if document is None:
            raise NotFound("task-form")
        return Response(document)

    @extend_schema(
        operation_id="workflow_runtime_task_form_save",
        request=TaskFormSaveRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="Idempotency-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
            )
        ],
        responses={
            200: TaskFormDocumentSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (403, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def put(self, request, task_id) -> Response:
        serializer = TaskFormSaveRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="task_form_invalid",
                    title="Task form save failed",
                ),
                invalid_params=_task_form_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="task_form_invalid",
                    title="Task form save failed",
                ),
                invalid_params=[
                    {
                        "name": "idempotencyKey",
                        "code": "required",
                        "reason": "Provide an idempotency key to continue.",
                    }
                ],
            )

        tenant_context = _require_runtime_membership(request)
        try:
            result = save_task_form_draft(
                tenant_context=tenant_context,
                task_id=task_id,
                expected_task_revision=serializer.validated_data["expectedTaskRevision"],
                controls=serializer.validated_data["controls"],
                idempotency_key=idempotency_key,
                request_hash=_task_form_request_hash(serializer.validated_data),
            )
        except TaskFormValidationAPIError as exc:
            return problem_response(
                request,
                ProblemTemplate(400, "task_form_invalid", "Task form save failed"),
                invalid_params=exc.invalid_params,
            )
        except TaskFormRevisionConflictError as exc:
            return problem_response(
                request,
                ProblemTemplate(409, "task_form_revision_conflict", "Task form save failed"),
                invalid_params=exc.invalid_params,
            )
        except IdempotencyKeyReuseConflict:
            return problem_response(
                request,
                ProblemTemplate(409, "idempotency_key_reused", "Conflict"),
            )

        if result is None:
            raise NotFound("task-form")
        return Response(result)


def _require_runtime_membership(request):
    with tenant_bootstrap_context(user_id=request.user.pk):
        tenant_context = resolve_tenant_context(request)
        apply_tenant_context(tenant_context)
        membership = active_membership_for_user(request.user)
        if (
            membership is None
            or membership.id != tenant_context.membership_id
            or membership.organization_id != tenant_context.organization_id
        ):
            raise NotFound("my-work")
        return tenant_context


def _task_form_request_hash(payload: dict[str, object]) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _workflow_start_request_hash(*, workflow_id: str, membership_id: str) -> str:
    serialized = json.dumps(
        {"membershipId": membership_id, "workflowId": workflow_id},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _task_form_invalid_params(errors) -> list[dict[str, str]]:
    invalid_params: list[dict[str, str]] = []
    if "expectedTaskRevision" in errors:
        invalid_params.append(
            {
                "name": "expectedTaskRevision",
                "code": "required",
                "reason": "Reload the assigned task before saving again.",
            }
        )
    if "controls" in errors:
        invalid_params.append(
            {
                "name": "controls",
                "code": "invalid",
                "reason": "Correct the marked values and try again.",
            }
        )
    return invalid_params or [
        {
            "name": "nonFieldErrors",
            "code": "invalid_request",
            "reason": "Correct the marked values and try again.",
        }
    ]
