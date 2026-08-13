---
title: 'Allow an intentionally blank Short Text label'
type: 'bugfix'
created: '2026-08-13'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'afa05a805f9084c645b0735eb86f036921f8d863'
context:
  - '_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Clearing the Label property of a Short Text item currently converts the empty value back to inheritance, so “Texto corto” immediately reappears. A designer cannot intentionally create a textbox without a visible label.

**Approach:** Create Short Text with “Texto corto” visible initially. Leaving it displays it, custom text displays the custom label, and `""` hides the visible label. Carry a separate accessible name into previews and Task Forms.

## Boundaries & Constraints

**Always:** Preserve an explicit empty string through reducer state, save/load, conflict recovery, publication, and runtime. Keep `null` bindings inheriting the reusable field label. When explicitly blank, render no visible label but retain a programmatic label from the reusable field. Keep API artifacts synchronized.

**Ask First:** Any proposal to remove or blank the reusable Process Field’s own accessible identity; any database migration; any change that makes `null` and `""` indistinguishable again; any broad redesign of shared form controls beyond an optional hidden-label capability.

**Never:** Use placeholder/help text as the accessible name; show raw IDs as recovery labels; make labels blank by default; change structural-item validation; weaken revision, lease, or tenant enforcement.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| New Short Text | Designer adds the control | Label property contains “Texto corto,” and the canvas/preview display it | N/A |
| Inherited label | Binding label is `null` | Properties, canvas, preview, and Task Form show the reusable field label | N/A |
| Deliberately blank | Designer clears Label to `""` | Input stays empty; canvas retains only its Short Text type marker; preview/runtime show no visible label but expose the reusable label programmatically | No `label_required` issue |
| Custom label | Designer enters non-whitespace text | Custom text is visible and is the accessible/error-summary label | N/A |
| Save and reopen | Explicit blank is saved, reloaded, or conflict-reapplied | Binding remains `""`; inherited text is not restored | Surface normal save/conflict recovery without changing label intent |
| Missing accessible identity | Both binding label and reusable field label are blank | Publication remains blocked as incomplete/decorative | Focus the relevant Form item with localized recovery guidance |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/features/form-design/model/formDesigner.ts` — binding-label reducer, local validation, and preview runtime projection.
- `Moviqo.Front/src/features/task-form/model/registry.ts` and `ui/TaskFormRenderer.tsx` — backward-compatible runtime label plus visible/hidden presentation metadata.
- `Moviqo.Front/src/shared/ui/forms.tsx` — optional shared hidden-label presentation without losing `<label>` association.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` — draft normalization that must preserve blank binding labels.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py` — authoritative visible and accessible label projection.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` and `docs/api/openapi-v1.json` — additive runtime presentation contract: the existing label stays non-empty and an optional flag hides it visually.

## Tasks & Acceptance

**Execution:**
- [x] Update Form Designer reducer/validation/projection and focused tests to preserve `""`, retain `null` inheritance, and accept an explicitly blank visible label when an accessible reusable label exists.
- [x] Extend the shared text-field presentation and Task Form registry/renderer so blank visual labels are screen-reader-only, including error-summary naming and a visible required marker.
- [x] Update backend draft normalization and runtime projection to round-trip explicit blank values while keeping the existing runtime label non-empty; add an optional visual-label flag and synchronize serializers, OpenAPI, and generated frontend types.
- [x] Add backend contract/unit coverage for save/reload, publication validation, and Task Form projection; add frontend unit/E2E coverage for clear, save, reopen, preview, and accessible naming.

**Acceptance Criteria:**
- Given a newly added Short Text item, when its Label has not been edited, then “Texto corto” is present in the property and displayed with the textbox.
- Given a newly added Short Text item, when the designer clears its Label, then the property stays empty and “Texto corto” is not copied back.
- Given that draft is saved and reopened, when the same item is selected, then its Label is still explicitly blank.
- Given a publishable workflow with an explicitly blank binding label and a non-empty reusable field label, when it is published and run, then the textbox has no visible label and has a non-empty associated accessible name.
- Given an inherited or custom label, when the form is rendered, then existing visible-label behavior remains unchanged.

## Spec Change Log

- Review iteration 1: adversarial review found that a newly required `accessibleLabel` response made backend-first and frontend-first version skew unsafe. The runtime contract now keeps the existing `label` as the accessible name and adds an optional visual-hiding flag, so older clients degrade by showing the label instead of producing an unnamed or unsupported control. KEEP: explicit `""` persistence, no visible label in the updated UI, reusable-field accessibility fallback, publication protection, and focused save/reopen/runtime coverage.

## Verification

**Commands:**
- `uv run pytest tests/unit/test_workflow_design_schema_registry.py tests/unit/test_workflow_publication_validation.py tests/contract/test_workflow_design_contract.py tests/contract/test_task_form_contract.py` from `Moviqo.Back` — expected: focused backend behavior passes.
- `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test` from `Moviqo.Back` — expected: valid synchronized OpenAPI contract.
- `npm run generate:api-client && npm run typecheck && npm run test:unit` from `Moviqo.Front` — expected: generated types, typecheck, and all unit suites pass.
- `npm run test:e2e -- --project=chromium-desktop tests/e2e/form-designer.spec.ts` from `Moviqo.Front` — expected: clear/save/reopen behavior and accessible-name regression pass.
- `git diff --check` — expected: no whitespace errors.

## Suggested Review Order

**Label intent and persistence**

- Preserves explicit blank separately from inherited and custom labels.
  [`formDesigner.ts:304`](../../Moviqo.Front/src/features/form-design/model/formDesigner.ts#L304)

- Round-trips blank binding labels without changing other nullable-string normalization.
  [`schema.py:737`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py#L737)

**Accessible runtime presentation**

- Emits a compatible non-empty label plus optional visual-hiding metadata.
  [`task_form.py:264`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py#L264)

- Hides only label text while keeping association and required indication visible.
  [`forms.tsx:123`](../../Moviqo.Front/src/shared/ui/forms.tsx#L123)

- Applies runtime presentation metadata through the shared Task Form renderer.
  [`TaskFormRenderer.tsx:30`](../../Moviqo.Front/src/features/task-form/ui/TaskFormRenderer.tsx#L30)

**Validation and contracts**

- Rejects invisible-only identities consistently at publication.
  [`publication_validation.py:186`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py#L186)

- Keeps the runtime extension additive for mixed-version deployments.
  [`openapi-v1.json:2943`](../../docs/api/openapi-v1.json#L2943)

**Regression evidence**

- Proves save, publish, process start, and Task Form projection end to end.
  [`test_my_work_contract.py:409`](../../Moviqo.Back/tests/contract/test_my_work_contract.py#L409)

- Covers reducer persistence, conflict rebase, and accessible preview output.
  [`form-designer.test.cts:249`](../../Moviqo.Front/tests/unit/form-designer.test.cts#L249)

- Covers screen-reader labeling, required markers, and actionable error summaries.
  [`task-form.test.cts:179`](../../Moviqo.Front/tests/unit/task-form.test.cts#L179)
