from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.test import Client

from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    Team,
    TeamMembership,
)
from moviqo.modules.workflow_design.models import WorkflowVersion


def _publishable_workflow_payload(
    workflow_id: str,
    draft_id: str,
) -> dict[str, object]:
    return {
        "schemaVersion": 4,
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
        "publication": {
            "starter": {
                "mode": "allActiveMembers",
                "teamIds": [],
                "membershipIds": [],
            },
            "assignment": {
                "mode": "workflowInitiator",
                "membershipId": None,
            },
        },
    }


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
    assert payload["configurationDirectory"] == {
        "memberships": [
            {
                "membershipId": str(membership.id),
                "displayName": "Designer",
                "role": MembershipRole.DESIGNER,
            }
        ],
        "teams": [],
    }
    assert payload["draft"] == {
        "schemaVersion": 4,
        "draftId": payload["draft"]["draftId"],
        "workflowId": payload["workflowId"],
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
        "connections": [],
        "processFields": [],
        "formBindings": [],
        "publication": {
            "starter": {
                "mode": "unconfigured",
                "teamIds": [],
                "membershipIds": [],
            },
            "assignment": {
                "mode": "unconfigured",
                "membershipId": None,
            },
        },
    }


@pytest.mark.django_db
def test_workflow_creation_returns_active_team_directory_options(
    workflow_design_member,
    django_user_model,
) -> None:
    user, _organization, membership = workflow_design_member
    teammate = django_user_model.objects.create_user(
        username="workflow-team-member",
        email="team-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Team Member",
    )
    teammate_membership = Membership.objects.create(
        organization=membership.organization,
        user=teammate,
        role=MembershipRole.MEMBER,
    )
    team = Team.objects.create(
        organization=membership.organization,
        name="Operations",
        normalized_name="operations",
    )
    TeamMembership.objects.create(
        organization=membership.organization,
        team=team,
        membership=teammate_membership,
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )

    assert response.status_code == 201
    assert response.json()["configurationDirectory"]["teams"] == [
        {
            "teamId": str(team.id),
            "name": "Operations",
            "activeMemberCount": 1,
            "membershipIds": [str(teammate_membership.id)],
        }
    ]


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
                "schemaVersion": 4,
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
        "configurationDirectory": {
            "memberships": [
                {
                    "membershipId": str(membership.id),
                    "displayName": "Designer",
                    "role": MembershipRole.DESIGNER,
                }
            ],
            "teams": [],
        },
        "name": "Workflow intake",
        "revision": "1",
        "draft": {
            "schemaVersion": 4,
            "draftId": response.json()["draft"]["draftId"],
            "workflowId": workflow_id,
            "name": "Workflow intake",
            "status": "draft",
            "elements": [],
            "connections": [],
            "processFields": [],
            "formBindings": [],
            "publication": {
                "starter": {
                    "mode": "unconfigured",
                    "teamIds": [],
                    "membershipIds": [],
                },
                "assignment": {
                    "mode": "unconfigured",
                    "membershipId": None,
                },
            },
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
        "configurationDirectory": {
            "memberships": [
                {
                    "membershipId": str(membership.id),
                    "displayName": "Designer",
                    "role": MembershipRole.DESIGNER,
                }
            ],
            "teams": [],
        },
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
                    "position": 0,
                    "width": "full",
                    "label": None,
                }
            ],
            "publication": {
                "starter": {
                    "mode": "unconfigured",
                    "teamIds": [],
                    "membershipIds": [],
                },
                "assignment": {
                    "mode": "unconfigured",
                    "membershipId": None,
                },
            },
        },
    }


@pytest.mark.django_db
def test_workflow_draft_save_replays_one_authoritative_result_for_same_idempotency_key(
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
    payload = {
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
            "processFields": [],
            "formBindings": [],
        },
    }

    first = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-replay"},
    )
    second = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-replay"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()


@pytest.mark.django_db
def test_workflow_draft_save_rejects_changed_payload_under_reused_idempotency_key(
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

    first = client.put(
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
                "processFields": [],
                "formBindings": [],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-reused"},
    )
    conflict = client.put(
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
                    {"id": "start-1", "type": "start", "label": "Inicio"},
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
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-reused"},
    )

    assert first.status_code == 200
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "idempotency_key_reused"


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
                        "position": 0,
                        "width": "full",
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


@pytest.mark.django_db
def test_workflow_publication_validation_returns_deterministic_checklist_rows(
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

    saved = client.put(
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
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
        data={
            "expectedRevision": "2",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-1"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "workflowId": workflow_id,
        "revision": "2",
        "publishable": False,
        "issues": [
            {
                "code": "starter_missing",
                "severity": "blocking",
                "target": "configuration.starter",
                "elementId": None,
                "fieldId": None,
                "bindingId": None,
                "message": (
                    "We need one more detail before publishing: "
                    "choose who can start this workflow."
                ),
                "actionLabel": "Configure starter",
            },
            {
                "code": "assignment_missing",
                "severity": "blocking",
                "target": "configuration.assignment",
                "elementId": None,
                "fieldId": None,
                "bindingId": None,
                "message": (
                    "We need one more detail before publishing: "
                    "choose who receives the first task."
                ),
                "actionLabel": "Configure assignment",
            },
        ],
    }


@pytest.mark.django_db
def test_workflow_publication_validation_rejects_stale_revision(
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

    saved = client.put(
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
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
        data={
            "expectedRevision": "1",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-1"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "workflow_draft_revision_conflict"
    assert response.json()["invalidParams"] == [
        {
            "name": "expectedRevision",
            "code": "stale",
            "reason": "Reload the last saved draft before validating again.",
        }
    ]


@pytest.mark.django_db
def test_workflow_publication_validation_rejects_save_invalid_draft_shape(
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

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
        data={
            "expectedRevision": "1",
            "draft": {
                "schemaVersion": 3,
                "draftId": draft_id,
                "workflowId": workflow_id,
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "task-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Task"},
                    {"id": "end-1", "type": "end", "label": "End"},
                ],
                "connections": [
                    {
                        "id": "connection-1",
                        "type": "sequence",
                        "sourceId": "task-1",
                        "targetId": "task-1",
                    }
                ],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "elements",
            "code": "duplicate_element_id",
            "reason": "Use a unique identifier for each workflow element.",
        }
    ]


@pytest.mark.django_db
def test_workflow_publication_validation_can_return_publishable_true(
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

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
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
                "publication": {
                    "starter": {
                        "mode": "allActiveMembers",
                        "teamIds": [],
                        "membershipIds": [],
                    },
                    "assignment": {
                        "mode": "workflowInitiator",
                        "membershipId": None,
                    },
                },
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-1"},
    )

    assert response.status_code == 200
    assert response.json()["publishable"] is True
    assert response.json()["issues"] == []


@pytest.mark.django_db
def test_workflow_publication_validation_rejects_member_role(django_user_model) -> None:
    user = django_user_model.objects.create_user(
        username="workflow-member-validate",
        email="member-validate@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Member",
    )
    organization = Organization.objects.create(
        slug="workflow-member-validate-org",
        display_name="Workflow Member Validate Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.MEMBER,
    )
    workflow_user = django_user_model.objects.create_user(
        username="workflow-designer-validate",
        email="designer-validate@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Designer",
    )
    workflow_membership = Membership.objects.create(
        organization=organization,
        user=workflow_user,
        role=MembershipRole.DESIGNER,
    )
    client = Client()
    client.force_login(workflow_user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-1"},
    )
    assert created.status_code == 201

    client.force_login(user)
    response = client.post(
        f"/api/v1/workflow-design/workflows/{created.json()['workflowId']}/publication-validation/",
        data={
            "expectedRevision": "1",
            "draft": created.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-1"},
    )

    assert membership.role == MembershipRole.MEMBER
    assert workflow_membership.role == MembershipRole.DESIGNER
    assert response.status_code == 403
    assert response.json()["code"] == "workflow_design_forbidden"


@pytest.mark.django_db
def test_workflow_publish_returns_authoritative_published_version_payload(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["workflowId"] == workflow_id
    assert payload["organizationId"] == str(organization.id)
    assert payload["createdByMembershipId"] == str(membership.id)
    assert payload["revision"] == "2"
    assert payload["draft"] == saved.json()["draft"]
    assert payload["publishedVersion"] == {
        "versionNumber": 1,
        "publishedAt": payload["publishedVersion"]["publishedAt"],
        "sourceRevision": "2",
        "schemaVersion": 4,
    }
    assert WorkflowVersion.objects.filter(workflow_id=workflow_id).count() == 1


@pytest.mark.django_db
def test_workflow_publish_uses_the_authoritative_saved_draft_snapshot(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    unsaved_local_copy = dict(saved.json()["draft"])
    unsaved_local_copy["elements"] = [
        {"id": "start-1", "type": "start", "label": "Start"},
        {"id": "task-1", "type": "task", "label": "Unsaved local task label"},
        {"id": "end-1", "type": "end", "label": "End"},
    ]

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": unsaved_local_copy,
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["draft"] == saved.json()["draft"]
    version = WorkflowVersion.objects.get(workflow_id=workflow_id, version_number=1)
    assert version.snapshot["elements"][1]["label"] == "Task"


@pytest.mark.django_db
def test_workflow_publish_requires_idempotency_key(workflow_design_member) -> None:
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

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "1",
            "draft": created.json()["draft"],
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "idempotencyKey",
            "code": "required",
            "reason": "Provide an idempotency key to continue.",
        }
    ]


@pytest.mark.django_db
def test_workflow_publish_rejects_stale_revision(workflow_design_member) -> None:
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "1",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "workflow_draft_revision_conflict"
    assert response.json()["invalidParams"] == [
        {
            "name": "expectedRevision",
            "code": "stale",
            "reason": "Reload the last saved draft before publishing.",
        }
    ]


@pytest.mark.django_db
def test_workflow_publish_rejects_invalid_draft_without_creating_version(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                **_publishable_workflow_payload(workflow_id, draft_id),
                "publication": {
                    "starter": {"mode": "unconfigured", "teamIds": [], "membershipIds": []},
                    "assignment": {"mode": "workflowInitiator", "membershipId": None},
                },
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    request_draft = _publishable_workflow_payload(workflow_id, draft_id)
    request_draft["publication"] = {
        "starter": {"mode": "unconfigured", "teamIds": [], "membershipIds": []},
        "assignment": {"mode": "workflowInitiator", "membershipId": None},
    }

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": request_draft,
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_draft_invalid"
    assert response.json()["invalidParams"] == [
        {
            "name": "configuration.starter",
            "code": "starter_missing",
            "reason": (
                "We need one more detail before publishing: "
                "choose who can start this workflow."
            ),
        }
    ]
    assert WorkflowVersion.objects.filter(workflow_id=workflow_id).count() == 0


@pytest.mark.django_db
def test_workflow_publish_replays_one_authoritative_result_for_same_idempotency_key(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    payload = {
        "expectedRevision": "2",
        "draft": saved.json()["draft"],
    }

    first = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )
    second = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data=payload,
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()
    assert WorkflowVersion.objects.filter(workflow_id=workflow_id).count() == 1


@pytest.mark.django_db
def test_workflow_publish_rejects_changed_payload_under_reused_idempotency_key(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )

    first = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )
    assert first.status_code == 200

    changed_draft = dict(saved.json()["draft"])
    changed_draft["publication"] = {
        "starter": {
            "mode": "selectedMembers",
            "teamIds": [],
            "membershipIds": [created.json()["createdByMembershipId"]],
        },
        "assignment": {"mode": "workflowInitiator", "membershipId": None},
    }
    second = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": changed_draft,
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )

    assert second.status_code == 409
    assert second.json()["code"] == "idempotency_key_reused"


@pytest.mark.django_db
def test_workflow_publish_rejects_mutating_a_published_version_snapshot(
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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    published = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "2",
            "draft": saved.json()["draft"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )
    assert published.status_code == 200

    version = WorkflowVersion.objects.get(workflow_id=workflow_id, version_number=1)
    version.snapshot = {
        **version.snapshot,
        "name": "Mutated published workflow",
    }

    with pytest.raises(ValidationError):
        version.save()

    with pytest.raises(ValidationError):
        version.delete()
