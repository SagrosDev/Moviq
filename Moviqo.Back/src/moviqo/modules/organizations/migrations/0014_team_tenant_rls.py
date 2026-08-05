from __future__ import annotations

from django.conf import settings
from django.db import migrations

RUNTIME_ROLE_NAME = "moviqo_runtime"
TENANT_SETTING_NAME = "moviqo.current_organization_id"
TEAM_POLICY_NAME = "organizations_team_tenant_isolation"
TEAM_MEMBERSHIP_POLICY_NAME = "organizations_team_membership_tenant_isolation"


def _runtime_member_name() -> str:
    return getattr(settings, "MOVIQO_DB_RUNTIME_MEMBER", settings.DATABASES["default"]["USER"])


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _current_tenant_uuid_sql() -> str:
    return f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"


def _grant_runtime_role_sql(table_name: str) -> str:
    return (
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {_quote_identifier(table_name)} "
        f"TO {_quote_identifier(RUNTIME_ROLE_NAME)};"
    )


def _team_policy_sql() -> str:
    tenant_expression = _current_tenant_uuid_sql()
    return f"""
ALTER TABLE {_quote_identifier('organizations_team')} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier('organizations_team')} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(TEAM_POLICY_NAME)} ON {_quote_identifier('organizations_team')};
CREATE POLICY {_quote_identifier(TEAM_POLICY_NAME)}
    ON {_quote_identifier('organizations_team')}
    USING (organization_id = {tenant_expression})
    WITH CHECK (organization_id = {tenant_expression});
{_grant_runtime_role_sql('organizations_team')}
"""


def _team_membership_policy_sql() -> str:
    tenant_expression = _current_tenant_uuid_sql()
    return f"""
ALTER TABLE {_quote_identifier('organizations_team_membership')} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {_quote_identifier('organizations_team_membership')} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {_quote_identifier(TEAM_MEMBERSHIP_POLICY_NAME)} ON {_quote_identifier('organizations_team_membership')};
CREATE POLICY {_quote_identifier(TEAM_MEMBERSHIP_POLICY_NAME)}
    ON {_quote_identifier('organizations_team_membership')}
    USING (organization_id = {tenant_expression})
    WITH CHECK (organization_id = {tenant_expression});
{_grant_runtime_role_sql('organizations_team_membership')}
"""


def apply_postgresql_team_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    statements = (
        f"GRANT {_quote_identifier(RUNTIME_ROLE_NAME)} TO {_quote_identifier(_runtime_member_name())};",
        _team_policy_sql(),
        _team_membership_policy_sql(),
    )
    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)


def noop_reverse(_apps, _schema_editor) -> None:
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0013_team_teammembership_and_more"),
    ]

    operations = [
        migrations.RunPython(apply_postgresql_team_tenant_infrastructure, noop_reverse),
    ]
