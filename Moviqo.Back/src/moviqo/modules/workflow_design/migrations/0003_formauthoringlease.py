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


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return
    table_name = "workflow_design_form_authoring_lease"
    policy_name = "workflow_design_form_authoring_lease_tenant_isolation"
    tenant_expression = (
        f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"
    )
    sql = f"""
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
        cursor.execute(sql)


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("workflow_design", "0002_workflowversion"),
    ]

    operations = [
        migrations.CreateModel(
            name="FormAuthoringLease",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid7,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("task_element_id", models.CharField(max_length=255)),
                (
                    "lease_token",
                    models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
                ),
                ("holder_membership_id", models.UUIDField()),
                ("holder_user_id", models.BigIntegerField()),
                ("session_key", models.CharField(max_length=40)),
                ("session_expires_at", models.DateTimeField()),
                ("lease_expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="form_authoring_leases",
                        to="organizations.organization",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="form_authoring_leases",
                        to="workflow_design.workflowdefinition",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_design_form_authoring_lease",
            },
        ),
        migrations.AddConstraint(
            model_name="formauthoringlease",
            constraint=models.UniqueConstraint(
                fields=("workflow", "task_element_id"),
                name="workflow_design_form_lease_task_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
