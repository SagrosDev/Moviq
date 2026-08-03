from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

from moviqo.modules.organizations.models import MembershipRole, new_uuid7
from moviqo.modules.organizations.tenant_policy_helpers import (
    immutable_organization_trigger_sql,
    runtime_role_setup_sql,
    tenant_policy_sql,
)


def apply_postgresql_tenant_infrastructure(_apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    statements = (
        runtime_role_setup_sql(),
        tenant_policy_sql(
            table_name="organizations_organization",
            tenant_column_sql="id",
            policy_name="organizations_organization_tenant_isolation",
        ),
        tenant_policy_sql(
            table_name="organizations_membership",
            tenant_column_sql="organization_id",
            policy_name="organizations_membership_tenant_isolation",
        ),
        immutable_organization_trigger_sql("organizations_membership"),
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
                ("id", models.UUIDField(default=new_uuid7, editable=False, primary_key=True, serialize=False)),
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
                ("id", models.UUIDField(default=new_uuid7, editable=False, primary_key=True, serialize=False)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            (MembershipRole.OWNER, "Owner"),
                            (MembershipRole.ADMINISTRATOR, "Administrator"),
                            (MembershipRole.DESIGNER, "Designer"),
                            (MembershipRole.MEMBER, "Member"),
                        ],
                        default=MembershipRole.MEMBER,
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
