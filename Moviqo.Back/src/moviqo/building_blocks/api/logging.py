from __future__ import annotations

import logging

from moviqo.building_blocks.api.redaction import redact_diagnostic_value


class RedactDiagnosticLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = redact_diagnostic_value(record.msg)
        record.args = redact_diagnostic_value(record.args)
        return True


class RedactUuidRequestLogFilter(RedactDiagnosticLogFilter):
    pass
