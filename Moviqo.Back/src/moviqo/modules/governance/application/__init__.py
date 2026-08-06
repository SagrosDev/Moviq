from __future__ import annotations

from collections.abc import Iterable

from django.db.models import Q
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


def list_transactional_audits(
    *,
    organization_id,
    event_types: Iterable[str],
    process_id: str | None = None,
    task_ids: Iterable[str] = (),
) -> list[TransactionalAuditRecord]:
    task_ids = list(task_ids)
    queryset = TransactionalAuditRecord.objects.filter(
        organization_id=organization_id,
        event_type__in=tuple(event_types),
    )
    if process_id is not None and task_ids:
        queryset = queryset.filter(
            Q(payload__processId=process_id) | Q(payload__taskId__in=task_ids),
        )
    elif process_id is not None:
        queryset = queryset.filter(payload__processId=process_id)
    elif task_ids:
        queryset = queryset.filter(payload__taskId__in=task_ids)
    else:
        return []
    return list(queryset.order_by("created_at", "id"))


def find_latest_transactional_audit(
    *,
    organization_id,
    event_type: str,
    process_id: str,
) -> TransactionalAuditRecord | None:
    return (
        TransactionalAuditRecord.objects.filter(
            organization_id=organization_id,
            event_type=event_type,
            payload__processId=process_id,
        )
        .order_by("-created_at", "-id")
        .first()
    )
