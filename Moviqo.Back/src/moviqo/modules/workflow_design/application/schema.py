from __future__ import annotations

from collections import defaultdict, deque
from math import isfinite
from typing import Any

CURRENT_DRAFT_SCHEMA_VERSION = 7
CURRENT_DRAFT_FIELDS = frozenset(
    {
        "schemaVersion",
        "draftId",
        "workflowId",
        "name",
        "status",
        "elements",
        "connections",
        "processFields",
        "formBindings",
        "publication",
        "layout",
    }
)
CURRENT_ELEMENT_FIELDS = frozenset({"id", "type", "label", "assignment"})
CURRENT_CONNECTION_FIELDS = frozenset({"id", "type", "sourceId", "targetId", "label"})
CURRENT_PROCESS_FIELD_FIELDS = frozenset(
    {
        "id",
        "kind",
        "label",
        "helpText",
        "placeholder",
        "defaultValue",
        "minimumLength",
        "maximumLength",
    }
)
CURRENT_FORM_BINDING_FIELDS = frozenset(
    {"id", "taskElementId", "fieldId", "position", "width", "label"}
)
SUPPORTED_ELEMENT_TYPES = frozenset({"start", "task", "end"})
SUPPORTED_CONNECTION_TYPES = frozenset({"sequence"})
SUPPORTED_PROCESS_FIELD_KINDS = frozenset({"shortText"})
LEGACY_DRAFT_SCHEMA_VERSION = 1
GRAPH_DRAFT_SCHEMA_VERSION = 2
PUBLICATION_DRAFT_SCHEMA_VERSION = 3
CONFIGURATION_DRAFT_SCHEMA_VERSION = 4
CONNECTION_LABEL_DRAFT_SCHEMA_VERSION = 5
LAYOUT_DRAFT_SCHEMA_VERSION = 6
MAXIMUM_LAYOUT_COORDINATE = 100_000
SHORT_TEXT_MAXIMUM_LENGTH = 255
STARTER_MODES = frozenset(
    {
        "unconfigured",
        "allActiveMembers",
        "selectedTeams",
        "selectedMembers",
    }
)
ASSIGNMENT_MODES = frozenset(
    {
        "unconfigured",
        "workflowInitiator",
        "specificMember",
    }
)


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

    if schema_version == LEGACY_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v1_to_v2(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == GRAPH_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v2_to_v3(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == PUBLICATION_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v3_to_v4(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == CONFIGURATION_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v4_to_v5(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == CONNECTION_LABEL_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v5_to_v6(payload)
        schema_version = payload["schemaVersion"]

    if schema_version == LAYOUT_DRAFT_SCHEMA_VERSION:
        payload = _upcast_v6_to_v7(payload)
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
    process_fields = payload.get("processFields", [])
    form_bindings = payload.get("formBindings", [])
    publication = payload.get("publication", {})
    layout = payload.get("layout", {})
    if not isinstance(elements, list):
        raise WorkflowDraftSchemaError("Workflow draft elements must be a list.")
    if not isinstance(connections, list):
        raise WorkflowDraftSchemaError("Workflow draft connections must be a list.")
    if not isinstance(process_fields, list):
        raise WorkflowDraftSchemaError("Workflow draft processFields must be a list.")
    if not isinstance(form_bindings, list):
        raise WorkflowDraftSchemaError("Workflow draft formBindings must be a list.")
    if not isinstance(publication, dict):
        raise WorkflowDraftSchemaError("Workflow draft publication must be an object.")

    normalized_elements = [_normalize_element(element) for element in elements]
    normalized_connections = [
        _normalize_connection(connection) for connection in connections
    ]
    normalized_process_fields = [
        _normalize_process_field(field) for field in process_fields
    ]
    normalized_form_bindings = [
        _normalize_form_binding(binding) for binding in form_bindings
    ]
    normalized_publication = _normalize_publication(publication)
    normalized_layout = _normalize_layout(
        layout,
        element_ids={element["id"] for element in normalized_elements},
    )

    return {
        "schemaVersion": payload["schemaVersion"],
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload["status"],
        "elements": normalized_elements,
        "connections": normalized_connections,
        "processFields": normalized_process_fields,
        "formBindings": normalized_form_bindings,
        "publication": normalized_publication,
        "layout": normalized_layout,
    }


def new_workflow_draft_document(*, draft_id: str, workflow_id: str, name: str) -> dict[str, Any]:
    return dump_current_draft(
        {
            "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
            "draftId": draft_id,
            "workflowId": workflow_id,
            "name": name,
            "status": "draft",
            "elements": [{"id": "start-1", "type": "start", "label": "Start"}],
            "connections": [],
            "processFields": [],
            "formBindings": [],
            "publication": {},
            "layout": {"positions": {"start-1": {"x": 80, "y": 120}}},
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
        "schemaVersion": GRAPH_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload.get("status", "draft"),
        "elements": list(payload.get("elements", [])),
        "connections": [],
        "processFields": [],
        "formBindings": [],
        "publication": {},
    }


def _upcast_v2_to_v3(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": PUBLICATION_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload.get("status", "draft"),
        "elements": list(payload.get("elements", [])),
        "connections": list(payload.get("connections", [])),
        "processFields": [],
        "formBindings": [],
        "publication": {},
    }


def _upcast_v3_to_v4(payload: dict[str, Any]) -> dict[str, Any]:
    legacy_publication = payload.get("publication", {})
    legacy_starter = legacy_publication.get("starter", {})
    legacy_assignment = legacy_publication.get("assignment", {})

    return {
        "schemaVersion": CONFIGURATION_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload.get("status", "draft"),
        "elements": list(payload.get("elements", [])),
        "connections": list(payload.get("connections", [])),
        "processFields": list(payload.get("processFields", [])),
        "formBindings": list(payload.get("formBindings", [])),
        "publication": {
            "starter": {
                "mode": (
                    "allActiveMembers"
                    if bool(legacy_starter.get("isConfigured", False))
                    else "unconfigured"
                ),
                "teamIds": [],
                "membershipIds": [],
            },
            "assignment": {
                "mode": (
                    "workflowInitiator"
                    if bool(legacy_assignment.get("isConfigured", False))
                    else "unconfigured"
                ),
                "membershipId": None,
            },
        },
    }


def _upcast_v4_to_v5(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        **payload,
        "schemaVersion": CONNECTION_LABEL_DRAFT_SCHEMA_VERSION,
        "connections": [
            {**connection, "label": connection.get("label")}
            for connection in payload.get("connections", [])
        ],
    }


def _upcast_v5_to_v6(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        **payload,
        "schemaVersion": LAYOUT_DRAFT_SCHEMA_VERSION,
        "layout": {"positions": {}},
    }


def _upcast_v6_to_v7(payload: dict[str, Any]) -> dict[str, Any]:
    elements = [dict(element) for element in payload.get("elements", [])]
    first_task_id = _first_task_id_from_document(payload)
    legacy_assignment = payload.get("publication", {}).get("assignment", {})
    for element in elements:
        if element.get("type") == "task":
            element["assignment"] = (
                legacy_assignment
                if element.get("id") == first_task_id
                else {"mode": "unconfigured", "membershipId": None}
            )
    publication = dict(payload.get("publication", {}))
    publication.pop("assignment", None)
    return {
        **payload,
        "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
        "elements": elements,
        "publication": publication,
    }


def _normalize_layout(
    payload: Any,
    *,
    element_ids: set[str],
) -> dict[str, dict[str, dict[str, int | float]]]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow draft layout must be an object.")
    unknown_fields = sorted(set(payload) - {"positions"})
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow layout fields: " + ", ".join(unknown_fields)
        )
    positions = payload.get("positions", {})
    if not isinstance(positions, dict):
        raise WorkflowDraftSchemaError(
            "Workflow draft layout positions must be an object."
        )

    normalized_positions: dict[str, dict[str, int | float]] = {}
    for element_id, position in positions.items():
        if not isinstance(element_id, str) or element_id not in element_ids:
            raise WorkflowDraftSchemaError(
                "Workflow draft layout positions must reference existing elements."
            )
        if not isinstance(position, dict) or set(position) != {"x", "y"}:
            raise WorkflowDraftSchemaError(
                "Workflow draft layout positions must contain only x and y coordinates."
            )
        normalized_position: dict[str, int | float] = {}
        for axis in ("x", "y"):
            coordinate = position[axis]
            if (
                isinstance(coordinate, bool)
                or not isinstance(coordinate, int | float)
                or not isfinite(coordinate)
                or abs(coordinate) > MAXIMUM_LAYOUT_COORDINATE
            ):
                raise WorkflowDraftSchemaError(
                    "Workflow draft layout coordinates must be finite numbers "
                    f"between {-MAXIMUM_LAYOUT_COORDINATE} and "
                    f"{MAXIMUM_LAYOUT_COORDINATE}."
                )
            normalized_position[axis] = coordinate
        normalized_positions[element_id] = normalized_position

    return {"positions": normalized_positions}


def _normalize_publication(payload: dict[str, Any]) -> dict[str, Any]:
    starter = payload.get("starter", {})
    unknown_fields = sorted(set(payload) - {"starter"})
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow publication fields: " + ", ".join(unknown_fields)
        )
    if not isinstance(starter, dict):
        raise WorkflowDraftSchemaError("Workflow draft publication starter must be an object.")

    starter_mode = starter.get("mode") or (
        "allActiveMembers" if bool(starter.get("isConfigured", False)) else "unconfigured"
    )
    if starter_mode not in STARTER_MODES:
        raise WorkflowDraftSchemaError(
            f"Unsupported workflow draft starter mode: {starter_mode}"
        )
    return {
        "starter": {
            "mode": starter_mode,
            "teamIds": _normalize_identifier_list(starter, "teamIds"),
            "membershipIds": _normalize_identifier_list(starter, "membershipIds"),
        },
    }


def validate_workflow_draft_integrity(payload: dict[str, Any]) -> dict[str, Any]:
    document = dump_current_draft(payload)
    issues: list[dict[str, str]] = []
    elements = document["elements"]
    connections = document["connections"]
    process_fields = document["processFields"]
    form_bindings = document["formBindings"]

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

    process_field_by_id = {field["id"]: field for field in process_fields}
    if len(process_field_by_id) != len(process_fields):
        issues.append(
            {
                "field": "processFields",
                "code": "duplicate_field_id",
                "reason": "Use a unique identifier for each reusable field.",
            }
        )

    binding_by_id = {binding["id"]: binding for binding in form_bindings}
    if len(binding_by_id) != len(form_bindings):
        issues.append(
            {
                "field": "formBindings",
                "code": "duplicate_binding_id",
                "reason": "Use a unique identifier for each task field placement.",
            }
        )

    seen_binding_pairs: set[tuple[str, str]] = set()
    for binding in form_bindings:
        pair = (binding["taskElementId"], binding["fieldId"])
        if pair in seen_binding_pairs:
            issues.append(
                {
                    "field": f"formBindings.{binding['id']}",
                    "code": "duplicate_binding_pair",
                    "reason": "Use the same reusable field once per task form.",
                }
            )
        seen_binding_pairs.add(pair)

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
    ends = [element for element in elements if element["type"] == "end"]

    if len(starts) > 1:
        issues.append(
            {
                "field": "elements",
                "code": "start_count_invalid",
                "reason": "Keep at most one Start step in the workflow draft.",
            }
        )
    if len(ends) > 1:
        issues.append(
            {
                "field": "elements",
                "code": "end_count_invalid",
                "reason": "Keep at most one End step in the workflow draft.",
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
            if outgoing_count > 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "start_outgoing_invalid",
                        "elementId": element["id"],
                        "reason": "Start can connect to at most one Task step.",
                    }
                )
            elif outgoing_count == 1 and (
                outgoing_connections[0]["targetId"] in element_by_id
                and element_by_id[outgoing_connections[0]["targetId"]]["type"] != "task"
            ):
                issues.append(
                    {
                        "field": f"connections.{outgoing_connections[0]['id']}",
                        "code": "start_target_invalid",
                        "connectionId": outgoing_connections[0]["id"],
                        "reason": "Start can connect only to a Task step.",
                    }
                )
        elif element_type == "task":
            if incoming_count > 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "task_incoming_invalid",
                        "elementId": element["id"],
                        "reason": "Task can receive work from at most one previous step.",
                    }
                )
            if outgoing_count > 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "task_outgoing_invalid",
                        "elementId": element["id"],
                        "reason": "Task can connect to at most one next step.",
                    }
                )
            for connection in outgoing_connections:
                target = element_by_id.get(connection["targetId"])
                if target is None:
                    continue
                target_type = target["type"]
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
            if incoming_count > 1:
                issues.append(
                    {
                        "field": f"elements.{element['id']}",
                        "code": "end_incoming_invalid",
                        "elementId": element["id"],
                        "reason": "End can receive work from at most one Task step.",
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

    if _has_sequence_cycle(element_by_id, outgoing):
        issues.append(
            {
                "field": "connections",
                "code": "cycle_forbidden",
                "reason": "Sequence loops are not available in this workflow version.",
            }
        )

    for binding in form_bindings:
        task_element = element_by_id.get(binding["taskElementId"])
        if task_element is None:
            issues.append(
                {
                    "field": f"formBindings.{binding['id']}.taskElementId",
                    "code": "missing_task",
                    "reason": "Place this field on an existing Task step.",
                }
            )
        elif task_element["type"] != "task":
            issues.append(
                {
                    "field": f"formBindings.{binding['id']}.taskElementId",
                    "code": "binding_task_invalid",
                    "reason": "Place reusable fields only on a Task step.",
                }
            )
        if binding["fieldId"] not in process_field_by_id:
            issues.append(
                {
                    "field": f"formBindings.{binding['id']}.fieldId",
                    "code": "missing_field",
                    "reason": "Choose an existing reusable field before adding it to the task.",
                }
            )

    if issues:
        raise WorkflowDraftValidationError(_deduplicate_issues(issues))

    return document


def validate_workflow_graph_document(payload: dict[str, Any]) -> dict[str, Any]:
    """Compatibility alias for callers migrating to the explicit integrity name."""
    return validate_workflow_draft_integrity(payload)


def _require_type(payload: dict[str, Any], field_name: str, expected_type: type) -> None:
    if not isinstance(payload.get(field_name), expected_type):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be {expected_type.__name__}."
        )


def _has_sequence_cycle(
    element_by_id: dict[str, dict[str, Any]],
    outgoing: dict[str, list[dict[str, str]]],
) -> bool:
    visited: set[str] = set()
    for start_id in element_by_id:
        if start_id in visited:
            continue
        visiting: set[str] = set()
        stack: list[tuple[str, bool]] = [(start_id, False)]
        while stack:
            element_id, exiting = stack.pop()
            if exiting:
                visiting.discard(element_id)
                visited.add(element_id)
                continue
            if element_id in visiting:
                return True
            if element_id in visited:
                continue
            visiting.add(element_id)
            stack.append((element_id, True))
            for connection in reversed(outgoing.get(element_id, [])):
                target_id = connection["targetId"]
                if target_id in visiting:
                    return True
                if target_id in element_by_id and target_id not in visited:
                    stack.append((target_id, False))
    return False


def _require_non_blank_string(payload: dict[str, Any], field_name: str) -> str:
    value = str(payload[field_name]).strip()
    if not value:
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' cannot be blank."
        )
    return value


def _normalize_optional_string(payload: dict[str, Any], field_name: str) -> str:
    value = payload.get(field_name, "")
    if value is None:
        return ""
    if not isinstance(value, str):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be str."
        )
    return value.strip()


def _normalize_optional_nullable_string(
    payload: dict[str, Any], field_name: str
) -> str | None:
    value = payload.get(field_name)
    if value is None:
        return None
    if not isinstance(value, str):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be str."
        )
    normalized = value.strip()
    return normalized if normalized else None


def _normalize_identifier_list(payload: dict[str, Any], field_name: str) -> list[str]:
    value = payload.get(field_name, [])
    if value is None:
        return []
    if not isinstance(value, list):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be a list."
        )

    normalized: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            raise WorkflowDraftSchemaError(
                f"Workflow draft field '{field_name}' must contain string identifiers."
            )
        candidate = item.strip()
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        normalized.append(candidate)
    return normalized


def _normalize_element(payload: Any) -> dict[str, Any]:
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

    normalized: dict[str, Any] = {
        "id": element_id,
        "type": payload["type"],
        "label": label,
    }
    if payload["type"] == "task":
        normalized["assignment"] = _normalize_assignment(
            payload.get("assignment", {})
        )
    elif "assignment" in payload:
        raise WorkflowDraftSchemaError(
            "Only Task elements can define workflow assignment."
        )
    return normalized


def _normalize_assignment(payload: Any) -> dict[str, str | None]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow Task assignment must be an object.")
    unknown_fields = sorted(set(payload) - {"mode", "membershipId"})
    if unknown_fields:
        raise UnknownDraftFieldError(
            "Unknown workflow Task assignment fields: " + ", ".join(unknown_fields)
        )
    mode = payload.get("mode", "unconfigured")
    if mode not in ASSIGNMENT_MODES:
        raise WorkflowDraftSchemaError(
            f"Unsupported workflow Task assignment mode: {mode}"
        )
    return {
        "mode": mode,
        "membershipId": _normalize_optional_nullable_string(payload, "membershipId"),
    }


def _normalize_connection(payload: Any) -> dict[str, str | None]:
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
        "label": _normalize_optional_nullable_string(payload, "label"),
    }


def _normalize_process_field(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow draft processFields must be objects.")

    field_path = f"processFields.{_issue_path_identifier(payload, fallback='new-field')}"
    unknown_fields = sorted(set(payload) - CURRENT_PROCESS_FIELD_FIELDS)
    if unknown_fields:
        issue_field = (
            f"{field_path}.{unknown_fields[0]}"
            if len(unknown_fields) == 1
            else field_path
        )
        _raise_validation_issue(
            field=issue_field,
            code="unknown_field",
            reason="Remove unsupported validation settings from this reusable field.",
        )

    field_id = _require_non_blank_string_issue(
        payload,
        "id",
        field=f"{field_path}.id",
        code="required",
        reason="Save this reusable field with a stable identifier.",
    )
    label = _require_non_blank_string_issue(
        payload,
        "label",
        field=f"{field_path}.label",
        code="required",
        reason="Complete this field to continue.",
    )
    kind = _require_string_issue(
        payload,
        "kind",
        field=f"{field_path}.kind",
        code="required",
        reason="Choose a supported reusable field type.",
    )
    if kind not in SUPPORTED_PROCESS_FIELD_KINDS:
        _raise_validation_issue(
            field=f"{field_path}.kind",
            code="unsupported_kind",
            reason="Choose the supported Short text field type for this story.",
        )

    minimum_length = _normalize_length(
        payload,
        "minimumLength",
        0,
        field=f"{field_path}.minimumLength",
    )
    maximum_length = _normalize_length(
        payload,
        "maximumLength",
        SHORT_TEXT_MAXIMUM_LENGTH,
        field=f"{field_path}.maximumLength",
    )
    if maximum_length > SHORT_TEXT_MAXIMUM_LENGTH:
        _raise_validation_issue(
            field=f"{field_path}.maximumLength",
            code="too_large",
            reason="Use 255 or fewer for maximum length.",
        )
    if minimum_length > maximum_length:
        _raise_validation_issue(
            field=f"{field_path}.minimumLength",
            code="greater_than_maximum",
            reason="Use a minimum length that is not greater than maximum length.",
        )

    return {
        "id": field_id,
        "kind": kind,
        "label": label,
        "helpText": _normalize_optional_string(payload, "helpText"),
        "placeholder": _normalize_optional_string(payload, "placeholder"),
        "defaultValue": _normalize_optional_nullable_string(payload, "defaultValue"),
        "minimumLength": minimum_length,
        "maximumLength": maximum_length,
    }


def _normalize_form_binding(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise WorkflowDraftSchemaError("Workflow draft formBindings must be objects.")

    binding_path = f"formBindings.{_issue_path_identifier(payload, fallback='new-binding')}"
    unknown_fields = sorted(set(payload) - CURRENT_FORM_BINDING_FIELDS)
    if unknown_fields:
        issue_field = (
            f"{binding_path}.{unknown_fields[0]}"
            if len(unknown_fields) == 1
            else binding_path
        )
        _raise_validation_issue(
            field=issue_field,
            code="unknown_field",
            reason="Remove unsupported placement data from this task field.",
        )

    position = _normalize_length(
        payload,
        "position",
        0,
        field=f"{binding_path}.position",
    )
    width = payload.get("width", "full")
    if not isinstance(width, str):
        _raise_validation_issue(
            field=f"{binding_path}.width",
            code="invalid",
            reason="Keep this task field at the default full width.",
        )
    width = width.strip() or "full"
    if width != "full":
        _raise_validation_issue(
            field=f"{binding_path}.width",
            code="unsupported_width",
            reason="Keep this task field at the default full width.",
        )

    return {
        "id": _require_non_blank_string_issue(
            payload,
            "id",
            field=f"{binding_path}.id",
            code="required",
            reason="Save this task field placement with a stable identifier.",
        ),
        "taskElementId": _require_non_blank_string_issue(
            payload,
            "taskElementId",
            field=f"{binding_path}.taskElementId",
            code="required",
            reason="Place this field on the first Task step.",
        ),
        "fieldId": _require_non_blank_string_issue(
            payload,
            "fieldId",
            field=f"{binding_path}.fieldId",
            code="required",
            reason="Choose an existing reusable field before adding it to the task.",
        ),
        "position": position,
        "width": width,
        "label": _normalize_optional_nullable_string(payload, "label"),
    }


def _normalize_length(
    payload: dict[str, Any],
    field_name: str,
    default: int,
    *,
    field: str,
) -> int:
    value = payload.get(field_name, default)
    if not isinstance(value, int):
        _raise_validation_issue(
            field=field,
            code="invalid",
            reason="Use a whole number for this field.",
        )
    if value < 0:
        _raise_validation_issue(
            field=field,
            code="too_small",
            reason="Use 0 or greater for this field.",
        )
    return value


def _first_task_id(
    *,
    elements: list[dict[str, str]],
    outgoing: dict[str, list[dict[str, str]]],
    element_by_id: dict[str, dict[str, str]],
) -> str | None:
    starts = [element for element in elements if element["type"] == "start"]
    if len(starts) != 1:
        return None

    start_outgoing = outgoing.get(starts[0]["id"], [])
    if len(start_outgoing) != 1:
        return None

    first_task_id = start_outgoing[0]["targetId"]
    first_task = element_by_id.get(first_task_id)
    if first_task is None or first_task["type"] != "task":
        return None
    return first_task_id


def _first_task_id_from_document(payload: dict[str, Any]) -> str | None:
    elements = {
        element.get("id"): element
        for element in payload.get("elements", [])
        if isinstance(element, dict) and isinstance(element.get("id"), str)
    }
    start_ids = [
        element_id
        for element_id, element in elements.items()
        if element.get("type") == "start"
    ]
    if len(start_ids) != 1:
        return None
    target_ids = [
        connection.get("targetId")
        for connection in payload.get("connections", [])
        if isinstance(connection, dict)
        and connection.get("sourceId") == start_ids[0]
    ]
    if len(target_ids) != 1:
        return None
    target = elements.get(target_ids[0])
    return target_ids[0] if target and target.get("type") == "task" else None


def _issue_path_identifier(payload: dict[str, Any], *, fallback: str) -> str:
    identifier = payload.get("id")
    if isinstance(identifier, str) and identifier.strip():
        return identifier.strip()
    return fallback


def _raise_validation_issue(*, field: str, code: str, reason: str) -> None:
    raise WorkflowDraftValidationError(
        [
            {
                "field": field,
                "code": code,
                "reason": reason,
            }
        ]
    )


def _require_string_issue(
    payload: dict[str, Any],
    field_name: str,
    *,
    field: str,
    code: str,
    reason: str,
) -> str:
    value = payload.get(field_name)
    if not isinstance(value, str):
        _raise_validation_issue(field=field, code=code, reason=reason)
    return value


def _require_non_blank_string_issue(
    payload: dict[str, Any],
    field_name: str,
    *,
    field: str,
    code: str,
    reason: str,
) -> str:
    value = _require_string_issue(
        payload,
        field_name,
        field=field,
        code=code,
        reason=reason,
    ).strip()
    if not value:
        _raise_validation_issue(field=field, code=code, reason=reason)
    return value


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
