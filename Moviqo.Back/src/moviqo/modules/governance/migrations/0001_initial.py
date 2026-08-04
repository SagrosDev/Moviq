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
            ("governance_command_result", "governance_command_result_tenant_isolation"),
            (
                "governance_transactional_audit_record",
                "governance_transactional_audit_record_tenant_isolation",
            ),
        ):
            cursor.execute(_tenant_rls_sql(table_name, policy_name))


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0006_alter_moviqouser_managers"),
    ]

    operations = [
        migrations.CreateModel(
            name="CommandResult",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("command_type", models.CharField(max_length=120)),
                ("idempotency_key", models.CharField(max_length=120)),
                ("request_hash", models.CharField(max_length=128)),
                ("result_payload", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="command_results",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "governance_command_result",
            },
        ),
        migrations.CreateModel(
            name="TransactionalAuditRecord",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("command_type", models.CharField(max_length=120)),
                ("event_type", models.CharField(max_length=120)),
                ("actor_membership_id", models.UUIDField(blank=True, null=True)),
                ("actor_user_id", models.BigIntegerField(blank=True, null=True)),
                ("payload", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="transactional_audit_records",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "governance_transactional_audit_record",
            },
        ),
        migrations.AddConstraint(
            model_name="commandresult",
            constraint=models.UniqueConstraint(
                fields=("organization", "command_type", "idempotency_key"),
                name="governance_command_result_idempotency_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
