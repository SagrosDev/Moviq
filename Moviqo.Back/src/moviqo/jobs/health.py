from __future__ import annotations

from moviqo.modules.organizations.application import module_health


def run() -> dict[str, str]:
    module_health()
    return {"status": "ok"}
