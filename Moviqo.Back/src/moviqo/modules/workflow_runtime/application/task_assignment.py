from __future__ import annotations

from typing import Any

from moviqo.modules.organizations.application import (
    ActiveMembershipRecord,
    read_active_membership_by_id,
)


def resolve_task_assignee(
    *,
    organization_id,
    snapshot: dict[str, Any],
    task_element_id: str,
    initiator_membership: ActiveMembershipRecord | None,
) -> ActiveMembershipRecord | None:
    assignment = _task_assignment(
        snapshot=snapshot,
        task_element_id=task_element_id,
    )
    mode = assignment.get("mode")
    if mode == "workflowInitiator":
        return initiator_membership
    if mode != "specificMember":
        return None

    membership_id = assignment.get("membershipId")
    if not membership_id:
        return None
    return read_active_membership_by_id(
        organization_id=organization_id,
        membership_id=membership_id,
    )


def _task_assignment(
    *,
    snapshot: dict[str, Any],
    task_element_id: str,
) -> dict[str, Any]:
    if snapshot.get("schemaVersion", 0) < 7:
        return snapshot.get("publication", {}).get("assignment", {})
    for element in snapshot.get("elements", []):
        if element.get("id") == task_element_id and element.get("type") == "task":
            assignment = element.get("assignment", {})
            return assignment if isinstance(assignment, dict) else {}
    return {}
