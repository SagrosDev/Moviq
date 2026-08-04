# Generated for Moviqo Story 1.9.

from __future__ import annotations

from django.db import migrations

from moviqo.modules.organizations.user_managers import MoviqoUserManager


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0005_enforce_single_organization_identity"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="moviqouser",
            managers=[
                ("objects", MoviqoUserManager()),
            ],
        ),
    ]
