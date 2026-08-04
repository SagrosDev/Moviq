from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0011_passwordrecoverytoken"),
    ]

    operations = [
        migrations.CreateModel(
            name="PasswordRecoveryThrottle",
            fields=[
                (
                    "key_digest",
                    models.CharField(max_length=64, primary_key=True, serialize=False),
                ),
                ("window_started_at", models.DateTimeField()),
                ("request_count", models.PositiveIntegerField(default=0)),
            ],
            options={"db_table": "organizations_password_recovery_throttle"},
        ),
    ]
