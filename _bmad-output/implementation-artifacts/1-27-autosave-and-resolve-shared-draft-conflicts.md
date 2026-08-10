---
baseline_commit: 4d1f25d6d8c541c8ac4e2db90615ea1b2ea0df97
---

# Story 1.27: Save Explicitly and Resolve Shared-Draft Conflicts

Status: done

> **Superseded persistence behavior (2026-08-10):** The approved editor correction removes autosave and automatic retry. The optimistic revision, idempotency, conflict preservation, and concurrency safeguards delivered here remain valid. Story 1.36 replaces the frontend scheduler with explicit **Save draft**/`Ctrl/Cmd+S`, separates incomplete-draft persistence from publication readiness, and adds dirty-navigation protection.

## Story

As a Designer,
I want to decide when my Workflow/Form draft is saved against the latest shared revision,
so that incomplete work is preserved on demand without background errors or silent concurrent overwrites.

## Acceptance Criteria

1. **Save an incomplete coherent draft once per explicit command:** Given unsaved local authoring changes and the current server revision, when the Designer chooses **Save draft** or `Ctrl/Cmd+S`, then one immutable snapshot is submitted; the server accepts incomplete but structurally coherent work, increments the revision once, and returns the authoritative saved revision. No timer, change event, drag, blur, or navigation sends a background save. Traceability: FR222, FR223, FR227, FR235, UX-DR17.
2. **Reject stale writes without partial overwrite:** Given the server revision advanced because another user saved first, when the stale client submits its edit with `If-Match` or the current equivalent generated revision contract, then the whole save is rejected with a stable conflict code, no portion overwrites the shared draft, and the UI offers reload/reapply guidance. And a real-PostgreSQL concurrency test proves lost updates cannot occur. Traceability: FR226, FR227, FR235, AD-5.
3. **Retry only on explicit demand:** Given a recoverable offline or slow connection, when an explicit save has an unknown or failed outcome, then the UI keeps the local work, exposes unsaved/save-failed state, and offers an explicit retry using the same immutable payload and logical idempotency key. Changed content uses a new key, no automatic retry runs, and the UI reports saved only after server confirmation. Traceability: FR240, NFR25, UX-DR15, UX-DR17.

## Historical Tasks / Subtasks (Superseded Autosave Implementation Record)

> The checklists and review findings below document what Story 1.27 originally implemented. They are retained for auditability, not as current implementation instructions. Use the acceptance criteria above and Story 1.36 for the approved explicit-save behavior.

- [ ] Add backend support for autosave-safe draft writes without changing shared-draft invariants (AC: 1-3)
  - [ ] Keep `workflow_design` save behavior on the existing single mutable draft row and `select_for_update()` path in `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`; autosave must build on the current optimistic revision contract rather than bypass it.
  - [ ] Preserve the current stable conflict code `workflow_draft_revision_conflict` and safe stale-write guidance from `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`.
  - [ ] Decide whether to keep `expectedRevision` in the request body as the current generated-contract equivalent or to add `If-Match` consistently across DRF serializers, views, OpenAPI, generated client, and frontend. Do not mix two partially supported revision contracts.
  - [ ] Ensure idempotent replay for autosave retries: the same logical autosave attempt must reuse one idempotency key until it is accepted or superseded, and duplicate retries must not advance the draft twice.
  - [ ] Return only authoritative revision and draft payloads from the server. Do not emit browser-authoritative save success.

- [ ] Introduce frontend autosave orchestration on top of the shared draft reducer seam (AC: 1-3)
  - [ ] Extend `Moviqo.Front/src/features/workflow-design/model/editor.ts` so editor state tracks at minimum: dirty/clean state, last acknowledged revision, pending autosave request key, retry state, and conflict state distinct from validation errors.
  - [ ] Replace the current save-only flow in `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` with autosave scheduling that reacts to valid semantic draft changes, debounces rapid edits, and cancels or supersedes obsolete timers cleanly.
  - [ ] Keep autosave work in `useEffect` or a custom hook that synchronizes with the save endpoint as an external system; dependency handling must avoid duplicate loops or stale closures under React 19 development behavior.
  - [ ] Preserve the explicit `Save draft` affordance only if it remains useful as a “save now” trigger over the same autosave pipeline. Do not maintain a second conflicting persistence path.
  - [ ] Expose plain-language save states in the UI: saving, saved, unsaved changes, retrying, and conflict. Success must appear only after the authoritative response is applied.

- [ ] Preserve valid local work and offer safe conflict recovery (AC: 2-3)
  - [ ] When the server rejects a stale revision, keep the valid local draft in memory, mark the editor conflicted, and show reload/reapply guidance instead of discarding the local edit.
  - [ ] Add one explicit recovery path that reloads the latest authoritative draft and lets the user reapply or recreate the local change intentionally. Do not auto-merge graph, field, or publication changes silently in this story.
  - [ ] Ensure server sync from another accepted response does not overwrite in-progress local work unless the user explicitly resolves the conflict.
  - [ ] Keep checklist focus, field focus, and navigation continuity intact after conflict and retry states.

- [ ] Rework idempotency handling for retries instead of generating a fresh key on every save attempt (AC: 3)
  - [ ] Replace `createSaveIdempotencyKey()` per-attempt randomness in `Moviqo.Front/src/features/workflow-design/model/editor.ts` with a logical save-attempt identifier that survives retries for the same pending autosave.
  - [ ] Generate a new idempotency key only when the local semantic payload changes after a save attempt starts, or after a previously accepted/rejected attempt is conclusively replaced.
  - [ ] Keep publication validation request keys independent from autosave keys.
  - [ ] Do not reuse an old autosave idempotency key for a materially different draft payload.

- [ ] Make autosave apply only to valid semantic draft edits while preserving local form-entry ergonomics (AC: 1-3)
  - [ ] Review the current split between `fieldDraft` component state in `WorkflowDraftEditor.tsx` and `localDraft` reducer state. Decide whether field editing must write into reducer-managed draft state earlier so autosave can observe valid changes consistently.
  - [ ] Invalid partial field inputs may remain local-only until they become valid, but once an edit is valid and part of the semantic draft, autosave must persist it without requiring a separate click.
  - [ ] Preserve current graph, process-field, form-binding, starter, and assignment semantics from Stories 1.22 through 1.26. Autosave must not change what constitutes a valid draft; it only changes when valid edits are persisted.
  - [ ] Keep frontend functions in `Moviqo.Front/src/**/*.{ts,tsx}` as arrow-function constants per `AGENTS.md`.

- [ ] Add executable evidence for autosave timing, retries, and lost-update protection (AC: 1-3)
  - [ ] Add backend contract tests for autosave save success, stale revision conflict shape, retry replay under the same idempotency key, and any revision-header/body contract changes.
  - [ ] Add real-PostgreSQL integration coverage proving concurrent stale writes cannot partially overwrite the shared draft and that repeated autosave retries with one idempotency key produce at most one committed revision.
  - [ ] Add frontend unit coverage for debounced autosave scheduling, successful authoritative revision replacement, retry state persistence, conflict preservation, reload/reapply handling, and no false saved state before confirmation.
  - [ ] If practical in this story’s scope, add a narrow frontend integration or e2e slice that demonstrates autosave status transitions during a delayed response. Do not wait for Story 1.33 to cover the first autosave user journey at all.

### Review Findings

- [x] [Review][Patch] Save requests still send the prop-backed revision instead of the newly tracked acknowledged revision, so autosave can post a stale `expectedRevision` and raise a false conflict after an accepted save or reload. [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:131]
- [x] [Review][Patch] Retryable save failures requeue forever every two seconds with no terminal state or bounded retry policy, which can hammer the draft endpoint and leave the editor stuck in background retry. [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:167]
- [x] [Review][Patch] The client treats `idempotency_key_reused` as a retryable generic error instead of a terminal save conflict, so a permanent 409 can loop indefinitely without showing the correct recovery path. [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:135]
- [x] [Review][Patch] Story 1.27 still lacks the required real-PostgreSQL lost-update proof: the new integration test is sequential idempotency replay coverage, not concurrent stale-write coverage. [Moviqo.Back/tests/integration/test_workflow_design_integration.py:235]
- [x] [Review][Patch] Frontend coverage still stops at reducer transitions and does not exercise the autosave effect timing, retry loop, or the post-reload save path through the mounted editor, so the highest-risk behavior remains unverified. [Moviqo.Front/tests/unit/workflow-design-create.test.cts:302]

## Historical Dev Notes (Superseded Autosave Implementation Record)

> References to autosave, debouncing, scheduled retries, and background synchronization below describe the prior delivered implementation. They must not be carried into the corrected editor.

### Story intent and scope

- Story 1.27 is the shared-draft safety layer on top of Stories 1.21 through 1.26.
- The core objective is not “background save” in isolation. It is protecting the one mutable shared draft from silent overwrites while keeping valid designer work durable across navigation and recoverable connectivity failures.
- This story must not add collaborative live editing, automatic merge, lease takeover, publication, runtime Process behavior, or version-history semantics. Those belong to later Epic 4 and Epic 9 stories.

### Current implementation baseline to preserve

- Backend save and validation already use optimistic revision checks and atomic command handling in `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`.
- Draft writes already lock the shared draft row with `select_for_update()` and reject stale revisions with `workflow_draft_revision_conflict`.
- The current save endpoint requires `Idempotency-Key` and `expectedRevision`, and the publication-validation endpoint already follows the same backend-authoritative contract style.
- Frontend editor state in `Moviqo.Front/src/features/workflow-design/model/editor.ts` is still explicit-save driven. `saveStatus` exists, but there is no autosave timer, retry queue, persisted pending-save key, or dedicated conflict-recovery flow.
- `createSaveIdempotencyKey()` currently generates a fresh random key for each save attempt. That is incompatible with AC3 retry semantics and must change.
- `WorkflowDraftEditor.tsx` syncs authoritative server data through `onAccepted()` and `server-synced`, but it currently resets from the latest server state whenever there are no local changes and does not provide explicit reload/reapply conflict resolution.
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts` already models authoritative revision replacement and stale acceptance detection. Reuse this seam rather than inventing a second revision model.

### Requirements and architecture guardrails

- Follow FR229 and AD-5: there is exactly one shared mutable draft per Workflow.
- Follow FR235: autosave is for the shared draft itself, not a browser-only cache.
- Follow FR226 and FR227: stale writes must fail cleanly and guide the user toward correction; they must not overwrite any portion of the shared draft.
- Follow FR240 and NFR25: recoverable network failure must preserve valid local work and keep retries idempotent.
- Follow AD-3: one autosave command still commits one authoritative draft change, audit, and idempotency result in one transaction.
- Follow AD-7 and AD-9: the browser may surface save state and local validation, but the server remains authoritative for revision acceptance and conflict decisions.
- Follow AD-16: start with failing tests for autosave retry replay and stale-write protection before changing the save pipeline.

### Likely backend files to update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`

### Likely frontend files to update

- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `Moviqo.Front/tests/unit/draft-state.test.cts`

### Concrete backend guidance

- Keep `save_workflow_draft()` as the only write path for draft autosave in this story. Do not add a second persistence endpoint unless the contract absolutely requires it.
- If the current `expectedRevision` body field remains the contract-equivalent for `If-Match`, document that explicitly in the OpenAPI and keep frontend/backend naming consistent.
- Preserve the current no-partial-write behavior:
  - stale revision => reject entire save;
  - invalid draft => reject entire save;
  - accepted save => revision increments exactly once.
- Add concurrency coverage with two save attempts against the same starting revision so one succeeds and the other receives the stable conflict response without mutating persisted draft state.
- Ensure retry replay with identical payload and idempotency key returns the stored success result rather than creating revision `N+2`.

### Concrete frontend guidance

- Autosave should trigger from valid semantic draft changes, not from every keystroke in every transient local field widget.
- Prefer one debounced autosave coordinator near the editor root instead of scattering save effects across field sections.
- Track enough state to render these user-facing outcomes clearly:
  - `Unsaved changes`
  - `Saving...`
  - `Saved`
  - `Retrying save...`
  - `Another person saved first. Reload the latest draft and reapply your change.`
- Keep messages plain-language and Spanish-first with English fallback, consistent with `EXPERIENCE.md` voice and tone.
- Do not discard valid local work on recoverable network failure.
- Do not report saved state before the authoritative response has been applied to `draftState`.
- Preserve current publication-checklist and focus-target behavior after save, retry, and conflict transitions.

### Testing requirements

- Backend contract tests should prove:
  - missing idempotency key still fails safely;
  - stale revision still maps to `workflow_draft_revision_conflict`;
  - replay with the same autosave key and identical payload returns one logical result;
  - changed payload under the same autosave key still conflicts as `idempotency_key_reused`.
- Real-PostgreSQL integration tests should prove:
  - exactly one accepted revision increment under concurrent saves from the same starting revision;
  - the losing save returns the stable stale-write error;
  - retrying the same autosave after a transient failure does not produce duplicate revisions or audit events.
- Frontend unit tests should prove:
  - autosave is scheduled after valid draft changes and not after no-op syncs;
  - authoritative success clears dirty state and updates revision;
  - a transient failure leaves dirty state and pending retry intent intact;
  - a stale-write conflict preserves the local draft and enters a conflict state instead of resetting from the server;
  - a user-driven reload/reapply path restores authoring momentum without silently merging.

### Latest technical information

- React’s current `useEffect` guidance still frames Effects as synchronization with external systems and emphasizes correct dependency lists and cleanup behavior. That fits the autosave scheduler well: model it as one external synchronization process rather than ad hoc timers spread across event handlers. Source checked August 5, 2026: https://react.dev/reference/react/useEffect
- React’s current `<input>` guidance still requires controlled inputs to remain consistently controlled and to provide `onChange` for mutable controlled fields. That matters if autosave work refactors the current `fieldDraft` flow. Source checked August 5, 2026: https://react.dev/reference/react-dom/components/input
- Django 5.2 documentation currently states that 5.2 supports Python 3.14 as of 5.2.8. Keep this story on the repository’s Django 5.2 line rather than mixing framework upgrades into autosave work. Source checked August 5, 2026: https://docs.djangoproject.com/en/5.2/releases/5.2/
- PostgreSQL’s current locking docs state that `SELECT ... FOR UPDATE` locks retrieved rows against concurrent writers and lockers until transaction end. This aligns with the existing `select_for_update()` draft-write path and should remain the concurrency guardrail for lost-update protection. Source checked August 5, 2026: https://www.postgresql.org/docs/current/explicit-locking.html

### Anti-patterns and out-of-scope work

- Do not introduce WebSockets, live collaborative cursors, or automatic merge in this story.
- Do not add browser-only draft persistence as the source of truth.
- Do not bypass optimistic revision checks because autosave is “automatic.”
- Do not generate a fresh idempotency key for every retry of the same logical autosave attempt.
- Do not silently replace local unsaved work with the latest server response after a conflict.
- Do not broaden this story into Workflow publication, Team claiming, runtime Task save, or active-Process version handling.

### Project Structure Notes

- Keep shared-draft orchestration in `Moviqo.Front/src/features/workflow-design/` and the shared revision primitives in `Moviqo.Front/src/shared/drafts/`.
- Keep all backend draft-write logic inside `workflow_design` application services and views.
- Maintain frontend arrow-function constants for new implementation code in `Moviqo.Front/src/**/*.{ts,tsx}`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.21, Story 1.26, Story 1.27, Story 1.28]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR222, FR223, FR226, FR227, FR229, FR235, FR240, NFR25]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-3, AD-5, AD-7, AD-9, AD-16; HTTP; Mutation; Tests; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Voice and Tone; State Patterns; Interaction Primitives; Flow 1]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`]
- [Source: `_bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/editor.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/draft.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
- [Source: `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`]
- [Source: `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`]
- [Technical reference: React docs, https://react.dev/reference/react/useEffect]
- [Technical reference: React docs, https://react.dev/reference/react-dom/components/input]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/releases/5.2/]
- [Technical reference: PostgreSQL docs, https://www.postgresql.org/docs/current/explicit-locking.html]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `python _bmad/scripts/resolve_customization.py --skill .agents/skills/bmad-create-story --key workflow`
- `Get-Content .agents/skills/bmad-create-story/discover-inputs.md`
- `Get-Content .agents/skills/bmad-create-story/template.md`
- `Get-Content .agents/skills/bmad-create-story/checklist.md`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`
- `Get-Content _bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Get-Content Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "autosave|save status|If-Match|etag|revision|conflict|idempotency|save draft|unsaved|retry" Moviqo.Back/src/moviqo/modules/workflow_design Moviqo.Back/tests Moviqo.Front/src/features/workflow-design Moviqo.Front/src/pages/workflow-create Moviqo.Front/tests`
- `web.open https://react.dev/reference/react/useEffect`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://docs.djangoproject.com/en/5.2/releases/5.2/`
- `web.open https://www.postgresql.org/docs/current/explicit-locking.html`
- `git status --short`
- `git branch --show-current`
- `git switch -c story/1-27-autosave-and-resolve-shared-draft-conflicts`
- `python _bmad/scripts/resolve_customization.py --skill .agents/skills/bmad-dev-story --key workflow`
- `Get-Content _bmad/bmm/config.yaml`
- `npm run test:unit`
- `uv sync --frozen`
- `uv run pytest tests/contract/test_workflow_design_contract.py tests/integration/test_workflow_design_integration.py`
- `. .\scripts\use-integration-env.ps1; uv run pytest tests/integration/test_workflow_design_integration.py --ds=moviqo.settings.integration`

### Completion Notes List

- Created the Story 1.27 implementation guide with repository-specific autosave, retry, stale-write, and idempotency guardrails.
- Anchored the story to the current explicit-save editor and existing backend optimistic revision contract instead of proposing a parallel draft-write path.
- Captured the main implementation gap from Story 1.26: autosave orchestration and conflict recovery are still missing, and per-attempt random idempotency keys must be replaced for retry safety.
- Marked Story 1.27 as ready for development in sprint tracking.
- Added frontend autosave state orchestration, retry-safe logical autosave keys, and explicit conflict reload/reapply handling without introducing a second save endpoint.
- Added frontend unit coverage for autosave key reuse, retry persistence, and conflict-preserving reload/reapply behavior.
- Added backend contract and integration coverage proving accepted save replay under one idempotency key and rejecting changed payload reuse as `idempotency_key_reused`.
- Verified `npm run test:unit` in `Moviqo.Front` and `uv run pytest tests/contract/test_workflow_design_contract.py tests/integration/test_workflow_design_integration.py` in `Moviqo.Back` under test settings.
- Attempted real PostgreSQL integration coverage with `moviqo.settings.integration`, but the suite timed out twice after collection with no per-test completion output, so AC2's runtime concurrency proof is still pending environment-level verification.

### File List

- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `_bmad-output/implementation-artifacts/1-27-autosave-and-resolve-shared-draft-conflicts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-05: Created Story 1.27 and marked it ready for dev.
- 2026-08-05: Began Story 1.27 implementation, added autosave/conflict handling code and tests, and left the story in-progress pending real PostgreSQL concurrency verification.
