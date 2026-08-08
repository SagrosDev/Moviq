from __future__ import annotations

import hashlib
import uuid
from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from moviqo.building_blocks.commands import (
    IdempotencyKeyReuseConflict,
    execute_atomic_command,
)
from moviqo.building_blocks.tenancy import tenant_background_atomic_context
from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.governance.application import append_transactional_audit
from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord
from moviqo.modules.messaging import application as messaging_application
from moviqo.modules.messaging.application import (
    LeaseOwnershipLost,
    acknowledge_outbox_message,
    claim_outbox_messages,
    dead_letter_outbox_message,
    drain_outbox_messages,
    enqueue_outbox_message,
    release_outbox_message,
)
from moviqo.modules.messaging.models import OutboxMessage
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization
from moviqo.modules.workflow_runtime.models import AtomicCommandProbe


def _request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _tenant_context(django_user_model) -> TenantContext:
    user = django_user_model.objects.create_user(username=f"user-{uuid.uuid4().hex[:8]}")
    organization = Organization.objects.create(
        slug=f"org-{uuid.uuid4().hex[:8]}",
        display_name="Test Organization",
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


@pytest.mark.django_db
def test_atomic_command_replays_stored_result_without_repeating_side_effects(
    django_user_model,
) -> None:
    tenant_context = _tenant_context(django_user_model)
    command_reference = uuid.uuid4().hex
    side_effect_calls = {"count": 0}

    def handler(command_context) -> dict[str, object]:
        side_effect_calls["count"] += 1
        AtomicCommandProbe.objects.create(
            organization_id=tenant_context.organization_id,
            reference=command_reference,
            payload={"attempt": side_effect_calls["count"]},
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

    first = execute_atomic_command(
        tenant_context=tenant_context,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="idem-1",
        request_hash=_request_hash(command_reference),
        handler=handler,
    )
    replay = execute_atomic_command(
        tenant_context=tenant_context,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="idem-1",
        request_hash=_request_hash(command_reference),
        handler=handler,
    )

    assert first.replayed is False
    assert replay.replayed is True
    assert replay.result == {"reference": command_reference, "created": True}
    assert side_effect_calls["count"] == 1
    assert AtomicCommandProbe.objects.count() == 1
    assert TransactionalAuditRecord.objects.count() == 1
    assert OutboxMessage.objects.count() == 1
    stored_result = CommandResult.objects.get(
        organization_id=tenant_context.organization_id,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="idem-1",
    )
    assert stored_result.request_hash == _request_hash(command_reference)
    assert stored_result.result_payload == {"reference": command_reference, "created": True}


@pytest.mark.django_db
def test_atomic_command_rejects_key_reuse_with_different_request_hash(
    django_user_model,
) -> None:
    tenant_context = _tenant_context(django_user_model)

    execute_atomic_command(
        tenant_context=tenant_context,
        command_type="workflow-runtime.probe.execute",
        idempotency_key="idem-1",
        request_hash=_request_hash("alpha"),
        handler=lambda _context: {"reference": "alpha"},
    )

    with pytest.raises(IdempotencyKeyReuseConflict):
        execute_atomic_command(
            tenant_context=tenant_context,
            command_type="workflow-runtime.probe.execute",
            idempotency_key="idem-1",
            request_hash=_request_hash("bravo"),
            handler=lambda _context: {"reference": "bravo"},
        )


@pytest.mark.django_db
def test_atomic_command_rolls_back_business_audit_outbox_and_idempotency_rows(
    django_user_model,
) -> None:
    tenant_context = _tenant_context(django_user_model)
    command_reference = uuid.uuid4().hex

    def handler(command_context) -> dict[str, object]:
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
        raise RuntimeError("force rollback")

    with pytest.raises(RuntimeError, match="force rollback"):
        execute_atomic_command(
            tenant_context=tenant_context,
            command_type="workflow-runtime.probe.execute",
            idempotency_key="idem-rollback",
            request_hash=_request_hash(command_reference),
            handler=handler,
        )

    assert AtomicCommandProbe.objects.count() == 0
    assert TransactionalAuditRecord.objects.count() == 0
    assert OutboxMessage.objects.count() == 0
    assert CommandResult.objects.count() == 0


@pytest.mark.django_db
def test_outbox_claims_recover_expired_leases_and_dead_letter_exhausted_work(
    django_user_model,
) -> None:
    tenant_context = _tenant_context(django_user_model)
    available = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    expired = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "bravo"},
    )
    now = timezone.now()
    expired_lease = now - timedelta(minutes=5)
    OutboxMessage.objects.filter(id=expired.id).update(
        lease_owner="worker-stale",
        lease_expires_at=expired_lease,
    )

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        claimed = claim_outbox_messages(
            limit=10,
            lease_owner="worker-a",
            now=now,
            lease_for=timedelta(minutes=2),
            organization_id=tenant_context.organization_id,
        )

    assert {message.id for message in claimed} == {available.id, expired.id}
    assert all(message.lease_owner == "worker-a" for message in claimed)
    assert all(message.lease_expires_at > now for message in claimed)

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        release_outbox_message(
            message_id=available.id,
            lease_owner="worker-a",
            now=now,
            retry_delay=timedelta(minutes=1),
            reason="delivery-failed",
        )
    available.refresh_from_db()
    assert available.attempt_count == 1
    assert available.next_attempt_at == now + timedelta(minutes=1)
    assert available.dead_lettered_at is None

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        dead_letter_outbox_message(
            message_id=expired.id,
            lease_owner="worker-a",
            now=now,
            reason="max-attempts-exhausted",
        )
    expired.refresh_from_db()
    assert expired.dead_lettered_at == now
    assert expired.dead_letter_reason == "max-attempts-exhausted"

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        retried = claim_outbox_messages(
            limit=1,
            lease_owner="worker-a",
            now=now + timedelta(minutes=1),
            lease_for=timedelta(minutes=2),
            organization_id=tenant_context.organization_id,
        )
    assert [message.id for message in retried] == [available.id]

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        acknowledge_outbox_message(
            message_id=available.id,
            lease_owner="worker-a",
            now=now,
        )
    available.refresh_from_db()
    assert available.delivered_at == now


@pytest.mark.django_db
def test_drain_outbox_sanitizes_delivery_failures_and_dead_letters_exhausted_work(
    django_user_model,
    caplog,
    monkeypatch,
) -> None:
    tenant_context = _tenant_context(django_user_model)
    message = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    now = timezone.now()

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
    assert message.attempt_count == 1
    assert message.last_error == "delivery-failed"
    assert message.next_attempt_at == now + timedelta(minutes=2)
    assert "reason=delivery-failed" in caplog.text
    assert "token=secret" not in caplog.text

    OutboxMessage.objects.filter(id=message.id).update(lease_expires_at=now - timedelta(minutes=1))

    processed = drain_outbox_messages(
        batch_size=1,
        lease_owner="worker-a",
        now=now + timedelta(minutes=3),
        max_attempts=2,
    )

    assert processed == 1
    message.refresh_from_db()
    assert message.dead_letter_reason == "delivery-attempts-exhausted"
    assert message.last_error == "delivery-attempts-exhausted"


@pytest.mark.django_db
def test_acknowledge_outbox_message_raises_when_lease_is_lost(django_user_model) -> None:
    tenant_context = _tenant_context(django_user_model)
    message = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.probe.created",
        payload={"reference": "alpha"},
    )
    now = timezone.now()

    with tenant_background_atomic_context(organization_id=tenant_context.organization_id):
        claim_outbox_messages(
            limit=1,
            lease_owner="worker-a",
            now=now,
            lease_for=timedelta(minutes=2),
            organization_id=tenant_context.organization_id,
        )
        OutboxMessage.objects.filter(id=message.id).update(lease_owner="worker-b")
        with pytest.raises(LeaseOwnershipLost):
            acknowledge_outbox_message(
                message_id=message.id,
                lease_owner="worker-a",
                now=now,
            )


@pytest.mark.django_db
def test_drain_outbox_management_command_uses_resend_adapter(
    django_user_model,
    monkeypatch,
    settings,
) -> None:
    tenant_context = _tenant_context(django_user_model)
    message = enqueue_outbox_message(
        organization_id=tenant_context.organization_id,
        message_type="email.notification.created",
        payload={"from": "noreply@example.com", "to": ["user@example.com"], "subject": "Hi"},
    )
    delivered = {"count": 0}

    def deliver(_message) -> None:
        delivered["count"] += 1

    settings.MOVIQO_MESSAGE_DELIVERY_ADAPTER = "resend-outbox"
    monkeypatch.setattr(messaging_application, "_deliver_resend_outbox_message", deliver)

    call_command("drain_outbox", "--batch-size", "1")

    message.refresh_from_db()
    assert delivered["count"] == 1
    assert message.delivered_at is not None
