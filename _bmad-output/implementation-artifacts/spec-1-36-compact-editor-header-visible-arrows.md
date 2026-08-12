---
title: 'Compact the Workflow header and expose connector arrows'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: '22e7f0f08d60cb86523c7e4da6a1c671e9036d42'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-prioritize-workflow-designer-layout.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The breadcrumb, “Diseña tu flujo de trabajo” title, and “Volver a flujos” action still consume separate rows above the designer. Connector arrows exist in the SVG but are hidden by the visible target-port circles, while connector labels remain visually oversized for the compact diagram.

**Approach:** Present breadcrumb, title, and back action as one compact desktop header row with safe responsive stacking. Keep the connector's full accessible interaction target while shrinking its visible dot, exposing the React Flow arrow, and reducing edge-label typography, padding, and width without obscuring the path.

## Boundaries & Constraints

**Always:** Preserve one H1, semantic breadcrumb navigation and `aria-current`, the localized 44px back action, DOM reading order, and wrapping without horizontal overflow. Keep 44px pointer/keyboard Handle targets, exact edge endpoints, normal/selected marker color continuity, label text and accessible edge names, selection, and saved layout unchanged; keep long edge labels bounded and clear of their paths.

**Ask First:** Changing the authenticated global navigation, hiding the breadcrumb/current workflow identity, reducing the actual connector interaction target below 44px, or changing node/edge persistence and connection rules.

**Never:** Force one row below the supported 1280px authoring breakpoint, recreate shared page-header typography locally, paint arrows over nodes by elevating edge z-index, move endpoints away from ports, remove keyboard handles, or introduce raw component colors/spacing instead of named Moviqo tokens.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Desktop header | Width at least 1280px; normal or long workflow name | Breadcrumb, H1, and back action share one aligned row; long text wraps within its region | No horizontal page overflow; action remains at least 44px |
| Narrow/zoomed header | Width below authoring breakpoint or enlarged text | Regions stack in semantic order: breadcrumb, H1, action | All content remains readable and focusable |
| Connected nodes | Normal or selected sequence edge | Closed arrow is visible immediately before the 6px target dot and matches the path color | Edge still meets the target center; no blank endpoint gap |
| Connector interaction | Pointer or keyboard connects nodes | Visual dot is 6px but the real Handle target remains 44px | Existing gestures and focus outline remain reliable |
| Connector label | Short or wrapping designer-authored text | Compact label uses smaller approved typography, tighter padding, and a narrower bound above/beside the edge | Text remains readable, wraps predictably, and never covers or clips the connector |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/shared/ui/layout.tsx` — optional domain-free breadcrumb slot in `PageHeader` and responsive three-region layout.
- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx` — compose the existing breadcrumb inside the shared header.
- `Moviqo.Front/src/app/styles.css` — named visible-port and connector-label tokens while retaining the 44px Handle target.
- `Moviqo.Front/src/features/workflow-design/model/flow.ts` — shared normal marker geometry.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — preserve marker geometry when applying selected color.
- `Moviqo.Front/tests/{unit,e2e}` — responsive header semantics and real arrow/port visibility coverage.

## Tasks & Acceptance

**Execution:**
- [x] `shared/ui/layout.tsx` and `WorkflowDesignPage.tsx` — add an optional breadcrumb slot to the shared PageHeader, use a three-column desktop row, and keep all other PageHeader consumers unchanged.
- [x] `styles.css`, `flow.ts`, and `WorkflowCanvas.tsx` — reduce only the visible port token to 6px, apply a consistent 24×24 closed marker in normal and selected states, and compact connector labels with approved named typography/spacing/width tokens.
- [x] Shared UI and Workflow tests — verify semantic DOM order, one-row desktop alignment, narrow reflow/no overflow, 44px Handle target, 6px dot, marker footprint, endpoint continuity, colors, compact short/wrapping labels, and pointer/keyboard connections.

**Acceptance Criteria:**
- Given the desktop Workflow designer, when it renders at 1280px or wider, then breadcrumb, “Diseña tu flujo de trabajo,” and “Volver a flujos” occupy one aligned row.
- Given the same header at a narrower width or enlarged text, when space is insufficient, then it stacks without clipping or horizontal scrolling.
- Given a sequence connector, when viewed at fitted zoom, then a closed arrow remains visibly exposed before the smaller target dot for both normal and selected edges.
- Given the smaller visible port, when connecting by pointer or keyboard, then the usable target remains 44px and connection behavior remains unchanged.
- Given a labeled connector, when its text is short or wraps, then the label is visibly smaller and tighter while remaining readable, bounded, and clear of the connector path.

## Spec Change Log

## Design Notes

The current arrow reaches the exact target center but extends only about 3.1px behind it; the 8px port has a 4px radius and renders above the edge, fully occluding the marker. A 24×24 marker extends about 6px behind the target, while a 6px dot covers only 3px, exposing the arrow without moving the endpoint or changing layer order. Connector-label compaction changes presentation only: designer-authored text and the accessible edge description remain unchanged.

## Verification

**Commands:**
- `npm run typecheck`, `npm run test:unit`, and `npm run test:architecture` — types, shared primitives, and feature boundaries pass.
- Focused `chromium-desktop` Workflow E2E — desktop row, narrow reflow, 44px/6px port geometry, visible arrow footprint, endpoint attachment, compact short/wrapping labels, and pointer/keyboard connections pass.
- `npm run build` and `git diff --check` — production artifact and patch are clean.

## Suggested Review Order

**Compact responsive header**

- Start with the shared optional three-region header that preserves existing consumers.
  [`layout.tsx:174`](../../Moviqo.Front/src/shared/ui/layout.tsx#L174)

- Compose the existing semantic breadcrumb inside the Workflow page header.
  [`WorkflowDesignPage.tsx:111`](../../Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx#L111)

- Harden breadcrumb content against unbroken workflow-name overflow.
  [`layout.tsx:237`](../../Moviqo.Front/src/shared/ui/layout.tsx#L237)

**Arrow, port, and label geometry**

- Keep the hit target unchanged while fixing the visible port at six pixels.
  [`styles.css:44`](../../Moviqo.Front/src/app/styles.css#L44)

- Give normal sequence edges enough marker footprint to remain exposed.
  [`flow.ts:125`](../../Moviqo.Front/src/features/workflow-design/model/flow.ts#L125)

- Preserve marker geometry and focus color when selecting a connection.
  [`WorkflowCanvas.tsx:241`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L241)

- Compact connector labels with named typography, width, and padding tokens.
  [`WorkflowCanvas.tsx:146`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L146)

**Verification**

- Exercise real breadcrumb semantics and preserve the legacy PageHeader branch.
  [`shared-ui.test.cts:141`](../../Moviqo.Front/tests/unit/shared-ui.test.cts#L141)

- Verify desktop/narrow/text-zoom header geometry and accessible targets.
  [`workflow-editor.spec.ts:168`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L168)

- Measure screen-space arrow exposure, endpoint attachment, and compact labels.
  [`workflow-editor.spec.ts:43`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L43)
