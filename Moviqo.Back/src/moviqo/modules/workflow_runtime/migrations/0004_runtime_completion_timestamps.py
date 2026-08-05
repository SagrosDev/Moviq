from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workflow_runtime", "0003_process_start_runtime"),
    ]

    operations = [
        migrations.AddField(
            model_name="processinstance",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskoccurrence",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
