from __future__ import annotations

import json
from pathlib import Path

import pytest

from moviqo.modules.workflow_design.application.schema import (
    UnknownDraftFieldError,
    dump_current_draft,
    load_draft_document,
    validate_workflow_graph_document,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "workflow_design"


def test_schema_registry_reads_supported_historical_fixture() -> None:
    payload = json.loads((FIXTURES / "draft-v0.json").read_text(encoding="utf-8"))

    loaded = load_draft_document(payload)

    assert loaded == {
        "schemaVersion": 3,
        "draftId": "01987df4-ae8a-7000-8000-000000000111",
        "workflowId": "01987df4-ae8a-7000-8000-000000000110",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
        "connections": [],
        "processFields": [],
        "formBindings": [],
        "publication": {
            "starter": {"isConfigured": False},
            "assignment": {"isConfigured": False},
        },
    }


def test_schema_registry_rejects_unknown_current_fields() -> None:
    with pytest.raises(UnknownDraftFieldError):
        dump_current_draft(
            {
                "schemaVersion": 2,
                "processFields": [],
                "formBindings": [],
                "draftId": "01987df4-ae8a-7000-8000-000000000111",
                "workflowId": "01987df4-ae8a-7000-8000-000000000110",
                "name": "Workflow intake",
                "status": "draft",
                "elements": [],
                "connections": [],
                "unexpected": "value",
            }
        )


def test_schema_registry_accepts_minimum_start_task_end_graph() -> None:
    loaded = validate_workflow_graph_document(
        {
            "schemaVersion": 3,
            "processFields": [],
            "formBindings": [],
            "draftId": "01987df4-ae8a-7000-8000-000000000111",
            "workflowId": "01987df4-ae8a-7000-8000-000000000110",
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
        }
    )

    assert loaded["schemaVersion"] == 3
    assert len(loaded["elements"]) == 3
    assert len(loaded["connections"]) == 2


def test_schema_registry_upcasts_story_1_22_graph_fixture() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 2,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [{"id": "task-1", "type": "task", "label": "Task"}],
            "connections": [],
        }
    )

    assert loaded["schemaVersion"] == 3
    assert loaded["processFields"] == []
    assert loaded["formBindings"] == []


def test_schema_registry_normalizes_short_text_field_defaults() -> None:
    loaded = dump_current_draft(
        {
            "schemaVersion": 3,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [],
            "connections": [],
            "processFields": [
                {
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                }
            ],
            "formBindings": [],
        }
    )

    assert loaded["processFields"] == [
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
    ]


def test_schema_registry_round_trips_field_binding_document() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 3,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
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
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "Requester name",
                    "minimumLength": 1,
                    "maximumLength": 32,
                }
            ],
            "formBindings": [
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                }
            ],
        }
    )

    assert loaded["processFields"][0]["id"] == "field-1"
    assert loaded["formBindings"] == [
        {
            "id": "binding-1",
            "taskElementId": "task-1",
            "fieldId": "field-1",
            "position": 0,
            "width": "full",
            "label": None,
        }
    ]


def test_schema_registry_normalizes_task_form_control_defaults() -> None:
    loaded = dump_current_draft(
        {
            "schemaVersion": 3,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [],
            "connections": [],
            "processFields": [],
            "formBindings": [
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                }
            ],
        }
    )

    assert loaded["formBindings"] == [
        {
            "id": "binding-1",
            "taskElementId": "task-1",
            "fieldId": "field-1",
            "position": 0,
            "width": "full",
            "label": None,
        }
    ]


@pytest.mark.parametrize(
    ("field_payload", "issue_field", "reason"),
    [
        (
            {
                "id": "field-1",
                "kind": "shortText",
                "label": "Requester name",
                "maximumLength": 300,
            },
            "processFields.field-1.maximumLength",
            "Use 255 or fewer for maximum length.",
        ),
        (
            {
                "id": "field-1",
                "kind": "shortText",
                "label": "Requester name",
                "minimumLength": 12,
                "maximumLength": 8,
            },
            "processFields.field-1.minimumLength",
            "Use a minimum length that is not greater than maximum length.",
        ),
        (
            {
                "id": "field-1",
                "kind": "shortText",
                "label": "Requester name",
                "pattern": ".*",
            },
            "processFields.field-1.pattern",
            "Remove unsupported validation settings from this reusable field.",
        ),
    ],
)
def test_schema_registry_rejects_invalid_short_text_fields(
    field_payload: dict[str, object],
    issue_field: str,
    reason: str,
) -> None:
    with pytest.raises(ValueError) as exc_info:
        dump_current_draft(
            {
                "schemaVersion": 3,
                "draftId": "draft-1",
                "workflowId": "workflow-1",
                "name": "Workflow intake",
                "status": "draft",
                "elements": [],
                "connections": [],
                "processFields": [field_payload],
                "formBindings": [],
            }
        )

    assert exc_info.value.issues == [
        {
            "field": issue_field,
            "code": exc_info.value.issues[0]["code"],
            "reason": reason,
        }
    ]


def test_schema_registry_rejects_binding_to_non_first_task() -> None:
    with pytest.raises(ValueError) as exc_info:
        validate_workflow_graph_document(
            {
                "schemaVersion": 3,
                "draftId": "draft-1",
                "workflowId": "workflow-1",
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
                        "id": "field-1",
                        "kind": "shortText",
                        "label": "Requester name",
                    }
                ],
                "formBindings": [
                    {
                        "id": "binding-1",
                        "taskElementId": "task-2",
                        "fieldId": "field-1",
                    }
                ],
            }
        )

    assert exc_info.value.issues == [
        {
            "field": "formBindings.binding-1.taskElementId",
            "code": "binding_not_first_task",
            "reason": "Add this field only to the first Task step in this story.",
        }
    ]

