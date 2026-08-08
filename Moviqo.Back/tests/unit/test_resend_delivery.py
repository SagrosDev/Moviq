from __future__ import annotations

import json
import uuid
from types import SimpleNamespace

import pytest

from moviqo.modules.messaging.application import _deliver_resend_outbox_message


class _AcceptedResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


def test_synthetic_uat_delivery_uses_secret_backed_resend_account_address(
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
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {
        "payload": {
            "from": "Moviqo <onboarding@resend.dev>",
            "to": ["uat-owner@example.com"],
            "subject": "Verify your email",
            "text": "Safe verification body",
        },
        "timeout": 10,
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
        return _AcceptedResponse()

    settings.MOVIQO_ENVIRONMENT_CLASS = "synthetic-only"
    settings.MOVIQO_RESEND_API_KEY = "re_test_only"
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {"payload": original_payload, "timeout": 10}


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
    settings.MOVIQO_RESEND_TEST_RECIPIENT = "uat-owner@example.com"
    monkeypatch.setattr(
        "moviqo.modules.messaging.application.urllib_request.urlopen",
        accept,
    )

    _deliver_resend_outbox_message(message)

    assert captured == {"payload": original_payload, "timeout": 10}


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
    settings.MOVIQO_RESEND_TEST_RECIPIENT = recipient

    with pytest.raises(RuntimeError, match=f"^{reason}$"):
        _deliver_resend_outbox_message(message)
