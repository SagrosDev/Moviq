from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from uuid import UUID

from django.conf import settings
from django.db import connection, transaction
from rest_framework.exceptions import PermissionDenied

from moviqo.building_blocks.tenancy.checks import TENANT_SETTING_NAME


@dataclass(frozen=True)
class TenantContext:
    organization_id: UUID
    membership_id: UUID
    user_id: int


def runtime_role_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_ROLE


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def apply_tenant_context(context: TenantContext) -> None:
    if connection.vendor != "postgresql":
        return

    with connection.cursor() as cursor:
        if settings.DATABASES["default"]["USER"] != runtime_role_name():
            cursor.execute(f"SET LOCAL ROLE {_quote_identifier(runtime_role_name())}")
        cursor.execute(
            "SELECT set_config(%s, %s, true)",
            [TENANT_SETTING_NAME, str(context.organization_id)],
        )


@contextmanager
def tenant_atomic_context(context: TenantContext):
    with transaction.atomic():
        apply_tenant_context(context)
        yield context


def require_authenticated_user(user) -> None:
    if not getattr(user, "is_authenticated", False) or not getattr(user, "is_active", False):
        raise PermissionDenied("tenant context unavailable")
