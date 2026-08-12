from __future__ import annotations

from typing import Any

from django.utils import timezone

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.application import read_active_membership_by_id
from moviqo.modules.workflow_runtime.application.my_work import OPEN_TASK_STATUSES
from moviqo.modules.workflow_runtime.application.task_assignment import resolve_task_assignee
from moviqo.modules.workflow_runtime.application.task_form import (
    TaskCompletionRouteError,
    TaskFormRevisionConflictError,
    TaskFormValidationAPIError,
    build_task_form_projection,
    can_complete_task,
    copy_task_process_field_values,
    load_authoritative_task_document,
    persist_task_form_values,
    resolve_task_completion_route,
    validate_submitted_controls,
)
from moviqo.modules.workflow_runtime.models import ProcessInstance, TaskOccurrence

TASK_COMPLETE_COMMAND = "workflow-runtime.complete-task"
COMPLETE_OUTCOME_ACCEPTED = "accepted"
COMPLETE_OUTCOME_REJECTED = "rejected"
COMPLETE_ERROR_RESOURCE_NOT_FOUND = "resource_not_found"


def complete_task(
    *,
    tenant_context: TenantContext,
    task_id,
    expected_task_revision: str,
    controls: list[dict[str, Any]],
    idempotency_key: str,
    request_hash: str,
) -> dict[str, Any] | None:
    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=TASK_COMPLETE_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _complete_task_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            task_id=task_id,
            expected_task_revision=expected_task_revision,
            submitted_controls=controls,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == COMPLETE_OUTCOME_ACCEPTED:
        return outcome["payload"]

    error = outcome["error"]
    if error["code"] == COMPLETE_ERROR_RESOURCE_NOT_FOUND:
        return None
    if error["code"] == TaskFormRevisionConflictError.default_code:
        raise TaskFormRevisionConflictError(invalid_params=error["invalidParams"])
    if error["code"] == TaskCompletionRouteError.default_code:
        raise TaskCompletionRouteError(invalid_params=error["invalidParams"])
    raise TaskFormValidationAPIError(invalid_params=error["invalidParams"])


def _complete_task_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    task_id,
    expected_task_revision: str,
    submitted_controls: list[dict[str, Any]],
) -> dict[str, Any]:
    task = (
        TaskOccurrence.objects.select_related(
            "workflow",
            "workflow_version",
            "process",
        )
        .select_for_update(of=("self",))
        .filter(
            id=task_id,
            organization_id=tenant_context.organization_id,
            assignee_membership_id=tenant_context.membership_id,
            assignee_user_id=tenant_context.user_id,
            process__isnull=False,
        )
        .first()
    )
    if task is None:
        return _rejected_complete_outcome(
            code=COMPLETE_ERROR_RESOURCE_NOT_FOUND,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "not_found",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    if task.revision != expected_task_revision:
        return _rejected_complete_outcome(
            code=TaskFormRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "expectedTaskRevision",
                    "code": "stale",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    if task.status not in OPEN_TASK_STATUSES:
        return _rejected_complete_outcome(
            code=COMPLETE_ERROR_RESOURCE_NOT_FOUND,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "not_found",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    projection = build_task_form_projection(task)
    if projection is None:
        return _rejected_complete_outcome(
            code=TaskFormRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "definition_revision_mismatch",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    invalid_params = validate_submitted_controls(
        projection=projection,
        submitted_controls=submitted_controls,
        retry_action="completing it",
        submission_action="completing this task",
    )
    if invalid_params:
        return _rejected_complete_outcome(
            code=TaskFormValidationAPIError.default_code,
            invalid_params=invalid_params,
        )

    process = (
        ProcessInstance.objects.select_for_update(of=("self",))
        .filter(id=task.process_id, organization_id=tenant_context.organization_id, status="active")
        .first()
    )
    if process is None:
        return _rejected_complete_outcome(
            code=COMPLETE_ERROR_RESOURCE_NOT_FOUND,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "not_found",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    document = load_authoritative_task_document(task)
    route_target = resolve_task_completion_route(
        document=document,
        task_element_id=task.task_element_id,
    )
    if not can_complete_task(task=task, document=document) or route_target is None:
        return _rejected_complete_outcome(
            code=TaskCompletionRouteError.default_code,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "route_unavailable",
                    "reason": "Reload the assigned task before completing it.",
                }
            ],
        )

    element_by_id = {
        element["id"]: element for element in document.get("elements", [])
    }
    route_target_element = element_by_id.get(route_target)
    next_assignee = None
    if route_target_element and route_target_element.get("type") == "task":
        initiator_membership = read_active_membership_by_id(
            organization_id=process.organization_id,
            membership_id=process.initiator_membership_id,
        )
        next_assignee = resolve_task_assignee(
            organization_id=process.organization_id,
            snapshot=document,
            task_element_id=route_target,
            initiator_membership=initiator_membership,
        )
        if next_assignee is None:
            return _rejected_complete_outcome(
                code=TaskCompletionRouteError.default_code,
                invalid_params=[
                    {
                        "name": "nonFieldErrors",
                        "code": "assignee_unavailable",
                        "reason": (
                            "The next Task assignee is no longer active. Ask a "
                            "Designer to publish a corrected Workflow version."
                        ),
                    }
                ],
            )

    persisted_values = persist_task_form_values(
        tenant_context=tenant_context,
        task=task,
        projection=projection,
        submitted_controls=submitted_controls,
    )
    completed_at = timezone.now()
    task.revision = str(int(task.revision) + 1)
    task.status = "completed"
    task.completed_at = completed_at
    task.save(update_fields=["revision", "status", "completed_at", "updated_at"])

    next_task = None
    if next_assignee is not None:
        next_task = TaskOccurrence.objects.create(
            organization_id=task.organization_id,
            workflow_id=task.workflow_id,
            workflow_version_id=task.workflow_version_id,
            process=process,
            task_element_id=route_target,
            assignee_membership_id=next_assignee.membership_id,
            assignee_user_id=next_assignee.user_id,
            activated_by_membership_id=tenant_context.membership_id,
            activated_by_user_id=tenant_context.user_id,
            definition_revision=task.definition_revision,
            revision="1",
            status="assigned",
        )
        process.last_activity_at = completed_at
        process.save(update_fields=["last_activity_at"])
    else:
        process.status = "completed"
        process.completed_at = completed_at
        process.save(update_fields=["status", "completed_at", "last_activity_at"])

    if next_task is not None:
        copy_task_process_field_values(source_task=task, target_task=next_task)

    payload = {
        "taskId": str(task.id),
        "processId": str(process.id),
        "workflowId": str(task.workflow_id),
        "workflowVersionId": (
            str(task.workflow_version_id) if task.workflow_version_id is not None else None
        ),
        "workflowName": projection.workflow_name,
        "taskTitle": projection.task_title,
        "taskStatus": task.status,
        "processStatus": process.status,
        "taskRevision": task.revision,
        "definitionRevision": task.definition_revision,
        "routeTargetId": route_target,
        "completedAt": completed_at.isoformat(),
        "destinationRoute": "/my-work",
        "handoffMessage": (
            "The task is complete and the next task is assigned."
            if next_task is not None
            else "The task is complete and this process reached its end."
        ),
    }
    command_context.append_audit(
        event_type="workflow-runtime.task-completed",
        payload={
            **payload,
            "fieldValues": persisted_values,
        },
    )
    if next_task is not None:
        command_context.append_audit(
            event_type="workflow-runtime.task-assigned",
            payload={
                "processId": str(process.id),
                "workflowId": str(task.workflow_id),
                "workflowVersionId": str(task.workflow_version_id),
                "taskId": str(next_task.id),
                "taskElementId": route_target,
                "assigneeMembershipId": str(next_assignee.membership_id),
                "activatedAt": next_task.created_at.isoformat(),
            },
        )
    else:
        command_context.append_audit(
            event_type="workflow-runtime.process-completed",
            payload={
                "processId": str(process.id),
                "workflowId": str(task.workflow_id),
                "workflowVersionId": str(task.workflow_version_id),
                "routeTargetId": route_target,
                "completedAt": completed_at.isoformat(),
                "taskId": str(task.id),
            },
        )
    return {
        "outcome": COMPLETE_OUTCOME_ACCEPTED,
        "payload": payload,
    }


def _rejected_complete_outcome(
    *,
    code: str,
    invalid_params: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "outcome": COMPLETE_OUTCOME_REJECTED,
        "error": {
            "code": code,
            "invalidParams": invalid_params,
        },
    }
