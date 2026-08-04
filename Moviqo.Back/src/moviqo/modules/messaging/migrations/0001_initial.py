from __future__ import annotations

import uuid

import django.db.models.deletion
import django.utils.timezone
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

    table_name = "messaging_outbox_message"
    policy_name = "messaging_outbox_message_tenant_isolation"
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
            name="OutboxMessage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("message_type", models.CharField(max_length=120)),
                ("payload", models.JSONField(default=dict)),
                ("lease_owner", models.CharField(blank=True, max_length=120, null=True)),
                ("lease_expires_at", models.DateTimeField(blank=True, null=True)),
                ("attempt_count", models.PositiveIntegerField(default=0)),
                ("next_attempt_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("dead_lettered_at", models.DateTimeField(blank=True, null=True)),
                ("dead_letter_reason", models.CharField(blank=True, default="", max_length=200)),
                ("last_error", models.CharField(blank=True, default="", max_length=200)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="outbox_messages",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "messaging_outbox_message",
            },
        ),
        migrations.AddIndex(
            model_name="outboxmessage",
            index=models.Index(
                fields=["next_attempt_at", "dead_lettered_at", "delivered_at"],
                name="msg_outbox_claim_idx",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
