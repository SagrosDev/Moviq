---
baseline_commit: 2f98b9ca3c7a4c07411afef45d0a0e867da87def
---

# Story 1.21: Create a Workflow and Shared Draft

Status: review

## Story

As a Designer,
I want to create a named Workflow with one shared mutable draft,
so that I can begin configuring a process without creating conflicting copies.

## Acceptance Criteria

1. **Atomic workflow creation:** Given an active Designer, Administrator, or Owner and a name that is unique under the Organization's naming rule, when the user creates a Workflow, then one Workflow catalog record and one schema-versioned draft document with stable IDs and optimistic revision `1` are committed in the Organization, and the creator, time, name, language-neutral identifiers, audit, and idempotency result are recorded atomically. Traceability: FR568, FR569, FR570, FR571, FR572, FR573, FR574, AD-2, AD-3, AD-4.
2. **Safe failure behavior:** Given a duplicate or invalid name, stale idempotency-key reuse, or a user without design permission, when creation is attempted, then no Workflow or draft is created and the API returns a stable localized validation, conflict, or authorization code without exposing another tenant's catalog, and the entered safe name remains available for correction. Traceability: FR568, FR569, FR570, FR571, FR572, FR573, FR574, AD-7, UX-DR5.
3. **Schema-registry read compatibility:** Given the draft document is read after a supported schema version changes, when the backend schema registry loads it, then the document validates and is upcast in memory through registered deterministic steps while writers emit only the current schema version, and golden fixtures prove supported historical versions remain readable and unknown write fields are rejected. Traceability: FR229, FR230, AD-4.

## Tasks / Subtasks

- [x] Add the `WorkflowDesign` backend creation command, persistence model, and draft schema registry (AC: 1-3)
  - [x] Create tenant-owned relational models for the workflow catalog row, the single mutable draft row, and any command/idempotency storage this flow needs under `Moviqo.Back/src/moviqo/modules/workflow_design/`.
  - [x] Register every new tenant-owned table with the protected-table and tenant-isolation release-gate registries so `tests/architecture/test_backend_spine_contract.py` and `tests/integration/test_tenant_isolation.py` stay authoritative.
  - [x] Implement one application-level create command that commits workflow metadata, draft JSON, immutable audit evidence, and idempotency result in a single transaction through the existing atomic-command pattern. Do not split creation across multiple HTTP calls.
  - [x] Introduce a draft document schema with explicit `schemaVersion`, stable workflow-level IDs, optimistic revision `1`, and deterministic read upcasting. Writers must reject unknown current-version fields and emit only the current shape.
- [x] Expose authenticated `/api/v1` contracts for workflow creation and authorized draft/catalog reads (AC: 1-3)
  - [x] Add DRF serializers/views under the `workflow_design.application` public contract and wire them in `Moviqo.Back/src/moviqo/urls.py`.
  - [x] Bootstrap tenant context exactly as other protected endpoints do, derive Organization and Membership from the authenticated session, and ignore any hostile tenant identifiers from the client.
  - [x] Return RFC 9457 Problem Details for validation, conflict, authentication, and authorization failures with stable safe codes and no cross-tenant existence signal.
  - [x] Regenerate `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` through the repository generation commands rather than by hand.
- [x] Add the first workflow-catalog and draft-authoring frontend surface (AC: 1-2)
  - [x] Extend the authenticated My Work experience with a clear `Create workflow` path that only appears for Designer, Administrator, and Owner roles and keeps Members inside their runtime-only boundary.
  - [x] Add a feature-sliced workflow-design entry route/page and a focused creation form using the existing API client, localization layer, and protected query registry rather than introducing a second data-fetching stack.
  - [x] Persist the authoritative draft payload and revision returned by the server into the existing shared-draft state seam in `Moviqo.Front/src/shared/drafts/`; do not invent parallel local draft semantics that diverge from the server contract.
  - [x] Keep Spanish-first UI strings with English fallback, preserve designer-authored content verbatim, and use plain language such as `Create workflow`, `Draft`, and `Save draft`.
- [x] Add executable evidence across backend, frontend, and schema compatibility (AC: 1-3)
  - [x] Add backend contract tests for success, duplicate-name rejection, unauthorized role rejection, hostile tenant identifier rejection, and Problem Details shape.
  - [x] Add real-PostgreSQL integration tests for single-transaction creation, idempotent replay, conflicting idempotency-key reuse, and tenant isolation of workflow and draft rows.
  - [x] Add unit tests for the schema-registry writer/reader/upcaster and golden fixtures for supported draft versions.
  - [x] Add frontend unit coverage for role-gated navigation, form error retention, revision-state initialization, and non-authoritative server error handling. Keep new `.ts`/`.tsx` functions as arrow-function constants per `AGENTS.md`.

## Dev Notes

### Story intent and scope

- This story creates the first `Workflow` definition and its one shared mutable draft. It does not yet design the Start-Task-End graph, configure assignments, add Process Fields, or publish a version. Those behaviors belong to Stories 1.22 through 1.28.
- Epic 1 makes this the first Designer-facing step after the authenticated My Work shell from Story 1.20. The implementation should create a usable entry into workflow authoring without claiming runtime or publication capabilities that do not exist yet.

### Relevant architecture rules

- Follow AD-1 strictly: `workflow_design` owns draft/catalog authoring. `workflow_runtime` may later consume published versions, but this story must not push draft semantics into runtime tables or import another module's internal layers.
- Follow AD-2 for every protected request and table. Every workflow and draft row must be Organization-owned, RLS-protected, and unreachable across tenants.
- Follow AD-3 for the create command: workflow row, draft row, audit record, and idempotency result commit together or not at all.
- Follow AD-4 for storage shape: workflow metadata remains relational, while the draft document remains schema-versioned JSON with stable IDs and upcasting on read.
- Follow AD-5 for mutable-draft semantics: one workflow has one mutable draft with an optimistic revision. This story establishes that invariant; later stories build edit and publication behavior on top of it.
- Follow AD-7 and AD-9 for contracts and frontend state: server authorization stays authoritative, OpenAPI remains the source for the TypeScript client, and draft UI state uses explicit revision-aware reducers instead of ad hoc component-local business rules.

### Existing implementation to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py` currently exposes only `module_health()`. Expand this module instead of introducing a parallel backend package for workflow creation.
- `Moviqo.Back/src/moviqo/urls.py` already hosts `/api/v1` routes and imports module public contracts from composition roots only. Keep that pattern so `tests/architecture/test_backend_spine_contract.py` continues to pass.
- `Moviqo.Back/src/moviqo/modules/organizations/application/session.py` defines the active authenticated membership seam. Role and Organization context must come from that seam, not from client-supplied Organization identifiers or browser role assumptions.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` shows the repository's current protected-endpoint pattern: `tenant_bootstrap_context`, `resolve_tenant_context`, `apply_tenant_context`, safe `NotFound`, and explicit Problem Details responses. Reuse that structure for workflow-design endpoints.
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` and `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` are the authenticated landing surface from Story 1.20. Extend them carefully so Members do not see design-authoring entry points they are not allowed to use.
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts` already models server-accepted revision updates and conflict detection. Build the workflow draft state on this shared seam instead of creating a second incompatible draft reducer.
- `Moviqo.Front/src/shared/api/client.ts`, `queryRegistry.ts`, and the generated OpenAPI types are the approved frontend API path. Do not add Redux, React Query, Zustand, localStorage draft persistence, or a second fetch abstraction for this story.

### Likely backend files to add or update

- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/migrations/*.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/` for command/service/view/serializer modules
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/` for workflow-design API coverage
- `Moviqo.Back/tests/integration/` for RLS/idempotency/transaction coverage
- `Moviqo.Back/tests/architecture/test_backend_spine_contract.py` only if new protected tables need registration changes elsewhere

### Likely frontend files to add or update

- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/` and `src/features/` for the first workflow-design route/page/form
- `Moviqo.Front/src/shared/drafts/`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/`
- `docs/api/openapi-v1.json`

### Data and contract expectations

- The workflow catalog row should contain stable workflow identity and display metadata; the draft row should contain the current schema-versioned design document and optimistic revision.
- Draft JSON must use `camelCase`, include explicit `schemaVersion`, and keep stable IDs as strings in line with the architecture conventions.
- The create response should return the authoritative workflow identifier, draft document, and revision from the server. The UI should render that response directly rather than reconstructing client-authoritative draft state.
- Name validation must be existence-neutral across tenants. A duplicate active name in the same Organization can surface as a safe conflict or validation error, but the API must not leak another Organization's catalog or identifiers.

### Testing requirements

- Use red -> green -> refactor. Add the failing test first for the command or contract you are introducing.
- Add backend contract tests modeled after `Moviqo.Back/tests/contract/test_my_work_contract.py` and `test_session_contract.py`.
- Add real-PostgreSQL integration tests modeled after `Moviqo.Back/tests/integration/test_atomic_commands_integration.py` and `test_tenant_isolation.py` to prove:
  - one committed workflow/draft/audit/idempotency outcome under retries,
  - hostile tenant identifiers are ignored,
  - new workflow-design tables are protected by RLS and registered in the isolation gate.
- Add schema-contract coverage similar to `Moviqo.Back/tests/contract/test_api_schema_contract.py` so the served schema and committed OpenAPI document stay aligned.
- Add frontend unit tests that confirm:
  - only design-capable roles can reach the workflow-creation entry point,
  - invalid names keep the entered value visible for correction,
  - the initial draft state is seeded from the server revision `1`,
  - the UI does not fake success before the server confirms creation.

### UX and accessibility guardrails

- The PRD and UX docs place workflow authoring on laptop and desktop; narrow screens may support viewing or lightweight navigation only. Do not claim full mobile authoring support.
- Use guided-step and guidance-card patterns for the first workflow flow: one decision at a time, plain language, and visible `Continue`, `Back`, or `Save draft` actions where relevant.
- Keep labels above fields, concise help text, visible focus, keyboard completion, and non-color-only validation. Error copy should sound like a patient colleague, not a technical validator.
- Preserve the production-data boundary from FR569 and FR16: workflow authoring access does not imply runtime Process Data visibility.

### Latest technical information

- Frontend workflow canvas work in later stories should stay aligned with `@xyflow/react` 12.11.2, which the repository already pins in `Moviqo.Front/package.json`. The official React Flow 12 docs still describe `ReactFlowJsonObject` as the JSON-compatible save/load shape and require the `@xyflow/react` package and CSS import; avoid old `reactflow` package examples or v11-era APIs. [Source: reactflow.dev, pages updated July 2026]
- React 19 remains the current stable major line; keep using function components and hooks consistent with the existing codebase. Prefer explicit reducer-based state for shared draft editing instead of opaque mutable objects. [Source: react.dev, React 19 stable post dated December 5, 2024; reference pages crawled July 2026]
- Backend work should remain on Django 5.2.15 / DRF 3.17.1 / Psycopg 3.3.4 as pinned in `Moviqo.Back/pyproject.toml`. Do not upgrade dependencies as part of this story. [Source: local repository lock and Django 5.2 release docs]

### Anti-patterns and out-of-scope work

- Do not implement publication, version history, autosave conflict resolution, graph editing, Process start, or runtime task execution in this story.
- Do not store draft state only in the browser or localStorage, and do not create multiple editable drafts for one workflow.
- Do not bypass the module boundary by reading `organizations` or `workflow_runtime` tables directly from `workflow_design` internals except through allowed public application seams.
- Do not introduce Redis, Celery, brokers, WebSockets, collaborative editing, or public/anonymous workflow creation.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.21]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR229, FR230, FR568-FR574]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - Sections 0.4, 14, 18.1]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-1, AD-2, AD-3, AD-4, AD-5, AD-7, AD-9, AD-16; Capability -> Architecture Map; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Component Patterns; State Patterns; Interaction Primitives; Responsive & Platform]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/session.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/models.py`]
- [Source: `Moviqo.Back/tests/architecture/test_backend_spine_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_api_schema_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_atomic_commands_integration.py`]
- [Source: `Moviqo.Back/tests/integration/test_tenant_isolation.py`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Source: `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`]
- [Source: `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`]
- [Technical reference: React Flow docs, https://reactflow.dev/api-reference/react-flow and https://reactflow.dev/api-reference/types/react-flow-json-object]
- [Technical reference: React docs, https://react.dev/reference/react and https://react.dev/blog/2024/12/05/react-19]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/releases/]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `python _bmad/scripts/resolve_customization.py --skill .agents/skills/bmad-create-story --key workflow`
- `git status --short`
- `git branch --show-current`
- `git switch -c story/1-21-create-a-workflow-and-shared-draft`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `uv run pytest`
- `uv run ruff check src tests`
- `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
- `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
- `npm run generate:api-client`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:architecture`
- `npm run test`

### Completion Notes List

- Added `workflow_design` relational models, RLS migration, schema-registry helpers, and an atomic create service that commits the workflow row, shared draft row, transactional audit, and idempotency result together.
- Exposed authenticated workflow-design catalog, create, and draft endpoints under `/api/v1/workflow-design/` with hostile-tenant input ignored and safe Problem Details for validation, conflict, and forbidden-role outcomes.
- Extended the authenticated frontend with a role-gated `Create workflow` path, a feature-sliced workflow-create page/form, Spanish-first copy, and revision-aware draft initialization via the shared draft seam.
- Added backend contract/integration/unit coverage plus frontend unit coverage for role gating, form error retention, and revision initialization; regenerated `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts`.
- `npm run test` stops at `check:api-client` because that command intentionally fails while the regenerated `schema.d.ts` differs from Git in an active worktree. The underlying verification steps completed separately: `npm run test:architecture`, `npm run typecheck`, and `npm run test:unit`.

### File List

- `_bmad-output/implementation-artifacts/1-21-create-a-workflow-and-shared-draft.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/api/openapi-v1.json`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/migrations/0001_initial.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Back/tests/unit/fixtures/workflow_design/draft-v0.json`
- `Moviqo.Back/tests/unit/test_workflow_design_schema_registry.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/access.ts`
- `Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Moviqo.Front/src/features/workflow-design/model/form.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCreateForm.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/pages/workflow-create/index.ts`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`

### Change Log

- 2026-08-04: Implemented Story 1.21 end to end across backend workflow-design persistence/contracts, frontend workflow creation UI/state, schema artifacts, and automated coverage.
