import hashlib
import uuid

import pytest
from django.test import Client

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.organizations.models import Team, TeamMembership
from moviqo.modules.workflow_design.application import (
    create_workflow_definition,
    publish_workflow_version,
    save_workflow_draft,
)
from moviqo.modules.workflow_design.models import WorkflowDefinition
from moviqo.modules.workflow_runtime.models import ProcessInstance, TaskOccurrence


@pytest.fixture
def active_member(django_user_model):
    user = django_user_model.objects.create_user(
        username="my-work-owner",
        email="owner@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Owner",
    )
    organization = Organization.objects.create(slug="my-work-org", display_name="My Work Org")
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )
    return user, organization, membership


@pytest.mark.django_db
def test_my_work_dashboard_returns_tenant_scoped_empty_contract(active_member) -> None:
    user, organization, membership = active_member
    other_user = user.__class__.objects.create_user(
        username="my-work-other-owner",
        email="other-owner@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Other Owner",
    )
    other_organization = Organization.objects.create(
        slug="my-work-other-org",
        display_name="Other Org",
    )
    other_membership = Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=MembershipRole.OWNER,
    )
    client = Client()
    client.force_login(user)

    response = client.get(
        f"/api/v1/my-work/?organizationId={other_organization.id}"
        f"&membershipId={other_membership.id}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "startWorkflows": {"items": [], "limit": 6, "hasMore": False},
        "myTasks": {"items": [], "limit": 12, "hasMore": False},
        "myProcesses": {"items": [], "limit": 12, "hasMore": False},
    }
    assert "organizationId" not in str(payload)
    assert "membershipId" not in str(payload)
    assert str(organization.id) not in str(payload)
    assert str(membership.id) not in str(payload)
    assert str(other_organization.id) not in str(payload)
    assert str(other_membership.id) not in str(payload)


@pytest.mark.django_db
def test_my_work_dashboard_rejects_anonymous_requests() -> None:
    response = Client().get("/api/v1/my-work/")

    assert response.status_code == 403
    assert response.json()["code"] == "not_authenticated"


@pytest.mark.django_db
def test_my_work_dashboard_fails_closed_for_pending_membership(django_user_model) -> None:
    user = django_user_model.objects.create_user(
        username="pending-member",
        email="pending@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    organization = Organization.objects.create(
        slug="pending-org",
        display_name="Pending Org",
        registration_state="pending",
    )
    Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
        is_active=False,
        registration_state="pending",
    )
    client = Client()
    client.force_login(user)

    response = client.get("/api/v1/my-work/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"


@pytest.mark.django_db
def test_my_work_dashboard_hides_inactive_organization_membership(active_member) -> None:
    user, organization, _membership = active_member
    organization.is_active = False
    organization.save(update_fields=["is_active"])
    client = Client()
    client.force_login(user)

    response = client.get("/api/v1/my-work/")

    assert response.status_code == 404
    assert response.json()["code"] == "resource_not_found"


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(membership: Membership) -> TenantContext:
    return TenantContext(
        organization_id=membership.organization_id,
        membership_id=membership.id,
        user_id=membership.user_id,
    )


def _publish_workflow(
    *,
    membership: Membership,
    name: str,
    starter_mode: str,
    starter_membership_ids: list[str] | None = None,
    starter_team_ids: list[str] | None = None,
    assignment_mode: str = "workflowInitiator",
    assignment_membership_id: str | None = None,
) -> str:
    created = create_workflow_definition(
        tenant_context=_tenant_context(membership),
        name=name,
        idempotency_key=f"workflow-create-{uuid.uuid4().hex}",
        request_hash=_request_hash(f"create-{name}"),
    )
    draft = {
        "schemaVersion": 4,
        "draftId": created["draft"]["draftId"],
        "workflowId": created["workflowId"],
        "name": name,
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
        "processFields": [{"kind": "shortText", "label": "Requester"}],
        "formBindings": [{"taskElementId": "task-1", "fieldId": "field-1"}],
        "publication": {
            "starter": {
                "mode": starter_mode,
                "teamIds": starter_team_ids or [],
                "membershipIds": starter_membership_ids or [],
            },
            "assignment": {
                "mode": assignment_mode,
                "membershipId": assignment_membership_id,
            },
        },
    }
    saved = save_workflow_draft(
        tenant_context=_tenant_context(membership),
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft=draft,
        idempotency_key=f"workflow-save-{uuid.uuid4().hex}",
        request_hash=_request_hash(f"save-{name}"),
    )
    publish_workflow_version(
        tenant_context=_tenant_context(membership),
        workflow_id=created["workflowId"],
        expected_revision=saved["revision"],
        draft=saved["draft"],
        idempotency_key=f"workflow-publish-{uuid.uuid4().hex}",
        request_hash=_request_hash(f"publish-{name}"),
    )
    return created["workflowId"]


@pytest.mark.django_db
def test_my_work_dashboard_returns_only_startable_published_workflows(django_user_model) -> None:
    owner = django_user_model.objects.create_user(
        username="owner-catalog",
        email="owner-catalog@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Owner Catalog",
    )
    starter = django_user_model.objects.create_user(
        username="starter-member",
        email="starter-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Starter Member",
    )
    outsider = django_user_model.objects.create_user(
        username="outsider-member",
        email="outsider-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Outsider Member",
    )
    organization = Organization.objects.create(slug="workflow-catalog", display_name="Workflow Catalog")
    owner_membership = Membership.objects.create(
        organization=organization,
        user=owner,
        role=MembershipRole.OWNER,
    )
    starter_membership = Membership.objects.create(
        organization=organization,
        user=starter,
        role=MembershipRole.MEMBER,
    )
    outsider_membership = Membership.objects.create(
        organization=organization,
        user=outsider,
        role=MembershipRole.MEMBER,
    )
    starter_team = Team.objects.create(
        organization=organization,
        name="Starter Team",
        normalized_name="starter team",
    )
    TeamMembership.objects.create(
        organization=organization,
        team=starter_team,
        membership=starter_membership,
    )

    _publish_workflow(
        membership=owner_membership,
        name="All active",
        starter_mode="allActiveMembers",
    )
    _publish_workflow(
        membership=owner_membership,
        name="Direct starter",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(starter_membership.id)],
    )
    _publish_workflow(
        membership=owner_membership,
        name="Team starter",
        starter_mode="selectedTeams",
        starter_team_ids=[str(starter_team.id)],
    )
    _publish_workflow(
        membership=owner_membership,
        name="Hidden starter",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(outsider_membership.id)],
    )

    client = Client()
    client.force_login(starter)
    response = client.get("/api/v1/my-work/")

    assert response.status_code == 200
    items = response.json()["startWorkflows"]["items"]
    assert [item["title"] for item in items] == ["All active", "Direct starter", "Team starter"]
    assert all("Hidden starter" != item["title"] for item in items)
    assert {item["versionNumber"] for item in items} == {1}


@pytest.mark.django_db
def test_my_work_dashboard_owner_sees_every_published_workflow(active_member) -> None:
    user, organization, owner_membership = active_member
    extra_user = user.__class__.objects.create_user(
        username="restricted-member",
        email="restricted-member@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Restricted Member",
    )
    extra_membership = Membership.objects.create(
        organization=organization,
        user=extra_user,
        role=MembershipRole.MEMBER,
    )
    _publish_workflow(
        membership=owner_membership,
        name="Restricted starter",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(extra_membership.id)],
    )

    client = Client()
    client.force_login(user)
    response = client.get("/api/v1/my-work/")

    assert response.status_code == 200
    assert response.json()["startWorkflows"]["items"] == [
        {
            "workflowId": response.json()["startWorkflows"]["items"][0]["workflowId"],
            "title": "Restricted starter",
            "description": "",
            "availability": "Available through your operational authority.",
            "versionNumber": 1,
        }
    ]


@pytest.mark.django_db
def test_start_workflow_creates_one_process_and_first_task(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Startable workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-1"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["workflow"]["title"] == "Startable workflow"
    assert payload["workflow"]["versionNumber"] == 1
    assert payload["destinationRoute"] == f"/my-work/tasks/{payload['taskId']}"
    assert ProcessInstance.objects.count() == 1
    assert TaskOccurrence.objects.count() == 1
    task = TaskOccurrence.objects.get()
    process = ProcessInstance.objects.get()
    assert task.process_id == process.id
    assert str(task.workflow_version_id) == str(process.workflow_version_id)


@pytest.mark.django_db
def test_start_workflow_requires_idempotency_key(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Start without key",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["code"] == "workflow_start_invalid"
    assert ProcessInstance.objects.count() == 0
    assert TaskOccurrence.objects.count() == 0


@pytest.mark.django_db
def test_start_workflow_fails_closed_for_unauthorized_or_unpublished_ids(django_user_model) -> None:
    owner = django_user_model.objects.create_user(
        username="owner-start-denial",
        email="owner-start-denial@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    member = django_user_model.objects.create_user(
        username="member-start-denial",
        email="member-start-denial@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    organization = Organization.objects.create(slug="start-denial", display_name="Start denial")
    owner_membership = Membership.objects.create(
        organization=organization,
        user=owner,
        role=MembershipRole.OWNER,
    )
    member_membership = Membership.objects.create(
        organization=organization,
        user=member,
        role=MembershipRole.MEMBER,
    )
    hidden_workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Owner only hidden",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(owner_membership.id)],
    )
    unpublished = create_workflow_definition(
        tenant_context=_tenant_context(owner_membership),
        name="Draft only",
        idempotency_key=f"workflow-create-{uuid.uuid4().hex}",
        request_hash=_request_hash("draft-only"),
    )
    client = Client()
    client.force_login(member)

    hidden_response = client.post(
        f"/api/v1/my-work/start-workflows/{hidden_workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-hidden"},
    )
    unpublished_response = client.post(
        f"/api/v1/my-work/start-workflows/{unpublished['workflowId']}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-draft"},
    )

    assert hidden_response.status_code == 404
    assert unpublished_response.status_code == 404
    assert hidden_response.json()["code"] == "resource_not_found"
    assert unpublished_response.json()["code"] == "resource_not_found"
    assert ProcessInstance.objects.count() == 0
    assert TaskOccurrence.objects.count() == 0


@pytest.mark.django_db
def test_start_workflow_replays_the_original_process_for_same_idempotency_key(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Replayable workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)

    first = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-replay"},
    )
    second = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-replay"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()
    assert ProcessInstance.objects.count() == 1
    assert TaskOccurrence.objects.count() == 1


@pytest.mark.django_db
def test_start_workflow_creates_distinct_processes_for_distinct_idempotency_keys(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Distinct starts",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)

    first = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-distinct-1"},
    )
    second = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-distinct-2"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["processId"] != second.json()["processId"]
    assert ProcessInstance.objects.count() == 2
    assert TaskOccurrence.objects.count() == 2


@pytest.mark.django_db
def test_start_workflow_uses_published_snapshot_title_when_workflow_head_changes(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Published title",
        starter_mode="allActiveMembers",
    )
    WorkflowDefinition.objects.filter(id=workflow_id).update(
        name="Renamed draft head",
        normalized_name="renamed draft head",
    )

    client = Client()
    client.force_login(user)
    dashboard_response = client.get("/api/v1/my-work/")
    start_response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-snapshot-title"},
    )

    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["startWorkflows"]["items"] == [
        {
            "workflowId": workflow_id,
            "title": "Published title",
            "description": "",
            "availability": "Available through your operational authority.",
            "versionNumber": 1,
        }
    ]
    assert start_response.status_code == 200
    assert start_response.json()["workflow"]["title"] == "Published title"


@pytest.mark.django_db
def test_start_workflow_same_key_from_different_member_conflicts(django_user_model) -> None:
    owner = django_user_model.objects.create_user(
        username="shared-key-owner",
        email="shared-key-owner@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    first_member_user = django_user_model.objects.create_user(
        username="shared-key-member-1",
        email="shared-key-member-1@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    second_member_user = django_user_model.objects.create_user(
        username="shared-key-member-2",
        email="shared-key-member-2@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    organization = Organization.objects.create(slug="shared-key-org", display_name="Shared key org")
    owner_membership = Membership.objects.create(
        organization=organization,
        user=owner,
        role=MembershipRole.OWNER,
    )
    Membership.objects.create(
        organization=organization,
        user=first_member_user,
        role=MembershipRole.MEMBER,
    )
    Membership.objects.create(
        organization=organization,
        user=second_member_user,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Shared key workflow",
        starter_mode="allActiveMembers",
    )

    first_client = Client()
    first_client.force_login(first_member_user)
    second_client = Client()
    second_client.force_login(second_member_user)

    first = first_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-shared-key"},
    )
    second = second_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-shared-key"},
    )

    assert first.status_code == 200
    assert second.status_code == 409
    assert second.json()["code"] == "idempotency_key_reused"
    assert ProcessInstance.objects.count() == 1
    assert TaskOccurrence.objects.count() == 1


@pytest.mark.django_db
def test_owner_operational_start_records_audit_flag(active_member) -> None:
    user, _organization, owner_membership = active_member
    restricted_member = user.__class__.objects.create_user(
        username="owner-audit-member",
        email="owner-audit-member@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    restricted_membership = Membership.objects.create(
        organization=owner_membership.organization,
        user=restricted_member,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Operational authority workflow",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(restricted_membership.id)],
    )
    client = Client()
    client.force_login(user)

    response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-operational-authority"},
    )

    assert response.status_code == 200
    audit = TransactionalAuditRecord.objects.get(event_type="workflow-runtime.process-started")
    assert audit.payload["viaOperationalAuthority"] is True
