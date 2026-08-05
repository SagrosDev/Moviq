from __future__ import annotations

import hashlib
import uuid

import pytest
from django.conf import settings

from moviqo.building_blocks.commands import IdempotencyKeyReuseConflict
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_design.application import create_workflow_definition
from moviqo.modules.workflow_design.models import WorkflowDefinition, WorkflowDraft


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("PostgreSQL integration settings are required for workflow-design coverage.")


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(django_user_model) -> TenantContext:
    user = django_user_model.objects.create_user(username=f"user-{uuid.uuid4().hex[:8]}")
    organization = Organization.objects.create(
        slug=f"org-{uuid.uuid4().hex[:8]}",
        display_name="Workflow Design Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.DESIGNER,
    )
    return TenantContext(
        organization_id=organization.id,
        membership_id=membership.id,
        user_id=user.id,
    )


@pytest.mark.django_db(transaction=True)
def test_workflow_creation_replays_one_committed_result(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    request_hash = _request_hash("Workflow intake")

    first = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=request_hash,
    )
    second = create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=request_hash,
    )

    assert first == second
    assert WorkflowDefinition.objects.count() == 1
    assert WorkflowDraft.objects.count() == 1
    assert TransactionalAuditRecord.objects.count() == 1
    assert CommandResult.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_workflow_creation_rejects_stale_idempotency_key_reuse(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)

    create_workflow_definition(
        tenant_context=tenant_context,
        name="Workflow intake",
        idempotency_key="workflow-create-1",
        request_hash=_request_hash("Workflow intake"),
    )

    with pytest.raises(IdempotencyKeyReuseConflict):
        create_workflow_definition(
            tenant_context=tenant_context,
            name="Workflow approvals",
            idempotency_key="workflow-create-1",
            request_hash=_request_hash("Workflow approvals"),
        )
