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
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier(table_name)}
    TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        for table_name, policy_name in (
            (
                "workflow_design_workflow_definition",
                "workflow_design_workflow_definition_tenant_isolation",
            ),
            (
                "workflow_design_workflow_draft",
                "workflow_design_workflow_draft_tenant_isolation",
            ),
        ):
            cursor.execute(_tenant_rls_sql(table_name, policy_name))


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0012_passwordrecoverythrottle"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkflowDefinition",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("normalized_name", models.CharField(max_length=120)),
                ("draft_schema_version", models.PositiveIntegerField(default=1)),
                ("created_by_membership_id", models.UUIDField()),
                ("created_by_user_id", models.BigIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="workflow_definitions",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_design_workflow_definition",
            },
        ),
        migrations.CreateModel(
            name="WorkflowDraft",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("document", models.JSONField(default=dict)),
                ("revision", models.CharField(default="1", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="workflow_drafts",
                        to="organizations.organization",
                    ),
                ),
                (
                    "workflow",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="draft",
                        to="workflow_design.workflowdefinition",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_design_workflow_draft",
            },
        ),
        migrations.AddConstraint(
            model_name="workflowdefinition",
            constraint=models.UniqueConstraint(
                fields=("organization", "normalized_name"),
                name="workflow_design_workflow_definition_name_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
