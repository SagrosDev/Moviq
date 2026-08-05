from __future__ import annotations

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.workflow_runtime.application.start_process import (
    list_startable_workflows,
)

START_WORKFLOW_LIMIT = 6
MY_TASK_LIMIT = 12
MY_PROCESS_LIMIT = 12


def _empty_collection(limit: int) -> dict[str, object]:
    return {
        "items": [],
        "limit": limit,
        "hasMore": False,
    }


def read_my_work_dashboard(tenant_context: TenantContext) -> dict[str, object]:
    startable_workflows = list_startable_workflows(tenant_context=tenant_context)
    return {
        "startWorkflows": {
            "items": [
                {
                    "workflowId": item.workflow_id,
                    "title": item.title,
                    "description": item.description,
                    "availability": item.availability,
                    "versionNumber": item.version_number,
                }
                for item in startable_workflows[:START_WORKFLOW_LIMIT]
            ],
            "limit": START_WORKFLOW_LIMIT,
            "hasMore": len(startable_workflows) > START_WORKFLOW_LIMIT,
        },
        "myTasks": _empty_collection(MY_TASK_LIMIT),
        "myProcesses": _empty_collection(MY_PROCESS_LIMIT),
    }
