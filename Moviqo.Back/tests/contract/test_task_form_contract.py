from __future__ import annotations

import pytest
from django.test import Client

from moviqo.modules.governance.models import CommandResult
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.models import WorkflowDefinition, WorkflowDraft
from moviqo.modules.workflow_runtime.models import TaskOccurrence, TaskProcessFieldValue


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
    task = TaskOccurrence.objects.create(
        organization=organization,
        workflow=workflow,
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
        "workflowId": str(workflow.id),
        "workflowName": "Workflow intake",
        "taskTitle": "Review request",
        "taskElementId": "task-1",
        "status": "assigned",
        "taskRevision": "1",
        "definitionRevision": "2",
        "actions": {"saveDraft": True, "complete": False},
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
                }
            ]
        },
    }


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
