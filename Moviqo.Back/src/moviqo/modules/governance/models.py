from __future__ import annotations

import uuid

from django.db import models


class CommandResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="command_results",
    )
    command_type = models.CharField(max_length=120)
    idempotency_key = models.CharField(max_length=120)
    request_hash = models.CharField(max_length=128)
    result_payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "governance_command_result"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "command_type", "idempotency_key"),
                name="governance_command_result_idempotency_unique",
            )
        ]


class TransactionalAuditRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="transactional_audit_records",
    )
    command_type = models.CharField(max_length=120)
    event_type = models.CharField(max_length=120)
    actor_membership_id = models.UUIDField(null=True, blank=True)
    actor_user_id = models.BigIntegerField(null=True, blank=True)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "governance_transactional_audit_record"
