from __future__ import annotations

from moviqo.modules.workflow_design.application.publication_validation import (
    STARTER_TARGET,
    validate_workflow_for_publication,
)


def _draft(
    *,
    elements,
    connections,
    process_fields=None,
    form_bindings=None,
    publication=None,
):
    return {
        "schemaVersion": 3,
        "draftId": "draft-1",
        "workflowId": "workflow-1",
        "name": "Workflow intake",
        "status": "draft",
        "elements": elements,
        "connections": connections,
        "processFields": process_fields or [],
        "formBindings": form_bindings or [],
        "publication": publication or {},
    }


def test_publication_validation_returns_stable_blockers_in_deterministic_order() -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
        )
    )

    assert result["publishable"] is False
    assert [(issue["code"], issue["target"]) for issue in result["issues"]] == [
        ("starter_missing", STARTER_TARGET),
        ("assignment_missing", "elements.task-1.assignment"),
        ("task_form_missing", "elements.task-1"),
    ]


def test_publication_validation_rejects_decorative_only_first_task_form() -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
            process_fields=[
                {
                    "id": "field-1",
                    "kind": "shortText",
                    "label": "",
                    "helpText": "Read only guidance",
                    "placeholder": "",
                    "defaultValue": None,
                    "minimumLength": 0,
                    "maximumLength": 255,
                }
            ],
            form_bindings=[
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                    "label": "",
                }
            ],
        )
    )

    assert any(issue["code"] == "task_form_decorative" for issue in result["issues"])


def test_publication_validation_treats_structural_only_form_as_incomplete() -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
            form_bindings=[
                {
                    "id": "heading-1",
                    "kind": "heading",
                    "taskElementId": "task-1",
                    "position": 0,
                    "width": "full",
                    "content": "Read this first",
                }
            ],
        )
    )

    assert any(issue["code"] == "task_form_missing" for issue in result["issues"])


def test_publication_validation_rejects_blank_structural_item_content() -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
            form_bindings=[
                {
                    "id": "heading-1",
                    "kind": "heading",
                    "taskElementId": "task-1",
                    "position": 0,
                    "width": "full",
                    "content": "",
                }
            ],
        )
    )

    issue = next(
        issue for issue in result["issues"] if issue["code"] == "form_item_content_missing"
    )
    assert issue["target"] == "formBindings.heading-1.content"
    assert issue["elementId"] == "task-1"
    assert issue["bindingId"] == "heading-1"


def test_publication_validation_passes_minimum_story_1_24_shape_with_checklist_warnings_only(
) -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {"id": "task-1", "type": "task", "label": "Task"},
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
            process_fields=[
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
            ],
            form_bindings=[
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                    "label": None,
                }
            ],
        )
    )

    assert result["publishable"] is False
    assert [issue["code"] for issue in result["issues"]] == [
        "starter_missing",
        "assignment_missing",
    ]


def test_publication_validation_accepts_a_fully_configured_minimum_workflow() -> None:
    result = validate_workflow_for_publication(
        _draft(
            elements=[
                {"id": "start-1", "type": "start", "label": "Start"},
                {
                    "id": "task-1",
                    "type": "task",
                    "label": "Task",
                    "assignment": {
                        "mode": "workflowInitiator",
                        "membershipId": None,
                    },
                },
                {"id": "end-1", "type": "end", "label": "End"},
            ],
            connections=[
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
            process_fields=[
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
            ],
            form_bindings=[
                {
                    "id": "binding-1",
                    "taskElementId": "task-1",
                    "fieldId": "field-1",
                    "position": 0,
                    "width": "full",
                    "label": None,
                }
            ],
            publication={"starter": {"isConfigured": True}},
        )
    )

    assert result["publishable"] is True
    assert result["issues"] == []
