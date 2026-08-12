---
title: 'Repair membership RLS bootstrap policy on upgraded databases'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'acb46ab0e2efea2d83aa1579d1dd8269edbef889'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Existing PostgreSQL databases can report migration `organizations.0002` as applied while retaining an older `organizations_membership_tenant_isolation` policy that only permits tenant-selected access. Authenticated owners can sign in, but tenant bootstrap cannot discover their membership, so protected workflow endpoints return a concealed 404.

**Approach:** Add a forward-only organizations migration that idempotently recreates the membership RLS policy with authenticated-user discovery before tenant selection and tenant-scoped access afterward. Prove the repair contract with focused migration tests, apply it to the local database, and verify the known owner resolves through the production tenant-bootstrap path.

## Boundaries & Constraints

**Always:** Preserve RLS and `NOBYPASSRLS`; keep bootstrap discovery limited to the authenticated user's own membership; retain tenant-only write checks; make the migration safe for fresh and already-upgraded PostgreSQL databases; no-op on SQLite; preserve all current Story 1.36 changes and local data.

**Ask First:** Any solution requiring database recreation, data mutation beyond applying the approved schema migration, weakening RLS, or changing authentication/session semantics.

**Never:** Fake a tenant header, bypass the runtime role, expose whether another organization or membership exists, edit an already-applied historical migration as the only repair, or delete/reseed the local database.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Upgraded PostgreSQL database | Old tenant-only membership policy is installed | Forward migration replaces it with authenticated-user bootstrap plus tenant access | Migration is idempotent through `DROP POLICY IF EXISTS` |
| Bootstrap discovery | Runtime role, authenticated user set, tenant unset | Only that user's active membership is visible and tenant context resolves | Missing/ambiguous membership remains denied |
| Tenant-selected access | Runtime role and organization setting present | Only rows owned by the selected organization are visible/writable | Cross-tenant rows remain hidden |
| SQLite test database | Migration executes outside PostgreSQL | No SQL is issued | Migration completes as a no-op |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0016_repair_membership_bootstrap_rls.py` — new forward migration that reinstalls the current membership policy.
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0002_organization_membership_tenant_rls.py` — historical intended policy and SQL conventions; do not rely on rerunning it.
- `Moviqo.Back/src/moviqo/modules/organizations/tenant_policy_helpers.py` — current authoritative bootstrap and tenant-policy semantics.
- `Moviqo.Back/tests/unit/test_membership_rls_repair_migration.py` — focused migration SQL and vendor-gating regression tests.
- `Moviqo.Back/tests/integration/test_tenant_isolation.py` — exact stale-policy upgrade reproduction and PostgreSQL isolation evidence.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Back/src/moviqo/modules/organizations/migrations/0016_repair_membership_bootstrap_rls.py` — replace the legacy all-command policy with command-specific policies: authenticated-user bootstrap on `SELECT` only and tenant-scoped `INSERT`, `UPDATE`, and `DELETE`; preserve grants and forced RLS.
- [x] `Moviqo.Back/tests/unit/test_membership_rls_repair_migration.py` — assert command-specific policy SQL, tenant-only writes, PostgreSQL execution, and SQLite no-op behavior.
- [x] `Moviqo.Back/tests/integration/test_tenant_isolation.py` — reproduce the stale policy, prove repaired bootstrap reads, prove bootstrap writes fail, prove tenant writes succeed and cross-tenant writes fail, and restore the repaired policies even if an assertion fails.
- [x] Local PostgreSQL database — install the corrected policy definition and verify the policy catalog plus `_require_design_membership` for `owner@local.test` without creating or deleting application data.

**Acceptance Criteria:**
- Given an existing database with the stale membership policy, when migration 0016 runs, then the installed policy permits discovery only when `current_organization_id` is unset and `authenticated_user_id` equals the row's user.
- Given a tenant has been selected, when the runtime role queries or writes memberships, then the policy remains restricted to that organization and cross-tenant isolation is unchanged.
- Given the active local owner account, when the workflow-design membership guard runs after migration, then it returns that owner's tenant context instead of raising `tenant context unavailable`.
- Given all existing Story 1.36 work, when the patch is applied, then unrelated files and behavior remain unchanged.

## Spec Change Log

- 2026-08-12 review iteration 1: An adversarial security review found that PostgreSQL ignores `WITH CHECK` for `DELETE`, so the first all-command policy allowed bootstrap sessions to delete their own membership. Amended the implementation contract and tests to require command-specific policies with bootstrap access limited to `SELECT`, tenant-scoped `INSERT`/`UPDATE`/`DELETE`, and behavioral write assertions. KEEP: forward-only idempotent repair, forced RLS, runtime-role grant, authenticated-user-only discovery, stale-policy reproduction, SQLite no-op, and local owner verification.

## Design Notes

The new migration carries its SQL locally rather than importing mutable runtime helpers. It replaces the legacy policy name and any command-specific repair-policy names idempotently, then creates separate policies so bootstrap visibility cannot authorize mutation. This keeps historical migration execution deterministic and makes PostgreSQL command semantics explicit.

## Verification

**Commands:**
- `uv run pytest tests/unit/test_membership_rls_repair_migration.py` — focused migration tests pass.
- `uv run python src/manage.py makemigrations --check --dry-run` — no uncommitted model changes.
- `uv run python src/manage.py migrate --check` — reports the new migration before application and clean state afterward.
- `uv run python src/manage.py migrate` — applies 0016 without data loss.
- `uv run pytest tests/integration/test_tenant_isolation.py` under the integration environment — PostgreSQL tenant-isolation evidence passes.
- `uv run python src/manage.py check` — Django checks pass.

**Results:** Migration unit tests passed (`2 passed`); the exact PostgreSQL stale-policy repair and write-boundary regression passed; the full tenant-isolation suite passed (`20 passed`); Ruff, migration drift, Django checks, and `git diff --check` passed. The corrected command-specific policies were refreshed in the local database, the live policy catalog was inspected, and `_require_design_membership` resolved `owner@local.test` as the active owner.

## Suggested Review Order

**Policy boundary**

- Separates bootstrap discovery from tenant-authorized writes at PostgreSQL command level.
  [`0016_repair_membership_bootstrap_rls.py:36`](../../Moviqo.Back/src/moviqo/modules/organizations/migrations/0016_repair_membership_bootstrap_rls.py#L36)

- Applies the self-contained repair only on PostgreSQL.
  [`0016_repair_membership_bootstrap_rls.py:79`](../../Moviqo.Back/src/moviqo/modules/organizations/migrations/0016_repair_membership_bootstrap_rls.py#L79)

**Behavioral evidence**

- Reproduces stale upgrades and verifies bootstrap, tenant, and cross-tenant writes.
  [`test_tenant_isolation.py:932`](../../Moviqo.Back/tests/integration/test_tenant_isolation.py#L932)

- Locks command-specific SQL shape and fresh SQLite no-op behavior.
  [`test_membership_rls_repair_migration.py:38`](../../Moviqo.Back/tests/unit/test_membership_rls_repair_migration.py#L38)
