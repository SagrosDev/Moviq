from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.workflow_design.application import (
    read_published_workflow_version,
    read_workflow_draft_snapshot,
)
from moviqo.modules.workflow_runtime.models import TaskOccurrence, TaskProcessFieldValue
from moviqo.modules.workflow_runtime.application.my_work import OPEN_TASK_STATUSES

TASK_FORM_SAVE_COMMAND = "workflow-runtime.save-task-form-draft"
SAVE_OUTCOME_ACCEPTED = "accepted"
SAVE_OUTCOME_REJECTED = "rejected"
SAVE_ERROR_RESOURCE_NOT_FOUND = "resource_not_found"


class TaskFormValidationAPIError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Task form is invalid."
    default_code = "task_form_invalid"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


class TaskFormRevisionConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Task form revision does not match the latest server state."
    default_code = "task_form_revision_conflict"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


@dataclass(frozen=True)
class TaskFormProjection:
    task: TaskOccurrence
    workflow_name: str
    task_title: str
    process_id: str
    controls: list[dict[str, Any]]


def read_task_form(*, tenant_context: TenantContext, task_id) -> dict[str, Any] | None:
    projection = _load_task_form_projection(tenant_context=tenant_context, task_id=task_id)
    if projection is None:
        return None
    return _task_form_response(projection=projection)


def save_task_form_draft(
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
        command_type=TASK_FORM_SAVE_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _save_task_form_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            task_id=task_id,
            expected_task_revision=expected_task_revision,
            submitted_controls=controls,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == SAVE_OUTCOME_ACCEPTED:
        return outcome["payload"]

    error = outcome["error"]
    if error["code"] == SAVE_ERROR_RESOURCE_NOT_FOUND:
        return None
    if error["code"] == TaskFormRevisionConflictError.default_code:
        raise TaskFormRevisionConflictError(invalid_params=error["invalidParams"])
    raise TaskFormValidationAPIError(invalid_params=error["invalidParams"])


def _save_task_form_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    task_id,
    expected_task_revision: str,
    submitted_controls: list[dict[str, Any]],
) -> dict[str, Any]:
    task = (
        TaskOccurrence.objects.select_related("workflow", "workflow_version")
        .select_for_update(of=("self",))
        .filter(
            id=task_id,
            organization_id=tenant_context.organization_id,
            assignee_membership_id=tenant_context.membership_id,
            assignee_user_id=tenant_context.user_id,
            process__isnull=False,
            status__in=OPEN_TASK_STATUSES,
        )
        .first()
    )
    if task is None:
        return _rejected_save_outcome(
            code=SAVE_ERROR_RESOURCE_NOT_FOUND,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "not_found",
                    "reason": "Reload the assigned task before saving again.",
                }
            ],
        )

    if task.revision != expected_task_revision:
        return _rejected_save_outcome(
            code=TaskFormRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "expectedTaskRevision",
                    "code": "stale",
                    "reason": "Reload the assigned task before saving again.",
                }
            ],
        )

    projection = _build_task_form_projection(task)
    if projection is None:
        return _rejected_save_outcome(
            code=TaskFormRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "nonFieldErrors",
                    "code": "definition_revision_mismatch",
                    "reason": "Reload the assigned task before saving again.",
                }
            ],
        )
    invalid_params = _validate_submitted_controls(
        projection=projection,
        submitted_controls=submitted_controls,
    )
    if invalid_params:
        return _rejected_save_outcome(
            code=TaskFormValidationAPIError.default_code,
            invalid_params=invalid_params,
        )

    values_by_field_id = {
        value.field_id: value
        for value in TaskProcessFieldValue.objects.select_for_update().filter(
            task=task,
            organization_id=tenant_context.organization_id,
        )
    }
    submitted_values = {
        str(control["controlId"]): str(control.get("value", ""))
        for control in submitted_controls
    }
    for control in projection.controls:
        field_id = str(control["fieldId"])
        value_text = submitted_values[control["controlId"]]
        stored_value = values_by_field_id.get(field_id)
        if stored_value is None:
            TaskProcessFieldValue.objects.create(
                organization_id=tenant_context.organization_id,
                task=task,
                field_id=field_id,
                value_text=value_text,
            )
        elif stored_value.value_text != value_text:
            stored_value.value_text = value_text
            stored_value.save(update_fields=["value_text", "updated_at"])

    task.revision = str(int(task.revision) + 1)
    task.status = "in_progress"
    task.save(update_fields=["revision", "status", "updated_at"])

    refreshed_projection = _build_task_form_projection(task)
    payload = _task_form_response(projection=refreshed_projection)
    command_context.append_audit(
        event_type="workflow-runtime.task-draft-saved",
        payload={
            "taskId": payload["taskId"],
            "workflowId": payload["workflowId"],
            "taskRevision": payload["taskRevision"],
            "fieldIds": [control["fieldId"] for control in submitted_controls],
        },
    )
    return {
        "outcome": SAVE_OUTCOME_ACCEPTED,
        "payload": payload,
    }


def _load_task_form_projection(
    *,
    tenant_context: TenantContext,
    task_id,
) -> TaskFormProjection | None:
    task = (
        TaskOccurrence.objects.select_related("workflow", "workflow_version", "process")
        .filter(
            id=task_id,
            organization_id=tenant_context.organization_id,
            assignee_membership_id=tenant_context.membership_id,
            assignee_user_id=tenant_context.user_id,
            process__isnull=False,
            status__in=OPEN_TASK_STATUSES,
        )
        .first()
    )
    if task is None:
        return None
    return _build_task_form_projection(task)


def _build_task_form_projection(task: TaskOccurrence) -> TaskFormProjection | None:
    document = _load_authoritative_task_document(task)
    if document is None:
        return None
    fields_by_id = {
        field["id"]: field
        for field in document["processFields"]
    }
    values_by_field_id = {
        value.field_id: value.value_text
        for value in TaskProcessFieldValue.objects.filter(
            task=task,
            organization_id=task.organization_id,
        )
    }
    task_title = task.task_element_id
    for element in document["elements"]:
        if element["id"] == task.task_element_id:
            task_title = element["label"]
            break

    controls: list[dict[str, Any]] = []
    for binding in document["formBindings"]:
        if binding["taskElementId"] != task.task_element_id:
            continue
        field = fields_by_id.get(binding["fieldId"])
        if field is None:
            continue
        controls.append(
            {
                "controlId": binding["id"],
                "fieldId": field["id"],
                "kind": field["kind"],
                "label": binding.get("label") or field["label"],
                "helpText": field["helpText"],
                "placeholder": field["placeholder"],
                "width": binding["width"],
                "position": binding["position"],
                "value": values_by_field_id.get(field["id"], field["defaultValue"] or ""),
                "minimumLength": field["minimumLength"],
                "maximumLength": field["maximumLength"],
            }
        )
    controls.sort(key=lambda control: (control["position"], control["controlId"]))
    return TaskFormProjection(
        task=task,
        workflow_name=_workflow_name_from_document(document=document, fallback=task.workflow.name),
        task_title=task_title,
        process_id=str(task.process_id),
        controls=controls,
    )


def _validate_submitted_controls(
    *,
    projection: TaskFormProjection,
    submitted_controls: list[dict[str, Any]],
) -> list[dict[str, str]]:
    allowed_controls = {
        control["controlId"]: control
        for control in projection.controls
    }
    invalid_params: list[dict[str, str]] = []
    submitted_control_ids: set[str] = set()
    for submitted in submitted_controls:
        control_id = str(submitted.get("controlId", "")).strip()
        if control_id in submitted_control_ids:
            invalid_params.append(
                {
                    "name": f"controls.{control_id}.value",
                    "code": "duplicate",
                    "reason": "Submit each field only once when saving this task.",
                }
            )
            continue
        submitted_control_ids.add(control_id)
        allowed_control = allowed_controls.get(control_id)
        if allowed_control is None:
            invalid_params.append(
                {
                    "name": f"controls.{control_id or 'unknown'}.value",
                    "code": "unknown_control",
                    "reason": "Reload the assigned task before saving again.",
                }
            )
            continue
        if str(submitted.get("fieldId", "")).strip() != allowed_control["fieldId"]:
            invalid_params.append(
                {
                    "name": f"controls.{control_id}.fieldId",
                    "code": "mismatch",
                    "reason": "Reload the assigned task before saving again.",
                }
            )
            continue
        value = submitted.get("value", "")
        if not isinstance(value, str):
            invalid_params.append(
                {
                    "name": f"controls.{control_id}.value",
                    "code": "invalid",
                    "reason": "Enter valid text for this field.",
                }
            )
            continue
        if len(value) < allowed_control["minimumLength"]:
            minimum_length = allowed_control["minimumLength"]
            minimum_length_reason = (
                f"Use at least {minimum_length} character for this field."
                if minimum_length == 1
                else f"Use at least {minimum_length} characters for this field."
            )
            invalid_params.append(
                {
                    "name": f"controls.{control_id}.value",
                    "code": "too_short",
                    "reason": minimum_length_reason,
                }
            )
        if len(value) > allowed_control["maximumLength"]:
            maximum_length = allowed_control["maximumLength"]
            invalid_params.append(
                {
                    "name": f"controls.{control_id}.value",
                    "code": "too_long",
                    "reason": (
                        f"Use {maximum_length} characters or fewer for this field."
                    ),
                }
            )

    missing_control_ids = sorted(set(allowed_controls) - submitted_control_ids)
    invalid_params.extend(
        {
            "name": f"controls.{control_id}.value",
            "code": "missing",
            "reason": "Submit every visible field when saving this task.",
        }
        for control_id in missing_control_ids
    )

    return invalid_params


def _load_authoritative_task_document(task: TaskOccurrence) -> dict[str, Any] | None:
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


def _workflow_name_from_document(*, document: dict[str, Any], fallback: str) -> str:
    name = document.get("name")
    return name if isinstance(name, str) and name.strip() else fallback


def _task_form_response(*, projection: TaskFormProjection) -> dict[str, Any]:
    return {
        "taskId": str(projection.task.id),
        "processId": projection.process_id,
        "workflowId": str(projection.task.workflow_id),
        "workflowName": projection.workflow_name,
        "taskTitle": projection.task_title,
        "taskElementId": projection.task.task_element_id,
        "status": projection.task.status,
        "taskRevision": projection.task.revision,
        "definitionRevision": projection.task.definition_revision,
        "actions": {"saveDraft": True, "complete": False},
        "form": {
            "controls": [
                {
                    key: value
                    for key, value in control.items()
                    if key not in {"minimumLength", "maximumLength"}
                }
                for control in projection.controls
            ]
        },
    }


def _rejected_save_outcome(
    *,
    code: str,
    invalid_params: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "outcome": SAVE_OUTCOME_REJECTED,
        "error": {
            "code": code,
            "invalidParams": invalid_params,
        },
    }
