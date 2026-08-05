from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import hashlib
import threading
import uuid

import pytest
from django.conf import settings
from django.db import close_old_connections

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.application import (
    create_workflow_definition,
    save_workflow_draft,
    validate_workflow_publication,
)
from moviqo.modules.workflow_design.application.services import WorkflowDraftValidationAPIError
from moviqo.modules.workflow_design.application.services import (
    WorkflowDraftRevisionConflictError,
)
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
            "schemaVersion": 3,
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
            "processFields": [
                {
                    "kind": "shortText",
                    "label": "Requester name",
                }
            ],
            "formBindings": [
                {
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                }
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
    assert len(audit_records) == 7
    assert {record.event_type for record in audit_records} == {
        "workflow-design.graph-element-added",
        "workflow-design.graph-connection-added",
        "workflow-design.process-field-created",
        "workflow-design.process-field-bound",
    }
    assert any(record.payload.get("elementId") == "start-1" for record in audit_records)
    assert any(record.payload.get("connectionId") == "connection-1" for record in audit_records)
    assert any(record.payload.get("fieldId") == "field-1" for record in audit_records)

    updated = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="2",
        draft={
            "schemaVersion": 3,
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
            "processFields": [
                {
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "Requester full name",
                }
            ],
            "formBindings": [
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                }
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
    assert TransactionalAuditRecord.objects.filter(
        command_type="workflow-design.save-draft",
        event_type="workflow-design.process-field-updated",
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_accepted_graph_save_replays_one_committed_revision(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    created = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )
    request_hash = _request_hash("workflow-save-replay")
    draft_payload = {
        "schemaVersion": 3,
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
        "processFields": [],
        "formBindings": [],
    }

    first = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft=draft_payload,
        idempotency_key="workflow-save-replay",
        request_hash=request_hash,
    )
    second = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft=draft_payload,
        idempotency_key="workflow-save-replay",
        request_hash=request_hash,
    )

    assert first == second
    assert WorkflowDraft.objects.get(workflow_id=created["workflowId"]).revision == "2"
    assert CommandResult.objects.filter(
        command_type="workflow-design.save-draft",
        idempotency_key="workflow-save-replay",
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_concurrent_stale_graph_save_rejects_the_loser_without_partial_overwrite(
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
    start_gate = threading.Event()

    def attempt_save(task_label: str, idempotency_key: str) -> tuple[str, str]:
        close_old_connections()
        draft_payload = {
            "schemaVersion": 3,
            "draftId": created["draft"]["draftId"],
            "workflowId": created["workflowId"],
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": task_label},
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
            "processFields": [],
            "formBindings": [],
        }
        start_gate.wait()
        try:
            accepted = save_workflow_draft(
                tenant_context=tenant_context,
                workflow_id=created["workflowId"],
                expected_revision="1",
                draft=draft_payload,
                idempotency_key=idempotency_key,
                request_hash=_request_hash(idempotency_key),
            )
            return ("accepted", accepted["draft"]["elements"][1]["label"])
        except WorkflowDraftRevisionConflictError:
            return ("conflict", task_label)
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=2) as executor:
        first_future = executor.submit(attempt_save, "Task A", "workflow-save-a")
        second_future = executor.submit(attempt_save, "Task B", "workflow-save-b")
        start_gate.set()
        first = first_future.result()
        second = second_future.result()

    results = [first, second]
    accepted = [result for result in results if result[0] == "accepted"]
    conflicted = [result for result in results if result[0] == "conflict"]

    assert len(accepted) == 1
    assert len(conflicted) == 1

    draft = WorkflowDraft.objects.get(workflow_id=created["workflowId"])
    assert draft.revision == "2"
    assert draft.document["elements"][1]["label"] == accepted[0][1]
    assert draft.document["elements"][1]["label"] != conflicted[0][1]


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
                "schemaVersion": 3,
                "draftId": created["draft"]["draftId"],
                "workflowId": created["workflowId"],
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                ],
                "connections": [],
                "processFields": [
                    {
                        "kind": "shortText",
                        "label": "Requester name",
                        "maximumLength": 400,
                    }
                ],
                "formBindings": [],
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
        event_type="workflow-design.draft-edit-rejected",
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
        "schemaVersion": 3,
        "draftId": created["draft"]["draftId"],
        "workflowId": created["workflowId"],
        "name": "Workflow intake",
        "status": "draft",
        "elements": [
            {"id": "start-1", "type": "start", "label": "Start"},
            {"id": "task-1", "type": "task", "label": "Task"},
        ],
        "connections": [],
        "processFields": [],
        "formBindings": [],
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
        event_type="workflow-design.draft-edit-rejected",
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_rebinding_keeps_same_field_id_without_duplicate_definition(
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
    base_draft = {
        "schemaVersion": 3,
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
        "processFields": [{"kind": "shortText", "label": "Requester name"}],
        "formBindings": [{"taskElementId": "task-1", "fieldId": "field-1"}],
    }

    first_save = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft=base_draft,
        idempotency_key="workflow-save-1",
        request_hash=_request_hash("workflow-save-1"),
    )
    removed_binding = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="2",
        draft={**first_save["draft"], "formBindings": []},
        idempotency_key="workflow-save-2",
        request_hash=_request_hash("workflow-save-2"),
    )
    rebound = save_workflow_draft(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="3",
        draft={
            **removed_binding["draft"],
            "formBindings": [{"taskElementId": "task-1", "fieldId": "field-1"}],
        },
        idempotency_key="workflow-save-3",
        request_hash=_request_hash("workflow-save-3"),
    )

    assert rebound["draft"]["processFields"] == [
        {
            "id": "field-1",
            "kind": "shortText",
            "label": "Requester name",
            "helpText": "",
            "placeholder": "",
            "defaultValue": None,
            "minimumLength": 0,
            "maximumLength": 255,
        }
    ]
    assert len(rebound["draft"]["formBindings"]) == 1
    assert rebound["draft"]["formBindings"][0]["fieldId"] == "field-1"


@pytest.mark.django_db(transaction=True)
def test_publication_validation_does_not_advance_revision_and_is_deterministic(
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
            "schemaVersion": 3,
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
            "processFields": [
                {
                    "kind": "shortText",
                    "label": "Requester name",
                }
            ],
            "formBindings": [
                {
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                }
            ],
        },
        idempotency_key="workflow-save-1",
        request_hash=_request_hash("workflow-save-1"),
    )

    first = validate_workflow_publication(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="2",
        draft=saved["draft"],
        idempotency_key="workflow-validate-1",
        request_hash=_request_hash("workflow-validate-1"),
    )
    second = validate_workflow_publication(
        tenant_context=tenant_context,
        workflow_id=created["workflowId"],
        expected_revision="2",
        draft=saved["draft"],
        idempotency_key="workflow-validate-2",
        request_hash=_request_hash("workflow-validate-2"),
    )

    draft = WorkflowDraft.objects.get(workflow_id=created["workflowId"])
    assert draft.revision == "2"
    assert saved["revision"] == "2"
    assert first == second
    assert first["revision"] == "2"
    assert [issue["code"] for issue in first["issues"]] == [
        "starter_missing",
        "assignment_missing",
    ]
