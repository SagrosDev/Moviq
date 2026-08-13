from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from django.db import IntegrityError
from django.db.models import Max
from rest_framework import status
from rest_framework.exceptions import APIException

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.application import workflow_design_directory
from moviqo.modules.workflow_design.application.form_authoring_leases import (
    FORM_AUTHORING_LEASE_LOST_CODE,
    enforce_form_authoring_lease,
)
from moviqo.modules.workflow_design.application.publication_configuration import (
    validate_publication_configuration,
)
from moviqo.modules.workflow_design.application.publication_validation import (
    validate_workflow_for_publication,
)
from moviqo.modules.workflow_design.application.schema import (
    ASSIGNMENT_DRAFT_SCHEMA_VERSION,
    CURRENT_DRAFT_SCHEMA_VERSION,
    WorkflowDraftSchemaError,
    WorkflowDraftValidationError,
    dump_current_draft,
    load_draft_document,
    new_workflow_draft_document,
    validate_workflow_draft_integrity,
)
from moviqo.modules.workflow_design.models import (
    WorkflowDefinition,
    WorkflowDraft,
    WorkflowVersion,
)

MAX_WORKFLOW_NAME_LENGTH = 120
WORKFLOW_CREATE_COMMAND = "workflow-design.create"
WORKFLOW_SAVE_COMMAND = "workflow-design.save-draft"
FORM_DRAFT_SAVE_COMMAND = "workflow-design.save-form-draft"
WORKFLOW_VALIDATE_COMMAND = "workflow-design.validate-publication"
WORKFLOW_PUBLISH_COMMAND = "workflow-design.publish"
SAVE_OUTCOME_ACCEPTED = "accepted"
SAVE_OUTCOME_REJECTED = "rejected"


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


class WorkflowDraftValidationAPIError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Workflow draft is invalid."
    default_code = "workflow_draft_invalid"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


class WorkflowDraftRevisionConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Workflow draft revision does not match the latest server state."
    default_code = "workflow_draft_revision_conflict"

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


class FormAuthoringLeaseLostAPIError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Form authoring authority was lost."
    default_code = FORM_AUTHORING_LEASE_LOST_CODE

    def __init__(self, *, invalid_params: list[dict[str, str]]) -> None:
        super().__init__(detail=self.default_detail, code=self.default_code)
        self.invalid_params = invalid_params


@dataclass(frozen=True)
class WorkflowPublicationIssue:
    code: str
    severity: str
    target: str
    element_id: str | None
    field_id: str | None
    binding_id: str | None
    message: str
    action_label: str


@dataclass(frozen=True)
class WorkflowCatalogItem:
    workflow_id: str
    name: str
    revision: str
    schema_version: int
    updated_at: str


@dataclass(frozen=True)
class WorkflowPublishedVersionSummary:
    version_number: int
    published_at: str
    source_revision: str
    schema_version: int


@dataclass(frozen=True)
class PublishedWorkflowVersionRecord:
    version_id: str
    workflow_id: str
    workflow_name: str
    version_number: int
    source_draft_revision: str
    snapshot: dict[str, Any]


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
        "configurationDirectory": _serialize_workflow_design_directory(
            tenant_context=tenant_context
        ),
        "name": workflow.name,
        "revision": workflow.draft.revision,
        "draft": draft_document,
    }


def read_workflow_draft_snapshot(
    *,
    tenant_context: TenantContext,
    workflow_id,
) -> tuple[str, dict[str, Any]] | None:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    return workflow.draft.revision, load_draft_document(workflow.draft.document)


def list_latest_published_workflow_versions(
    *,
    tenant_context: TenantContext,
) -> list[PublishedWorkflowVersionRecord]:
    versions = list(
        WorkflowVersion.objects.select_related("workflow")
        .filter(
            organization_id=tenant_context.organization_id,
            workflow__organization_id=tenant_context.organization_id,
        )
        .order_by("workflow_id", "-version_number")
    )
    latest_by_workflow: dict[str, WorkflowVersion] = {}
    for version in versions:
        workflow_key = str(version.workflow_id)
        latest_by_workflow.setdefault(workflow_key, version)
    return [_published_workflow_version_record(version) for version in latest_by_workflow.values()]


def read_latest_published_workflow_version(
    *,
    tenant_context: TenantContext,
    workflow_id,
) -> PublishedWorkflowVersionRecord | None:
    version = (
        WorkflowVersion.objects.select_related("workflow")
        .filter(
            organization_id=tenant_context.organization_id,
            workflow_id=workflow_id,
            workflow__organization_id=tenant_context.organization_id,
        )
        .order_by("-version_number")
        .first()
    )
    return _published_workflow_version_record(version)


def read_published_workflow_version(
    *,
    organization_id,
    workflow_id,
    workflow_version_id,
) -> PublishedWorkflowVersionRecord | None:
    version = (
        WorkflowVersion.objects.select_related("workflow")
        .filter(
            id=workflow_version_id,
            organization_id=organization_id,
            workflow_id=workflow_id,
            workflow__organization_id=organization_id,
        )
        .first()
    )
    return _published_workflow_version_record(version)


def save_workflow_draft(
    *,
    tenant_context: TenantContext,
    workflow_id,
    expected_revision: str,
    idempotency_key: str,
    request_hash: str,
    draft: dict[str, Any] | None = None,
) -> dict[str, Any]:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=WORKFLOW_SAVE_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _save_workflow_draft_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            workflow_id=workflow_id,
            expected_revision=expected_revision,
            draft=draft,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == SAVE_OUTCOME_ACCEPTED:
        return outcome["payload"]

    error = outcome["error"]
    if error["code"] == WorkflowDraftRevisionConflictError.default_code:
        raise WorkflowDraftRevisionConflictError(invalid_params=error["invalidParams"])

    raise WorkflowDraftValidationAPIError(invalid_params=error["invalidParams"])


def save_form_workflow_draft(
    *,
    tenant_context: TenantContext,
    workflow_id,
    task_element_id: str,
    session_key: str,
    lease_token: uuid.UUID,
    expected_revision: str,
    idempotency_key: str,
    request_hash: str,
    draft: dict[str, Any],
) -> dict[str, Any] | None:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=FORM_DRAFT_SAVE_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _save_workflow_draft_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            workflow_id=workflow_id,
            expected_revision=expected_revision,
            draft=draft,
            form_task_element_id=task_element_id,
            form_session_key=session_key,
            form_lease_token=lease_token,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == SAVE_OUTCOME_ACCEPTED:
        return outcome["payload"]
    error = outcome["error"]
    if error["code"] == FORM_AUTHORING_LEASE_LOST_CODE:
        raise FormAuthoringLeaseLostAPIError(invalid_params=error["invalidParams"])
    if error["code"] == WorkflowDraftRevisionConflictError.default_code:
        raise WorkflowDraftRevisionConflictError(invalid_params=error["invalidParams"])
    raise WorkflowDraftValidationAPIError(invalid_params=error["invalidParams"])


def validate_workflow_publication(
    *,
    tenant_context: TenantContext,
    workflow_id,
    expected_revision: str,
    idempotency_key: str,
    request_hash: str,
) -> dict[str, Any] | None:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=WORKFLOW_VALIDATE_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _validate_workflow_publication_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            workflow_id=workflow_id,
            expected_revision=expected_revision,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == SAVE_OUTCOME_ACCEPTED:
        return outcome["payload"]

    error = outcome["error"]
    if error["code"] == WorkflowDraftRevisionConflictError.default_code:
        raise WorkflowDraftRevisionConflictError(invalid_params=error["invalidParams"])

    raise WorkflowDraftValidationAPIError(invalid_params=error["invalidParams"])


def publish_workflow_version(
    *,
    tenant_context: TenantContext,
    workflow_id,
    expected_revision: str,
    idempotency_key: str,
    request_hash: str,
    draft: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    workflow = (
        WorkflowDefinition.objects.select_related("draft")
        .filter(id=workflow_id, organization_id=tenant_context.organization_id)
        .first()
    )
    if workflow is None:
        return None

    execution = execute_atomic_command(
        tenant_context=tenant_context,
        command_type=WORKFLOW_PUBLISH_COMMAND,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        handler=lambda command_context: _publish_workflow_version_side_effects(
            tenant_context=tenant_context,
            command_context=command_context,
            workflow_id=workflow_id,
            expected_revision=expected_revision,
            draft=draft,
        ),
    )

    outcome = execution.result
    if outcome["outcome"] == SAVE_OUTCOME_ACCEPTED:
        return outcome["payload"]

    error = outcome["error"]
    if error["code"] == WorkflowDraftRevisionConflictError.default_code:
        raise WorkflowDraftRevisionConflictError(invalid_params=error["invalidParams"])

    raise WorkflowDraftValidationAPIError(invalid_params=error["invalidParams"])


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
        "configurationDirectory": _serialize_workflow_design_directory(
            tenant_context=tenant_context
        ),
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


def _save_workflow_draft_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    workflow_id,
    expected_revision: str,
    draft: dict[str, Any],
    form_task_element_id: str | None = None,
    form_session_key: str | None = None,
    form_lease_token: uuid.UUID | None = None,
) -> dict[str, Any]:
    workflow_draft = (
        WorkflowDraft.objects.select_related("workflow")
        .select_for_update()
        .get(workflow_id=workflow_id, organization_id=tenant_context.organization_id)
    )
    workflow = workflow_draft.workflow

    if form_task_element_id is not None and (
        form_session_key is None
        or form_lease_token is None
        or not enforce_form_authoring_lease(
            tenant_context=tenant_context,
            workflow_id=workflow_id,
            task_element_id=form_task_element_id,
            session_key=form_session_key,
            lease_token=form_lease_token,
        )
    ):
        return _rejected_save_outcome(
            code=FORM_AUTHORING_LEASE_LOST_CODE,
            invalid_params=[
                {
                    "name": "leaseToken",
                    "code": "lost",
                    "reason": "Acquire Form editing access before saving again.",
                }
            ],
        )

    if workflow_draft.revision != expected_revision:
        return _rejected_save_outcome(
            code=WorkflowDraftRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "expectedRevision",
                    "code": "stale",
                    "reason": "Reload the last saved draft before saving again.",
                }
            ],
        )

    previous_document = load_draft_document(workflow_draft.document)
    candidate_document = {
        "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
        "draftId": previous_document["draftId"],
        "workflowId": str(workflow.id),
        "name": workflow.name,
        "status": previous_document["status"],
        "elements": _merge_elements(
            previous_document=previous_document,
            draft=draft,
        ),
        "connections": draft.get("connections", previous_document["connections"]),
        "processFields": _merge_process_fields(
            previous_document=previous_document,
            draft=draft,
        ),
        "formBindings": _merge_form_bindings(
            previous_document=previous_document,
            draft=draft,
        ),
        "publication": _merge_publication(
            previous_document=previous_document,
            draft=draft,
        ),
        "layout": draft.get("layout", previous_document["layout"]),
    }
    try:
        validated_document = validate_workflow_draft_integrity(candidate_document)
        if form_task_element_id is not None:
            scope_issues = _form_draft_scope_issues(
                previous_document=previous_document,
                candidate_document=validated_document,
                task_element_id=form_task_element_id,
            )
            if scope_issues:
                raise WorkflowDraftValidationError(scope_issues)
        previous_start_ids = {
            element["id"]
            for element in previous_document["elements"]
            if element["type"] == "start"
        }
        candidate_start_ids = {
            element["id"]
            for element in validated_document["elements"]
            if element["type"] == "start"
        }
        if previous_start_ids and not previous_start_ids.issubset(candidate_start_ids):
            raise WorkflowDraftValidationError(
                [
                    {
                        "field": "elements",
                        "code": "start_required",
                        "reason": "The existing Start element cannot be removed.",
                    }
                ]
            )
    except WorkflowDraftValidationError as exc:
        command_context.append_audit(
            event_type="workflow-design.draft-edit-rejected",
            payload={
                "workflowId": str(workflow.id),
                "draftId": previous_document["draftId"],
                "expectedRevision": expected_revision,
                "issues": exc.issues,
            },
        )
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=_build_graph_invalid_params(exc.issues),
        )
    except WorkflowDraftSchemaError as exc:
        issues = [
            {
                "field": "draft",
                "code": "invalid",
                "reason": str(exc),
            }
        ]
        command_context.append_audit(
            event_type="workflow-design.draft-edit-rejected",
            payload={
                "workflowId": str(workflow.id),
                "draftId": previous_document["draftId"],
                "expectedRevision": expected_revision,
                "issues": issues,
            },
        )
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=_build_graph_invalid_params(issues),
        )

    next_revision = str(int(workflow_draft.revision) + 1)
    workflow_draft.document = validated_document
    workflow_draft.revision = next_revision
    workflow_draft.save(update_fields=["document", "revision", "updated_at"])
    workflow.draft_schema_version = CURRENT_DRAFT_SCHEMA_VERSION
    workflow.save(update_fields=["draft_schema_version", "updated_at"])

    for event_type, payload in _collect_graph_audit_events(
        previous_document=previous_document,
        current_document=validated_document,
        workflow_id=str(workflow.id),
        draft_id=validated_document["draftId"],
        previous_revision=expected_revision,
        next_revision=next_revision,
    ):
        command_context.append_audit(event_type=event_type, payload=payload)

    return {
        "outcome": SAVE_OUTCOME_ACCEPTED,
        "payload": {
            "workflowId": str(workflow.id),
            "organizationId": str(workflow.organization_id),
            "createdByMembershipId": str(workflow.created_by_membership_id),
            "configurationDirectory": _serialize_workflow_design_directory(
                tenant_context=tenant_context
            ),
            "name": workflow.name,
            "revision": next_revision,
            "draft": validated_document,
        },
    }


def _validate_workflow_publication_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    workflow_id,
    expected_revision: str,
) -> dict[str, Any]:
    workflow_draft = (
        WorkflowDraft.objects.select_related("workflow")
        .select_for_update()
        .get(workflow_id=workflow_id, organization_id=tenant_context.organization_id)
    )
    workflow = workflow_draft.workflow

    if workflow_draft.revision != expected_revision:
        return _rejected_save_outcome(
            code=WorkflowDraftRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "expectedRevision",
                    "code": "stale",
                    "reason": "Reload the last saved draft before validating again.",
                }
            ],
        )

    authoritative_document = load_draft_document(workflow_draft.document)
    try:
        normalized_document = validate_workflow_draft_integrity(authoritative_document)
    except WorkflowDraftValidationError as exc:
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=_build_graph_invalid_params(exc.issues),
        )
    except WorkflowDraftSchemaError as exc:
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=[
                {
                    "name": "draft",
                    "code": "invalid",
                    "reason": str(exc),
                }
            ],
        )

    publication_issues = validate_publication_configuration(
        tenant_context=tenant_context,
        document=normalized_document,
    )
    validation = validate_workflow_for_publication(
        normalized_document,
        publication_configuration_issues=publication_issues,
    )
    payload = {
        "workflowId": str(workflow.id),
        "revision": workflow_draft.revision,
        "publishable": validation["publishable"],
        "issues": validation["issues"],
    }
    command_context.append_audit(
        event_type="workflow-design.publication-validation-ran",
        payload={
            "workflowId": str(workflow.id),
            "draftId": normalized_document["draftId"],
            "revision": workflow_draft.revision,
            "publishable": validation["publishable"],
            "issueCount": len(validation["issues"]),
            "issueCodes": [issue["code"] for issue in validation["issues"]],
        },
    )
    return {
        "outcome": SAVE_OUTCOME_ACCEPTED,
        "payload": payload,
    }


def _publish_workflow_version_side_effects(
    *,
    tenant_context: TenantContext,
    command_context,
    workflow_id,
    expected_revision: str,
    draft: dict[str, Any] | None,
) -> dict[str, Any]:
    workflow_draft = (
        WorkflowDraft.objects.select_related("workflow")
        .select_for_update()
        .get(workflow_id=workflow_id, organization_id=tenant_context.organization_id)
    )
    workflow = workflow_draft.workflow
    authoritative_draft = load_draft_document(workflow_draft.document)

    if workflow_draft.revision != expected_revision:
        _append_publication_rejection_audit(
            command_context=command_context,
            workflow_id=str(workflow.id),
            draft_id=authoritative_draft["draftId"],
            revision=workflow_draft.revision,
            invalid_params=[
                {
                    "name": "expectedRevision",
                    "code": "stale",
                    "reason": "Reload the last saved draft before publishing.",
                }
            ],
        )
        return _rejected_save_outcome(
            code=WorkflowDraftRevisionConflictError.default_code,
            invalid_params=[
                {
                    "name": "expectedRevision",
                    "code": "stale",
                    "reason": "Reload the last saved draft before publishing.",
                }
            ],
        )

    try:
        normalized_document = _normalize_candidate_document(
            workflow=workflow,
            previous_document=authoritative_draft,
            draft=draft or authoritative_draft,
        )
        previous_start_ids = {
            element["id"]
            for element in authoritative_draft["elements"]
            if element["type"] == "start"
        }
        candidate_start_ids = {
            element["id"]
            for element in normalized_document["elements"]
            if element["type"] == "start"
        }
        if previous_start_ids and not previous_start_ids.issubset(candidate_start_ids):
            raise WorkflowDraftValidationError(
                [
                    {
                        "field": "elements",
                        "code": "start_required",
                        "reason": "The existing Start element cannot be removed.",
                    }
                ]
            )
    except WorkflowDraftValidationError as exc:
        invalid_params = _build_graph_invalid_params(exc.issues)
        _append_publication_rejection_audit(
            command_context=command_context,
            workflow_id=str(workflow.id),
            draft_id=authoritative_draft["draftId"],
            revision=workflow_draft.revision,
            invalid_params=invalid_params,
        )
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=invalid_params,
        )
    except WorkflowDraftSchemaError as exc:
        invalid_params = [
            {
                "name": "draft",
                "code": "invalid",
                "reason": str(exc),
            }
        ]
        _append_publication_rejection_audit(
            command_context=command_context,
            workflow_id=str(workflow.id),
            draft_id=authoritative_draft["draftId"],
            revision=workflow_draft.revision,
            invalid_params=invalid_params,
        )
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=invalid_params,
        )

    publication_issues = validate_publication_configuration(
        tenant_context=tenant_context,
        document=normalized_document,
    )
    validation = validate_workflow_for_publication(
        normalized_document,
        publication_configuration_issues=publication_issues,
    )
    if not validation["publishable"]:
        invalid_params = _build_publication_invalid_params(validation["issues"])
        _append_publication_rejection_audit(
            command_context=command_context,
            workflow_id=str(workflow.id),
            draft_id=normalized_document["draftId"],
            revision=workflow_draft.revision,
            invalid_params=invalid_params,
        )
        return _rejected_save_outcome(
            code=WorkflowDraftValidationAPIError.default_code,
            invalid_params=invalid_params,
        )

    source_revision = workflow_draft.revision
    if normalized_document != authoritative_draft:
        source_revision = str(int(workflow_draft.revision) + 1)
        workflow_draft.document = normalized_document
        workflow_draft.revision = source_revision
        workflow_draft.save(update_fields=["document", "revision", "updated_at"])
        workflow.draft_schema_version = CURRENT_DRAFT_SCHEMA_VERSION
        workflow.save(update_fields=["draft_schema_version", "updated_at"])
        for event_type, payload in _collect_graph_audit_events(
            previous_document=authoritative_draft,
            current_document=normalized_document,
            workflow_id=str(workflow.id),
            draft_id=normalized_document["draftId"],
            previous_revision=expected_revision,
            next_revision=source_revision,
        ):
            command_context.append_audit(event_type=event_type, payload=payload)

    latest_version_number = (
        WorkflowVersion.objects.filter(
            workflow_id=workflow_id,
            organization_id=tenant_context.organization_id,
        ).aggregate(max_version=Max("version_number"))["max_version"]
        or 0
    )
    next_version_number = latest_version_number + 1
    published_version = WorkflowVersion.objects.create(
        organization_id=tenant_context.organization_id,
        workflow=workflow,
        version_number=next_version_number,
        source_draft_revision=source_revision,
        snapshot_schema_version=CURRENT_DRAFT_SCHEMA_VERSION,
        snapshot=dump_current_draft(normalized_document),
        published_by_membership_id=tenant_context.membership_id,
        published_by_user_id=tenant_context.user_id,
    )
    command_context.append_audit(
        event_type="workflow-design.workflow-published",
        payload={
            "workflowId": str(workflow.id),
            "draftId": normalized_document["draftId"],
            "versionNumber": published_version.version_number,
            "sourceDraftRevision": source_revision,
            "schemaVersion": published_version.snapshot_schema_version,
            "publishable": True,
        },
    )
    command_context.enqueue_outbox(
        message_type="workflow-design.workflow-version-published",
        payload={
            "workflowId": str(workflow.id),
            "workflowVersionId": str(published_version.id),
            "versionNumber": published_version.version_number,
            "sourceDraftRevision": source_revision,
        },
    )
    return {
        "outcome": SAVE_OUTCOME_ACCEPTED,
        "payload": _build_workflow_payload(
            tenant_context=tenant_context,
            workflow=workflow,
            revision=source_revision,
            draft=normalized_document,
            published_version=published_version,
        ),
    }


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


def _normalize_candidate_document(
    *,
    workflow: WorkflowDefinition,
    previous_document: dict[str, Any],
    draft: dict[str, Any],
) -> dict[str, Any]:
    candidate_document = {
        "schemaVersion": CURRENT_DRAFT_SCHEMA_VERSION,
        "draftId": previous_document["draftId"],
        "workflowId": str(workflow.id),
        "name": workflow.name,
        "status": previous_document["status"],
        "elements": _merge_elements(
            previous_document=previous_document,
            draft=draft,
        ),
        "connections": draft.get("connections", previous_document["connections"]),
        "processFields": _merge_process_fields(
            previous_document=previous_document,
            draft=draft,
        ),
        "formBindings": _merge_form_bindings(
            previous_document=previous_document,
            draft=draft,
        ),
        "publication": _merge_publication(
            previous_document=previous_document,
            draft=draft,
        ),
        "layout": draft.get("layout", previous_document["layout"]),
    }
    return validate_workflow_draft_integrity(candidate_document)


def _published_workflow_version_record(
    version: WorkflowVersion | None,
) -> PublishedWorkflowVersionRecord | None:
    if version is None:
        return None
    return PublishedWorkflowVersionRecord(
        version_id=str(version.id),
        workflow_id=str(version.workflow_id),
        workflow_name=version.workflow.name,
        version_number=version.version_number,
        source_draft_revision=version.source_draft_revision,
        snapshot=version.snapshot,
    )


def _build_workflow_payload(
    *,
    tenant_context: TenantContext,
    workflow: WorkflowDefinition,
    revision: str,
    draft: dict[str, Any],
    published_version: WorkflowVersion | None = None,
) -> dict[str, Any]:
    payload = {
        "workflowId": str(workflow.id),
        "organizationId": str(workflow.organization_id),
        "createdByMembershipId": str(workflow.created_by_membership_id),
        "configurationDirectory": _serialize_workflow_design_directory(
            tenant_context=tenant_context
        ),
        "name": workflow.name,
        "revision": revision,
        "draft": draft,
    }
    if published_version is not None:
        payload["publishedVersion"] = {
            "versionNumber": published_version.version_number,
            "publishedAt": published_version.published_at.isoformat(),
            "sourceRevision": published_version.source_draft_revision,
            "schemaVersion": published_version.snapshot_schema_version,
        }
    return payload


def _build_graph_invalid_params(issues: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "name": issue.get("field", "draft"),
            "code": issue.get("code", "invalid"),
            "reason": issue.get("reason", "Correct the workflow draft and try again."),
        }
        for issue in issues
    ]


def _build_publication_invalid_params(
    issues: list[dict[str, Any]],
) -> list[dict[str, str]]:
    return [
        {
            "name": _publication_issue_param_name(issue),
            "code": issue.get("code", "invalid"),
            "reason": issue.get(
                "message", "Correct the workflow draft and try again."
            ),
        }
        for issue in issues
    ]


def _publication_issue_param_name(issue: dict[str, Any]) -> str:
    identifiers = [
        ("elements", issue.get("elementId")),
        ("processFields", issue.get("fieldId")),
        ("formBindings", issue.get("bindingId")),
    ]
    path = [
        segment
        for collection, identifier in identifiers
        if identifier
        for segment in (collection, str(identifier))
    ]
    return ".".join(path) if path else issue.get("target", "draft")


def _rejected_save_outcome(
    *,
    code: str,
    invalid_params: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "outcome": SAVE_OUTCOME_REJECTED,
        "error": {
            "code": code,
            "invalidParams": invalid_params,
        },
    }


def _append_publication_rejection_audit(
    *,
    command_context,
    workflow_id: str,
    draft_id: str,
    revision: str,
    invalid_params: list[dict[str, str]],
) -> None:
    command_context.append_audit(
        event_type="workflow-design.publication-rejected",
        payload={
            "workflowId": workflow_id,
            "draftId": draft_id,
            "revision": revision,
            "issueCount": len(invalid_params),
            "issueCodes": [issue["code"] for issue in invalid_params],
            "issues": invalid_params,
        },
    )


def _collect_graph_audit_events(
    *,
    previous_document: dict[str, Any],
    current_document: dict[str, Any],
    workflow_id: str,
    draft_id: str,
    previous_revision: str,
    next_revision: str,
) -> list[tuple[str, dict[str, Any]]]:
    events: list[tuple[str, dict[str, Any]]] = []

    previous_elements = {element["id"]: element for element in previous_document["elements"]}
    current_elements = {element["id"]: element for element in current_document["elements"]}
    previous_connections = {
        connection["id"]: connection for connection in previous_document["connections"]
    }
    current_connections = {
        connection["id"]: connection for connection in current_document["connections"]
    }
    previous_fields = {
        field["id"]: field for field in previous_document["processFields"]
    }
    current_fields = {field["id"]: field for field in current_document["processFields"]}
    previous_bindings = {
        binding["id"]: binding for binding in previous_document["formBindings"]
    }
    current_bindings = {
        binding["id"]: binding for binding in current_document["formBindings"]
    }

    for element_id, element in current_elements.items():
        if element_id not in previous_elements:
            events.append(
                (
                    "workflow-design.graph-element-added",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "elementId": element_id,
                        "elementType": element["type"],
                        "label": element["label"],
                    },
                )
            )
        elif previous_elements[element_id] != element:
            events.append(
                (
                    "workflow-design.graph-element-updated",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "elementId": element_id,
                        "elementType": element["type"],
                        "previousLabel": previous_elements[element_id]["label"],
                        "label": element["label"],
                    },
                )
            )

    for element_id, element in previous_elements.items():
        if element_id not in current_elements:
            events.append(
                (
                    "workflow-design.graph-element-removed",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "elementId": element_id,
                        "elementType": element["type"],
                        "label": element["label"],
                    },
                )
            )

    for connection_id, connection in current_connections.items():
        if connection_id not in previous_connections:
            events.append(
                (
                    "workflow-design.graph-connection-added",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "connectionId": connection_id,
                        "connectionType": connection["type"],
                        "sourceId": connection["sourceId"],
                        "targetId": connection["targetId"],
                        "label": connection["label"],
                    },
                )
            )
        elif previous_connections[connection_id] != connection:
            events.append(
                (
                    "workflow-design.graph-connection-updated",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "connectionId": connection_id,
                        "connectionType": connection["type"],
                        "previousSourceId": previous_connections[connection_id]["sourceId"],
                        "previousTargetId": previous_connections[connection_id]["targetId"],
                        "previousLabel": previous_connections[connection_id]["label"],
                        "sourceId": connection["sourceId"],
                        "targetId": connection["targetId"],
                        "label": connection["label"],
                    },
                )
            )

    for connection_id, connection in previous_connections.items():
        if connection_id not in current_connections:
            events.append(
                (
                    "workflow-design.graph-connection-removed",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "connectionId": connection_id,
                        "connectionType": connection["type"],
                        "sourceId": connection["sourceId"],
                        "targetId": connection["targetId"],
                        "label": connection["label"],
                    },
                )
            )

    for field_id, field in current_fields.items():
        if field_id not in previous_fields:
            events.append(
                (
                    "workflow-design.process-field-created",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "fieldId": field_id,
                        "fieldKind": field["kind"],
                        "label": field["label"],
                    },
                )
            )
        elif previous_fields[field_id] != field:
            events.append(
                (
                    "workflow-design.process-field-updated",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "fieldId": field_id,
                        "fieldKind": field["kind"],
                        "label": field["label"],
                        "previousLabel": previous_fields[field_id]["label"],
                    },
                )
            )

    for binding_id, binding in current_bindings.items():
        if binding_id not in previous_bindings:
            if binding.get("kind", "field") != "field":
                events.append(
                    (
                        "workflow-design.form-item-added",
                        {
                            "workflowId": workflow_id,
                            "draftId": draft_id,
                            "revision": next_revision,
                            "previousRevision": previous_revision,
                            "itemId": binding_id,
                            "itemKind": binding["kind"],
                            "taskElementId": binding["taskElementId"],
                        },
                    )
                )
                continue
            events.append(
                (
                    "workflow-design.process-field-bound",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "bindingId": binding_id,
                        "taskElementId": binding["taskElementId"],
                        "fieldId": binding["fieldId"],
                    },
                )
            )
        elif previous_bindings[binding_id] != binding:
            events.append(
                (
                    "workflow-design.form-item-updated",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "itemId": binding_id,
                        "itemKind": binding.get("kind", "field"),
                        "taskElementId": binding["taskElementId"],
                    },
                )
            )

    for binding_id, binding in previous_bindings.items():
        if binding_id not in current_bindings:
            if binding.get("kind", "field") != "field":
                events.append(
                    (
                        "workflow-design.form-item-removed",
                        {
                            "workflowId": workflow_id,
                            "draftId": draft_id,
                            "revision": next_revision,
                            "previousRevision": previous_revision,
                            "itemId": binding_id,
                            "itemKind": binding["kind"],
                            "taskElementId": binding["taskElementId"],
                        },
                    )
                )
                continue
            events.append(
                (
                    "workflow-design.process-field-unbound",
                    {
                        "workflowId": workflow_id,
                        "draftId": draft_id,
                        "revision": next_revision,
                        "previousRevision": previous_revision,
                        "bindingId": binding_id,
                        "taskElementId": binding["taskElementId"],
                        "fieldId": binding["fieldId"],
                    },
                )
            )

    previous_positions = previous_document["layout"]["positions"]
    current_positions = current_document["layout"]["positions"]
    moved_element_ids = sorted(
        element_id
        for element_id in set(previous_positions) | set(current_positions)
        if previous_positions.get(element_id) != current_positions.get(element_id)
    )
    if moved_element_ids:
        events.append(
            (
                "workflow-design.graph-layout-updated",
                {
                    "workflowId": workflow_id,
                    "draftId": draft_id,
                    "revision": next_revision,
                    "previousRevision": previous_revision,
                    "elementIds": moved_element_ids,
                    "elementCount": len(moved_element_ids),
                },
            )
        )

    if not events:
        events.append(
            (
                "workflow-design.graph-saved",
                {
                    "workflowId": workflow_id,
                    "draftId": draft_id,
                    "revision": next_revision,
                    "previousRevision": previous_revision,
                    "elementCount": len(current_document["elements"]),
                    "connectionCount": len(current_document["connections"]),
                },
            )
        )

    return events


def _form_draft_scope_issues(
    *,
    previous_document: dict[str, Any],
    candidate_document: dict[str, Any],
    task_element_id: str,
) -> list[dict[str, str]]:
    for field_name in ("elements", "connections", "publication", "layout"):
        if candidate_document[field_name] != previous_document[field_name]:
            return [
                {
                    "field": field_name,
                    "code": "form_draft_scope_invalid",
                    "reason": (
                        "Change Workflow structure and configuration in the "
                        "Workflow Designer."
                    ),
                }
            ]

    previous_other_items = [
        item
        for item in previous_document["formBindings"]
        if item["taskElementId"] != task_element_id
    ]
    candidate_other_items = [
        item
        for item in candidate_document["formBindings"]
        if item["taskElementId"] != task_element_id
    ]
    if candidate_other_items != previous_other_items:
        return [
            {
                "field": "formBindings",
                "code": "form_draft_scope_invalid",
                "reason": "Edit only the Form for the Task whose editing access you hold.",
            }
        ]

    task_field_ids = {
        item["fieldId"]
        for document in (previous_document, candidate_document)
        for item in document["formBindings"]
        if item["taskElementId"] == task_element_id and item["kind"] == "field"
    }
    protected_shared_field_ids = {
        item["fieldId"]
        for document in (previous_document, candidate_document)
        for item in document["formBindings"]
        if item["taskElementId"] != task_element_id and item["kind"] == "field"
    }
    previous_fields_by_id = {
        field["id"]: field for field in previous_document["processFields"]
    }
    candidate_fields_by_id = {
        field["id"]: field for field in candidate_document["processFields"]
    }
    if any(
        candidate_fields_by_id.get(field_id) != previous_fields_by_id.get(field_id)
        for field_id in protected_shared_field_ids
    ):
        return [
            {
                "field": "processFields",
                "code": "form_draft_scope_invalid",
                "reason": (
                    "Create Task-specific field configuration instead of changing "
                    "a field used by another Task."
                ),
            }
        ]
    previous_other_fields = {
        field["id"]: field
        for field in previous_document["processFields"]
        if field["id"] not in task_field_ids
    }
    candidate_other_fields = {
        field["id"]: field
        for field in candidate_document["processFields"]
        if field["id"] not in task_field_ids
    }
    if candidate_other_fields != previous_other_fields:
        return [
            {
                "field": "processFields",
                "code": "form_draft_scope_invalid",
                "reason": "Edit only reusable fields used by this Task Form.",
            }
        ]
    return []


def _merge_elements(
    *,
    previous_document: dict[str, Any],
    draft: dict[str, Any],
) -> list[dict[str, Any]]:
    submitted_elements = draft.get("elements")
    if submitted_elements is None:
        return previous_document["elements"]

    elements = [dict(element) for element in submitted_elements]
    previous_by_id = {
        element["id"]: element for element in previous_document["elements"]
    }
    submitted_schema_version = draft.get("schemaVersion")
    legacy_assignment = draft.get("publication", {}).get("assignment")
    uses_legacy_assignment = (
        isinstance(submitted_schema_version, int)
        and submitted_schema_version < ASSIGNMENT_DRAFT_SCHEMA_VERSION
        and isinstance(legacy_assignment, dict)
    )
    connections = draft.get("connections", previous_document["connections"])
    start_ids = [
        element["id"] for element in elements if element.get("type") == "start"
    ]
    first_task_id = None
    if len(start_ids) == 1:
        targets = [
            connection.get("targetId")
            for connection in connections
            if connection.get("sourceId") == start_ids[0]
        ]
        if len(targets) == 1:
            first_task_id = targets[0]
    for element in elements:
        if element.get("type") == "task" and "assignment" not in element:
            if uses_legacy_assignment:
                element["assignment"] = (
                    legacy_assignment
                    if element.get("id") == first_task_id
                    else {"mode": "unconfigured", "membershipId": None}
                )
                continue
            previous_assignment = previous_by_id.get(element.get("id"), {}).get(
                "assignment"
            )
            element["assignment"] = (
                dict(previous_assignment)
                if isinstance(previous_assignment, dict)
                else {"mode": "unconfigured", "membershipId": None}
            )
    return elements


def _merge_process_fields(
    *,
    previous_document: dict[str, Any],
    draft: dict[str, Any],
) -> list[dict[str, Any]]:
    submitted_fields = draft.get("processFields")
    if submitted_fields is None:
        return previous_document["processFields"]

    previous_by_id = {
        field["id"]: field for field in previous_document["processFields"]
    }
    merged_fields: list[dict[str, Any]] = []
    next_ordinal = len(previous_by_id) + 1

    for field in submitted_fields:
        candidate = dict(field)
        field_id = candidate.get("id")
        if isinstance(field_id, str) and field_id.strip():
            candidate["id"] = field_id.strip()
        else:
            candidate["id"] = f"field-{next_ordinal}"
            next_ordinal += 1

        previous = previous_by_id.get(candidate["id"])
        if previous is not None and "kind" not in candidate:
            candidate["kind"] = previous["kind"]
        merged_fields.append(candidate)

    return merged_fields


def _merge_form_bindings(
    *,
    previous_document: dict[str, Any],
    draft: dict[str, Any],
) -> list[dict[str, Any]]:
    submitted_bindings = draft.get("formBindings")
    if submitted_bindings is None:
        return previous_document["formBindings"]

    merged_bindings: list[dict[str, Any]] = []
    next_ordinal = len(previous_document["formBindings"]) + 1
    for binding in submitted_bindings:
        candidate = dict(binding)
        binding_id = candidate.get("id")
        if isinstance(binding_id, str) and binding_id.strip():
            candidate["id"] = binding_id.strip()
        else:
            candidate["id"] = f"binding-{next_ordinal}"
            next_ordinal += 1
        merged_bindings.append(candidate)
    return merged_bindings


def _merge_publication(
    *,
    previous_document: dict[str, Any],
    draft: dict[str, Any],
) -> dict[str, Any]:
    submitted_publication = draft.get("publication")
    if submitted_publication is None:
        return previous_document["publication"]

    previous_publication = previous_document["publication"]
    starter = submitted_publication.get("starter")
    return {
        "starter": dict(starter)
        if isinstance(starter, dict)
        else dict(previous_publication["starter"]),
    }


def _serialize_workflow_design_directory(
    *,
    tenant_context: TenantContext,
) -> dict[str, list[dict[str, Any]]]:
    directory = workflow_design_directory(tenant_context=tenant_context)
    return {
        "memberships": [
            {
                "membershipId": option.membership_id,
                "displayName": option.display_name,
                "email": option.email,
                "role": option.role,
            }
            for option in directory.memberships
        ],
        "teams": [
            {
                "teamId": option.team_id,
                "name": option.name,
                "activeMemberCount": option.active_member_count,
                "membershipIds": list(option.membership_ids),
            }
            for option in directory.teams
        ],
    }
