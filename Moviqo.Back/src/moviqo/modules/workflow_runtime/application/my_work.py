from __future__ import annotations

from moviqo.building_blocks.tenancy.runtime import TenantContext

START_WORKFLOW_LIMIT = 6
MY_TASK_LIMIT = 12
MY_PROCESS_LIMIT = 12


def _empty_collection(limit: int) -> dict[str, object]:
    return {
        "items": [],
        "limit": limit,
        "hasMore": False,
    }


def read_my_work_dashboard(_tenant_context: TenantContext) -> dict[str, object]:
    return {
        "startWorkflows": _empty_collection(START_WORKFLOW_LIMIT),
        "myTasks": _empty_collection(MY_TASK_LIMIT),
        "myProcesses": _empty_collection(MY_PROCESS_LIMIT),
    }
