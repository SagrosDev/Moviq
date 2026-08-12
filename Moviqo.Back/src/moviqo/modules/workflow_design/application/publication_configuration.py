from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.application import workflow_design_directory

STARTER_TARGET = "configuration.starter"
SCOPED_STARTER_MODES = frozenset({"selectedTeams", "selectedMembers"})


@dataclass(frozen=True)
class WorkflowStarterAuthorizationDecision:
    allowed: bool
    via_operational_authority: bool


def validate_publication_configuration(
    *,
    tenant_context: TenantContext,
    document: dict[str, Any],
) -> list[dict[str, Any]]:
    directory = workflow_design_directory(tenant_context=tenant_context)
    membership_ids = {option.membership_id for option in directory.memberships}
    teams = {option.team_id: option for option in directory.teams}

    starter = document.get("publication", {}).get("starter", {})
    starter_mode = starter.get("mode") or (
        "allActiveMembers" if starter.get("isConfigured", False) else "unconfigured"
    )
    issues: list[dict[str, Any]] = []
    selected_team_ids = starter.get("teamIds", [])
    selected_membership_ids = starter.get("membershipIds", [])

    if starter_mode == "unconfigured":
        issues.append(
            _issue(
                code="starter_missing",
                target=STARTER_TARGET,
                message=(
                    "We need one more detail before publishing: "
                    "choose who can start this workflow."
                ),
                action_label="Configure starter",
            )
        )
    elif starter_mode == "allActiveMembers":
        if not membership_ids:
            issues.append(
                _issue(
                    code="starter_invalid",
                    target=STARTER_TARGET,
                    message=(
                        "No active organization member can start this workflow yet. "
                        "Activate at least one eligible member first."
                    ),
                    action_label="Review starter",
                )
            )
    elif starter_mode in SCOPED_STARTER_MODES:
        if not selected_team_ids and not selected_membership_ids:
            issues.append(
                _issue(
                    code="starter_missing",
                    target=STARTER_TARGET,
                    message=(
                        "Choose at least one active team with active members "
                        "before publishing."
                    ),
                    action_label="Configure starter",
                )
            )
        elif any(team_id not in teams for team_id in selected_team_ids):
            issues.append(
                _issue(
                    code="starter_invalid",
                    target=STARTER_TARGET,
                    message=(
                        "One or more selected teams are inactive, empty, or outside "
                        "this organization."
                    ),
                    action_label="Review starter",
                )
            )
        elif any(
            membership_id not in membership_ids
            for membership_id in selected_membership_ids
        ):
            issues.append(
                _issue(
                    code="starter_invalid",
                    target=STARTER_TARGET,
                    message=(
                        "One or more selected members are inactive or outside "
                        "this organization."
                    ),
                    action_label="Review starter",
                )
            )
    else:
        issues.append(
            _issue(
                code="starter_invalid",
                target=STARTER_TARGET,
                message="This starter mode is not supported in this story.",
                action_label="Review starter",
            )
        )

    for task in (
        element for element in document.get("elements", [])
        if element.get("type") == "task"
    ):
        assignment = task.get("assignment", {})
        assignment_mode = assignment.get("mode", "unconfigured")
        target = f"elements.{task['id']}.assignment"
        if assignment_mode == "unconfigured":
            issues.append(
                _issue(
                    code="assignment_missing",
                    target=target,
                    element_id=task["id"],
                    message=f"Choose who receives the Task '{task['label']}'.",
                    action_label="Configure Task assignment",
                )
            )
        elif assignment_mode == "workflowInitiator":
            continue
        elif assignment_mode == "specificMember":
            membership_id = assignment.get("membershipId")
            if not membership_id:
                issues.append(
                    _issue(
                        code="assignment_missing",
                        target=target,
                        element_id=task["id"],
                        message=f"Choose one active member for the Task '{task['label']}'.",
                        action_label="Configure Task assignment",
                    )
                )
            elif membership_id not in membership_ids:
                issues.append(
                    _issue(
                        code="assignment_invalid",
                        target=target,
                        element_id=task["id"],
                        message=(
                            f"The assignee for the Task '{task['label']}' is inactive "
                            "or outside this organization."
                        ),
                        action_label="Review Task assignment",
                    )
                )
        else:
            issues.append(
                _issue(
                    code="assignment_invalid",
                    target=target,
                    element_id=task["id"],
                    message="This Task assignment mode is not supported.",
                    action_label="Review Task assignment",
                )
            )

    return issues


def evaluate_workflow_starter_authorization(
    *,
    publication: dict[str, Any],
    membership_id: str,
    membership_role: str,
    active_team_ids: set[str],
) -> WorkflowStarterAuthorizationDecision:
    if membership_role in {"owner", "administrator"}:
        return WorkflowStarterAuthorizationDecision(
            allowed=True,
            via_operational_authority=True,
        )

    starter = publication.get("starter", {})
    starter_mode = starter.get("mode", "unconfigured")
    if starter_mode == "allActiveMembers":
        return WorkflowStarterAuthorizationDecision(
            allowed=True,
            via_operational_authority=False,
        )
    if starter_mode in SCOPED_STARTER_MODES:
        selected_membership_ids = set(starter.get("membershipIds", []))
        selected_team_ids = set(starter.get("teamIds", []))
        return WorkflowStarterAuthorizationDecision(
            allowed=(
                membership_id in selected_membership_ids
                or bool(active_team_ids.intersection(selected_team_ids))
            ),
            via_operational_authority=False,
        )

    return WorkflowStarterAuthorizationDecision(
        allowed=False,
        via_operational_authority=False,
    )


def _issue(
    *,
    code: str,
    target: str,
    message: str,
    action_label: str,
    element_id: str | None = None,
) -> dict[str, Any]:
    return {
        "code": code,
        "severity": "blocking",
        "target": target,
        "elementId": element_id,
        "fieldId": None,
        "bindingId": None,
        "message": message,
        "actionLabel": action_label,
    }
