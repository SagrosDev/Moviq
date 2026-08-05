from __future__ import annotations

from importlib import import_module
from typing import Any


def module_health() -> None:
    return None


_LAZY_EXPORTS = {
    "WorkflowCollectionView": (
        "moviqo.modules.workflow_design.application.views",
        "WorkflowCollectionView",
    ),
    "WorkflowDraftDetailView": (
        "moviqo.modules.workflow_design.application.views",
        "WorkflowDraftDetailView",
    ),
    "WorkflowPublicationValidationView": (
        "moviqo.modules.workflow_design.application.views",
        "WorkflowPublicationValidationView",
    ),
    "create_workflow_definition": (
        "moviqo.modules.workflow_design.application.services",
        "create_workflow_definition",
    ),
    "list_workflow_catalog": (
        "moviqo.modules.workflow_design.application.services",
        "list_workflow_catalog",
    ),
    "read_workflow_draft": (
        "moviqo.modules.workflow_design.application.services",
        "read_workflow_draft",
    ),
    "read_workflow_draft_snapshot": (
        "moviqo.modules.workflow_design.application.services",
        "read_workflow_draft_snapshot",
    ),
    "save_workflow_draft": (
        "moviqo.modules.workflow_design.application.services",
        "save_workflow_draft",
    ),
    "validate_workflow_publication": (
        "moviqo.modules.workflow_design.application.services",
        "validate_workflow_publication",
    ),
}


def __getattr__(name: str) -> Any:
    if name == "module_health":
        return module_health
    target = _LAZY_EXPORTS.get(name)
    if target is None:
        raise AttributeError(name)
    module_name, attribute_name = target
    return getattr(import_module(module_name), attribute_name)


__all__ = ["module_health", *_LAZY_EXPORTS.keys()]
