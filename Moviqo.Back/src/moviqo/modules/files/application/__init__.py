from __future__ import annotations

from django.conf import settings


def module_health() -> dict[str, str]:
    environment_class = settings.MOVIQO_ENVIRONMENT_CLASS
    adapter = settings.MOVIQO_FILE_INSPECTION_ADAPTER

    if adapter == "synthetic":
        if environment_class != "synthetic-only":
            raise RuntimeError(
                "The synthetic file inspection adapter can only run "
                "in the synthetic-only environment."
            )
        return {
            "adapter": "synthetic",
            "liveMalwareScanning": settings.MOVIQO_DISABLED_SERVICES["liveMalwareScanning"],
        }

    if environment_class == "synthetic-only":
        raise RuntimeError(
            "The synthetic-only environment must not start without "
            "the synthetic file inspection adapter."
        )

    if adapter == "disabled":
        return {"adapter": "disabled", "liveMalwareScanning": "disabled"}

    if adapter in {"clamav", "live-malware"}:
        return {"adapter": adapter, "liveMalwareScanning": "enabled"}

    raise RuntimeError(f"Unsupported file inspection adapter: {adapter}")
