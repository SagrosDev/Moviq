---
baseline_commit: 73f9f6af132d7a6d5028ef7a1369f128462163eb
---

# Story 1.24: Compose and Run the Minimal Task Form

Status: done

## Story

As a Designer and assigned Member,
I want one accessible Short Text control on a Task Form,
so that the first Process can collect and preserve a participant's input.

## Acceptance Criteria

1. **Compose the first Task Form control:** Given a Task with an empty Form, when the Designer adds the Short Text control, then the control uses the ordered label, concise help, input, and inline validation structure, defaults to full responsive width, and stores its position and stable field binding in the draft. And authoring works at `1280x720` or larger through pointer and non-drag controls. Traceability: FR168, FR173, FR176, FR180, FR181, FR182, FR183, FR184, FR185, UX-DR5, UX-DR21.
2. **Render the active Task Form responsively:** Given an assigned participant opens the active Task, when the Form loads at supported mobile through desktop widths, then the control stacks and reflows without losing label, help, current value, validation, save, or complete actions. And placeholder text never substitutes for the accessible label. Traceability: FR180, FR181, FR182, FR183, FR184, FR185, UX-DR18, UX-DR20.
3. **Save valid draft input without completion:** Given text outside configured length or default constraints or text valid under them, when the participant saves a draft, then invalid text is rejected before persistence with localized field feedback, while valid text is stored once under the Process Field ID without completing the Task. And a real-PostgreSQL test proves an invalid save leaves the prior value intact. Traceability: FR204, NFR3, AD-3, AD-16.

## Tasks / Subtasks

- [x] Extend the workflow-design draft schema so the first Task Form stores real control composition metadata instead of a bare binding only (AC: 1-2)
  - [x] Evolve `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` from the Story 1.23 `formBindings` shape into a minimal Task Form control shape that can preserve stable binding identity, ordering, task-specific label presentation, and full-width default layout for one Short Text control on the first Task.
  - [x] Preserve the stable reusable Process Field seam from Story 1.23: the Task Form control references a field ID and presentation metadata only; it does not duplicate field definition data or any Process value.
  - [x] Keep MVP label placement automatic and accessible. Do not add arbitrary label-position settings, hidden labels, drag-only layout metadata, custom widths, sections, or conditional properties that belong to Epic 3.
  - [x] Add deterministic upcasting for Story 1.21-1.23 draft fixtures so older drafts load into the new document shape without manual repair.

- [x] Add the minimal runtime task-form read/save seam in `workflow_runtime` without pulling in later publication, catalog, or completion scope (AC: 2-3)
  - [x] Introduce the narrowest backend persistence and application contract needed to represent one assigned open Task, its active Form projection, and one current Short Text Process Field value keyed by stable field ID.
  - [x] Keep runtime authority in `Moviqo.Back/src/moviqo/modules/workflow_runtime/`; do not leak draft-editing concerns into runtime tables, and do not make the browser authoritative for Task status, assignment, or value acceptance.
  - [x] Provide an authenticated read contract that returns only the authorized active Task Form projection needed for this story: task identity, display metadata, one Short Text control definition, current value, and safe save/complete affordance state.
  - [x] Provide an authenticated save-draft command that validates the submitted value against the authoritative field constraints, stores the accepted value under the Process Field ID, leaves the Task open, and records audit and idempotency in the same transaction.
  - [x] Explicitly defer full process-start, published-version catalog, My Tasks search/filter/pagination, completion transition logic, and stale-version publication handling to Stories 1.25 through 1.31 and 6.x.

- [x] Add the first participant-facing Task Form UI and a dedicated runtime route/page that can evolve into later My Tasks work (AC: 2-3)
  - [x] Keep route composition in `Moviqo.Front/src/pages/` and runtime form behavior in one feature slice rather than putting task-form state directly into `MyWorkPage` or `App.tsx`.
  - [x] Render the Short Text control with label, concise help, input, inline validation, Save draft action, and a visible Complete action placeholder/state without claiming full completion behavior yet.
  - [x] Use controlled React inputs, explicit reducer or equivalent local state, and authoritative server responses. Do not introduce a second remote-state stack, browser-only completion semantics, localStorage persistence, or polling.
  - [x] Ensure the control is keyboard-completable, mobile-safe, and Spanish-first with English fallback. Placeholder text may aid example entry but must never replace the accessible label.
  - [x] Keep new frontend implementation functions in `Moviqo.Front/src/**/*.{ts,tsx}` as arrow-function constants per `AGENTS.md`.

- [x] Add executable evidence for draft-form composition, runtime authorization, responsive rendering, and safe save behavior (AC: 1-3)
  - [x] Add backend unit coverage for draft-schema upcasting, control-shape normalization, default full-width layout metadata, and task-specific label/default handling.
  - [x] Add backend contract tests for authorized task-form read, unauthorized or cross-tenant denial, valid save-draft, invalid length rejection, and stable Problem Details targets for field feedback.
  - [x] Add real-PostgreSQL integration tests that prove one accepted save commits one value/audit/idempotency outcome, rejected saves leave the prior value intact, and runtime reads never disclose another tenant's task or value existence.
  - [x] Add frontend unit coverage for responsive label/help/input rendering, controlled input updates, field-level server validation feedback, save-pending/error/success states, and preservation of typed local work until the server confirms the save.

### Review Findings

- [x] [Review][Patch] Runtime form projection ignores the task's stored definition revision and reads the live mutable draft instead [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py:217]
- [x] [Review][Patch] Save-draft accepts missing or empty control submissions and still advances task revision and status [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py:122]
- [x] [Review][Patch] Duplicate control entries can hit the unique `(task, field_id)` constraint and fail at the database boundary instead of returning validation feedback [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py:154]
- [x] [Review][Patch] Task-form load errors never reach the error UI because `!document` keeps the page in the loading branch [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:120]
- [x] [Review][Patch] Network-level fetch failures leave task-form load/save promises unhandled, so load can hang and save can stay stuck in `saving` [Moviqo.Front/src/features/task-form/model/taskForm.ts:135]
- [x] [Review][Patch] No-op task-form saves remained available because the page tracked `hasLocalChanges` without using it to disable Save [Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx:61]
- [x] [Review][Patch] The task-form suite did not cover cross-tenant writes or stale/idempotent save behavior [Moviqo.Back/tests/contract/test_task_form_contract.py:1]
- [x] [Review][Patch] The runtime suite did not prove assigned tasks fail closed after draft revision drift, and the frontend suite did not cover the page-level load error state machine [Moviqo.Back/tests/integration/test_task_form_integration.py:1]

## Dev Notes

### Story intent and scope

- Story 1.24 is the bridge between Story 1.23's design-time field binding and the later Epic 1 runtime stories.
- This story must do two things only:
  - let Designers compose the first real Task Form control in the draft document with enough metadata to render it correctly later;
  - provide the minimal runtime read/save seam for one assigned open Task using one Short Text Process Field.
- This story must not absorb later Epic 1 scope:
  - Story 1.25 owns publish-time workflow validation;
  - Story 1.26 owns starters and assignment configuration;
  - Story 1.28 owns immutable publication;
  - Story 1.29 owns authorized process start from the catalog;
  - Story 1.30 owns the fuller My Tasks open/save experience and its broader runtime contract;
  - Story 1.31 owns completion and routing to End.
- The main implementation risk is treating the Story 1.23 draft binding as already sufficient for runtime rendering. It is not. This story needs explicit form-control presentation metadata while still preserving one stable reusable Process Field identity.

### Epic and PRD requirements to carry forward

- FR168: a new editable Form control defaults to visible, enabled, optional, and empty unless the Designer configures an applicable default value.
- FR173: Save Draft does not require missing required values, but it does reject structurally invalid or unsafe values. For this story, text length and server-safe validation still apply on save.
- FR176 and FR180: the Task Form uses responsive layout and reflows safely down to supported mobile widths.
- FR181 through FR185: every data-bound control keeps a user-facing accessible label above the field; placeholder text is not the label.
- FR182 and FR183 together mean the reusable Process Field keeps its stable identity while the Task Form may carry task-specific presentation metadata, including an override label, without changing the stored Process value identity.
- FR204: Save Draft preserves valid progress without completing the Task or advancing routing.
- FR279 and FR280 define the status seam this story prepares for: an assigned Task stays open and saving progress moves it toward `In Progress`, but the broader inbox and status surfaces remain later work.
- FR597 and FR599 matter even in this thin slice: the open runtime form must not rely on background polling, and save submissions should be designed to carry enough identity and revision/version context for later stale-form enforcement.
- NFR-003 applies directly to Save Draft: success or actionable failure should return within two seconds for the normal-load profile.

### Existing implementation to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` currently normalizes:
  - graph elements and connections,
  - one reusable `shortText` Process Field,
  - a minimal `formBindings` array containing only `id`, `taskElementId`, and `fieldId`.
  Story 1.24 should evolve the binding shape rather than invent a second draft document or a task-local shadow schema.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` currently saves the authoritative draft through one atomic-command path and server-side validation. Preserve that path when draft form-control metadata is added.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` currently lets the Designer:
  - create Start -> Task -> End,
  - configure one Short Text field,
  - toggle its first-task binding.
  Extend this guided editor rather than replacing it with a free-form builder.
- `Moviqo.Front/src/features/workflow-design/model/types.ts` currently has no explicit runtime form-control type. Add one instead of overloading `WorkflowFormBinding` with untyped extra properties.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/` currently contains only the My Work empty-dashboard stub and the `AtomicCommandProbe` model. This story is the first real runtime seam, so keep it minimal and avoid speculative platform-wide abstractions.
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` and `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` currently render dashboard shells only. Do not cram full task-form logic into those files. Add a dedicated runtime task page/feature slice and let later stories decide how My Tasks links into it.
- `Moviqo.Front/src/app/ui/App.tsx` currently routes only static top-level pages plus `/my-work/workflows/new`. Extend routing deliberately for the new task-form page; do not overload the workflow-create page or the dashboard route.

### Architecture guardrails

- Follow AD-1:
  - `workflow_design` owns draft authoring and schema evolution;
  - `workflow_runtime` owns active Task rendering, saved values, Task status changes, and runtime authorization.
  Do not read or write another module's tables directly from module internals.
- Follow AD-3: a runtime save must commit accepted Process value changes, immutable audit, and idempotency result in one PostgreSQL transaction. Rejected saves must not mutate the persisted value.
- Follow AD-4:
  - workflow draft/form layout remains schema-versioned JSON under `workflow_design`;
  - runtime Task state, assignment, and current Process value storage must be modeled so values are keyed by stable field IDs and do not duplicate field definitions.
- Follow AD-5: the mutable draft remains one authoritative shared document. Runtime saves must not back-write ad hoc changes into the draft or published definition.
- Follow AD-7 and AD-9:
  - server authorization remains authoritative;
  - frontend inputs may do immediate UX validation but may not redefine value validity, assignment, or Task completion semantics;
  - `/api/v1` OpenAPI remains the source for generated frontend types.
- Follow AD-16: start with failing tests for draft-control shape, runtime read authorization, and invalid save preservation before implementation.

### Draft-form composition guidance

- Replace or evolve the current `formBindings` concept into an explicit minimal Task Form control record for this story. The exact field names are implementation detail, but the authoritative draft needs to preserve:
  - stable control or placement ID,
  - referenced task element ID,
  - referenced reusable Process Field ID,
  - deterministic order/position,
  - full-width default layout metadata,
  - task-local presentation metadata needed for label/help rendering.
- Keep the form scope intentionally narrow:
  - one Task,
  - one Short Text control,
  - no conditional properties,
  - no section/group components,
  - no configurable widths beyond the default full-width behavior,
  - no designer-authored hidden labels or arbitrary placement modes.
- Task-specific label overrides are allowed only as presentation metadata. They must not mutate the reusable field definition itself.
- The draft should remain `camelCase`, explicitly versioned, and closed over known fields on write.

### Minimal runtime-model guidance

- Treat this as the first real `workflow_runtime` seam, not the final runtime architecture.
- The runtime model introduced here should be the smallest shape that can truthfully support:
  - one authorized open Task,
  - one rendered Short Text control derived from the authored draft/published projection used by this story,
  - one current value keyed by stable field ID,
  - save-draft without completion.
- Preserve extension space for later stories:
  - Task status transitions,
  - published version identity,
  - start/process catalog,
  - assignment resolution,
  - completion and routing,
  - timeline and My Processes.
- Avoid a throwaway preview-only API that bypasses runtime authorization or persistence just because the fuller dashboard experience arrives later.

### Likely backend files to add or update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- new runtime application helpers or services under `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- new runtime contract coverage under `Moviqo.Back/tests/contract/`
- new runtime integration coverage under `Moviqo.Back/tests/integration/`
- `Moviqo.Back/tests/unit/fixtures/workflow_design/`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `docs/api/openapi-v1.json`

### Likely frontend files to add or update

- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- existing My Work UI only if needed to add a narrow open-task entry point without collapsing boundaries:
  - `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
  - `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- a new dedicated runtime task page and feature slice under `Moviqo.Front/src/pages/` and `Moviqo.Front/src/features/`
- new runtime form unit tests under `Moviqo.Front/tests/unit/`

### Frontend and UX guardrails

- Authoring remains desktop-oriented. Keep the draft-composition controls usable at `1280x720` and larger through both pointer and non-drag interactions.
- Participant Task Forms must reflow cleanly on supported mobile through desktop widths. Use one-column stacking where needed rather than horizontal clipping.
- Follow the UX guidance-card and patient-colleague tone already used in workflow design and My Work.
- Render fields in this order:
  - label,
  - concise help,
  - input,
  - inline validation.
- Keep visible focus, semantic labels, and non-color-only validation states.
- Do not substitute placeholder text for the label.
- Do not introduce routine confirmation prompts for Save Draft.
- Do not add background polling or a live-collaboration channel for the runtime form.

### Testing requirements

- Add failing tests first for:
  - the new draft control shape and upcasting behavior,
  - authorized runtime task-form read,
  - invalid runtime save preserving the prior value.
- Backend contract tests should cover:
  - authorized task-form read returns only safe projected data,
  - cross-tenant or unauthorized open attempts fail closed,
  - valid save persists one value under the field ID,
  - `minimumLength` and `maximumLength` constraints are enforced on save,
  - invalid params target the exact form control path instead of a generic draft/task error.
- Real-PostgreSQL integration tests should prove:
  - one accepted save increments the intended runtime state once,
  - a rejected save leaves the prior value unchanged,
  - audit and idempotency are recorded in the same transaction as the accepted value change,
  - hostile tenant identifiers or guessed task identifiers reveal no existence signal.
- Frontend unit tests should prove:
  - the designed control metadata renders label/help/input in the expected order,
  - controlled text input stays in sync with local state,
  - server field errors attach back to the visible control,
  - a recoverable save failure preserves typed local work,
  - no save success state appears before server confirmation.

### Latest technical information

- The local repository still pins React `19.2.7`, `@xyflow/react` `12.11.2`, TypeScript `~6.0.0`, Django `5.2.15`, DRF `3.17.1`, Psycopg `3.3.4`, and pytest `9.1.1`. Do not upgrade dependencies in this story.
- React's official `<input>` reference, crawled on August 5, 2026, still treats `value` plus synchronous `onChange` as the controlled-input path and explicitly notes that labels must stay associated with inputs. Use that model for the participant Task Form instead of mixing controlled and uncontrolled text inputs.
- React 19 remains the stable major line in official React guidance. For this story, that supports keeping explicit reducer/state-driven form behavior rather than introducing a mutation-heavy abstraction that bypasses the existing authoritative-save model.
- Django's official 5.2 release notes remain aligned with the repository-pinned backend line. Keep runtime endpoints and validation on the current Django/DRF stack instead of coupling the story to a framework upgrade.
- Inference from the sources above plus AD-7 and AD-9: the safest implementation is ordinary controlled form inputs with server-authoritative validation and generated API types, not a client-only form engine.

### Anti-patterns and out-of-scope work

- Do not treat the Story 1.23 `formBindings` array as the final runtime form model if it cannot express label/help/order/layout metadata cleanly.
- Do not duplicate Process Field definitions inside runtime value records or task-local snapshots unless a deliberate immutable projection is required by the runtime design of this story.
- Do not implement:
  - publication validation,
  - starter/assignment configuration,
  - start-workflow catalog,
  - full My Tasks search/filter/pagination,
  - task completion and routing,
  - version-compatibility reload behavior for published workflows,
  - conditional rules, widths, sections, or rich form composition from Epic 3.
- Do not bypass runtime authorization with a designer-only preview endpoint and call it "running the form."
- Do not introduce polling, WebSockets, Redis, Celery, a second fetch stack, or localStorage draft/task persistence.

### Project Structure Notes

- Preserve the existing split between:
  - workflow authoring in `Moviqo.Front/src/features/workflow-design/`,
  - route composition in `Moviqo.Front/src/pages/`,
  - shared revision state in `Moviqo.Front/src/shared/drafts/`.
- If a new participant runtime form slice is added, keep it as its own feature rather than expanding `workflow-design` into a mixed design/runtime package.
- Backend runtime behavior is currently thin. Build the new runtime capability under `workflow_runtime` directly instead of scattering it across `workflow_design`, `organizations`, or page-local helpers.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.23, Story 1.24, Story 1.25, Story 1.26, Story 1.29, Story 1.30, Story 1.31]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR168, FR173, FR176, FR180, FR181, FR182, FR183, FR184, FR185, FR204, FR279, FR280, FR282, FR288, FR302, FR303, FR315, FR316, FR597, FR599, FR604, NFR3]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - 4.7 Process Field reuse across Task Forms; FR-168; FR-173; FR-176; FR-180 through FR-185; FR-204; FR-279; FR-280; FR-282; FR-288; FR-302; FR-303; FR-315; FR-316; FR-597; FR-599; FR-604; NFR-003]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-1, AD-3, AD-4, AD-5, AD-7, AD-9, AD-16; Consistency Conventions; Capability -> Architecture Map; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Voice and Tone; Component Patterns; State Patterns; Interaction Primitives; Accessibility Floor; Responsive & Platform; Flow 2]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-23-create-and-bind-the-first-short-text-process-field.md`]
- [Source: `_bmad-output/implementation-artifacts/1-22-design-a-basic-start-task-end-graph.md`]
- [Source: `_bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Source: `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
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
- `Get-Content .agents/skills/bmad-create-story/template.md`
- `Get-Content .agents/skills/bmad-create-story/checklist.md`
- `Get-Content .agents/skills/bmad-create-story/discover-inputs.md`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content _bmad-output/implementation-artifacts/1-23-create-and-bind-the-first-short-text-process-field.md`
- `Get-Content _bmad-output/implementation-artifacts/1-22-design-a-basic-start-task-end-graph.md`
- `Get-Content _bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Get-Content Moviqo.Back/src/moviqo/urls.py`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Get-Content Moviqo.Front/src/app/ui/App.tsx`
- `Get-Content Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Get-Content Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Get-Content Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Get-Content Moviqo.Front/package.json`
- `Get-Content Moviqo.Back/pyproject.toml`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "task form|My Tasks|save draft|Process Field|Short Text|workflow_design|workflow_runtime|assigned task|draft" Moviqo.Back/src Moviqo.Front/src Moviqo.Back/tests Moviqo.Front/tests`
- `rg -n "FR-168|FR-173|FR-176|FR-180|FR-181|FR-182|FR-183|FR-184|FR-185|FR-204|FR-279|FR-280|FR-282|FR-288|FR-302|FR-303|FR-315|FR-316|FR-597|FR-599|FR-604|NFR-003" _bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://react.dev/blog/2024/12/05/react-19`
- `web.open https://docs.djangoproject.com/en/5.2/releases/5.2/`
- `Get-Content .agents/skills/bmad-dev-story/SKILL.md`
- `Get-Content _bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`
- `Get-Content Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_task_form_integration.py`
- `Get-Content Moviqo.Front/tests/unit/task-form.test.cts`
- `Get-Content Moviqo.Back/src/moviqo/building_blocks/commands.py`
- `Get-Content Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/0001_initial.py`
- `Get-Content Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Get-Content Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Get-Content Moviqo.Front/src/shared/api/client.ts`
- `Get-Content Moviqo.Front/src/shared/localization/messages.ts`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Front/src/app/styles.css`
- `Get-Content Moviqo.Front/src/features/my-work/index.ts`
- `Get-Content Moviqo.Front/src/features/authentication/model/SessionProvider.tsx`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/__init__.py`
- `git status --short`
- `$env:UV_CACHE_DIR = (Join-Path $PWD '.uv-cache'); $env:DJANGO_SETTINGS_MODULE='moviqo.settings.test'; uv run pytest tests/unit/test_workflow_design_schema_registry.py tests/contract/test_workflow_design_contract.py tests/contract/test_task_form_contract.py`
- `$env:UV_CACHE_DIR = (Join-Path $PWD '.uv-cache'); . .\scripts\use-integration-env.ps1; uv run python src/manage.py makemigrations --check --dry-run`
- `$env:UV_CACHE_DIR = (Join-Path $PWD '.uv-cache'); . .\scripts\use-integration-env.ps1; uv run pytest tests/integration/test_task_form_integration.py tests/integration/test_tenant_isolation.py`
- `$env:UV_CACHE_DIR = (Join-Path $PWD '.uv-cache'); $env:DJANGO_SETTINGS_MODULE='moviqo.settings.test'; uv run python src/manage.py check`
- `npm run test:unit`
- `npm run test:architecture`
- `npm test`
- `git diff --check`

### Completion Notes List

- Extended the draft schema and guided editor binding shape so first-task form controls now preserve ordered placement metadata, fixed full-width layout, and optional task-local label presentation without duplicating reusable field definitions.
- Added the first runtime task-form seam under `workflow_runtime`, including `TaskOccurrence` and `TaskProcessFieldValue`, an authenticated read projection, and an idempotent save-draft command that validates server-side and records audit evidence in the same PostgreSQL transaction.
- Added a dedicated participant-facing task-form feature/page and route at `/my-work/tasks/<taskId>` with controlled input state, inline server validation feedback, localized copy, and a visible disabled completion affordance.
- Validated the implementation with backend unit, contract, and PostgreSQL integration tests plus frontend architecture and unit/full test scripts.

### File List

- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/0002_task_form_runtime.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_task_form_integration.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/task-form/index.ts`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/pages/task-form/index.ts`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/task-form.test.cts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-05: Implemented the minimal authored/runtime task-form slice, added backend/frontend coverage, and moved Story 1.24 to review.
