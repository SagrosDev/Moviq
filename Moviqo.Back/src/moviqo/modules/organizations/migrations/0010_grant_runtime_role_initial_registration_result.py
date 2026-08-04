from __future__ import annotations

from django.conf import settings
from django.db import migrations

RUNTIME_ROLE_NAME = "moviqo_runtime"
TABLE_NAME = "organizations_initial_registration_command_result"
USER_TABLE_NAME = "organizations_moviqo_user"


def _runtime_member_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_MEMBER", settings.DATABASES["default"]["USER"])


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def apply_runtime_role_grant(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier(TABLE_NAME)} "
            f"TO {_quote_identifier(RUNTIME_ROLE_NAME)};"
        )
        cursor.execute(
            f"GRANT SELECT, UPDATE ON TABLE {_quote_identifier(USER_TABLE_NAME)} "
            f"TO {_quote_identifier(RUNTIME_ROLE_NAME)};"
        )
        cursor.execute(
            f"GRANT SELECT, UPDATE ON TABLE {_quote_identifier(USER_TABLE_NAME)} "
            f"TO {_quote_identifier(_runtime_member_name())};"
        )


class Migration(migrations.Migration):
    dependencies = [("organizations", "0009_registration_verification_bootstrap_rls")]

    operations = [
        migrations.RunPython(apply_runtime_role_grant, migrations.RunPython.noop),
    ]
