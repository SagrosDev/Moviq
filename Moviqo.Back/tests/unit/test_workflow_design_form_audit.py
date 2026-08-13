from __future__ import annotations

from moviqo.modules.workflow_design.application.services import (
    _collect_graph_audit_events,
    _form_draft_scope_issues,
)


def _document(*, form_bindings):
    return {
        "elements": [],
        "connections": [],
        "processFields": [],
        "formBindings": form_bindings,
        "layout": {"positions": {}},
    }


def test_structural_form_item_addition_and_removal_emit_stable_audit_events() -> None:
    heading = {
        "id": "heading-1",
        "kind": "heading",
        "taskElementId": "task-1",
        "position": 0,
        "width": "full",
        "content": "Heading",
    }

    added = _collect_graph_audit_events(
        previous_document=_document(form_bindings=[]),
        current_document=_document(form_bindings=[heading]),
        workflow_id="workflow-1",
        draft_id="draft-1",
        previous_revision="1",
        next_revision="2",
    )
    removed = _collect_graph_audit_events(
        previous_document=_document(form_bindings=[heading]),
        current_document=_document(form_bindings=[]),
        workflow_id="workflow-1",
        draft_id="draft-1",
        previous_revision="2",
        next_revision="3",
    )

    assert added == [
        (
            "workflow-design.form-item-added",
            {
                "workflowId": "workflow-1",
                "draftId": "draft-1",
                "revision": "2",
                "previousRevision": "1",
                "itemId": "heading-1",
                "itemKind": "heading",
                "taskElementId": "task-1",
            },
        )
    ]
    assert removed == [
        (
            "workflow-design.form-item-removed",
            {
                "workflowId": "workflow-1",
                "draftId": "draft-1",
                "revision": "3",
                "previousRevision": "2",
                "itemId": "heading-1",
                "itemKind": "heading",
                "taskElementId": "task-1",
            },
        )
    ]


def test_form_draft_scope_rejects_workflow_and_other_task_mutation() -> None:
    previous = {
        "elements": [{"id": "task-1", "type": "task", "label": "One"}],
        "connections": [],
        "processFields": [
            {"id": "field-1", "label": "One"},
            {"id": "field-2", "label": "Two"},
        ],
        "formBindings": [
            {
                "id": "binding-1",
                "kind": "field",
                "taskElementId": "task-1",
                "fieldId": "field-1",
            },
            {
                "id": "binding-2",
                "kind": "field",
                "taskElementId": "task-2",
                "fieldId": "field-2",
            },
        ],
        "publication": {"starter": {}},
        "layout": {"positions": {}},
    }

    graph_changed = {**previous, "elements": [{**previous["elements"][0], "label": "Changed"}]}
    assert _form_draft_scope_issues(
        previous_document=previous,
        candidate_document=graph_changed,
        task_element_id="task-1",
    )[0]["field"] == "elements"

    other_task_changed = {
        **previous,
        "formBindings": [previous["formBindings"][0]],
    }
    assert _form_draft_scope_issues(
        previous_document=previous,
        candidate_document=other_task_changed,
        task_element_id="task-1",
    )[0]["field"] == "formBindings"

    other_field_changed = {
        **previous,
        "processFields": [
            previous["processFields"][0],
            {**previous["processFields"][1], "label": "Changed"},
        ],
    }
    assert _form_draft_scope_issues(
        previous_document=previous,
        candidate_document=other_field_changed,
        task_element_id="task-1",
    )[0]["field"] == "processFields"

    shared_field_previous = {
        **previous,
        "formBindings": [
            previous["formBindings"][0],
            {**previous["formBindings"][1], "fieldId": "field-1"},
        ],
    }
    shared_field_changed = {
        **shared_field_previous,
        "processFields": [
            {**previous["processFields"][0], "label": "Changed"},
            previous["processFields"][1],
        ],
    }
    assert _form_draft_scope_issues(
        previous_document=shared_field_previous,
        candidate_document=shared_field_changed,
        task_element_id="task-1",
    )[0]["field"] == "processFields"


def test_form_draft_scope_allows_leased_task_form_changes() -> None:
    previous = {
        "elements": [],
        "connections": [],
        "processFields": [{"id": "field-1", "label": "Before"}],
        "formBindings": [
            {
                "id": "binding-1",
                "kind": "field",
                "taskElementId": "task-1",
                "fieldId": "field-1",
            }
        ],
        "publication": {"starter": {}},
        "layout": {"positions": {}},
    }
    candidate = {
        **previous,
        "processFields": [{"id": "field-1", "label": "After"}],
        "formBindings": [
            previous["formBindings"][0],
            {
                "id": "heading-1",
                "kind": "heading",
                "taskElementId": "task-1",
            },
        ],
    }
    assert _form_draft_scope_issues(
        previous_document=previous,
        candidate_document=candidate,
        task_element_id="task-1",
    ) == []
