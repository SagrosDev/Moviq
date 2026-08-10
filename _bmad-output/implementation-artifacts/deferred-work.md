- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Classify permanent Resend HTTP failures as non-retryable delivery errors.
  evidence: Existing outbox retry logic treats all provider failures alike; HTTP 400/401/403/404/422 should not consume repeated attempts, while 408/429/5xx remain retryable.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Add a stable Resend idempotency key derived from the outbox message ID.
  evidence: Existing ambiguous network retries can duplicate an email if Resend accepted the POST before the client observed a timeout.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-synthetic-membership-rls.md`
  summary: Make nested tenant context managers restore prior PostgreSQL session-local role and tenant settings.
  evidence: Existing `SET LOCAL` values outlive savepoint-scoped context managers inside a caller-owned transaction, so nested bootstrap/background contexts can affect later queries until the outer transaction ends; production request paths currently call this lookup without an ambient transaction.

## Deferred from: code review of 1-34-qualify-the-stakeholder-preview-experience.md (2026-08-10)

- Complete and record the bilingual manual keyboard accessibility baseline across registration, sign-in, workflow authoring, Task Form, and Process timeline. Deferred because no team currently owns manual accessibility verification and delivery capacity is being prioritized toward a functional stakeholder preview; AC2 remains partially unmet.
- Run the Spanish and English deployed Playwright journey against the exact Story 1.34 commit and retain safe evidence. Deferred until the UI stabilizes because further E2E maintenance is paused; manual functional testing is the interim approach and the automated release evidence remains incomplete.
- Localize the English deployed-journey workflow-create locator. Deferred until the UI stabilizes because E2E maintenance is paused in favor of manual functional testing.
- Preserve the Story 1.33 deployed Playwright project name while adding English coverage. Deferred with the E2E configuration work until the UI stabilizes.
- Add bilingual mobile qualification for registration, authentication, My Work, and Task Form. Deferred until the UI stabilizes; use manual functional testing in the interim.
- Complete per-surface accessibility checks and safe evidence across registration, sign-in, authoring, Task Form, and timeline. Deferred because no team currently owns manual accessibility verification and E2E work is paused.
- Exercise an actual repeated submission before asserting duplicate suppression. Deferred until E2E work resumes after the UI stabilizes.
- Qualify delayed Task save/completion success and absence of confirmation dialogs. Deferred until E2E work resumes after the UI stabilizes.
- Fail CI when required preview evidence artifacts are absent. Deferred with the preview E2E evidence gate while manual functional testing is used.
