---
baseline_commit: 02c77d41766624e556e8bde7d515fc76d9448a47
---

# Story 1.37: Establish the Dedicated Schema-Driven Form Designer

Status: done

## Story

As a Workflow Designer and Task participant,
I want a dedicated visual Form Designer and runtime rendering to use the same typed definitions,
so that the Form is easy to compose and remains identical in meaning when someone completes the Task.

## Acceptance Criteria

1. **Open a canonical Task-scoped Designer:** `/workflows/:workflowId/tasks/:taskElementId/form` loads the authorized revisioned Workflow draft, verifies that the element is a Task, displays Workflow/Task breadcrumbs and save state, and provides safe return to the Workflow Designer. `/forms` selects an authorized Workflow then one of its Tasks and navigates to the same canonical route.

2. **Establish typed field and structural registries:** A source-owned registry in `features/task-form` defines Short Text configuration, default creation, preview/runtime renderer, value behavior, and presentation validation. Discriminated structural definitions cover Section, Heading, Instruction Text, and Divider without creating Process Data. Unsupported items fail safely and cannot silently disappear.

3. **Build a dedicated constrained workspace:** `features/form-design` provides separate Fields/Layout palettes, twelve-column Form canvas, selected-item properties, runtime-accurate preview, validation summary, and persistent save status. Layout uses approved full, half, third, and quarter spans rather than free-form pixel positioning and reflows safely on supported narrow operational views.

4. **Adopt dnd-kit as interaction adapter:** Select and pin a stable React-19/TypeScript-6-compatible dnd-kit package set. It owns only drag/sort gesture feedback. Drop, click/double-click Add, explicit Move up/down, and width changes dispatch the same Form reducer operations; Moviqo stable IDs, item order, selection, document, revision, conflict, validation, and save behavior remain authoritative.

5. **Render operational Forms from the same registry:** `TaskFormRenderer` in `features/task-form` composes domain-free `shared/ui` fields and Form Grid. Designer preview reuses its item renderers so labels, help, required state, placeholder, width, structural content, disabled state, values, and validation do not drift.

6. **Preserve the data, feature, and explicit-save boundary:** Process Field IDs, Task bindings, control/item IDs, position, width, Task/definition revisions, Save draft, Complete task, idempotency, authorization, and server validation remain governed by the existing generated/backend contracts and explicit reducers. Form Designer changes remain local until **Save draft**, `Ctrl/Cmd+S`, or the guarded Save-and-return action is chosen; no timer, change effect, drag, blur, or navigation autosaves. `features/form-design` and `features/workflow-design` share public entity/document contracts and never deep-import each other. No general Form schema/store becomes authoritative.

7. **Make validation recoverable:** Runtime and Designer Forms provide localized error summaries, associated inline errors, first-invalid-item focus/reveal, non-field failure treatment, non-color-only state, and correction behavior consistent with Story 1.34. Correctable values remain available and correlation IDs remain secondary support information.

8. **Verify design/runtime parity and manual persistence:** Unit, component, contract, and integration tests cover route/launcher behavior, registry resolution, Short Text and structural items, approved spans/reflow, reducer commands, preview/runtime parity, error recovery, explicit Save Draft, no background save requests, conflicts, incomplete coherent Form saving, and unknown-item fail-safe handling. Manual acceptance verifies pointer and keyboard item placement/reordering, widths/reflow, preview parity, focus/error recovery, dirty navigation, save/reload, and operational rendering on the built application.

Traceability: FR48, FR108-FR113, FR168-FR185, FR194, FR222, FR227, FR235, FR240, AD-4, AD-5, AD-7, AD-9, UX-DR3-UX-DR6, UX-DR14, UX-DR17, UX-DR20, UX-DR21, NFR16, NFR25.

## Tasks / Subtasks

- [x] Evolve the authoritative Form document contract (AC: 2, 6)
  - [x] Define discriminated field-binding and structural-item shapes with stable IDs, positions, and approved spans.
  - [x] Update backend schema validation/serialization, generated OpenAPI types, and existing draft save/publication behavior as required.
  - [x] Keep structural items non-data and prevent them from receiving Process Field bindings or runtime values.

- [x] Implement shared registries/renderers (AC: 2, 5)
  - [x] Define Short Text and structural registry entries with exhaustive resolution.
  - [x] Build `TaskFormRenderer` from domain-free shared UI primitives and Form Grid.
  - [x] Reuse the same item renderers in Designer preview and fail safely for unknown kinds.

- [x] Build the route-level Form Designer (AC: 1, 3, 6)
  - [x] Load the route-scoped draft and initialize `useFormDesigner` without global editor Context.
  - [x] Create Fields/Layout palettes, canvas, properties, preview, validation, breadcrumbs, and save-status composition.
  - [x] Keep Workflow/Task identity visible and navigate safely back to the selected Task in the Workflow Designer.

- [x] Pin and integrate dnd-kit (AC: 4)
  - [x] Record the selected stable package/version and accessibility configuration.
  - [x] Implement pointer and keyboard drag/sort with localized screen-reader instructions and announcements.
  - [x] Route drag, click/double-click, Move, and width actions through the same reducer commands.

- [x] Implement recovery and parity (AC: 5, 7)
  - [x] Map server `invalidParams` paths to visible fields/items or an actionable Form-level message.
  - [x] Focus/reveal the first invalid item and preserve correctable values across rejection/conflict recovery.
  - [x] Verify Designer preview and runtime output for every Epic 1 registry item.

- [x] Implement explicit Form Designer persistence (AC: 1, 6, 8)
  - [x] Remove/reject autosave orchestration and add Save Draft plus `Ctrl/Cmd+S` over one immutable revision-aware command path.
  - [x] Preserve local edits during save failure/conflict, expose an explicit retry, and use a new idempotency key only when the payload changes.
  - [x] Guard return-to-Workflow and other navigation with Save/Discard/Stay; successful save returns to the same Task context without implying publication readiness.

- [x] Verify the architecture and experience (AC: 8)
  - [x] Add component/contract tests for routes, registries, layout, interactions, parity, focus, errors, and revisioned save/complete behavior.
  - [x] Extend architecture checks for feature boundaries and absence of a second Form document/store.
  - [x] Run affected backend/frontend unit, component, contract/integration, architecture, type, generated-client, and build/static checks.
  - [x] Manually compose, reorder, resize, save, reload, preview, and use a representative Task Form with pointer and keyboard alternatives.

### Review Findings

- [x] [Review][Patch] Enforce an expiring server-backed Form authoring lease: secondary users open read-only with the active editor identified, an explicit takeover revokes the previous editor, session/heartbeat expiry releases abandoned leases, and save authority is checked server-side [Moviqo.Front/src/features/form-design/model/formDesigner.ts:86]
- [x] [Review][Patch] Prevent structural Form additions/removals from dereferencing a nonexistent `fieldId` while collecting draft audit events [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:1216]
- [x] [Review][Patch] Allow structurally coherent drafts with blank field labels/content to save while keeping completeness checks at publication [Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py:874]
- [x] [Review][Patch] Reset or key Form Designer reducer state when the workflow/task route identity changes [Moviqo.Front/src/features/form-design/model/useFormDesigner.ts:23]
- [x] [Review][Patch] Edit and display the effective Task binding label instead of mutating an unrelated reusable Process Field label [Moviqo.Front/src/features/form-design/ui/FormDesignerProperties.tsx:25]
- [x] [Review][Patch] Implement palette-to-canvas pointer drag/drop placement through the authoritative Form reducer [Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx:17]
- [x] [Review][Patch] Accept keyboard-generated palette button clicks whose `MouseEvent.detail` is zero [Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx:17]
- [x] [Review][Patch] Make Designer validation summaries specific, focus them after failure, reveal/focus the first invalid property, and associate inline errors [Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx:47]
- [x] [Review][Patch] Clear only the corrected Designer error instead of erasing every remaining server and form-level error on any edit [Moviqo.Front/src/features/form-design/model/formDesigner.ts:145]
- [x] [Review][Patch] Localize backend validation codes/paths instead of displaying raw English `invalidParams.reason` text [Moviqo.Front/src/features/form-design/model/useFormDesigner.ts:43]
- [x] [Review][Patch] Make the Task Form registry own defaults/rendering/value behavior and fail visibly for malformed or prototype-key kinds [Moviqo.Front/src/features/task-form/model/registry.ts:42]
- [x] [Review][Patch] Expose the specified Short Text help, placeholder, required, default, and length configuration and preserve its runtime semantics [Moviqo.Front/src/features/form-design/ui/FormDesignerProperties.tsx:36]
- [x] [Review][Patch] Use a grid-compatible dnd-kit sorting strategy for wrapped half/third/quarter-width items [Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx:149]
- [x] [Review][Patch] Resolve invalid-parameter targets against known full IDs so identifiers containing dots remain actionable [Moviqo.Front/src/features/form-design/model/formDesigner.ts:364]
- [x] [Review][Patch] Route runtime error retry to completion when Complete failed instead of always retrying Save Draft [Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx:96]
- [x] [Review][Patch] Connect the parity browser test to the saved/published Designer output instead of an independent hard-coded Task Form fixture [Moviqo.Front/tests/e2e/form-designer.spec.ts:69]
- [x] [Review][Patch] Replace the obsolete authoring browser assertion for the removed Form Designer placeholder [Moviqo.Front/tests/e2e/authoring-navigation.spec.ts:145]
- [x] [Review][Patch] Cancel the pending navigation intent when Stay is selected so a late save cannot continue the abandoned transition [Moviqo.Front/src/pages/forms/ui/FormPages.tsx:192]
- [x] [Review][Defer] Distinguish a workflow-catalog request failure from an empty catalog [Moviqo.Front/src/pages/forms/ui/FormPages.tsx:38] — deferred, pre-existing

## Dev Notes

- A custom Form architecture does not mean raw controls. Shared accessible components supply visual/interaction quality; typed registries supply Moviqo meaning.
- Structural controls are the only Epic 3 capability pulled forward: Section, Heading, Instruction Text, and Divider. Rich fields, tables, calculations, conditional behavior, and validation-rule builders remain Epic 3.
- dnd-kit accessibility defaults require localized instructions/announcements and are not sufficient without product-specific testing. Explicit non-drag operations remain mandatory.
- The backend currently saves the full revisioned Workflow draft. The Form Designer therefore edits the Task-scoped portion of that document and must handle revision conflicts, not invent an independent Form resource without a separate architecture decision.
- Form Designer persistence is explicit. dnd-kit events update only the local reducer; they never cause background requests. Save Draft may persist incomplete but structurally coherent Form layout/configuration, while Workflow publication validation remains the completeness gate.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
- https://dndkit.com/react/hooks/use-sortable/
- https://docs.dndkit.com/guides/accessibility

## Dev Agent Record

### Debug Log References

- Story branch: `story/1-37-establish-the-dedicated-schema-driven-form-designer`
- Red phase: 7 schema/registry contract failures confirmed before schema v8 implementation.
- dnd-kit selection verified from official npm metadata: `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, and `@dnd-kit/utilities@3.2.2`; localized instructions and announcements configure pointer and keyboard sensors.
- Generated-client drift gate passed by temporarily staging only the regenerated OpenAPI artifacts; both files were immediately unstaged without content changes.

### Implementation Plan

- Evolve the full Workflow draft to schema v8 with discriminated field and structural Form items while upcasting legacy bindings.
- Establish a public entity contract plus source-owned Task Form registries and one runtime/preview renderer.
- Build the route-level Form Designer around a focused reducer, dnd-kit gesture adapters, and explicit revision-aware persistence.
- Prove recovery, parity, feature boundaries, responsive layout, and manual persistence through unit, contract, integration, architecture, build, and browser acceptance gates.

### Completion Notes

- Implemented schema v8 Form items with stable identity, approved spans, legacy upcasting, non-data structural semantics, publication handling, OpenAPI serialization, and generated TypeScript contracts.
- Added the shared Short Text/structural registry and `TaskFormRenderer`; operational and preview rendering now share labels, help, required state, placeholders, widths, structure, disabled state, values, and fail-safe unknown-item treatment.
- Added the canonical Task-scoped Form Designer workspace with launcher integration, breadcrumbs, same-Task return, fields/layout palettes, twelve-column canvas, properties, preview, validation summary, persistent save state, and no global editor context.
- Pinned and integrated dnd-kit pointer/keyboard sorting with localized assistive instructions; drag/drop, palette clicks, Move up/down, selection, and width changes all dispatch the same authoritative reducer operations.
- Added recoverable inline/form-level errors, focus/reveal behavior, retained values, explicit retry, conflict reload/reapply, payload-sensitive idempotency keys, `Ctrl/Cmd+S`, and Save/Discard/Stay navigation guarding without autosave.
- Added a tenant-scoped 60-second Form authoring lease with 20-second heartbeats, read-only secondary sessions, named-holder messaging, confirmed takeover, sign-out/expiry cleanup, and a lease-enforced Task-scoped save endpoint.
- Manual acceptance exposed PostgreSQL rejecting the lease query's nullable draft outer join under `FOR UPDATE`; the lease now locks only the authoritative Workflow row, with real-PostgreSQL HTTP coverage for acquire, secondary read-only access, takeover, stale-token rejection, release, and cleanup.
- Refined the Form palette into equal full-width icon-and-label actions and standardized route, query, verification, and lease-loading feedback on the shared accessible reduced-motion-safe `LoadingState`.
- Final review hardened stale acquire/heartbeat/takeover cleanup, synchronous duplicate-save exclusion, lease-loss idempotency recovery, blank structural-draft reopening, navigation save availability, distinct launcher failure/loading states, and single-region error announcements; concurrent first acquisition and real palette pointer/keyboard alternatives now have explicit regression coverage.
- Verification passed: backend Ruff and full pytest (`302 passed, 58 skipped`), full PostgreSQL integration (`63 passed`), frontend architecture (`10 passed`), full frontend unit suite, typecheck, deterministic OpenAPI client generation, production Vite build/static scan, and Chromium browser acceptance (`3 passed`).
- Browser acceptance composed, reordered with pointer and keyboard alternatives, resized, previewed, saved, reloaded, checked narrow reflow, and rendered the representative operational Task Form.

### File List

- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/form_authoring_leases.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/apps.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/migrations/0003_formauthoringlease.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/signals.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Moviqo.Back/tests/unit/test_workflow_design_form_audit.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Back/tests/unit/test_workflow_publication_validation.py`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/router/RoutePages.tsx`
- `Moviqo.Front/src/entities/workflow/index.ts`
- `Moviqo.Front/src/entities/workflow/model/workflowDocument.ts`
- `Moviqo.Front/src/features/form-design/index.ts`
- `Moviqo.Front/src/features/form-design/model/formDesigner.ts`
- `Moviqo.Front/src/features/form-design/model/formDesignerApi.ts`
- `Moviqo.Front/src/features/form-design/model/useFormDesigner.ts`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerProperties.tsx`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerSaveStatus.tsx`
- `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx`
- `Moviqo.Front/src/features/task-form/index.ts`
- `Moviqo.Front/src/features/task-form/model/registry.ts`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/features/task-form/ui/TaskFormRenderer.tsx`
- `Moviqo.Front/src/features/verification/ui/VerificationStatusPanel.tsx`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/navigation.ts`
- `Moviqo.Front/src/features/workflow-design/model/queries.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/pages/forms/ui/FormPages.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs`
- `Moviqo.Front/tests/e2e/authoring-navigation.spec.ts`
- `Moviqo.Front/tests/e2e/form-designer.spec.ts`
- `Moviqo.Front/tests/unit/authoring-navigation.test.cts`
- `Moviqo.Front/tests/unit/form-designer.test.cts`
- `Moviqo.Front/tests/unit/shared-ui.test.cts`
- `Moviqo.Front/tests/unit/task-form.test.cts`
- `Moviqo.Front/tests/unit/verification-flow.test.cts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `Moviqo.Front/tests/unit/workflow-editor.test.cts`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/api/openapi-v1.json`

## Change Log

- 2026-08-13: Implemented Story 1.37 dedicated schema-driven Form Designer, shared runtime registry/rendering, explicit persistence/recovery, dnd-kit accessibility adapter, and full verification coverage.
- 2026-08-13: Completed adversarial review; resolved all 18 Story 1.37 findings, added lease-based exclusive authoring, and deferred one pre-existing catalog-state issue.
- 2026-08-13: Corrected the PostgreSQL Form-lease row lock found during manual acceptance, polished the Form palette, and adopted shared accessible loading feedback across asynchronous application surfaces.
- 2026-08-13: Applied the final Blind/Edge review patches for lease-response races, duplicate saves, blank structural drafts, launcher feedback, accessible announcements, and palette keyboard behavior; recorded policy-level lease bypass and same-session multi-tab ownership for follow-up.
