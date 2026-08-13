from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

from django.utils import timezone

from moviqo.building_blocks.tenancy.runtime import TenantContext, tenant_atomic_context
from moviqo.modules.organizations.application import read_membership_display_names
from moviqo.modules.workflow_design.application.schema import load_draft_document
from moviqo.modules.workflow_design.models import FormAuthoringLease, WorkflowDefinition

FORM_AUTHORING_LEASE_SECONDS = 60
FORM_AUTHORING_HEARTBEAT_SECONDS = 20
FORM_AUTHORING_LEASE_LOST_CODE = "form_authoring_lease_lost"


class FormAuthoringLeaseLostError(RuntimeError):
    pass


def change_form_authoring_lease(
    *,
    tenant_context: TenantContext,
    workflow_id,
    task_element_id: str,
    action: str,
    session_key: str,
    session_expires_at: datetime,
    lease_token: uuid.UUID | None = None,
) -> dict[str, Any] | None:
    with tenant_atomic_context(tenant_context):
        workflow = (
            WorkflowDefinition.objects.select_for_update(of=("self",))
            .select_related("draft")
            .filter(id=workflow_id, organization_id=tenant_context.organization_id)
            .first()
        )
        if workflow is None or not _is_task(workflow, task_element_id):
            return None

        lease = (
            FormAuthoringLease.objects.select_for_update()
            .filter(
                organization_id=tenant_context.organization_id,
                workflow_id=workflow_id,
                task_element_id=task_element_id,
            )
            .first()
        )
        now = timezone.now()
        if lease is not None and not _is_active(lease, now):
            lease.delete()
            lease = None

        if action == "acquire":
            if lease is None:
                lease = _create_lease(
                    tenant_context=tenant_context,
                    workflow=workflow,
                    task_element_id=task_element_id,
                    session_key=session_key,
                    session_expires_at=session_expires_at,
                    now=now,
                )
            elif _is_session_owner(lease, tenant_context, session_key):
                _renew_lease(
                    lease,
                    session_expires_at=session_expires_at,
                    now=now,
                )
            return _lease_payload(workflow, task_element_id, lease, tenant_context, session_key)

        if action == "takeover":
            if lease is None:
                lease = _create_lease(
                    tenant_context=tenant_context,
                    workflow=workflow,
                    task_element_id=task_element_id,
                    session_key=session_key,
                    session_expires_at=session_expires_at,
                    now=now,
                )
            else:
                lease.lease_token = uuid.uuid4()
                lease.holder_membership_id = tenant_context.membership_id
                lease.holder_user_id = tenant_context.user_id
                lease.session_key = session_key
                lease.session_expires_at = session_expires_at
                lease.lease_expires_at = now + timedelta(
                    seconds=FORM_AUTHORING_LEASE_SECONDS
                )
                lease.save(
                    update_fields=[
                        "lease_token",
                        "holder_membership_id",
                        "holder_user_id",
                        "session_key",
                        "session_expires_at",
                        "lease_expires_at",
                        "updated_at",
                    ]
                )
            return _lease_payload(workflow, task_element_id, lease, tenant_context, session_key)

        if lease is None or lease_token is None or not _owns_token(
            lease,
            tenant_context,
            session_key,
            lease_token,
        ):
            raise FormAuthoringLeaseLostError

        if action == "heartbeat":
            _renew_lease(lease, session_expires_at=session_expires_at, now=now)
            return _lease_payload(workflow, task_element_id, lease, tenant_context, session_key)

        if action == "release":
            lease.delete()
            return _unowned_payload(workflow, task_element_id)

        raise ValueError(f"Unsupported Form authoring lease action: {action}")


def enforce_form_authoring_lease(
    *,
    tenant_context: TenantContext,
    workflow_id,
    task_element_id: str,
    session_key: str,
    lease_token: uuid.UUID,
) -> bool:
    now = timezone.now()
    lease = (
        FormAuthoringLease.objects.select_for_update()
        .filter(
            organization_id=tenant_context.organization_id,
            workflow_id=workflow_id,
            task_element_id=task_element_id,
        )
        .first()
    )
    if lease is None or not _is_active(lease, now):
        if lease is not None:
            lease.delete()
        return False
    return _owns_token(lease, tenant_context, session_key, lease_token)


def release_session_form_authoring_leases(
    *,
    tenant_context: TenantContext,
    session_key: str,
) -> None:
    with tenant_atomic_context(tenant_context):
        FormAuthoringLease.objects.filter(
            organization_id=tenant_context.organization_id,
            holder_membership_id=tenant_context.membership_id,
            holder_user_id=tenant_context.user_id,
            session_key=session_key,
        ).delete()


def _create_lease(
    *,
    tenant_context: TenantContext,
    workflow: WorkflowDefinition,
    task_element_id: str,
    session_key: str,
    session_expires_at: datetime,
    now: datetime,
) -> FormAuthoringLease:
    return FormAuthoringLease.objects.create(
        organization_id=tenant_context.organization_id,
        workflow=workflow,
        task_element_id=task_element_id,
        holder_membership_id=tenant_context.membership_id,
        holder_user_id=tenant_context.user_id,
        session_key=session_key,
        session_expires_at=session_expires_at,
        lease_expires_at=now + timedelta(seconds=FORM_AUTHORING_LEASE_SECONDS),
    )


def _renew_lease(
    lease: FormAuthoringLease,
    *,
    session_expires_at: datetime,
    now: datetime,
) -> None:
    lease.session_expires_at = session_expires_at
    lease.lease_expires_at = now + timedelta(seconds=FORM_AUTHORING_LEASE_SECONDS)
    lease.save(update_fields=["session_expires_at", "lease_expires_at", "updated_at"])


def _is_task(workflow: WorkflowDefinition, task_element_id: str) -> bool:
    document = load_draft_document(workflow.draft.document)
    return any(
        element["id"] == task_element_id and element["type"] == "task"
        for element in document["elements"]
    )


def _is_active(lease: FormAuthoringLease, now: datetime) -> bool:
    return lease.lease_expires_at > now and lease.session_expires_at > now


def _is_session_owner(
    lease: FormAuthoringLease,
    tenant_context: TenantContext,
    session_key: str,
) -> bool:
    return (
        lease.holder_membership_id == tenant_context.membership_id
        and lease.holder_user_id == tenant_context.user_id
        and lease.session_key == session_key
    )


def _owns_token(
    lease: FormAuthoringLease,
    tenant_context: TenantContext,
    session_key: str,
    lease_token: uuid.UUID,
) -> bool:
    return _is_session_owner(lease, tenant_context, session_key) and (
        lease.lease_token == lease_token
    )


def _lease_payload(
    workflow: WorkflowDefinition,
    task_element_id: str,
    lease: FormAuthoringLease,
    tenant_context: TenantContext,
    session_key: str,
) -> dict[str, Any]:
    owned = _is_session_owner(lease, tenant_context, session_key)
    display_name = read_membership_display_names(
        membership_ids=[lease.holder_membership_id]
    ).get(str(lease.holder_membership_id))
    holder = None
    if display_name is not None:
        holder = {
            "membershipId": str(lease.holder_membership_id),
            "displayName": display_name,
        }
    return {
        "workflowId": str(workflow.id),
        "taskElementId": task_element_id,
        "mode": "editable" if owned else "readOnly",
        "leaseToken": str(lease.lease_token) if owned else None,
        "leaseExpiresAt": lease.lease_expires_at.isoformat(),
        "heartbeatAfterSeconds": FORM_AUTHORING_HEARTBEAT_SECONDS,
        "holder": holder,
    }


def _unowned_payload(
    workflow: WorkflowDefinition,
    task_element_id: str,
) -> dict[str, Any]:
    return {
        "workflowId": str(workflow.id),
        "taskElementId": task_element_id,
        "mode": "readOnly",
        "leaseToken": None,
        "leaseExpiresAt": None,
        "heartbeatAfterSeconds": FORM_AUTHORING_HEARTBEAT_SECONDS,
        "holder": None,
    }
