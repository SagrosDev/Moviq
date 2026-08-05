from __future__ import annotations

import json
from pathlib import Path

import pytest

from moviqo.modules.workflow_design.application.schema import (
    UnknownDraftFieldError,
    dump_current_draft,
    load_draft_document,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "workflow_design"


def test_schema_registry_reads_supported_historical_fixture() -> None:
    payload = json.loads((FIXTURES / "draft-v0.json").read_text(encoding="utf-8"))

    loaded = load_draft_document(payload)

    assert loaded == {
        "schemaVersion": 1,
        "draftId": "01987df4-ae8a-7000-8000-000000000111",
        "workflowId": "01987df4-ae8a-7000-8000-000000000110",
        "name": "Workflow intake",
        "status": "draft",
        "elements": [],
    }


def test_schema_registry_rejects_unknown_current_fields() -> None:
    with pytest.raises(UnknownDraftFieldError):
        dump_current_draft(
            {
                "schemaVersion": 1,
                "draftId": "01987df4-ae8a-7000-8000-000000000111",
                "workflowId": "01987df4-ae8a-7000-8000-000000000110",
                "name": "Workflow intake",
                "status": "draft",
                "elements": [],
                "unexpected": "value",
            }
        )

