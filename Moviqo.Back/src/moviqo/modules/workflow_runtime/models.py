from __future__ import annotations

import uuid

from django.db import models


class AtomicCommandProbe(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="atomic_command_probes",
    )
    reference = models.CharField(max_length=120)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workflow_runtime_atomic_command_probe"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "reference"),
                name="workflow_runtime_atomic_command_probe_reference_unique",
            )
        ]
