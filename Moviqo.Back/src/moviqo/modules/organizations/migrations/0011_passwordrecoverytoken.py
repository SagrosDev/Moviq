import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("organizations", "0010_grant_runtime_role_initial_registration_result")]

    operations = [
        migrations.CreateModel(
            name="PasswordRecoveryToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid7, editable=False, primary_key=True, serialize=False)),
                ("token_digest", models.CharField(max_length=64, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="password_recovery_tokens",
                        to="organizations.moviqouser",
                    ),
                ),
            ],
            options={
                "db_table": "organizations_password_recovery_token",
                "indexes": [
                    models.Index(fields=["user", "expires_at"], name="org_recovery_user_exp_idx"),
                    models.Index(fields=["token_digest", "expires_at"], name="org_recovery_digest_exp_idx"),
                ],
            },
        ),
    ]
