from __future__ import annotations

from django.utils import timezone

from moviqo.modules.governance.models import CommandResult, TransactionalAuditRecord


def module_health() -> None:
    return None


def append_transactional_audit(
    *,
    organization_id,
    command_type: str,
    event_type: str,
    actor_membership_id,
    actor_user_id,
    payload: dict,
) -> TransactionalAuditRecord:
    return TransactionalAuditRecord.objects.create(
        organization_id=organization_id,
        command_type=command_type,
        event_type=event_type,
        actor_membership_id=actor_membership_id,
        actor_user_id=actor_user_id,
        payload=payload,
    )


def find_command_result_for_update(
    *,
    organization_id,
    command_type: str,
    idempotency_key: str,
) -> CommandResult | None:
    return (
        CommandResult.objects.select_for_update()
        .filter(
            organization_id=organization_id,
            command_type=command_type,
            idempotency_key=idempotency_key,
        )
        .first()
    )


def create_pending_command_result(
    *,
    organization_id,
    command_type: str,
    idempotency_key: str,
    request_hash: str,
) -> CommandResult:
    return CommandResult.objects.create(
        organization_id=organization_id,
        command_type=command_type,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        result_payload={},
    )


def complete_command_result(
    *,
    command_result: CommandResult,
    result_payload: dict,
) -> CommandResult:
    command_result.result_payload = result_payload
    command_result.completed_at = timezone.now()
    command_result.save(update_fields=["result_payload", "completed_at", "updated_at"])
    return command_result
