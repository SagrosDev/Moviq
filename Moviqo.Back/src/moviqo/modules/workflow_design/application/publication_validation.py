from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

STARTER_TARGET = "configuration.starter"
ASSIGNMENT_TARGET = "configuration.assignment"


def validate_workflow_for_publication(document: dict[str, Any]) -> dict[str, Any]:
    issues: list[dict[str, Any]] = []
    element_by_id = {element["id"]: element for element in document["elements"]}
    outgoing: dict[str, list[dict[str, str]]] = defaultdict(list)
    incoming: dict[str, list[dict[str, str]]] = defaultdict(list)

    for connection in document["connections"]:
        source_id = connection["sourceId"]
        target_id = connection["targetId"]
        if source_id in element_by_id and target_id in element_by_id:
            outgoing[source_id].append(connection)
            incoming[target_id].append(connection)

    starts = [element for element in document["elements"] if element["type"] == "start"]
    tasks = [element for element in document["elements"] if element["type"] == "task"]
    ends = [element for element in document["elements"] if element["type"] == "end"]

    publication = document.get("publication", {})
    if not publication.get("starter", {}).get("isConfigured", False):
        issues.append(
            _issue(
                code="starter_missing",
                target=STARTER_TARGET,
                message=(
                    "We need one more detail before publishing: "
                    "choose who can start this workflow."
                ),
                action_label="Configure starter",
            )
        )
    if not publication.get("assignment", {}).get("isConfigured", False):
        issues.append(
            _issue(
                code="assignment_missing",
                target=ASSIGNMENT_TARGET,
                message=(
                    "We need one more detail before publishing: "
                    "choose who receives the first task."
                ),
                action_label="Configure assignment",
            )
        )

    if len(starts) != 1:
        issues.append(
            _issue(
                code="start_step_invalid",
                target="elements",
                message="Add exactly one Start step before publishing this workflow.",
                action_label="Review workflow path",
            )
        )
    if len(tasks) < 1:
        issues.append(
            _issue(
                code="first_task_missing",
                target="elements",
                message="Add the first Task step before publishing this workflow.",
                action_label="Review workflow path",
            )
        )
    if len(ends) != 1:
        issues.append(
            _issue(
                code="end_step_invalid",
                target="elements",
                message="Add exactly one End step before publishing this workflow.",
                action_label="Review workflow path",
            )
        )

    first_task_id = _first_task_id(starts=starts, outgoing=outgoing, element_by_id=element_by_id)
    if first_task_id is None and len(starts) == 1 and tasks:
        issues.append(
            _issue(
                code="start_path_incomplete",
                target=f"elements.{starts[0]['id']}",
                element_id=starts[0]["id"],
                message="Connect Start to the first Task before publishing this workflow.",
                action_label="Review workflow path",
            )
        )

    if len(starts) == 1 and len(ends) == 1:
        reachable_from_start = _reachable_ids(starts[0]["id"], outgoing)
        for element in document["elements"]:
            if element["id"] not in reachable_from_start:
                issues.append(
                    _issue(
                        code="path_disconnected",
                        target=f"elements.{element['id']}",
                        element_id=element["id"],
                        message="Connect this step into the Start to End path before publishing.",
                        action_label="Review workflow path",
                    )
                )

        reverse_graph: dict[str, list[dict[str, str]]] = defaultdict(list)
        for target_id, connections in incoming.items():
            reverse_graph[target_id] = connections
        reaches_end = _reachable_ids(ends[0]["id"], reverse_graph, reverse=True)
        for element in document["elements"]:
            if element["type"] != "end" and element["id"] not in reaches_end:
                issues.append(
                    _issue(
                        code="path_to_end_missing",
                        target=f"elements.{element['id']}",
                        element_id=element["id"],
                        message="Connect this step so the workflow reaches End before publishing.",
                        action_label="Review workflow path",
                    )
                )

    process_field_by_id = {field["id"]: field for field in document["processFields"]}
    first_task_bindings = []
    if first_task_id is not None:
        first_task_bindings = [
            binding
            for binding in document["formBindings"]
            if binding["taskElementId"] == first_task_id
        ]
        if not first_task_bindings:
            issues.append(
                _issue(
                    code="first_task_form_missing",
                    target=f"elements.{first_task_id}",
                    element_id=first_task_id,
                    message="Add one visible field to the first Task form before publishing.",
                    action_label="Open first task form",
                )
            )

    for binding in first_task_bindings:
        field = process_field_by_id.get(binding["fieldId"])
        if field is None:
            issues.append(
                _issue(
                    code="first_task_binding_missing_field",
                    target=f"formBindings.{binding['id']}",
                    binding_id=binding["id"],
                    message=(
                        "Reconnect this Task field to an existing reusable field "
                        "before publishing."
                    ),
                    action_label="Open first task form",
                )
            )
            continue

        label = (field.get("label") or binding.get("label") or "").strip()
        if not label:
            issues.append(
                _issue(
                    code="first_task_form_decorative",
                    target=f"processFields.{field['id']}",
                    field_id=field["id"],
                    binding_id=binding["id"],
                    message=(
                        "Replace decorative-only form content with a visible field "
                        "label before publishing."
                    ),
                    action_label="Open reusable field",
                )
            )

    ordered_issues = _deduplicate_and_sort(issues)
    return {
        "publishable": len(ordered_issues) == 0,
        "issues": ordered_issues,
    }


def _issue(
    *,
    code: str,
    target: str,
    message: str,
    action_label: str,
    severity: str = "blocking",
    element_id: str | None = None,
    field_id: str | None = None,
    binding_id: str | None = None,
) -> dict[str, Any]:
    return {
        "code": code,
        "severity": severity,
        "target": target,
        "elementId": element_id,
        "fieldId": field_id,
        "bindingId": binding_id,
        "message": message,
        "actionLabel": action_label,
    }


def _first_task_id(
    *,
    starts: list[dict[str, str]],
    outgoing: dict[str, list[dict[str, str]]],
    element_by_id: dict[str, dict[str, str]],
) -> str | None:
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


def _deduplicate_and_sort(issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    order = {
        "starter_missing": 0,
        "assignment_missing": 1,
        "start_step_invalid": 2,
        "first_task_missing": 3,
        "end_step_invalid": 4,
        "start_path_incomplete": 5,
        "path_disconnected": 6,
        "path_to_end_missing": 7,
        "first_task_form_missing": 8,
        "first_task_binding_missing_field": 9,
        "first_task_form_decorative": 10,
    }
    seen: set[tuple[Any, ...]] = set()
    deduplicated: list[dict[str, Any]] = []
    for issue in issues:
        marker = (
            issue["code"],
            issue["target"],
            issue["elementId"],
            issue["fieldId"],
            issue["bindingId"],
        )
        if marker in seen:
            continue
        seen.add(marker)
        deduplicated.append(issue)

    return sorted(
        deduplicated,
        key=lambda issue: (
            order.get(issue["code"], 999),
            issue["target"],
            issue["elementId"] or "",
            issue["fieldId"] or "",
            issue["bindingId"] or "",
        ),
    )
