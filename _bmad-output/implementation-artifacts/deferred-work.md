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
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-streamline-workflow-authoring.md`
  summary: Complete the routed Form Designer so every selected Task can create and maintain its own form bindings.
  evidence: Workflow Properties already routes a selected Task ID to the Form Designer, but the destination page remains the pre-existing reserved placeholder. Publication readiness can identify Task-specific missing forms, while authoring those forms remains owned by the unfinished Form Designer capability.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md`
  summary: Make Workflow edge-label placement viewport-aware at every canvas boundary after pan, zoom, and fit.
  evidence: Existing placement uses flow-space midpoint heuristics and does not measure final screen clearance at the left, right, top, or bottom overflow boundary.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md`
  summary: Define a product policy for visually presenting arbitrarily long connector labels.
  evidence: Connection labels have no contract length limit, while a compact finite canvas must choose between visual truncation, expansion, or an explicit detail affordance.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md`
  summary: Stabilize the existing Firefox Workflow pointer-drag connection journey.
  evidence: Firefox passed the new header and label geometry scenarios but intermittently created only one of two edges at the pre-existing manual pointer-drag step; the 44px Handle geometry is unchanged and Chromium passes the same gesture.

## Deferred from: code review of `1-37-establish-the-dedicated-schema-driven-form-designer.md` (2026-08-13)

- Distinguish a workflow-catalog request failure from an empty catalog. The launcher currently treats `catalogQuery.isError` as the no-workflows state and can show onboarding/create guidance after network or authorization failure; this behavior predates Story 1.37 and should be addressed in the catalog experience rather than folded into the Form Designer implementation.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-37-fix-postgresql-form-authoring-lease-lock.md`
  summary: Define and enforce how active Form leases constrain generic Workflow draft saves and publication requests.
  evidence: The dedicated Task Form save verifies a lease token, while the general draft and publish paths can persist caller-supplied `formBindings` and `processFields` without Form lease context; closing that bypass requires an intentional API and lease-policy decision beyond this approved lock/UX correction.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-37-fix-postgresql-form-authoring-lease-lock.md`
  summary: Define safe same-session multi-tab ownership and release semantics for Form authoring leases.
  evidence: Same-session acquisition intentionally returns the existing token, so two tabs can share authority and either tab's unmount release can revoke the still-open tab; resolving this requires a per-tab identity, reference-counting, or a changed release policy.
- source_spec: `_bmad-output/implementation-artifacts/spec-show-workflow-publish-blockers.md`
  summary: Preserve actionable API problem targets longer than 64 characters across the shared client normalizer.
  evidence: `normalizeApiProblem` currently replaces longer valid target names with `nonFieldErrors`; changing the shared API-client contract is explicitly outside this spec without user approval.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-37-allow-blank-short-text-label.md`
  summary: Carry publication issue binding identity into the Form Designer and select/focus the exact affected item.
  evidence: The existing publication checklist navigation passes only the Task element ID, so any Form issue on a later binding opens the Task form with its first item selected.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-38-my-work-tabs.md`
  summary: Bound process-start requests so a non-settling endpoint cannot leave the Start Process module indefinitely locked.
  evidence: The existing start command awaits the transport without an application timeout, so a request that never settles leaves the pending UI active until the browser or network stack aborts it.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-38-my-work-tabs.md`
  summary: Prevent a late successful process-start response from redirecting after the user has navigated away.
  evidence: The existing asynchronous start handler calls navigate after success without checking whether its page is still mounted, so a user who leaves during the request can be redirected from the newer destination.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-38-scalable-my-work-experience.md`
  summary: Paginate and prefetch the authorized process read model before projecting per-process workflow, audit, task, and contribution data.
  evidence: The pre-existing process collection materializes and enriches every authorized process before Django pagination, creating an unbounded N+1 query path as process history grows.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-38-scalable-my-work-experience.md`
  summary: Query an authorized process detail directly instead of scanning every process visible to the viewer.
  evidence: The pre-existing detail lookup reuses the full process-summary loader and iterates all authorized summaries before matching the requested process ID.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-38-scalable-my-work-experience.md`
  summary: Paginate authorized Task occurrences before loading and projecting authoritative workflow documents.
  evidence: The pre-existing Task collection resolves every open assignment and its Workflow snapshot before slicing the requested 12-row page, so request cost grows with the full inbox.
