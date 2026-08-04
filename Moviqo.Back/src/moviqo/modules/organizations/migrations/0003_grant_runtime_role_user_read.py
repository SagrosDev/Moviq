from __future__ import annotations

from django.conf import settings
from django.db import migrations

RUNTIME_ROLE_NAME = "moviqo_runtime"


def _runtime_role_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_ROLE", RUNTIME_ROLE_NAME)


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def apply_runtime_role_user_grant(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "GRANT SELECT ON TABLE organizations_moviqo_user TO "
            f"{_quote_identifier(_runtime_role_name())}"
        )


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0002_organization_membership_tenant_rls"),
    ]

    operations = [
        migrations.RunPython(apply_runtime_role_user_grant, noop_reverse),
    ]
