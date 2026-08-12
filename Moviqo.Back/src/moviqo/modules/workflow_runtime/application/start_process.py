from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.application import (
    ActiveMembershipRecord,
    list_active_team_ids,
    read_active_membership,
)
from moviqo.modules.workflow_design.application import (
    PublishedWorkflowVersionRecord,
    list_latest_published_workflow_versions,
    read_latest_published_workflow_version,
)
from moviqo.modules.workflow_design.application.publication_configuration import (
    WorkflowStarterAuthorizationDecision,
    evaluate_workflow_starter_authorization,
)
from moviqo.modules.workflow_runtime.application.task_assignment import (
    resolve_task_assignee,
)
from moviqo.modules.workflow_runtime.models import ProcessInstance, TaskOccurrence

PROCESS_START_COMMAND = "workflow-runtime.start-process"


@dataclass(frozen=True)
class StartableWorkflowSummary:
    workflow_id: str
    title: str
    description: str
    availability: str
    version_number: int


def list_startable_workflows(
    *,
    tenant_context: TenantContext,
) -> list[StartableWorkflowSummary]:
    membership = read_active_membership(tenant_context=tenant_context)
    if membership is None:
        return []

    active_team_ids = list_active_team_ids(tenant_context=tenant_context)
    summaries: list[StartableWorkflowSummary] = []
    for version in list_latest_published_workflow_versions(tenant_context=tenant_context):
        decision = _starter_decision(
            version=version,
            membership=membership,
            active_team_ids=active_team_ids,
        )
        if not decision.allowed:
            continue
        summaries.append(
            StartableWorkflowSummary(
                workflow_id=str(version.workflow_id),
                title=_workflow_title_from_snapshot(version),
                description="",
                availability=_availability_message(
                    publication=version.snapshot.get("publication", {}),
                    decision=decision,
                ),
                version_number=version.version_number,
            )
        )
    summaries.sort(key=lambda item: (item.title.casefold(), item.workflow_id))
    return summaries


def start_process(
    *,
    tenant_context: TenantContext,
    workflow_id,
    idempotency_key: str,
    request_hash: str,
) -> dict[str, Any] | None:
    membership = read_active_membership(tenant_context=tenant_context)
    if membership is None:
        return None

    version = read_latest_published_workflow_version(
        tenant_context=tenant_context,
        workflow_id=workflow_id,
    )
    if version is None:
        return None

    active_team_ids = list_active_team_ids(tenant_context=tenant_context)
    decision = _starter_decision(
        version=version,
        membership=membership,
        active_team_ids=active_team_ids,
    )
    if not decision.allowed:
        return None

    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=PROCESS_START_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _start_process_side_effects(
            command_context=command_context,
            membership=membership,
            version=version,
            decision=decision,
        ),
    )
    return None if execution.result.get("outcome") == "denied" else execution.result


def _start_process_side_effects(
    *,
    command_context,
    membership: ActiveMembershipRecord,
    version: PublishedWorkflowVersionRecord,
    decision: WorkflowStarterAuthorizationDecision,
) -> dict[str, Any]:
    snapshot = version.snapshot
    first_task_element_id = _first_task_element_id(snapshot=snapshot)
    if first_task_element_id is None:
        return {"outcome": "denied"}

    assignee_membership = resolve_task_assignee(
        organization_id=membership.organization_id,
        snapshot=snapshot,
        task_element_id=first_task_element_id,
        initiator_membership=membership,
    )
    if assignee_membership is None:
        return {"outcome": "denied"}

    process = ProcessInstance.objects.create(
        organization_id=membership.organization_id,
        workflow_id=version.workflow_id,
        workflow_version_id=version.version_id,
        initiator_membership_id=membership.membership_id,
        initiator_user_id=membership.user_id,
    )
    task = TaskOccurrence.objects.create(
        organization_id=membership.organization_id,
        workflow_id=version.workflow_id,
        workflow_version_id=version.version_id,
        process=process,
        task_element_id=first_task_element_id,
        assignee_membership_id=assignee_membership.membership_id,
        assignee_user_id=assignee_membership.user_id,
        activated_by_membership_id=membership.membership_id,
        activated_by_user_id=membership.user_id,
        definition_revision=version.source_draft_revision,
        revision="1",
        status="assigned",
    )

    command_context.append_audit(
        event_type="workflow-runtime.process-started",
        payload={
            "workflowId": str(version.workflow_id),
            "workflowVersionId": str(version.version_id),
            "versionNumber": version.version_number,
            "processId": str(process.id),
            "taskId": str(task.id),
            "initiatorMembershipId": str(membership.membership_id),
            "initiatorUserId": membership.user_id,
            "startedAt": process.started_at.isoformat(),
            "viaOperationalAuthority": decision.via_operational_authority,
        },
    )

    return {
        "processId": str(process.id),
        "taskId": str(task.id),
        "workflow": {
            "workflowId": str(version.workflow_id),
            "title": _workflow_title_from_snapshot(version),
            "versionNumber": version.version_number,
        },
        "destinationRoute": f"/my-work/tasks/{task.id}",
}

def _starter_decision(
    *,
    version: PublishedWorkflowVersionRecord,
    membership: ActiveMembershipRecord,
    active_team_ids: set[str],
) -> WorkflowStarterAuthorizationDecision:
    return evaluate_workflow_starter_authorization(
        publication=version.snapshot.get("publication", {}),
        membership_id=membership.membership_id,
        membership_role=membership.role,
        active_team_ids=active_team_ids,
    )


def _availability_message(
    *,
    publication: dict[str, Any],
    decision: WorkflowStarterAuthorizationDecision,
) -> str:
    if decision.via_operational_authority:
        return "Available through your operational authority."
    starter_mode = publication.get("starter", {}).get("mode")
    if starter_mode == "allActiveMembers":
        return "Available to active members in your organization."
    if starter_mode == "selectedTeams":
        return "Available through one of your active teams."
    return "Available through your starter access."


def _workflow_title_from_snapshot(version: PublishedWorkflowVersionRecord) -> str:
    title = version.snapshot.get("name")
    return title if isinstance(title, str) and title.strip() else version.workflow_name


def _first_task_element_id(*, snapshot: dict[str, Any]) -> str | None:
    elements = {element["id"]: element for element in snapshot.get("elements", [])}
    connections = snapshot.get("connections", [])
    start_ids = [
        element_id
        for element_id, element in elements.items()
        if element.get("type") == "start"
    ]
    if len(start_ids) != 1:
        return None
    outgoing_from_start = [
        connection["targetId"]
        for connection in connections
        if connection.get("sourceId") == start_ids[0]
    ]
    if len(outgoing_from_start) != 1:
        return None
    first_task_id = outgoing_from_start[0]
    first_task = elements.get(first_task_id)
    if first_task is None or first_task.get("type") != "task":
        return None
    if snapshot.get("schemaVersion", 0) < 7 and not any(
        connection.get("sourceId") == first_task_id
        and elements.get(connection.get("targetId"), {}).get("type") == "end"
        for connection in connections
    ):
        return None
    return first_task_id
