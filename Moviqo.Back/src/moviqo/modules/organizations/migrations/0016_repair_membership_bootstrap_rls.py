from __future__ import annotations

from django.db import migrations

RUNTIME_ROLE_NAME = "moviqo_runtime"
TENANT_SETTING_NAME = "moviqo.current_organization_id"
AUTHENTICATED_USER_SETTING_NAME = "moviqo.authenticated_user_id"
MEMBERSHIP_TABLE_NAME = "organizations_membership"
MEMBERSHIP_SELECT_POLICY_NAME = "organizations_membership_tenant_isolation"
MEMBERSHIP_INSERT_POLICY_NAME = "organizations_membership_tenant_insert"
MEMBERSHIP_UPDATE_POLICY_NAME = "organizations_membership_tenant_update"
MEMBERSHIP_DELETE_POLICY_NAME = "organizations_membership_tenant_delete"


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


def _membership_policy_sql() -> str:
    tenant_expression = _current_tenant_uuid_sql()
    authenticated_user_expression = _authenticated_user_id_sql()
    table_name = _quote_identifier(MEMBERSHIP_TABLE_NAME)
    select_policy_name = _quote_identifier(MEMBERSHIP_SELECT_POLICY_NAME)
    insert_policy_name = _quote_identifier(MEMBERSHIP_INSERT_POLICY_NAME)
    update_policy_name = _quote_identifier(MEMBERSHIP_UPDATE_POLICY_NAME)
    delete_policy_name = _quote_identifier(MEMBERSHIP_DELETE_POLICY_NAME)
    runtime_role = _quote_identifier(RUNTIME_ROLE_NAME)
    return f"""
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {select_policy_name} ON {table_name};
DROP POLICY IF EXISTS {insert_policy_name} ON {table_name};
DROP POLICY IF EXISTS {update_policy_name} ON {table_name};
DROP POLICY IF EXISTS {delete_policy_name} ON {table_name};
CREATE POLICY {select_policy_name}
    ON {table_name}
    FOR SELECT
    USING (
        organization_id = {tenant_expression}
        OR (
            {tenant_expression} IS NULL
            AND user_id = {authenticated_user_expression}
        )
    );
CREATE POLICY {insert_policy_name}
    ON {table_name}
    FOR INSERT
    WITH CHECK (organization_id = {tenant_expression});
CREATE POLICY {update_policy_name}
    ON {table_name}
    FOR UPDATE
    USING (organization_id = {tenant_expression})
    WITH CHECK (organization_id = {tenant_expression});
CREATE POLICY {delete_policy_name}
    ON {table_name}
    FOR DELETE
    USING (organization_id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_name} TO {runtime_role};
"""


def apply_membership_bootstrap_policy(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(_membership_policy_sql())


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0015_retired_registration_state"),
    ]

    operations = [
        migrations.RunPython(
            apply_membership_bootstrap_policy,
            migrations.RunPython.noop,
        ),
    ]
