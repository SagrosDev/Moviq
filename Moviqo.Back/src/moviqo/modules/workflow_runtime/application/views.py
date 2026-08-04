from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from moviqo.building_blocks.tenancy.runtime import apply_tenant_context, tenant_bootstrap_context
from moviqo.modules.organizations.application.tenant_access import resolve_tenant_context
from moviqo.modules.organizations.application.views import AuthenticatedRequestPermission
from moviqo.modules.workflow_runtime.application.my_work import read_my_work_dashboard


class StartWorkflowSummarySerializer(serializers.Serializer):
    workflowId = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    availability = serializers.CharField()


class MyTaskSummarySerializer(serializers.Serializer):
    taskId = serializers.UUIDField()
    title = serializers.CharField()
    workflowName = serializers.CharField()
    status = serializers.CharField()
    assignee = serializers.CharField()
    currentStep = serializers.CharField()


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


class MyWorkDashboardView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="workflow_runtime_my_work_dashboard",
        responses={200: MyWorkDashboardSerializer},
    )
    def get(self, request) -> Response:
        with tenant_bootstrap_context(user_id=request.user.pk):
            tenant_context = resolve_tenant_context(request)
            apply_tenant_context(tenant_context)
            return Response(read_my_work_dashboard(tenant_context))
