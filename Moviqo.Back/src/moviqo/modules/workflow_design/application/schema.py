from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

CURRENT_DRAFT_SCHEMA_VERSION = 2
CURRENT_DRAFT_FIELDS = frozenset(
    {
        "schemaVersion",
        "draftId",
        "workflowId",
        "name",
        "status",
        "elements",
        "connections",
    }
)
CURRENT_ELEMENT_FIELDS = frozenset({"id", "type", "label"})
CURRENT_CONNECTION_FIELDS = frozenset({"id", "type", "sourceId", "targetId"})
SUPPORTED_ELEMENT_TYPES = frozenset({"start", "task", "end"})
SUPPORTED_CONNECTION_TYPES = frozenset({"sequence"})
LEGACY_DRAFT_SCHEMA_VERSION = 1


class WorkflowDraftSchemaError(ValueError):
    pass


class UnknownDraftFieldError(WorkflowDraftSchemaError):
    pass


class UnsupportedDraftSchemaVersionError(WorkflowDraftSchemaError):
    pass


class WorkflowDraftValidationError(WorkflowDraftSchemaError):
    def __init__(self, issues: list[dict[str, str]]) -> None:
        super().__init__("Workflow draft graph is invalid.")
        self.issues = issues


def load_draft_document(payload: dict[str, Any]) -> dict[str, Any]:
    schema_version = payload.get("schemaVersion", 0)
    if schema_version == 0:
        payload = _upcast_v0_to_v1(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == 1:
        payload = _upcast_v1_to_v2(payload)
    elif schema_version != CURRENT_DRAFT_SCHEMA_VERSION:
        raise UnsupportedDraftSchemaVersionError(
            f"Unsupported draft schema version: {schema_version}"
        )

    return dump_current_draft(payload)


def dump_current_draft(payload: dict[str, Any]) -> dict[str, Any]:
    unknown_fields = sorted(set(payload) - CURRENT_DRAFT_FIELDS)
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow draft fields: " + ", ".join(unknown_fields)
        )

    _require_type(payload, "schemaVersion", int)
    _require_type(payload, "draftId", str)
    _require_type(payload, "workflowId", str)
    _require_type(payload, "name", str)
    _require_type(payload, "status", str)
    elements = payload.get("elements")
    connections = payload.get("connections")
    if not isinstance(elements, list):
        raise WorkflowDraftSchemaError("Workflow draft elements must be a list.")
    if not isinstance(connections, list):
        raise WorkflowDraftSchemaError("Workflow draft connections must be a list.")

    normalized_elements = [_normalize_element(element) for element in elements]
    normalized_connections = [
        _normalize_connection(connection) for connection in connections
    ]

    return {
        "schemaVersion": payload["schemaVersion"],
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload["status"],
        "elements": normalized_elements,
        "connections": normalized_connections,
    }


def new_workflow_draft_document(*, draft_id: str, workflow_id: str, name: str) -> dict[str, Any]:
    return dump_current_draft(
        {
            "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
            "draftId": draft_id,
            "workflowId": workflow_id,
            "name": name,
            "status": "draft",
            "elements": [],
            "connections": [],
        }
    )


def _upcast_v0_to_v1(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": LEGACY_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": "draft",
        "elements": list(payload.get("elements", [])),
    }


def _upcast_v1_to_v2(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload.get("status", "draft"),
        "elements": list(payload.get("elements", [])),
        "connections": [],
    }


def validate_workflow_graph_document(payload: dict[str, Any]) -> dict[str, Any]:
    document = dump_current_draft(payload)
    issues: list[dict[str, str]] = []
    elements = document["elements"]
    connections = document["connections"]

    element_by_id = {element["id"]: element for element in elements}
    if len(element_by_id) != len(elements):
        issues.append(
            {
                "field": "elements",
                "code": "duplicate_element_id",
                "reason": "Use a unique identifier for each workflow element.",
            }
        )

    connection_by_id = {connection["id"]: connection for connection in connections}
    if len(connection_by_id) != len(connections):
        issues.append(
            {
                "field": "connections",
                "code": "duplicate_connection_id",
                "reason": "Use a unique identifier for each workflow connection.",
            }
        )

    if issues:
        raise WorkflowDraftValidationError(issues)

    incoming: dict[str, list[dict[str, str]]] = defaultdict(list)
    outgoing: dict[str, list[dict[str, str]]] = defaultdict(list)

    for connection in connections:
        source_id = connection["sourceId"]
        target_id = connection["targetId"]
        if source_id not in element_by_id:
            issues.append(
                {
                    "field": f"connections.{connection['id']}.sourceId",
                    "code": "missing_source",
                    "connectionId": connection["id"],
                    "reason": "Connect from an existing workflow step.",
                }
            )
        if target_id not in element_by_id:
            issues.append(
                {
                    "field": f"connections.{connection['id']}.targetId",
                    "code": "missing_target",
                    "connectionId": connection["id"],
                    "reason": "Connect to an existing workflow step.",
                }
            )
        if source_id in element_by_id and target_id in element_by_id:
            outgoing[source_id].append(connection)
            incoming[target_id].append(connection)

    starts = [element for element in elements if element["type"] == "start"]
    tasks = [element for element in elements if element["type"] == "task"]
    ends = [element for element in elements if element["type"] == "end"]

    if len(starts) != 1:
        issues.append(
            {
                "field": "elements",
                "code": "start_count_invalid",
                "reason": "Add exactly one Start step before saving the workflow.",
            }
        )
    if len(ends) != 1:
        issues.append(
            {
                "field": "elements",
                "code": "end_count_invalid",
                "reason": "Add exactly one End step before saving the workflow.",
            }
        )
    if len(tasks) < 1:
        issues.append(
            {
                "field": "elements",
                "code": "task_required",
                "reason": "Add at least one Task step before saving the workflow.",
            }
        )

    for element in elements:
        incoming_count = len(incoming.get(element["id"], []))
        outgoing_connections = outgoing.get(element["id"], [])
        outgoing_count = len(outgoing_connections)
        element_type = element["type"]

        if element_type == "start":
            if incoming_count != 0:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "start_incoming_forbidden",
                        "elementId": element["id"],
                        "reason": "Start cannot receive incoming work.",
                    }
                )
            if outgoing_count != 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "start_outgoing_invalid",
                        "elementId": element["id"],
                        "reason": "Connect Start to exactly one Task step.",
                    }
                )
            elif element_by_id[outgoing_connections[0]["targetId"]]["type"] != "task":
                issues.append(
                    {
                        "field": f"connections.{outgoing_connections[0]['id']}",
                        "code": "start_target_invalid",
                        "connectionId": outgoing_connections[0]["id"],
                        "reason": "Start can connect only to a Task step.",
                    }
                )
        elif element_type == "task":
            if incoming_count < 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "task_incoming_required",
                        "elementId": element["id"],
                        "reason": "Connect this Task from Start or another Task.",
                    }
                )
            if outgoing_count != 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "task_outgoing_invalid",
                        "elementId": element["id"],
                        "reason": "Connect this Task to one next step before saving.",
                    }
                )
            for connection in outgoing_connections:
                target_type = element_by_id[connection["targetId"]]["type"]
                if target_type not in {"task", "end"}:
                    issues.append(
                        {
                            "field": f"connections.{connection['id']}",
                            "code": "task_target_invalid",
                            "connectionId": connection["id"],
                            "reason": "Task can connect only to another Task or End.",
                        }
                    )
        elif element_type == "end":
            if incoming_count < 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "end_incoming_required",
                        "elementId": element["id"],
                        "reason": "Connect at least one Task to End before saving.",
                    }
                )
            if outgoing_count != 0:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "end_outgoing_forbidden",
                        "elementId": element["id"],
                        "reason": "End cannot connect to another step.",
                    }
                )

    if len(starts) == 1 and len(ends) == 1:
        reachable_from_start = _reachable_ids(starts[0]["id"], outgoing)
        for element in elements:
            if element["id"] not in reachable_from_start:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "element_disconnected",
                        "elementId": element["id"],
                        "reason": "Connect this step into the Start to End path.",
                    }
                )
        reverse_graph: dict[str, list[dict[str, str]]] = defaultdict(list)
        for target_id, incoming_connections in incoming.items():
            reverse_graph[target_id] = incoming_connections
        reaches_end = _reachable_ids(ends[0]["id"], reverse_graph, reverse=True)
        for element in elements:
            if element["type"] != "end" and element["id"] not in reaches_end:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "path_to_end_required",
                        "elementId": element["id"],
                        "reason": "Connect this step so the workflow reaches End.",
                    }
                )

    if issues:
        raise WorkflowDraftValidationError(_deduplicate_issues(issues))

    return document


def _require_type(payload: dict[str, Any], field_name: str, expected_type: type) -> None:
    if not isinstance(payload.get(field_name), expected_type):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be {expected_type.__name__}."
        )


def _require_non_blank_string(payload: dict[str, Any], field_name: str) -> str:
    value = str(payload[field_name]).strip()
    if not value:
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' cannot be blank."
        )
    return value


def _normalize_element(payload: Any) -> dict[str, str]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow draft elements must be objects.")

    unknown_fields = sorted(set(payload) - CURRENT_ELEMENT_FIELDS)
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow element fields: " + ", ".join(unknown_fields)
        )

    _require_type(payload, "id", str)
    _require_type(payload, "type", str)
    _require_type(payload, "label", str)
    element_id = _require_non_blank_string(payload, "id")
    label = _require_non_blank_string(payload, "label")

    if payload["type"] not in SUPPORTED_ELEMENT_TYPES:
        raise WorkflowDraftSchemaError(
            f"Unsupported workflow element type: {payload['type']}"
        )

    return {
        "id": element_id,
        "type": payload["type"],
        "label": label,
    }


def _normalize_connection(payload: Any) -> dict[str, str]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow draft connections must be objects.")

    unknown_fields = sorted(set(payload) - CURRENT_CONNECTION_FIELDS)
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow connection fields: " + ", ".join(unknown_fields)
        )

    _require_type(payload, "id", str)
    _require_type(payload, "type", str)
    _require_type(payload, "sourceId", str)
    _require_type(payload, "targetId", str)
    connection_id = _require_non_blank_string(payload, "id")
    source_id = _require_non_blank_string(payload, "sourceId")
    target_id = _require_non_blank_string(payload, "targetId")

    if payload["type"] not in SUPPORTED_CONNECTION_TYPES:
        raise WorkflowDraftSchemaError(
            f"Unsupported workflow connection type: {payload['type']}"
        )

    return {
        "id": connection_id,
        "type": payload["type"],
        "sourceId": source_id,
        "targetId": target_id,
    }


def _reachable_ids(
    start_id: str,
    graph: dict[str, list[dict[str, str]]],
    *,
    reverse: bool = False,
) -> set[str]:
    visited: set[str] = set()
    queue: deque[str] = deque([start_id])

    while queue:
        current_id = queue.popleft()
        if current_id in visited:
            continue
        visited.add(current_id)
        for connection in graph.get(current_id, []):
            next_id = connection["sourceId"] if reverse else connection["targetId"]
            if next_id not in visited:
                queue.append(next_id)

    return visited


def _deduplicate_issues(issues: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[tuple[str, str], ...]] = set()
    deduplicated: list[dict[str, str]] = []
    for issue in issues:
        marker = tuple(sorted(issue.items()))
        if marker in seen:
            continue
        seen.add(marker)
        deduplicated.append(issue)
    return deduplicated
