from __future__ import annotations

from django.db import migrations

from moviqo.modules.organizations.tenant_policy_helpers import runtime_role_setup_sql


def sync_runtime_role_membership(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(runtime_role_setup_sql())


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0003_grant_runtime_role_user_read"),
    ]

    operations = [
        migrations.RunPython(sync_runtime_role_membership, noop_reverse),
    ]
