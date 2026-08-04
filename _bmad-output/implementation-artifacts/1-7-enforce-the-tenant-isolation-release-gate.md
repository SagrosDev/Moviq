---
baseline_commit: 34d4389
status: done
---

# Story 1.7: Enforce the Tenant-Isolation Release Gate

Status: done

## Story

As a release reviewer,
I want cross-Organization isolation proved against every protected resource class,
so that an incomplete isolation implementation cannot be promoted.

## Acceptance Criteria

1. **Given** two Organizations with colliding human-readable names and distinct UUIDv7 Organization/Membership resources
   **When** the reusable isolation harness substitutes identifiers and tenant context for every tenant entity currently implemented
   **Then** every read returns no foreign data, every mutation leaves foreign state unchanged, and logs expose no foreign identifier or count
   **And** real PostgreSQL tests exercise application authorization and RLS; an architecture/migration check requires each later Team, list, workflow/version, draft, Process, Task occurrence, Process Data, file, dashboard, audit, notification, job, and export entity to register the same positive/negative isolation suite when that entity is introduced.

2. **Given** any resource class lacks a passing positive and negative isolation test
   **When** CI or a production promotion evaluates the isolation gate
   **Then** the gate fails with the missing class and evidence link
   **And** the build cannot be promoted.

## Tasks / Subtasks

- [x] Build a reusable tenant-isolation harness on top of the Story 1.6 tenancy primitives (AC: 1)
  - [x] Extract the current Organization/Membership isolation assertions in `Moviqo.Back/tests/integration/test_tenant_isolation.py` into a reusable positive/negative harness instead of duplicating ad hoc test bodies for each protected resource class.
  - [x] Seed at least two Organizations whose human-readable names collide while UUIDv7 identifiers remain distinct; prove isolation by UUID/tenant context, not by display-name uniqueness.
  - [x] Cover both application-authorization and PostgreSQL-RLS paths: authorized same-tenant access succeeds, cross-tenant reads return no data, and cross-tenant writes leave foreign rows unchanged.
  - [x] Assert tenant-safe telemetry behavior for the exercised paths: no foreign identifier, row count, or existence signal is emitted to logs or error payloads.
- [x] Add registration-driven guardrails for future tenant-owned resource classes (AC: 1)
  - [x] Extend the existing `PROTECTED_TENANT_TABLES` / architecture-check pattern into an explicit isolation-gate registration seam so later tenant-owned entities must declare both their protected table metadata and their positive/negative isolation suite.
  - [x] Make the architecture or migration check fail when a tenant-owned model is added without the corresponding isolation-gate registration.
  - [x] Keep the registration mechanism additive so later stories can enroll Teams, reusable lists, workflow definitions/versions, drafts, Processes, Task occurrences, Process Data, files, dashboards, audit records, notifications, jobs, and exports without rewriting the harness.
- [x] Wire the isolation suite into release-blocking evidence and CI (AC: 2)
  - [x] Extend `.github/workflows/ci.yml` so the backend contract clearly executes the isolation gate as a named step under real PostgreSQL integration settings rather than relying on an unnamed side effect of the broader suite.
  - [x] Produce actionable failure output that identifies the missing or failing protected resource class and where the evidence lives in CI output or generated reports.
  - [x] Preserve the existing `uv run pytest`, migration, deploy-check, OpenAPI, and health-start validations; add the isolation gate without weakening any current contract step.
- [x] Preserve current Story 1.6 behavior while turning it into a promotion gate (AC: 1, 2)
  - [x] Keep `TenantContext`, `SET LOCAL`, runtime-role activation, and safe `resource_not_found` semantics intact.
  - [x] Preserve the current protected-membership endpoint behavior as one enrolled resource-class example rather than replacing it with a new bespoke path.
  - [x] Do not add frontend, landing-page, or UAT-only behavior unless required strictly for release evidence plumbing.
- [x] Add executable evidence and regression coverage (AC: 1, 2)
  - [x] Add or update real PostgreSQL integration tests for same-tenant success, cross-tenant hidden reads, cross-tenant blocked writes, and transaction-local tenant state.
  - [x] Add architecture tests for missing isolation registration on new tenant-owned tables.
  - [x] Add contract coverage proving equivalent cross-tenant failures still return the existing safe Problem Details code.

## Dev Notes

### Story intent

- Story 1.6 created the first tenant-owned data foundation. Story 1.7 turns that foundation into a release gate that must keep failing closed as more protected resource classes are introduced.
- The goal is not to broaden product behavior yet. The goal is to make incomplete tenant isolation unshippable.
- This story should produce one reusable isolation-gate pattern that later stories enroll into, not a one-off suite for Organizations only.

### Epic and cross-story context

- Epic 1 is still building the thin end-to-end journey. Isolation must be locked down before registration, sign-in, workflow design/runtime, files, dashboards, and audit features expand.
- Story 1.8 will add environment and telemetry protection boundaries; Story 1.7 must already ensure no foreign identifiers or counts leak through the current protected paths.
- Story 1.9 depends on Organization-bound identity behavior; do not loosen the current single-tenant assumptions in `Membership` resolution.
- Epic 11 later formalizes broader public-beta security gates, but PRD FR-401/FR-402 require this isolation gate to exist now as release-blocking evidence.

### Existing repo state to preserve

- [Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py) already provides `TenantContext`, runtime-role activation, `tenant_bootstrap_context()`, and `tenant_atomic_context()`. Extend these seams indirectly through tests/registration where possible; do not replace transaction-local tenancy with session-scoped behavior.
- [Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py) currently registers protected tenant tables and validates RLS/startup safety. Extend this toward isolation-gate registration rather than introducing a separate hidden source of truth.
- [Moviqo.Back/tests/integration/test_tenant_isolation.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/integration/test_tenant_isolation.py) already proves reads/counts/searches/joins, blocked writes, and transaction-local tenant settings against real PostgreSQL. Refactor this into the reusable harness and keep those assertions green.
- [Moviqo.Back/tests/contract/test_organization_tenant_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/contract/test_organization_tenant_contract.py) and [Moviqo.Back/src/moviqo/modules/organizations/application/views.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/views.py) already demonstrate the safe `404 resource_not_found` cross-tenant contract. Preserve that surface.
- [Moviqo.Back/tests/architecture/test_backend_spine_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/architecture/test_backend_spine_contract.py) already fails when tenant-owned tables are not registered for RLS enforcement. Extend this same repo-level guardrail style for the isolation gate.
- [.github/workflows/ci.yml](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml) already runs the backend suite, integration migrations, integration tests, deploy checks, OpenAPI validation, and health-start check on PostgreSQL 17. Add a named release-gate step here instead of inventing another pipeline.

### Architecture guardrails the implementation must follow

- AD-2 is the binding rule: derive one immutable `TenantContext`, apply transaction-scoped tenant identity, enforce Organization ownership relationally, and combine application authorization with PostgreSQL RLS.
- AD-3 still applies: the release gate must verify transactional safety and idempotent write behavior without splitting business state across multiple HTTP calls or independent commits.
- AD-7 still applies: server-side authorization remains authoritative. Client-provided Organization selectors help disambiguate active Memberships but never authorize by themselves.
- AD-12 applies directly here: logs, traces, metrics, and error payloads must remain tenant-safe. A hidden row count or foreign UUID in failure output would violate the story even if RLS blocks the row body.
- AD-16 applies directly: use red -> green -> refactor. The gate is only credible if missing registration or incomplete suites fail first in executable tests/checks.

### Current code behavior this story changes

- `test_tenant_isolation.py` currently proves the Organizations module only. Story 1.7 should convert that file or adjacent helpers into a reusable harness that can enroll multiple resource classes without copy-paste.
- `PROTECTED_TENANT_TABLES` and the architecture test currently ensure protected tables are known to RLS enforcement, but they do not yet prove every tenant-owned resource class has a registered positive/negative isolation suite. Story 1.7 adds that second layer.
- `ci.yml` currently runs the integration tests, but the tenant-isolation gate is implicit. Story 1.7 should make the gate explicit and named so release reviewers can point to concrete evidence.

### What must be preserved

- `SET LOCAL` semantics and transaction-local tenant state clearing after commit/rollback.
- Runtime-role activation with separate migration/runtime credentials.
- Safe not-found style failures for cross-tenant access.
- Existing Organization and Membership schema/UUID behavior from Story 1.6.
- Existing backend contract steps in CI: lint, tests, OpenAPI generation, migration check, integration migrate/test, deploy checks, and `health_start`.

### Likely files and seams to touch

- Update [Moviqo.Back/tests/integration/test_tenant_isolation.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/integration/test_tenant_isolation.py): convert current assertions into a reusable harness and enroll current protected resource classes.
- Update [Moviqo.Back/tests/architecture/test_backend_spine_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/architecture/test_backend_spine_contract.py): require tenant-owned tables to participate in the isolation gate, not just RLS registration.
- Update [Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py) or a nearby tenancy registry module: centralize the protected resource-class registration metadata.
- Possibly add a new backend helper under `Moviqo.Back/tests/integration/` or `Moviqo.Back/src/moviqo/building_blocks/tenancy/` for shared isolation-suite registration if that reduces duplication without coupling tests to private module internals.
- Update [Moviqo.Back/tests/contract/test_organization_tenant_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/contract/test_organization_tenant_contract.py): keep safe cross-tenant API behavior enrolled in the gate.
- Update [.github/workflows/ci.yml](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml): add a named isolation-gate step and evidence-friendly output.
- Consider whether `Moviqo.Infrastructure/operations/validate_uat.py` or a future production validation script needs a follow-up seam for promotion evidence, but do not move isolation semantics out of the backend test contract unless the pipeline truly requires it.

### Likely implementation shape

- Prefer a registration structure that names each protected resource class, its owning table(s), and the positive/negative test enrollment point.
- Reuse Story 1.6's protected-membership endpoint as one API-level negative test and the current RLS integration cases as the relational layer foundation.
- A practical shape is: one shared test helper/harness, one resource registry, one architecture check over that registry, and one named CI step that executes the gate under PostgreSQL integration settings.
- Keep the registry additive. When future stories add `Team`, `WorkflowDefinition`, `WorkflowVersion`, `WorkflowDraft`, `Process`, `TaskOccurrence`, `ProcessData`, `FileRecord`, dashboard projections, audit records, notifications, jobs, or exports, they should register into the gate rather than modify its core logic.

### What must not be broken

- The current hidden-resource contract on `/api/v1/organizations/protected-memberships/{id}/`.
- The current startup validation in `asgi.py` that fails closed on unsafe tenant runtime configuration.
- The current PostgreSQL integration assumptions in Story 1.6 tests.
- The synthetic-only UAT validation contract from Story 1.5. This story can strengthen release evidence, but it must not change the UAT environment boundary rules.

### Testing requirements

- Required backend commands:
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
  - `uv run python src/manage.py health_start`
- Required new evidence:
  - Real PostgreSQL positive/negative isolation coverage for every currently implemented protected resource class.
  - A failing architecture or registration check when a tenant-owned model exists without isolation-gate enrollment.
  - CI output that names the isolation gate explicitly and identifies the missing/failing resource class.
  - Contract coverage proving cross-tenant failures still return the safe Problem Details code.
  - Telemetry/log assertions showing foreign identifiers and counts are not exposed by exercised negative paths.

### Git intelligence

- Recent commits on 2026-08-03 were all stabilization work for Story 1.6: `34d4389` merged the story, while `a063268`, `20e5c5a`, `267b938`, and `e92e3dc` fixed integration tests, test failures, makemigrations issues, and review feedback.
- That history is a signal to keep Story 1.7 incremental. Reuse the current tenancy seams and PostgreSQL evidence instead of moving the design around again.

### Latest technical notes

- As of 2026-08-04, PostgreSQL's current docs are for version 18, but the row-security and `SET LOCAL` semantics relevant to Moviqo's pinned PostgreSQL 17.10 remain consistent: enabled RLS with no policy defaults to deny, table owners normally bypass RLS unless `FORCE ROW LEVEL SECURITY` is enabled, and `SET LOCAL` lasts only for the current transaction.
- Psycopg's current pool documentation states that pooled connections are committed or rolled back before being returned and supports a reset hook for application-specific cleanup. Even if Django manages pooling differently in practice, Moviqo must continue to prove through integration tests that tenant settings do not bleed across connection reuse.
- Inference from the current official docs: Story 1.7 does not need a tenancy-design change from Story 1.6. It needs stronger enrollment and release evidence around the same RLS and transaction-local primitives.

### Project Structure Notes

- Keep tenancy/runtime primitives under `Moviqo.Back/src/moviqo/building_blocks/tenancy/` if they are truly cross-cutting.
- Keep Organizations-specific API and Membership behavior under `Moviqo.Back/src/moviqo/modules/organizations/`.
- Keep integration-harness code close to backend tests unless a shared runtime registry is genuinely needed in production code.
- Do not add frontend code for this story. The release gate is backend, test, and CI work.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.7]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-401, FR-402, FR-443, FR-451]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-3]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-12]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-16]
- [Source: `_bmad-output/implementation-artifacts/1-6-establish-tenant-owned-relational-data.md`]
- [Source: `.github/workflows/ci.yml`]
- [Source: `Moviqo.Infrastructure/operations/validate_uat.py`]
- [Source: `https://www.postgresql.org/docs/current/ddl-rowsecurity.html`, PostgreSQL row security policies]
- [Source: `https://www.postgresql.org/docs/current/sql-set.html`, PostgreSQL SET / SET LOCAL]
- [Source: `https://www.psycopg.org/psycopg3/docs/advanced/pool.html`, Psycopg connection pools]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from Epic 1, current PRD, architecture spine, Story 1.6 artifact, current backend tenancy code, current CI workflow, and current PostgreSQL/Psycopg official docs.
- Git story-branch preflight completed on 2026-08-04; branch `story/1-7-enforce-the-tenant-isolation-release-gate` created from `main` with existing workspace changes preserved.
- Validation evidence on 2026-08-04: `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`, `uv run pytest tests/integration --ds=moviqo.settings.integration`, `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`, and `uv run python src/manage.py health_start`.
- Post-review fix validation on 2026-08-04: `uv run pytest tests/architecture/test_backend_spine_contract.py::test_tenant_owned_tables_are_registered_for_rls_enforcement tests/architecture/test_backend_spine_contract.py::test_tenant_isolation_gate_registration_matches_rls_registration tests/contract/test_organization_tenant_contract.py::test_protected_membership_endpoint_hides_cross_tenant_resources tests/contract/test_organization_tenant_contract.py::test_protected_membership_endpoint_rejects_ambiguous_membership_selection` and `uv run pytest tests/integration/test_tenant_isolation.py::test_registered_resource_classes_enforce_tenant_isolation tests/integration/test_tenant_isolation.py::test_protected_membership_endpoint_bootstraps_tenant_context_under_rls --ds=moviqo.settings.integration`.

### Completion Notes List

- Added `PROTECTED_TENANT_RESOURCES` as the additive release-gate registry and kept `PROTECTED_TENANT_TABLES` derived from it so RLS and isolation enrollment share one source of truth.
- Refactored `tests/integration/test_tenant_isolation.py` into a registration-driven harness covering Organization and Membership positive/negative isolation behavior with colliding display names under PostgreSQL integration settings.
- Added architecture assertions that fail closed when a tenant-owned model or protected table is missing isolation-gate registration and point developers to the required evidence location.
- Hardened the protected-membership contract and request logging so cross-tenant 404 responses and request warning logs do not expose foreign UUIDs.
- Added named CI steps for isolation registration checks and PostgreSQL integration evidence without removing any existing backend contract validations.
- Fixed review findings by replacing the mirrored isolation assertion registry with `isolation_test_id`-driven lookup, validating redacted request-log output through the configured `django.request` path, pinning CI gate coverage to explicit test node ids, and using Django model introspection instead of an AST field-name heuristic for tenant-owned table detection.

### File List

- `.github/workflows/ci.yml`
- `Moviqo.Back/src/moviqo/building_blocks/api/logging.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/__init__.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/tests/architecture/test_backend_spine_contract.py`
- `Moviqo.Back/tests/contract/test_organization_tenant_contract.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `_bmad-output/implementation-artifacts/1-7-enforce-the-tenant-isolation-release-gate.md`

### Change Log

- 2026-08-04: Added the tenant-isolation release-gate registry, reusable PostgreSQL integration harness, tenant-safe request-log redaction, architecture/contract guardrails, and explicit CI gate steps; story advanced to `review`.
- 2026-08-04: Resolved review findings, reran targeted release-gate validation, and advanced the story to `done`.
