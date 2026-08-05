from __future__ import annotations

from typing import Any

CURRENT_DRAFT_SCHEMA_VERSION = 1
CURRENT_DRAFT_FIELDS = frozenset(
    {
        "schemaVersion",
        "draftId",
        "workflowId",
        "name",
        "status",
        "elements",
    }
)


class WorkflowDraftSchemaError(ValueError):
    pass


class UnknownDraftFieldError(WorkflowDraftSchemaError):
    pass


class UnsupportedDraftSchemaVersionError(WorkflowDraftSchemaError):
    pass


def load_draft_document(payload: dict[str, Any]) -> dict[str, Any]:
    schema_version = payload.get("schemaVersion", 0)
    if schema_version == 0:
        payload = _upcast_v0_to_v1(payload)
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
    if not isinstance(payload.get("elements"), list):
        raise WorkflowDraftSchemaError("Workflow draft elements must be a list.")

    return {
        "schemaVersion": payload["schemaVersion"],
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": payload["status"],
        "elements": payload["elements"],
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
        }
    )


def _upcast_v0_to_v1(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
        "draftId": payload["draftId"],
        "workflowId": payload["workflowId"],
        "name": payload["name"],
        "status": "draft",
        "elements": list(payload.get("elements", [])),
    }


def _require_type(payload: dict[str, Any], field_name: str, expected_type: type) -> None:
    if not isinstance(payload.get(field_name), expected_type):
        raise WorkflowDraftSchemaError(
            f"Workflow draft field '{field_name}' must be {expected_type.__name__}."
        )
