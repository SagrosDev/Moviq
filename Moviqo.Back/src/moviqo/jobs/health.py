from __future__ import annotations

from moviqo.modules.files.application import module_health as files_health
from moviqo.modules.governance.application import module_health as governance_health
from moviqo.modules.messaging.application import module_health as messaging_health
from moviqo.modules.organizations.application import module_health as organizations_health
from moviqo.modules.workflow_design.application import module_health as workflow_design_health
from moviqo.modules.workflow_runtime.application import module_health as workflow_runtime_health


def run() -> dict[str, str]:
    organizations_health()
    workflow_design_health()
    workflow_runtime_health()
    files_health()
    messaging_health()
    governance_health()
    return {"status": "ok"}
