import hashlib
import uuid

import pytest
from django.test import Client

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import TransactionalAuditRecord
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    Team,
    TeamMembership,
)
from moviqo.modules.workflow_design.application import (
    create_workflow_definition,
    publish_workflow_version,
    save_workflow_draft,
)
from moviqo.modules.workflow_design.models import WorkflowDefinition, WorkflowVersion
from moviqo.modules.workflow_runtime.application.complete_task import complete_task
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
    binding_label: str | None = None,
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
        "formBindings": [
            {
                "taskElementId": "task-1",
                "fieldId": "field-1",
                "label": binding_label,
            }
        ],
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
        idempotency_key=f"workflow-publish-{uuid.uuid4().hex}",
        request_hash=_request_hash(f"publish-{name}"),
    )
    return created["workflowId"]


def _complete_started_task(
    *,
    membership: Membership,
    task_id: str,
    request_hash_suffix: str,
    value: str = "Ana Perez",
) -> dict[str, object] | None:
    return complete_task(
        tenant_context=_tenant_context(membership),
        task_id=task_id,
        expected_task_revision="1",
        controls=[
            {
                "controlId": "binding-1",
                "fieldId": "field-1",
                "value": value,
            }
        ],
        idempotency_key=f"workflow-complete-{request_hash_suffix}",
        request_hash=_request_hash(f"workflow-complete-{request_hash_suffix}"),
    )


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
    organization = Organization.objects.create(
        slug="workflow-catalog",
        display_name="Workflow Catalog",
    )
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
def test_explicit_blank_label_survives_publish_and_hides_runtime_label(
    active_member,
) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Hidden label workflow",
        starter_mode="allActiveMembers",
        binding_label="",
    )
    saved_workflow = WorkflowDefinition.objects.select_related("draft").get(
        id=workflow_id
    )
    published_version = WorkflowVersion.objects.get(workflow_id=workflow_id)
    assert saved_workflow.draft.document["formBindings"][0]["label"] == ""
    assert published_version.snapshot == saved_workflow.draft.document
    assert published_version.snapshot["formBindings"][0]["label"] == ""
    client = Client()
    client.force_login(user)

    started = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-hidden-label"},
    )

    assert started.status_code == 200
    task_form = client.get(
        f"/api/v1/my-work/tasks/{started.json()['taskId']}/form/"
    )
    assert task_form.status_code == 200
    control = task_form.json()["form"]["controls"][0]
    assert control["label"] == "Requester"
    assert control["labelVisuallyHidden"] is True
    item = task_form.json()["form"]["items"][0]
    assert item["label"] == "Requester"
    assert item["labelVisuallyHidden"] is True


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
    Membership.objects.create(
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
def test_start_workflow_replays_the_original_process_for_same_idempotency_key(
    active_member,
) -> None:
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
def test_start_workflow_creates_distinct_processes_for_distinct_idempotency_keys(
    active_member,
) -> None:
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
def test_start_workflow_uses_published_snapshot_title_when_workflow_head_changes(
    active_member,
) -> None:
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
def test_my_work_dashboard_returns_direct_assigned_open_tasks(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Assigned workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)
    start_response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-my-tasks"},
    )

    response = client.get("/api/v1/my-work/")

    assert start_response.status_code == 200
    assert response.status_code == 200
    assert response.json()["myTasks"]["items"] == [
        {
            "taskId": start_response.json()["taskId"],
            "title": "Task",
            "workflowName": "Assigned workflow",
            "status": "assigned",
            "processId": start_response.json()["processId"],
            "activatedAt": response.json()["myTasks"]["items"][0]["activatedAt"],
            "openTaskRoute": f"/my-work/tasks/{start_response.json()['taskId']}",
        }
    ]


@pytest.mark.django_db
def test_my_work_dashboard_pages_every_direct_assigned_open_task(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Paged assigned workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)
    task_ids: list[str] = []
    process_ids: list[str] = []
    for index in range(13):
        start_response = client.post(
            f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
            content_type="application/json",
            **{"HTTP_IDEMPOTENCY_KEY": f"workflow-start-paged-task-{index}"},
        )
        assert start_response.status_code == 200
        task_ids.append(start_response.json()["taskId"])
        process_ids.append(start_response.json()["processId"])

    first_page = client.get("/api/v1/my-work/?myTasksPage=0")
    second_page = client.get("/api/v1/my-work/?myTasksPage=2")
    searched_page = client.get(
        f"/api/v1/my-work/?myTasksSearch={process_ids[0][:8]}&myTasksPage=2"
    )

    assert first_page.status_code == 200
    assert first_page.json()["myTasks"]["limit"] == 12
    assert first_page.json()["myTasks"]["hasMore"] is True
    assert [item["taskId"] for item in first_page.json()["myTasks"]["items"]] == list(
        reversed(task_ids[1:])
    )
    assert second_page.status_code == 200
    assert second_page.json()["myTasks"]["hasMore"] is False
    assert [item["taskId"] for item in second_page.json()["myTasks"]["items"]] == [
        task_ids[0]
    ]
    assert searched_page.status_code == 200
    assert searched_page.json()["myTasks"]["hasMore"] is False
    assert [item["taskId"] for item in searched_page.json()["myTasks"]["items"]] == [
        task_ids[0]
    ]


@pytest.mark.django_db
def test_my_work_dashboard_hides_tasks_assigned_to_another_member(active_member) -> None:
    user, organization, owner_membership = active_member
    assignee = user.__class__.objects.create_user(
        username="direct-assignee",
        email="direct-assignee@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    assignee_membership = Membership.objects.create(
        organization=organization,
        user=assignee,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Specific assignee workflow",
        starter_mode="allActiveMembers",
        assignment_mode="specificMember",
        assignment_membership_id=str(assignee_membership.id),
    )
    owner_client = Client()
    owner_client.force_login(user)
    assignee_client = Client()
    assignee_client.force_login(assignee)

    start_response = owner_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-hidden-task"},
    )
    owner_dashboard = owner_client.get("/api/v1/my-work/")
    assignee_dashboard = assignee_client.get("/api/v1/my-work/")

    assert start_response.status_code == 200
    assert owner_dashboard.status_code == 200
    assert owner_dashboard.json()["myTasks"]["items"] == []
    assert assignee_dashboard.status_code == 200
    assert [item["taskId"] for item in assignee_dashboard.json()["myTasks"]["items"]] == [
        start_response.json()["taskId"]
    ]


@pytest.mark.django_db
def test_my_work_dashboard_hides_tasks_with_drifted_runtime_snapshot(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Drifted workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)
    start_response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-drifted-task"},
    )
    task_id = start_response.json()["taskId"]
    task = TaskOccurrence.objects.get(id=task_id)
    WorkflowVersion.objects.filter(id=task.workflow_version_id).update(
        source_draft_revision="999",
    )

    response = client.get("/api/v1/my-work/")

    assert start_response.status_code == 200
    assert response.status_code == 200
    assert response.json()["myTasks"]["items"] == []


@pytest.mark.django_db
def test_my_work_dashboard_hides_completed_tasks_after_authoritative_completion(
    active_member,
) -> None:
    user, _organization, owner_membership = active_member
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Completable workflow",
        starter_mode="allActiveMembers",
    )
    client = Client()
    client.force_login(user)
    start_response = client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-completable-task"},
    )
    complete_response = client.post(
        f"/api/v1/my-work/tasks/{start_response.json()['taskId']}/complete/",
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
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-complete-completable-task"},
    )

    response = client.get("/api/v1/my-work/")

    assert start_response.status_code == 200
    assert complete_response.status_code == 200
    assert response.status_code == 200
    assert response.json()["myTasks"]["items"] == []


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


@pytest.mark.django_db
def test_my_work_dashboard_returns_completed_process_summaries_for_authorized_participants(
    active_member,
) -> None:
    user, organization, owner_membership = active_member
    participant = user.__class__.objects.create_user(
        username="process-participant",
        email="process-participant@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Ana Perez",
    )
    outsider = user.__class__.objects.create_user(
        username="process-outsider",
        email="process-outsider@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Outside User",
    )
    participant_membership = Membership.objects.create(
        organization=organization,
        user=participant,
        role=MembershipRole.MEMBER,
    )
    Membership.objects.create(
        organization=organization,
        user=outsider,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Completed tracking",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(owner_membership.id)],
        assignment_mode="specificMember",
        assignment_membership_id=str(participant_membership.id),
    )
    owner_client = Client()
    owner_client.force_login(user)
    participant_client = Client()
    participant_client.force_login(participant)
    outsider_client = Client()
    outsider_client.force_login(outsider)

    start_response = owner_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-completed-tracking"},
    )
    completed = _complete_started_task(
        membership=participant_membership,
        task_id=start_response.json()["taskId"],
        request_hash_suffix="completed-tracking",
    )

    owner_dashboard = owner_client.get("/api/v1/my-work/")
    participant_dashboard = participant_client.get("/api/v1/my-work/")
    outsider_dashboard = outsider_client.get("/api/v1/my-work/")

    assert start_response.status_code == 200
    assert completed is not None
    assert owner_dashboard.status_code == 200
    assert participant_dashboard.status_code == 200
    assert outsider_dashboard.status_code == 200
    assert owner_dashboard.json()["myProcesses"]["items"] == [
        {
            "processId": start_response.json()["processId"],
            "processNumber": start_response.json()["processId"][:8],
            "workflowName": "Completed tracking",
            "workflowVersionNumber": 1,
            "involvement": "Initiator",
            "currentStep": "End",
            "currentStepKind": "end",
            "systemStatus": "completed",
            "startedAt": owner_dashboard.json()["myProcesses"]["items"][0]["startedAt"],
            "completedAt": owner_dashboard.json()["myProcesses"]["items"][0]["completedAt"],
            "lastActivityAt": owner_dashboard.json()["myProcesses"]["items"][0]["lastActivityAt"],
            "viewRoute": f"/my-work/processes/{start_response.json()['processId']}",
            "contributionSummary": {
                "kind": "initiated",
                "label": "You started this process."
            },
        }
    ]
    assert participant_dashboard.json()["myProcesses"]["items"] == [
        {
            "processId": start_response.json()["processId"],
            "processNumber": start_response.json()["processId"][:8],
            "workflowName": "Completed tracking",
            "workflowVersionNumber": 1,
            "involvement": "Previous participant",
            "currentStep": "End",
            "currentStepKind": "end",
            "systemStatus": "completed",
            "startedAt": participant_dashboard.json()["myProcesses"]["items"][0]["startedAt"],
            "completedAt": participant_dashboard.json()["myProcesses"]["items"][0]["completedAt"],
            "lastActivityAt": participant_dashboard.json()["myProcesses"]["items"][0][
                "lastActivityAt"
            ],
            "viewRoute": f"/my-work/processes/{start_response.json()['processId']}",
            "contributionSummary": {
                "kind": "submittedValue",
                "label": "Requester: Ana Perez"
            },
        }
    ]
    assert outsider_dashboard.json()["myProcesses"]["items"] == []


@pytest.mark.django_db
def test_my_work_dashboard_supports_completed_process_search_and_pagination(active_member) -> None:
    user, _organization, owner_membership = active_member
    workflow_ids = [
        _publish_workflow(
            membership=owner_membership,
            name=f"Completed intake {index}",
            starter_mode="allActiveMembers",
        )
        for index in range(13)
    ]
    client = Client()
    client.force_login(user)
    process_ids: list[str] = []
    for index, workflow_id in enumerate(workflow_ids):
        start_response = client.post(
            f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
            content_type="application/json",
            **{"HTTP_IDEMPOTENCY_KEY": f"workflow-start-completed-{index}"},
        )
        _complete_started_task(
            membership=owner_membership,
            task_id=start_response.json()["taskId"],
            request_hash_suffix=f"completed-{index}",
            value=f"Owner {index}",
        )
        process_ids.append(start_response.json()["processId"])

    default_response = client.get("/api/v1/my-work/")
    searched_response = client.get("/api/v1/my-work/?myProcessesSearch=intake%2012")
    paged_response = client.get("/api/v1/my-work/?myProcessesPage=2")
    second_workflow_page = client.get("/api/v1/my-work/?startWorkflowsPage=2")
    third_workflow_page = client.get("/api/v1/my-work/?startWorkflowsPage=3")
    normalized_workflow_page = client.get("/api/v1/my-work/?startWorkflowsPage=unsafe")

    assert default_response.status_code == 200
    assert searched_response.status_code == 200
    assert paged_response.status_code == 200
    assert second_workflow_page.status_code == 200
    assert third_workflow_page.status_code == 200
    assert normalized_workflow_page.status_code == 200
    assert default_response.json()["myProcesses"]["limit"] == 12
    assert default_response.json()["myProcesses"]["hasMore"] is True
    assert len(default_response.json()["myProcesses"]["items"]) == 12
    assert default_response.json()["myProcesses"]["items"][0]["processId"] == process_ids[-1]
    assert searched_response.json()["myProcesses"]["items"] == [
        {
            **searched_response.json()["myProcesses"]["items"][0],
            "workflowName": "Completed intake 12",
        }
    ]
    assert [item["processId"] for item in paged_response.json()["myProcesses"]["items"]] == [
        process_ids[0]
    ]
    assert len(second_workflow_page.json()["startWorkflows"]["items"]) == 6
    assert second_workflow_page.json()["startWorkflows"]["hasMore"] is True
    assert len(third_workflow_page.json()["startWorkflows"]["items"]) == 1
    assert third_workflow_page.json()["startWorkflows"]["hasMore"] is False
    assert normalized_workflow_page.json()["startWorkflows"] == default_response.json()[
        "startWorkflows"
    ]


@pytest.mark.django_db
def test_process_detail_returns_authorized_header_and_safe_timeline(active_member) -> None:
    user, organization, owner_membership = active_member
    participant = user.__class__.objects.create_user(
        username="timeline-participant",
        email="timeline-participant@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Authorized member",
    )
    participant_membership = Membership.objects.create(
        organization=organization,
        user=participant,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Timeline workflow",
        starter_mode="selectedMembers",
        starter_membership_ids=[str(owner_membership.id)],
        assignment_mode="specificMember",
        assignment_membership_id=str(participant_membership.id),
    )
    owner_client = Client()
    owner_client.force_login(user)

    start_response = owner_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-timeline"},
    )
    participant_client = Client()
    participant_client.force_login(participant)
    save_response = participant_client.put(
        f"/api/v1/my-work/tasks/{start_response.json()['taskId']}/form/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Private participant value",
                }
            ],
        },
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-save-timeline"},
    )
    complete_response = participant_client.post(
        f"/api/v1/my-work/tasks/{start_response.json()['taskId']}/complete/",
        data={
            "expectedTaskRevision": "2",
            "controls": [
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "Private participant value",
                }
            ],
        },
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-complete-timeline"},
    )

    detail_response = participant_client.get(
        f"/api/v1/my-work/processes/{start_response.json()['processId']}/"
    )

    assert save_response.status_code == 200
    assert complete_response.status_code == 200
    assert detail_response.status_code == 200
    assert detail_response.json()["header"] == {
        "processId": start_response.json()["processId"],
        "processNumber": start_response.json()["processId"][:8],
        "workflowName": "Timeline workflow",
        "workflowVersionNumber": 1,
        "systemStatus": "completed",
        "currentStep": "End",
        "currentStepKind": "end",
        "startedAt": detail_response.json()["header"]["startedAt"],
        "completedAt": detail_response.json()["header"]["completedAt"],
        "lastActivityAt": detail_response.json()["header"]["lastActivityAt"],
        "contributionSummary": {
            "kind": "submittedValue",
            "label": "Requester: Private participant value",
        },
    }
    assert [event["eventKind"] for event in detail_response.json()["timeline"]] == [
        "process_started",
        "task_progress_saved",
        "task_completed",
        "process_completed",
    ]
    assert detail_response.json()["timeline"][0]["actorDisplay"] == "Owner"
    assert detail_response.json()["timeline"][0]["actorDisplayKind"] == "member"
    assert detail_response.json()["timeline"][1]["actorDisplay"] == "Authorized member"
    assert detail_response.json()["timeline"][1]["actorDisplayKind"] == "member"
    assert detail_response.json()["timeline"][1]["label"] == "Task progress saved"
    assert detail_response.json()["timeline"][2]["taskPosition"] == "Task"
    assert detail_response.json()["timeline"][2]["taskPositionKind"] == "taskLabel"
    assert detail_response.json()["timeline"][0]["taskPositionKind"] == "start"
    assert detail_response.json()["timeline"][3]["taskPositionKind"] == "end"
    assert "fieldValues" not in str(detail_response.json())
    assert "routeTargetId" not in str(detail_response.json())
    assert "workflow-runtime.task-completed" not in str(detail_response.json())


@pytest.mark.django_db
def test_completed_process_summary_uses_bound_task_field_order_for_safe_contribution(
    active_member,
) -> None:
    user, organization, owner_membership = active_member
    participant = user.__class__.objects.create_user(
        username="ordered-field-participant",
        email="ordered-field-participant@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Ana Perez",
    )
    participant_membership = Membership.objects.create(
        organization=organization,
        user=participant,
        role=MembershipRole.MEMBER,
    )
    created = create_workflow_definition(
        tenant_context=_tenant_context(owner_membership),
        name="Ordered field workflow",
        idempotency_key=f"workflow-create-{uuid.uuid4().hex}",
        request_hash=_request_hash("ordered-field-create"),
    )
    draft = {
        "schemaVersion": 4,
        "draftId": created["draft"]["draftId"],
        "workflowId": created["workflowId"],
        "name": "Ordered field workflow",
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
            {"id": "field-1", "kind": "shortText", "label": "Visible contribution"},
            {"id": "field-2", "kind": "shortText", "label": "Secondary note"},
        ],
        "formBindings": [
            {
                "id": "binding-2",
                "taskElementId": "task-1",
                "fieldId": "field-2",
                "width": "full",
                "position": 1,
            },
            {
                "id": "binding-1",
                "taskElementId": "task-1",
                "fieldId": "field-1",
                "width": "full",
                "position": 0,
            },
        ],
        "publication": {
            "starter": {
                "mode": "selectedMembers",
                "teamIds": [],
                "membershipIds": [str(owner_membership.id)],
            },
            "assignment": {
                "mode": "specificMember",
                "membershipId": str(participant_membership.id),
            },
        },
    }
    saved = save_workflow_draft(
        tenant_context=_tenant_context(owner_membership),
        workflow_id=created["workflowId"],
        expected_revision="1",
        draft=draft,
        idempotency_key=f"workflow-save-{uuid.uuid4().hex}",
        request_hash=_request_hash("ordered-field-save"),
    )
    publish_workflow_version(
        tenant_context=_tenant_context(owner_membership),
        workflow_id=created["workflowId"],
        expected_revision=saved["revision"],
        idempotency_key=f"workflow-publish-{uuid.uuid4().hex}",
        request_hash=_request_hash("ordered-field-publish"),
    )
    owner_client = Client()
    owner_client.force_login(user)
    participant_client = Client()
    participant_client.force_login(participant)

    start_response = owner_client.post(
        f"/api/v1/my-work/start-workflows/{created['workflowId']}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-ordered-field"},
    )
    complete_response = participant_client.post(
        f"/api/v1/my-work/tasks/{start_response.json()['taskId']}/complete/",
        data={
            "expectedTaskRevision": "1",
            "controls": [
                {
                    "controlId": "binding-2",
                    "fieldId": "field-2",
                    "value": "Second field",
                },
                {
                    "controlId": "binding-1",
                    "fieldId": "field-1",
                    "value": "First visible field",
                },
            ],
        },
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-complete-ordered-field"},
    )
    participant_dashboard = participant_client.get("/api/v1/my-work/")

    assert complete_response.status_code == 200
    assert participant_dashboard.status_code == 200
    assert participant_dashboard.json()["myProcesses"]["items"][0]["contributionSummary"] == {
        "kind": "submittedValue",
        "label": "Visible contribution: First visible field",
    }


@pytest.mark.django_db
def test_process_detail_fails_closed_for_unauthorized_members(active_member) -> None:
    user, organization, owner_membership = active_member
    outsider = user.__class__.objects.create_user(
        username="timeline-outsider",
        email="timeline-outsider@example.com",
        password="a-secure-password-123",
        is_active=True,
    )
    outsider_membership = Membership.objects.create(
        organization=organization,
        user=outsider,
        role=MembershipRole.MEMBER,
    )
    workflow_id = _publish_workflow(
        membership=owner_membership,
        name="Denied timeline workflow",
        starter_mode="allActiveMembers",
    )
    owner_client = Client()
    owner_client.force_login(user)
    outsider_client = Client()
    outsider_client.force_login(outsider)

    start_response = owner_client.post(
        f"/api/v1/my-work/start-workflows/{workflow_id}/start/",
        content_type="application/json",
        **{"HTTP_IDEMPOTENCY_KEY": "workflow-start-denied-timeline"},
    )
    _complete_started_task(
        membership=owner_membership,
        task_id=start_response.json()["taskId"],
        request_hash_suffix="denied-timeline",
    )

    hidden_response = outsider_client.get(
        f"/api/v1/my-work/processes/{start_response.json()['processId']}/"
    )
    guessed_response = outsider_client.get(
        f"/api/v1/my-work/processes/{uuid.uuid4()}/"
    )
    Membership.objects.filter(id=outsider_membership.id).update(is_active=False)
    revoked_response = outsider_client.get(
        f"/api/v1/my-work/processes/{start_response.json()['processId']}/"
    )

    assert hidden_response.status_code == 404
    assert guessed_response.status_code == 404
    assert revoked_response.status_code == 404
    assert hidden_response.json()["code"] == "resource_not_found"
    assert guessed_response.json()["code"] == "resource_not_found"
    assert revoked_response.json()["code"] == "resource_not_found"
