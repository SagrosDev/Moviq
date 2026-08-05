from __future__ import annotations

import pytest
from django.test import Client

from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


@pytest.fixture
def workflow_design_member(django_user_model):
    user = django_user_model.objects.create_user(
        username="workflow-designer",
        email="designer@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Designer",
    )
    organization = Organization.objects.create(
        slug="workflow-design-org",
        display_name="Workflow Design Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.DESIGNER,
    )
    return user, organization, membership


@pytest.mark.django_db
def test_workflow_creation_returns_authoritative_draft_payload(workflow_design_member) -> None:
    user, organization, membership = workflow_design_member
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["workflowId"]
    assert payload["name"] == "Workflow intake"
    assert payload["createdByMembershipId"] == str(membership.id)
    assert payload["organizationId"] == str(organization.id)
    assert payload["revision"] == "1"
    assert payload["draft"] == {
        "schemaVersion": 3,
        "draftId": payload["draft"]["draftId"],
        "workflowId": payload["workflowId"],
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
        "connections": [],
        "processFields": [],
        "formBindings": [],
    }


@pytest.mark.django_db
def test_workflow_creation_rejects_duplicate_name_in_same_organization(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    first = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    assert first.status_code == 201

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-2"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "workflow_name_conflict"
    assert response.json()["invalidParams"] == [
        {
            "name": "name",
            "code": "duplicate",
            "reason": "Use a different workflow name before continuing.",
        }
    ]


@pytest.mark.django_db
def test_workflow_creation_requires_idempotency_key(workflow_design_member) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_name_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "idempotencyKey",
            "code": "required",
            "reason": "Provide an idempotency key to continue.",
        }
    ]


@pytest.mark.django_db
def test_workflow_creation_rejects_overlong_name_with_stable_problem_details(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "x" * 121},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_name_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "name",
            "code": "too_long",
            "reason": "Use 120 characters or fewer for the workflow name.",
        }
    ]


@pytest.mark.django_db
def test_workflow_creation_rejects_member_role(django_user_model) -> None:
    user = django_user_model.objects.create_user(
        username="workflow-member",
        email="member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Member",
    )
    organization = Organization.objects.create(
        slug="workflow-member-org",
        display_name="Workflow Member Org",
    )
    Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )

    assert response.status_code == 403
    assert response.json()["code"] == "workflow_design_forbidden"


@pytest.mark.django_db
def test_workflow_creation_ignores_hostile_tenant_identifiers(workflow_design_member) -> None:
    user, organization, _membership = workflow_design_member
    other_user = user.__class__.objects.create_user(
        username="workflow-other-owner",
        email="other-owner@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Owner",
    )
    other_organization = Organization.objects.create(
        slug="workflow-other-org",
        display_name="Workflow Other Org",
    )
    other_membership = Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=MembershipRole.OWNER,
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        (
            f"/api/v1/workflow-design/workflows/?organizationId={other_organization.id}"
            f"&membershipId={other_membership.id}"
        ),
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )

    assert response.status_code == 201
    assert response.json()["organizationId"] == str(organization.id)
    assert str(other_organization.id) not in response.content.decode("utf-8")
    assert str(other_membership.id) not in response.content.decode("utf-8")


@pytest.mark.django_db
def test_workflow_catalog_lists_authorized_workflows(workflow_design_member) -> None:
    user, organization, membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    assert created.status_code == 201

    response = client.get("/api/v1/workflow-design/workflows/")

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "workflowId": created.json()["workflowId"],
                "name": "Workflow intake",
                "revision": "1",
                "schemaVersion": 3,
                "updatedAt": response.json()["items"][0]["updatedAt"],
            }
        ]
    }
    assert str(organization.id) not in response.content.decode("utf-8")
    assert str(membership.id) not in response.content.decode("utf-8")


@pytest.mark.django_db
def test_workflow_draft_detail_returns_authoritative_server_payload(
    workflow_design_member,
) -> None:
    user, organization, membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]

    response = client.get(f"/api/v1/workflow-design/workflows/{workflow_id}/draft/")

    assert response.status_code == 200
    assert response.json() == {
        "workflowId": workflow_id,
        "organizationId": str(organization.id),
        "createdByMembershipId": str(membership.id),
        "name": "Workflow intake",
        "revision": "1",
        "draft": {
            "schemaVersion": 3,
            "draftId": response.json()["draft"]["draftId"],
            "workflowId": workflow_id,
            "name": "Workflow intake",
            "status": "draft",
            "elements": [],
            "connections": [],
            "processFields": [],
            "formBindings": [],
        },
    }


@pytest.mark.django_db
def test_workflow_draft_save_returns_authoritative_graph_payload(
    workflow_design_member,
) -> None:
    user, organization, membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 3,
                "draftId": draft_id,
                "workflowId": workflow_id,
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
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "workflowId": workflow_id,
        "organizationId": str(organization.id),
        "createdByMembershipId": str(membership.id),
        "name": "Workflow intake",
        "revision": "2",
        "draft": {
            "schemaVersion": 3,
            "draftId": draft_id,
            "workflowId": workflow_id,
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
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                    "helpText": "",
                    "placeholder": "",
                    "defaultValue": None,
                    "minimumLength": 0,
                    "maximumLength": 255,
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
    }


@pytest.mark.django_db
def test_workflow_draft_save_rejects_invalid_graph_with_stable_problem_details(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 3,
                "draftId": draft_id,
                "workflowId": workflow_id,
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                ],
                "connections": [],
                "processFields": [],
                "formBindings": [],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "elements",
            "code": "end_count_invalid",
            "reason": "Add exactly one End step before saving the workflow.",
        },
        {
            "name": "elements.start-1",
            "code": "start_outgoing_invalid",
            "reason": "Connect Start to exactly one Task step.",
        },
        {
            "name": "elements.task-1",
            "code": "task_incoming_required",
            "reason": "Connect this Task from Start or another Task.",
        },
        {
            "name": "elements.task-1",
            "code": "task_outgoing_invalid",
            "reason": "Connect this Task to one next step before saving.",
        },
    ]


@pytest.mark.django_db
def test_workflow_draft_save_rejects_invalid_short_text_constraints(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 3,
                "draftId": draft_id,
                "workflowId": workflow_id,
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
                        "minimumLength": 10,
                        "maximumLength": 8,
                    }
                ],
                "formBindings": [],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "processFields.field-1.minimumLength",
            "code": "greater_than_maximum",
            "reason": "Use a minimum length that is not greater than maximum length.",
        }
    ]


@pytest.mark.django_db
def test_workflow_draft_save_rejects_binding_to_second_task(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 3,
                "draftId": draft_id,
                "workflowId": workflow_id,
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                    {"id": "task-2", "type": "task", "label": "Task 2"},
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
                        "targetId": "task-2",
                    },
                    {
                        "id": "connection-3",
                        "type": "sequence",
                        "sourceId": "task-2",
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
                        "taskElementId": "task-2",
                        "fieldId": "field-1",
                    }
                ],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "formBindings.binding-1.taskElementId",
            "code": "binding_not_first_task",
            "reason": "Add this field only to the first Task step in this story.",
        }
    ]


@pytest.mark.django_db
def test_workflow_draft_save_rejects_stale_revision(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    first_save = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 2,
                "draftId": draft_id,
                "workflowId": workflow_id,
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
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert first_save.status_code == 200

    stale_response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 2,
                "draftId": draft_id,
                "workflowId": workflow_id,
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                ],
                "connections": [],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-2"},
    )

    assert stale_response.status_code == 409
    assert stale_response.json()["code"] == "workflow_draft_revision_conflict"
    assert stale_response.json()["invalidParams"] == [
        {
            "name": "expectedRevision",
            "code": "stale",
            "reason": "Reload the last saved draft before saving again.",
        }
    ]


@pytest.mark.django_db
def test_workflow_draft_save_rejects_blank_graph_identifiers(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)

    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 2,
                "draftId": draft_id,
                "workflowId": workflow_id,
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                    {"id": "end-1", "type": "end", "label": "End"},
                ],
                "connections": [
                    {
                        "id": "connection-1",
                        "type": "sequence",
                        "sourceId": "",
                        "targetId": "task-1",
                    }
                ],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "draft",
            "code": "invalid",
            "reason": "Workflow draft field 'id' cannot be blank.",
        }
    ]
