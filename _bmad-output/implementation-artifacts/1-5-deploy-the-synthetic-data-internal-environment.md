---
status: done
baseline_commit: c128498c8879d4819c46435a812bfa557e502ecb
---

# Story 1.5: Deploy the Synthetic-Data Internal Environment

Status: done

## Story

As a company stakeholder,
I want a persistent internal environment that rejects real customer data,
so that the thin Moviqo journey can be tested safely outside a developer workstation.

## Acceptance Criteria

1. **Given** the declarative UAT infrastructure configuration
   **When** the approved build is deployed in `us-east1`
   **Then** Firebase Hosting serves the SPA and rewrites `/api/**` to the Cloud Run Django ASGI service backed by Supabase PostgreSQL, private GCS, and Resend
   **And** authenticated, session-specific, and API responses are never CDN-cached while public content and hashed assets may be cached.

2. **Given** the environment classification is absent, ambiguous, or not `synthetic-only`
   **When** the UAT application or synthetic file inspector starts
   **Then** startup fails before accepting a request
   **And** production credentials or resources cannot be reached from the UAT identity.

3. **Given** the internal environment is classified `synthetic-only`
   **When** a stakeholder creates persistent test data and harmless files and later revisits the environment
   **Then** the data remains available inside the same isolated test Organization
   **And** prominent environment messaging prohibits customer onboarding and real business data.

4. **Given** scaling, health, and capacity settings are inspected
   **When** the environment reaches its approved low-cost threshold or a required service becomes unavailable
   **Then** scaling remains within configured caps and a safe operator alert identifies the build, service class, and correlation ID without Process Data
   **And** live malware scanning, independent backup automation, and lifecycle schedules are explicitly disabled rather than falsely reported healthy.

## Tasks / Subtasks

- [x] Create the correctly spelled infrastructure root and UAT topology (AC: 1, 4)
  - [x] Create `Moviqo.Infrastructure/` with `environments/uat/`, `modules/`, and `operations/` matching the Architecture Spine structural seed.
  - [x] Migrate or retire the empty misspelled `Moviqo.Infraestructure/` placeholder without leaving two competing infrastructure roots.
  - [x] Add declarative configuration for Firebase Hosting, Cloud Run service/job, Supabase PostgreSQL connection settings, private GCS buckets, Resend email, IAM/service identities, and low-cost scaling caps.
  - [x] Keep provider-specific implementation inside `Moviqo.Infrastructure/`; backend and frontend code must consume configuration through environment variables, managed secrets, adapters, or standard protocols.
- [x] Configure Firebase Hosting for the static SPA and API rewrite (AC: 1)
  - [x] Use the existing `Moviqo.Front` Vite build artifact as the Firebase Hosting public artifact; do not add SSR, a Node server, or backend-hosted frontend code.
  - [x] Rewrite `/api/**` to the Cloud Run Django ASGI service in `us-east1`.
  - [x] Add explicit cache rules: `/api/**`, authenticated/session-specific paths, HTML shell, and non-hashed responses are `no-store`; hashed immutable assets may use long-lived public caching; public landing content may use bounded caching only when it cannot contain user/session state.
  - [x] Add tests or static validation that fail if API rewrites or no-store rules are missing.
- [x] Harden backend startup for synthetic-only UAT (AC: 2, 3, 4)
  - [x] Add an explicit environment classification setting such as `MOVIQO_ENVIRONMENT_CLASS=synthetic-only`; UAT startup must fail closed if it is absent, ambiguous, misspelled, or any value other than `synthetic-only`.
  - [x] Add UAT-specific settings or checks under `Moviqo.Back/src/moviqo/settings/` without weakening existing `production.py`, Problem Details, or deploy checks.
  - [x] Ensure production credential/resource identifiers cannot be used by UAT settings; static checks should reject production project IDs, production bucket names, production database hosts, and production secret names in UAT configuration.
  - [x] Extend `health_start` or a dedicated startup check so the classification, required service configuration, cache safety assumptions, disabled-service declarations, and build metadata are verified before request handling.
- [x] Add synthetic file-inspector and storage boundaries (AC: 2, 3, 4)
  - [x] Add a synthetic-only `FileInspectionPort` implementation under the Files module application/adapter seam that accepts only harmless synthetic file inspection behavior.
  - [x] Fail startup if the synthetic inspector is configured outside `synthetic-only`, or if a real-data environment lacks a live malware inspection adapter.
  - [x] Configure private GCS quarantine/clean buckets or prefixes; no public object ACLs, durable copied links, or frontend-accessible storage credentials.
  - [x] Explicitly disable live malware scanning in UAT and report it as disabled-by-gate, not healthy.
- [x] Add persistent synthetic service configuration (AC: 1, 3)
  - [x] Configure Supabase PostgreSQL as the persistent application database for UAT using server-side secrets and the existing Django/Psycopg settings shape.
  - [x] Configure Resend through the Messaging adapter/outbox seam for the minimal email path; do not send email directly from request handlers.
  - [x] Ensure synthetic Organizations, users, Process Data, and harmless files persist across deploys/restarts unless an operator intentionally resets the UAT environment.
  - [x] Add prominent Spanish and English environment messaging in the SPA shell or shared environment banner that says the environment is internal, synthetic-only, and not for customer onboarding or real business data.
- [x] Add operator health, capacity, and alert evidence (AC: 4)
  - [x] Include build identity, environment class, service class, and correlation ID in safe health/alert evidence.
  - [x] Add low-cost caps for Cloud Run min/max instances and job execution; scale-to-zero is permitted where practical.
  - [x] Add capacity thresholds for Firebase Hosting transfer, GCS storage, Supabase database size, Cloud Run usage, and Resend monthly email allowance with 60/80/90% alert targets where the provider supports them.
  - [x] Ensure alerts and structured logs exclude Process Data, credentials, tokens, private links, file content, and customer-like business values.
  - [x] Explicitly mark independent backups, restore automation, lifecycle schedules, and live malware scanning as disabled until the real-data/public-beta gate stories enable them.
- [x] Integrate deployment verification into the existing contract (AC: 1, 2, 3, 4)
  - [x] Add static infrastructure validation commands to the repo verification contract and GitHub Actions without removing existing backend/frontend checks.
  - [x] Add backend tests for fail-closed environment classification, UAT resource separation, disabled-service declarations, safe health output, and cache/header assumptions.
  - [x] Add frontend tests for bilingual environment messaging and non-authoritative behavior; do not implement registration, authentication, Workflow runtime, or tenant-owned data in this story.
  - [x] Document manual deployment prerequisites and evidence capture in `README.md` or `Moviqo.Infrastructure/README.md`, including the exact variables/secrets that must be configured by an operator.

### Review Findings

- [x] [Review][Patch] Firebase Hosting still permits cached SPA shell routes served via the catch-all rewrite [Moviqo.Infrastructure/firebase.json:17]
- [x] [Review][Patch] UAT contract documents secret-backed configuration but runtime still depends on plaintext `MOVIQO_DB_PASSWORD` and does not validate secret wiring [Moviqo.Back/src/moviqo/settings/base.py:62]
- [x] [Review][Patch] Static validation does not enforce Cloud Run service and job identity separation required by the story [Moviqo.Infrastructure/environments/uat/uat-environment.json:9]

## Dev Notes

### Scope and boundaries

- This story deploys the controlled internal synthetic-data environment and the safety checks that prevent it from accepting real customer data. It is not the implementation of registration, authentication, tenant-owned relational data, Workflow authoring/runtime, real malware scanning, independent backups, lifecycle schedules, or public-beta production readiness.
- Preserve the existing product roots: backend under `Moviqo.Back/`, frontend under `Moviqo.Front/`, and infrastructure under the correctly spelled `Moviqo.Infrastructure/`.
- `Moviqo.Infraestructure/` currently exists as a misspelled placeholder with no tracked files. Do not add new work there.
- Do not add AI, Redis, Celery, a broker, distributed cache, microservices, SSR, frontend secrets, public storage, or direct request-bound external email delivery.
- UAT changes configuration and operational adapters only. Domain behavior, API contracts, persisted state semantics, and frontend authority boundaries remain the same as local and later production environments.

### Current repo state to preserve

- `Moviqo.Back/src/moviqo/settings/base.py` already requires `MOVIQO_SECRET_KEY`, database settings, configures ASGI, DRF, drf-spectacular, and the Problem Details exception handler.
- `Moviqo.Back/src/moviqo/settings/production.py` already sets `DEBUG = False`, secure cookies, HSTS, HTTPS redirect, and required allowed hosts. Do not weaken these to make UAT convenient.
- `Moviqo.Back/src/moviqo/settings/env.py` provides `required_env`, `env_bool`, `env_csv`, and `required_env_csv`; extend this style for strict enumerations instead of ad hoc parsing.
- `Moviqo.Back/src/moviqo/jobs/health.py` currently checks each module's public application health seam and returns `{"status": "ok"}`. Extend health through public contracts; do not import module internals.
- `.github/workflows/ci.yml` already runs backend `uv` checks, schema/client checks, real PostgreSQL migration/integration checks, production deploy check, frontend architecture/unit/type/build/e2e checks. Add infrastructure validation without replacing these jobs.
- Story 1.4 added shared localization, design tokens, a keyboard-accessible language selector, component catalog, and frontend arrow-function convention from `AGENTS.md`. New frontend code under `Moviqo.Front/src/**/*.{ts,tsx}` must use arrow function constants.

### Architecture compliance

- AD-11 requires one static SPA artifact and one immutable Python backend container image. Firebase Hosting serves the SPA and rewrites `/api/**` to Cloud Run in `us-east1`; Cloud Run hosts Django ASGI; Supabase is used only as managed PostgreSQL; synthetic attachments live in private GCS; Resend handles email through the application messaging seam.
- AD-8 requires private file quarantine/capability access. The synthetic inspector starts only when explicitly classified `synthetic-only`; ambiguous or real-data configuration fails closed. Real-data environments require live malware inspection later.
- AD-10 requires background work through PostgreSQL-backed outbox/job rows. Company-only E2E deploys only the minimal outbox/email drain; malware scan, backup, and lifecycle commands stay disabled until their gate-specific stories pass.
- AD-12 requires structured, tenant-safe telemetry. Logs, metrics, traces, analytics, errors, health responses, and alerts must not contain Process Data, credentials, tokens, private links, or file content.
- AD-16 requires red -> green -> refactor and executable evidence. Do not claim the UAT environment is safe without tests/static validation for classification, no-cache behavior, resource separation, service disablement, and safe operator output.

### Provider-specific implementation notes

- Firebase Hosting supports `firebase.json` rewrites to Cloud Run using `hosting.rewrites[].run.serviceId` and `region`; use `us-east1` for this story. Firebase Hosting also supports explicit `headers` rules for `Cache-Control`; validate that `/api/**` and session-specific responses cannot be cached.
- Cloud Run Terraform modules support revision/service scaling settings including min/max instance counts. Set low UAT caps and allow scale-to-zero where practical; do not rely on uncontrolled autoscaling for a cost-limited internal environment.
- Supabase provides direct PostgreSQL connections and pooler modes. Backend application traffic from serverless/container contexts should prefer a pooler-compatible connection where appropriate; migrations/maintenance should use separate restricted credentials, matching AD-2's runtime-vs-migration separation.
- Resend configuration belongs behind the Messaging adapter/outbox path. Store keys in managed server-side secrets only and ensure frontend static artifacts cannot contain them.
- GCS buckets/objects must be private. Use non-guessable tenant partitioning for object keys, short-lived server-issued grants later, and no public ACLs or durable copied links.

### Frontend environment messaging requirements

- Show prominent Spanish and English messaging that this is an internal synthetic-only environment and must not be used for customer onboarding, real business data, real personal data, production files, or customer claims.
- Keep the message Moviqo-owned and localized through the existing localization catalog with Spanish fallback.
- The banner must not imply the environment is production-ready, Gate 1 approved, public beta, or safe for real data.
- Preserve the current UX/design foundation: patient-colleague voice, plain language, accessible focus, non-color-only status, and 200% text operation.

### Testing requirements

- Required backend evidence:
  - `uv sync --frozen`
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
  - UAT startup/classification tests for missing, ambiguous, non-synthetic, and valid `synthetic-only` configuration.
- Required frontend evidence:
  - `npm run check:node`
  - `npm run test:architecture`
  - `npm run check:api-client`
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:e2e` if environment messaging affects rendered pages.
- Required infrastructure evidence:
  - Static validation for `firebase.json` rewrites/cache headers.
  - Static validation for Cloud Run region, service/job identity, scaling caps, and secret-backed configuration.
  - Static validation that UAT does not reference production project IDs, production resources, public buckets, production secret names, or real-data service adapters.
  - Static validation that disabled malware scanning, independent backup automation, and lifecycle schedules are represented as intentionally disabled for UAT.
- If real cloud deployment cannot be executed locally, record the exact blocked step and keep all static validation and CI checks in place.

### Previous story intelligence

- Story 1.1 established backend module boundaries, deterministic build-input tests, local secret exclusions, `uv` verification, production fail-closed settings, and a minimal `health_start` seam. Reuse these patterns for deployment/startup checks.
- Story 1.2 established the static React/Vite SPA under `Moviqo.Front/`, feature-sliced architecture checks, one query layer, reducer-based draft primitives, Playwright smoke coverage, and Node 26.5.1 enforcement. Do not weaken the Node guard or introduce a frontend server.
- Story 1.3 established `/api/v1`, generated OpenAPI/TypeScript client, RFC 9457 Problem Details, safe correlation IDs, CI, and stale artifact checks. Keep API responses safe and do not hand-maintain duplicate DTOs for deployment checks.
- Story 1.4 established Spanish-first localization, English support, Spanish fallback, approved tokens, accessible component patterns, browser/viewport checks, and the repo-level frontend arrow-function convention. Environment messaging must reuse those seams.
- Recent commits show Story 1.4 was merged in `c128498` and implemented in `5d308f6`; expect reviewers to reject work that bypasses established contracts or leaves infrastructure claims unverified.

### Project Structure Notes

- Create infrastructure source under `Moviqo.Infrastructure/`.
- Keep backend runtime settings under `Moviqo.Back/src/moviqo/settings/` and backend tests under `Moviqo.Back/tests/`.
- Keep file inspection/application seams inside `Moviqo.Back/src/moviqo/modules/files/` and messaging seams inside `Moviqo.Back/src/moviqo/modules/messaging/`.
- Keep frontend environment UI under the existing feature-sliced tree, likely shared/localization plus app or page shell composition. Do not deep-import feature internals or put infrastructure code in frontend source.
- Add documentation near the implementation root being changed: `Moviqo.Infrastructure/README.md` for deployment/operator prerequisites and root `README.md` only for top-level verification commands.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.5]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Section 18.1 Gate 1]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Environment Gates]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-8, AD-10, AD-11, AD-12, AD-16]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Structural Seed, Capability Map, Deferred]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`]
- [Source: `_bmad-output/implementation-artifacts/1-1-establish-the-backend-modular-spine.md`]
- [Source: `_bmad-output/implementation-artifacts/1-2-establish-the-frontend-application-spine.md`]
- [Source: `_bmad-output/implementation-artifacts/1-3-establish-the-api-error-build-and-test-contract.md`]
- [Source: `_bmad-output/implementation-artifacts/1-4-establish-the-accessible-bilingual-design-foundation.md`]
- [Context7 Firebase docs: Firebase Hosting full config and Cloud Run rewrites]
- [Context7 Cloud Run Terraform module docs: min/max instance scaling, env vars, secret env vars]
- [Context7 Supabase docs: PostgreSQL direct connection and pooler modes]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story branch: `story/1-5-deploy-the-synthetic-data-internal-environment`

### Completion Notes List

- Added `Moviqo.Infrastructure/` with Firebase Hosting, Cloud Run, UAT environment, and static validation contracts for the synthetic-only deployment shape.
- Added backend UAT settings/contracts, fail-closed environment classification checks, production-resource rejection, synthetic file inspection enforcement, and safe startup health metadata.
- Added bilingual synthetic-only environment messaging in the SPA shell and extended unit/e2e coverage for the banner.
- Verified with `python Moviqo.Infrastructure/operations/validate_uat.py`, `uv run ruff check src tests`, `uv run pytest`, `node tests/architecture/frontend-boundaries.test.mjs`, `npm run check:api-client`, `npm run test:unit`, `npm run check:node`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`.

### File List

- `.github/workflows/ci.yml`
- `Moviqo.Back/pyproject.toml`
- `Moviqo.Back/src/moviqo/jobs/health.py`
- `Moviqo.Back/src/moviqo/modules/files/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/settings/env.py`
- `Moviqo.Back/src/moviqo/settings/uat.py`
- `Moviqo.Back/src/moviqo/settings/uat_contract.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/integration/test_django_spine.py`
- `Moviqo.Back/tests/unit/test_uat_contract.py`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/app/ui/EnvironmentBanner.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/unit/localization.test.cts`
- `Moviqo.Infrastructure/README.md`
- `Moviqo.Infrastructure/environments/uat/uat-environment.json`
- `Moviqo.Infrastructure/modules/cloud-run-job.json`
- `Moviqo.Infrastructure/firebase.json`
- `Moviqo.Infrastructure/modules/cloud-run-service.json`
- `Moviqo.Infrastructure/operations/validate_uat.py`
- `README.md`

### Change Log

- 2026-08-03: Implemented Story 1.5 synthetic-only UAT contracts, startup enforcement, bilingual environment messaging, and static deployment validation.
