from __future__ import annotations

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.workflow_design.application import (
    read_published_workflow_version,
    read_workflow_draft_snapshot,
)
from moviqo.modules.workflow_runtime.application.start_process import (
    list_startable_workflows,
)
from moviqo.modules.workflow_runtime.models import TaskOccurrence

OPEN_TASK_STATUSES = {"assigned", "in_progress"}

START_WORKFLOW_LIMIT = 6
MY_TASK_LIMIT = 12
MY_PROCESS_LIMIT = 12


def _empty_collection(limit: int) -> dict[str, object]:
    return {
        "items": [],
        "limit": limit,
        "hasMore": False,
    }


def read_my_work_dashboard(tenant_context: TenantContext) -> dict[str, object]:
    startable_workflows = list_startable_workflows(tenant_context=tenant_context)
    my_tasks = list_assigned_tasks(tenant_context=tenant_context)
    return {
        "startWorkflows": {
            "items": [
                {
                    "workflowId": item.workflow_id,
                    "title": item.title,
                    "description": item.description,
                    "availability": item.availability,
                    "versionNumber": item.version_number,
                }
                for item in startable_workflows[:START_WORKFLOW_LIMIT]
            ],
            "limit": START_WORKFLOW_LIMIT,
            "hasMore": len(startable_workflows) > START_WORKFLOW_LIMIT,
        },
        "myTasks": {
            "items": [
                {
                    "taskId": item["taskId"],
                    "title": item["title"],
                    "workflowName": item["workflowName"],
                    "status": item["status"],
                    "processId": item["processId"],
                    "activatedAt": item["activatedAt"],
                    "openTaskRoute": item["openTaskRoute"],
                }
                for item in my_tasks[:MY_TASK_LIMIT]
            ],
            "limit": MY_TASK_LIMIT,
            "hasMore": len(my_tasks) > MY_TASK_LIMIT,
        },
        "myProcesses": _empty_collection(MY_PROCESS_LIMIT),
    }


def list_assigned_tasks(*, tenant_context: TenantContext) -> list[dict[str, object]]:
    tasks = (
        TaskOccurrence.objects.select_related("workflow", "workflow_version", "process")
        .filter(
            organization_id=tenant_context.organization_id,
            assignee_membership_id=tenant_context.membership_id,
            assignee_user_id=tenant_context.user_id,
            process__isnull=False,
            status__in=OPEN_TASK_STATUSES,
        )
        .order_by("-created_at", "id")
    )
    summaries: list[dict[str, object]] = []
    for task in tasks:
        summary = _task_summary(task)
        if summary is not None:
            summaries.append(summary)
    return summaries


def _task_summary(task: TaskOccurrence) -> dict[str, object] | None:
    document = _load_authoritative_task_document(task)
    if document is None:
        return None

    workflow_name = task.workflow.name
    snapshot_name = document.get("name")
    if isinstance(snapshot_name, str) and snapshot_name.strip():
        workflow_name = snapshot_name

    task_title = task.task_element_id
    for element in document.get("elements", []):
        if element.get("id") == task.task_element_id:
            label = element.get("label")
            if isinstance(label, str) and label.strip():
                task_title = label
            break

    process_id = str(task.process_id)
    return {
        "taskId": str(task.id),
        "title": task_title,
        "workflowName": workflow_name,
        "status": task.status,
        "processId": process_id,
        "activatedAt": task.created_at.isoformat(),
        "openTaskRoute": f"/my-work/tasks/{task.id}",
    }


def _load_authoritative_task_document(task: TaskOccurrence) -> dict[str, object] | None:
    if task.workflow_version_id:
        version = read_published_workflow_version(
            workflow_version_id=task.workflow_version_id,
            organization_id=task.organization_id,
            workflow_id=task.workflow_id,
        )
        if version is None or version.source_draft_revision != task.definition_revision:
            return None
        return version.snapshot

    snapshot = read_workflow_draft_snapshot(
        tenant_context=TenantContext(
            organization_id=task.organization_id,
            membership_id=task.assignee_membership_id,
            user_id=task.assignee_user_id,
        ),
        workflow_id=task.workflow_id,
    )
    if snapshot is None:
        return None
    revision, document = snapshot
    if revision != task.definition_revision:
        return None
    return document
