from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import APIException

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.workflow_design.application.schema import (
    CURRENT_DRAFT_SCHEMA_VERSION,
    load_draft_document,
    new_workflow_draft_document,
)
from moviqo.modules.workflow_design.models import WorkflowDefinition, WorkflowDraft

MAX_WORKFLOW_NAME_LENGTH = 120
WORKFLOW_CREATE_COMMAND = "workflow-design.create"


class WorkflowNameValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Workflow name is invalid."
    default_code = "workflow_name_invalid"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


class WorkflowNameConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Workflow name is already in use."
    default_code = "workflow_name_conflict"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


@dataclass(frozen=True)
class WorkflowCatalogItem:
    workflow_id: str
    name: str
    revision: str
    schema_version: int
    updated_at: str


def create_workflow_definition(
    *,
    tenant_context: TenantContext,
    name: str,
    idempotency_key: str,
    request_hash: str,
) -> dict[str, Any]:
    safe_name = _validate_workflow_name(name)
    normalized_name = _normalize_workflow_name(safe_name)

    try:
        execution = execute_atomic_command(
            tenant_context=tenant_context,
            command_type=WORKFLOW_CREATE_COMMAND,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            handler=lambda command_context: _create_workflow_side_effects(
                tenant_context=tenant_context,
                command_context=command_context,
                name=safe_name,
                normalized_name=normalized_name,
            ),
        )
    except IntegrityError as exc:
        if WorkflowDefinition.objects.filter(
            organization_id=tenant_context.organization_id,
            normalized_name=normalized_name,
        ).exists():
            raise WorkflowNameConflictError(
                invalid_params=[
                    {
                        "name": "name",
                        "code": "duplicate",
                        "reason": "Use a different workflow name before continuing.",
                    }
                ]
            ) from exc
        raise

    return execution.result


def list_workflow_catalog(*, tenant_context: TenantContext) -> list[WorkflowCatalogItem]:
    return [
        WorkflowCatalogItem(
            workflow_id=str(definition.id),
            name=definition.name,
            revision=definition.draft.revision,
            schema_version=definition.draft_schema_version,
            updated_at=definition.updated_at.isoformat(),
        )
        for definition in WorkflowDefinition.objects.select_related("draft")
        .filter(organization_id=tenant_context.organization_id)
        .order_by("name")
    ]


def read_workflow_draft(*, tenant_context: TenantContext, workflow_id) -> dict[str, Any] | None:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    draft_document = load_draft_document(workflow.draft.document)
    return {
        "workflowId": str(workflow.id),
        "organizationId": str(workflow.organization_id),
        "createdByMembershipId": str(workflow.created_by_membership_id),
        "name": workflow.name,
        "revision": workflow.draft.revision,
        "draft": draft_document,
    }


def _create_workflow_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    name: str,
    normalized_name: str,
) -> dict[str, Any]:
    draft_id = str(uuid.uuid7())
    workflow = WorkflowDefinition.objects.create(
        organization_id=tenant_context.organization_id,
        name=name,
        normalized_name=normalized_name,
        draft_schema_version=CURRENT_DRAFT_SCHEMA_VERSION,
        created_by_membership_id=tenant_context.membership_id,
        created_by_user_id=tenant_context.user_id,
    )
    draft = WorkflowDraft.objects.create(
        organization_id=tenant_context.organization_id,
        workflow=workflow,
        document=new_workflow_draft_document(
            draft_id=draft_id,
            workflow_id=str(workflow.id),
            name=name,
        ),
        revision="1",
    )
    payload = {
        "workflowId": str(workflow.id),
        "organizationId": str(workflow.organization_id),
        "createdByMembershipId": str(workflow.created_by_membership_id),
        "name": workflow.name,
        "revision": draft.revision,
        "draft": load_draft_document(draft.document),
    }
    command_context.append_audit(
        event_type="workflow-design.workflow-created",
        payload={
            "workflowId": payload["workflowId"],
            "draftId": payload["draft"]["draftId"],
            "name": payload["name"],
            "revision": payload["revision"],
            "schemaVersion": payload["draft"]["schemaVersion"],
        },
    )
    return payload


def _validate_workflow_name(name: str) -> str:
    safe_name = " ".join(name.split())
    if not safe_name:
        raise WorkflowNameValidationError(
            invalid_params=[
                {
                    "name": "name",
                    "code": "required",
                    "reason": "Complete this field to continue.",
                }
            ]
        )
    if len(safe_name) > MAX_WORKFLOW_NAME_LENGTH:
        raise WorkflowNameValidationError(
            invalid_params=[
                {
                    "name": "name",
                    "code": "too_long",
                    "reason": "Use 120 characters or fewer for the workflow name.",
                }
            ]
        )
    return safe_name


def _normalize_workflow_name(name: str) -> str:
    return name.casefold()
