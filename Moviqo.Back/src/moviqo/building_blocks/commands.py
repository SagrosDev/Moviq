from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.exceptions import APIException

from moviqo.building_blocks.tenancy.runtime import TenantContext, tenant_atomic_context
from moviqo.modules.governance.application import (
    append_transactional_audit,
    complete_command_result,
    create_pending_command_result,
    find_command_result_for_update,
)
from moviqo.modules.governance.models import CommandResult
from moviqo.modules.messaging.application import enqueue_outbox_message


class IdempotencyKeyReuseConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This idempotency key has already been used for a different request."
    default_code = "idempotency_key_reused"


@dataclass(frozen=True)
class AtomicCommandExecutionResult:
    result: dict[str, Any]
    replayed: bool


@dataclass(frozen=True)
class AtomicCommandContext:
    tenant_context: TenantContext
    command_type: str

    def enqueue_outbox(self, *, message_type: str, payload: dict[str, Any]) -> None:
        enqueue_outbox_message(
            organization_id=self.tenant_context.organization_id,
            message_type=message_type,
            payload=payload,
        )

    def append_audit(
        self,
        *,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        append_transactional_audit(
            organization_id=self.tenant_context.organization_id,
            command_type=self.command_type,
            event_type=event_type,
            actor_membership_id=self.tenant_context.membership_id,
            actor_user_id=self.tenant_context.user_id,
            payload=payload,
        )


def execute_atomic_command(
    *,
    tenant_context: TenantContext,
    command_type: str,
    idempotency_key: str,
    request_hash: str,
    handler,
) -> AtomicCommandExecutionResult:
    with tenant_atomic_context(tenant_context):
        command_result = _load_or_create_command_result(
            organization_id=tenant_context.organization_id,
            command_type=command_type,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
        )
        if command_result.completed_at is not None:
            return AtomicCommandExecutionResult(
                result=command_result.result_payload,
                replayed=False if command_result.created_in_current_transaction else True,
            )

        result = handler(
            AtomicCommandContext(
                tenant_context=tenant_context,
                command_type=command_type,
            )
        )
        complete_command_result(command_result=command_result, result_payload=result)
        return AtomicCommandExecutionResult(result=result, replayed=False)


def _load_or_create_command_result(
    *,
    organization_id,
    command_type: str,
    idempotency_key: str,
    request_hash: str,
) -> CommandResult:
    command_result = find_command_result_for_update(
        organization_id=organization_id,
        command_type=command_type,
        idempotency_key=idempotency_key,
    )
    if command_result is not None:
        _ensure_matching_request_hash(command_result=command_result, request_hash=request_hash)
        command_result.created_in_current_transaction = False
        return command_result

    try:
        with transaction.atomic():
            command_result = create_pending_command_result(
                organization_id=organization_id,
                command_type=command_type,
                idempotency_key=idempotency_key,
                request_hash=request_hash,
            )
    except IntegrityError:
        command_result = find_command_result_for_update(
            organization_id=organization_id,
            command_type=command_type,
            idempotency_key=idempotency_key,
        )
        if command_result is None:
            raise
        _ensure_matching_request_hash(command_result=command_result, request_hash=request_hash)
        command_result.created_in_current_transaction = False
        return command_result
    command_result.created_in_current_transaction = True
    return command_result


def _ensure_matching_request_hash(
    *,
    command_result: CommandResult,
    request_hash: str,
) -> None:
    if command_result.request_hash != request_hash:
        raise IdempotencyKeyReuseConflict()
