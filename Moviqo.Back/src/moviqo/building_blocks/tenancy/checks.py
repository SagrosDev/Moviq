from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.core.checks import Error, Tags, register
from django.core.exceptions import ImproperlyConfigured
from django.db import connection

TENANT_SETTING_NAME = "moviqo.current_organization_id"
AUTHENTICATED_USER_SETTING_NAME = "moviqo.authenticated_user_id"
REGISTRATION_VERIFICATION_SETTING_NAME = "moviqo.registration_verification_id"
OPERATOR_SCHEMA_NAME = "operator_history"


@dataclass(frozen=True)
class TenantTableRegistration:
    table_name: str
    policy_name: str


@dataclass(frozen=True)
class TenantIsolationGateRegistration:
    resource_name: str
    table_name: str
    policy_name: str
    isolation_test_id: str
    evidence_hint: str


PROTECTED_TENANT_RESOURCES = (
    TenantIsolationGateRegistration(
        resource_name="organization",
        table_name="organizations_organization",
        policy_name="organizations_organization_tenant_isolation",
        isolation_test_id="organization",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[organization]",
    ),
    TenantIsolationGateRegistration(
        resource_name="membership",
        table_name="organizations_membership",
        policy_name="organizations_membership_tenant_isolation",
        isolation_test_id="membership",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[membership]",
    ),
    TenantIsolationGateRegistration(
        resource_name="registration-consent",
        table_name="organizations_registration_consent",
        policy_name="organizations_registration_consent_tenant_isolation",
        isolation_test_id="registration_consent",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[registration-consent]",
    ),
    TenantIsolationGateRegistration(
        resource_name="registration-verification",
        table_name="organizations_registration_verification",
        policy_name="organizations_registration_verification_tenant_isolation",
        isolation_test_id="registration_verification",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[registration-verification]",
    ),
    TenantIsolationGateRegistration(
        resource_name="command-result",
        table_name="governance_command_result",
        policy_name="governance_command_result_tenant_isolation",
        isolation_test_id="command_result",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[command-result]",
    ),
    TenantIsolationGateRegistration(
        resource_name="transactional-audit-record",
        table_name="governance_transactional_audit_record",
        policy_name="governance_transactional_audit_record_tenant_isolation",
        isolation_test_id="transactional_audit_record",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[transactional-audit-record]",
    ),
    TenantIsolationGateRegistration(
        resource_name="outbox-message",
        table_name="messaging_outbox_message",
        policy_name="messaging_outbox_message_tenant_isolation",
        isolation_test_id="outbox_message",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[outbox-message]",
    ),
    TenantIsolationGateRegistration(
        resource_name="atomic-command-probe",
        table_name="workflow_runtime_atomic_command_probe",
        policy_name="workflow_runtime_atomic_command_probe_tenant_isolation",
        isolation_test_id="atomic_command_probe",
        evidence_hint="tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation[atomic-command-probe]",
    ),
)

PROTECTED_TENANT_TABLES = tuple(
    TenantTableRegistration(
        table_name=registration.table_name,
        policy_name=registration.policy_name,
    )
    for registration in PROTECTED_TENANT_RESOURCES
)


def runtime_role_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_ROLE


def runtime_member_name() -> str:
    return settings.MOVIQO_DB_RUNTIME_MEMBER


@register(Tags.database, Tags.security, deploy=True)
def tenant_rls_configuration_check(*_args, **_kwargs) -> list[Error]:
    if connection.vendor != "postgresql":
        return []

    errors: list[Error] = []
    runtime_role = runtime_role_name()
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM pg_roles
                WHERE rolname = %s
                  AND rolbypassrls = FALSE
            )
            """,
            [runtime_role],
        )
        runtime_role_ok = cursor.fetchone()[0]
        if not runtime_role_ok:
            errors.append(
                Error(
                    f"Runtime role {runtime_role} is missing or can bypass RLS.",
                    id="moviqo.E201",
                )
            )

        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.schemata
                WHERE schema_name = %s
            )
            """,
            [OPERATOR_SCHEMA_NAME],
        )
        if not cursor.fetchone()[0]:
            errors.append(
                Error(
                    f"Operator-only schema {OPERATOR_SCHEMA_NAME} is missing.",
                    id="moviqo.E202",
                )
            )

        for registration in PROTECTED_TENANT_TABLES:
            cursor.execute(
                """
                SELECT c.relrowsecurity, c.relforcerowsecurity, p.policyname IS NOT NULL, r.rolname
                FROM pg_class AS c
                JOIN pg_namespace AS n ON n.oid = c.relnamespace
                JOIN pg_roles AS r ON r.oid = c.relowner
                LEFT JOIN pg_policies AS p
                  ON p.schemaname = n.nspname
                 AND p.tablename = c.relname
                 AND p.policyname = %s
                WHERE n.nspname = 'public'
                  AND c.relname = %s
                """,
                [registration.policy_name, registration.table_name],
            )
            row = cursor.fetchone()
            if row is None:
                errors.append(
                    Error(
                        f"Protected tenant table {registration.table_name} is missing.",
                        id="moviqo.E203",
                    )
                )
                continue

            row_security_enabled, force_row_security, policy_exists, owner_name = row
            if not row_security_enabled or not force_row_security:
                errors.append(
                    Error(
                        (
                            "Protected tenant table "
                            f"{registration.table_name} is missing enforced RLS."
                        ),
                        id="moviqo.E204",
                    )
                )
            if not policy_exists:
                errors.append(
                    Error(
                        (
                            "Protected tenant table "
                            f"{registration.table_name} is missing policy "
                            f"{registration.policy_name}."
                        ),
                        id="moviqo.E205",
                    )
                )
            if owner_name == runtime_role:
                errors.append(
                    Error(
                        (
                            "Protected tenant table "
                            f"{registration.table_name} is owned by the runtime role."
                        ),
                        id="moviqo.E206",
                    )
                )

    return errors


def validate_tenant_startup_configuration() -> None:
    if connection.vendor != "postgresql":
        return

    errors = tenant_rls_configuration_check()
    runtime_role = runtime_role_name()

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT current_user = %s
                OR pg_has_role(current_user, %s, 'MEMBER')
            """,
            [runtime_role, runtime_role],
        )
        runtime_role_available = cursor.fetchone()[0]

    if runtime_role_available and not errors:
        return

    messages = [error.msg for error in errors]
    if not runtime_role_available:
        messages.append(
            f"Current database user cannot activate runtime role {runtime_role}."
        )
    raise ImproperlyConfigured("Unsafe tenant runtime configuration: " + " ".join(messages))
