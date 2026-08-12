from __future__ import annotations

import hashlib
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from django.conf import settings
from django.db import close_old_connections
from django.db.models import Q

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.application import (
    create_workflow_definition,
    publish_workflow_version,
    save_workflow_draft,
)
from moviqo.modules.workflow_runtime.application.complete_task import complete_task
from moviqo.modules.workflow_runtime.application.my_work import (
    read_my_work_dashboard,
    read_process_detail,
)
from moviqo.modules.workflow_runtime.application.start_process import start_process
from moviqo.modules.workflow_runtime.application.task_form import save_task_form_draft
from moviqo.modules.workflow_runtime.models import ProcessInstance, TaskOccurrence


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("PostgreSQL integration settings are required for workflow-runtime coverage.")


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(django_user_model) -> TenantContext:
    user = django_user_model.objects.create_user(username=f"user-{uuid.uuid4().hex[:8]}")
    organization = Organization.objects.create(
        slug=f"org-{uuid.uuid4().hex[:8]}",
        display_name="Workflow Runtime Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.MEMBER,
    )
    return TenantContext(
        organization_id=organization.id,
        membership_id=membership.id,
        user_id=user.id,
    )


def _publish_workflow(tenant_context: TenantContext) -> str:
    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("workflow-create-1"),
    )
    saved = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft={
            "schemaVersion": 4,
            "draftId": created["draft"]["draftId"],
            "workflowId": created["workflowId"],
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            "connections": [
                {
                    "id": "connection-1",
                    "type": "sequence",
                    "sourceId": "start-1",
                    "targetId": "task-1",
                },
                {
                    "id": "connection-2",
                    "type": "sequence",
                    "sourceId": "task-1",
                    "targetId": "end-1",
                },
            ],
            "processFields": [{"kind": "shortText", "label": "Requester"}],
            "formBindings": [{"taskElementId": "task-1", "fieldId": "field-1"}],
            "publication": {
                "starter": {
                    "mode": "allActiveMembers",
                    "teamIds": [],
                    "membershipIds": [],
                },
                "assignment": {
                    "mode": "workflowInitiator",
                    "membershipId": None,
                },
            },
        },
        idempotency_key="workflow-save-1",
        request_hash=_request_hash("workflow-save-1"),
    )
    publish_workflow_version(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision=saved["revision"],
        idempotency_key="workflow-publish-1",
        request_hash=_request_hash("workflow-publish-1"),
    )
    return created["workflowId"]


@pytest.mark.django_db(transaction=True)
def test_concurrent_same_idempotency_key_creates_one_process_and_one_task(
    django_user_model,
) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    workflow_id = _publish_workflow(tenant_context)
    start_gate = threading.Event()

    def attempt_start() -> dict[str, str]:
        close_old_connections()
        start_gate.wait()
        try:
            return start_process(
                tenant_context=tenant_context,
                workflow_id=workflow_id,
                idempotency_key="workflow-start-1",
                request_hash=_request_hash("workflow-start-1"),
            )
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=2) as executor:
        first_future = executor.submit(attempt_start)
        second_future = executor.submit(attempt_start)
        start_gate.set()
        first = first_future.result()
        second = second_future.result()

    assert first == second
    assert ProcessInstance.objects.count() == 1
    assert TaskOccurrence.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_distinct_idempotency_keys_create_distinct_processes(
    django_user_model,
) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    workflow_id = _publish_workflow(tenant_context)

    first = start_process(
        tenant_context=tenant_context,
        workflow_id=workflow_id,
        idempotency_key="workflow-start-distinct-1",
        request_hash=_request_hash("workflow-start-distinct-1"),
    )
    second = start_process(
        tenant_context=tenant_context,
        workflow_id=workflow_id,
        idempotency_key="workflow-start-distinct-2",
        request_hash=_request_hash("workflow-start-distinct-2"),
    )

    assert first is not None
    assert second is not None
    assert first["processId"] != second["processId"]
    assert ProcessInstance.objects.count() == 2
    assert TaskOccurrence.objects.count() == 2


@pytest.mark.django_db(transaction=True)
def test_completed_process_tracking_reads_committed_audit_order(
    django_user_model,
) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    workflow_id = _publish_workflow(tenant_context)

    started = start_process(
        tenant_context=tenant_context,
        workflow_id=workflow_id,
        idempotency_key="workflow-start-track-1",
        request_hash=_request_hash("workflow-start-track-1"),
    )
    assert started is not None

    saved = save_task_form_draft(
        tenant_context=tenant_context,
        task_id=started["taskId"],
        expected_task_revision="1",
        controls=[
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": "Ana Perez",
            }
        ],
        idempotency_key="workflow-save-track-1",
        request_hash=_request_hash("workflow-save-track-1"),
    )
    completed = complete_task(
        tenant_context=tenant_context,
        task_id=started["taskId"],
        expected_task_revision="2",
        controls=[
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": "Ana Perez",
            }
        ],
        idempotency_key="workflow-complete-track-1",
        request_hash=_request_hash("workflow-complete-track-1"),
    )

    dashboard = read_my_work_dashboard(tenant_context)
    detail = read_process_detail(
        tenant_context=tenant_context,
        process_id=started["processId"],
    )

    assert saved is not None
    assert completed is not None
    assert dashboard["myProcesses"]["items"] == [
        {
            "processId": started["processId"],
            "processNumber": started["processId"][:8],
            "workflowName": "Workflow intake",
            "workflowVersionNumber": 1,
            "involvement": "Initiator",
            "currentStep": "End",
            "systemStatus": "completed",
            "startedAt": dashboard["myProcesses"]["items"][0]["startedAt"],
            "completedAt": dashboard["myProcesses"]["items"][0]["completedAt"],
            "lastActivityAt": dashboard["myProcesses"]["items"][0]["lastActivityAt"],
            "viewRoute": f"/my-work/processes/{started['processId']}",
            "contributionSummary": {
                "kind": "initiated",
                "label": "You started this process.",
            },
        }
    ]
    assert detail is not None
    assert [event["eventKind"] for event in detail["timeline"]] == [
        "process_started",
        "task_progress_saved",
        "task_completed",
        "process_completed",
    ]
    assert [
        audit.event_type
        for audit in TransactionalAuditRecord.objects.filter(
            Q(payload__processId=started["processId"]) | Q(payload__taskId=started["taskId"])
        ).order_by("created_at", "id")
    ] == [
        "workflow-runtime.process-started",
        "workflow-runtime.task-draft-saved",
        "workflow-runtime.task-completed",
        "workflow-runtime.process-completed",
    ]
