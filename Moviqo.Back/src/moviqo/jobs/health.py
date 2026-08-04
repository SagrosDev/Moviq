from __future__ import annotations

from django.conf import settings

from moviqo.building_blocks.api.correlation import safe_correlation_id
from moviqo.modules.files.application import module_health as files_health
from moviqo.modules.governance.application import module_health as governance_health
from moviqo.modules.messaging.application import module_health as messaging_health
from moviqo.modules.organizations.application import module_health as organizations_health
from moviqo.modules.workflow_design.application import module_health as workflow_design_health
from moviqo.modules.workflow_runtime.application import module_health as workflow_runtime_health


def run() -> dict[str, object]:
    organizations_health()
    workflow_design_health()
    workflow_runtime_health()
    file_report = files_health()
    messaging_report = messaging_health()
    governance_health()
    return {
        "status": "ok",
        "build": settings.MOVIQO_BUILD_ID,
        "environmentClass": settings.MOVIQO_ENVIRONMENT_CLASS,
        "serviceClass": settings.MOVIQO_SERVICE_CLASS,
        "serviceName": settings.MOVIQO_SERVICE_NAME,
        "correlationId": safe_correlation_id(f"startup-{settings.MOVIQO_BUILD_ID}"),
        "cachePolicy": settings.MOVIQO_CACHE_POLICY,
        "fileInspection": file_report["adapter"],
        "messageDelivery": messaging_report["adapter"],
        "jobRunners": messaging_report["job_runners"],
        "disabledServices": settings.MOVIQO_DISABLED_SERVICES,
    }
