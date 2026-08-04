from __future__ import annotations

import re

UUID_PATTERN = re.compile(
    r"\b[0-9a-fA-F]{8}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{12}\b"
)

SENSITIVE_DIAGNOSTIC_PATTERN = re.compile(
    r"(?i)\b(?:select|insert|update|delete)\b|"
    r"(?:[A-Za-z]:\\|/)(?:[^\s]+/)+[^\s]*|"
    r"\b(?:api[_-]?key|access[_-]?key|client[_-]?secret)\b\s*[:=]"
)

REDACTION_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (UUID_PATTERN, "[redacted-uuid]"),
    (
        re.compile(
            r"(?i)\bauthorization\b\s*:\s*bearer\s+[^\s,;]+|"
            r"\b(cookie|set-cookie)\b\s*[:=]\s*[^\s,;]+"
        ),
        "[redacted-credential]",
    ),
    (
        re.compile(r"(?i)\b(bearer\s+|token=|sessionid=|csrftoken=)[^\s,;]+"),
        "[redacted-token]",
    ),
    (
        re.compile(r"(?i)(['\"]?password['\"]?\s*[:=]\s*)(['\"]).*?\2"),
        "[redacted-password]",
    ),
    (re.compile(r"(?i)\bpassword=[^\s,;]+"), "[redacted-password]"),
    (
        re.compile(r"(?i)(['\"]?secret['\"]?\s*[:=]\s*)(['\"]).*?\2"),
        "[redacted-secret]",
    ),
    (re.compile(r"(?i)\bsecret=[^\s,;]+"), "[redacted-secret]"),
    (re.compile(r"(?i)\bprocess-field-[^\s,;]+"), "[redacted-process-data]"),
    (re.compile(r"(?i)\bhidden-resource-[^\s,;]+"), "[redacted-resource]"),
    (re.compile(r"(?i)https?://[^\s\"']*/private/[^\s\"']+"), "[redacted-private-link]"),
    (re.compile(r"(?i)/private/[^\s\"']+"), "[redacted-private-link]"),
    (re.compile(r"\bMOVIQO_[A-Z0-9_]+\b"), "[redacted-config]"),
)


def redact_diagnostic_value(value: object) -> object:
    if isinstance(value, str):
        redacted = value
        for pattern, replacement in REDACTION_PATTERNS:
            redacted = pattern.sub(replacement, redacted)
        if SENSITIVE_DIAGNOSTIC_PATTERN.search(redacted):
            return "[redacted-diagnostic]"
        return redacted
    if isinstance(value, tuple):
        return tuple(redact_diagnostic_value(item) for item in value)
    if isinstance(value, list):
        return [redact_diagnostic_value(item) for item in value]
    if isinstance(value, dict):
        return {
            key: redact_diagnostic_value(item)
            for key, item in value.items()
        }
    return value
