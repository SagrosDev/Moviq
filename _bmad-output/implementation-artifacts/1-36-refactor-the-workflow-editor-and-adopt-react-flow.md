# Story 1.36: Refactor the Workflow Editor and Adopt React Flow

Status: ready-for-dev

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

8. **Protect unsaved work and verify behavior without a new E2E program:** Dirty state is persistent and navigation offers Save/Discard/Stay; an unknown save outcome can be retried explicitly with the same immutable payload/idempotency key, while changed content creates a new command key. Save failure/conflict preserves local work and never triggers a background retry. Deterministic reducer/model/backend contract tests and browser component tests cover adapters, all Add/connect methods, selection/reveal/focus, explicit save and keyboard shortcut, incomplete-draft acceptance, no background requests, dirty navigation, Task-to-Form continuity, conflict recovery, validation targeting, and publication revision gating. Story 1.33 remains the deployed regression.

Traceability: FR176-FR185, FR212-FR215, FR222, FR223, FR226-FR228, FR235, FR240, AD-5, AD-7, AD-9, UX-DR5-UX-DR11, UX-DR17, UX-DR20, UX-DR21, NFR16, NFR25.

## Tasks / Subtasks

- [ ] Refactor the existing editor around explicit ownership (AC: 1)
  - [ ] Extract `useWorkflowDraftEditor` for reducer state, dirty/explicit-save state, conflicts, validation, and publication orchestration.
  - [ ] Extract palette, canvas, outline, properties, configuration, checklist, action bar, and save-status components.
  - [ ] Remove embedded Form editing while retaining a Task Form status/route action.

- [ ] Integrate the React Flow canvas adapter (AC: 2, 6)
  - [ ] Import the pinned package and required styles through the approved styling boundary.
  - [ ] Implement typed document-to-flow and canvas-event-to-reducer adapters with stable Moviqo IDs.
  - [ ] Define custom Start, Task, and End nodes with visible labels/status and valid handles.
  - [ ] Persist positions only if the Workflow contract supports them; otherwise retain presentation positions without submitting a second graph document.

- [ ] Implement palette and immediate feedback (AC: 3, 5)
  - [ ] Add drag-to-canvas using a touch-compatible pointer approach that respects React Flow's external-palette boundary.
  - [ ] Add click/double-click and keyboard Add paths through the same reducer command.
  - [ ] Select, reveal, focus/announce, and open properties for an accepted element; explain rejected operations locally.

- [ ] Implement connection, selection, and Task Form navigation (AC: 4, 5, 8)
  - [ ] Translate valid handle connections into Moviqo sequence connections and retain explicit source/target controls.
  - [ ] Synchronize canvas and outline selection/focus without two semantic selection stores.
  - [ ] Route Design Form to `/workflows/:workflowId/tasks/:taskElementId/form`; when dirty, offer **Save and design form**, Discard, or Stay rather than saving implicitly.

- [ ] Separate Save Draft validation from publication readiness (AC: 7)
  - [ ] Keep the existing draft `PUT` endpoint and its optimistic-revision/idempotency contract. Do not add another save endpoint and do not add a request flag that lets the client select or bypass validation policy.
  - [ ] Split `validate_workflow_graph_document` into clearly named draft-integrity normalization/validation and publication-readiness validation. Draft integrity rejects malformed schema, unknown kinds, duplicate stable IDs, dangling references, forbidden connection directions/types, impossible maximum cardinality such as multiple Start/End elements, unauthorized references, and stale revisions, but permits missing required elements/connections, disconnected paths, and starter/assignment/Form completeness gaps.
  - [ ] Keep required Start/Task/End presence, complete connectivity/reachability/path, starter, assignment, Form, and dependency completeness in publication validation; return targetable readiness issues without rejecting Save Draft.
  - [ ] Change publication validation to load the authoritative persisted draft for `expectedRevision` rather than merging a client-supplied candidate. Remove the redundant `draft` field from the validation request and regenerate the OpenAPI/client contract.
  - [ ] Remove the redundant `draft` field from the publish request. Publish only from the authoritative draft at `expectedRevision` and re-run publication validation transactionally. A previous Validate action controls frontend enablement, but the backend never trusts a client-side `publishable` flag or validation result.
  - [ ] Remove autosave timers/effects and automatic retries; implement Save Draft, `Ctrl/Cmd+S`, immutable request snapshots, explicit retry, and authoritative saved revision handling.
  - [ ] Track the last successfully validated revision and clear publication readiness after any local edit or accepted revision change.

- [ ] Verify the refactor and canvas (AC: 8)
  - [ ] Add browser component tests for pointer, double-click, keyboard, focus, errors, explicit save, no-background-save, dirty navigation, conflicts, and publication.
  - [ ] Add backend contract/integration tests proving incomplete coherent drafts save; structurally corrupt drafts fail atomically; no bypass flag exists; validation ignores/rejects client-only candidate content and evaluates the saved revision; stale revisions fail; and publication remains blocked until the authoritative saved revision is complete.
  - [ ] Confirm unsupported Conditional nodes never appear and no React Flow JSON is submitted as independent Workflow authority.
  - [ ] Run affected unit, architecture, type, build/static, and existing local journey checks.

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
