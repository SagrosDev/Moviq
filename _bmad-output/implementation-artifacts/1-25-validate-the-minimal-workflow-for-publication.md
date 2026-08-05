---
baseline_commit: 4078b1eb54e785ef0c7e96d1e2f0aa84b443e563
---

# Story 1.25: Validate the Minimal Workflow for Publication

Status: done

## Story

As a Designer,
I want a plain-language publish checklist for the first Workflow,
so that I can repair blocking graph, Form, and assignment issues without losing my draft.

## Acceptance Criteria

1. **Return deterministic blocking issues for invalid publication attempts:** Given a draft missing a valid starter, Task assignment, Start-Task-End path, required field binding, or valid Task Form, when publication validation runs, then the backend returns deterministic blocking issue rows with stable codes, affected element or field IDs, localized explanations, and direct configuration targets. And no published version is created. Traceability: FR624, FR625, FR626, FR627, FR630, UX-DR10.
2. **Apply backend-owned minimal Form publication rules:** Given hidden, disabled, empty, or informational Form content, when the minimal Form is evaluated for publication, then the checklist applies the PRD input, required, and content rules and warns when hidden content would make the Task misleading or impossible. And the rule result comes from the backend validator rather than UI-only logic. Traceability: FR625, FR626, FR627, FR630, AD-6.
3. **Preserve draft work and support repeat validation:** Given validation issues exist, when the Designer follows an issue link, corrects the draft, navigates away, reconnects after a recoverable failure, and validates again, then valid draft work is preserved, saving and retry state is explicit, resolved issues disappear, and no completion or publication success appears before server confirmation. And the shared draft remains the only editable draft. Traceability: FR632, UX-DR10, UX-DR17.

## Tasks / Subtasks

- [x] Add a draft-only publication-validation backend seam under `workflow_design` that reports stable issue rows without creating any published artifact (AC: 1-2)
  - [x] Introduce one application service dedicated to publication validation instead of overloading `save_workflow_draft`, because save-time graph validation and publish-time readiness validation are related but not the same contract.
  - [x] Keep this in `Moviqo.Back/src/moviqo/modules/workflow_design/`; do not move validation authority into `workflow_runtime` or the SPA.
  - [x] Return a deterministic ordered list of checklist issues with stable machine codes, safe `invalidParams`-style targets, and enough identifiers for the frontend to focus the relevant graph element, field, or future assignment/starter section.
  - [x] Explicitly guarantee that validation-only requests do not create `WorkflowVersion` rows, published snapshots, or any other immutable publication artifact in this story.

- [x] Encode the minimal publication rules for Epic 1 without absorbing Epic 3 or Story 1.26 scope (AC: 1-2)
  - [x] Validate the existing Start-Task-End graph readiness for publication, not only for save: the path must still be connected and terminating, and the first Task must remain the only bound Task for the Epic 1 slice.
  - [x] Validate that the first Task Form has at least one meaningful visible structured control backed by a reusable Process Field and that decorative-only, empty, orphaned, or missing bindings block publication.
  - [x] Represent missing starter and missing assignment as explicit checklist blockers with stable target identifiers, even though the actual configuration UI belongs to Story 1.26.
  - [x] Defer informational-only controls, conditional visibility engines, disabled-state rule evaluation, complex layout containers, and full cross-field/rule dependency validation to later epics. Do not invent those semantics here.

- [x] Expose a workflow-design API contract for checklist validation and safe retries (AC: 1-3)
  - [x] Add one authenticated `/api/v1` endpoint under the existing workflow-design routes for publication validation with designer-capable authorization, tenant-safe not-found behavior, and generated OpenAPI coverage.
  - [x] Reuse the repository's Problem Details patterns for malformed requests and authorization failures, but return successful validation responses as authoritative checklist payloads rather than as client-side heuristics.
  - [x] Keep idempotency and retry semantics explicit where they matter for the command boundary, and ensure recoverable failures do not mutate the shared draft revision.
  - [x] Preserve safe target names so issue references remain visible through the existing `problem_details` sanitization rules or the new response contract.

- [x] Add a plain-language publish checklist to the existing workflow editor flow and reuse established UI patterns (AC: 1-3)
  - [x] Extend `Moviqo.Front/src/features/workflow-design/` with a dedicated checklist model and API call instead of burying publish-validation state in page-local ad hoc variables.
  - [x] Reuse the existing publish-checklist/status-badge visual language from the design-system catalog and current CSS patterns instead of creating a new warning surface from scratch.
  - [x] Surface blocking issues, warning rows, retry state, and direct configuration actions in plain language with Spanish-first localization and English fallback.
  - [x] Make issue navigation explicit and non-destructive: choosing an issue target should focus or reveal the relevant workflow editor section without discarding unsaved valid local work.
  - [x] Do not show publication success, completed status, or immutable-version language in this story. This is validation readiness only; Story 1.28 owns actual publication.

- [x] Add executable coverage for validation determinism, draft preservation, and checklist UX (AC: 1-3)
  - [x] Add backend unit coverage for publication-rule evaluation, issue ordering, stable codes, and target generation for graph, form, starter, and assignment blockers.
  - [x] Add backend contract tests for the new endpoint, designer authorization, tenant-safe denials, deterministic issue rows, and the "no published version created" guarantee.
  - [x] Add real-PostgreSQL integration tests proving validation does not mutate draft revision or document state, repeated identical validation stays deterministic, and corrected drafts clear resolved issues on the next validation.
  - [x] Add frontend unit coverage for checklist rendering, retry and loading states, issue-link focus behavior, disappearance of resolved issues after authoritative revalidation, and preservation of local edits during validation failures or reconnect paths.

### Review Findings

- [x] [Review][Patch] Publication validation can never return `publishable=true` because `starter_missing` and `assignment_missing` are appended unconditionally and the validated draft shape contains no data that could ever clear them. [Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py:29]
- [x] [Review][Patch] Publication validation skips `validate_workflow_graph_document(...)` and only runs `dump_current_draft(...)`, so save-invalid drafts can still receive a `200` checklist response instead of `workflow_draft_invalid`. [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:479]
- [x] [Review][Patch] The frontend accepts publication-validation responses without checking that they still match the current editor revision or request, so a late response can overwrite the checklist with stale results after local edits or a save. [Moviqo.Front/src/features/workflow-design/model/editor.ts:370]
- [x] [Review][Patch] `server-synced` preserves `publicationStatus`, `publicationErrorCode`, and `publicationIssues` across authoritative draft replacement, which can leave checklist blockers visible for a different server revision than the draft currently on screen. [Moviqo.Front/src/features/workflow-design/model/editor.ts:67]
- [x] [Review][Patch] Checklist issue navigation ignores `elementId`, `fieldId`, and `bindingId` and only focuses section headings, so issue actions do not direct the designer to the exact place to repair the draft. [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:456]
- [x] [Review][Patch] Checklist messages and action labels are hardcoded in English server literals and rendered directly, bypassing the Spanish-first localization contract required by the story. [Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py:31]
- [x] [Review][Patch] The new integration test still calls `validate_workflow_publication(...)` with the old signature and omits the now-required `expected_revision` and `draft` arguments, so that test path will fail once the integration slice executes it. [Moviqo.Back/tests/integration/test_workflow_design_integration.py:480]

## Dev Notes

### Story intent and scope

- Story 1.25 introduces publication-readiness validation, not publication itself.
- The backend already rejects malformed draft saves in Story 1.21 through 1.24, but there is no dedicated publication checklist contract yet.
- This story must create the plain-language validation seam that later stories reuse:
  - Story 1.26 will add real starter and assignment configuration;
  - Story 1.27 will add autosave/conflict handling on top of the shared draft;
  - Story 1.28 will append immutable published versions and must depend on the same validation contract instead of re-inventing one.
- Because Story 1.26 follows immediately after this one, do not absorb full starter or assignment authoring here. Emit stable issue targets that 1.26 can attach to.

### Current implementation to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` already validates the minimal Epic 1 graph and the Story 1.24 `formBindings` control shape at save time.
- `save_workflow_draft` in `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` already:
  - locks the shared draft row,
  - validates candidate documents,
  - increments revision exactly once on acceptance,
  - records semantic audit for accepted graph changes,
  - records rejected-save audit without mutating the draft.
- `WorkflowDefinition` and `WorkflowDraft` are the only workflow-design persistence models today. There is no `WorkflowVersion` or publication snapshot model in the repository yet.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` already manages guided Start/Task/End and first-field composition with local reducer state, authoritative save, and localized error rendering.
- `Moviqo.Front/src/shared/ui/catalog.tsx` and `Moviqo.Front/src/app/styles.css` already define a `PublishChecklist` surface and `StatusBadge` styling. Reuse those patterns for real checklist rows.

### Publication-validation requirements to carry forward

- FR222 and FR226: validation must be actionable, readable, and timed at the right moment; the checklist cannot be a vague generic error.
- FR223: the workflow must still be a valid connected path that reaches End.
- FR227: an invalid draft remains editable rather than blocked behind a failed publication attempt.
- FR624: each active Task needs exactly one meaningful Form for this Epic 1 slice.
- FR625 and FR626: publication must reject empty or decorative-only Form content.
- FR627: every Form control reference must resolve to a valid structured field/binding combination.
- FR630: the Form's constraints must remain internally consistent at publication time, not just at save time.
- FR632 and UX-DR17: validation, retry, reconnect, and navigation must preserve valid draft work and never imply success before the server confirms it.
- UX-DR10: publish checklist rows must use plain language and direct the Designer to the exact place to fix the issue.

### Architecture guardrails

- Follow AD-1: publication readiness belongs to `workflow_design`; do not reach into `workflow_runtime` or another module's internals for checklist results.
- Follow AD-3: if validation runs as a command-like boundary, keep any audit/idempotency behavior coordinated in one application boundary and never chain independent HTTP calls to emulate publication.
- Follow AD-4: the draft remains the mutable JSONB control plane. Do not invent per-checklist persistence tables unless they are clearly necessary; prefer deterministic evaluation from the authoritative draft.
- Follow AD-5: this story must not create mutable published history or version state. Validation and publication must remain distinct steps.
- Follow AD-6: backend rule ownership matters. The frontend may present checklist state, but it cannot decide whether a draft is publishable.
- Follow AD-7 and AD-9: generated `/api/v1` contracts and backend-authoritative state remain the source of truth; the checklist UI is a projection of server results.
- Follow AD-16: add failing tests first for the new validation service, endpoint, and UI checklist behavior.

### Concrete backend guidance

- Add a dedicated publication-validation service, likely alongside the existing workflow-design application services, rather than burying more conditionals inside `validate_workflow_graph_document`.
- Keep save-time document normalization in `schema.py`, but consider a separate publication evaluator for rules that are about readiness rather than shape validity.
- The evaluator should return deterministic rows with a structure close to:
  - issue code,
  - severity or blocking state,
  - safe target identifier,
  - optional `elementId`, `fieldId`, or `bindingId`,
  - localized or localization-ready explanation text.
- Issue order must be stable so the checklist does not jump between retries for the same unchanged draft.
- Missing starter and assignment blockers should target reserved workflow-design sections now, even if those sections are placeholders until Story 1.26.
- No publication snapshot or version sequence belongs in this story. The service should answer "is this draft publish-ready?" and "what blocks it?", nothing more.

### Concrete frontend guidance

- Keep route composition where it is; this story should extend the existing workflow-create/editor path rather than adding a separate publication page.
- Add checklist state in the workflow-design feature slice, not in `App.tsx` or page-local imperative code.
- Reuse the current controlled-input editor model. React's official `input` guidance still requires controlled inputs to pair `value` with synchronous `onChange`, and labels must stay associated with inputs; keep that pattern when issue links focus editable controls. Source crawled August 5, 2026.
- Reuse the design-system `PublishChecklist` and `StatusBadge` visual patterns in `shared/ui/catalog.tsx` and `app/styles.css`.
- Keep the language patient and concrete:
  - good: "We need one more detail before publishing."
  - avoid: "Invalid graph configuration."
- If validation fails while unsaved local changes exist, do not silently replace the local editor state with stale server data. The Designer must be able to correct and retry intentionally.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- a new helper such as `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- new workflow-design unit tests for validation-rule evaluation
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/ui/catalog.tsx`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`

### Testing requirements

- Backend unit tests should cover:
  - missing starter blocker,
  - missing assignment blocker,
  - disconnected path blocker,
  - missing or orphaned first-task binding blocker,
  - empty or decorative-only Form blocker,
  - stable ordering and code values for repeated validation of the same draft.
- Backend contract tests should prove:
  - only owner, administrator, and designer roles can validate publication readiness,
  - the response uses stable target names and issue codes,
  - cross-tenant or guessed workflow identifiers fail closed,
  - no publication artifact appears after validation.
- Integration tests should prove:
  - validation does not advance the shared draft revision,
  - a corrected draft clears previously returned issues,
  - repeated identical validation returns the same ordered issue rows,
  - validation and save remain compatible with the existing shared-draft locking model.
- Frontend unit tests should prove:
  - checklist rows render blocked versus warning state clearly,
  - issue actions reveal or focus the right editor section,
  - retry and recoverable-failure states remain explicit,
  - resolved issues disappear only after the authoritative server response,
  - local valid edits are not discarded by validation failures or reconnect flows.

### Latest technical information

- The repository still aligns with React `19.2.7` and Django `5.2.15`; do not couple this story to dependency upgrades.
- React's official `input` reference, crawled on August 5, 2026, still states that controlled inputs require a `value` prop plus an `onChange` handler that synchronously updates the backing value, and that labels must remain associated with inputs for accessibility.
- React's official React 19 announcement remains the relevant stable-major guidance for this frontend; keep the reducer-driven, backend-authoritative editor model already established in the repo rather than introducing a different form stack here.
- Django's official 5.2 release notes remain aligned with the pinned backend line in this repository. Keep the new workflow-design endpoint and serializer work on the current Django/DRF stack instead of mixing a framework upgrade into the story.
- Inference from the sources above plus AD-6 and AD-9: the safest implementation is a backend-owned validation endpoint with a controlled, localized checklist UI, not a browser-only publishability engine.

### Git intelligence

- The most recent relevant commit is the merge of Story 1.24 on August 4, 2026. The current repository state already contains the minimal task-form design/runtime seam that this story must validate for publication readiness.
- The other recent August 4, 2026 commits are test and pipeline fixes, which means the strongest implementation signal comes from the merged Story 1.24 code paths and tests rather than from speculative new architecture.
- Preserve the current pattern of authoritative backend responses, reducer-managed frontend state, and focused contract/integration coverage.

### Anti-patterns and out-of-scope work

- Do not implement immutable publication, version sequencing, or snapshot persistence here; Story 1.28 owns that.
- Do not implement starter or assignment authoring controls here; Story 1.26 owns those, but this story must emit checklist blockers and targets for them.
- Do not make the publish checklist UI authoritative for graph or Form validity.
- Do not create a second editable draft, client-side publish shadow state, or localStorage-based recovery path.
- Do not treat "validation passed" as equivalent to "published."
- Do not add Epic 3 semantics such as informational controls, hidden-state rule engines, layout containers, or cross-field validation just to make the checklist feel more complete than the current scope.

### Project Structure Notes

- Keep workflow authoring in `Moviqo.Front/src/features/workflow-design/` and route composition in `Moviqo.Front/src/pages/`.
- Keep the new backend validation seam under `workflow_design`; there is still no justification to spread publication readiness across modules.
- Reuse shared UI and localization infrastructure instead of creating one-off checklist components or message stores.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.24, Story 1.25, Story 1.26, Story 1.27, Story 1.28]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR222, FR223, FR226, FR227, FR624, FR625, FR626, FR627, FR630, FR632, UX-DR10, UX-DR17]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-1, AD-3, AD-4, AD-5, AD-6, AD-7, AD-9, AD-16; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Voice and Tone; Component Patterns; State Patterns; Interaction Primitives; Accessibility Floor; Flow 1]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/editor.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
- [Source: `Moviqo.Front/src/shared/ui/catalog.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `Moviqo.Front/src/app/styles.css`]
- [Source: `Moviqo.Front/tests/unit/workflow-design-create.test.cts`]
- [Technical reference: React docs, https://react.dev/reference/react-dom/components/input]
- [Technical reference: React docs, https://react.dev/blog/2024/12/05/react-19]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/releases/5.2/]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `Get-Content .agents/skills/bmad-create-story/customize.toml`
- `Get-Content .agents/skills/bmad-create-story/discover-inputs.md`
- `Get-Content .agents/skills/bmad-create-story/template.md`
- `Get-Content .agents/skills/bmad-create-story/checklist.md`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content _bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Get-Content Moviqo.Back/src/moviqo/urls.py`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Front/src/shared/ui/catalog.tsx`
- `Get-Content Moviqo.Front/src/shared/localization/messages.ts`
- `Get-Content Moviqo.Front/src/app/styles.css`
- `Get-Content Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "publish|publication|validate|validation|checklist|starter|assignment|formBindings|controls|draft" Moviqo.Back/src/moviqo/modules/workflow_design Moviqo.Back/tests Moviqo.Front/src Moviqo.Front/tests`
- `rg -n "WorkflowVersion|publish|publication|published version|checklist|issue row|warning" Moviqo.Back/src Moviqo.Front/src Moviqo.Back/tests Moviqo.Front/tests`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://react.dev/blog/2024/12/05/react-19`
- `web.open https://docs.djangoproject.com/en/5.2/releases/5.2/`

### Completion Notes List

- Added a draft-only publication-validation command, evaluator, endpoint, and OpenAPI contract that validate unsaved local draft payloads against the current revision without mutating the shared draft or creating publication artifacts.
- Added deterministic backend checklist issue coverage for missing starter, missing assignment, disconnected path, missing first-task form content, and decorative-only controls, plus contract coverage for authorized validation access and stable response rows.
- Extended the workflow editor reducer and UI with publication checklist state, retry handling, stable target focus mapping, and bilingual checklist copy while preserving unsaved local edits during validation retries.
- Generated updated API artifacts in `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` for the new publication-validation route.

### File List

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Back/tests/unit/test_workflow_publication_validation.py`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `docs/api/openapi-v1.json`
- `_bmad-output/implementation-artifacts/1-25-validate-the-minimal-workflow-for-publication.md`

### Change Log

- 2026-08-05: Created Story 1.25 and marked it ready for dev.
- 2026-08-05: Implemented draft-only publication validation, updated the workflow editor checklist flow, added backend and frontend coverage, regenerated API artifacts, and marked the story ready for review.
