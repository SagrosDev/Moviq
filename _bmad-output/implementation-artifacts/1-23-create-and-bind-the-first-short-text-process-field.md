# Story 1.23: Create and Bind the First Short Text Process Field

Status: done

## Story

As a Designer,
I want a reusable Short Text Process Field with stable identity,
so that the first Task can collect one value and later Tasks can reuse it.

## Acceptance Criteria

1. **Short Text field definition:** Given a Workflow draft, when the Designer creates a Short Text Process Field with label, help text, placeholder, optional default, minimum, and maximum, then the draft assigns one stable field ID, defaults minimum to `0` and maximum to `255`, rejects a maximum above `255` or a minimum above maximum, and stores no executable validation pattern. And friendly predefined formats remain a later Epic 3 extension. Traceability: FR48.
2. **Stable binding to the first Task Form:** Given the stable field is placed on the first Task Form, when the binding is saved, removed from that Form, or later placed again, then the Form references the same field ID rather than copying its data definition or Process value. And removing a control does not delete the Process Field or historical values. Traceability: FR108, FR112, AD-4.
3. **Schema-registry compatibility:** Given a draft snapshot with the field definition, when schema-registry golden fixtures serialize, validate, and reload it, then field identity, constraints, and binding remain equivalent across supported document versions. And malformed or unknown current-version fields are rejected on write. Traceability: AD-4, AD-16.

## Tasks / Subtasks

- [x] Extend the workflow-design draft schema to represent reusable Process Fields and first-task form bindings (AC: 1-3)
  - [x] Evolve `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` from the Story 1.22 graph-only document into a schema-versioned document that can store reusable Process Field definitions and first-task form bindings alongside `elements` and `connections`.
  - [x] Add deterministic upcasting for Story 1.21 and 1.22 draft fixtures so older drafts load into the new document shape without losing graph identity or requiring manual repair.
  - [x] Keep writers closed over the MVP Short Text shape for this story. Reject unknown current-version field properties, unknown field kinds, raw validation patterns, and malformed binding objects.
  - [x] Preserve `camelCase`, stable string IDs, and one authoritative draft document per Workflow.
- [x] Add authenticated save/read behavior for field creation and form binding through the existing draft contract (AC: 1-2)
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` so `save_workflow_draft()` validates Short Text definition defaults and limits, preserves stable field IDs across reuse, and rejects bindings that duplicate a field definition instead of referencing it.
  - [x] Keep the draft mutation inside the current atomic-command, idempotency, audit, and optimistic-revision path. Invalid field edits must leave the last valid persisted draft unchanged.
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` and generated `/api/v1` contract types through the existing draft save route; do not introduce a separate ad hoc endpoint just for fields unless the current route becomes impossible to keep authoritative.
  - [x] Return field-level or binding-level Problem Details entries that let the UI highlight the exact invalid input while preserving safe, localized-ready language.
- [x] Add the first Designer authoring UI for a Short Text field and first-task binding (AC: 1-2)
  - [x] Evolve the current post-graph authoring surface in `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` and its model types so the saved Start -> Task -> End path can add one reusable Short Text field and bind it to the first Task without replacing the graph editor.
  - [x] Keep the UX guided and non-technical: use plain workflow/form language such as `Short text`, `Label`, `Help text`, `Placeholder`, `Default value`, `Minimum length`, `Maximum length`, and `Add to first task`.
  - [x] Reuse the existing shared-draft reducer seam in `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts` and the current workflow-design feature slice. Do not introduce local-only field persistence, a second remote-state stack, or client-generated authoritative field semantics.
  - [x] Preserve Spanish-first copy with English fallback and keep new frontend implementation functions in `Moviqo.Front/src/**/*.{ts,tsx}` as arrow-function constants per `AGENTS.md`.
- [x] Add executable evidence across schema evolution, authoritative saves, and guided authoring (AC: 1-3)
  - [x] Add backend unit coverage for Short Text schema normalization, default minimum/maximum behavior, max-255 enforcement, minimum-greater-than-maximum rejection, raw-pattern rejection, and upcasting of pre-field draft fixtures.
  - [x] Add backend contract tests for valid field creation and first-task binding, stable binding reuse, malformed field rejection, and safe Problem Details responses.
  - [x] Add real-PostgreSQL integration tests that prove one revision increment per accepted save, unchanged persisted draft after rejected field edits, and semantic audit coverage for field creation, field update, field binding, and binding removal.
  - [x] Add frontend unit coverage for guided field creation, authoritative save replacement, preserved local edits before acceptance, and reuse of the same field identity when rebinding to the first Task.

## Dev Notes

### Story intent and scope

- Story 1.23 introduces the first reusable Process Field definition and its first binding to the first Task Form in draft design only.
- Story 1.24 owns rendering that Short Text control in an active Task, validating participant input, and persisting Process values at runtime. Do not implement runtime Form submission or Process Data storage here.
- Friendly predefined text formats from FR49, raw regex or executable validation from FR50, Long Text from FR51, conditional behavior from FR54, and broader Form composition from Epic 3 remain out of scope.
- Binding is limited to the first Task already created in Story 1.22. Do not broaden this story into multi-Task form composition, responsive width controls, sections, rules, or publish-time validation beyond what is needed to keep the draft contract coherent.

### Epic and PRD requirements to carry forward

- FR48 requires a Short Text field with `label`, `help text`, `placeholder`, `default value`, `minimum length`, and `maximum length`, with defaults of `0` and `255` and a platform cap of `255`.
- FR108 requires create-or-reuse semantics when adding a Form control. This story should establish the reusable field identity seam now, even though the UI only binds it to the first Task.
- FR112 requires task-specific presentation over a stable Process Field identity. For this story, the first binding should reference a field ID from the shared field catalog rather than copying definition data into a task-local clone.
- AD-4 requires the Workflow draft to remain the schema-versioned source of truth for field definitions, bindings, and future compatibility. Do not move this into relational tables or ad hoc browser-only state.

### Existing implementation to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` currently treats the authoritative draft document as graph-only: `schemaVersion`, `draftId`, `workflowId`, `name`, `status`, `elements`, and `connections`. Extend this document instead of creating a second JSON document or sidecar field store.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` currently rebuilds the candidate document during `save_workflow_draft()` from the persisted workflow metadata plus client-supplied `elements` and `connections`. Story 1.23 should extend that assembly path to include field definitions and bindings while keeping the server authoritative over IDs, revision, and validation.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` currently exposes one draft save route under `/api/v1/workflow-design/workflows/<workflow_id>/draft/`. Preserve the route and Problem Details pattern unless there is a hard architectural reason not to.
- `Moviqo.Front/src/features/workflow-design/model/types.ts` currently models only graph elements and connections. Tighten the draft types with explicit Process Field and form-binding types rather than leaving field payloads as untyped records.
- `Moviqo.Front/src/features/workflow-design/model/editor.ts` and `ui/WorkflowDraftEditor.tsx` currently guide only Start -> Task -> End creation and save. Extend that same reducer-driven authoring flow so field creation and binding stay revision-aware and server-authoritative.
- `Moviqo.Front/src/shared/api/generated/schema.d.ts` still exposes `elements` and `connections` as generic object arrays in the generated contract. Regenerate the contract after backend serializer changes; do not hand-edit generated types.

### Previous story intelligence

- Story 1.22 established that the backend, not React Flow, owns draft validity, accepted schema shape, revision progression, and semantic audit. Keep that same authority model for Process Fields and bindings.
- Story 1.22 review fixes matter here:
  - rejected edits must still flow through the atomic-command and idempotency path;
  - validation issues must point to the affected nested target instead of flattening everything to top-level draft errors;
  - semantic audit should identify the actual meaning of the change, not just `graph-saved`;
  - transient local edits should not be overwritten by an unrelated server sync before the user intentionally saves.
- The current frontend intentionally blocks a second Task in the guided graph editor. Do not accidentally reopen multi-Task authoring while adding the first field flow.

### Architecture guardrails

- Follow AD-3: accepted field edits, immutable audit entries, and idempotency results commit in one PostgreSQL transaction; rejected edits must not mutate the persisted draft.
- Follow AD-4: workflow metadata stays relational, but Process Field definitions and form bindings belong in the schema-versioned draft JSON with deterministic read upcasting and golden fixtures.
- Follow AD-5: the same shared mutable draft and optimistic revision control remain in force. Field edits must participate in the existing revision contract; do not create branch drafts, local autosave stores, or detached field editors.
- Follow AD-6: this story must explicitly avoid custom executable validation or rule code. Store declarative limits only; friendly predefined formats and rule evaluation remain later work.
- Follow AD-7 and AD-9: keep `/api/v1` OpenAPI authoritative, server authorization intact, and frontend draft state reducer-driven.

### Draft shape guidance for this story

- Add a reusable field-definition collection at the top level of the draft document rather than embedding full field definitions inside task elements. The exact property names are implementation detail, but the document must clearly distinguish:
  - reusable Process Field definitions,
  - task/form bindings that reference those field IDs,
  - graph elements and connections.
- A Short Text field definition should minimally carry:
  - stable field ID,
  - field kind or type closed over Short Text for this story,
  - label,
  - help text,
  - placeholder,
  - optional default value,
  - minimum length,
  - maximum length.
- A first-task binding should minimally carry:
  - stable binding or control ID,
  - referenced task element ID,
  - referenced field ID,
  - ordering or placement data only if needed for deterministic replay,
  - no Process value payload.
- The authoritative writer should normalize omitted minimum/maximum values to `0` and `255`.
- Reject:
  - `maximum > 255`,
  - `minimum > maximum`,
  - blank stable IDs,
  - blank required labels if the schema treats them as required,
  - unknown field kinds,
  - raw regex or executable validation properties,
  - bindings to missing task IDs or missing field IDs.

### Likely backend files to add or update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Back/tests/unit/fixtures/workflow_design/`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `docs/api/openapi-v1.json`

### Likely frontend files to add or update

- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- additional workflow-design unit tests under `Moviqo.Front/tests/unit/`

### Frontend and UX guardrails

- Keep the workflow authoring experience guided and laptop/desktop optimized, matching the existing `WorkflowDraftEditor` structure and the UX guidance-card / guided-step pattern.
- Use patient-colleague language. Prefer `Short text`, `Add to first task`, and `Use this field again` over implementation terms like `schema registry`, `binding object`, or `field catalog` in the primary UI copy.
- The interaction must remain keyboard-completable. Pointer support is additive, not the only path.
- Keep labels above fields, concise help, visible focus, and non-color-only validation feedback. Do not expose raw regex, AST, or engine diagnostics to Designers.
- Preserve Spanish-first localization with English fallback, and keep Designer-authored field labels/help text verbatim.

### Testing requirements

- Start with failing tests for the new draft shape and invalid field constraints before changing the implementation.
- Add schema fixture coverage that proves:
  - Story 1.21 drafts still upcast,
  - Story 1.22 graph drafts still upcast,
  - Story 1.23 field-and-binding drafts round-trip without losing stable IDs.
- Add contract and integration evidence for:
  - valid Short Text field creation with default min/max,
  - valid first-task binding by field ID,
  - rebinding the same field without duplicating the definition,
  - `maximum > 255` rejection,
  - `minimum > maximum` rejection,
  - raw-pattern or unsupported validation-property rejection,
  - unchanged persisted draft after rejected edits,
  - semantic audit payloads for field/binding changes,
  - one revision increment per accepted save.
- Add frontend tests that prove:
  - the guided UI can create one Short Text field without drag-only interactions,
  - the authoritative server response replaces local draft state on success,
  - local edits remain available after a recoverable rejection,
  - rebinding uses the same field identity instead of creating a duplicate definition.

### Latest technical information

- React Flow’s `ReactFlowJsonObject` docs, last updated on July 23, 2026, still define the library’s save shape around `nodes`, `edges`, and `viewport`. For Moviqo, that remains a rendering concern only. The authoritative persisted contract should stay Moviqo-specific and versioned rather than storing React Flow JSON wholesale. This is an inference from the official docs combined with AD-4 and AD-6.
- React Flow’s `addEdge()` docs, also updated on July 23, 2026, still prevent adding a duplicate edge with the same source and target. That can help local UX, but it is not a substitute for backend validation or authoritative field-binding rules.
- React’s official stable release post dated December 5, 2024 remains the current stable React 19 reference. Keep the existing reducer-driven client state model; do not use new React mutation helpers as a reason to move authoritative field logic into the browser.

### Anti-patterns and out-of-scope work

- Do not implement runtime Task Form rendering, Save Draft participant actions, or Process value persistence here. Those belong to Story 1.24 and later runtime stories.
- Do not add Long Text, friendly predefined formats, conditional field behavior, sections, widths, layouts, calculations, or reusable lists in this story.
- Do not persist full field definitions inside each task binding or duplicate field identities when rebinding.
- Do not move field definitions into separate relational tables, localStorage, or component-only state.
- Do not bypass the `workflow_design` module boundary by implementing field behavior in `workflow_runtime` or page-local API helpers.

### Project Structure Notes

- The repo already splits route composition in `Moviqo.Front/src/pages/workflow-create/` from workflow-design behavior in `Moviqo.Front/src/features/workflow-design/`. Keep field authoring logic and components inside the feature slice, with the page slice remaining a composition shell.
- Backend draft behavior is already consolidated under `Moviqo.Back/src/moviqo/modules/workflow_design/application/`. Keep schema evolution, validation, save orchestration, and serializers there unless a genuinely reusable building block emerges.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.23, Story 1.24]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR48, FR49, FR50, FR108, FR112]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-3, AD-4, AD-5, AD-6, AD-7, AD-9, AD-16; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Voice and Tone; Component Patterns; State Patterns; Interaction Primitives; Responsive & Platform]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-22-design-a-basic-start-task-end-graph.md`]
- [Source: `_bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`]
- [Source: `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/editor.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
- [Source: `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`]
- [Source: `Moviqo.Front/src/shared/api/generated/schema.d.ts`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/types/react-flow-json-object]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/utils/add-edge]
- [Technical reference: React Flow docs, https://reactflow.dev/learn]
- [Technical reference: React docs, https://react.dev/blog/2024/12/05/react-19]

### Review Findings

- [x] [Review][Patch] Enforce first-task-only bindings on the authoritative draft contract [Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py:415]
- [x] [Review][Patch] Return field-level Problem Details targets for schema normalization failures instead of collapsing them to `draft` [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:306]
- [x] [Review][Patch] Use `invalidParams.name` to mark the matching field controls instead of rendering detached error text only [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:94]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `Get-Content .agents/skills/bmad-create-story/customize.toml`
- `Get-Content .agents/skills/bmad-create-story/template.md`
- `Get-Content .agents/skills/bmad-create-story/checklist.md`
- `Get-Content .agents/skills/bmad-create-story/discover-inputs.md`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/implementation-artifacts/1-22-design-a-basic-start-task-end-graph.md`
- `Get-Content _bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Back/src/moviqo/urls.py`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Get-Content Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Get-Content Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `Get-Content Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Get-Content Moviqo.Front/src/shared/localization/messages.ts`
- `Get-Content Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "1\\.23|Short Text|FR48|FR108|FR112" _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `rg -n "process field|Process Field|Short Text|field binding|fields" Moviqo.Back/src/moviqo/modules/workflow_design Moviqo.Front/src/features/workflow-design Moviqo.Front/tests/unit`
- `web.open https://reactflow.dev/api-reference/types/react-flow-json-object`
- `web.open https://reactflow.dev/api-reference/utils/add-edge`
- `web.open https://react.dev/blog/2024/12/05/react-19`
- `git status --short`
- `Get-Content _bmad-output/implementation-artifacts/1-23-create-and-bind-the-first-short-text-process-field.md`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `$env:DJANGO_SETTINGS_MODULE='moviqo.settings.test'; uv run pytest tests/unit/test_workflow_design_schema_registry.py tests/contract/test_workflow_design_contract.py`
- `. .\scripts\use-integration-env.ps1; uv run pytest tests/integration/test_workflow_design_integration.py`
- `npm run test:unit`
- `npm run test:architecture`
- `uv run ruff check src tests`
- `git rev-parse HEAD`
- `rg -l "processFields|formBindings|shortText|binding_not_first_task|process-field-bound|process-field-created" Moviqo.Back/src Moviqo.Back/tests Moviqo.Front/src Moviqo.Front/tests`

### Completion Notes List

- Story 1.23 context was created from Epic 1, requirements inventory, architecture, UX, Story 1.21, Story 1.22, current backend workflow-design code, current frontend workflow-design code, and official React/React Flow references checked on August 5, 2026.
- The implementation seam for this story is the existing shared draft contract. The story explicitly steers the dev agent away from creating a parallel field subsystem or moving authoritative logic into the browser.
- Guidance emphasizes stable field identity, first-task binding by reference, schema upcasting, atomic rejected-save behavior, and reuse of the revision-aware reducer path already established in Story 1.22.
- Sprint status should move from `backlog` to `ready-for-dev` for `1-23-create-and-bind-the-first-short-text-process-field`.
- August 5, 2026 validation pass confirmed the existing implementation is already present in the repository and green for the story-aligned backend and frontend checks; no new product-code changes were required for this request.
- Verified backend story coverage:
  - `24` tests passed across `tests/unit/test_workflow_design_schema_registry.py` and `tests/contract/test_workflow_design_contract.py`
  - `6` integration tests passed in `tests/integration/test_workflow_design_integration.py` with the repo integration env helper loaded
- Verified frontend story coverage:
  - `npm run test:unit` passed, including `workflow-design-create.test.cjs`
  - `npm run test:architecture` passed
  - `uv run ruff check src tests` passed for `Moviqo.Back`

### File List

- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `_bmad-output/implementation-artifacts/1-23-create-and-bind-the-first-short-text-process-field.md`

### Change Log

- 2026-08-05: Revalidated the already-landed Story 1.23 implementation, reconciled the checklist with the repository state, and refreshed the completion record with passing backend/frontend evidence.
