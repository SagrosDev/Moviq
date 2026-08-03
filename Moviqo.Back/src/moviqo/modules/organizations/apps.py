from __future__ import annotations

from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    label = "organizations"
    name = "moviqo.modules.organizations"
