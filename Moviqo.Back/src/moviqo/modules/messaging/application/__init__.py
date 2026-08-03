from __future__ import annotations

from django.conf import settings


def module_health() -> dict[str, str]:
    adapter = settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER

    if adapter == "resend-outbox":
        return {"adapter": "resend-outbox", "provider": "resend"}

    if adapter == "console":
        return {"adapter": "console", "provider": "local"}

    raise RuntimeError(f"Unsupported messaging adapter: {adapter}")
