from __future__ import annotations

from django.apps import AppConfig


class WorkflowDesignConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    label = "workflow_design"
    name = "moviqo.modules.workflow_design"

    def ready(self) -> None:
        from moviqo.modules.workflow_design import signals  # noqa: F401
