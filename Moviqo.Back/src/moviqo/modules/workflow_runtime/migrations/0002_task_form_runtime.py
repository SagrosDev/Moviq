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

    tenant_expression = _tenant_expression()
    registrations = (
        (
            "workflow_runtime_task_occurrence",
            "workflow_runtime_task_occurrence_tenant_isolation",
        ),
        (
            "workflow_runtime_task_process_field_value",
            "workflow_runtime_task_process_field_value_tenant_isolation",
        ),
    )
    statements: list[str] = []
    for table_name, policy_name in registrations:
        statements.append(
            f"""
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
        )
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("\n".join(statements))


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("workflow_design", "0001_initial"),
        ("workflow_runtime", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaskOccurrence",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("task_element_id", models.CharField(max_length=64)),
                ("assignee_membership_id", models.UUIDField()),
                ("assignee_user_id", models.BigIntegerField()),
                ("status", models.CharField(default="assigned", max_length=32)),
                ("definition_revision", models.CharField(default="1", max_length=32)),
                ("revision", models.CharField(default="1", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="task_occurrences",
                        to="organizations.organization",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="task_occurrences",
                        to="workflow_design.workflowdefinition",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_runtime_task_occurrence",
            },
        ),
        migrations.CreateModel(
            name="TaskProcessFieldValue",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("field_id", models.CharField(max_length=64)),
                ("value_text", models.TextField(default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="task_process_field_values",
                        to="organizations.organization",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="process_field_values",
                        to="workflow_runtime.taskoccurrence",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_runtime_task_process_field_value",
            },
        ),
        migrations.AddConstraint(
            model_name="taskprocessfieldvalue",
            constraint=models.UniqueConstraint(
                fields=("task", "field_id"),
                name="workflow_runtime_task_process_field_value_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
