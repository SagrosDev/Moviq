from __future__ import annotations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

RUNTIME_ROLE_NAME = "moviqo_runtime"
TENANT_SETTING_NAME = "moviqo.current_organization_id"
AUTHENTICATED_USER_SETTING_NAME = "moviqo.authenticated_user_id"
OPERATOR_SCHEMA_NAME = "operator_history"
MEMBERSHIP_POLICY_NAME = "organizations_membership_tenant_isolation"
ORGANIZATION_POLICY_NAME = "organizations_organization_tenant_isolation"


def _runtime_member_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_MEMBER", settings.DATABASES["default"]["USER"])


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _current_tenant_uuid_sql() -> str:
    return f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"


def _authenticated_user_id_sql() -> str:
    return (
        "NULLIF("
        f"current_setting({_quote_literal(AUTHENTICATED_USER_SETTING_NAME)}, true), "
        "''"
        ")::integer"
    )


def _runtime_role_setup_sql() -> str:
    runtime_member = _runtime_member_name()
    return f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = {_quote_literal(RUNTIME_ROLE_NAME)}) THEN
        EXECUTE 'CREATE ROLE {_quote_identifier(RUNTIME_ROLE_NAME)} NOLOGIN NOBYPASSRLS';
    END IF;
END
$$;
CREATE SCHEMA IF NOT EXISTS {_quote_identifier(OPERATOR_SCHEMA_NAME)};
GRANT {_quote_identifier(RUNTIME_ROLE_NAME)} TO {_quote_identifier(runtime_member)};
GRANT USAGE ON SCHEMA public TO {_quote_identifier(RUNTIME_ROLE_NAME)};
GRANT SELECT ON TABLE organizations_moviqo_user TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""


def _organization_policy_sql() -> str:
    tenant_expression = _current_tenant_uuid_sql()
    return f"""
ALTER TABLE {_quote_identifier('organizations_organization')} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier('organizations_organization')} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(ORGANIZATION_POLICY_NAME)} ON {_quote_identifier('organizations_organization')};
CREATE POLICY {_quote_identifier(ORGANIZATION_POLICY_NAME)}
    ON {_quote_identifier('organizations_organization')}
    USING (id = {tenant_expression})
    WITH CHECK (id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier('organizations_organization')}
    TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""


def _membership_policy_sql() -> str:
    tenant_expression = _current_tenant_uuid_sql()
    authenticated_user_expression = _authenticated_user_id_sql()
    return f"""
ALTER TABLE {_quote_identifier('organizations_membership')} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier('organizations_membership')} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(MEMBERSHIP_POLICY_NAME)} ON {_quote_identifier('organizations_membership')};
CREATE POLICY {_quote_identifier(MEMBERSHIP_POLICY_NAME)}
    ON {_quote_identifier('organizations_membership')}
    USING (
        organization_id = {tenant_expression}
        OR (
            {tenant_expression} IS NULL
            AND user_id = {authenticated_user_expression}
        )
    )
    WITH CHECK (organization_id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier('organizations_membership')}
    TO {_quote_identifier(RUNTIME_ROLE_NAME)};
"""


def _immutable_organization_trigger_sql() -> str:
    return f"""
CREATE OR REPLACE FUNCTION public.{_quote_identifier('moviqo_prevent_organization_reassignment')}()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'organization_id is immutable';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS {_quote_identifier('organizations_membership_immutable_organization_id')}
    ON {_quote_identifier('organizations_membership')};
CREATE TRIGGER {_quote_identifier('organizations_membership_immutable_organization_id')}
    BEFORE UPDATE OF organization_id ON {_quote_identifier('organizations_membership')}
    FOR EACH ROW
    EXECUTE FUNCTION public.{_quote_identifier('moviqo_prevent_organization_reassignment')}();
"""


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    statements = (
        _runtime_role_setup_sql(),
        _organization_policy_sql(),
        _membership_policy_sql(),
        _immutable_organization_trigger_sql(),
    )
    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("display_name", models.CharField(max_length=120)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "organizations_organization",
            },
        ),
        migrations.CreateModel(
            name="Membership",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("owner", "Owner"),
                            ("administrator", "Administrator"),
                            ("designer", "Designer"),
                            ("member", "Member"),
                        ],
                        default="member",
                        max_length=32,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="memberships",
                        to="organizations.organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="memberships",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "organizations_membership",
            },
        ),
        migrations.AddConstraint(
            model_name="membership",
            constraint=models.UniqueConstraint(
                fields=("organization", "user"),
                name="organizations_membership_organization_user_unique",
            ),
        ),
        migrations.RunPython(apply_postgresql_tenant_infrastructure, noop_reverse),
    ]
