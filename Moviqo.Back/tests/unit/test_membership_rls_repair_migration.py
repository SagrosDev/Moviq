from __future__ import annotations

from importlib import import_module

membership_rls_repair_migration = import_module(
    "moviqo.modules.organizations.migrations.0016_repair_membership_bootstrap_rls"
)


class RecordingCursor:
    def __init__(self, statements: list[str]) -> None:
        self.statements = statements

    def __enter__(self):
        return self

    def __exit__(self, _exc_type, _exc_value, _traceback) -> None:
        return None

    def execute(self, statement: str) -> None:
        self.statements.append(statement)


class FakeConnection:
    def __init__(self, vendor: str) -> None:
        self.vendor = vendor
        self.statements: list[str] = []

    def cursor(self) -> RecordingCursor:
        return RecordingCursor(self.statements)


class FakeSchemaEditor:
    def __init__(self, vendor: str) -> None:
        self.connection = FakeConnection(vendor)


def test_repair_creates_select_bootstrap_and_tenant_only_write_policies() -> None:
    schema_editor = FakeSchemaEditor("postgresql")

    membership_rls_repair_migration.apply_membership_bootstrap_policy(None, schema_editor)

    assert len(schema_editor.connection.statements) == 1
    normalized_sql = " ".join(schema_editor.connection.statements[0].split())
    tenant_expression = (
        "NULLIF(current_setting('moviqo.current_organization_id', true), '')::uuid"
    )
    authenticated_user_expression = (
        "NULLIF(current_setting('moviqo.authenticated_user_id', true), '')::integer"
    )

    assert 'ALTER TABLE "organizations_membership" ENABLE ROW LEVEL SECURITY' in normalized_sql
    assert 'ALTER TABLE "organizations_membership" FORCE ROW LEVEL SECURITY' in normalized_sql
    assert normalized_sql.count("DROP POLICY IF EXISTS") == 4
    assert normalized_sql.count("CREATE POLICY") == 4

    select_policy = normalized_sql.split("CREATE POLICY", 2)[1]
    insert_policy = normalized_sql.split("CREATE POLICY", 3)[2]
    update_policy = normalized_sql.split("CREATE POLICY", 4)[3]
    delete_policy = normalized_sql.split("CREATE POLICY", 5)[4]

    assert '"organizations_membership_tenant_isolation"' in select_policy
    assert "FOR SELECT" in select_policy
    assert f"organization_id = {tenant_expression}" in select_policy
    assert f"{tenant_expression} IS NULL" in select_policy
    assert f"user_id = {authenticated_user_expression}" in select_policy

    assert '"organizations_membership_tenant_insert"' in insert_policy
    assert "FOR INSERT" in insert_policy
    assert f"WITH CHECK (organization_id = {tenant_expression})" in insert_policy
    assert "moviqo.authenticated_user_id" not in insert_policy

    assert '"organizations_membership_tenant_update"' in update_policy
    assert "FOR UPDATE" in update_policy
    assert f"USING (organization_id = {tenant_expression})" in update_policy
    assert f"WITH CHECK (organization_id = {tenant_expression})" in update_policy
    assert "moviqo.authenticated_user_id" not in update_policy

    assert '"organizations_membership_tenant_delete"' in delete_policy
    assert "FOR DELETE" in delete_policy
    assert f"USING (organization_id = {tenant_expression})" in delete_policy
    assert "moviqo.authenticated_user_id" not in delete_policy
    assert (
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "organizations_membership" '
        'TO "moviqo_runtime"'
    ) in normalized_sql


def test_repair_is_a_noop_outside_postgresql() -> None:
    schema_editor = FakeSchemaEditor("sqlite")

    membership_rls_repair_migration.apply_membership_bootstrap_policy(None, schema_editor)

    assert schema_editor.connection.statements == []
