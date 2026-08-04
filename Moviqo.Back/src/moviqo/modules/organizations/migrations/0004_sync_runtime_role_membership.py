from __future__ import annotations

from django.conf import settings
from django.db import migrations

RUNTIME_ROLE_NAME = "moviqo_runtime"


def _runtime_role_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_ROLE", RUNTIME_ROLE_NAME)


def _runtime_member_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_MEMBER", settings.DATABASES["default"]["USER"])


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def sync_runtime_role_membership(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"GRANT {_quote_identifier(_runtime_role_name())} "
            f"TO {_quote_identifier(_runtime_member_name())}"
        )


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0003_grant_runtime_role_user_read"),
    ]

    operations = [
        migrations.RunPython(sync_runtime_role_membership, noop_reverse),
    ]
