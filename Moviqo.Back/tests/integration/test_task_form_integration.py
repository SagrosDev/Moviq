from __future__ import annotations

import hashlib
import uuid

import pytest
from django.conf import settings

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.application import create_workflow_definition, save_workflow_draft
from moviqo.modules.workflow_design.models import WorkflowDraft
from moviqo.modules.workflow_runtime.application.task_form import (
    TaskFormRevisionConflictError,
    TaskFormValidationAPIError,
    read_task_form,
    save_task_form_draft,
)
from moviqo.modules.workflow_runtime.models import TaskOccurrence, TaskProcessFieldValue


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("PostgreSQL integration settings are required for task-form coverage.")


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
        role=MembershipRole.DESIGNER,
    )
    return TenantContext(
        organization_id=organization.id,
        membership_id=membership.id,
        user_id=user.id,
    )


def _seed_task_form(django_user_model) -> tuple[TenantContext, dict[str, object], TaskOccurrence]:
    tenant_context = _tenant_context(django_user_model)
    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )
    save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft={
            "schemaVersion": 3,
            "draftId": created["draft"]["draftId"],
            "workflowId": created["workflowId"],
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Review request"},
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
            "processFields": [
                {
                    "kind": "shortText",
                    "label": "Requester name",
                    "helpText": "Use the full name.",
                    "placeholder": "Example: Ana Perez",
                    "minimumLength": 1,
                    "maximumLength": 32,
                }
            ],
            "formBindings": [
                {
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                }
            ],
        },
        idempotency_key="workflow-save-1",
        request_hash=_request_hash("workflow-save-1"),
    )
    task = TaskOccurrence.objects.create(
        organization_id=tenant_context.organization_id,
        workflow_id=created["workflowId"],
        task_element_id="task-1",
        assignee_membership_id=tenant_context.membership_id,
        assignee_user_id=tenant_context.user_id,
        status="assigned",
        definition_revision="2",
        revision="1",
    )
    return tenant_context, created, task


@pytest.mark.django_db(transaction=True)
def test_task_form_save_commits_one_value_audit_and_idempotency_result(django_user_model) -> None:
    _integration_only()
    tenant_context, _created, task = _seed_task_form(django_user_model)

    saved = save_task_form_draft(
        tenant_context=tenant_context,
        task_id=task.id,
        expected_task_revision="1",
        controls=[{"controlId": "binding-1", "fieldId": "field-1", "value": "Ana Perez"}],
        idempotency_key="task-form-save-1",
        request_hash=_request_hash("task-form-save-1"),
    )

    assert saved["taskRevision"] == "2"
    assert saved["status"] == "in_progress"
    assert TaskProcessFieldValue.objects.get(task=task, field_id="field-1").value_text == "Ana Perez"
    assert CommandResult.objects.filter(
        command_type="workflow-runtime.save-task-form-draft",
        idempotency_key="task-form-save-1",
    ).count() == 1
    assert TransactionalAuditRecord.objects.filter(
        command_type="workflow-runtime.save-task-form-draft",
        event_type="workflow-runtime.task-draft-saved",
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_invalid_task_form_save_keeps_prior_value_intact(django_user_model) -> None:
    _integration_only()
    tenant_context, _created, task = _seed_task_form(django_user_model)
    save_task_form_draft(
        tenant_context=tenant_context,
        task_id=task.id,
        expected_task_revision="1",
        controls=[{"controlId": "binding-1", "fieldId": "field-1", "value": "Ana Perez"}],
        idempotency_key="task-form-save-1",
        request_hash=_request_hash("task-form-save-1"),
    )

    with pytest.raises(TaskFormValidationAPIError) as exc_info:
        save_task_form_draft(
            tenant_context=tenant_context,
            task_id=task.id,
            expected_task_revision="2",
            controls=[{"controlId": "binding-1", "fieldId": "field-1", "value": ""}],
            idempotency_key="task-form-save-2",
            request_hash=_request_hash("task-form-save-2"),
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "controls.binding-1.value",
            "code": "too_short",
            "reason": "Use at least 1 character for this field.",
        }
    ]
    assert TaskProcessFieldValue.objects.get(task=task, field_id="field-1").value_text == "Ana Perez"


@pytest.mark.django_db(transaction=True)
def test_task_form_read_hides_cross_tenant_task_existence(django_user_model) -> None:
    _integration_only()
    tenant_context_a, _created_a, task_a = _seed_task_form(django_user_model)
    tenant_context_b, _created_b, _task_b = _seed_task_form(django_user_model)

    assert read_task_form(tenant_context=tenant_context_a, task_id=task_a.id) is not None
    assert read_task_form(tenant_context=tenant_context_b, task_id=task_a.id) is None


@pytest.mark.django_db(transaction=True)
def test_task_form_becomes_unavailable_when_the_workflow_draft_revision_moves(django_user_model) -> None:
    _integration_only()
    tenant_context, created, task = _seed_task_form(django_user_model)
    draft = WorkflowDraft.objects.get(workflow_id=created["workflowId"])
    draft.revision = "3"
    draft.document["processFields"][0]["label"] = "Changed after assignment"
    draft.save(update_fields=["revision", "document", "updated_at"])

    assert read_task_form(tenant_context=tenant_context, task_id=task.id) is None
    with pytest.raises(TaskFormRevisionConflictError) as exc_info:
        save_task_form_draft(
            tenant_context=tenant_context,
            task_id=task.id,
            expected_task_revision="1",
            controls=[{"controlId": "binding-1", "fieldId": "field-1", "value": "Ana Perez"}],
            idempotency_key="task-form-save-definition-mismatch",
            request_hash=_request_hash("task-form-save-definition-mismatch"),
        )

    assert exc_info.value.invalid_params == [
        {
            "name": "nonFieldErrors",
            "code": "definition_revision_mismatch",
            "reason": "Reload the assigned task before saving again.",
        }
    ]
