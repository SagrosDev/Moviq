---
title: 'Persist the compact Workflow canvas layout'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: '250a777ad298c5603800d5c5bfc84996cba5399c'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-task-names-compact-nodes.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Moving Workflow objects changes only temporary React Flow state, so Save Draft omits their coordinates and reopening reconstructs a different layout. Nodes, labels, and visible connector dots also remain larger than desired.

**Approach:** Persist exact node coordinates in the authoritative revisioned Workflow draft and restore them on reload. Further compact the node shapes and typography, while keeping each small connector dot inside a practical 44px interaction target.

## Boundaries & Constraints

**Always:** Use explicit Save Draft and existing revision/conflict behavior; keep stable element IDs and semantic connections unchanged; allow partial layouts and deterministic fallback for legacy nodes; validate finite bounded coordinates; preserve keyboard movement and drag movement; keep localized accessible node/edge meaning and 44px interaction targets; use static Tailwind classes and named Moviqo tokens.

**Ask First:** Changing connection routing, adding auto-layout, saving pan/zoom, changing label-length rules, or making layout personal rather than shared.

**Never:** Reorder `elements` as a proxy for layout, autosave movement, store layout only in localStorage, expose Conditional Routing, or shrink the actual interactive target with the visible connector dot.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Drag and save | Node moved to valid `x/y` | Draft becomes dirty; save/reopen restores exact graph position | Existing explicit save recovery applies |
| Keyboard move | Focused node moved with arrows | Same authoritative layout command and dirty state | Disabled editor ignores movement |
| Legacy v5 draft | No saved layout | Schema v6 upcast adds an empty layout; topology fallback renders safely | First saved movement persists normally |
| Partial layout | Some node IDs lack coordinates | Saved positions win; missing nodes use non-overlapping topology fallback | Unknown IDs and invalid coordinates are rejected |
| Compact visuals | Start, Task, End and handles | Smaller shapes, font, and Task width; small connector dot remains easy to acquire | Full names remain programmatically available |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` — schema v6 layout contract, v5 upcast, normalization, and new-draft position.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` — preserve layout through saves/snapshots and audit layout-only changes.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` — expose layout through the API serializer/OpenAPI contract.
- `Moviqo.Front/src/features/workflow-design/model/types.ts` — authoritative layout types.
- `Moviqo.Front/src/features/workflow-design/model/editor.ts` — make pointer/keyboard position changes dirty draft mutations.
- `Moviqo.Front/src/features/workflow-design/model/flow.ts` — prefer saved positions and retain fallback for legacy/partial layouts.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — smaller visual treatment and shared movement behavior.
- `Moviqo.Front/src/app/styles.css` — compact node/font/dot tokens with a 44px handle hit area.
- OpenAPI, generated types, unit, integration, contract, and E2E artifacts — synchronized persistence proof.

## Tasks & Acceptance

**Execution:**
- [x] Add a backward-compatible schema v6 `layout.positions` contract; seed and normalize finite coordinates without a database migration.
- [x] Make saved layout the single position authority; drag, keyboard movement, add-at-position, save, conflict, and reload use it.
- [x] Add an aggregate layout audit event without misrepresenting movement as a semantic graph change.
- [x] Reduce Start/End diameter, Task dimensions, node font, and visible connector dot while retaining 44px hit targets.
- [x] Regenerate API artifacts and cover v5 upcast, invalid layouts, exact reload, layout-only saves, keyboard/drag movement, and compact accessibility.

**Acceptance Criteria:**
- Given a Designer moves nodes and explicitly saves, when the same draft is reopened, then every saved node restores its `x/y` position rather than insertion or topology order.
- Given a v5 or partial-layout draft, when it opens, then all nodes remain visible through deterministic fallback and later movements can be saved.
- Given pointer or keyboard movement, when a position changes, then the draft becomes dirty and existing revision-conflict recovery preserves the moved snapshot.
- Given compact nodes in Spanish or English, when rendered and zoomed normally, then Start/End are visibly smaller than Tasks, Task width/font are reduced, full labels remain accessible, and connector interaction targets remain at least 44px.
- Given a published Workflow, when only layout changes, then runtime sequence behavior and existing published Process snapshots remain unchanged.

## Spec Change Log

## Design Notes

Layout belongs in the revisioned Workflow JSON because it is shared designer-authored state, not runtime routing. Schema v6 adds `layout: { positions: { [elementId]: { x, y } } }`; the v5 upcast supplies an empty map. Persisted positions override topology fallback. Publishing may retain layout in the immutable snapshot, but runtime readers ignore it. No relational schema change or Django migration is needed.

## Verification

**Commands:**
- `npm run typecheck`, `npm run test:unit`, and `npm run test:architecture` — frontend contracts and boundaries pass.
- Focused Chromium Workflow Editor test — drag/keyboard move, save, reload, and compact target assertions pass.
- Focused backend unit/contract/PostgreSQL integration tests — v5 upcast, validation, save/reload, audit, and runtime neutrality pass.
- OpenAPI generation/check, Ruff, production Vite build, and `git diff --check` — generated and build artifacts remain consistent.

## Suggested Review Order

**Authoritative layout lifecycle**

- Start with schema v6 normalization, legacy upcast, and seeded Start coordinates.
  [`schema.py:134`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py#L134)

- Persist both explicit drops and deterministic palette/keyboard positions immediately.
  [`editor.ts:532`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L532)

- Prefer persisted coordinates while safely placing legacy or partial-layout nodes.
  [`flow.ts:83`](../../Moviqo.Front/src/features/workflow-design/model/flow.ts#L83)

- Record layout-only revisions without mislabeling them as semantic graph changes.
  [`services.py:1199`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L1199)

**Compact, usable canvas**

- Keep localized compact shapes and keyboard/drag movement on the React Flow adapter.
  [`WorkflowCanvas.tsx:42`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L42)

- Separate the 12px visible connector dot from its 44px interaction target.
  [`styles.css:54`](../../Moviqo.Front/src/app/styles.css#L54)

**Regression evidence**

- Prove exact drag/keyboard coordinates and compact sizing survive save and reload.
  [`workflow-editor.spec.ts:29`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L29)

- Cover fallbacks, authoritative additions, stale callbacks, and reducer movement semantics.
  [`workflow-editor.test.cts:77`](../../Moviqo.Front/tests/unit/workflow-editor.test.cts#L77)

- Verify layout-only API saves advance revisions and emit the aggregate audit event.
  [`test_workflow_design_contract.py:801`](../../Moviqo.Back/tests/contract/test_workflow_design_contract.py#L801)
