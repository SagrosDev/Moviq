from __future__ import annotations

import json
import uuid
from types import SimpleNamespace
from urllib import error as urllib_error

import pytest

from moviqo.modules.messaging.application import (
    _deliver_resend_outbox_message,
    _delivery_failure_reason,
)


class _AcceptedResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


def test_synthetic_uat_delivery_uses_verified_sender_and_secret_backed_recipient(
    monkeypatch,
    settings,
) -> None:
    message_id = uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-123456789abc")
    original_payload = {
        "from": "Moviqo <noreply@moviqo.local>",
        "to": ["owner.run-id@synthetic.moviqo.test"],
        "subject": "Verify your email",
        "text": "Safe verification body",
    }
    message = SimpleNamespace(
        id=message_id,
        message_type="email.registration_verification",
        payload=original_payload,
    )
    captured = {}

    def accept(request, timeout):
        captured["payload"] = json.loads(request.data)
        captured["timeout"] = timeout
        captured["user_agent"] = request.get_header("User-agent")
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {
        "payload": {
            "from": "Moviqo <notifications@updates.mymoviqo.com>",
            "to": ["uat-owner@example.com"],
            "subject": "Verify your email",
            "text": "Safe verification body",
        },
        "timeout": 10,
        "user_agent": "moviqo-back/1.0",
    }
    assert message.payload == original_payload


def test_non_synthetic_delivery_keeps_the_original_resend_envelope(
    monkeypatch,
    settings,
) -> None:
    original_payload = {
        "from": "Moviqo <sender@verified.example>",
        "to": ["customer@example.net"],
        "subject": "Notification",
        "text": "Safe notification body",
    }
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-abcdef123456"),
        message_type="email.notification.created",
        payload=original_payload,
    )
    captured = {}

    def accept(request, timeout):
        captured["payload"] = json.loads(request.data)
        captured["timeout"] = timeout
        captured["user_agent"] = request.get_header("User-agent")
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {
        "payload": {
            **original_payload,
            "from": "Moviqo <notifications@updates.mymoviqo.com>",
        },
        "timeout": 10,
        "user_agent": "moviqo-back/1.0",
    }


def test_non_uat_delivery_does_not_route_synthetic_address_to_resend_test_address(
    monkeypatch,
    settings,
) -> None:
    original_payload = {
        "from": "Moviqo <sender@verified.example>",
        "to": ["owner.run-id@synthetic.moviqo.test"],
        "subject": "Notification",
        "text": "Safe notification body",
    }
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-fedcba654321"),
        message_type="email.notification.created",
        payload=original_payload,
    )
    captured = {}

    def accept(request, timeout):
        captured["payload"] = json.loads(request.data)
        captured["timeout"] = timeout
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "production"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {
        "payload": {
            **original_payload,
            "from": "Moviqo <notifications@updates.mymoviqo.com>",
        },
        "timeout": 10,
    }


def test_synthetic_uat_delivery_rejects_mixed_recipient_batches(
    monkeypatch,
    settings,
) -> None:
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-97531864abcd"),
        message_type="email.notification.created",
        payload={
            "from": "Moviqo <noreply@moviqo.local>",
            "to": ["owner.run-id@synthetic.moviqo.test", "customer@example.net"],
            "subject": "Notification",
            "text": "Safe notification body",
        },
    )
    called = False

    def reject_unexpected_request(request, timeout):
        nonlocal called
        called = True
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        reject_unexpected_request,
    )

    with pytest.raises(RuntimeError, match="^resend-recipient-mix-invalid$"):
        _deliver_resend_outbox_message(message)

    assert called is False


@pytest.mark.parametrize(
    ("recipient", "reason"),
    (
        ("", "resend-test-recipient-missing"),
        ("not-an-email", "resend-test-recipient-invalid"),
    ),
)
def test_synthetic_uat_delivery_fails_closed_without_valid_test_recipient(
    settings,
    recipient,
    reason,
) -> None:
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-13572468abcd"),
        message_type="email.registration_verification",
        payload={
            "from": "Moviqo <noreply@moviqo.local>",
            "to": ["owner.run-id@synthetic.moviqo.test"],
            "subject": "Verify your email",
            "text": "Safe verification body",
        },
    )

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    settings.MOVIQO_RESEND_TEST_RECIPIENT = recipient

    with pytest.raises(RuntimeError, match=f"^{reason}$"):
        _deliver_resend_outbox_message(message)


@pytest.mark.parametrize(
    ("sender", "reason"),
    (
        ("", "resend-sender-missing"),
        ("not-an-email", "resend-sender-invalid"),
        ("notifications@updates.mymoviqo.com", "resend-sender-invalid"),
    ),
)
def test_resend_delivery_fails_closed_without_valid_sender(
    monkeypatch,
    settings,
    sender,
    reason,
) -> None:
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-24681357abcd"),
        message_type="email.notification.created",
        payload={
            "from": "Moviqo <noreply@moviqo.local>",
            "to": ["customer@example.net"],
            "subject": "Notification",
            "text": "Safe notification body",
        },
    )
    called = False

    def reject_unexpected_request(request, timeout):
        nonlocal called
        called = True
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = sender
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        reject_unexpected_request,
    )

    with pytest.raises(RuntimeError, match=f"^{reason}$"):
        _deliver_resend_outbox_message(message)

    assert called is False


@pytest.mark.parametrize(
    ("provider_error", "reason"),
    (
        (
            urllib_error.HTTPError(
                "https://api.resend.com/emails",
                403,
                "Forbidden",
                hdrs=None,
                fp=None,
            ),
            "resend-delivery-http-403",
        ),
        (
            urllib_error.URLError("temporary name resolution failure"),
            "resend-delivery-network-failed",
        ),
    ),
)
def test_resend_delivery_preserves_safe_provider_failure_category(
    monkeypatch,
    settings,
    provider_error,
    reason,
) -> None:
    message = SimpleNamespace(
        id=uuid.UUID("018f4f9a-8d7b-7c6a-9a8b-86429753abcd"),
        message_type="email.notification.created",
        payload={
            "from": "Moviqo <noreply@moviqo.local>",
            "to": ["customer@example.net"],
            "subject": "Notification",
            "text": "Safe notification body",
        },
    )

    def reject(request, timeout):
        raise provider_error

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_FROM_EMAIL = (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        reject,
    )

    with pytest.raises(RuntimeError, match=f"^{reason}$") as captured:
        _deliver_resend_outbox_message(message)

    assert _delivery_failure_reason(captured.value) == reason
