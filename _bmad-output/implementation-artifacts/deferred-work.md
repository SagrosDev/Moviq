- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Classify permanent Resend HTTP failures as non-retryable delivery errors.
  evidence: Existing outbox retry logic treats all provider failures alike; HTTP 400/401/403/404/422 should not consume repeated attempts, while 408/429/5xx remain retryable.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-resend-error-diagnostics.md`
  summary: Add a stable Resend idempotency key derived from the outbox message ID.
  evidence: Existing ambiguous network retries can duplicate an email if Resend accepted the POST before the client observed a timeout.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-33-synthetic-membership-rls.md`
  summary: Make nested tenant context managers restore prior PostgreSQL session-local role and tenant settings.
  evidence: Existing `SET LOCAL` values outlive savepoint-scoped context managers inside a caller-owned transaction, so nested bootstrap/background contexts can affect later queries until the outer transaction ends; production request paths currently call this lookup without an ambient transaction.

## Deferred from: code review of the superseded planning record `superseded-1-34-qualify-the-stakeholder-preview-experience.md` (2026-08-10)

These items are not outstanding work for the active Story 1.34. Compatibility, responsive, localization, and accessibility evidence routes to Story 10.7; failure and operability evidence routes to Story 10.8; final exact-build Gate 1 evidence routes to Story 10.9.

- Complete and record the bilingual manual keyboard accessibility baseline across registration, sign-in, workflow authoring, Task Form, and Process timeline. Deferred because no team currently owns manual accessibility verification and delivery capacity is being prioritized toward a functional stakeholder preview; AC2 remains partially unmet.
- Run the Spanish and English deployed Playwright journey against the exact Story 1.34 commit and retain safe evidence. Deferred until the UI stabilizes because further E2E maintenance is paused; manual functional testing is the interim approach and the automated release evidence remains incomplete.
- Localize the English deployed-journey workflow-create locator. Deferred until the UI stabilizes because E2E maintenance is paused in favor of manual functional testing.
- Preserve the Story 1.33 deployed Playwright project name while adding English coverage. Deferred with the E2E configuration work until the UI stabilizes.
- Add bilingual mobile qualification for registration, authentication, My Work, and Task Form. Deferred until the UI stabilizes; use manual functional testing in the interim.
- Complete per-surface accessibility checks and safe evidence across registration, sign-in, authoring, Task Form, and timeline. Deferred because no team currently owns manual accessibility verification and E2E work is paused.
- Exercise an actual repeated submission before asserting duplicate suppression. Deferred until E2E work resumes after the UI stabilizes.
- Qualify delayed Task save/completion success and absence of confirmation dialogs. Deferred until E2E work resumes after the UI stabilizes.
- Fail CI when required preview evidence artifacts are absent. Deferred with the preview E2E evidence gate while manual functional testing is used.

## Deferred from: code review of `1-35-separate-the-application-modules-and-establish-authoring-navigation.md` (2026-08-11)

- Localize the pre-existing server-owned runtime labels and summaries rendered by My Work and Process Detail. The current API supplies English availability, involvement, and contribution strings that appear verbatim in the Spanish interface; this behavior predates Story 1.35 and should be corrected through a deliberate localized response contract rather than folded into the routing change.
- Paginate authorized My Work querysets before materializing every matching Task and Workflow. The existing dashboard reader loads full authorized collections before applying the newly exposed page slices; this pre-existing scaling cost should be addressed as a dedicated query-performance change.

- source_spec: `_bmad-output/implementation-artifacts/spec-authenticated-workspace-ux.md`
  summary: Replace server-owned English process involvement and contribution labels with stable localized values.
  evidence: Existing My Work process cards and the new table render API-provided `involvement` and `contributionSummary.label` strings verbatim, which produces mixed-language Spanish screens.
- source_spec: `_bmad-output/implementation-artifacts/spec-authenticated-workspace-ux.md`
  summary: Distinguish an empty process history from searches or later pages that contain no matches.
  evidence: Existing process state handling uses the same first-use empty message whenever the current collection has zero items, even when search or pagination is active.
- source_spec: `_bmad-output/implementation-artifacts/spec-authenticated-workspace-ux.md`
  summary: Format process timestamps with the selected Moviqo language and clarify last-activity timestamp authority.
  evidence: Existing formatting follows the browser locale and prefers `completedAt` over `lastActivityAt` under a “Last activity” label.
- source_spec: `_bmad-output/implementation-artifacts/spec-authenticated-workspace-ux.md`
  summary: Announce My Work pagination results and restore deliberate focus after page changes.
  evidence: Existing pagination replaces the collection above the focused control without a result announcement or focus transition for keyboard and screen-reader users.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-task-names-compact-nodes.md`
  summary: Preserve actionable backend Workflow save-validation reasons in localized recovery guidance.
  evidence: The pre-existing controller maps every server `invalidParam` to one generic message, so distinct graph, configuration, and schema failures lose their specific correction guidance.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-persist-compact-canvas-layout.md`
  summary: Rebase conflict snapshots onto the latest Workflow draft instead of replacing it wholesale.
  evidence: Existing reload/reapply restores the entire stale local document, so concurrent graph or configuration changes can be overwritten; persisted canvas layout now shares that pre-existing recovery behavior.
