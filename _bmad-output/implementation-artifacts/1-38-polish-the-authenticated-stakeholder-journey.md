---
baseline_commit: 9f3ad04d28f993234d00d0cd0ef63e2165aab446
---

# Story 1.38: Polish the Authenticated Stakeholder Journey

Status: review

## Story

As a company stakeholder,
I want the authenticated thin journey to use the approved visual system and separated modules,
so that I can evaluate Moviqo's product value without unfinished interface quality or confusing navigation distracting from the workflow.

## Acceptance Criteria

1. **Apply the system across authenticated modules:** Mi trabajo with Tasks/Processes tabs, Start Process, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail/timeline compose the approved Story 1.34 primitives and Stories 1.35-1.37 architecture with consistent containers, spacing, typography, cards, statuses, breadcrumbs, empty states, and action bars. No browser-default or missing page-level control style remains.

2. **Present coherent module navigation:** Role-appropriate navigation clearly separates authoring from runtime. Workflow catalog/create/design, Task-to-Form design, validation/publication, Start Process, Task completion, and Process timeline transitions preserve user context and use predictable back/breadcrumb behavior without returning to unrelated combined pages.

3. **Make editor interactions self-evident:** Workflow and Form palette actions produce immediate visible selection/reveal and localized feedback. Canvas/palette/properties hierarchy is clear, disabled operations explain why when necessary, save/conflict status remains persistent, and action priority does not resemble an undifferentiated button wall.

4. **Prioritize authorized work and progress:** Mi trabajo opens directly on the dedicated Tasks module with a sibling route-backed Processes tab, while Start Process remains a separate primary-navigation module. Work cards prioritize authorized information and next action without exposing Process Data. Operational layouts reflow for supported narrow screens; full Workflow/Form authoring communicates its desktop boundary.

5. **Complete bilingual and accessibility polish:** Spanish spelling/accents and English copy are reviewed across navigation, empty/error states, Workflow/Form palettes, properties, validation, publication, runtime handoffs, and support guidance. Visible focus, reduced motion, non-color-only states, headings/landmarks, and practical target sizes are preserved.

6. **Approve the exact presentation manually:** Human-reviewed desktop/mobile operational screenshots and supported desktop authoring screenshots demonstrate the approved palette, alignment, hierarchy, modules, interactions, and responsive behavior. Focused unit/component/integration checks remain green, and a manual walkthrough verifies the complete stakeholder path, recovery behavior, bilingual presentation, and authoring-to-runtime continuity on the exact built revision.

Traceability: UX-DR3-UX-DR24, AD-9, AD-12, AD-16, NFR16, NFR30.

## Tasks / Subtasks

- [x] Polish authenticated shell and catalogs (AC: 1, 2, 4)
  - [x] Apply navigation, page heading, content container, card, empty/error state, and action patterns.
  - [x] Ensure Mi trabajo opens Tasks directly, exposes Processes as a sibling tab, and leaves Start Process, Workflows, and Forms as separate primary modules.

- [x] Polish Workflow/Form authoring transitions (AC: 2, 3)
  - [x] Verify Workflow create -> Designer -> selected Task -> Form Designer -> Workflow -> Validate -> Publish continuity.
  - [x] Replace ambiguous button groups with palettes, contextual properties, persistent state, and one dominant action per region.
  - [x] Confirm immediate Add feedback and keyboard alternatives in both editors.

- [x] Polish runtime journey (AC: 1, 4)
  - [x] Apply the shared Task Form renderer and recoverable validation patterns.
  - [x] Align Start Process, task completion, and Process timeline handoffs.

- [x] Complete bilingual/accessibility review (AC: 5)
  - [x] Review all new module/editor copy and interaction announcements in Spanish and English.
  - [x] Verify landmarks, focus order, reduced motion, targets, and non-color-only state.

- [ ] Run the visual checkpoint and manual acceptance (AC: 6)
  - [x] Capture representative operational desktop/mobile and desktop authoring screenshots.
  - [x] Resolve visual/navigation defects before Story 1.39.
  - [x] Run affected unit, component, integration, architecture, type, and build/static checks.
  - [ ] Manually walk the polished public, authoring, and runtime path on the exact built revision and record blocking defects and approval.

### Review Findings

- [x] [Review][Decision] Run the exact-built-revision walkthrough after the review patches — resolved by Jortiz on 2026-08-13; the pre-patch evidence was approved, and the main manual-acceptance task remains open for the refreshed build.
- [x] [Review][Patch] Refresh the stale authoring and mobile Process screenshots so the claimed exact-worktree evidence shows the current Mi trabajo, Fin, and editor-feedback copy [_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md:97]
- [x] [Review][Patch] Preserve a recoverable completion handoff when a user reloads or revisits the completed Task URL [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:96]
- [x] [Review][Patch] Separate semantic Workflow-position fallbacks from Designer-authored labels so My Processes localizes system values without Process detail overwriting legitimate labels [Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx:45]
- [x] [Review][Patch] Make the non-terminal completion guidance accurate when the next Task belongs to another authorized member [Moviqo.Front/src/shared/localization/messages.ts:1187]
- [x] [Review][Patch] Stop using the visible actor string "Authorized member" as the fallback sentinel because a real member can have that display name [Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx:56]

- [x] [Manual feedback][Patch] Make Tasks, Processes, and Start Process loading unmistakable, remove competing controls while requests are pending, and prevent duplicate process-start commands [Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx]

## Dev Notes

- This story integrates and polishes completed foundations; it must not create another Workflow/Form state model.
- Do not imply mobile supports full authoring. Operational flows remain responsive; authoring may provide safe view/navigation below the supported desktop width.
- Human visual review is required in addition to automated contrast/accessibility evidence.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`

## Dev Agent Record

### Implementation Plan

- Establish a summary-only authenticated Dashboard that routes into dedicated runtime modules without exposing Process Data.
- Refine authoring transitions and editor hierarchy while preserving the existing Workflow/Form document models and explicit save authority.
- Align Task Form and Process timeline recovery/handoffs through the shared primitives and canonical routes.
- Complete bilingual, accessibility, automated, visual, and manual acceptance on the exact built revision.

### Debug Log References

- Branch: `story/1-38-polish-the-authenticated-stakeholder-journey`

### Completion Notes

- Renamed Panel/Dashboard to localized Mi trabajo/My work, removed the redundant summary-card layer, and made `/my-work` open assigned Tasks directly with a route-backed sibling Processes tab.
- Kept Start Process exclusively in primary navigation while preserving `/my-work/tasks`, Task detail, Processes, and Process detail deep links; corrected Workflow catalog failures to show a recoverable alert instead of a false empty state.
- First-task validation passed: full frontend architecture/API-client/unit suite, production build/static scan, and the four-scenario Chromium My Work browser suite.
- Added visible localized confirmation for accepted Workflow and Form palette commands while preserving immediate reducer-owned selection, non-drag keyboard operations, and canvas reveal without interfering with pointer collision geometry.
- Consolidated Form breadcrumbs into the shared three-region page header and structured Form save/recovery/return controls in one shared action bar with a persistent status region and one primary Save action.
- Authoring validation passed: full frontend regression and production build plus all five Chromium Workflow/Form editor scenarios, covering create/design, Task-to-Form return, pointer/keyboard composition, explicit save, conflict recovery, validation, and publication.
- Rebuilt the Task Form panel with shared PageHeader, Card, Badge, Alert, ActionBar, Button, and ButtonLink primitives while retaining the shared runtime renderer, field-linked error summary, first-invalid-field focus, retained values, retry, reload, and unsaved-navigation recovery.
- Changed authoritative task completion to hand off directly to that process's authorized timeline, suppressed raw server handoff copy, guarded against stale Task query snapshots clearing completion success, and polished process metadata/timeline events into responsive semantic descriptions and cards.
- Runtime validation passed: five Chromium My Work/Task/Process scenarios with automated accessibility checks, the full frontend regression/build, backend Ruff, the completion contract test, and the full backend suite (`308 passed, 58 skipped`).
- Reviewed the new Dashboard, catalog recovery, editor add feedback, Task completion, and timeline copy in Spanish and English; added explicit localization assertions for accents and reviewed English behavior.
- Corrected offline My Work recovery to use its localized network message instead of a generic server-refresh message and refreshed stale qualification fixtures/assertions without weakening their safety checks.
- Bilingual/accessibility qualification passed across 14 applicable desktop/mobile project scenarios plus the two corrected desktop authoring scenarios: both locales, 200% text, reduced motion, visible focus, practical targets, non-color marks, narrow timeline reflow, desktop authoring boundary, Designer-content preservation, offline/permission recovery, and axe baseline.
- Captured exact-worktree Spanish evidence for authenticated desktop Mi trabajo, the mobile Process timeline, and the supported desktop Workflow Designer; the pixel review exposed and corrected an English server-owned contribution sentence in the Spanish timeline before recapture.
- Mapped stable process involvement/contribution kinds to reviewed catalog copy while retaining Designer-authored submitted-value labels, preventing generic backend sentences from bypassing the active locale in My Processes and Process detail.
- Final frontend checks passed on the evidence-producing worktree: typecheck, complete unit/static/architecture regression, production build/static scan, five-scenario Chromium My Work journey, and the full 28-case bilingual preview matrix (`20 passed, 8 profile-specific skipped`). Backend validation remains green (`308 passed, 58 skipped` plus Ruff).
- Independent blind and edge-case review corrected non-terminal Task completion routing/copy, removed the forced post-completion redirect, aligned timeline event/status/fallback localization with the backend contract, and made repeated Workflow/Form add feedback announce exactly once per accepted action.
- Code-review patches added session-scoped Task completion recovery, explicit Process position/actor presentation kinds, accurate cross-assignee handoff guidance, generated-contract coverage, and collision tests that preserve Designer-authored Task labels and real member display names.
- Post-review validation passed: Ruff; focused backend contract/integration (`25 passed, 3 skipped`); the full backend run reached `307 passed, 58 skipped` with one overlapping temp-schema artifact failure, then the isolated schema contract passed (`3 passed`); frontend typecheck, architecture, complete unit suite, deterministic generated client, production Vite build/static scan, five-case Chromium My Work journey, and the bilingual preview matrix (`20 passed, 8 profile-specific skipped`).
- Refreshed all four Spanish Story 1.38 captures from the patched worktree on 2026-08-14; pixel review confirms Mi trabajo, localized Inicio/Fin runtime positions, and current authoring navigation. The human exact-build walkthrough remains pending.
- Reworked Mis tareas and Mis procesos into compact semantic desktop reports with equivalent narrow-screen definition-list cards and explicit page totals; active authorized processes now appear in the same safe process read model and open their authorized timeline.
- Simplified the Task page hierarchy to one Task H1, a parent breadcrumb, Workflow subtitle, and Process/Status metadata; removed the visible runtime revision and redundant active-task eyebrow.
- Restored visibly changing loading feedback for reduced-motion environments with a non-spatial opacity pulse while retaining normal ring rotation, then refreshed the Spanish desktop/mobile My Work captures. The human exact-build walkthrough remains pending.
- Independent review corrected active Process detail/status copy, mixed open/completed participation precedence, completed-process step fallback, bilingual semantic process search, uniquely named process actions, retained Start Process refresh safety, and 390px Process-card coverage.
- Final focused validation passed: backend Ruff and My Work contract (`27 passed`); frontend typecheck, complete unit suite, production Vite/static scan, all six Chromium My Work scenarios across the combined run, and four bilingual desktop/mobile evidence profiles. Eight Spanish runtime/report captures were visually inspected; manual acceptance remains pending.

### File List

- `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/router/routes.tsx`
- `Moviqo.Front/src/app/router/navigation.ts`
- `Moviqo.Front/src/features/my-work/index.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/features/my-work/ui/processPresentation.ts`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/pages/forms/ui/FormPages.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/ui/feedback.tsx`
- `Moviqo.Front/tests/e2e/my-work.spec.ts`
- `Moviqo.Front/tests/e2e/form-designer.spec.ts`
- `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts`
- `Moviqo.Front/tests/e2e/workflow-editor.spec.ts`
- `Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts`
- `Moviqo.Front/tests/unit/authenticated-journey-polish.test.cts`
- `Moviqo.Front/tests/unit/application-routing.test.cts`
- `Moviqo.Front/tests/unit/localization.test.cts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `Moviqo.Front/tests/unit/shared-ui.test.cts`
- `Moviqo.Front/tests/unit/task-form.test.cts`
- `Moviqo.Front/tests/unit/verification-flow.test.cts`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/authoring-desktop-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-desktop-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-desktop-processes-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-desktop-task-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-mobile-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-mobile-my-work-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-mobile-processes-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-38/operational-mobile-task-es.png`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/epic-1-context.md`
- `_bmad-output/implementation-artifacts/spec-1-38-my-work-tabs.md`
- `_bmad-output/implementation-artifacts/spec-1-38-scalable-my-work-experience.md`
- `docs/api/openapi-v1.json`
