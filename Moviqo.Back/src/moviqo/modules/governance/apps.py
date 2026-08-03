from __future__ import annotations

from django.apps import AppConfig


class GovernanceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    label = "governance"
    name = "moviqo.modules.governance"
