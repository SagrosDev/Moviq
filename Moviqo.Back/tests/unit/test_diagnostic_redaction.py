from __future__ import annotations

import logging

from moviqo.building_blocks.api.logging import RedactDiagnosticLogFilter
from moviqo.building_blocks.api.redaction import redact_diagnostic_value


def test_redact_diagnostic_value_removes_sensitive_process_and_credential_data() -> None:
    payload = {
        "message": (
            "process-field-secret hidden-resource-123 "
            "Authorization: Bearer super-secret-token "
            "cookie=sessionid=abc123 "
            "\"password\": \"plaintext phrase\" "
            "'secret': 'raw phrase' "
            "https://files.moviqo.test/private/export.csv "
            "MOVIQO_SECRET_KEY"
        ),
        "metadata": [
            "sessionid=abc123",
            "csrftoken=csrf-123",
            "password=plaintext",
            "secret=raw",
            "f1bd7d85-8cd8-4a77-a2e0-c6db92a64073",
        ],
    }

    redacted = redact_diagnostic_value(payload)
    serialized = str(redacted)

    for forbidden_fragment in (
        "process-field-secret",
        "hidden-resource-123",
        "Bearer super-secret-token",
        "sessionid=abc123",
        "csrf-123",
        "plaintext",
        "plaintext phrase",
        "secret=raw",
        "raw phrase",
        "private/export.csv",
        "MOVIQO_SECRET_KEY",
        "f1bd7d85-8cd8-4a77-a2e0-c6db92a64073",
    ):
        assert forbidden_fragment not in serialized

    assert "[redacted-process-data]" in serialized
    assert "[redacted-resource]" in serialized
    assert "[redacted-token]" in serialized
    assert "[redacted-password]" in serialized
    assert "[redacted-secret]" in serialized
    assert "[redacted-private-link]" in serialized
    assert "[redacted-config]" in serialized
    assert "[redacted-uuid]" in serialized


def test_redact_diagnostic_log_filter_sanitizes_message_and_args() -> None:
    record = logging.LogRecord(
        name="django.request",
        level=logging.WARNING,
        pathname=__file__,
        lineno=1,
        msg="Authorization: Bearer super-secret-token path=%s",
        args=("/private/export.csv",),
        exc_info=None,
    )

    log_filter = RedactDiagnosticLogFilter()

    assert log_filter.filter(record) is True
    assert "super-secret-token" not in record.msg
    assert record.args == ("[redacted-private-link]",)
