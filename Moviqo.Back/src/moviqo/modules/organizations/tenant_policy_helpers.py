from __future__ import annotations

from django.conf import settings

from moviqo.building_blocks.tenancy.checks import OPERATOR_SCHEMA_NAME, TENANT_SETTING_NAME


def runtime_role_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_ROLE


def runtime_member_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_MEMBER


def current_tenant_uuid_sql() -> str:
    return f"NULLIF(current_setting('{TENANT_SETTING_NAME}', true), '')::uuid"


def runtime_role_setup_sql() -> str:
    runtime_role = runtime_role_name()
    runtime_member = runtime_member_name()
    return f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{runtime_role}') THEN
        CREATE ROLE {runtime_role} NOLOGIN NOBYPASSRLS;
    END IF;
END
$$;
CREATE SCHEMA IF NOT EXISTS {OPERATOR_SCHEMA_NAME};
GRANT {runtime_role} TO {runtime_member};
GRANT USAGE ON SCHEMA public TO {runtime_role};
GRANT SELECT ON TABLE organizations_moviqo_user TO {runtime_role};
"""


def tenant_policy_sql(table_name: str, tenant_column_sql: str, policy_name: str) -> str:
    tenant_expression = current_tenant_uuid_sql()
    runtime_role = runtime_role_name()
    return f"""
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {policy_name} ON {table_name};
CREATE POLICY {policy_name}
    ON {table_name}
    USING ({tenant_column_sql} = {tenant_expression})
    WITH CHECK ({tenant_column_sql} = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_name} TO {runtime_role};
"""


def immutable_organization_trigger_sql(table_name: str) -> str:
    return f"""
CREATE OR REPLACE FUNCTION public.moviqo_prevent_organization_reassignment()
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
DROP TRIGGER IF EXISTS {table_name}_immutable_organization_id ON {table_name};
CREATE TRIGGER {table_name}_immutable_organization_id
    BEFORE UPDATE OF organization_id ON {table_name}
    FOR EACH ROW
    EXECUTE FUNCTION public.moviqo_prevent_organization_reassignment();
"""
