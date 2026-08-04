from __future__ import annotations

import uuid

import django.db.models.deletion
from django.db import migrations, models

TENANT_SETTING_NAME = "moviqo.current_organization_id"
RUNTIME_ROLE_NAME = "moviqo_runtime"


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _tenant_expression() -> str:
    return f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    table_name = "workflow_runtime_atomic_command_probe"
    policy_name = "workflow_runtime_atomic_command_probe_tenant_isolation"
    tenant_expression = _tenant_expression()
    statement = f"""
ALTER TABLE {_quote_identifier(table_name)} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier(table_name)} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(policy_name)} ON {_quote_identifier(table_name)};
CREATE POLICY {_quote_identifier(policy_name)}
    ON {_quote_identifier(table_name)}
    USING (organization_id = {tenant_expression})
    WITH CHECK (organization_id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier(table_name)}
    TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(statement)


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0006_alter_moviqouser_managers"),
    ]

    operations = [
        migrations.CreateModel(
            name="AtomicCommandProbe",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("reference", models.CharField(max_length=120)),
                ("payload", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="atomic_command_probes",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_runtime_atomic_command_probe",
            },
        ),
        migrations.AddConstraint(
            model_name="atomiccommandprobe",
            constraint=models.UniqueConstraint(
                fields=("organization", "reference"),
                name="workflow_runtime_atomic_command_probe_reference_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
