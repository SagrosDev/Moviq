from __future__ import annotations

from django.conf import settings

from moviqo.building_blocks.tenancy.checks import (
    AUTHENTICATED_USER_SETTING_NAME,
    OPERATOR_SCHEMA_NAME,
    TENANT_SETTING_NAME,
)


def runtime_role_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_ROLE


def runtime_member_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_MEMBER


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def current_tenant_uuid_sql() -> str:
    return f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"


def authenticated_user_id_sql() -> str:
    return (
        "NULLIF("
        f"current_setting({_quote_literal(AUTHENTICATED_USER_SETTING_NAME)}, true), "
        "''"
        ")::integer"
    )


def runtime_role_setup_sql() -> str:
    runtime_role = runtime_role_name()
    runtime_member = runtime_member_name()
    operator_schema = _quote_identifier(OPERATOR_SCHEMA_NAME)
    return f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = {_quote_literal(runtime_role)}) THEN
        EXECUTE 'CREATE ROLE {_quote_identifier(runtime_role)} NOLOGIN NOBYPASSRLS';
    END IF;
END
$$;
CREATE SCHEMA IF NOT EXISTS {operator_schema};
GRANT {_quote_identifier(runtime_role)} TO {_quote_identifier(runtime_member)};
GRANT USAGE ON SCHEMA public TO {_quote_identifier(runtime_role)};
GRANT SELECT ON TABLE organizations_moviqo_user TO {_quote_identifier(runtime_role)};
"""


def tenant_policy_sql(table_name: str, tenant_column_sql: str, policy_name: str) -> str:
    tenant_expression = current_tenant_uuid_sql()
    runtime_role = runtime_role_name()
    quoted_table_name = _quote_identifier(table_name)
    quoted_policy_name = _quote_identifier(policy_name)
    return f"""
ALTER TABLE {quoted_table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {quoted_table_name} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {quoted_policy_name} ON {quoted_table_name};
CREATE POLICY {quoted_policy_name}
    ON {quoted_table_name}
    USING ({tenant_column_sql} = {tenant_expression})
    WITH CHECK ({tenant_column_sql} = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE {quoted_table_name}
    TO {_quote_identifier(runtime_role)};
"""


def membership_tenant_policy_sql(*, table_name: str, policy_name: str) -> str:
    tenant_expression = current_tenant_uuid_sql()
    authenticated_user_expression = authenticated_user_id_sql()
    runtime_role = runtime_role_name()
    quoted_table_name = _quote_identifier(table_name)
    quoted_policy_name = _quote_identifier(policy_name)
    return f"""
ALTER TABLE {quoted_table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {quoted_table_name} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {quoted_policy_name} ON {quoted_table_name};
CREATE POLICY {quoted_policy_name}
    ON {quoted_table_name}
    USING (
        organization_id = {tenant_expression}
        OR (
            {tenant_expression} IS NULL
            AND user_id = {authenticated_user_expression}
        )
    )
    WITH CHECK (organization_id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE {quoted_table_name}
    TO {_quote_identifier(runtime_role)};
"""


def immutable_organization_trigger_sql(table_name: str) -> str:
    function_name = "moviqo_prevent_organization_reassignment"
    trigger_name = f"{table_name}_immutable_organization_id"
    quoted_table_name = _quote_identifier(table_name)
    quoted_function_name = _quote_identifier(function_name)
    quoted_trigger_name = _quote_identifier(trigger_name)
    return f"""
CREATE OR REPLACE FUNCTION public.{quoted_function_name}()
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
DROP TRIGGER IF EXISTS {quoted_trigger_name} ON {quoted_table_name};
CREATE TRIGGER {quoted_trigger_name}
    BEFORE UPDATE OF organization_id ON {quoted_table_name}
    FOR EACH ROW
    EXECUTE FUNCTION public.{quoted_function_name}();
"""
