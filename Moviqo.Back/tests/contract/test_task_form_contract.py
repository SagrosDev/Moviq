from __future__ import annotations

import uuid

import pytest
from django.test import Client

from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.models import (
    WorkflowDefinition,
    WorkflowDraft,
    WorkflowVersion,
)
from moviqo.modules.workflow_runtime.models import (
    ProcessInstance,
    TaskOccurrence,
    TaskProcessFieldValue,
)


@pytest.fixture
def assigned_task_member(django_user_model):
    user = django_user_model.objects.create_user(
        username="task-member",
        email="task-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Task Member",
    )
    organization = Organization.objects.create(
        slug="task-form-org",
        display_name="Task Form Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.MEMBER,
    )
    workflow = WorkflowDefinition.objects.create(
        organization=organization,
        name="Workflow intake",
        normalized_name="workflow intake",
        draft_schema_version=3,
        created_by_membership_id=membership.id,
        created_by_user_id=user.id,
    )
    WorkflowDraft.objects.create(
        organization=organization,
        workflow=workflow,
        revision="2",
        document={
            "schemaVersion": 3,
            "draftId": "draft-1",
            "workflowId": str(workflow.id),
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
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                    "helpText": "Use the full name.",
                    "placeholder": "Example: Ana Perez",
                    "defaultValue": None,
                    "minimumLength": 1,
                    "maximumLength": 32,
                }
            ],
            "formBindings": [
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                    "label": None,
                }
            ],
        },
    )
    workflow_version = WorkflowVersion.objects.create(
        organization=organization,
        workflow=workflow,
        version_number=1,
        source_draft_revision="2",
        snapshot_schema_version=3,
        snapshot=WorkflowDraft.objects.get(workflow=workflow).document,
        published_by_membership_id=membership.id,
        published_by_user_id=user.id,
    )
    process = ProcessInstance.objects.create(
        organization=organization,
        workflow=workflow,
        workflow_version=workflow_version,
        initiator_membership_id=membership.id,
        initiator_user_id=user.id,
    )
    task = TaskOccurrence.objects.create(
        organization=organization,
        workflow=workflow,
        workflow_version=workflow_version,
        process=process,
        task_element_id="task-1",
        assignee_membership_id=membership.id,
        assignee_user_id=user.id,
        status="assigned",
        definition_revision="2",
        revision="1",
    )
    return user, organization, membership, workflow, task


@pytest.mark.django_db
def test_task_form_read_returns_authorized_projection(assigned_task_member) -> None:
    user, _organization, _membership, workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 200
    assert response.json() == {
        "taskId": str(task.id),
        "processId": str(task.process_id),
        "workflowId": str(workflow.id),
        "workflowVersionId": str(task.workflow_version_id),
        "workflowName": "Workflow intake",
        "taskTitle": "Review request",
        "taskElementId": "task-1",
        "status": "assigned",
        "taskRevision": "1",
        "definitionRevision": "2",
        "actions": {"saveDraft": True, "complete": True},
        "form": {
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                    "helpText": "Use the full name.",
                    "placeholder": "Example: Ana Perez",
                    "width": "full",
                    "position": 0,
                    "value": "",
                    "required": True,
                }
            ],
            "items": [
                {
                    "itemId": "binding-1",
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                    "helpText": "Use the full name.",
                    "placeholder": "Example: Ana Perez",
                    "width": "full",
                    "position": 0,
                    "value": "",
                    "required": True,
                }
            ]
        },
    }


@pytest.mark.django_db
def test_task_form_projection_preserves_structural_items_without_runtime_values(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    version = task.workflow_version
    snapshot = dict(version.snapshot)
    snapshot["schemaVersion"] = 8
    snapshot["formBindings"] = [
        {
            "id": "heading-1",
            "kind": "heading",
            "taskElementId": "task-1",
            "position": 0,
            "width": "full",
            "content": "Request details",
        },
        {
            "id": "binding-1",
            "kind": "field",
            "taskElementId": "task-1",
            "fieldId": "field-1",
            "position": 1,
            "width": "half",
            "label": None,
        },
        {
            "id": "divider-1",
            "kind": "divider",
            "taskElementId": "task-1",
            "position": 2,
            "width": "quarter",
        },
    ]
    WorkflowVersion.objects.filter(pk=version.pk).update(
        snapshot=snapshot,
        snapshot_schema_version=8,
    )
    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 200
    assert response.json()["form"]["items"] == [
        {
            "itemId": "heading-1",
            "kind": "heading",
            "content": "Request details",
            "position": 0,
            "width": "full",
        },
        {
            "itemId": "binding-1",
            "controlId": "binding-1",
            "fieldId": "field-1",
            "kind": "shortText",
            "label": "Requester name",
            "helpText": "Use the full name.",
            "placeholder": "Example: Ana Perez",
            "position": 1,
            "width": "half",
            "value": "",
            "required": True,
        },
        {
            "itemId": "divider-1",
            "kind": "divider",
            "position": 2,
            "width": "quarter",
        },
    ]
    assert "fieldId" not in response.json()["form"]["items"][0]
    assert "value" not in response.json()["form"]["items"][0]


@pytest.mark.django_db
@pytest.mark.parametrize("binding_label", ["", "\u200b\u0301\u2028"])
def test_task_form_projection_hides_nonmeaningful_binding_labels_with_accessible_fallback(
    assigned_task_member,
    binding_label,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    version = task.workflow_version
    snapshot = dict(version.snapshot)
    snapshot["formBindings"] = [
        {**snapshot["formBindings"][0], "label": binding_label}
    ]
    WorkflowVersion.objects.filter(pk=version.pk).update(snapshot=snapshot)
    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 200
    control = response.json()["form"]["controls"][0]
    assert control["label"] == "Requester name"
    assert control["labelVisuallyHidden"] is True
    item = response.json()["form"]["items"][0]
    assert item["label"] == "Requester name"
    assert item["labelVisuallyHidden"] is True


@pytest.mark.django_db
def test_task_form_save_persists_valid_short_text_without_completion(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-1"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"
    assert response.json()["taskRevision"] == "2"
    assert response.json()["form"]["controls"][0]["value"] == "Ana Perez"
    stored_value = TaskProcessFieldValue.objects.get(task=task, field_id="field-1")
    assert stored_value.value_text == "Ana Perez"


@pytest.mark.django_db
def test_task_form_save_rejects_invalid_length_with_field_level_feedback(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    TaskProcessFieldValue.objects.create(
        organization_id=task.organization_id,
        task=task,
        field_id="field-1",
        value_text="Ana Perez",
    )
    client = Client()
    client.force_login(user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-2"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "task_form_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "controls.binding-1.value",
            "code": "too_short",
            "reason": "Use at least 1 character for this field.",
        }
    ]
    stored_value = TaskProcessFieldValue.objects.get(task=task, field_id="field-1")
    assert stored_value.value_text == "Ana Perez"


@pytest.mark.django_db
def test_task_form_save_rejects_missing_visible_controls(assigned_task_member) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-missing-controls"},
    )

    assert response.status_code == 400
    assert response.json()["invalidParams"] == [
        {
            "name": "controls.binding-1.value",
            "code": "missing",
            "reason": "Submit every visible field when saving this task.",
        }
    ]


@pytest.mark.django_db
def test_task_form_save_hides_cross_tenant_task_existence(
    assigned_task_member,
    django_user_model,
) -> None:
    _user, _organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="other-member",
        email="other-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Member",
    )
    other_organization = Organization.objects.create(
        slug="other-task-form-org",
        display_name="Other Task Form Org",
    )
    Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(other_user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Cross tenant",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-cross-tenant"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_read_hides_same_organization_non_assignee_task(
    assigned_task_member,
    django_user_model,
) -> None:
    _user, organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="same-org-other-member",
        email="same-org-other-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Member",
    )
    Membership.objects.create(
        organization=organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(other_user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_save_hides_same_organization_non_assignee_task(
    assigned_task_member,
    django_user_model,
) -> None:
    _user, organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="same-org-other-saver",
        email="same-org-other-saver@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Saver",
    )
    Membership.objects.create(
        organization=organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(other_user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Same organization guess",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-same-org-non-assignee"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_save_rejects_stale_task_revision(assigned_task_member) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    accepted = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-stale-1"},
    )
    assert accepted.status_code == 200

    stale = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Maria Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-stale-2"},
    )

    assert stale.status_code == 409
    assert stale.json()["code"] == "task_form_revision_conflict"


@pytest.mark.django_db
def test_task_form_read_hides_closed_task_existence(assigned_task_member) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    task.status = "completed"
    task.save(update_fields=["status", "updated_at"])
    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"


@pytest.mark.django_db
def test_task_form_save_hides_closed_task_existence(assigned_task_member) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    task.status = "completed"
    task.save(update_fields=["status", "updated_at"])
    client = Client()
    client.force_login(user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-closed-task"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_save_hides_reassigned_task_existence(
    assigned_task_member,
    django_user_model,
) -> None:
    user, organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="reassigned-member",
        email="reassigned-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Reassigned Member",
    )
    other_membership = Membership.objects.create(
        organization=organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    task.assignee_membership_id = other_membership.id
    task.assignee_user_id = other_user.id
    task.save(update_fields=["assignee_membership_id", "assignee_user_id", "updated_at"])
    client = Client()
    client.force_login(user)

    response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-reassigned-task"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_save_replays_the_same_idempotency_key_without_advancing_again(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)
    payload = {
        "expectedTaskRevision": "1",
        "controls": [
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": "Ana Perez",
            }
        ],
    }

    first = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-replay"},
    )
    second = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-replay"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json() == first.json()
    task.refresh_from_db()
    assert task.revision == "2"
    assert CommandResult.objects.filter(
        command_type="workflow-runtime.save-task-form-draft",
        idempotency_key="task-form-save-replay",
    ).count() == 1


@pytest.mark.django_db
def test_task_form_complete_finishes_the_task_and_process_once(
    assigned_task_member,
) -> None:
    user, _organization, _membership, workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-1"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "taskId": str(task.id),
        "processId": str(task.process_id),
        "workflowId": str(workflow.id),
        "workflowVersionId": str(task.workflow_version_id),
        "workflowName": "Workflow intake",
        "taskTitle": "Review request",
        "taskStatus": "completed",
        "processStatus": "completed",
        "taskRevision": "2",
        "definitionRevision": "2",
        "routeTargetId": "end-1",
        "completedAt": response.json()["completedAt"],
        "destinationRoute": "/my-work",
        "handoffMessage": "The task is complete and this process reached its end.",
    }
    task.refresh_from_db()
    task.process.refresh_from_db()
    assert task.status == "completed"
    assert task.completed_at is not None
    assert task.process.status == "completed"
    assert task.process.completed_at is not None
    assert (
        TaskProcessFieldValue.objects.get(task=task, field_id="field-1").value_text
        == "Ana Perez"
    )


@pytest.mark.django_db
def test_task_form_read_disables_completion_when_authoritative_route_is_unavailable(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    task.workflow_version.snapshot["connections"] = [
        {
            "id": "connection-1",
            "type": "sequence",
            "sourceId": "start-1",
            "targetId": "task-1",
        }
    ]
    WorkflowVersion.objects.filter(id=task.workflow_version_id).update(
        snapshot=task.workflow_version.snapshot
    )
    client = Client()
    client.force_login(user)

    response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")

    assert response.status_code == 200
    assert response.json()["actions"] == {"saveDraft": True, "complete": False}


@pytest.mark.django_db
def test_task_form_complete_rejects_invalid_values_without_partial_state(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    TaskProcessFieldValue.objects.create(
        organization_id=task.organization_id,
        task=task,
        field_id="field-1",
        value_text="Ana Perez",
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-invalid"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "task_form_invalid"
    task.refresh_from_db()
    task.process.refresh_from_db()
    assert task.status == "assigned"
    assert task.revision == "1"
    assert task.process.status == "active"
    assert (
        TaskProcessFieldValue.objects.get(task=task, field_id="field-1").value_text
        == "Ana Perez"
    )


@pytest.mark.django_db
def test_completed_task_is_hidden_from_open_form_contract_after_completion(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)

    accepted = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-close"},
    )
    assert accepted.status_code == 200

    read_response = client.get(f"/api/v1/my-work/tasks/{task.id}/form/")
    save_response = client.put(
        f"/api/v1/my-work/tasks/{task.id}/form/",
        data={
            "expectedTaskRevision": "2",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Maria Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-save-after-complete"},
    )

    assert read_response.status_code == 404
    assert save_response.status_code == 404


@pytest.mark.django_db
def test_completing_a_task_assigns_the_next_linear_task_from_its_own_assignment(
    assigned_task_member,
) -> None:
    user, _organization, membership, _workflow, task = assigned_task_member
    version = task.workflow_version
    snapshot = dict(version.snapshot)
    snapshot["schemaVersion"] = 7
    snapshot["elements"] = [
        {"id": "start-1", "type": "start", "label": "Start"},
        {
            "id": "task-1",
            "type": "task",
            "label": "Review request",
            "assignment": {"mode": "workflowInitiator", "membershipId": None},
        },
        {
            "id": "task-2",
            "type": "task",
            "label": "Archive request",
            "assignment": {
                "mode": "specificMember",
                "membershipId": str(membership.id),
            },
        },
        {"id": "end-1", "type": "end", "label": "End"},
    ]
    snapshot["connections"] = [
        {"id": "connection-1", "type": "sequence", "sourceId": "start-1", "targetId": "task-1"},
        {"id": "connection-2", "type": "sequence", "sourceId": "task-1", "targetId": "task-2"},
        {"id": "connection-3", "type": "sequence", "sourceId": "task-2", "targetId": "end-1"},
    ]
    snapshot["formBindings"] = [
        *snapshot["formBindings"],
        {
            "id": "binding-2",
            "taskElementId": "task-2",
            "fieldId": "field-1",
            "position": 0,
            "width": "full",
            "label": None,
        },
    ]
    WorkflowVersion.objects.filter(id=version.id).update(
        snapshot=snapshot,
        snapshot_schema_version=7,
    )
    task.process.initiator_membership_id = uuid.uuid4()
    task.process.save(update_fields=["initiator_membership_id"])
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Ana Perez",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-next-task"},
    )

    assert response.status_code == 200
    task.process.refresh_from_db()
    next_task = TaskOccurrence.objects.get(
        process=task.process,
        task_element_id="task-2",
    )
    assert task.process.status == "active"
    assert next_task.status == "assigned"
    assert next_task.assignee_membership_id == membership.id
    assert TaskProcessFieldValue.objects.get(
        task=next_task,
        field_id="field-1",
    ).value_text == "Ana Perez"


@pytest.mark.django_db
def test_task_form_complete_hides_cross_tenant_task_existence(
    assigned_task_member,
    django_user_model,
) -> None:
    _user, _organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="cross-tenant-completer",
        email="cross-tenant-completer@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Cross Tenant Completer",
    )
    other_organization = Organization.objects.create(
        slug="cross-tenant-completion-org",
        display_name="Cross Tenant Completion Org",
    )
    Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(other_user)

    response = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Cross Tenant",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-cross-tenant"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_complete_hides_same_organization_non_assignee_task(
    assigned_task_member,
    django_user_model,
) -> None:
    _user, organization, _membership, _workflow, task = assigned_task_member
    other_user = django_user_model.objects.create_user(
        username="same-org-other-completer",
        email="same-org-other-completer@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Completer",
    )
    Membership.objects.create(
        organization=organization,
        user=other_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(other_user)

    response = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Same Org Guess",
                }
            ],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-same-org-non-assignee"},
    )

    assert response.status_code == 404
    payload = response.content.decode("utf-8")
    assert str(task.id) not in payload


@pytest.mark.django_db
def test_task_form_complete_replays_the_same_idempotency_key_without_duplicate_audit(
    assigned_task_member,
) -> None:
    user, _organization, _membership, _workflow, task = assigned_task_member
    client = Client()
    client.force_login(user)
    payload = {
        "expectedTaskRevision": "1",
        "controls": [
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": "Ana Perez",
            }
        ],
    }

    first = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-replay"},
    )
    second = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-replay"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json() == first.json()
    assert CommandResult.objects.filter(
        command_type="workflow-runtime.complete-task",
        idempotency_key="task-form-complete-replay",
    ).count() == 1
    assert TransactionalAuditRecord.objects.filter(
        event_type="workflow-runtime.task-completed",
    ).count() == 1
    assert TransactionalAuditRecord.objects.filter(
        event_type="workflow-runtime.process-completed",
    ).count() == 1


@pytest.mark.django_db
def test_task_form_complete_rejects_reused_key_for_a_different_task(
    assigned_task_member,
) -> None:
    user, organization, membership, workflow, task = assigned_task_member
    process = ProcessInstance.objects.create(
        organization=organization,
        workflow=workflow,
        workflow_version=task.workflow_version,
        initiator_membership_id=membership.id,
        initiator_user_id=user.id,
    )
    second_task = TaskOccurrence.objects.create(
        organization=organization,
        workflow=workflow,
        workflow_version=task.workflow_version,
        process=process,
        task_element_id="task-1",
        assignee_membership_id=membership.id,
        assignee_user_id=user.id,
        status="assigned",
        definition_revision="2",
        revision="1",
    )
    client = Client()
    client.force_login(user)
    payload = {
        "expectedTaskRevision": "1",
        "controls": [
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": "Ana Perez",
            }
        ],
    }

    first = client.post(
        f"/api/v1/my-work/tasks/{task.id}/complete/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-reused-other-task"},
    )
    second = client.post(
        f"/api/v1/my-work/tasks/{second_task.id}/complete/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "task-form-complete-reused-other-task"},
    )

    assert first.status_code == 200
    assert second.status_code == 409
    assert second.json()["code"] == "idempotency_key_reused"
