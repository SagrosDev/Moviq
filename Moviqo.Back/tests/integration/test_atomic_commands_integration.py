from __future__ import annotations

import hashlib
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest
from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone

from moviqo.building_blocks.commands import execute_atomic_command
from moviqo.building_blocks.tenancy import tenant_background_atomic_context
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.application import append_transactional_audit
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.messaging import application as messaging_application
from moviqo.modules.messaging.application import (
    claim_outbox_messages,
    drain_outbox_messages,
    enqueue_outbox_message,
)
from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_runtime.models import AtomicCommandProbe


def _integration_only() -> None:
    if settings.SETTINGS_MODULE != "moviqo.settings.integration":
        pytest.skip("PostgreSQL integration settings are required for concurrency coverage.")


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(django_user_model) -> TenantContext:
    user = django_user_model.objects.create_user(username=f"user-{uuid.uuid4().hex[:8]}")
    organization = Organization.objects.create(
        slug=f"org-{uuid.uuid4().hex[:8]}",
        display_name="Integration Organization",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )
    return TenantContext(
        organization_id=organization.id,
        membership_id=membership.id,
        user_id=user.id,
    )


@pytest.mark.django_db(transaction=True)
def test_concurrent_retries_commit_one_business_outcome(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    command_reference = uuid.uuid4().hex
    started = threading.Barrier(2)

    def run_command() -> tuple[bool, dict[str, object]]:
        close_old_connections()
        started.wait(timeout=5)
        result = execute_atomic_command(
            tenant_context=tenant_context,
            command_type="workflow-runtime.probe.execute",
            idempotency_key="idem-concurrent",
            request_hash=_request_hash(command_reference),
            handler=lambda command_context: _create_probe_side_effect(
                tenant_context=tenant_context,
                command_context=command_context,
                command_reference=command_reference,
            ),
        )
        close_old_connections()
        return (result.replayed, result.result)

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(run_command) for _ in range(2)]
        results = [future.result(timeout=15) for future in futures]

    assert sorted(result[0] for result in results) == [False, True]
    assert all(result[1] == {"reference": command_reference, "created": True} for result in results)
    assert AtomicCommandProbe.objects.count() == 1
    assert TransactionalAuditRecord.objects.count() == 1
    assert OutboxMessage.objects.count() == 1
    assert CommandResult.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_outbox_claims_only_one_worker_per_eligible_row(django_user_model) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    message = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "eligible"},
    )
    started = threading.Barrier(2)
    now = timezone.now()

    def claim(lease_owner: str) -> list[str]:
        close_old_connections()
        started.wait(timeout=5)
        with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
            claimed = claim_outbox_messages(
                limit=1,
                lease_owner=lease_owner,
                now=now,
                lease_for=timedelta(minutes=2),
                organization_id=tenant_context.organization_id,
            )
        close_old_connections()
        return [str(row.id) for row in claimed]

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(claim, lease_owner) for lease_owner in ("worker-a", "worker-b")]
        claims = [future.result(timeout=15) for future in futures]

    assert sorted(len(claim) for claim in claims) == [0, 1]
    assert message.id in {uuid.UUID(claim[0]) for claim in claims if claim}
    message.refresh_from_db()
    assert message.lease_owner in {"worker-a", "worker-b"}


@pytest.mark.django_db(transaction=True)
def test_drain_outbox_processes_multiple_tenants_under_postgresql_rls(django_user_model) -> None:
    _integration_only()
    tenant_context_a = _tenant_context(django_user_model)
    tenant_context_b = _tenant_context(django_user_model)

    message_a = enqueue_outbox_message(
        organization_id=tenant_context_a.organization_id,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    message_b = enqueue_outbox_message(
        organization_id=tenant_context_b.organization_id,
        message_type="email.probe.created",
        payload={"reference": "bravo"},
    )

    processed = drain_outbox_messages(batch_size=10, lease_owner="worker-a")

    assert processed == 2
    message_a.refresh_from_db()
    message_b.refresh_from_db()
    assert message_a.delivered_at is not None
    assert message_b.delivered_at is not None


@pytest.mark.django_db(transaction=True)
def test_drain_outbox_recovers_expired_leases_and_dead_letters_failures_integration(
    django_user_model,
    monkeypatch,
) -> None:
    _integration_only()
    tenant_context = _tenant_context(django_user_model)
    message = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    now = timezone.now()
    OutboxMessage.objects.filter(id=message.id).update(
        lease_owner="worker-stale",
        lease_expires_at=now - timedelta(minutes=5),
        attempt_count=1,
    )

    def fail_delivery(_message) -> None:
        raise RuntimeError("provider timeout token=secret")

    monkeypatch.setattr(messaging_application, "_deliver_outbox_message", fail_delivery)

    processed = drain_outbox_messages(
        batch_size=1,
        lease_owner="worker-a",
        now=now,
        max_attempts=2,
    )

    assert processed == 1
    message.refresh_from_db()
    assert message.dead_lettered_at == now
    assert message.dead_letter_reason == "delivery-attempts-exhausted"
    assert message.last_error == "delivery-attempts-exhausted"


def _create_probe_side_effect(
    *,
    tenant_context: TenantContext,
    command_context,
    command_reference: str,
) -> dict[str, object]:
    AtomicCommandProbe.objects.create(
        organization_id=tenant_context.organization_id,
        reference=command_reference,
        payload={"reference": command_reference},
    )
    append_transactional_audit(
        organization_id=tenant_context.organization_id,
        command_type="workflow-runtime.probe.execute",
        event_type="workflow-runtime.probe-recorded",
        actor_membership_id=tenant_context.membership_id,
        actor_user_id=tenant_context.user_id,
        payload={"reference": command_reference},
    )
    command_context.enqueue_outbox(
        message_type="email.probe.created",
        payload={"reference": command_reference},
    )
    return {"reference": command_reference, "created": True}
