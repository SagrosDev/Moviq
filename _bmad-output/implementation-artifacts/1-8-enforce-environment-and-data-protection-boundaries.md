---
baseline_commit: f44fe57
status: done
---

# Story 1.8: Enforce Environment and Data-Protection Boundaries

Status: done

## Story

As a Moviqo operator,
I want environment, credential, transport, and telemetry safeguards to fail closed,
so that protected data cannot leak through configuration or diagnostics.

## Acceptance Criteria

1. **Given** a protected browser, API, file, export, or administration request
   **When** it arrives over cleartext or through an untrusted host/origin/proxy configuration
   **Then** protected content is not served and production startup fails for unsafe HTTPS, trusted-host, proxy-header, cookie, or CSRF-origin settings
   **And** framework/provider cryptography is used without custom algorithms.

2. **Given** application, database, storage, email, or signing credentials
   **When** source, frontend bundles, logs, audit, analytics, runtime identities, and environment boundaries are inspected
   **Then** credentials remain in managed server-side configuration with least practical privilege, development identities cannot access production, and provider encryption at rest is enabled
   **And** a missing critical secret or private-storage setting blocks startup.

3. **Given** a request containing Process Field values, attachment/export content, passwords, tokens, cookies, authorization headers, or private links
   **When** it succeeds or fails and telemetry is emitted
   **Then** structured logs, metrics, traces, analytics, and error reports contain only allowed safe identifiers, durations, outcomes, counts, and correlation IDs
   **And** redaction tests prove prohibited content is absent.

## Tasks / Subtasks

- [x] Harden transport, host, and cookie protections at startup and request boundaries (AC: 1)
  - [x] Extend backend security configuration validation so production startup fails closed on unsafe `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, proxy-header trust, HTTPS redirect, or secure-cookie settings.
  - [x] Prove protected endpoints and file/export/admin surfaces do not serve protected content over cleartext or mis-trusted proxy/origin combinations.
  - [x] Keep Django/framework cryptography primitives authoritative; do not introduce custom encryption, signing, hashing, or token algorithms.
- [x] Lock privileged secrets and environment separation behind managed server-side configuration (AC: 2)
  - [x] Verify database, signing, storage, and email credentials stay outside source, SPA bundles, logs, analytics, and audit records.
  - [x] Enforce that development or UAT identities, projects, buckets, databases, and secrets cannot access production resources.
  - [x] Fail startup or deployment validation when critical secrets, private-storage configuration, or server-only credential wiring is missing or unsafe.
- [x] Centralize telemetry redaction and safe diagnostics (AC: 3)
  - [x] Ensure API, worker, file, export, and error-report logging emits only safe identifiers, durations, outcomes, counts, and correlation IDs.
  - [x] Redact or suppress Process Data, attachment/export contents, passwords, cookies, auth headers, bearer tokens, private links, and equivalent secrets before logs, traces, metrics, analytics, or error reports are emitted.
  - [x] Preserve the existing RFC 9457 Problem Details contract while keeping correlation IDs safe and non-sensitive.
- [x] Add release-blocking verification for environment/data-protection boundaries (AC: 1, 2, 3)
  - [x] Add backend tests for production fail-closed security settings, secret requirements, and redacted telemetry behavior.
  - [x] Add infrastructure/static validation proving environment separation, private storage, managed-secret wiring, and no production-resource references from non-production configurations.
  - [x] Add CI steps or named checks that make these gates visible as release evidence without weakening the current backend/frontend/UAT contracts.
- [x] Preserve current environment and tenancy guarantees while strengthening the boundary (AC: 1, 2, 3)
  - [x] Preserve Story 1.5 synthetic-only environment classification and Story 1.7 tenant-safe telemetry behavior.
  - [x] Do not introduce frontend authority, public object access, direct browser credentials, or custom security middleware that bypasses Django/DRF standards.
  - [x] Keep changes incremental to the existing settings, logging, infrastructure-validation, and CI seams rather than replacing them wholesale.

### Review Findings

- [x] [Review][Patch] Production security validation still accepts unsafe CSRF and host trust combinations [Moviqo.Back/src/moviqo/settings/security.py:48]
- [x] [Review][Patch] Production settings enable `X-Forwarded-Host` trust without a matching fail-closed contract [Moviqo.Back/src/moviqo/settings/production.py:18]
- [x] [Review][Patch] Problem Details redaction mutates externally visible RFC 9457 fields instead of redacting diagnostics only [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:64]
- [x] [Review][Patch] UAT infrastructure validation still leaves non-production routing and job secret-wiring gaps [Moviqo.Infrastructure/operations/validate_uat.py:61]
- [x] [Review][Patch] UAT contract coverage now normalizes an inline Resend API key instead of proving secret-only wiring [Moviqo.Back/tests/unit/test_uat_contract.py:10]

## Dev Notes

### Story intent

- Story 1.8 turns Moviqo's security and data-protection rules into executable fail-closed runtime and release gates.
- The goal is not to add new product capabilities. The goal is to make unsafe transport, mis-scoped secrets, and telemetry leakage unshippable.
- This story should consolidate the environment/data-protection boundary across backend settings, infrastructure validation, and release evidence.

### Epic and cross-story context

- Epic 1 is still establishing the thin end-to-end journey. Story 1.8 protects that journey before registration, sign-in, workflow data, files, exports, and audit expand further.
- Story 1.5 established the synthetic-only UAT environment and operator-safe environment validation. Story 1.8 must strengthen those boundaries, not fork them.
- Story 1.7 already enforced tenant-safe telemetry for cross-tenant paths. Story 1.8 broadens that protection to transport, secrets, and all diagnostics that could leak Process Data or credentials.
- Story 1.9 depends on a clean single-Organization identity boundary; do not weaken secure session, host, proxy, or authorization assumptions while implementing this story.
- Epic 11 later formalizes the public-beta security release gates, but FR-424 through FR-433 require the core fail-closed protections to exist now.

### Existing repo state to preserve

- [Moviqo.Back/src/moviqo/settings/base.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/base.py), [production.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/production.py), and [uat_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/uat_contract.py) already enforce environment-specific startup rules and should remain the primary seam for fail-closed configuration validation.
- [Moviqo.Back/src/moviqo/building_blocks/api/logging.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/logging.py), [correlation.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/correlation.py), and [problem_details.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py) already centralize safe request diagnostics and Problem Details behavior. Extend these seams rather than scattering ad hoc redaction.
- [Moviqo.Infrastructure/operations/validate_uat.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Infrastructure/operations/validate_uat.py) already validates UAT topology and environment safety assumptions. Extend the same style for environment separation and secret/private-storage enforcement.
- [.github/workflows/ci.yml](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml) already runs backend, frontend, integration, deploy-check, and UAT validation steps. Add explicit security-boundary evidence here instead of inventing a parallel release pipeline.
- Story artifacts [1-5-deploy-the-synthetic-data-internal-environment.md](C:/Endava/EndevLocal/Moviqo/_bmad-output/implementation-artifacts/1-5-deploy-the-synthetic-data-internal-environment.md), [1-6-establish-tenant-owned-relational-data.md](C:/Endava/EndevLocal/Moviqo/_bmad-output/implementation-artifacts/1-6-establish-tenant-owned-relational-data.md), and [1-7-enforce-the-tenant-isolation-release-gate.md](C:/Endava/EndevLocal/Moviqo/_bmad-output/implementation-artifacts/1-7-enforce-the-tenant-isolation-release-gate.md) already define the nearby safety contracts this story must preserve.

### Architecture guardrails the implementation must follow

- AD-7 is binding here: Django authentication, secure same-origin cookies, CSRF validation, explicit trusted hosts/proxy headers/origins per environment, server-side authorization, and safe RFC 9457 Problem Details remain the governing model.
- AD-11 applies directly: local, CI, UAT, and future production stay isolated, and non-production environments must not reach production data or credentials.
- AD-12 applies directly: telemetry is structured, correlation-based, centrally redacted, and never carries Process Data, credentials, tokens, private links, or file content.
- The Architecture Spine consistency conventions require startup to fail closed when required security configuration is absent and keep technical telemetry separate from semantic audit.
- AD-16 still applies: red -> green -> refactor. Unsafe settings, missing secrets, and redaction leaks should fail in executable checks before implementation is considered complete.

### Current code behavior this story changes

- Startup/configuration checks currently prove synthetic-only UAT safety and production deploy settings, but Story 1.8 should make transport, secret wiring, and telemetry redaction an explicit release boundary across environments.
- Request logging already avoids some sensitive output. Story 1.8 should centralize the prohibited-data list and ensure equivalent treatment across API, worker, storage, export, and error-report paths.
- Infrastructure validation already inspects UAT topology. Story 1.8 should add concrete assertions for environment separation, managed-secret usage, and private-storage expectations without embedding provider credentials into the repo.

### What must be preserved

- Secure-cookie, HTTPS, host/origin, and server-authoritative API behavior already established in backend settings and AD-7.
- The synthetic-only UAT contract and non-production isolation from Story 1.5.
- Tenant-safe telemetry and safe not-found/error behavior from Stories 1.6 and 1.7.
- Existing verification contract coverage in `README.md` and `.github/workflows/ci.yml`.

### Likely files and seams to touch

- Update [Moviqo.Back/src/moviqo/settings/base.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/base.py), [production.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/production.py), and possibly [uat.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/uat.py) / [uat_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/uat_contract.py) for fail-closed security configuration and secret requirements.
- Update [Moviqo.Back/src/moviqo/building_blocks/api/logging.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/logging.py) and related error/correlation seams for centralized redaction and safe telemetry metadata.
- Add or extend backend tests under `Moviqo.Back/tests/unit/`, `tests/contract/`, and `tests/integration/` for configuration validation, transport/header safety, and telemetry redaction.
- Update [Moviqo.Infrastructure/operations/validate_uat.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Infrastructure/operations/validate_uat.py) and any adjacent environment manifests so non-production cannot reference production resources and private-storage/secret assumptions are checked statically.
- Update [.github/workflows/ci.yml](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml) and, if needed, [README.md](C:/Endava/EndevLocal/Moviqo/README.md) to surface the new security-boundary checks as named verification evidence.

### Likely implementation shape

- Prefer one backend validation seam for security-critical environment settings and one centralized redaction seam for diagnostics rather than duplicating secret/telemetry rules in multiple modules.
- Keep provider-specific checks in `Moviqo.Infrastructure` and application/runtime checks in backend settings or logging seams.
- Treat this as a fail-closed gate story: missing configuration, unsafe trust settings, or unredacted telemetry should block startup or CI rather than emit warnings only.

### What must not be broken

- Existing `health_start`, deploy-check, OpenAPI, frontend, and UAT validation contracts.
- Existing tenant-isolation and safe Problem Details contracts.
- Existing synthetic-only environment messaging and environment classification behavior.
- Existing private-file and outbox patterns established by architecture and Story 1.5.

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
- Required infrastructure/release evidence:
  - `python Moviqo.Infrastructure/operations/validate_uat.py`
  - Static or contract validation proving non-production configurations cannot reference production credentials/resources.
  - Redaction tests proving Process Data, file/export contents, credentials, tokens, cookies, auth headers, and private links are absent from logs/traces/error payloads.
  - Named CI output showing the environment/data-protection gate passed or failed.

### Git intelligence

- Current repository baseline for this story context is commit `f44fe57` on 2026-08-04.
- Storys 1.5 through 1.7 already established the environment, tenancy, and telemetry seams that this story should extend incrementally instead of replacing.

### Project Structure Notes

- Keep backend runtime and validation logic under `Moviqo.Back/src/moviqo/settings/` and `Moviqo.Back/src/moviqo/building_blocks/api/`.
- Keep provider-specific environment validation under `Moviqo.Infrastructure/`.
- Keep release evidence in repo-level CI and local verification commands, not in ad hoc manual checklists.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.8]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Section 10.6 Data protection and environment security]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-424 through FR-433]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-11]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-12]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Consistency Conventions]
- [Source: `_bmad-output/implementation-artifacts/1-5-deploy-the-synthetic-data-internal-environment.md`]
- [Source: `_bmad-output/implementation-artifacts/1-6-establish-tenant-owned-relational-data.md`]
- [Source: `_bmad-output/implementation-artifacts/1-7-enforce-the-tenant-isolation-release-gate.md`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from the local Epic 1 artifact, local PRD, local Architecture Spine, existing local implementation artifacts, and current repository structure.
- Git story-branch preflight completed on `story/1-8-enforce-environment-and-data-protection-boundaries`.
- Verification completed with `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`, `uv run python src/manage.py health_start`, and `python Moviqo.Infrastructure/operations/validate_uat.py`.

### Completion Notes List

- Added a fail-closed production security contract for trusted hosts, CSRF origins, proxy header trust, secure cookies, private storage settings, and runtime email secret presence.
- Centralized diagnostic redaction for request logs and RFC 9457 Problem Details payload construction so process data, tokens, cookies, private links, and sensitive config identifiers are suppressed consistently.
- Extended the UAT infrastructure contract and Cloud Run module validation to prove managed-secret wiring, private bucket wiring, HTTPS proxy trust, explicit routing, and encryption-at-rest expectations.
- Added named CI evidence for the environment and data-protection release gate without weakening the existing backend, tenant-isolation, or UAT validation contracts.
- Local verification passed for lint, backend pytest, production deploy checks, health startup, and UAT infrastructure validation.

### File List

- `.github/workflows/ci.yml`
- `Moviqo.Back/src/moviqo/building_blocks/api/logging.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/redaction.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/settings/production.py`
- `Moviqo.Back/src/moviqo/settings/security.py`
- `Moviqo.Back/tests/contract/test_problem_details_contract.py`
- `Moviqo.Back/tests/unit/test_diagnostic_redaction.py`
- `Moviqo.Back/tests/unit/test_production_contract.py`
- `Moviqo.Back/tests/unit/test_uat_contract.py`
- `Moviqo.Infrastructure/environments/uat/uat-environment.json`
- `Moviqo.Infrastructure/modules/cloud-run-service.json`
- `Moviqo.Infrastructure/operations/validate_uat.py`
- `_bmad-output/implementation-artifacts/1-8-enforce-environment-and-data-protection-boundaries.md`

### Change Log

- 2026-08-04: Created the Story 1.8 implementation artifact and prepared it for development handoff.
- 2026-08-04: Implemented fail-closed transport, secret, redaction, infrastructure, and CI release-gate enforcement for Story 1.8.
