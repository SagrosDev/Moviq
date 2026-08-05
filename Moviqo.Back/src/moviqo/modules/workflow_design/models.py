from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
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


class WorkflowVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="workflow_versions",
    )
    workflow = models.ForeignKey(
        WorkflowDefinition,
        on_delete=models.PROTECT,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    source_draft_revision = models.CharField(max_length=32)
    snapshot_schema_version = models.PositiveIntegerField()
    snapshot = models.JSONField(default=dict)
    published_by_membership_id = models.UUIDField()
    published_by_user_id = models.BigIntegerField()
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workflow_design_workflow_version"
        constraints = [
            models.UniqueConstraint(
                fields=("workflow", "version_number"),
                name="workflow_design_workflow_version_number_unique",
            )
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError("Published workflow versions are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Published workflow versions are immutable.")
