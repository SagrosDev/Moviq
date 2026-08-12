---
title: 'Polish Workflow canvas continuity and Properties identity'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: '85d943b3e2f8eef48489d058d113cbff61486131'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-streamline-workflow-authoring.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Connector labels cover their lines, large measured handles create visible endpoint gaps, and the fixed canvas height does not align with the complete left editor column. Properties also has weak label hierarchy, repeats the selected type under the Task name, and identifies specific assignees only by display name.

**Approach:** Place connector labels above their lines, separate the small visual port from its 44px interaction target, and stretch the canvas to the desktop editor row with a safe minimum height. Simplify and strengthen Properties labels, remove the redundant type line, and show each active organization member as `Display name (email)` in the specific-assignee selector.

## Boundaries & Constraints

**Always:** Preserve React Flow endpoint measurement, selection, pointer and keyboard connection behavior; retain a practical 44px port target and visible focus; keep the canvas measurable at a minimum 640px; use static Tailwind/token classes and shared controls; source member email only from the current tenant's active Workflow directory; keep membership ID as the assignment value; localize all Moviqo-owned copy.

**Ask First:** Changing stored user names/emails, exposing member email outside authorized Workflow configuration responses, changing assignment modes, or changing mobile authoring support.

**Never:** Draw manual edge endpoints, use presentation-only duplicate workflow state, shrink the usable port target to the visible dot, hard-code `Local Owner` or `owner@local.test`, place labels over connector paths, or alter Save/Publish/runtime semantics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Labeled connector | Short or wrapping designer label | Label sits above the midpoint; line and arrow remain visible and selectable | Long text stays bounded without covering the path |
| Connected nodes | Compact nodes at normal zoom | Edge visually meets each 8px port without blank gaps | Pointer/keyboard target remains at least 44px |
| Desktop editor row | Short or tall Properties column | Canvas and left column share row height, with canvas at least 640px | Narrow layouts remain stacked and readable |
| Specific assignee | Active member with name and email | Option reads `Name (email)` and submits membership ID | If name is blank/equal to email, show email once |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — edge label placement, React Flow host sizing, port markup.
- `Moviqo.Front/src/app/styles.css` — tokenized visible port and transparent hit-region geometry.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` — equal-height desktop editor row.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx` — hierarchy, redundant type removal, assignee option formatting.
- `Moviqo.Front/src/shared/ui/forms.tsx` — finite opt-in strong field-label variant.
- `Moviqo.Back/src/moviqo/modules/organizations/application/workflow_directory.py` — tenant-scoped active member email DTO.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/{services.py,views.py}` — serialize and document directory email.
- OpenAPI/generated frontend types and focused contract/UI/E2E tests — keep the cross-layer contract and geometry fresh.

## Tasks & Acceptance

**Execution:**
- [x] Canvas geometry — place labels clear of edges, anchor the visible 8px port to a stable 44px Handle, and preserve arrows/selection/focus.
- [x] Workspace layout — stretch the canvas card/host to the complete desktop editor row while retaining its minimum height.
- [x] Properties hierarchy — add an opt-in strong shared field-label style, remove the redundant selected-type line, and apply the stronger labels only in Properties.
- [x] Member identity contract — add normalized email to tenant-filtered active directory entries, regenerate OpenAPI/client types, and render deduplicated `Name (email)` options.
- [x] Tests — cover directory isolation/shape, option values/copy, label/edge geometry, endpoint continuity, 44px hit areas, equal column height, and bilingual behavior.

**Acceptance Criteria:**
- Given a labeled connection, when the canvas renders, then its entire line and arrow remain visible below the bounded label.
- Given connected compact nodes, when inspected at normal zoom, then edges meet the visible ports while pointer and keyboard targets remain practical and accessible.
- Given the desktop Workflow editor, when Properties changes height, then the canvas and left column align without blank space below the canvas and remain at least 640px tall.
- Given a selected Task, when Properties renders, then field names are visually stronger than descriptions and no redundant `Tarea` type line follows the Task-name field.
- Given `owner@local.test` with display name `Local Owner`, when specific assignment opens, then the option reads `Local Owner (owner@local.test)` and retains its membership ID value.

## Spec Change Log

- 2026-08-12: Adversarial review added orientation/top-aware label placement, blank-email compatibility, stricter geometry/identity coverage, and repeated pointer verification. The unstable overlapping-handle prototype was replaced by one stable 44px Handle with its 8px port at the React Flow anchor.

## Design Notes

The member is not a default: the local database contains one active Owner whose stored display name is `Local Owner`. Email is added as a separate authorized directory field rather than concatenated into `displayName`, preventing unrelated summaries from inheriting presentation formatting.

## Verification

**Commands:**
- `npm run typecheck`, `npm run test:unit`, `npm run test:architecture` — frontend contracts and boundaries pass.
- Focused backend Workflow directory/design contract tests — tenant-scoped member name/email payload passes.
- Focused Chromium Workflow Editor E2E — label, endpoint, hit-area, height, Properties, and assignee identity checks pass.
- OpenAPI generation/validation, Ruff, production Vite build, and `git diff --check` — generated and production artifacts remain valid.

## Suggested Review Order

**Canvas continuity and sizing**

- Start with orientation-aware labels and the single reliable React Flow Handle per endpoint.
  [`WorkflowCanvas.tsx:118`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L118)

- Position the visible 8px port at each 44px Handle's measured edge anchor.
  [`styles.css:54`](../../Moviqo.Front/src/app/styles.css#L54)

- Stretch both desktop columns while retaining the canvas minimum height.
  [`WorkflowDraftEditor.tsx:189`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx#L189)

**Properties identity and hierarchy**

- Format name and email safely, including legacy blank and duplicate identities.
  [`memberIdentity.ts:1`](../../Moviqo.Front/src/features/workflow-design/model/memberIdentity.ts#L1)

- Apply stronger labels, remove redundant type copy, and retain membership IDs.
  [`WorkflowProperties.tsx:27`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx#L27)

- Keep label emphasis an explicit opt-in shared-control variant.
  [`forms.tsx:123`](../../Moviqo.Front/src/shared/ui/forms.tsx#L123)

**Authorized member contract**

- Add normalized email only to active tenant-filtered Workflow directory members.
  [`workflow_directory.py:17`](../../Moviqo.Back/src/moviqo/modules/organizations/application/workflow_directory.py#L17)

- Serialize the separate email field without changing display-name semantics.
  [`services.py:1415`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L1415)

- Allow legacy blank emails while documenting the generated response shape.
  [`views.py:74`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py#L74)

**Verification**

- Prove blank legacy identity and tenant-safe directory behavior.
  [`test_workflow_design_contract.py:1734`](../../Moviqo.Back/tests/contract/test_workflow_design_contract.py#L1734)

- Exercise real pointer/keyboard connection, sizing, hierarchy, and member identity.
  [`workflow-editor.spec.ts:43`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L43)

- Cover wrapping labels near top and along vertical connector segments.
  [`workflow-editor.spec.ts:312`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L312)

- Lock identity fallback and deduplication branches at unit level.
  [`workflow-editor.test.cts:215`](../../Moviqo.Front/tests/unit/workflow-editor.test.cts#L215)
