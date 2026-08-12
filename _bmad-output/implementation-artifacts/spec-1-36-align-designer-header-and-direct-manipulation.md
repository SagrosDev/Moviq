---
title: 'Align the Workflow designer and separate move from connect gestures'
type: 'bugfix'
created: '2026-08-12'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '35543b20debbecaf80e617ef65205eb1ac4af0d8'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The generic heading and repeated workflow name weaken the designer hierarchy. Tasks are difficult to move because two 44px connector Handles cover most of each compact node, so connection and canvas gestures compete with dragging.

**Approach:** Use the workflow name as the sole compact H1 beside the Flujos breadcrumb and keep Canvas aligned with Elements without a duplicate title. Give every node a clear body drag surface and center each practical connector region on its node edge, so the body moves the node while only the edge area starts a connection.

## Boundaries & Constraints

**Always:** Preserve the workflow name verbatim, one H1, semantic breadcrumbs, localized 44px Back action, responsive no-overflow layout, and a stable accessible Canvas focus target. Preserve persisted positions, explicit Save, selection, pan/zoom, edge endpoints/arrows, 44px practical connector targets, keyboard controls, visible focus, and disabled guards.

**Ask First:** Changing global authenticated navigation, workflow persistence/contracts, supported node types, connection rules, canvas minimum size, or the 1280px authoring boundary.

**Never:** Repeat the workflow name visibly, remove accessible Canvas labelling, reduce connector usability below 44px, let Handles cover the main drag surface, disable pan/zoom, add raw styles, or replace React Flow gesture authority.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Loaded designer | Normal or long name at desktop width | Flujos link, compact name H1, and Back form one row; Elements and Canvas start at the same Y | Long names wrap without page scrolling |
| Narrow or enlarged text | Header lacks horizontal space | Link, H1, and Back action stack in reading order | Every action remains visible, focusable, and at least 44px |
| Move a node | Pointer begins on the node body/label | Grab cursor is shown and the node moves without panning the canvas or starting a connection | Position remains reducer-authoritative, dirty, saveable, and reload-safe |
| Create a connection | Pointer or keyboard activates an edge control | Crosshair appears only near that edge and connecting remains reliable | Invalid/disabled gestures retain current behavior |
| Compact terminal | Start or End has one connector | Edge-biased 44px hit region remains usable without obscuring the terminal's central drag surface | Focus indicator identifies the connector and does not get clipped |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/shared/ui/layout.tsx` — compact breadcrumb PageHeader layout and long-name wrapping.
- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx` — workflow identity H1, Flujos breadcrumb, and Back composition.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` — aligned editor columns and Canvas prop cleanup.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — hidden label, status, drag surface, and Handles.
- `Moviqo.Front/src/app/styles.css` — tokenized drag cursor and edge-biased connector hit/focus geometry.
- `Moviqo.Front/tests/{unit,e2e}` — hierarchy, alignment, drag/pan separation, and pointer/keyboard connection coverage.

## Tasks & Acceptance

**Execution:**
- [x] `shared/ui/layout.tsx` and `WorkflowDesignPage.tsx` — use the workflow name as the compact sole H1 after a Flujos-only breadcrumb; preserve Back, stacking, and the default PageHeader branch.
- [x] `WorkflowDraftEditor.tsx` and `WorkflowCanvas.tsx` — remove the duplicate name, retain `workflow-canvas-title` as a localized screen-reader-only focus target, keep compact status/guidance, and align Canvas with Elements.
- [x] `WorkflowCanvas.tsx` and `styles.css` — establish a clear node-body drag surface and edge-biased 44px connector interaction regions with crosshair/focus only at the connection controls.
- [x] Shared UI and Workflow tests — verify semantics, overflow, Card alignment, body drag without pan/connect, connector cursors/targets, arrows, disabled state, and keyboard/pointer connections.

**Acceptance Criteria:**
- Given a loaded Workflow designer, when the page renders, then its workflow name is the only visible H1 and no generic or duplicate Canvas title is shown.
- Given the desktop designer, when its workspace appears, then the Elements and Canvas Card borders begin at the same vertical position.
- Given any node, when its body is dragged, then it moves and persists while the viewport and connections remain unchanged.
- Given a connector edge region, when the pointer enters or drags it, then the crosshair and 44px practical target are available without covering the main node body.
- Given keyboard use or a disabled editor, when connector controls are reached or activated, then existing accessible connection behavior and disabled guards remain authoritative.

## Spec Change Log

## Design Notes

The current 104px Task contains two 44px Handles entirely inside it, leaving about 16px unobstructed. Centering each Handle on its border leaves about 60px for dragging. Because React Flow measures the Handle box, custom saved-edge and connection-preview coordinates must still meet the node boundary exactly; tests must prove this with real pointer geometry.

## Verification

**Commands:**
- `npm run typecheck`, `npm run test:unit`, and `npm run test:architecture` — type, component, reducer, and boundary checks pass.
- Focused `chromium-desktop` and `firefox-desktop` Workflow E2E — header/alignment, body drag, unchanged viewport, pointer/keyboard connections, focus, arrows, and save/reload pass.
- `npm run build` and `git diff --check` — production artifact and patch are clean.
