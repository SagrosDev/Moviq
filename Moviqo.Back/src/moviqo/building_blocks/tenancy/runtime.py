from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from uuid import UUID

from django.conf import settings
from django.db import connection, transaction
from rest_framework.exceptions import PermissionDenied

from moviqo.building_blocks.tenancy.checks import (
    AUTHENTICATED_USER_SETTING_NAME,
    REGISTRATION_VERIFICATION_SETTING_NAME,
    TENANT_SETTING_NAME,
)


@dataclass(frozen=True)
class TenantContext:
    organization_id: UUID
    membership_id: UUID
    user_id: int


def runtime_role_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_ROLE


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _activate_runtime_role(cursor) -> None:
    if settings.DATABASES["default"]["USER"] != runtime_role_name():
        cursor.execute(f"SET LOCAL ROLE {_quote_identifier(runtime_role_name())}")


def _set_local_setting(cursor, setting_name: str, value: str) -> None:
    cursor.execute("SELECT set_config(%s, %s, true)", [setting_name, value])


def apply_tenant_context(context: TenantContext) -> None:
    if connection.vendor != "postgresql":
        return

    with connection.cursor() as cursor:
        _activate_runtime_role(cursor)
        _set_local_setting(
            cursor,
            AUTHENTICATED_USER_SETTING_NAME,
            str(context.user_id),
        )
        _set_local_setting(cursor, TENANT_SETTING_NAME, str(context.organization_id))


@contextmanager
def registration_verification_bootstrap_context(*, verification_id: UUID):
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            _activate_runtime_role(cursor)
            _set_local_setting(
                cursor,
                REGISTRATION_VERIFICATION_SETTING_NAME,
                str(verification_id),
            )
    yield


@contextmanager
def tenant_bootstrap_context(*, user_id: int):
    with transaction.atomic():
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                _activate_runtime_role(cursor)
                _set_local_setting(
                    cursor,
                    AUTHENTICATED_USER_SETTING_NAME,
                    str(user_id),
                )
        yield


@contextmanager
def tenant_atomic_context(context: TenantContext):
    with transaction.atomic():
        apply_tenant_context(context)
        yield context


@contextmanager
def tenant_background_atomic_context(*, organization_id: UUID):
    with transaction.atomic():
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                _activate_runtime_role(cursor)
                _set_local_setting(cursor, AUTHENTICATED_USER_SETTING_NAME, "0")
                _set_local_setting(cursor, TENANT_SETTING_NAME, str(organization_id))
        yield organization_id


def require_authenticated_user(user) -> None:
    if not getattr(user, "is_authenticated", False) or not getattr(user, "is_active", False):
        raise PermissionDenied("tenant context unavailable")
