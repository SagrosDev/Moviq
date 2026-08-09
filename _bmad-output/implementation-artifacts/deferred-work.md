- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Classify permanent Resend HTTP failures as non-retryable delivery errors.
  evidence: Existing outbox retry logic treats all provider failures alike; HTTP 400/401/403/404/422 should not consume repeated attempts, while 408/429/5xx remain retryable.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Add a stable Resend idempotency key derived from the outbox message ID.
  evidence: Existing ambiguous network retries can duplicate an email if Resend accepted the POST before the client observed a timeout.
