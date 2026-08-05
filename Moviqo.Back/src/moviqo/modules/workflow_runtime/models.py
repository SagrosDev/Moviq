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


class TaskOccurrence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="task_occurrences",
    )
    workflow = models.ForeignKey(
        "workflow_design.WorkflowDefinition",
        on_delete=models.PROTECT,
        related_name="task_occurrences",
    )
    workflow_version = models.ForeignKey(
        "workflow_design.WorkflowVersion",
        on_delete=models.PROTECT,
        related_name="task_occurrences",
        null=True,
        blank=True,
    )
    process = models.ForeignKey(
        "workflow_runtime.ProcessInstance",
        on_delete=models.PROTECT,
        related_name="tasks",
        null=True,
        blank=True,
    )
    task_element_id = models.CharField(max_length=64)
    assignee_membership_id = models.UUIDField()
    assignee_user_id = models.BigIntegerField()
    activated_by_membership_id = models.UUIDField(null=True, blank=True)
    activated_by_user_id = models.BigIntegerField(null=True, blank=True)
    status = models.CharField(max_length=32, default="assigned")
    definition_revision = models.CharField(max_length=32, default="1")
    revision = models.CharField(max_length=32, default="1")
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_runtime_task_occurrence"


class ProcessInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="process_instances",
    )
    workflow = models.ForeignKey(
        "workflow_design.WorkflowDefinition",
        on_delete=models.PROTECT,
        related_name="process_instances",
    )
    workflow_version = models.ForeignKey(
        "workflow_design.WorkflowVersion",
        on_delete=models.PROTECT,
        related_name="process_instances",
    )
    initiator_membership_id = models.UUIDField()
    initiator_user_id = models.BigIntegerField()
    status = models.CharField(max_length=32, default="active")
    completed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_runtime_process_instance"


class TaskProcessFieldValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="task_process_field_values",
    )
    task = models.ForeignKey(
        TaskOccurrence,
        on_delete=models.PROTECT,
        related_name="process_field_values",
    )
    field_id = models.CharField(max_length=64)
    value_text = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_runtime_task_process_field_value"
        constraints = [
            models.UniqueConstraint(
                fields=("task", "field_id"),
                name="workflow_runtime_task_process_field_value_unique",
            )
        ]
