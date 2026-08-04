---
baseline_commit: f44fe57
status: done
---

# Story 1.9: Enforce the Single-Organization Identity Boundary

Status: done

## Story

As an account holder,
I want my identity bound to one Organization during MVP,
so that authentication and navigation have one unambiguous tenant context.

## Acceptance Criteria

1. **Given** a normalized email already identifies an account or Membership
   **When** registration or invitation attempts to use it for another Organization
   **Then** no second account or Membership is created and the response does not reveal the existing Organization
   **And** a person needing another Organization must use a different email.

2. **Given** a user's Membership is deactivated
   **When** the identity is queried, reactivated, or offered for another Organization
   **Then** its historical Organization association remains intact, reactivation restores only that Membership, and reassignment to another Organization is rejected
   **And** no Organization selector, switcher, cross-Organization dashboard, or account aggregation is exposed.

3. **Given** a request proposes multi-Organization Membership or the superseded PADR behavior
   **When** MVP authorization validates it
   **Then** the operation is rejected as unsupported and no partial Membership is written
   **And** the future extension is documented as requiring new authorization, navigation, invitation, notification, and audit design.

## Tasks / Subtasks

- [x] Lock the data model to one account and one Organization membership during MVP (AC: 1, 2, 3)
  - [x] Extend `MoviqoUser` with the normalized email identity fields and manager behavior required to treat email as the canonical account identifier without breaking the existing custom-user migration contract.
  - [x] Add database constraints and/or indexes so one account cannot hold more than one `Membership`, and one normalized email cannot be reused across Organizations after deactivation or reactivation attempts.
  - [x] Add a forward migration under `Moviqo.Back/src/moviqo/modules/organizations/migrations/` that fails safely on duplicate legacy data rather than silently picking a winning row.
- [x] Remove MVP reliance on ambiguous tenant selection and multi-membership resolution (AC: 2, 3)
  - [x] Refactor `resolve_tenant_context()` to derive the tenant from exactly one active Membership and fail closed when data violates the MVP single-membership rule.
  - [x] Eliminate or constrain the `HTTP_X_MOVIQO_ORGANIZATION_ID` selector seam so it is not required for normal authenticated tenant resolution and does not become a supported MVP organization switcher.
  - [x] Preserve safe hidden-resource behavior and tenant-safe Problem Details responses when malformed or unsupported identity states are encountered.
- [x] Add application services and contracts for identity-bound account creation/reactivation rules (AC: 1, 2, 3)
  - [x] Introduce or extend an Organizations application service that centralizes normalized-email lookup, single-membership enforcement, deactivated-account reactivation, and unsupported multi-organization rejection.
  - [x] Keep future registration, invitation, and sign-in stories building on this service instead of re-implementing account-membership matching in views or forms.
  - [x] Document the unsupported future extension seam for multi-Organization identity without implementing switching, aggregation, or shared-session behavior now.
- [x] Add executable evidence for safe single-Organization identity behavior (AC: 1, 2, 3)
  - [x] Add unit and/or contract tests proving duplicate normalized-email registration and invitation attempts fail without revealing whether another Organization already owns the identity.
  - [x] Add integration coverage proving a deactivated Membership can be reactivated only inside its original Organization and cannot be rebound to another Organization.
  - [x] Update the current tenant-resolution tests so a valid single-membership account resolves without a selector while unsupported multi-membership states fail closed.
- [x] Preserve current tenancy and release-gate foundations while narrowing identity semantics (AC: 1, 2, 3)
  - [x] Keep Story 1.6 and 1.7 RLS/runtime-role behavior intact; this story changes identity cardinality, not the tenant-isolation architecture.
  - [x] Do not add cross-Organization navigation, dashboards, or hidden operator bypasses to "make tests easier".
  - [x] Avoid frontend implementation unless a minimal contract fixture or generated client change is strictly required by the backend API surface.

### Review Findings

- [x] [Review][Patch] Selector header remains part of the public tenant-resolution contract despite the story explicitly forbidding an exposed organization selector. The implementation still reads `HTTP_X_MOVIQO_ORGANIZATION_ID` and returns a selector-specific validation error, which preserves the selector seam instead of fully closing it. [Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py:17]
- [x] [Review][Patch] `ensure_identity_membership()` can report success while leaving an existing matched user inactive. In the zero-membership branch it creates a membership without reactivating `user.is_active`, and in the active-membership branch it returns immediately without restoring an inactive user record. That leaves identity state inconsistent for later authentication flows. [Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py:68]
- [x] [Review][Patch] `ensure_identity_membership()` has a first-write race for new normalized emails. Two concurrent requests can both miss the initial lookup and race into `create_user()`, causing one request to fail with an unhandled `IntegrityError` against the new unique constraint instead of returning a stable domain result. [Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py:50]
- [x] [Review][Patch] Migration `0006_alter_moviqouser_managers` imports `MoviqoUserManager` from live application code. Historical migrations should not depend on the future shape of `moviqo.modules.organizations.models`, or fresh installs and state rebuilds can break when that module changes later. [Moviqo.Back/src/moviqo/modules/organizations/migrations/0006_alter_moviqouser_managers.py:8]
- [x] [Review][Patch] Required story evidence is still missing for the new identity boundary. The diff removes the old ambiguous multi-membership test but does not replace it with real fail-closed coverage for `len(membership_rows) != 1`, adds only unit-level reactivation checks instead of the required integration scenario, adds no migration tests for duplicate legacy data rejection, and does not prove an HTTP-level non-disclosing response for duplicate-email reuse. [Moviqo.Back/tests/contract/test_organization_tenant_contract.py:49]

## Dev Notes

### Story intent

- Epic 1 already established tenant-owned data and a release gate for tenant isolation. Story 1.9 now narrows identity semantics so one authenticated account maps to one Organization and one Membership during MVP.
- The important behavior change is not "support multi-org safely". It is the opposite: fail closed when any workflow, invitation, or future registration path tries to create or rely on multi-Organization identity behavior.
- This story provides the backend contract that later authentication and onboarding stories must consume. It should not wait for Story 1.12 or Story 1.14 to start enforcing the rule.

### Epic and cross-story context

- Story 1.8 is still backlog, but its environment and telemetry safeguards are complementary. Story 1.9 must already ensure identity-bound failures do not leak another Organization's existence.
- Story 1.10 depends on identity semantics being deterministic before idempotent registration, invitation, and job flows expand.
- Story 1.11, Story 1.12, Story 1.13, and Story 1.14 will all build on the account/Membership rules defined here. If this story leaves room for multiple active Memberships per account, those later stories will encode the wrong assumptions.
- The PRD explicitly supersedes the earlier PADR multi-organization identity direction for MVP. Treat any lingering selector-based or multi-membership-friendly seams as technical debt to close here, not as product options to preserve.

### Previous story intelligence

- Story 1.7 intentionally kept `Membership`-based tenant resolution flexible enough to test isolation with colliding Organization names and selector-assisted context bootstrap. That was acceptable as a transitional foundation, but Story 1.9 is the point where the MVP account boundary becomes binding.
- Story 1.7 also hardened the rule that cross-tenant denials must look like safe "not found" responses and must not leak foreign UUIDs, row counts, or Organization details. Preserve that same behavior for duplicate-identity and unsupported multi-membership failures.
- Recent work already centralized tenancy registration under `moviqo.building_blocks.tenancy.checks` and protected-membership contract tests. Reuse those conventions instead of inventing a second identity-policy registry.

### Git intelligence

- Recent commits on August 4, 2026 were `bb10bd8` (Story 1.7 implementation), `c4f21b7` (unit-test stabilization), and `f44fe57` (merge). That pattern suggests the identity-boundary story should stay incremental and test-led.
- The codebase is still early and narrow. Prefer a direct model/service/test change set over introducing premature abstractions, feature flags, or alternate authentication backends.

### Architecture guardrails the implementation must follow

- AD-2 remains binding: every protected operation still derives one immutable `TenantContext` and remains Organization-scoped through both application authorization and PostgreSQL RLS.
- AD-7 applies directly: identity, authorization, and tenant selection remain server-owned. If client input helps locate an account or Membership, it cannot become authorization by itself and it cannot expose cross-Organization existence.
- AD-3 applies to registration/invitation identity writes: creating an account, Membership, audit evidence, and any future outbox record must remain one transaction when those behaviors are introduced or extended.
- AD-16 applies directly: drive this through red -> green -> refactor. Add the failing uniqueness and unsupported-state tests first, then the smallest model/service/migration change that passes them.
- Preserve the current stack and standards from the architecture spine: Django 5.2.15 LTS, DRF 3.17.1, PostgreSQL 17.10, pytest 9.1.1, RFC 9457 Problem Details, and Organization-scoped queries under `/api/v1`.

### Current code behavior this story changes

- [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py) currently allows the same `MoviqoUser` to appear in multiple `Membership` rows because the only uniqueness rule is `(organization, user)`. That violates FR-484 and must change.
- The same model currently inherits `AbstractUser` unchanged, which means `email` is not yet the enforced globally unique normalized identifier required by FR-485 through FR-487.
- [Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py) currently accepts `HTTP_X_MOVIQO_ORGANIZATION_ID` and resolves tenant context from filtered memberships. That selector-assisted ambiguity is incompatible with FR-488 and FR-489 as an MVP behavior.
- [Moviqo.Back/src/moviqo/modules/organizations/application/views.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/views.py) currently bootstraps the protected-membership endpoint through the selector header and safe not-found handling. After this story, the endpoint should still fail safely, but normal resolution should rely on the account's single active Membership rather than an Organization switch hint.

### What must be preserved

- The custom user model must remain the project `AUTH_USER_MODEL` created from the first migration. Do not replace it with Django's default `User` or move auth identity into another app.
- The safe `resource_not_found` contract from Story 1.7 must remain intact for hidden or unauthorized resources.
- Tenant RLS registration, runtime role activation, `SET LOCAL` transaction scope, and the Story 1.7 isolation gate must remain unchanged in semantics.
- Historical Organization association must survive deactivation. "Fixing" duplicates by moving a deactivated account to another Organization would violate FR-487.

### Likely files and seams to touch

- Update [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py): add the single-Organization-per-account data constraints and normalized-email identity behavior.
- Add a new migration under `Moviqo.Back/src/moviqo/modules/organizations/migrations/`: encode the irreversible database guardrails for one Membership per account and one normalized email per account.
- Update [Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py): remove selector-dependent normal resolution and fail closed on unsupported identity states.
- Update [Moviqo.Back/src/moviqo/modules/organizations/application/views.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/views.py): preserve the current protected-membership contract while aligning it to the new single-membership resolution rules.
- Add or extend Organizations application-service modules under `Moviqo.Back/src/moviqo/modules/organizations/application/`: centralize normalized-email lookup and single-membership enforcement for future registration/invitation/sign-in stories.
- Update [Moviqo.Back/tests/contract/test_organization_tenant_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/contract/test_organization_tenant_contract.py): change contract expectations away from selector-required ambiguity and toward fail-closed unsupported-state handling.
- Update [Moviqo.Back/tests/integration/test_tenant_isolation.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/integration/test_tenant_isolation.py): keep RLS assertions, but reflect the new account-to-membership cardinality assumptions.
- Update or add unit/contract/integration coverage near `Moviqo.Back/tests/` for normalized-email uniqueness, reactivation, and unsupported multi-Organization identity attempts.

### Likely implementation shape

- Keep `MoviqoUser` as the single authenticated identity record, but add explicit normalized-email behavior and a manager/helper that always canonicalizes email before lookup or creation.
- Enforce the MVP account boundary in both the database and the application layer:
  - Database constraints stop duplicate writes and protect historical integrity.
  - Application services translate those constraints into safe, non-disclosing product behavior.
- Treat any extant multiple-membership state as unsupported data, not as a legitimate branch of normal tenant resolution.
- Prefer a single Organizations service seam that later registration, invitation, activation, password-reset, and sign-in flows can reuse.

### What must not be broken

- The Story 1.7 isolation evidence and request-log redaction.
- The ability to reactivate a deactivated Membership inside its original Organization.
- The custom-user migration baseline and current architecture test expectations around `AUTH_USER_MODEL`.
- Safe hidden-resource behavior on `/api/v1/organizations/protected-memberships/{id}/`.

### Testing requirements

- Required backend evidence for this story:
  - A failing test first for duplicate normalized-email registration or invitation across Organizations.
  - A failing test first for attempting to create or retain multiple active Memberships for one account.
  - Contract coverage proving unsupported identity states and duplicate-email attempts do not reveal another Organization.
  - Integration coverage proving single-membership tenant resolution works without selector-based switching and that malformed multi-membership data fails closed.
  - Migration checks proving the new constraints apply cleanly and reject duplicate data safely.
- Existing commands from prior backend stories remain relevant and should stay green:
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
  - `uv run python src/manage.py health_start`

### Latest technical notes

- Django 5.2's current custom-auth guidance still requires the swappable user model to be established in the first migration and requires the identifying field used by the default authentication backend to be unique. Inference for Moviqo: this story should evolve the existing `MoviqoUser` model rather than replacing it, and any move toward email-led identity must keep uniqueness explicit.
- Django's `BaseUserManager.normalize_email()` still only lowercases the domain portion. Inference for Moviqo: if the PRD expects a fully normalized email identity boundary, the application service should define and test Moviqo's normalization rule explicitly instead of assuming Django's default is enough.
- The architecture and repo state do not justify a custom multi-backend authentication design yet. Inference: prefer tightening the current custom-user and Membership model plus Organizations services over introducing a new authentication backend.

### Project Structure Notes

- Keep account and Membership policy in `moviqo.modules.organizations`; do not leak it into shared building blocks unless it is truly cross-module.
- If a new helper or manager is needed for email normalization, keep it close to the Organizations domain model or application service rather than burying MVP identity rules in generic utilities.
- Do not add frontend selectors, switchers, or account aggregation views. The backend contract should make those impossible to implement accidentally in later stories without deliberate new product scope.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.9]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-484, FR-485, FR-486, FR-487, FR-488, FR-489, FR-490]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-3]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-16]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Information Architecture, State Patterns]
- [Source: `_bmad-output/implementation-artifacts/1-7-enforce-the-tenant-isolation-release-gate.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`]
- [Source: `Moviqo.Back/tests/contract/test_organization_tenant_contract.py`]
- [Source: `https://docs.djangoproject.com/en/5.2/topics/auth/customizing/`, Customizing authentication in Django]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from Epic 1, PRD Section 12.1, architecture spine, UX information architecture, Story 1.7 implementation artifact, current Organizations module code, and current Django custom-auth documentation.
- Implemented normalized email identity enforcement, single-membership constraints, identity-bound service rules, and selector-free tenant resolution on 2026-08-04.
- Verified on 2026-08-04 with `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, and `uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput`.

### Completion Notes List

- Added `MoviqoUser.normalized_email` plus a custom manager that fully normalizes email identity and keeps it unique when present.
- Added database guardrails and forward migrations to enforce one Membership per account and to fail safely when legacy duplicate emails or multi-membership users exist.
- Added `identity_boundary.py` as the Organizations service seam for create, reactivate, and reject flows that later registration, invitation, and sign-in stories can reuse.
- Updated tenant resolution so a single active Membership resolves without the selector header, while mismatched selector hints still fail closed.
- Added unit and contract coverage for normalized-email enforcement, reactivation in the original Organization only, and safe hidden-resource behavior.

### File List

- `_bmad-output/implementation-artifacts/1-9-enforce-the-single-organization-identity-boundary.md`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0005_enforce_single_organization_identity.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0006_alter_moviqouser_managers.py`
- `Moviqo.Back/tests/unit/test_single_organization_identity.py`
- `Moviqo.Back/tests/contract/test_organization_tenant_contract.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
