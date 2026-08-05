from __future__ import annotations

import hashlib
import uuid

import pytest
from django.conf import settings

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.application import (
    create_workflow_definition,
    save_workflow_draft,
)
from moviqo.modules.workflow_design.application.services import WorkflowDraftValidationAPIError
from moviqo.modules.workflow_design.models import WorkflowDefinition, WorkflowDraft


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("PostgreSQL integration settings are required for workflow-design coverage.")


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(django_user_model) -> TenantContext:
    user = django_user_model.objects.create_user(username=f"user-{uuid.uuid4().hex[:8]}")
    organization = Organization.objects.create(
        slug=f"org-{uuid.uuid4().hex[:8]}",
        display_name="Workflow Design Org",
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


@pytest.mark.django_db(transaction=True)
def test_workflow_creation_replays_one_committed_result(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    request_hash = _request_hash("Workflow intake")

    first = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=request_hash,
    )
    second = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=request_hash,
    )

    assert first == second
    assert WorkflowDefinition.objects.count() == 1
    assert WorkflowDraft.objects.count() == 1
    assert TransactionalAuditRecord.objects.count() == 1
    assert CommandResult.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_workflow_creation_rejects_stale_idempotency_key_reuse(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )

    with pytest.raises(IdempotencyKeyReuseConflict):
        create_workflow_definition(
            tenant_context=tenant_context,
            name="Workflow approvals",
            idempotency_key="workflow-create-1",
            request_hash=_request_hash("Workflow approvals"),
        )


@pytest.mark.django_db(transaction=True)
def test_workflow_graph_save_advances_revision_once_and_records_semantic_audit(
    django_user_model,
) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )

    saved = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft={
            "schemaVersion": 2,
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
        },
        idempotency_key="workflow-save-1",
        request_hash=_request_hash("workflow-save-1"),
    )

    draft = WorkflowDraft.objects.get(workflow_id=created["workflowId"])
    assert saved["revision"] == "2"
    assert draft.revision == "2"

    audit_records = list(
        TransactionalAuditRecord.objects.filter(
            command_type="workflow-design.save-draft"
        ).order_by("created_at")
    )
    assert len(audit_records) == 5
    assert {record.event_type for record in audit_records} == {
        "workflow-design.graph-element-added",
        "workflow-design.graph-connection-added",
    }
    assert any(record.payload.get("elementId") == "start-1" for record in audit_records)
    assert any(record.payload.get("connectionId") == "connection-1" for record in audit_records)

    updated = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="2",
        draft={
            "schemaVersion": 2,
            "draftId": created["draft"]["draftId"],
            "workflowId": created["workflowId"],
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task review"},
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
        },
        idempotency_key="workflow-save-2",
        request_hash=_request_hash("workflow-save-2"),
    )

    assert updated["revision"] == "3"
    assert TransactionalAuditRecord.objects.filter(
        command_type="workflow-design.save-draft",
        event_type="workflow-design.graph-element-updated",
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_rejected_graph_save_keeps_last_valid_draft_unchanged(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )

    with pytest.raises(WorkflowDraftValidationAPIError) as exc_info:
        save_workflow_draft(
            tenant_context=tenant_context,
            workflow_id=created["workflowId"],
            expected_revision="1",
            draft={
                "schemaVersion": 2,
                "draftId": created["draft"]["draftId"],
                "workflowId": created["workflowId"],
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                ],
                "connections": [],
            },
            idempotency_key="workflow-save-1",
            request_hash=_request_hash("workflow-invalid"),
        )

    draft = WorkflowDraft.objects.get(workflow_id=created["workflowId"])
    assert exc_info.value.default_code == "workflow_draft_invalid"
    assert draft.revision == "1"
    assert draft.document["elements"] == []
    rejection_audit = TransactionalAuditRecord.objects.get(
        command_type="workflow-design.save-draft",
        event_type="workflow-design.graph-edit-rejected",
    )
    assert rejection_audit.payload["draftId"] == created["draft"]["draftId"]


@pytest.mark.django_db(transaction=True)
def test_rejected_graph_save_replays_one_audit_result(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )
    request_hash = _request_hash("workflow-invalid")
    invalid_draft = {
        "schemaVersion": 2,
        "draftId": created["draft"]["draftId"],
        "workflowId": created["workflowId"],
        "name": "Workflow intake",
        "status": "draft",
        "elements": [
            {"id": "start-1", "type": "start", "label": "Start"},
            {"id": "task-1", "type": "task", "label": "Task"},
        ],
        "connections": [],
    }

    for _ in range(2):
        with pytest.raises(WorkflowDraftValidationAPIError):
            save_workflow_draft(
                tenant_context=tenant_context,
                workflow_id=created["workflowId"],
                expected_revision="1",
                draft=invalid_draft,
                idempotency_key="workflow-save-1",
                request_hash=request_hash,
            )

    assert CommandResult.objects.filter(
        command_type="workflow-design.save-draft",
        idempotency_key="workflow-save-1",
    ).count() == 1
    assert TransactionalAuditRecord.objects.filter(
        command_type="workflow-design.save-draft",
        event_type="workflow-design.graph-edit-rejected",
    ).count() == 1
