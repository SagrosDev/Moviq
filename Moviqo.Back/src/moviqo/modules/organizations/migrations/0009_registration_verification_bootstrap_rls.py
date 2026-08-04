from django.db import migrations

TENANT_SETTING_NAME = "moviqo.current_organization_id"
VERIFICATION_SETTING_NAME = "moviqo.registration_verification_id"
RUNTIME_ROLE_NAME = "moviqo_runtime"
POLICY_NAME = "organizations_registration_verification_tenant_isolation"


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def apply_bootstrap_policy(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    tenant_expression = (
        f"NULLIF(current_setting({_quote_literal(TENANT_SETTING_NAME)}, true), '')::uuid"
    )
    verification_expression = (
        f"NULLIF(current_setting({_quote_literal(VERIFICATION_SETTING_NAME)}, true), '')::uuid"
    )
    table_name = _quote_identifier("organizations_registration_verification")
    policy_name = _quote_identifier(POLICY_NAME)
    runtime_role = _quote_identifier(RUNTIME_ROLE_NAME)
    statement = f"""
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS {policy_name} ON {table_name};
CREATE POLICY {policy_name}
    ON {table_name}
    USING (organization_id = {tenant_expression} OR id = {verification_expression})
    WITH CHECK (organization_id = {tenant_expression});
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_name} TO {runtime_role};
"""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(statement)


class Migration(migrations.Migration):
    dependencies = [("organizations", "0008_initialregistrationcommandresult_and_consent_flags")]
    operations = [migrations.RunPython(apply_bootstrap_policy, migrations.RunPython.noop)]
