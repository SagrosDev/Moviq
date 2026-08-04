---
baseline_commit: 64d5f4e
status: review
---

# Story 1.6: Establish Tenant-Owned Relational Data

Status: done

## Story

As an Organization user,
I want every protected record and operation isolated to my Organization,
so that identifiers, queries, jobs, and administrative authority cannot cross tenants.

## Acceptance Criteria

1. **Given** the Organization and Membership entities first needed for registration and authentication
   **When** their schema, tenant-key conventions, and reusable RLS policy helpers are migrated
   **Then** each tenant row has immutable `OrganizationId`, tenant relationships and uniqueness constraints include it, and operator-only history has a separate-schema boundary unreachable from tenant endpoints
   **And** migrations use credentials separate from runtime roles; later stories create only their needed entities and must apply the same registered tenant policy.

2. **Given** an authenticated active Membership
   **When** a protected request or job starts its outer database transaction
   **Then** the server derives one immutable `TenantContext`, executes transaction-scoped `SET LOCAL`, and rejects any client-supplied Organization identifier as authorization by itself
   **And** pooled connections do not retain the tenant setting after transaction completion.

3. **Given** tenant tables with `FORCE ROW LEVEL SECURITY` and runtime roles that neither own those tables nor hold `BYPASSRLS`
   **When** a request, job, guessed identifier, join, search, count, or administrative operation uses missing or mismatched tenant context
   **Then** PostgreSQL and application authorization return no tenant data and commit no mutation
   **And** equivalent cross-tenant failures use the same safe status and Problem Details code.

## Tasks / Subtasks

- [x] Create the first tenant-owned relational foundation in `Organizations` (AC: 1)
  - [x] Add Organization and Membership persistence under `Moviqo.Back/src/moviqo/modules/organizations/` instead of creating a shared cross-module table package.
  - [x] Keep `MoviqoUser` as the global authentication identity, and introduce Organization-scoped Membership separately; do not bind tenant ownership directly onto the Django auth user table.
  - [x] Use UUIDv7-based identifiers for new application entities, add immutable `organization_id` columns to tenant-owned rows, and include `organization_id` in tenant-unique constraints and foreign keys.
  - [x] Create a dedicated operator-only schema for historical/admin-only records only if this story must persist such records now; otherwise establish the schema helper/seam without exposing it through tenant endpoints.
- [x] Add reusable RLS and runtime-role infrastructure (AC: 1, 3)
  - [x] Create migration helpers for enabling RLS, applying `FORCE ROW LEVEL SECURITY`, and registering the tenant policy pattern so later stories can reuse the exact same convention.
  - [x] Ensure runtime roles are not table owners and do not hold `BYPASSRLS`; keep migration/maintenance credentials separate from runtime credentials.
  - [x] Fail fast in tests or startup checks if protected tables are missing the registered tenant policy or `FORCE ROW LEVEL SECURITY`.
- [x] Introduce request/job `TenantContext` derivation and transaction scoping (AC: 2, 3)
  - [x] Add a backend seam that derives one immutable `TenantContext` from the authenticated active Membership and makes it available to protected application handlers.
  - [x] Set tenant identity with transaction-scoped `SET LOCAL` inside the outer transaction only; do not use session-scoped `SET` for tenant identity.
  - [x] Reject client-supplied Organization identifiers as authorization on their own; they may be validated as input but never trusted as the tenant boundary.
  - [x] Ensure transaction completion clears tenant state for reused pooled/runtime connections.
- [x] Keep authorization and error behavior safe and consistent (AC: 2, 3)
  - [x] Extend server-side authorization so missing, inactive, ambiguous, or mismatched Membership/TenantContext denies the operation before any tenant data is returned.
  - [x] Reuse the existing RFC 9457 Problem Details contract so equivalent cross-tenant denials continue to return the same safe not-found style response rather than permission-specific tenant leaks.
  - [x] Preserve safe correlation IDs and telemetry redaction; do not log foreign identifiers, row counts, or guessed resource existence.
- [x] Add executable evidence for schema, RLS, and transaction behavior (AC: 1, 2, 3)
  - [x] Add real PostgreSQL integration tests proving tenant rows are invisible and immutable across Organizations for reads, writes, joins, searches, and counts.
  - [x] Add tests proving `SET LOCAL` is applied inside the outer transaction and does not survive commit/rollback or pooled connection reuse.
  - [x] Add migration/architecture checks requiring later tenant-owned entities to register the same tenant-policy helper instead of hand-rolling ad hoc isolation.
  - [x] Add contract coverage showing equivalent cross-tenant authorization failures reuse the safe Problem Details code already established in Story 1.3.

### Review Findings

- [x] [Review][Patch] Runtime role activation is incompatible with separate runtime and migration credentials [Moviqo.Back/src/moviqo/modules/organizations/tenant_policy_helpers.py:23]
- [x] [Review][Patch] Tenant RLS configuration is only validated by `check --deploy`, not on application startup [Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py:31]
- [x] [Review][Patch] Tenant-policy architecture enforcement only scans the Organizations models file and misses future tenant-owned tables in other modules [Moviqo.Back/tests/architecture/test_backend_spine_contract.py:211]

## Dev Notes

### Story intent

- This story establishes the relational and transaction-scoped tenant-isolation base required before registration, authentication, workflow data, files, audits, or jobs can safely become Organization-owned.
- The outcome is not a complete auth flow. Do not implement registration UI, email verification, sign-in, Teams, workflow runtime entities, file storage, or cross-Organization admin features here.
- Later stories depend on this foundation. The main deliverable is a reusable pattern that future tenant-owned tables and handlers must follow without variation.

### Epic and cross-story context

- Epic 1 is building the full thin end-to-end journey. Story 1.6 is the first isolation-critical foundation for every later protected resource in Epic 1.
- Story 1.7 will convert this foundation into a release gate with a reusable positive/negative isolation harness. Story 1.6 should therefore establish helpers and conventions that 1.7 can extend rather than rewrite.
- Story 1.9 depends on Organization-bound Membership semantics for the single-Organization identity boundary.
- Story 1.10 depends on `(OrganizationId, CommandType, IdempotencyKey)` uniqueness and transaction ownership, so this story must preserve AD-3 compatibility while introducing tenant ownership.

### Existing repo state to preserve

- [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py) currently contains only the minimal `MoviqoUser` custom auth model. Extend this module instead of introducing a parallel identity app.
- [Moviqo.Back/src/moviqo/modules/organizations/migrations/0001_initial.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/migrations/0001_initial.py) is the first migration and creates only `MoviqoUser`. New Organization/Membership tables and RLS helpers should land in subsequent migrations; do not rewrite the initial migration unless migration strategy explicitly requires it and remains safe for current environments.
- [Moviqo.Back/src/moviqo/settings/base.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/base.py) already defines PostgreSQL as the only backend, registers the module apps, and has no tenant middleware yet. Add tenant context without weakening current settings or introducing another persistence backend.
- [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py) already maps authorization and not-found style failures to the same safe `resource_not_found` Problem Details response. Preserve this behavior for cross-tenant denials.
- [Moviqo.Back/tests/architecture/test_backend_spine_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/architecture/test_backend_spine_contract.py) already enforces module boundaries and table-ownership discipline. Extend this style for tenant-policy registration rather than bypassing it with shared persistence code.
- [Moviqo.Back/tests/integration/test_django_spine.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/integration/test_django_spine.py) already proves the integration suite uses real PostgreSQL. RLS and transaction-scoped tenant tests belong in real PostgreSQL integration coverage, not in mocked unit tests only.

### Architecture guardrails the implementation must follow

- AD-2 is binding here: derive one immutable `TenantContext` from the authenticated active Membership, carry `OrganizationId` on every tenant row, use Organization-scoped relationships, apply application authorization and PostgreSQL RLS together, use transaction-scoped `SET LOCAL`, and ensure connection reuse does not preserve tenant state.
- AD-3 still applies: the outer application coordinator owns the transaction. Tenant scoping must be established inside that transaction boundary, not by scattered repository-level commits or per-query hacks.
- AD-7 still applies: every protected DRF endpoint authorizes server-side from active Membership. A client-provided Organization identifier is never sufficient authorization.
- AD-12 still applies: structured logs and errors must remain tenant-safe and must not expose guessed IDs, foreign row counts, or mismatched-tenant metadata.
- AD-16 still applies: write failing tests first; RLS, persistence, and transaction behavior must be proven with real PostgreSQL integration tests.

### Data-model and migration requirements

- Use the `Organizations` module for Organization and Membership entities because the capability map assigns registration, verification, Membership, roles, Teams, and tenant limits to that module.
- Keep `MoviqoUser` global and Organization Membership tenant-scoped. The PRD explicitly allows platform authentication identities to be global while Memberships and tenant-owned data remain Organization-scoped.
- Every tenant-owned relational entity introduced now must have an immutable owning Organization and Organization-scoped uniqueness/foreign-key rules.
- Use snake_case database column names and keep Django/Python naming aligned with the current backend conventions.
- Prefer additive migrations. Future stories will introduce more tenant-owned entities; Story 1.6 should create reusable migration helpers/patterns instead of a one-off Organization-only implementation.
- If a helper schema, database function, or policy template is introduced, keep it minimal, deterministic, and owned by migrations so test and production databases are consistent.

### Tenant context implementation requirements

- `TenantContext` should be an explicit backend concept, likely a small immutable value object plus a request/job integration seam. Do not hide tenant resolution in arbitrary model managers or global mutable state.
- Derive the context from the authenticated active Membership only. Missing Membership, inactive Membership, or ambiguous Membership must deny by default.
- Tenant identity must be applied at the outer transaction using `SET LOCAL`; this is specifically required because PostgreSQL session-scoped `SET` survives until session end, which is unsafe for reused connections.
- The implementation must prove that tenant state is cleared after commit/rollback and cannot bleed into a later request/job on the same pooled connection.
- For request paths, the likely touch points are the composition/root auth-authorized seam and the first protected application handler, not frontend code.
- For background jobs, design the seam so job handlers can derive and apply `TenantContext` when tenant-owned work is introduced later; do not hardcode this as HTTP-only behavior.

### Authorization and safe-failure requirements

- Cross-tenant and missing-tenant operations must fail closed without revealing whether the foreign resource exists.
- Equivalent security failures should continue to use the safe not-found style contract already present in Story 1.3 and the current Problem Details handler.
- Do not add endpoint-specific error wording, counts, join results, or timing-sensitive branches that distinguish "wrong tenant" from "missing record" for callers.
- Queries, searches, counts, and joins must all remain Organization-scoped. Counting another tenant's rows is still a data leak even if the row bodies are hidden.

### Likely files and seams to touch

- Update [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py): add Organization and Membership models while preserving `MoviqoUser`.
- Add new migrations under [Moviqo.Back/src/moviqo/modules/organizations/migrations](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/migrations): create tables, indexes, constraints, runtime roles/policies/helpers as appropriate for the repo’s migration strategy.
- Add a tenant-context seam under `Moviqo.Back/src/moviqo/building_blocks/` or `Moviqo.Back/src/moviqo/modules/organizations/application/` only if it remains a reusable primitive or a public Organizations contract; do not create cross-module private imports.
- Update [Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py) if the module needs to expose tenant-context or Membership-resolution services to composition roots or other modules.
- Extend [Moviqo.Back/tests/architecture/test_backend_spine_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/architecture/test_backend_spine_contract.py) only for architectural enforcement that belongs at repo level.
- Add real PostgreSQL integration tests under `Moviqo.Back/tests/integration/` for RLS, scoped queries, and transaction behavior.
- Add unit tests under `Moviqo.Back/tests/unit/` only for pure helper logic such as tenant-context parsing or policy-registration metadata.

### What must not be broken

- Existing health/startup behavior from Stories 1.1 and 1.5.
- Existing Problem Details contract and safe correlation-ID behavior from Story 1.3.
- Existing module-boundary rules: modules may consume `moviqo.modules.organizations.application` contracts but may not import Organizations internals directly.
- The existing UAT/runtime separation from Story 1.5: migration credentials and runtime credentials must stay distinct, and startup should still fail closed on unsafe configuration.

### Testing requirements

- Required backend commands:
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
- Required new evidence:
  - Real PostgreSQL tests proving RLS blocks cross-tenant reads, writes, joins, searches, and counts.
  - Tests proving runtime roles do not bypass RLS and table owners are forced through RLS where required.
  - Tests proving a request/job without valid Membership/TenantContext returns no tenant data and commits no mutation.
  - Tests proving transaction-scoped tenant identity does not survive connection reuse after commit/rollback.
  - Contract tests proving equivalent cross-tenant failures still use the safe Problem Details code.

### Previous story intelligence

- Story 1.5 established fail-closed environment classification, separate runtime-vs-operator concerns, and static validation for configuration safety. Reuse that pattern for migration-vs-runtime credential separation and startup/test assertions around tenant policy safety.
- Story 1.4 is mostly orthogonal, but its frontend conventions still apply if any UI/admin surface is touched accidentally. This story should remain backend-only unless a narrow test fixture or contract artifact requires otherwise.
- Story 1.3 is directly relevant: reuse the current Problem Details contract and safe correlation-ID handling instead of inventing a new authorization error surface for tenant mismatches.
- Recent commits:
  - `25313f8` implemented Story 1.5.
  - `64d5f4e` merged Story 1.5 and is the baseline for this story.

### Latest technical notes

- PostgreSQL 17 row-security docs confirm that once RLS is enabled, absence of a matching policy is default-deny, but table owners normally bypass RLS unless `FORCE ROW LEVEL SECURITY` is applied. This is why the story explicitly requires both enabled RLS and forced RLS on protected tables.
- PostgreSQL 17 `SET` docs confirm `SET LOCAL` lasts only for the current transaction and has no effect outside a transaction block, while session-scoped `SET` persists for the session. Use `SET LOCAL` inside the outer transaction only.
- Psycopg pool docs confirm pooled connections are returned and reset after use; story tests must still prove application-specific tenant state is not retained across reused connections.

### Project Structure Notes

- Keep business entities, migrations, and Organizations contracts under `Moviqo.Back/src/moviqo/modules/organizations/`.
- Keep generic API/auth/tenant primitives under `Moviqo.Back/src/moviqo/building_blocks/` only if they are truly cross-cutting and not Organizations-specific domain logic.
- Keep integration evidence under `Moviqo.Back/tests/integration/` and architecture checks under `Moviqo.Back/tests/architecture/`.
- Do not add frontend code, infrastructure code, or a new backend module for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.6]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Section 10.3 Tenant isolation and server authorization]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-3]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-12]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-16]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Consistency Conventions]
- [Source: `_bmad-output/implementation-artifacts/1-5-deploy-the-synthetic-data-internal-environment.md`]
- [Source: `https://www.postgresql.org/docs/17/ddl-rowsecurity.html`, PostgreSQL 17 Row Security Policies]
- [Source: `https://www.postgresql.org/docs/17/sql-set.html`, PostgreSQL 17 SET]
- [Source: `https://www.psycopg.org/psycopg3/docs/advanced/pool.html`, Psycopg 3 connection pools]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story branch `story/1-6-establish-tenant-owned-relational-data` created for implementation.
- PostgreSQL container became reachable on `localhost:5432`, allowing the blocked integration and deploy validations to complete on 2026-08-03.

### Completion Notes List

- Story context assembled from Epic 1, PRD tenant-isolation requirements, architecture AD-2/AD-3/AD-7/AD-12/AD-16, current backend seams, Story 1.5 implementation notes, and current PostgreSQL/Psycopg docs.
- Story marked `ready-for-dev` and sprint tracking updated from `backlog` to `ready-for-dev`.
- Added Organization and Membership persistence, UUIDv7 entity identifiers, tenant policy helpers, runtime-role/RLS startup checks, and a protected membership contract seam.
- Added contract coverage, architecture enforcement, and PostgreSQL integration tests for tenant isolation and transaction-local tenant context behavior.
- `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, and OpenAPI regeneration passed on 2026-08-03.
- `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`, `uv run pytest tests/integration --ds=moviqo.settings.integration`, and `uv run python src/manage.py check --deploy --settings=moviqo.settings.production` passed against the local PostgreSQL container on 2026-08-03.
- Added follow-up migration `0003_grant_runtime_role_user_read` after PostgreSQL integration exposed that tenant-scoped joins through `Membership.user` required runtime-role read access to `organizations_moviqo_user`.

### File List

- `_bmad-output/implementation-artifacts/1-6-establish-tenant-owned-relational-data.md`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/__init__.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py`
- `Moviqo.Back/src/moviqo/modules/organizations/admin.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`
- `Moviqo.Back/src/moviqo/modules/organizations/apps.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0002_organization_membership_tenant_rls.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0003_grant_runtime_role_user_read.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/modules/organizations/tenant_policy_helpers.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/architecture/test_backend_spine_contract.py`
- `Moviqo.Back/tests/contract/test_organization_tenant_contract.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-03: Created Story 1.6 implementation artifact with tenant-isolation architecture, migration, testing, and safe-failure guidance.
- 2026-08-03: Implemented the first tenant-owned relational foundation, tenant context runtime seam, RLS checks, and related contract/integration coverage.
- 2026-08-03: Completed PostgreSQL validation against the local container and added a runtime-role grant migration for tenant-scoped joins through the global auth user table.
