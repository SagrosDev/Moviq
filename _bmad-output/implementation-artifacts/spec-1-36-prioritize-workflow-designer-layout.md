---
title: 'Prioritize the Workflow designer surface'
type: 'refactor'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'afdb3434abe771894e46e9f6e23a4412a598b0bf'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-polish-canvas-properties-member-identity.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Workflow designer is pushed down by milestone-oriented page copy and an always-large draft-status card, while the generic canvas title hides the workflow's actual name. Connector arrows also appear missing because their pale React Flow marker does not match the darker connector path.

**Approach:** Make the designer the page's visual priority: use a friendly page title, place the workflow name on the canvas, compress routine save/revision information, and expand recovery feedback only when action is required. Restore a clearly visible arrow at every connector target without disturbing the recently approved port and label geometry.

## Boundaries & Constraints

**Always:** Keep one clear H1; preserve the workflow name in breadcrumbs and as the canvas H2; retain explicit Save/Publish semantics, optimistic revision checks, conflict recovery, focused error summaries, live status announcements, and bilingual copy. Keep React Flow authoritative for edge presentation and preserve current edge selection, label placement, 8px visible ports, 44px interaction targets, and pointer/keyboard connection behavior.

**Ask First:** Changing the workflow name itself in this screen, removing visible revision information entirely, changing when revisions increment, changing Save/Publish behavior, or redesigning the global authenticated header/navigation.

**Never:** Present “Primer camino ejecutable” as user guidance, hardcode current element types into the page title, hide errors/conflicts in a passive badge, draw arrowheads manually outside React Flow, reintroduce endpoint gaps, or add raw colors/spacing outside approved Moviqo tokens.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Routine editing | Clean, dirty, saving, or retrying draft | Compact status near the canvas name communicates state; a clean draft includes its acknowledged revision | Status remains polite and does not add a large page-level card |
| Recovery needed | Save error, stale revision/conflict, or publish feedback | Prominent localized feedback and existing recovery actions render above the designer and receive the current focus behavior | Correctable work and reload/reapply actions remain available |
| Workflow identity | Long or normal workflow name | Name replaces “Lienzo del flujo” as the wrapping canvas H2 and remains the current breadcrumb item | Loading fallback remains localized; no overflow |
| Sequence edge | Selected/unselected connector at fitted zoom | Dark, token-colored closed arrow is visibly attached at the target; line, label, and endpoints remain unchanged | Actual edge path references a nontransparent marker |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx` — compact page hierarchy and workflow-name propagation.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` — compose compact routine status separately from conditional recovery feedback.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx` — preserve revision semantics while reducing routine status chrome.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — render workflow name and compact status in the canvas header; keep marker forwarding.
- `Moviqo.Front/src/features/workflow-design/model/flow.ts` — define an explicit token-colored, readable closed target marker.
- `Moviqo.Front/src/shared/localization/messages.ts` — friendly reviewed Spanish/English page and status copy.
- `Moviqo.Front/tests/{unit,e2e}` — hierarchy, live status, recovery, workflow-name, and real marker-reference coverage.

## Tasks & Acceptance

**Execution:**
- [x] `WorkflowDesignPage.tsx` and localization — remove the milestone eyebrow, change the H1 to “Diseña tu flujo de trabajo” / “Design your workflow,” remove the duplicate workflow-name description, tighten vertical rhythm, and pass the authoritative name to the editor.
- [x] `WorkflowDraftEditor.tsx`, `WorkflowEditorActions.tsx`, and `WorkflowCanvas.tsx` — place the workflow name and compact live save/revision state in the canvas header; render the full feedback/recovery region only for error, conflict, revision-recovery, or publish-result states.
- [x] `flow.ts` and `WorkflowCanvas.tsx` — give `ArrowClosed` an explicit approved connector color and readable size while preserving the custom edge path and geometry.
- [x] Focused unit/E2E tests — cover bilingual headings, long names, compact clean/dirty status, retained recovery focus/actions, reduced pre-canvas chrome, and an actual edge path referencing a visible marker.

**Acceptance Criteria:**
- Given an opened workflow, when the page renders, then the H1 says “Diseña tu flujo de trabajo” (or reviewed English), the canvas H2 is the workflow name, and neither “Primer camino ejecutable” nor “Lienzo del flujo” is visible.
- Given a normal clean or dirty draft, when state changes, then status and revision safety remain understandable without a standalone full-width status card.
- Given a save/publish failure or revision conflict, when feedback appears, then it remains prominent, localized, focusable, and actionable.
- Given a sequence connection, when viewed at normal fitted zoom, then its target has a clearly visible closed arrow and the existing label/port continuity still passes.

## Spec Change Log

## Design Notes

Revision is an internal concurrency token, not a version-history browser. It remains visible for support and shared-editing orientation, but the workflow name and design surface lead the page. “Primer camino ejecutable” described the original Story 1.22 milestone; it is not a meaningful current workflow state.

## Verification

**Commands:**
- `npm run typecheck` and `npm run test:unit` — frontend types, localization, and component contracts pass.
- `npm run test:architecture` — feature/shared boundaries remain valid.
- Focused `chromium-desktop` Workflow authoring/navigation E2E — hierarchy, status/recovery, long-name wrapping, connector arrow, and existing pointer/keyboard geometry pass.
- `npm run build` (or its underlying Vite/static checks when the generated-client dirty guard applies) and `git diff --check` — production artifact and patch are clean.

## Suggested Review Order

**Designer-first hierarchy**

- Start with the route-level hierarchy and authoritative workflow-name handoff.
  [`WorkflowDesignPage.tsx:123`](../../Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx#L123)

- Compose the workflow name and compact state directly in the canvas header.
  [`WorkflowDraftEditor.tsx:224`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx#L224)

- Review the friendly bilingual page title replacing milestone-oriented language.
  [`messages.ts:798`](../../Moviqo.Front/src/shared/localization/messages.ts#L798)

**Revision status and recovery**

- Routine states collapse to a polite badge; actionable states retain prominent recovery.
  [`WorkflowEditorActions.tsx:69`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx#L69)

- Preserve parsed 409 codes so real revision conflicts reach recovery UI.
  [`editor.ts:946`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L946)

**Connector arrow continuity**

- Give every sequence connector a visible token-colored closed marker.
  [`flow.ts:125`](../../Moviqo.Front/src/features/workflow-design/model/flow.ts#L125)

- Keep selected arrow and path colors continuous without changing geometry.
  [`WorkflowCanvas.tsx:241`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L241)

**Verification**

- Exercise actual marker references, color continuity, and port attachment.
  [`workflow-editor.spec.ts:43`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L43)

- Prove real conflict focus, reload, and local-change reapplication.
  [`workflow-editor.spec.ts:374`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L374)

- Lock the editor composition and selected-marker contract at unit level.
  [`workflow-editor.test.cts:549`](../../Moviqo.Front/tests/unit/workflow-editor.test.cts#L549)
