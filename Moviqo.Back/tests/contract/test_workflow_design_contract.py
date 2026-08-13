from __future__ import annotations

import uuid
from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.test import Client
from django.utils import timezone

from moviqo.modules.governance.models import TransactionalAuditRecord
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    Team,
    TeamMembership,
)
from moviqo.modules.workflow_design.models import FormAuthoringLease, WorkflowVersion


def _publishable_workflow_payload(
    workflow_id: str,
    draft_id: str,
) -> dict[str, object]:
    return {
        "schemaVersion": 8,
        "draftId": draft_id,
        "workflowId": workflow_id,
        "name": "Workflow intake",
        "status": "draft",
        "elements": [
            {"id": "start-1", "type": "start", "label": "Start"},
            {
                "id": "task-1",
                "type": "task",
                "label": "Task",
                "assignment": {
                    "mode": "workflowInitiator",
                    "membershipId": None,
                },
            },
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
        },
        "layout": {
            "positions": {
                "start-1": {"x": 80, "y": 120},
                "task-1": {"x": 240, "y": 160},
                "end-1": {"x": 420, "y": 120},
            }
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
                "email": "designer@example.com",
                "role": MembershipRole.DESIGNER,
            }
        ],
        "teams": [],
    }
    assert payload["draft"] == {
        "schemaVersion": 8,
        "draftId": payload["draft"]["draftId"],
        "workflowId": payload["workflowId"],
        "name": "Workflow intake",
        "status": "draft",
        "elements": [{"id": "start-1", "type": "start", "label": "Start"}],
        "connections": [],
        "processFields": [],
        "formBindings": [],
        "publication": {
            "starter": {
                "mode": "unconfigured",
                "teamIds": [],
                "membershipIds": [],
            },
        },
        "layout": {"positions": {"start-1": {"x": 80, "y": 120}}},
    }


@pytest.mark.django_db
def test_v7_save_preserves_existing_task_assignment_when_optional_field_is_omitted(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-preserve-assignment"},
    )
    workflow_id = created.json()["workflowId"]
    draft_id = created.json()["draft"]["draftId"]
    first = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-assignment"},
    )
    omitted = first.json()["draft"]
    omitted["elements"] = [
        {key: value for key, value in element.items() if key != "assignment"}
        for element in omitted["elements"]
    ]

    second = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={"expectedRevision": "2", "draft": omitted},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-assignment-omitted"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    task = next(
        element for element in second.json()["draft"]["elements"]
        if element["id"] == "task-1"
    )
    assert task["assignment"] == {
        "mode": "workflowInitiator",
        "membershipId": None,
    }


@pytest.mark.django_db
def test_save_accepts_publication_readiness_issues(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-inactive-assignment"},
    )
    workflow_id = created.json()["workflowId"]
    draft = _publishable_workflow_payload(
        workflow_id,
        created.json()["draft"]["draftId"],
    )
    draft["elements"][1]["assignment"] = {
        "mode": "specificMember",
        "membershipId": str(uuid.uuid4()),
    }
    draft["publication"]["starter"] = {
        "mode": "selectedMembers",
        "teamIds": [],
        "membershipIds": [str(uuid.uuid4())],
    }

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={"expectedRevision": "1", "draft": draft},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-inactive-assignment"},
    )

    assert response.status_code == 200


@pytest.mark.django_db
def test_incomplete_coherent_draft_saves_and_validation_uses_that_saved_revision(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-incomplete"},
    )
    workflow_id = created.json()["workflowId"]

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                **created.json()["draft"],
                "elements": [{"id": "start-1", "type": "start", "label": "Start"}],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-incomplete"},
    )

    assert saved.status_code == 200
    assert saved.json()["revision"] == "2"
    validation = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
        data={"expectedRevision": "2"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-incomplete"},
    )
    assert validation.status_code == 200
    assert validation.json()["revision"] == "2"
    assert validation.json()["publishable"] is False
    assert {issue["code"] for issue in validation.json()["issues"]} >= {
        "first_task_missing",
        "end_step_invalid",
    }


@pytest.mark.django_db
def test_save_path_preserves_blank_form_presentation_and_publication_reports_it(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Incomplete Form"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-incomplete-form"},
    ).json()
    draft = {
        **created["draft"],
        "elements": [
            {"id": "start-1", "type": "start", "label": "Start"},
            {"id": "task-1", "type": "task", "label": "Review"},
        ],
        "processFields": [
            {
                "id": "field-1",
                "kind": "shortText",
                "label": "",
                "helpText": "",
                "placeholder": "",
                "defaultValue": None,
                "minimumLength": 0,
                "maximumLength": 255,
            }
        ],
        "formBindings": [
            {
                "id": "heading-1",
                "kind": "heading",
                "taskElementId": "task-1",
                "position": 0,
                "width": "full",
                "content": "",
            },
            {
                "id": "binding-1",
                "kind": "field",
                "taskElementId": "task-1",
                "fieldId": "field-1",
                "position": 1,
                "width": "full",
                "label": "",
            },
        ],
    }

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{created['workflowId']}/draft/",
        data={"expectedRevision": "1", "draft": draft},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-incomplete-form"},
    )

    assert saved.status_code == 200
    assert saved.json()["draft"]["processFields"][0]["label"] == ""
    assert saved.json()["draft"]["formBindings"][0]["content"] == ""
    assert saved.json()["draft"]["formBindings"][1]["label"] == ""
    reopened = client.get(
        f"/api/v1/workflow-design/workflows/{created['workflowId']}/draft/"
    )
    assert reopened.status_code == 200
    assert reopened.json()["draft"]["formBindings"][1]["label"] == ""
    validation = client.post(
        f"/api/v1/workflow-design/workflows/{created['workflowId']}/publication-validation/",
        data={"expectedRevision": "2"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-validate-incomplete-form"},
    )
    assert validation.status_code == 200
    issues = {issue["code"]: issue for issue in validation.json()["issues"]}
    assert issues["task_form_decorative"]["target"] == "processFields.field-1"
    assert issues["task_form_decorative"]["message"] == (
        "Add a label to this Form item before publishing."
    )
    assert issues["task_form_decorative"]["actionLabel"] == "Open Task form"
    assert issues["form_item_content_missing"]["target"] == (
        "formBindings.heading-1.content"
    )


@pytest.mark.django_db
def test_form_authoring_lease_read_only_takeover_enforcement_and_logout_release(
    workflow_design_member,
    django_user_model,
) -> None:
    first_user, organization, first_membership = workflow_design_member
    second_user = django_user_model.objects.create_user(
        username="second-designer",
        email="second-designer@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Second Designer",
    )
    second_membership = Membership.objects.create(
        organization=organization,
        user=second_user,
        role=MembershipRole.DESIGNER,
    )
    first_client = Client()
    second_client = Client()
    first_client.force_login(first_user)
    second_client.force_login(second_user)
    created = first_client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Leased Form"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-leased-form"},
    ).json()
    workflow_id = created["workflowId"]
    prepared = first_client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {
                **created["draft"],
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "task-1", "type": "task", "label": "Review"},
                ],
            },
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-prepare-leased-form"},
    ).json()
    lease_path = (
        f"/api/v1/workflow-design/workflows/{workflow_id}/tasks/"
        "task-1/form-authoring-lease/"
    )
    save_path = (
        f"/api/v1/workflow-design/workflows/{workflow_id}/tasks/task-1/form-draft/"
    )

    first_lease = first_client.post(
        lease_path,
        data={"action": "acquire"},
        content_type="application/json",
    )
    secondary = second_client.post(
        lease_path,
        data={"action": "acquire"},
        content_type="application/json",
    )
    takeover = second_client.post(
        lease_path,
        data={"action": "takeover"},
        content_type="application/json",
    )

    assert first_lease.status_code == 200
    assert first_lease.json()["mode"] == "editable"
    assert first_lease.json()["holder"] == {
        "membershipId": str(first_membership.id),
        "displayName": "Designer",
    }
    assert secondary.status_code == 200
    assert secondary.json()["mode"] == "readOnly"
    assert secondary.json()["leaseToken"] is None
    assert takeover.status_code == 200
    assert takeover.json()["mode"] == "editable"
    assert takeover.json()["holder"]["membershipId"] == str(second_membership.id)

    stale_save = first_client.put(
        save_path,
        data={
            "expectedRevision": "2",
            "draft": prepared["draft"],
            "leaseToken": first_lease.json()["leaseToken"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-stale-form-save"},
    )
    authoritative_save = second_client.put(
        save_path,
        data={
            "expectedRevision": "2",
            "draft": prepared["draft"],
            "leaseToken": takeover.json()["leaseToken"],
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-authoritative-form-save"},
    )
    heartbeat = second_client.post(
        lease_path,
        data={
            "action": "heartbeat",
            "leaseToken": takeover.json()["leaseToken"],
        },
        content_type="application/json",
    )

    assert stale_save.status_code == 409
    assert stale_save.json()["code"] == "form_authoring_lease_lost"
    assert authoritative_save.status_code == 200
    assert authoritative_save.json()["revision"] == "3"
    assert heartbeat.status_code == 200
    assert heartbeat.json()["heartbeatAfterSeconds"] == 20

    assert second_client.post("/api/v1/auth/sign-out/", data={}).status_code == 204
    assert not FormAuthoringLease.objects.filter(workflow_id=workflow_id).exists()
    reacquired = first_client.post(
        lease_path,
        data={"action": "acquire"},
        content_type="application/json",
    )
    assert reacquired.status_code == 200
    assert reacquired.json()["mode"] == "editable"
    FormAuthoringLease.objects.filter(workflow_id=workflow_id).update(
        session_expires_at=timezone.now() - timedelta(seconds=1)
    )
    second_client.force_login(second_user)
    after_session_expiry = second_client.post(
        lease_path,
        data={"action": "acquire"},
        content_type="application/json",
    )
    assert after_session_expiry.status_code == 200
    assert after_session_expiry.json()["mode"] == "editable"
    assert after_session_expiry.json()["holder"]["membershipId"] == str(
        second_membership.id
    )


@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ["publication-validation"])
def test_publication_commands_reject_client_candidate_documents(
    workflow_design_member,
    endpoint,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": f"workflow-create-{endpoint}"},
    )
    workflow_id = created.json()["workflowId"]

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/{endpoint}/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(
                workflow_id,
                created.json()["draft"]["draftId"],
            ),
        },
        content_type="application/json",
        headers={"Idempotency-Key": f"workflow-{endpoint}-candidate"},
    )

    assert response.status_code == 400
    assert response.json()["invalidParams"] == [
        {
            "name": "draft",
            "code": "unexpected",
            "reason": "Remove this field and validate the saved revision.",
        }
    ]


@pytest.mark.django_db
def test_publish_accepts_the_submitted_current_draft_without_prior_save(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-direct-publish"},
    )
    workflow_id = created.json()["workflowId"]
    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(
                workflow_id,
                created.json()["draft"]["draftId"],
            ),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-direct"},
    )

    assert response.status_code == 200
    assert response.json()["revision"] == "2"
    assert response.json()["publishedVersion"]["sourceRevision"] == "2"


@pytest.mark.django_db
def test_failed_direct_publish_does_not_partially_save_the_submitted_draft(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-failed-direct"},
    )
    workflow_id = created.json()["workflowId"]
    invalid = _publishable_workflow_payload(
        workflow_id,
        created.json()["draft"]["draftId"],
    )
    invalid["publication"] = {
        "starter": {
            "mode": "unconfigured",
            "teamIds": [],
            "membershipIds": [],
        }
    }
    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "1", "draft": invalid},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-failed-direct"},
    )
    reloaded = client.get(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/"
    )

    assert response.status_code == 400
    assert reloaded.status_code == 200
    assert reloaded.json()["revision"] == "1"
    assert reloaded.json()["draft"]["elements"] == [
        {"id": "start-1", "type": "start", "label": "Start"}
    ]
    assert WorkflowVersion.objects.filter(workflow_id=workflow_id).count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("endpoint", "method"),
    [
        ("draft", "put"),
        ("publication-validation", "post"),
        ("publish", "post"),
    ],
)
@pytest.mark.parametrize("body", ["null", '[{"unexpected": true}]'])
def test_workflow_commands_reject_non_object_json_bodies(
    workflow_design_member,
    endpoint,
    method,
    body,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": f"workflow-create-{endpoint}-{body[0]}"},
    )
    workflow_id = created.json()["workflowId"]

    request = getattr(client, method)
    response = request(
        f"/api/v1/workflow-design/workflows/{workflow_id}/{endpoint}/",
        data=body,
        content_type="application/json",
        headers={"Idempotency-Key": f"workflow-command-{endpoint}-{body[0]}"},
    )

    assert response.status_code == 400
    assert response.json()["invalidParams"] == [
        {
            "name": "nonFieldErrors",
            "code": "invalid_request",
            "reason": "Send a JSON object and try again.",
        }
    ]


@pytest.mark.django_db
def test_workflow_draft_save_rejects_client_validation_policy_flags(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow intake"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-policy"},
    )
    workflow_id = created.json()["workflowId"]

    response = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": created.json()["draft"],
            "skipValidation": True,
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-policy"},
    )

    assert response.status_code == 400
    assert response.json()["invalidParams"] == [
        {
            "name": "nonFieldErrors",
            "code": "unexpected",
            "reason": "Remove this field; the draft endpoint owns integrity validation.",
        }
    ]


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
    assert response.json()["configurationDirectory"]["memberships"] == [
        {
            "membershipId": str(membership.id),
            "displayName": "Designer",
            "email": "designer@example.com",
            "role": MembershipRole.DESIGNER,
        },
        {
            "membershipId": str(teammate_membership.id),
            "displayName": "Team Member",
            "email": "team-member@example.com",
            "role": MembershipRole.MEMBER,
        },
    ]
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
    assert "other-owner@example.com" not in response.content.decode("utf-8")


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
                "schemaVersion": 8,
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
                    "email": "designer@example.com",
                    "role": MembershipRole.DESIGNER,
                }
            ],
            "teams": [],
        },
        "name": "Workflow intake",
        "revision": "1",
        "draft": {
            "schemaVersion": 8,
            "draftId": response.json()["draft"]["draftId"],
            "workflowId": workflow_id,
            "name": "Workflow intake",
            "status": "draft",
            "elements": [{"id": "start-1", "type": "start", "label": "Start"}],
            "connections": [],
            "processFields": [],
            "formBindings": [],
            "publication": {
                "starter": {
                    "mode": "unconfigured",
                    "teamIds": [],
                    "membershipIds": [],
                },
            },
            "layout": {"positions": {"start-1": {"x": 80, "y": 120}}},
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
                        "label": "Request accepted",
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
                    "email": "designer@example.com",
                    "role": MembershipRole.DESIGNER,
                }
            ],
            "teams": [],
        },
        "name": "Workflow intake",
        "revision": "2",
        "draft": {
            "schemaVersion": 8,
            "draftId": draft_id,
            "workflowId": workflow_id,
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {
                    "id": "task-1",
                    "type": "task",
                    "label": "Task",
                    "assignment": {
                        "mode": "unconfigured",
                        "membershipId": None,
                    },
                },
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            "connections": [
                {
                    "id": "connection-1",
                    "type": "sequence",
                    "sourceId": "start-1",
                    "targetId": "task-1",
                    "label": "Request accepted",
                },
                {
                    "id": "connection-2",
                    "type": "sequence",
                    "sourceId": "task-1",
                    "targetId": "end-1",
                    "label": None,
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
                        "kind": "field",
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
            },
            "layout": {"positions": {"start-1": {"x": 80, "y": 120}}},
        },
    }


@pytest.mark.django_db
def test_workflow_layout_only_save_round_trips_exact_positions_and_audits_once(
    workflow_design_member,
) -> None:
    user, _organization, _membership = workflow_design_member
    client = Client()
    client.force_login(user)
    created = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Workflow layout"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-layout"},
    ).json()
    moved_layout = {
        "positions": {"start-1": {"x": -135.5, "y": 842.25}}
    }

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{created['workflowId']}/draft/",
        data={
            "expectedRevision": "1",
            "draft": {**created["draft"], "layout": moved_layout},
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-layout"},
    )
    reopened = client.get(
        f"/api/v1/workflow-design/workflows/{created['workflowId']}/draft/"
    )

    assert saved.status_code == 200
    assert saved.json()["revision"] == "2"
    assert saved.json()["draft"]["layout"] == moved_layout
    assert reopened.status_code == 200
    assert reopened.json()["draft"]["layout"] == moved_layout
    audit = TransactionalAuditRecord.objects.get(
        command_type="workflow-design.save-draft",
        event_type="workflow-design.graph-layout-updated",
    )
    assert audit.payload["elementIds"] == ["start-1"]
    assert audit.payload["elementCount"] == 1


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
def test_workflow_draft_save_accepts_disconnected_intermediate_graph(
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

    assert response.status_code == 200
    assert response.json()["revision"] == "2"


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
def test_workflow_draft_save_accepts_binding_to_an_existing_task(
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

    assert response.status_code == 200
    assert response.json()["draft"]["formBindings"][0]["taskElementId"] == "task-2"


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
        data={"expectedRevision": "2"},
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
                "target": "elements.task-1.assignment",
                "elementId": "task-1",
                "fieldId": None,
                "bindingId": None,
                "message": (
                    "Choose who receives the Task 'Task'."
                ),
                "actionLabel": "Configure Task assignment",
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
        data={"expectedRevision": "1"},
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
def test_workflow_publication_validation_rejects_client_draft_shape(
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
            "name": "draft",
            "code": "unexpected",
            "reason": "Remove this field and validate the saved revision.",
        }
    ]


@pytest.mark.django_db
def test_workflow_directory_preserves_legacy_member_with_blank_email(
    workflow_design_member,
    django_user_model,
) -> None:
    user, _organization, membership = workflow_design_member
    legacy_user = django_user_model.objects.create_user(
        username="legacy-workflow-member",
        email="",
        password="a-secure-password-123",
        is_active=True,
        display_name="Legacy User",
    )
    legacy_membership = Membership.objects.create(
        organization=membership.organization,
        user=legacy_user,
        role=MembershipRole.MEMBER,
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        "/api/v1/workflow-design/workflows/",
        data={"name": "Legacy directory"},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-create-legacy-directory"},
    )

    assert response.status_code == 201
    assert {
        "membershipId": str(legacy_membership.id),
        "displayName": "Legacy User",
        "email": "",
        "role": MembershipRole.MEMBER,
    } in response.json()["configurationDirectory"]["memberships"]


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

    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": _publishable_workflow_payload(workflow_id, draft_id),
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-publishable"},
    )
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
        data={"expectedRevision": "2"},
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
        data={"expectedRevision": "1"},
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

    draft = _publishable_workflow_payload(workflow_id, draft_id)
    draft["formBindings"][0]["label"] = ""
    saved = client.put(
        f"/api/v1/workflow-design/workflows/{workflow_id}/draft/",
        data={
            "expectedRevision": "1",
            "draft": draft,
        },
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-save-1"},
    )
    assert saved.status_code == 200

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "2", "draft": saved.json()["draft"]},
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
        "schemaVersion": 8,
    }
    version = WorkflowVersion.objects.get(workflow_id=workflow_id)
    assert version.snapshot["formBindings"][0]["label"] == ""


@pytest.mark.django_db
def test_workflow_publish_accepts_the_submitted_saved_draft_snapshot(
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

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "2", "draft": saved.json()["draft"]},
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
        data={"expectedRevision": "1", "draft": created.json()["draft"]},
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
        data={"expectedRevision": "1", "draft": saved.json()["draft"]},
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

    response = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "2", "draft": saved.json()["draft"]},
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
    assert saved.status_code == 200
    payload = {"expectedRevision": "2", "draft": saved.json()["draft"]}

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
    assert saved.status_code == 200

    first = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "2", "draft": saved.json()["draft"]},
        content_type="application/json",
        headers={"Idempotency-Key": "workflow-publish-1"},
    )
    assert first.status_code == 200

    second = client.post(
        f"/api/v1/workflow-design/workflows/{workflow_id}/publish/",
        data={"expectedRevision": "3", "draft": saved.json()["draft"]},
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
        data={"expectedRevision": "2", "draft": saved.json()["draft"]},
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
