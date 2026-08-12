---
baseline_commit: acb46ab0e2efea2d83aa1579d1dd8269edbef889
---

# Story 1.36: Refactor the Workflow Editor and Adopt React Flow

Status: done

## Story

As a Workflow Designer,
I want a dedicated visual Workflow Editor backed by the existing reliable draft model,
so that every action appears immediately on a comprehensible canvas without the canvas becoming the source of workflow truth.

## Acceptance Criteria

1. **Decompose the editor around the revised persistence contract:** At `/workflows/:workflowId/design`, split `WorkflowDraftEditor` into a focused controller hook and presentation regions for element palette, React Flow canvas, accessible outline, selected-element properties, starter/assignment configuration, publication checklist, persistent save status, and Save Draft/Validate/Publish action bar. Existing domain actions, API identity, revision tokens, idempotency, conflict recovery, validation, and publication behavior remain authoritative while background autosave and automatic retry are removed.

2. **Use React Flow as a visual adapter:** The pinned `@xyflow/react` package renders custom Start, Task, and End nodes plus sequence edges. It owns canvas-only presentation, selection, position, pan, zoom, and connection gestures. Typed adapters derive React Flow nodes/edges from the Moviqo document and translate accepted canvas events into reducer actions; React Flow never becomes a persisted or semantic authority.

3. **Make every Add operation visible:** Palette items support drag-to-canvas, click/double-click addition, and keyboard addition. On acceptance, the element appears without scrolling, becomes selected, is revealed/fitted when necessary, exposes its properties, and produces an accessible announcement. Rejected additions explain the cardinality/connection constraint beside the palette or action.

4. **Connect and configure Tasks clearly:** Valid sequence Transitions can be created through handles and explicit source/target controls. Selecting a Task exposes its properties, assignment summary, Form status, and a prominent Design Form route action. Form editing itself is not embedded in the Workflow page.

5. **Preserve accessible non-drag operation:** The complete Epic 1 Start-Task-End design remains possible through explicit add/connect controls and an accessible ordered outline. Canvas nodes, edges, selection, validation targets, and action labels remain keyboard-operable, bilingual, and understandable without color alone.

6. **Keep future nodes honest:** The typed adapter/renderer registry can accept future Workflow element/connection types, but Epic 1 exposes only Start, Task, End, and sequence Transition behavior. Conditional Routing, branches, and loops are not displayed as usable until Epic 4 supplies their domain and runtime contracts.

7. **Save only on explicit demand and separate draft safety from publication readiness:** No timer, change effect, drag event, blur, or route transition sends a background save. **Save draft** and `Ctrl/Cmd+S` submit one immutable snapshot with the expected revision and idempotency key through the existing `PUT /api/v1/workflow-design/workflows/:workflowId/draft/` contract. Do not add a second draft-save endpoint or a client-controlled `skipValidation`/validation-mode flag: the draft endpoint itself owns draft-integrity semantics. The backend accepts incomplete but structurally coherent drafts—including missing Start/Task/End elements, disconnected paths, unfinished Form/assignment, and other publication-readiness gaps—while still rejecting malformed schemas, unknown kinds, duplicate IDs, dangling references, impossible element/connection invariants, unauthorized resources, and stale revisions. `POST .../publication-validation/` evaluates the authoritative saved document at `expectedRevision`, not a client-only candidate document; **Publish** operates on and revalidates that same authoritative revision. The UI enables **Publish** only while that saved revision remains unchanged and its latest explicit validation result is publishable.

8. **Protect unsaved work and verify behavior:** Dirty state is persistent and navigation offers Save/Discard/Stay; an unknown save outcome can be retried explicitly with the same immutable payload/idempotency key, while changed content creates a new command key. Save failure/conflict preserves local work and never triggers a background retry. Deterministic reducer, component, model, backend contract, and integration tests cover adapters, Add/connect commands, explicit save, incomplete-draft acceptance, no background requests, conflicts, validation targeting, and publication revision gating. Manual acceptance verifies canvas selection/reveal/focus, pointer and keyboard authoring, dirty navigation, Task-to-Form continuity, validation recovery, and publication on the built application.

Traceability: FR176-FR185, FR212-FR215, FR222, FR223, FR226-FR228, FR235, FR240, AD-5, AD-7, AD-9, UX-DR5-UX-DR11, UX-DR17, UX-DR20, UX-DR21, NFR16, NFR25.

## Tasks / Subtasks

- [x] Refactor the existing editor around explicit ownership (AC: 1)
  - [x] Extract `useWorkflowDraftEditor` for reducer state, dirty/explicit-save state, conflicts, validation, and publication orchestration.
  - [x] Extract palette, canvas, outline, properties, configuration, checklist, action bar, and save-status components.
  - [x] Remove embedded Form editing while retaining a Task Form status/route action.

- [x] Integrate the React Flow canvas adapter (AC: 2, 6)
  - [x] Import the pinned package and required styles through the approved styling boundary.
  - [x] Implement typed document-to-flow and canvas-event-to-reducer adapters with stable Moviqo IDs.
  - [x] Define custom Start, Task, and End nodes with visible labels/status and valid handles.
  - [x] Persist positions only if the Workflow contract supports them; otherwise retain presentation positions without submitting a second graph document.

- [x] Implement palette and immediate feedback (AC: 3, 5)
  - [x] Add drag-to-canvas using a touch-compatible pointer approach that respects React Flow's external-palette boundary.
  - [x] Add click/double-click and keyboard Add paths through the same reducer command.
  - [x] Select, reveal, focus/announce, and open properties for an accepted element; explain rejected operations locally.

- [x] Implement connection, selection, and Task Form navigation (AC: 4, 5, 8)
  - [x] Translate valid handle connections into Moviqo sequence connections and retain explicit source/target controls.
  - [x] Synchronize canvas and outline selection/focus without two semantic selection stores.
  - [x] Route Design Form to `/workflows/:workflowId/tasks/:taskElementId/form`; when dirty, offer **Save and design form**, Discard, or Stay rather than saving implicitly.

- [x] Separate Save Draft validation from publication readiness (AC: 7)
  - [x] Keep the existing draft `PUT` endpoint and its optimistic-revision/idempotency contract. Do not add another save endpoint and do not add a request flag that lets the client select or bypass validation policy.
  - [x] Split `validate_workflow_graph_document` into clearly named draft-integrity normalization/validation and publication-readiness validation. Draft integrity rejects malformed schema, unknown kinds, duplicate stable IDs, dangling references, forbidden connection directions/types, impossible maximum cardinality such as multiple Start/End elements, unauthorized references, and stale revisions, but permits missing required elements/connections, disconnected paths, and starter/assignment/Form completeness gaps.
  - [x] Keep required Start/Task/End presence, complete connectivity/reachability/path, starter, assignment, Form, and dependency completeness in publication validation; return targetable readiness issues without rejecting Save Draft.
  - [x] Change publication validation to load the authoritative persisted draft for `expectedRevision` rather than merging a client-supplied candidate. Remove the redundant `draft` field from the validation request and regenerate the OpenAPI/client contract.
  - [x] Remove the redundant `draft` field from the publish request. Publish only from the authoritative draft at `expectedRevision` and re-run publication validation transactionally. A previous Validate action controls frontend enablement, but the backend never trusts a client-side `publishable` flag or validation result.
  - [x] Remove autosave timers/effects and automatic retries; implement Save Draft, `Ctrl/Cmd+S`, immutable request snapshots, explicit retry, and authoritative saved revision handling.
  - [x] Track the last successfully validated revision and clear publication readiness after any local edit or accepted revision change.

- [x] Verify the refactor and canvas (AC: 8)
  - [x] Add focused component tests for command adaptation, focus/error state, explicit save, no-background-save, dirty navigation decisions, conflicts, and publication state.
  - [x] Add backend contract/integration tests proving incomplete coherent drafts save; structurally corrupt drafts fail atomically; no bypass flag exists; validation ignores/rejects client-only candidate content and evaluates the saved revision; stale revisions fail; and publication remains blocked until the authoritative saved revision is complete.
  - [x] Confirm unsupported Conditional nodes never appear and no React Flow JSON is submitted as independent Workflow authority.
  - [x] Run affected unit, component, backend contract/integration, architecture, type, and build/static checks.
  - [x] Manually create, edit, save, reload, validate, and publish representative Workflows using pointer and keyboard paths; verify visible canvas feedback and recovery states.

### Review Findings

- [x] [Review][Patch] Allow more than one Task element; the palette adapter currently applies Start/End cardinality to Task and blocks supported multi-step workflows. [Moviqo.Front/src/features/workflow-design/model/flow.ts:75]
- [x] [Review][Patch] Reject connections with an occupied target or a resulting cycle before changing local state; the adapter currently accepts graphs that backend integrity rejects and a reachable cycle can recurse indefinitely in the outline. [Moviqo.Front/src/features/workflow-design/model/flow.ts:93]
- [x] [Review][Patch] Generate collision-safe stable connection IDs instead of deriving the next ID from array length. [Moviqo.Front/src/features/workflow-design/model/flow.ts:119]
- [x] [Review][Patch] Catch network and response-processing failures for save, validation, and publish; otherwise rejected transports strand the editor in a permanent busy state and make the immutable explicit retry unreachable. [Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts:78]
- [x] [Review][Patch] Prevent pointer/drop mutations while editing is disabled; a gesture queued before Save can currently alter local state after the immutable snapshot is sent and then be overwritten by the accepted response. [Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx:128]
- [x] [Review][Patch] Separate touch/pen placement from click addition so pointer-down does not add immediately and leave a stale canvas-placement operation armed. [Moviqo.Front/src/features/workflow-design/ui/WorkflowElementPalette.tsx:52]
- [x] [Review][Patch] Make conflict recovery reachable in the required order: load the latest revision while retaining the local snapshot, then allow reapplication onto that revision. [Moviqo.Front/src/features/workflow-design/model/editor.ts:735]
- [x] [Review][Patch] Clear stale publishability and expose reload recovery after validation or publication revision conflicts; Publish currently remains enabled against the stale revision. [Moviqo.Front/src/features/workflow-design/model/editor.ts:642]
- [x] [Review][Patch] Wire checklist actions to focus/scroll the relevant configuration or canvas region and route Form-related actions to the dedicated Form Designer; focusedChecklistSection currently has no rendered consumer. [Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts:218]
- [x] [Review][Patch] Preserve actionable save-validation guidance in a localized, focusable error summary linked to the affected controls or graph targets. [Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts:94]
- [x] [Review][Patch] Block Ctrl/Cmd+S while an explicit retry is in flight to prevent a new idempotency command racing the immutable retry. [Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts:126]
- [x] [Review][Patch] Guard unexpected-field inspection for non-object JSON bodies so malformed requests produce controlled 400 responses instead of TypeError-driven 500s. [Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py:682]
- [x] [Review][Patch] Replace the recursive backend cycle detector or enforce a safe graph bound so long coherent drafts cannot trigger RecursionError. [Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py:551]
- [x] [Review][Patch] Localize React Flow accessibility instructions and control labels through ariaLabelConfig for both Spanish and English. [Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx:166]
- [x] [Review][Patch] Ensure every repeated Add/connect result changes the live-region payload so consecutive operations are announced. [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:56]
- [x] [Review][Patch] Add localized checklist mappings for starter_invalid and assignment_invalid instead of reducing valid backend recovery guidance to the generic checklist error. [Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationChecklist.tsx:12]

## Dev Notes

- React Flow is an interaction/rendering dependency, not the Workflow domain model.
- The current buttons can update state while the preview is below the viewport. Immediate local selection/reveal is a required functional outcome, not optional animation.
- React Flow does not provide external palette drag/drop automatically; implement that boundary deliberately and retain non-drag alternatives.
- Do not add automatic layout for the linear Epic 1 graph. Revisit ELK or equivalent only when Epic 4 branching produces a measured need.
- Full authoring is desktop/laptop optimized; narrow layouts retain safe view/navigation and state the supported boundary.
- Save Draft and Publish are distinct commands. Saving preserves incomplete design work; validation determines readiness; publication consumes only the same saved validated revision. Do not reintroduce autosave through TanStack Query mutations or component effects.
- The endpoint communicates intent. `PUT .../draft/` performs draft-integrity checks; `POST .../publication-validation/` reports readiness for the saved revision; `POST .../publish/` revalidates and publishes that authoritative revision. A client flag must never weaken server validation.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
- https://reactflow.dev/learn/customization/custom-nodes
- https://reactflow.dev/learn/concepts/adding-interactivity
- https://reactflow.dev/examples/interaction/drag-and-drop

## Dev Agent Record

### Debug Log References

- Branch: `story/1-36-refactor-the-workflow-editor-and-adopt-react-flow`
- Baseline commit: `acb46ab0e2efea2d83aa1579d1dd8269edbef889`

### Implementation Plan

- Decompose Workflow authoring into a reducer-backed controller and focused presentation regions.
- Adapt the authoritative Moviqo document to React Flow without persisting canvas-owned state.
- Separate draft-integrity saves from authoritative publication-readiness validation.
- Protect explicit save, revision, idempotency, conflict, navigation, accessibility, and localization behavior with deterministic tests.

### Completion Notes

- Rebuilt the Workflow Editor around `useWorkflowDraftEditor`, a typed React Flow adapter, custom Start/Task/End nodes, sequence edges, an accessible complete outline, selected-element properties, publication configuration/checklist, persistent save status, and an explicit action bar.
- Added pointer drag, touch/pen placement, click/double-click, keyboard Add, handle and explicit connections, synchronized selection/reveal/focus, localized feedback, and a dirty-safe Design Form handoff. Form editing remains on its canonical route.
- Removed background autosave and automatic retry. Save Draft and Ctrl/Cmd+S submit immutable snapshots; only unknown outcomes retain the same explicit retry command, while semantic changes create a new command.
- Split backend draft integrity from publication readiness. Incomplete coherent drafts save, corrupt graphs fail atomically, validation and publish consume only the authoritative saved revision, and publish revalidates transactionally.
- Regenerated and validated OpenAPI plus the generated TypeScript client; validation and publish requests now contain only `expectedRevision`.
- Browser acceptance exercised keyboard and pointer Add, explicit connections, Ctrl+S, reload, validation, publish, dirty navigation, and Task-to-Form continuity. This caught and fixed disconnected outline omission and same-revision publish-success clearing.
- Validation passed: frontend unit suite, architecture suite, typecheck, production Vite build/static scan, 3 focused Chromium journeys, backend Ruff, and the full backend suite (`261 passed, 53 skipped`). The repository `check:api-client` clean-tree guard intentionally reports the regenerated client as changed until this story is committed; generation itself and downstream type/build checks pass.
- Code review resolved all 16 actionable findings, covering graph integrity, immutable retry and conflict recovery, disabled-state gesture safety, targetable validation recovery, React Flow localization, resilient backend request handling, and iterative cycle detection.

### File List

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/flow.ts`
- `Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowElementPalette.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowOutline.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationChecklist.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationConfiguration.tsx`
- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/e2e/authoring-navigation.spec.ts`
- `Moviqo.Front/tests/e2e/workflow-editor.spec.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `Moviqo.Front/tests/unit/workflow-editor.test.cts`
- `docs/api/openapi-v1.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`

### Change Log

- 2026-08-11: Implemented the React Flow-backed Workflow Editor refactor, explicit draft-integrity persistence, authoritative publication validation/publish contracts, dirty-safe Form navigation, and Story 1.36 verification. Status moved to review.
- 2026-08-11: Applied and verified all 16 adversarial code-review patches. Status moved to done.
