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
        "schemaVersion": 2,
        "draftId": "01987df4-ae8a-7000-8000-000000000111",
        "workflowId": "01987df4-ae8a-7000-8000-000000000110",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
        "connections": [],
    }


def test_schema_registry_rejects_unknown_current_fields() -> None:
    with pytest.raises(UnknownDraftFieldError):
        dump_current_draft(
            {
                "schemaVersion": 2,
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
            "schemaVersion": 2,
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

    assert loaded["schemaVersion"] == 2
    assert len(loaded["elements"]) == 3
    assert len(loaded["connections"]) == 2

