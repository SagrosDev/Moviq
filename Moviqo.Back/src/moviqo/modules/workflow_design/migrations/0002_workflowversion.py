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


def _tenant_rls_sql(table_name: str, policy_name: str) -> str:
    tenant_expression = _tenant_expression()
    return f"""
ALTER TABLE {_quote_identifier(table_name)} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier(table_name)} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(policy_name)} ON {_quote_identifier(table_name)};
CREATE POLICY {_quote_identifier(policy_name)}
    ON {_quote_identifier(table_name)}
    USING (organization_id = {tenant_expression})
    WITH CHECK (organization_id = {tenant_expression});
GRANT SELECT, INSERT ON TABLE {_quote_identifier(table_name)}
    TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            _tenant_rls_sql(
                "workflow_design_workflow_version",
                "workflow_design_workflow_version_tenant_isolation",
            )
        )


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("workflow_design", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkflowVersion",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("version_number", models.PositiveIntegerField()),
                ("source_draft_revision", models.CharField(max_length=32)),
                ("snapshot_schema_version", models.PositiveIntegerField()),
                ("snapshot", models.JSONField(default=dict)),
                ("published_by_membership_id", models.UUIDField()),
                ("published_by_user_id", models.BigIntegerField()),
                ("published_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="workflow_versions",
                        to="organizations.organization",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="versions",
                        to="workflow_design.workflowdefinition",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_design_workflow_version",
            },
        ),
        migrations.AddConstraint(
            model_name="workflowversion",
            constraint=models.UniqueConstraint(
                fields=("workflow", "version_number"),
                name="workflow_design_workflow_version_number_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
