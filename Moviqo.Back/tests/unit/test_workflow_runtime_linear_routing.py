from moviqo.modules.organizations.application import ActiveMembershipRecord
from moviqo.modules.workflow_runtime.application import task_assignment as task_assignment_module
from moviqo.modules.workflow_runtime.application.start_process import (
    _first_task_element_id,
)
from moviqo.modules.workflow_runtime.application.task_assignment import (
    resolve_task_assignee,
)
from moviqo.modules.workflow_runtime.application.task_form import (
    resolve_task_completion_route,
)


def test_linear_task_route_can_advance_to_another_task_then_end() -> None:
    document = {
        "schemaVersion": 7,
        "elements": [
            {"id": "task-1", "type": "task"},
            {"id": "task-2", "type": "task"},
            {"id": "end-1", "type": "end"},
        ],
        "connections": [
            {"sourceId": "task-1", "targetId": "task-2"},
            {"sourceId": "task-2", "targetId": "end-1"},
        ],
    }

    assert resolve_task_completion_route(
        document=document,
        task_element_id="task-1",
    ) == "task-2"
    assert resolve_task_completion_route(
        document=document,
        task_element_id="task-2",
    ) == "end-1"


def test_pre_v7_linear_task_route_keeps_legacy_first_task_only_behavior() -> None:
    document = {
        "schemaVersion": 6,
        "elements": [
            {"id": "start-1", "type": "start"},
            {"id": "task-1", "type": "task"},
            {"id": "task-2", "type": "task"},
            {"id": "end-1", "type": "end"},
        ],
        "connections": [
            {"sourceId": "start-1", "targetId": "task-1"},
            {"sourceId": "task-1", "targetId": "task-2"},
            {"sourceId": "task-2", "targetId": "end-1"},
        ],
    }

    assert _first_task_element_id(snapshot=document) is None
    assert resolve_task_completion_route(
        document=document,
        task_element_id="task-1",
    ) is None


def test_v7_task_assignment_resolves_the_assignment_on_the_reached_task() -> None:
    initiator = ActiveMembershipRecord(
        membership_id="membership-1",
        organization_id="organization-1",
        user_id=1,
        role="member",
    )
    snapshot = {
        "schemaVersion": 7,
        "elements": [
            {
                "id": "task-1",
                "type": "task",
                "assignment": {"mode": "specificMember", "membershipId": "other"},
            },
            {
                "id": "task-2",
                "type": "task",
                "assignment": {"mode": "workflowInitiator", "membershipId": None},
            },
        ],
    }

    assert resolve_task_assignee(
        organization_id="organization-1",
        snapshot=snapshot,
        task_element_id="task-2",
        initiator_membership=initiator,
    ) == initiator


def test_specific_member_assignment_does_not_require_an_active_initiator(
    monkeypatch,
) -> None:
    assignee = ActiveMembershipRecord(
        membership_id="membership-2",
        organization_id="organization-1",
        user_id=2,
        role="member",
    )
    monkeypatch.setattr(
        task_assignment_module,
        "read_active_membership_by_id",
        lambda **_kwargs: assignee,
    )

    assert resolve_task_assignee(
        organization_id="organization-1",
        snapshot={
            "schemaVersion": 7,
            "elements": [
                {
                    "id": "task-2",
                    "type": "task",
                    "assignment": {
                        "mode": "specificMember",
                        "membershipId": "membership-2",
                    },
                }
            ],
        },
        task_element_id="task-2",
        initiator_membership=None,
    ) == assignee
