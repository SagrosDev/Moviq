from __future__ import annotations

from moviqo.modules.workflow_runtime.application.complete_task import complete_task
from moviqo.modules.workflow_runtime.application.my_work import read_my_work_dashboard
from moviqo.modules.workflow_runtime.application.task_form import (
    read_task_form,
    save_task_form_draft,
)
from moviqo.modules.workflow_runtime.application.views import (
    MyWorkDashboardView,
    StartWorkflowProcessView,
    TaskFormCompletionView,
    TaskFormDetailView,
)


def module_health() -> None:
    return None


__all__ = [
    "MyWorkDashboardView",
    "StartWorkflowProcessView",
    "TaskFormCompletionView",
    "TaskFormDetailView",
    "complete_task",
    "module_health",
    "read_my_work_dashboard",
    "read_task_form",
    "save_task_form_draft",
]
