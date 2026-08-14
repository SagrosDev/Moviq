from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from django.core.paginator import Paginator
from django.db.models import Q

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.application import (
    TransactionalAuditRecord,
    find_latest_transactional_audit,
    list_transactional_audits,
)
from moviqo.modules.organizations.application import read_membership_display_names
from moviqo.modules.workflow_design.application import (
    read_published_workflow_version,
    read_workflow_draft_snapshot,
)
from moviqo.modules.workflow_runtime.application.start_process import (
    list_startable_workflows,
)
from moviqo.modules.workflow_runtime.models import (
    ProcessInstance,
    TaskOccurrence,
    TaskProcessFieldValue,
)

OPEN_TASK_STATUSES = {"assigned", "in_progress"}

START_WORKFLOW_LIMIT = 6
MY_TASK_LIMIT = 12
MY_PROCESS_LIMIT = 12

TIMELINE_EVENT_KIND_MAP = {
    "workflow-runtime.process-started": "process_started",
    "workflow-runtime.task-draft-saved": "task_progress_saved",
    "workflow-runtime.task-completed": "task_completed",
    "workflow-runtime.process-completed": "process_completed",
}

TIMELINE_EVENT_LABEL_MAP = {
    "workflow-runtime.process-started": "Process started",
    "workflow-runtime.task-draft-saved": "Task progress saved",
    "workflow-runtime.task-completed": "Task completed",
    "workflow-runtime.process-completed": "Process completed",
}


@dataclass(frozen=True)
class AuthorizedProcessSummary:
    process: ProcessInstance
    workflow_name: str
    workflow_version_number: int
    current_step: str
    current_step_kind: str
    involvement: str
    contribution_summary: dict[str, str]


def _empty_collection(limit: int) -> dict[str, object]:
    return {
        "items": [],
        "limit": limit,
        "hasMore": False,
        "page": 1,
        "totalItems": 0,
        "totalPages": 1,
    }


def _pagination_metadata(page_object) -> dict[str, int | bool]:
    return {
        "limit": page_object.paginator.per_page,
        "hasMore": page_object.has_next(),
        "page": page_object.number,
        "totalItems": page_object.paginator.count,
        "totalPages": page_object.paginator.num_pages,
    }


def read_my_work_dashboard(
    tenant_context: TenantContext,
    *,
    start_workflows_page: int = 1,
    my_tasks_page: int = 1,
    my_tasks_search: str = "",
    my_processes_page: int = 1,
    my_processes_search: str = "",
) -> dict[str, object]:
    startable_workflows = list_startable_workflows(tenant_context=tenant_context)
    my_tasks = list_assigned_tasks(
        tenant_context=tenant_context,
        search=my_tasks_search,
    )
    my_processes = list_my_processes(
        tenant_context=tenant_context,
        page=my_processes_page,
        search=my_processes_search,
    )
    start_workflows_page_object = Paginator(
        startable_workflows,
        START_WORKFLOW_LIMIT,
    ).get_page(start_workflows_page if start_workflows_page > 0 else 1)
    my_tasks_page_object = Paginator(my_tasks, MY_TASK_LIMIT).get_page(
        my_tasks_page if my_tasks_page > 0 else 1
    )
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
                for item in start_workflows_page_object.object_list
            ],
            **_pagination_metadata(start_workflows_page_object),
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
                for item in my_tasks_page_object.object_list
            ],
            **_pagination_metadata(my_tasks_page_object),
        },
        "myProcesses": my_processes,
    }


def list_assigned_tasks(
    *,
    tenant_context: TenantContext,
    search: str = "",
) -> list[dict[str, object]]:
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
        if summary is not None and _matches_task_search(summary=summary, search=search):
            summaries.append(summary)
    return summaries


def _matches_task_search(*, summary: dict[str, object], search: str) -> bool:
    normalized_search = search.strip().lower()
    if not normalized_search:
        return True
    haystacks = (
        str(summary["title"]).lower(),
        str(summary["workflowName"]).lower(),
        str(summary["processId"])[:8].lower(),
    )
    return any(normalized_search in haystack for haystack in haystacks)


def list_my_processes(
    *,
    tenant_context: TenantContext,
    page: int = 1,
    search: str = "",
) -> dict[str, object]:
    summaries = [
        summary
        for summary in _load_authorized_process_summaries(tenant_context=tenant_context)
        if _matches_process_search(summary=summary, search=search)
    ]
    paginator = Paginator(summaries, MY_PROCESS_LIMIT)
    page_number = page if page > 0 else 1
    page_object = paginator.get_page(page_number)
    return {
        "items": [_serialize_process_summary(summary) for summary in page_object.object_list],
        **_pagination_metadata(page_object),
    }


def read_process_detail(
    *,
    tenant_context: TenantContext,
    process_id,
) -> dict[str, object] | None:
    summary = _find_authorized_process_summary(
        tenant_context=tenant_context,
        process_id=str(process_id),
    )
    if summary is None:
        return None

    timeline = _build_process_timeline(
        process=summary.process,
        viewer_membership_id=str(tenant_context.membership_id),
    )
    return {
        "header": {
            "processId": str(summary.process.id),
            "processNumber": str(summary.process.id)[:8],
            "workflowName": summary.workflow_name,
            "workflowVersionNumber": summary.workflow_version_number,
            "systemStatus": summary.process.status,
            "currentStep": summary.current_step,
            "currentStepKind": summary.current_step_kind,
            "startedAt": summary.process.started_at.isoformat(),
            "completedAt": (
                summary.process.completed_at.isoformat()
                if summary.process.completed_at is not None
                else None
            ),
            "lastActivityAt": summary.process.last_activity_at.isoformat(),
            "contributionSummary": summary.contribution_summary,
        },
        "timeline": timeline,
    }


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


def _load_authorized_process_summaries(
    *,
    tenant_context: TenantContext,
) -> list[AuthorizedProcessSummary]:
    processes = (
        ProcessInstance.objects.select_related("workflow", "workflow_version")
        .filter(
            organization_id=tenant_context.organization_id,
            status__in=("active", "completed"),
        )
        .filter(
            Q(
                initiator_membership_id=tenant_context.membership_id,
                initiator_user_id=tenant_context.user_id,
            )
            | Q(
                tasks__organization_id=tenant_context.organization_id,
                tasks__assignee_membership_id=tenant_context.membership_id,
                tasks__assignee_user_id=tenant_context.user_id,
            )
        )
        .distinct()
        .order_by("-last_activity_at", "-id")
    )
    return [
        summary
        for process in processes
        if (
            summary := _build_authorized_process_summary(
                process=process,
                viewer_membership_id=str(tenant_context.membership_id),
                viewer_user_id=tenant_context.user_id,
            )
        )
        is not None
    ]


def _find_authorized_process_summary(
    *,
    tenant_context: TenantContext,
    process_id: str,
) -> AuthorizedProcessSummary | None:
    for summary in _load_authorized_process_summaries(tenant_context=tenant_context):
        if str(summary.process.id) == process_id:
            return summary
    return None


def _build_authorized_process_summary(
    *,
    process: ProcessInstance,
    viewer_membership_id: str,
    viewer_user_id: int,
) -> AuthorizedProcessSummary | None:
    document = _load_authoritative_process_document(process)
    if document is None:
        return None

    involvement, contribution_summary = _resolve_process_involvement(
        process=process,
        viewer_membership_id=viewer_membership_id,
        viewer_user_id=viewer_user_id,
        document=document,
    )
    if involvement is None or contribution_summary is None:
        return None

    current_step, current_step_kind = _resolve_process_current_step(
        process=process,
        document=document,
    )
    return AuthorizedProcessSummary(
        process=process,
        workflow_name=_workflow_name_from_document(
            document=document,
            fallback=process.workflow.name,
        ),
        workflow_version_number=process.workflow_version.version_number,
        current_step=current_step,
        current_step_kind=current_step_kind,
        involvement=involvement,
        contribution_summary=contribution_summary,
    )


def _resolve_process_involvement(
    *,
    process: ProcessInstance,
    viewer_membership_id: str,
    viewer_user_id: int,
    document: dict[str, object],
) -> tuple[str | None, dict[str, str] | None]:
    if (
        str(process.initiator_membership_id) == viewer_membership_id
        and process.initiator_user_id == viewer_user_id
    ):
        return (
            "Initiator",
            {
                "kind": "initiated",
                "label": "You started this process.",
            },
        )

    assigned_tasks = TaskOccurrence.objects.filter(
        process=process,
        organization_id=process.organization_id,
        assignee_membership_id=viewer_membership_id,
        assignee_user_id=viewer_user_id,
    )
    if assigned_tasks.filter(status__in=OPEN_TASK_STATUSES).exists():
        return (
            "Participant",
            {
                "kind": "participated",
                "label": "You participate in this process.",
            },
        )

    completed_task = (
        assigned_tasks.filter(status="completed")
        .order_by("-completed_at", "-id")
        .first()
    )
    if completed_task is None:
        return None, None

    field_value = _safe_contribution_field_value(
        task=completed_task,
        organization_id=process.organization_id,
        document=document,
    )
    if field_value is None:
        return (
            "Previous participant",
            {
                "kind": "completedTask",
                "label": "You completed one authorized task.",
            },
        )

    field_label = _field_label_for_id(document=document, field_id=field_value.field_id)
    safe_label = field_label or "Submitted value"
    return (
        "Previous participant",
        {
            "kind": "submittedValue",
            "label": f"{safe_label}: {field_value.value_text}",
        },
    )


def _load_authoritative_process_document(process: ProcessInstance) -> dict[str, object] | None:
    if process.workflow_version_id is None:
        return None
    version = read_published_workflow_version(
        workflow_version_id=process.workflow_version_id,
        organization_id=process.organization_id,
        workflow_id=process.workflow_id,
    )
    if version is None:
        return None
    return version.snapshot


def _resolve_process_current_step(
    *,
    process: ProcessInstance,
    document: dict[str, object],
) -> tuple[str, str]:
    process_completed_audit = find_latest_transactional_audit(
        organization_id=process.organization_id,
        event_type="workflow-runtime.process-completed",
        process_id=str(process.id),
    )
    if process_completed_audit is not None:
        route_target_id = str(process_completed_audit.payload.get("routeTargetId", "")).strip()
        if route_target_id:
            return (
                _element_label_for_id(document=document, element_id=route_target_id) or "End",
                "end",
            )
    if process.status == "completed":
        return "Completed", "completed"

    active_task = (
        process.tasks.filter(
            organization_id=process.organization_id,
            status__in=OPEN_TASK_STATUSES,
        )
        .order_by("-created_at", "-id")
        .first()
    )
    if active_task is not None:
        task_label = _element_label_for_id(
            document=document,
            element_id=active_task.task_element_id,
        )
        return (task_label, "taskLabel") if task_label else ("Task", "taskFallback")
    if process.status == "active":
        return "Task", "taskFallback"
    return "Completed", "completed"


def _serialize_process_summary(summary: AuthorizedProcessSummary) -> dict[str, object]:
    return {
        "processId": str(summary.process.id),
        "processNumber": str(summary.process.id)[:8],
        "workflowName": summary.workflow_name,
        "workflowVersionNumber": summary.workflow_version_number,
        "involvement": summary.involvement,
        "currentStep": summary.current_step,
        "currentStepKind": summary.current_step_kind,
        "systemStatus": summary.process.status,
        "startedAt": summary.process.started_at.isoformat(),
        "completedAt": (
            summary.process.completed_at.isoformat()
            if summary.process.completed_at is not None
            else None
        ),
        "lastActivityAt": summary.process.last_activity_at.isoformat(),
        "viewRoute": f"/my-work/processes/{summary.process.id}",
        "contributionSummary": summary.contribution_summary,
    }


def _matches_process_search(
    *,
    summary: AuthorizedProcessSummary,
    search: str,
) -> bool:
    normalized_search = search.strip().lower()
    if not normalized_search:
        return True
    semantic_aliases = {
        "Initiator": (
            "initiator",
            "iniciador",
            "you started this process",
            "iniciaste este proceso",
        ),
        "Previous participant": (
            "previous participant",
            "participante anterior",
            "participaste anteriormente",
            "completed task",
            "tarea completada",
        ),
        "Participant": (
            "participant",
            "process participant",
            "participaste en este proceso",
            "participante",
        ),
    }.get(summary.involvement, ())
    step_aliases = {
        "taskFallback": ("task", "tarea"),
        "completed": ("completed", "completada"),
        "end": ("end", "fin"),
    }.get(summary.current_step_kind, ())
    haystacks = (
        str(summary.process.id)[:8].lower(),
        summary.workflow_name.lower(),
        summary.current_step.lower(),
        summary.involvement.lower(),
        summary.contribution_summary["label"].lower(),
        *(alias.lower() for alias in semantic_aliases),
        *(alias.lower() for alias in step_aliases),
    )
    return any(normalized_search in haystack for haystack in haystacks)


def _build_process_timeline(
    *,
    process: ProcessInstance,
    viewer_membership_id: str,
) -> list[dict[str, object]]:
    audits = list_transactional_audits(
        organization_id=process.organization_id,
        event_types=tuple(TIMELINE_EVENT_KIND_MAP),
        process_id=str(process.id),
        task_ids=_process_task_ids(process=process),
    )
    actor_display_names = _actor_display_names(audits)
    document = _load_authoritative_process_document(process)
    timeline: list[dict[str, object]] = []
    for audit in audits:
        event_kind = TIMELINE_EVENT_KIND_MAP.get(audit.event_type)
        label = TIMELINE_EVENT_LABEL_MAP.get(audit.event_type)
        if event_kind is None or label is None:
            continue
        task_position, task_position_kind = _timeline_task_position(
            audit=audit,
            process=process,
            document=document,
        )
        actor_membership_id = str(audit.actor_membership_id)
        actor_display = actor_display_names.get(actor_membership_id)
        timeline.append(
            {
                "eventKind": event_kind,
                "label": label,
                "actorDisplay": actor_display or "Authorized member",
                "actorDisplayKind": "member" if actor_display else "authorizedMember",
                "occurredAt": audit.created_at.isoformat(),
                "taskPosition": task_position,
                "taskPositionKind": task_position_kind,
            }
        )
    return timeline


def _actor_display_names(audits: Iterable[TransactionalAuditRecord]) -> dict[str, str]:
    membership_ids = [
        audit.actor_membership_id
        for audit in audits
        if audit.actor_membership_id is not None
    ]
    return read_membership_display_names(membership_ids=membership_ids)


def _process_task_ids(*, process: ProcessInstance) -> list[str]:
    return [str(task_id) for task_id in process.tasks.values_list("id", flat=True)]


def _timeline_task_position(
    *,
    audit: TransactionalAuditRecord,
    process: ProcessInstance,
    document: dict[str, object] | None,
) -> tuple[str, str]:
    if audit.event_type == "workflow-runtime.process-completed":
        route_target_id = str(audit.payload.get("routeTargetId", "")).strip()
        return (
            _element_label_for_id(document=document, element_id=route_target_id) or "End",
            "end",
        )

    if audit.event_type == "workflow-runtime.process-started":
        return "Start", "start"

    task_id = str(audit.payload.get("taskId", "")).strip()
    if not task_id:
        return "Start", "start"
    task = process.tasks.filter(id=task_id).first()
    if task is None:
        return "Task", "taskFallback"
    if document is None:
        authoritative = _load_authoritative_task_document(task)
    else:
        authoritative = document
    task_label = _element_label_for_id(
        document=authoritative,
        element_id=task.task_element_id,
    )
    return (task_label, "taskLabel") if task_label else ("Task", "taskFallback")


def _workflow_name_from_document(*, document: dict[str, object], fallback: str) -> str:
    name = document.get("name")
    return name if isinstance(name, str) and name.strip() else fallback


def _field_label_for_id(*, document: dict[str, object], field_id: str) -> str | None:
    for field in document.get("processFields", []):
        if field.get("id") == field_id:
            label = field.get("label")
            if isinstance(label, str) and label.strip():
                return label
    return None


def _safe_contribution_field_value(
    *,
    task: TaskOccurrence,
    organization_id,
    document: dict[str, object],
) -> TaskProcessFieldValue | None:
    bound_field_ids = [
        str(binding.get("fieldId"))
        for binding in sorted(
            (
                binding
                for binding in document.get("formBindings", [])
                if binding.get("taskElementId") == task.task_element_id
            ),
            key=lambda binding: (binding.get("position", 0), str(binding.get("id", ""))),
        )
        if isinstance(binding.get("fieldId"), str) and str(binding.get("fieldId")).strip()
    ]
    if not bound_field_ids:
        return None

    values_by_field_id = {
        value.field_id: value
        for value in TaskProcessFieldValue.objects.filter(
            task=task,
            organization_id=organization_id,
            field_id__in=bound_field_ids,
        )
    }
    for field_id in bound_field_ids:
        field_value = values_by_field_id.get(field_id)
        if field_value is not None:
            return field_value
    return None


def _element_label_for_id(
    *,
    document: dict[str, object] | None,
    element_id: str,
) -> str | None:
    if document is None:
        return None
    for element in document.get("elements", []):
        if element.get("id") == element_id:
            label = element.get("label")
            if isinstance(label, str) and label.strip():
                return label
    return None


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
