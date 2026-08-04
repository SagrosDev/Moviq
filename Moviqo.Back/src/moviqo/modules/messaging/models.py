from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class OutboxMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="outbox_messages",
    )
    message_type = models.CharField(max_length=120)
    payload = models.JSONField(default=dict)
    lease_owner = models.CharField(max_length=120, null=True, blank=True)
    lease_expires_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(default=timezone.now)
    delivered_at = models.DateTimeField(null=True, blank=True)
    dead_lettered_at = models.DateTimeField(null=True, blank=True)
    dead_letter_reason = models.CharField(max_length=200, blank=True, default="")
    last_error = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messaging_outbox_message"
        indexes = [
            models.Index(
                fields=("next_attempt_at", "dead_lettered_at", "delivered_at"),
                name="msg_outbox_claim_idx",
            )
        ]
