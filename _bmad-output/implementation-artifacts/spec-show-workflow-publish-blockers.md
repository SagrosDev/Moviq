---
title: 'Show actionable blockers after workflow publication fails'
type: 'bugfix'
created: '2026-08-13'
status: 'done'
review_loop_iteration: 0
baseline_commit: '8cef75a'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The publish endpoint correctly returns `workflow_draft_invalid` with several actionable `invalidParams`, but the Workflow Designer loses the parsed response body and shows only generic recovery. The Designer cannot see which starter, Task assignment, or Task Form requirement blocks publication.

**Approach:** Preserve the already-parsed Problem Details payload from the generated API client, project its known issue codes into the existing localized publish checklist, focus that checklist after failure, and include the affected Task name when several blockers would otherwise look identical.

## Boundaries & Constraints

**Always:** Keep publication authority and issue ordering on the backend. Normalize the generated client's parsed error payload with HTTP status and correlation header without rereading its consumed response body. Preserve the local draft, current URL, revision, and retry ability after failure. Render known issue codes with Moviqo localization, derive Task context from the current authoritative draft, retain an actionable button per blocker, and focus/scroll the checklist heading when rows exist. Keep a localized generic publish summary for network failures or responses without actionable rows.

**Ask First:** Any backend contract or endpoint change, any shared API-client behavior change outside Workflow Design, displaying server-authored reason text directly, or changing publication validation rules.

**Never:** Make the frontend decide publishability, discard or save draft changes because publication failed, expose raw implementation targets or correlation IDs as primary guidance, translate arbitrary server text at runtime, show publication success before a successful response, or replace the checklist with a transient toast.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Multiple blockers | `workflow_draft_invalid` with starter, two assignment, and Task Form rows | Localized ordered checklist appears; Task rows identify `Tarea` or `Tarea 2`; heading receives focus | Draft and route remain unchanged |
| Unknown issue code | Valid target/reason with an unrecognized code | Safe localized fallback row remains actionable | Do not render raw reason |
| No actionable rows | Network failure or Problem Details without valid `invalidParams` | Focused generic publish error remains visible | Checklist does not claim readiness |
| Retry succeeds | A failed publish is followed by a successful publish | Stale blockers clear and published version feedback appears | No duplicate or stale error state |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/features/workflow-design/model/editor.ts` — publish/validation transports and Problem Details normalization.
- `Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts` — failed-publish dispatch and checklist issue projection.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` — checklist focus, draft context, and issue navigation.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationChecklist.tsx` — localized blocker rows and Task context.
- `Moviqo.Front/src/shared/localization/messages.ts` — reviewed Spanish and English Task-context copy.
- `Moviqo.Front/tests/unit/workflow-editor.test.cts` — transport normalization and mapper regression.
- `Moviqo.Front/tests/e2e/workflow-editor.spec.ts` — real failed-publish presentation, focus, preservation, and retry evidence.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Front/src/features/workflow-design/model/editor.ts` — normalize parsed errors from publish and publication-validation responses instead of rereading consumed bodies; retain status and safe correlation metadata.
- [x] `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` and `WorkflowPublicationChecklist.tsx` — supply localized Task-name context for element-targeted rows while preserving existing focus and repair actions.
- [x] `Moviqo.Front/src/shared/localization/messages.ts` — add reviewed bilingual Task-context copy without exposing targets.
- [x] `Moviqo.Front/tests/unit/workflow-editor.test.cts` — prove a mocked 400 retains code and all normalized `invalidParams`, including safe unknown-code fallback.
- [x] `Moviqo.Front/tests/e2e/workflow-editor.spec.ts` — fail the first publish with the reported multi-blocker payload, verify visible localized guidance/focus/draft preservation, then retry successfully.

**Acceptance Criteria:**
- Given publish returns actionable blockers, when the response reaches the Workflow Designer, then every valid row is visible in backend order with a localized repair action and affected Task context.
- Given publication fails, when recovery feedback renders, then focus moves to the checklist or generic summary and the user's draft remains editable and unchanged.
- Given the same publish is retried successfully, when the accepted version returns, then blocker state clears and only confirmed success remains.

## Spec Change Log

- 2026-08-13 review patches: suppressed duplicate generic recovery when actionable rows exist; cleared stale rows during retry; made repeated issue keys stable; removed ambiguous Task attribution; aligned Form repair labels/navigation; ignored malformed non-field rows; localized `form_item_content_missing`; strengthened retry-draft assertions. Deferred the pre-existing shared 64-character target limit because changing shared API normalization requires separate approval.

## Design Notes

`openapi-fetch` has already parsed non-2xx JSON into `response.error`; attempting `response.response.json()` a second time produces the generic fallback that caused this defect. Known codes remain localization keys. Dynamic Task labels are safe authored context, not translated server prose.

## Verification

**Commands:**
- `npm run typecheck` — Workflow issue and checklist props remain type-safe.
- `npm run test:unit` — transport, reducer, localization, and existing frontend regressions pass.
- `npm run test:architecture` — Workflow Design retains feature and shared-layer boundaries.
- `$env:CI='true'; $env:MOVIQO_E2E_REUSE_SERVER='1'; .\node_modules\.bin\playwright.cmd test tests/e2e/workflow-editor.spec.ts --project=chromium-desktop --reporter=line` — failed publish is visible and retry succeeds.
- `npm run build` — generated-client, localization, production bundle, and static scans pass.
- `git diff --check` — no whitespace errors.

**Results:**
- Typecheck passed.
- Full frontend unit suite passed, including 20 Workflow Editor unit cases.
- Architecture suite passed 10/10.
- Production build and static artifact scan passed.
- Complete Workflow Editor Chromium file passed 4/4; focused review-patch rerun passed 1/1.
- `git diff --check` passed.

## Suggested Review Order

**Error transport and state**

- Preserve parsed Problem Details and ordered blockers without consuming response bodies twice.
  [`editor.ts:1004`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L1004)

- Clear stale blockers during retry and reject malformed non-field rows.
  [`editor.ts:785`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L785)

**Actionable checklist UX**

- Resolve Task context only from explicit or unambiguous authoritative draft references.
  [`WorkflowDraftEditor.tsx:126`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx#L126)

- Localize known and unknown blockers while aligning repair labels with navigation.
  [`WorkflowPublicationChecklist.tsx:31`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationChecklist.tsx#L31)

- Reserve the generic publish summary for failures without actionable rows.
  [`WorkflowEditorActions.tsx:124`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx#L124)

- Provide reviewed Spanish and English blocker context without exposing server prose.
  [`messages.ts:1102`](../../Moviqo.Front/src/shared/localization/messages.ts#L1102)

**Regression evidence**

- Exercise the supplied four-blocker response, focus, preservation, and successful retry.
  [`workflow-editor.spec.ts:646`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L646)

- Verify status, correlation, ordered rows, unknown codes, and malformed-row filtering.
  [`workflow-editor.test.cts:511`](../../Moviqo.Front/tests/unit/workflow-editor.test.cts#L511)

- Prove retry clears stale reducer blockers before the next authoritative response.
  [`workflow-design-create.test.cts:607`](../../Moviqo.Front/tests/unit/workflow-design-create.test.cts#L607)
