from __future__ import annotations

import uuid

from django.db import models


class WorkflowDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="workflow_definitions",
    )
    name = models.CharField(max_length=120)
    normalized_name = models.CharField(max_length=120)
    draft_schema_version = models.PositiveIntegerField(default=1)
    created_by_membership_id = models.UUIDField()
    created_by_user_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_design_workflow_definition"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "normalized_name"),
                name="workflow_design_workflow_definition_name_unique",
            )
        ]


class WorkflowDraft(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="workflow_drafts",
    )
    workflow = models.OneToOneField(
        WorkflowDefinition,
        on_delete=models.PROTECT,
        related_name="draft",
    )
    document = models.JSONField(default=dict)
    revision = models.CharField(max_length=32, default="1")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_design_workflow_draft"
