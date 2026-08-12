---
title: 'Make the Workflow canvas compact, stable, and self-explanatory'
type: 'feature'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: '911a0bb85959af7813c644ae110ea7809c0c5a65'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Generic Task names, oversized nodes, reload-time reordering, a growing visible outline, subtle connection handles, and unlabeled edges make the Workflow canvas difficult to scan and explain. New Workflows also require a redundant manual Start addition even though exactly one Start is mandatory.

**Approach:** Make Task and connection labels editable through Properties, seed each new Workflow with an undeletable Start, derive reload layout from the saved graph path, and reorganize the workspace around a wider compact canvas with discoverable drag handles. Remove the growing visible outline while retaining complete keyboard/non-drag authoring through the canvas, palette, Properties, and explicit connection controls.

## Boundaries & Constraints

**Always:** Keep the Workflow reducer and revisioned draft authoritative; mark label changes dirty and require explicit Save Draft; clear stale publication readiness after label changes; preserve stable IDs, references, conflict recovery, and immutable published versions; keep free-form coordinates presentation-only; use shared controls, approved static Tailwind/token classes, localized UI copy, 44px targets, visible focus, keyboard operation, and screen-reader node/edge meaning. Existing published Process instances retain their snapshot; newly published versions and Processes use saved labels.

**Ask First:** Persisting exact free-form coordinates, label uniqueness or a new maximum length, automatic save, deleting Start, or changing runtime routing semantics.

**Never:** Add Conditional Routing, branches, loops, a second label/graph store, raw component hex/spacing values, or translate designer-authored labels. Conditional Routing remains owned by Story 4.2.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Rename selected Task | Nonblank designer-authored name | Canvas, connection choices, and Properties update; draft becomes dirty | Save remains explicit |
| Blank Task name | Empty or whitespace-only input | Value is preserved for correction but cannot be saved | Localized associated error; Save Draft disabled/guarded |
| Select Start or End | Non-Task element | Name remains read-only | No rename action is exposed |
| Save and publish rename | Valid dirty Task label | Save payload contains the label; new published runtime views use it | Existing published instances remain unchanged |
| Compact canvas | Start, Task, End nodes | Start/End are smaller circles; Tasks are compact rectangles with names only | Type remains available to assistive technology |
| Reload connected graph | Element array differs from logical path | Default positions follow Start through saved connections, with disconnected nodes placed afterward | Cycles/malformed paths remain bounded and visible |
| Label a connection | Optional nonblank designer-authored reason | Selected edge displays and persists its label | Blank removes the optional label; runtime sequence behavior is unchanged |
| Connect visually | Drag from a visible source handle to a valid target | One authoritative sequence connection is created and selected | Existing direction, cardinality, and cycle rejection remains localized |
| Create Workflow | New authorized Workflow | Draft already contains one Start; normal palette offers Task and End | Older drafts missing Start retain a recovery-only Add Start action |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` — seed Start and upcast v4 drafts into a v5 connection-label contract.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` — expose the additive connection label in the generated contract.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` — preserve label metadata in saved/published snapshots and audit diffs.
- `docs/api/openapi-v1.json` and generated schema — synchronized additive connection-label contract.
- `Moviqo.Front/src/features/workflow-design/model/types.ts` — optional authoritative connection label.
- `Moviqo.Front/src/features/workflow-design/model/flow.ts` — topology-derived fallback positions and labeled/selectable edges.
- `Moviqo.Front/src/features/workflow-design/model/editor.ts` — element/edge selection, label mutation, dirty state, and publication invalidation.
- `Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts` — controller command and save guard.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx` — selected Task/connection editing and explicit non-drag connection controls.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — compact nodes, labeled selectable edges, and discoverable handles.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` — two-column workspace with Palette/Properties left and wider canvas right.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowElementPalette.tsx` — normal Task/End additions and missing-Start recovery.
- `Moviqo.Front/src/shared/localization/messages.ts` — bilingual field, handle, edge, and recovery copy.
- Frontend/backend unit, contract, integration, and E2E tests — persistence, layout, interaction, accessibility, and runtime-label evidence.

## Tasks & Acceptance

**Execution:**
- [x] Backend schema, serializers, services, OpenAPI, and generated types — seed Start for new drafts, bump/upcast the draft schema for optional connection labels, and preserve sequence execution.
- [x] Frontend types, flow adapter, reducer, and controller — support Task/edge selection and labels, dirty/publication invalidation, valid-save guards, and topology-derived reload layout.
- [x] Properties, palette, canvas, and workspace — replace the visible growing outline with left-side Properties, widen the canvas, compact shapes, add labeled selectable edges, enlarge discoverable drag handles, and retain explicit keyboard/non-drag connection controls.
- [x] Localization — add reviewed Spanish/English name, edge-label, handle guidance, validation, and missing-Start recovery copy.
- [x] Unit, contract, integration, architecture, build, and E2E tests — prove default Start, backward compatibility, labels, logical reload order, connection gestures, responsive layout, accessibility, and continued absence of Conditional Routing.

**Acceptance Criteria:**
- Given a selected Task, when its name changes to a nonblank value, then every draft-derived editor label updates immediately and Save Draft persists that same value under the existing element ID.
- Given a blank Task name, when Save Draft is considered through button or keyboard paths, then no request is sent and the localized field error identifies the correction.
- Given a previously validated revision, when a Task is renamed, then publication readiness is cleared until the changed draft is saved and validated again.
- Given the canvas in Spanish or English, when Start, Task, and End render, then their shapes are compact and distinct, only names are visually displayed, and element types remain programmatically understandable.
- Given a saved connected path whose element array has a different order, when the draft reloads, then fallback positions follow the Start-to-End connection path and disconnected elements follow without overlapping.
- Given a selected connection, when its optional label changes, then the edge updates immediately, Save/reload preserves it, and runtime routing remains a normal sequence.
- Given pointer or keyboard-only authoring, when a Designer connects nodes, then visible handles or explicit Properties controls create the same reducer command with the same rejection rules.
- Given a new Workflow, when creation succeeds, then one Start already exists, cannot be deleted, and is absent from the normal palette; a legacy draft missing Start remains repairable.
- Given the visible outline is removed, when a Designer authors without dragging, then every element remains selectable from the keyboard-accessible canvas and every connection remains creatable through Properties without layout growth below the canvas.
- Given the palette and typed model, when the change is complete, then Conditional Routing is still not exposed.

## Spec Change Log

## Design Notes

The runtime Dashboard and Task Form already resolve titles from immutable published `element.label` values. Duplicate node/edge labels remain valid because stable IDs own identity. Reload stability comes from a small deterministic topology fallback—not a general layout engine or saved coordinates—so React Flow remains an interaction adapter. Schema v5 adds optional connection presentation labels; the v4 upcast supplies no label and sequence evaluation ignores the field. The visible outline is replaced by a non-focusable screen-reader graph summary referenced by the canvas, while canvas nodes and explicit Properties controls retain keyboard selection and connection creation.

## Verification

**Commands:**
- `npm run typecheck` — TypeScript passes.
- `npm run test:unit` — reducer, localization, and UI contract tests pass.
- `npm run test:architecture` — feature/shared boundaries remain intact.
- `npm run build` — production output succeeds.
- Focused backend workflow-design tests — new Start and optional edge labels save, reload, publish, and remain backward compatible.
- Focused Chromium workflow-editor journey — rename, blank correction, logical reload order, edge label, handle drag, workspace layout, and explicit save payload pass.
- `git diff --check` — no whitespace errors.

## Suggested Review Order

**Workspace and interaction model**

- Start with the two-column composition and persistent invalid-name recovery.
  [`WorkflowDraftEditor.tsx:33`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx#L33)

- Review compact nodes, labeled edges, keyboard selection, and accessible graph summary.
  [`WorkflowCanvas.tsx:120`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L120)

- See Task and connection editing plus duplicate-name disambiguation.
  [`WorkflowProperties.tsx:24`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx#L24)

**Authoritative draft behavior**

- Follow deterministic topology ordering and shared connection validation.
  [`flow.ts:57`](../../Moviqo.Front/src/features/workflow-design/model/flow.ts#L57)

- Confirm label edits dirty the draft and invalidate publication readiness.
  [`editor.ts:607`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L607)

- Inspect schema v5, v4 upcasting, and seeded Start creation.
  [`schema.py:163`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py#L163)

- Verify save authority preserves the existing Start identity.
  [`services.py:448`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L448)

**Regression evidence**

- Exercise rename, drag-connect, labels, reload, keyboard selection, and publish.
  [`workflow-editor.spec.ts:29`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L29)

- Prove direct API saves cannot remove an existing Start.
  [`test_workflow_design_integration.py:550`](../../Moviqo.Back/tests/integration/test_workflow_design_integration.py#L550)

- Verify v4 connections upcast safely into the v5 contract.
  [`test_workflow_design_schema_registry.py:33`](../../Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py#L33)
