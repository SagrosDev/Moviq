from __future__ import annotations

import logging
import re

UUID_PATTERN = re.compile(
    r"\b[0-9a-fA-F]{8}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{12}\b"
)


class RedactUuidRequestLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = self._redact(record.msg)

        if isinstance(record.args, tuple):
            record.args = tuple(self._redact(value) for value in record.args)
        elif isinstance(record.args, dict):
            record.args = {
                key: self._redact(value)
                for key, value in record.args.items()
            }

        return True

    def _redact(self, value):
        if isinstance(value, str):
            return UUID_PATTERN.sub("[redacted-uuid]", value)
        return value
