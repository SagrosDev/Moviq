from __future__ import annotations

from django.apps import AppConfig


class WorkflowRuntimeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    label = "workflow_runtime"
    name = "moviqo.modules.workflow_runtime"
