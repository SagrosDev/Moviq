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
            "workflow_runtime_process_instance",
            "workflow_runtime_process_instance_tenant_isolation",
        ),
        (
            "workflow_runtime_task_occurrence",
            "workflow_runtime_task_occurrence_tenant_isolation",
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
        ("workflow_design", "0002_workflowversion"),
        ("workflow_runtime", "0002_task_form_runtime"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProcessInstance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("initiator_membership_id", models.UUIDField()),
                ("initiator_user_id", models.BigIntegerField()),
                ("status", models.CharField(default="active", max_length=32)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("last_activity_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="process_instances",
                        to="organizations.organization",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="process_instances",
                        to="workflow_design.workflowdefinition",
                    ),
                ),
                (
                    "workflow_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="process_instances",
                        to="workflow_design.workflowversion",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_runtime_process_instance",
            },
        ),
        migrations.AddField(
            model_name="taskoccurrence",
            name="activated_by_membership_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskoccurrence",
            name="activated_by_user_id",
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskoccurrence",
            name="process",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tasks",
                to="workflow_runtime.processinstance",
            ),
        ),
        migrations.AddField(
            model_name="taskoccurrence",
            name="workflow_version",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="task_occurrences",
                to="workflow_design.workflowversion",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
