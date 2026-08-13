---
title: 'Fix Form authoring access and loading feedback'
type: 'feature'
created: '2026-08-13'
status: 'done'
review_loop_iteration: 0
baseline_commit: '02c77d41766624e556e8bde7d515fc76d9448a47'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On PostgreSQL, Form lease acquisition and takeover fail because the Workflow query applies `FOR UPDATE` across the nullable reverse `draft` outer join, leaving a sole editor read-only. The Form palette also has visually uneven text-only controls, and several application loading states display plain text alerts without the established visual spinner, making legitimate work appear stalled.

**Approach:** Restrict the lease lock to the authoritative Workflow row and prove the public flow on PostgreSQL. Redesign Form palette controls as consistent full-width icon-and-label buttons, and standardize asynchronous page/feature loading feedback on the existing accessible shared `LoadingState` spinner.

## Boundaries & Constraints

**Always:** Keep the 60-second lease, 20-second heartbeat, same-session/token rules, tenant hiding, explicit confirmed takeover, and server-enforced save authority unchanged. Exercise PostgreSQL rather than mocking ORM behavior. Palette buttons retain click, pointer drag, and keyboard behavior, practical 44px targets, visible focus, localized accessible names, and disabled semantics. Loading feedback uses one polite accessible status, one decorative reduced-motion-safe spinner, localized copy, and disables actions whose prerequisite work is pending. Keep all existing Story 1.37 changes in the dirty working tree.

**Ask First:** Any database schema/API or lease-policy change, new icon dependency, global blocking overlay, or modification of non-loading business behavior.

**Never:** Remove row locking, weaken tenant/RLS filters, convert takeover to last-write-wins, mask server failures, add raw component colors, use dynamically built Tailwind fragments, hide all application navigation behind a global overlay, or rely only on SQLite contract tests.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| First editor | Active designer, valid Workflow Task, no lease | `200`, editable mode, opaque token, holder identity | No PostgreSQL outer-join lock error |
| Second editor | Another active designer, same Task, live lease | `200`, read-only mode, current holder, no token | Does not revoke first editor |
| Takeover | Second editor explicitly requests takeover | `200`, editable mode, fresh token and second holder | First token loses authority |
| Cleanup | Test completes or owner releases | Lease row is removed | No durable test lease remains |
| Form palette | Editable Form Designer | Equal-width icon-and-label controls with aligned content | Disabled/read-only styling and behavior remain clear |
| Page/query loading | A route or region awaits server-owned data | Shared localized spinner/status replaces inert plain text | No duplicate live announcement; unavailable actions stay disabled |
| Lease loading | Form draft is ready but editing authority is pending | Visible spinner communicates secure-session preparation | Canvas and save actions remain disabled until editable authority arrives |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/form_authoring_leases.py` — Workflow-row serialization and lease state transitions.
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py` — real-PostgreSQL workflow behavior and public lease regression coverage.
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py` — existing SQLite HTTP lease behavior retained as fast contract coverage.
- `Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx` — dnd-kit palette presentation and non-drag Add controls.
- `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx` — lease acquisition/takeover feedback and editor disabling.
- `Moviqo.Front/src/shared/ui/feedback.tsx` — approved reusable `LoadingState` visual and accessibility contract.
- `Moviqo.Front/src/pages/**` and `Moviqo.Front/src/features/**` — existing asynchronous loading branches that must compose `LoadingState` rather than plain status text/alerts.
- `Moviqo.Front/tests/unit/form-designer.test.cts` and related page/shared UI tests — palette and loading regressions.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Back/src/moviqo/modules/workflow_design/application/form_authoring_leases.py` — lock only the `WorkflowDefinition` row while still loading its draft, preventing PostgreSQL from applying `FOR UPDATE` to the nullable outer-join side.
- [x] `Moviqo.Back/tests/integration/test_workflow_design_integration.py` — add a PostgreSQL HTTP regression covering acquire, secondary read-only response, takeover with a new token, stale-owner rejection evidence, and release/cleanup.
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx` — add simple domain-owned decorative SVG icons and render every palette action as the same full-width, aligned icon-and-label control without changing dnd-kit/reducer authority.
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx` — use the shared visual loading status while acquiring or transferring editing authority; retain disabled authoring actions until authority is confirmed.
- [x] `Moviqo.Front/src/pages/**` and applicable `Moviqo.Front/src/features/**` — replace remaining plain asynchronous loading alerts/text with `LoadingState`, preserving contextual localized messages and region-level rendering rather than introducing a global overlay.
- [x] `Moviqo.Front/tests/unit/form-designer.test.cts`, relevant page tests, and `Moviqo.Front/tests/unit/shared-ui.test.cts` — verify equal palette control structure/icons, pointer/keyboard behavior, accessible loading semantics, spinner presence, and adoption across application loading branches.
- [x] `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md` — record the manual-acceptance defect and verified correction without reopening resolved review findings.

**Acceptance Criteria:**
- Given a valid saved Task and no active lease, when its designer opens the Form Designer on PostgreSQL, then editing controls are enabled without the unavailable-session alert.
- Given Ana owns the live lease, when Carlos opens the same Form, then Carlos is read-only and sees Ana as holder.
- Given Carlos confirms takeover, when the server processes it, then Carlos receives a fresh editable token and Ana's token no longer authorizes a save or heartbeat.
- Given the regression suite runs with integration settings, when the lease endpoint executes, then PostgreSQL raises no nullable-outer-join `FOR UPDATE` error.
- Given an editable or read-only Form Designer, when its palette renders, then every action has an icon beside its localized name and consistent width/alignment while preserving keyboard, click, drag, focus, and disabled behavior.
- Given an application route or region is waiting for asynchronous server state, when it renders its loading branch, then the user sees a localized visual spinner/status and cannot invoke actions that require the pending result.
- Given reduced motion is enabled, when loading feedback renders, then the status remains understandable without spinner animation.

## Spec Change Log

## Design Notes

`select_for_update(of=("self",))` retains the Workflow row as the serialization mutex used to prevent concurrent first-acquire races, while excluding the reverse OneToOne `draft` join from the lock clause. The draft remains eagerly readable for Task validation. The existing shared `LoadingState` already satisfies the semantic spinner/reduced-motion contract, so adoption—not another loading system—is required. Palette icons remain local, decorative SVG presentation because no approved icon package exists.

## Verification

**Commands:**
- `. .\scripts\use-integration-env.ps1; uv run pytest -q tests/integration/test_workflow_design_integration.py` — PostgreSQL lease regression and existing workflow integration pass.
- `$env:DJANGO_SETTINGS_MODULE='moviqo.settings.test'; uv run pytest -q tests/contract/test_workflow_design_contract.py` — existing public lease/save contract remains green.
- `uv run ruff check src tests` — backend lint passes.
- `npm run test:unit` — Form palette, loading-state adoption, and existing frontend behavior pass.
- `npm run test:architecture` — shared/feature/page boundaries remain valid.
- `npm run typecheck` — frontend types pass.
- `npm run build` — production asset and static scans pass.
- `$env:CI='true'; $env:MOVIQO_E2E_REUSE_SERVER='1'; .\node_modules\.bin\playwright.cmd test tests/e2e/form-designer.spec.ts tests/e2e/authoring-navigation.spec.ts --project=chromium-desktop --reporter=line` — Form authoring/loading journeys pass.
- `git diff --check` — patch contains no whitespace errors.

**Manual checks:**
- Reload Ana's Form Designer and confirm visible loading feedback resolves to an editable, polished palette; open the same route as Carlos and confirm read-only holder messaging followed by successful confirmed takeover.

## Suggested Review Order

**Lease authority and persistence**

- Start with the serialized Workflow-row lease state machine and PostgreSQL-safe lock scope.
  [`form_authoring_leases.py:23`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/form_authoring_leases.py#L23)

- Trace lease enforcement into the dedicated idempotent Task Form draft save.
  [`services.py:334`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L334)

- Review the public acquire, heartbeat, takeover, release, and save HTTP boundary.
  [`views.py:496`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py#L496)

- Confirm tenant-scoped lease ownership, expiry, and uniqueness persistence constraints.
  [`models.py:55`](../../Moviqo.Back/src/moviqo/modules/workflow_design/models.py#L55)

**Form authoring controller and UX**

- Follow reducer authority, stable identities, validation targeting, and idempotency recovery.
  [`formDesigner.ts:213`](../../Moviqo.Front/src/features/form-design/model/formDesigner.ts#L213)

- Inspect lease races, heartbeat renewal, takeover cleanup, and duplicate-save exclusion.
  [`useFormDesigner.ts:57`](../../Moviqo.Front/src/features/form-design/model/useFormDesigner.ts#L57)

- Review workspace composition, disabled authority states, error focus, and accessible feedback.
  [`FormDesignerWorkspace.tsx:59`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx#L59)

- Check aligned icon controls plus pointer-drag and explicit keyboard-add behavior.
  [`FormDesignerPalette.tsx:96`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx#L96)

**Shared schema and runtime parity**

- Review schema-v8 normalization preserving incomplete-but-correctable Form drafts.
  [`schema.py:94`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py#L94)

- Confirm generated API normalization preserves intentionally blank structural content.
  [`queries.ts:53`](../../Moviqo.Front/src/features/workflow-design/model/queries.ts#L53)

- Inspect the exhaustive typed registry shared by authoring preview and runtime.
  [`registry.ts:341`](../../Moviqo.Front/src/features/task-form/model/registry.ts#L341)

- Verify safe runtime rendering and responsive twelve-column projection.
  [`TaskFormRenderer.tsx:93`](../../Moviqo.Front/src/features/task-form/ui/TaskFormRenderer.tsx#L93)

**Publication, navigation, and feedback**

- Check actionable publication issues for decorative-only and incomplete Form content.
  [`publication_validation.py:11`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py#L11)

- Review launcher error/loading distinctions and guarded Form navigation saves.
  [`FormPages.tsx:29`](../../Moviqo.Front/src/pages/forms/ui/FormPages.tsx#L29)

**Regression evidence**

- Start backend evidence with sequential and concurrent PostgreSQL lease ownership flows.
  [`test_workflow_design_integration.py:39`](../../Moviqo.Back/tests/integration/test_workflow_design_integration.py#L39)

- Finish with browser pointer, keyboard, save, reload, responsive, and runtime parity.
  [`form-designer.spec.ts:92`](../../Moviqo.Front/tests/e2e/form-designer.spec.ts#L92)
