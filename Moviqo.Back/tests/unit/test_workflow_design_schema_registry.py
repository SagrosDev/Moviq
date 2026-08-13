from __future__ import annotations

import json
from pathlib import Path

import pytest

from moviqo.modules.workflow_design.application.schema import (
    UnknownDraftFieldError,
    dump_current_draft,
    load_draft_document,
    new_workflow_draft_document,
    validate_workflow_draft_integrity,
    validate_workflow_graph_document,
)
from moviqo.modules.workflow_design.application.services import (
    _build_publication_invalid_params,
    _merge_elements,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "workflow_design"


def test_v7_element_merge_preserves_existing_assignment_when_omitted() -> None:
    previous_document = {
        "elements": [
            {
                "id": "task-1",
                "type": "task",
                "label": "Review",
                "assignment": {
                    "mode": "specificMember",
                    "membershipId": "membership-1",
                },
            }
        ],
        "connections": [],
    }

    merged = _merge_elements(
        previous_document=previous_document,
        draft={
            "schemaVersion": 7,
            "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
            "publication": {
                "assignment": {
                    "mode": "workflowInitiator",
                    "membershipId": None,
                }
            },
        },
    )

    assert merged[0]["assignment"] == previous_document["elements"][0]["assignment"]


def test_publication_invalid_param_name_preserves_all_issue_identifiers() -> None:
    invalid_params = _build_publication_invalid_params(
        [
            {
                "target": "processFields.field-1",
                "code": "task_form_decorative",
                "message": "Correct this field.",
                "elementId": "task-2",
                "fieldId": "field-1",
                "bindingId": "binding-2",
            }
        ]
    )

    assert invalid_params == [
        {
            "name": "elements.task-2.processFields.field-1.formBindings.binding-2",
            "code": "task_form_decorative",
            "reason": "Correct this field.",
        }
    ]


def test_new_workflow_draft_seeds_one_start_step() -> None:
    draft = new_workflow_draft_document(
        draft_id="draft-1",
        workflow_id="workflow-1",
        name="Workflow intake",
    )

    assert draft["schemaVersion"] == 8
    assert draft["elements"] == [
        {"id": "start-1", "type": "start", "label": "Start"}
    ]
    assert draft["layout"] == {
        "positions": {"start-1": {"x": 80, "y": 120}}
    }


def test_schema_registry_upcasts_v4_connections_with_optional_labels() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 4,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Review request"},
            ],
            "connections": [
                {
                    "id": "connection-1",
                    "type": "sequence",
                    "sourceId": "start-1",
                    "targetId": "task-1",
                }
            ],
            "processFields": [],
            "formBindings": [],
            "publication": {},
        }
    )

    assert loaded["schemaVersion"] == 8
    assert loaded["connections"][0]["label"] is None
    assert loaded["layout"] == {"positions": {}}


def test_schema_registry_upcasts_v5_with_an_empty_layout() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 5,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
            "connections": [],
            "processFields": [],
            "formBindings": [],
            "publication": {},
        }
    )

    assert loaded["schemaVersion"] == 8
    assert loaded["layout"] == {"positions": {}}


@pytest.mark.parametrize(
    "positions",
    [
        {"missing": {"x": 10, "y": 20}},
        {"task-1": {"x": float("inf"), "y": 20}},
        {"task-1": {"x": True, "y": 20}},
        {"task-1": {"x": 100_001, "y": 20}},
        {"task-1": {"x": 10}},
    ],
)
def test_schema_registry_rejects_invalid_layout_positions(
    positions: dict[str, object],
) -> None:
    with pytest.raises(ValueError):
        dump_current_draft(
            {
                "schemaVersion": 6,
                "draftId": "draft-1",
                "workflowId": "workflow-1",
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "task-1", "type": "task", "label": "Review"}
                ],
                "connections": [],
                "processFields": [],
                "formBindings": [],
                "publication": {},
                "layout": {"positions": positions},
            }
        )


def test_draft_integrity_handles_a_long_linear_graph_without_recursion() -> None:
    task_count = 1_200
    elements = [
        {"id": f"task-{index}", "type": "task", "label": f"Task {index}"}
        for index in range(task_count)
    ]
    connections = [
        {
            "id": f"connection-{index}",
            "type": "sequence",
            "sourceId": f"task-{index}",
            "targetId": f"task-{index + 1}",
        }
        for index in range(task_count - 1)
    ]

    validated = validate_workflow_draft_integrity(
        {
            "schemaVersion": 4,
            "draftId": "01987df4-ae8a-7000-8000-000000000111",
            "workflowId": "01987df4-ae8a-7000-8000-000000000110",
            "name": "Long workflow",
            "status": "draft",
            "elements": elements,
            "connections": connections,
            "processFields": [],
            "formBindings": [],
            "publication": {},
        }
    )

    assert len(validated["elements"]) == task_count


def test_schema_registry_reads_supported_historical_fixture() -> None:
    payload = json.loads((FIXTURES / "draft-v0.json").read_text(encoding="utf-8"))

    loaded = load_draft_document(payload)

    assert loaded == {
        "schemaVersion": 8,
        "draftId": "01987df4-ae8a-7000-8000-000000000111",
        "workflowId": "01987df4-ae8a-7000-8000-000000000110",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
        "connections": [],
        "processFields": [],
        "formBindings": [],
        "publication": {
            "starter": {
                "mode": "unconfigured",
                "teamIds": [],
                "membershipIds": [],
            },
        },
        "layout": {"positions": {}},
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


@pytest.mark.parametrize(
    "elements",
    [
        [],
        [{"id": "start-1", "type": "start", "label": "Start"}],
        [{"id": "task-1", "type": "task", "label": "Task"}],
    ],
)
def test_draft_integrity_accepts_incomplete_authoring_states(elements) -> None:
    loaded = validate_workflow_draft_integrity(
        {
            "schemaVersion": 4,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": elements,
            "connections": [],
            "processFields": [],
            "formBindings": [],
        }
    )

    assert [
        {key: value for key, value in element.items() if key != "assignment"}
        for element in loaded["elements"]
    ] == elements


def test_draft_integrity_rejects_impossible_cardinality_and_dangling_references() -> None:
    with pytest.raises(ValueError) as exc_info:
        validate_workflow_draft_integrity(
            {
                "schemaVersion": 4,
                "draftId": "draft-1",
                "workflowId": "workflow-1",
                "name": "Workflow intake",
                "status": "draft",
                "elements": [
                    {"id": "start-1", "type": "start", "label": "Start"},
                    {"id": "start-2", "type": "start", "label": "Start again"},
                ],
                "connections": [
                    {
                        "id": "connection-1",
                        "type": "sequence",
                        "sourceId": "start-1",
                        "targetId": "missing-task",
                    }
                ],
                "processFields": [],
                "formBindings": [],
            }
        )

    assert {issue["code"] for issue in exc_info.value.issues} == {
        "missing_target",
        "start_count_invalid",
    }


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

    assert loaded["schemaVersion"] == 8
    assert loaded["processFields"] == []
    assert loaded["formBindings"] == []
    assert loaded["publication"] == {
        "starter": {
            "mode": "unconfigured",
            "teamIds": [],
            "membershipIds": [],
        },
    }


def test_schema_registry_upcasts_v6_assignment_to_first_connected_task() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 6,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-2", "type": "task", "label": "Second"},
                {"id": "task-1", "type": "task", "label": "First"},
            ],
            "connections": [
                {
                    "id": "connection-1",
                    "type": "sequence",
                    "sourceId": "start-1",
                    "targetId": "task-1",
                }
            ],
            "processFields": [],
            "formBindings": [],
            "publication": {
                "starter": {
                    "mode": "allActiveMembers",
                    "teamIds": [],
                    "membershipIds": [],
                },
                "assignment": {
                    "mode": "workflowInitiator",
                    "membershipId": None,
                },
            },
            "layout": {"positions": {}},
        }
    )

    assignments = {
        element["id"]: element["assignment"]
        for element in loaded["elements"]
        if element["type"] == "task"
    }
    assert loaded["schemaVersion"] == 8
    assert loaded["publication"] == {
        "starter": {
            "mode": "allActiveMembers",
            "teamIds": [],
            "membershipIds": [],
        }
    }
    assert assignments == {
        "task-1": {"mode": "workflowInitiator", "membershipId": None},
        "task-2": {"mode": "unconfigured", "membershipId": None},
    }


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
            "kind": "field",
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
            "kind": "field",
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


def test_schema_registry_accepts_binding_to_any_existing_task() -> None:
    loaded = validate_workflow_graph_document(
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

    assert loaded["formBindings"][0]["taskElementId"] == "task-2"


def test_v7_form_bindings_upcast_to_discriminated_field_items() -> None:
    loaded = load_draft_document(
        {
            "schemaVersion": 7,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
            "connections": [],
            "processFields": [
                {"id": "field-1", "kind": "shortText", "label": "Requester"}
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
            "publication": {},
            "layout": {"positions": {}},
        }
    )

    assert loaded["schemaVersion"] == 8
    assert loaded["formBindings"] == [
        {
            "id": "binding-1",
            "kind": "field",
            "taskElementId": "task-1",
            "fieldId": "field-1",
            "position": 0,
            "width": "full",
            "label": None,
        }
    ]


def test_schema_registry_round_trips_field_and_structural_form_items() -> None:
    loaded = validate_workflow_draft_integrity(
        {
            "schemaVersion": 8,
            "draftId": "draft-1",
            "workflowId": "workflow-1",
            "name": "Workflow intake",
            "status": "draft",
            "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
            "connections": [],
            "processFields": [
                {"id": "field-1", "kind": "shortText", "label": "Requester"}
            ],
            "formBindings": [
                {
                    "id": "heading-1",
                    "kind": "heading",
                    "taskElementId": "task-1",
                    "position": 0,
                    "width": "full",
                    "content": "Request details",
                },
                {
                    "id": "binding-1",
                    "kind": "field",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 1,
                    "width": "half",
                    "label": "Requested by",
                },
                {
                    "id": "divider-1",
                    "kind": "divider",
                    "taskElementId": "task-1",
                    "position": 2,
                    "width": "quarter",
                },
            ],
            "publication": {},
            "layout": {"positions": {}},
        }
    )

    assert loaded["formBindings"] == [
        {
            "id": "heading-1",
            "kind": "heading",
            "taskElementId": "task-1",
            "position": 0,
            "width": "full",
            "content": "Request details",
        },
        {
            "id": "binding-1",
            "kind": "field",
            "taskElementId": "task-1",
            "fieldId": "field-1",
            "position": 1,
            "width": "half",
            "label": "Requested by",
        },
        {
            "id": "divider-1",
            "kind": "divider",
            "taskElementId": "task-1",
            "position": 2,
            "width": "quarter",
        },
    ]


@pytest.mark.parametrize("kind", ["section", "heading", "instruction"])
def test_structural_form_items_preserve_blank_content_without_process_field_binding(
    kind: str,
) -> None:
    payload = {
        "schemaVersion": 8,
        "draftId": "draft-1",
        "workflowId": "workflow-1",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
        "connections": [],
        "processFields": [],
        "formBindings": [
            {
                "id": f"{kind}-1",
                "kind": kind,
                "taskElementId": "task-1",
                "position": 0,
                "width": "full",
                "content": " ",
            }
        ],
        "publication": {},
        "layout": {"positions": {}},
    }

    loaded = dump_current_draft(payload)

    assert loaded["formBindings"][0]["content"] == ""


@pytest.mark.parametrize("width", ["full", "half", "third", "quarter"])
def test_schema_registry_accepts_only_approved_form_item_spans(width: str) -> None:
    payload = {
        "schemaVersion": 8,
        "draftId": "draft-1",
        "workflowId": "workflow-1",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
        "connections": [],
        "processFields": [],
        "formBindings": [
            {
                "id": "divider-1",
                "kind": "divider",
                "taskElementId": "task-1",
                "position": 0,
                "width": width,
            }
        ],
        "publication": {},
        "layout": {"positions": {}},
    }

    assert dump_current_draft(payload)["formBindings"][0]["width"] == width


def test_schema_registry_rejects_unknown_form_item_kinds() -> None:
    payload = {
        "schemaVersion": 8,
        "draftId": "draft-1",
        "workflowId": "workflow-1",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [{"id": "task-1", "type": "task", "label": "Review"}],
        "connections": [],
        "processFields": [],
        "formBindings": [
            {
                "id": "mystery-1",
                "kind": "mystery",
                "taskElementId": "task-1",
                "position": 0,
                "width": "full",
            }
        ],
        "publication": {},
        "layout": {"positions": {}},
    }

    with pytest.raises(ValueError) as exc_info:
        dump_current_draft(payload)

    assert exc_info.value.issues == [
        {
            "field": "formBindings.mystery-1.kind",
            "code": "unsupported_kind",
            "reason": "Choose a supported Form item type.",
        }
    ]

