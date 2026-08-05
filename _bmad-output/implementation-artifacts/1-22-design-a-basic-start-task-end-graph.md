---
baseline_commit: 1d2a994712210b9c0acdc4d663f094bdd2e27583
---

# Story 1.22: Design a Basic Start-Task-End Graph

Status: done

## Story

As a Designer,
I want to connect Start, one Task, and End using guided controls,
so that the first Workflow has one understandable executable path.

## Acceptance Criteria

1. **Guided graph creation:** Given a new shared draft, when the Designer adds Start, Task, and End through pointer, keyboard, or non-drag controls and connects them in order, then the draft stores stable element and connection IDs and renders one Start -> Task -> End path with plain-language labels, and the server accepts only supported element and connection types. Traceability: FR212, FR213, FR214, FR215, UX-DR6, UX-DR7.
2. **Invalid graph protection:** Given a second Start, a missing End, a disconnected Task, an End with outgoing work, or another invalid connection, when the edit is saved or validated, then the server rejects the invalid mutation or returns a precise draft validation issue linked to the affected element, and the last valid shared draft remains available. Traceability: FR212, FR213, FR214, FR215, FR632, AD-6.
3. **Revision-safe semantic saves:** Given two sequential draft edits using revision tokens, when each valid edit commits, then the draft revision advances exactly once per command and the response contains the authoritative document and revision, and audit identifies the semantic element or connection change rather than storing only an opaque document replacement. Traceability: AD-3, AD-4, AD-5.

## Tasks / Subtasks

- [ ] Extend the workflow-design backend draft schema and command surface for graph edits (AC: 1-3)
  - [ ] Evolve `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` from the current create-only document shape into a validated graph document that can represent supported workflow elements and directed connections with stable IDs, while preserving upcast compatibility for drafts created by Story 1.21.
  - [ ] Add an authenticated draft-mutation application command under `Moviqo.Back/src/moviqo/modules/workflow_design/application/` that accepts the client's expected revision, enforces the Start/Task/End cardinality rules server-side, rejects unsupported element or connection types, and returns the authoritative draft plus next revision.
  - [ ] Record semantic audit evidence for graph changes such as element added, connection created, or invalid graph rejected; do not emit audit as a generic full-document replacement only.
  - [ ] Keep mutations inside the existing atomic-command and tenant-context patterns. A failed validation must leave the last valid persisted draft unchanged.
- [ ] Expose authoritative API contracts for draft editing and validation (AC: 1-3)
  - [ ] Extend `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` and `Moviqo.Back/src/moviqo/urls.py` with the minimum route set needed to save and, if separated, validate a draft graph through `/api/v1`.
  - [ ] Reuse the existing design-role guard, hostile-tenant rejection pattern, Problem Details conventions, and generated OpenAPI workflow. Do not introduce a parallel controller stack or client-maintained contract types.
  - [ ] Ensure revision mismatches and invalid graph mutations return stable, localized-safe errors that let the UI preserve local work and reload or retry intentionally.
- [ ] Replace the post-create placeholder with a guided Start-Task-End authoring experience (AC: 1-2)
  - [ ] Evolve the current workflow-create flow in `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx` from a draft summary panel into the first guided workflow designer step after creation, without losing the existing creation form and role gate.
  - [ ] Use visible add/connect controls plus keyboard-completable interactions; drag can be additive, but the story must remain fully usable through non-drag controls because the UX explicitly requires them.
  - [ ] Keep labels plain-language and Spanish-first with English fallback. Use workflow terms such as `Start`, `Task`, `End`, `Connect`, and `Save draft`; do not expose implementation language like `node`, `edge`, or `graph topology` as the primary user copy.
  - [ ] Reuse the existing shared draft state seam in `Moviqo.Front/src/shared/drafts/` instead of introducing separate graph-authoring state semantics that bypass revision tokens or server responses.
- [ ] Add executable evidence across schema evolution, contracts, persistence, and authoring UX (AC: 1-3)
  - [ ] Add backend unit tests for schema validation and upcasting of the new draft shape, including fixtures proving Story 1.21-era drafts remain readable.
  - [ ] Add backend contract tests for valid Start -> Task -> End saves, unsupported type rejection, invalid cardinality or connectivity rejection, and stable Problem Details responses.
  - [ ] Add real-PostgreSQL integration tests proving one revision increment per successful edit, no persisted mutation on rejected edits, and semantic audit evidence in the same transaction as the accepted draft update.
  - [ ] Add frontend unit coverage for guided add/connect controls, non-drag accessibility paths, authoritative save handling, and preservation of the last valid draft after server rejection. Keep new `.ts` and `.tsx` functions as arrow-function constants per `AGENTS.md`.

## Dev Notes

### Story intent and scope

- Story 1.22 is the first workflow-graph authoring slice after Story 1.21 created the Workflow and its shared draft. This story stops at one executable Start -> Task -> End path.
- Conditional Routing, multiple Tasks, starters, assignments, autosave conflict resolution, Form composition, and publication remain in later stories 1.23 through 1.28 and 4.x. Do not smuggle those capabilities into this story.
- The main developer risk is treating React Flow as the source of truth. The architecture says the backend owns the schema, validation, revision progression, and audit trail. The frontend is an authoring client over an authoritative draft contract.

### Epic and PRD requirements to carry forward

- FR212 through FR215 define the minimum valid workflow graph:
  - exactly one Start,
  - exactly one End,
  - at least one Task,
  - a valid path from Start through a Task to End,
  - Start has no incoming and exactly one outgoing connection to a Task,
  - End has incoming work and no outgoing connection,
  - every active Task has at least one incoming and exactly one outgoing connection whose target is an active Task or End in this story's limited scope.
- FR632 applies here even before publication: validation failures must not destroy the shared draft or force the user to reconstruct the last valid graph.
- UX guidance requires one decision per step, plain-language workflow element purpose, visible add/connect controls, and a non-drag path for adding and ordering workflow elements.

### Existing implementation to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` currently accepts only top-level draft fields `schemaVersion`, `draftId`, `workflowId`, `name`, `status`, and `elements`. It has no connection model and only shallow validation. Story 1.22 should evolve this schema instead of introducing a second draft format elsewhere.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` currently supports create, catalog list, and draft read. There is no draft-update command yet. Add the new save/edit behavior inside this module boundary.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` and `Moviqo.Back/src/moviqo/urls.py` currently expose only collection create/list and draft detail read routes. Draft editing will need a new authenticated `/api/v1/workflow-design/...` route that follows the same tenant bootstrap and role checks.
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx` currently shows the creation form and, after success, a passive draft summary with a disabled `Save draft` button. Story 1.22 should turn that post-create state into the first real graph-authoring surface.
- `Moviqo.Front/src/features/workflow-design/model/types.ts` currently types a draft as `elements: Array<Record<string, unknown>>`. Tighten this into explicit authoring types rather than leaving graph structure untyped.
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts` is the existing seam for revision-aware authoritative updates. Extend or reuse it; do not replace it with ad hoc mutable graph state that can silently diverge from the server.

### Architecture guardrails

- Follow AD-3: every accepted graph edit must commit draft state, idempotent command result if applicable, and audit evidence in one transaction.
- Follow AD-4: keep workflow metadata relational and the design document schema-versioned JSON. If the document shape changes materially, support read-upcast for already-created drafts rather than orphaning Story 1.21 data.
- Follow AD-5: there is still exactly one mutable draft per Workflow with optimistic revision control. Save Draft and later publication lock the same workflow head; do not create branch drafts or local-only alternates.
- Follow AD-6: graph validity comes from a deterministic backend validator. The browser may assist the user but cannot be the only enforcement point for cardinality or connection rules.
- Follow AD-7 and AD-9: authorization stays server-side, `/api/v1` OpenAPI stays authoritative, and frontend graph editing must stay feature-sliced and reducer-based instead of introducing a second remote-state framework.

### Likely backend files to add or update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Back/tests/unit/fixtures/workflow_design/`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `docs/api/openapi-v1.json`

### Likely frontend files to add or update

- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/`
- `Moviqo.Front/src/features/workflow-design/ui/`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- additional workflow-design unit tests under `Moviqo.Front/tests/unit/`

### Data and contract expectations

- Preserve stable IDs for every persisted graph element and connection. IDs must survive draft reloads and revision changes.
- Supported element and connection types should be explicit and closed over the MVP scope in this story. The server must reject unsupported or future-only types rather than storing them optimistically.
- The save response must return the authoritative draft document and the next revision so the client can replace local state rather than merge speculative edits.
- Validation issues should point to the affected element or connection with enough structure for the UI to focus the user back on the failing part of the graph.
- Keep the last valid shared draft persisted when a mutation is rejected. Invalid local attempts may remain in transient UI state, but they must not overwrite the server copy.

### Frontend and UX guardrails

- Workflow authoring remains optimized for laptop and desktop. Narrow/mobile views may support viewing or lightweight navigation only; do not claim full authoring support below the supported width.
- Use guided-step and guidance-card patterns from the UX docs: teach one action at a time, keep the next action obvious, and avoid a blank technical canvas.
- Provide keyboard-completable controls for adding Start, Task, End, and for creating the required ordered connections. Drag support can exist, but it cannot be the only path.
- Keep visible focus, plain labels, semantic headings, and non-color-only validation feedback. Error language should read like workflow guidance, not engine diagnostics.

### Testing requirements

- Start with failing tests that encode the allowed Start -> Task -> End shape and the rejected invalid shapes.
- Add schema fixture coverage for backward compatibility from Story 1.21 drafts into the richer Story 1.22 document shape.
- Add contract and integration evidence for:
  - valid graph save,
  - second Start rejection,
  - missing End or disconnected Task rejection,
  - End with outgoing connection rejection,
  - revision mismatch handling,
  - semantic audit payload content,
  - unchanged persisted draft after rejection.
- Add frontend tests that prove:
  - the guided controls can create the minimum path without drag,
  - the UI renders the authoritative saved graph after a successful response,
  - the last valid server draft remains visible or recoverable after a rejected edit,
  - localized plain-language labels remain intact.

### Review Findings

- [x] [Review][Patch] Stale revisions are validated before they are rejected as stale [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:172]
- [x] [Review][Patch] Validation issues are flattened to top-level `elements` and `connections`, losing the affected target [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:353]
- [x] [Review][Patch] Rejected draft saves bypass the atomic-command and idempotency path [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:186]
- [x] [Review][Patch] Semantic audit covers additions only and falls back to a generic save event for later graph edits [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:387]
- [x] [Review][Patch] Rejected-edit audit payloads use the workflow draft row ID instead of the document draft ID [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:380]
- [x] [Review][Patch] Blank element and connection IDs or labels are accepted by the server [Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py:131]
- [x] [Review][Patch] The guided editor can create extra tasks that it cannot connect or recover from [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:106]
- [x] [Review][Patch] Persisted workflow labels are hardcoded in English instead of Spanish-first with fallback [Moviqo.Front/src/features/workflow-design/model/editor.ts:258]
- [x] [Review][Patch] Any server-side draft refresh overwrites transient local edits unconditionally [Moviqo.Front/src/features/workflow-design/model/editor.ts:161]

### Latest technical information

- As of the React Flow docs last updated on July 7-22, 2026, `@xyflow/react` 12.11.2 remains the repository-pinned graph library and its documented JSON save shape is `ReactFlowJsonObject` with `nodes`, `edges`, and `viewport`. For this story, use React Flow as the authoring/rendering library, but keep Moviqo's backend draft contract explicit and versioned rather than persisting React Flow internals wholesale. This recommendation is an inference from AD-4 and AD-6 combined with the official docs.
- The current React Flow quick-start docs still require importing `@xyflow/react/dist/style.css` and rendering `<ReactFlow />` inside a parent with explicit width and height. Preserve those requirements if Story 1.22 introduces the first live canvas surface.
- The official `addEdge()` utility currently validates duplicate or invalid connections before adding them to the local edge array. It is useful for local UX, but it is not a substitute for Moviqo's server-side graph validator.
- React 19 remains the stable major line used in this repo. Keep the graph authoring state explicit and reducer-friendly, aligned with the existing revision-based draft seam rather than opaque mutable instance state.

### Anti-patterns and out-of-scope work

- Do not persist only a client-side canvas state or trust the browser to define valid workflow semantics.
- Do not expose raw React Flow terminology as the primary business copy for Designers.
- Do not introduce Conditional Routing, loops, multiple Tasks beyond what is needed to prove the minimal path, publication rules, starters, or runtime task execution.
- Do not add Redis, WebSockets, live collaboration, background autosave daemons, or a second query/state library for graph editing.
- Do not bypass the `workflow_design` module boundary by writing draft mutations from `workflow_runtime` or any page/component-local API helper.

### Project Structure Notes

- The repo already places workflow-authoring UI under `Moviqo.Front/src/features/workflow-design/` and the route shell under `Moviqo.Front/src/pages/workflow-create/`. Continue that split: feature logic/components in the feature slice, route composition in the page slice.
- Backend workflow-design behavior is already consolidated under `Moviqo.Back/src/moviqo/modules/workflow_design/application/`. Keep new commands, serializers, validators, and service helpers there unless a shared building-block abstraction is clearly reusable beyond this module.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.22, Story 1.23, Story 1.27]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR212, FR213, FR214, FR215, FR632]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-3, AD-4, AD-5, AD-6, AD-7, AD-9, AD-16; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Component Patterns; State Patterns; Interaction Primitives; Accessibility Floor; Responsive & Platform; Flow 1]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowCreateForm.tsx`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`]
- [Technical reference: React Flow docs, https://reactflow.dev/learn]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/react-flow]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/types/react-flow-json-object]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/utils/add-edge]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `python _bmad/scripts/resolve_customization.py --skill .agents/skills/bmad-create-story --key workflow`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content _bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Back/src/moviqo/urls.py`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Front/src/app/ui/App.tsx`
- `Get-Content Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowCreateForm.tsx`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`

### Completion Notes List

- Story 1.22 context created from Epic 1, requirements inventory, architecture, UX, and the completed Story 1.21 implementation.
- Developer guidance focuses on the real seam introduced by the current codebase: schema evolution, authenticated draft mutation, revision-safe saves, and guided non-drag graph authoring.
- Sprint status should move from `backlog` to `ready-for-dev` for `1-22-design-a-basic-start-task-end-graph`.

### File List

- `_bmad-output/implementation-artifacts/1-22-design-a-basic-start-task-end-graph.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
