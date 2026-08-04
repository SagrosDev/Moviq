---
baseline_commit: c3a9e42
status: done
---

# Story 1.3: Establish the API, Error, Build, and Test Contract

Status: done

## Story

As a Moviqo delivery team,
I want generated API contracts and mandatory test layers,
so that backend and frontend changes remain compatible and verifiable.

## Acceptance Criteria

1. **Given** the backend API schema command runs
   **When** endpoints and serializers are valid
   **Then** it emits a valid `/api/v1` OpenAPI document and generates the TypeScript client used by the SPA
   **And** CI fails on an undocumented endpoint, incompatible schema change, or stale generated client.

2. **Given** an API validation, authorization, not-found, conflict, or unexpected failure
   **When** the client receives the response
   **Then** the response conforms to RFC 9457 Problem Details, contains a stable application code and safe correlation identifier where applicable, and excludes stack traces, secrets, Process Data, and cross-tenant existence signals
   **And** contract tests cover each error family.

3. **Given** a behavior change or defect correction
   **When** it is submitted for review
   **Then** evidence shows a focused failing test, the passing implementation, and refactoring under green tests
   **And** CI selects the applicable domain/table tests, real-PostgreSQL integration tests, architecture tests, API contract tests, and Playwright accessibility journey tests without substituting a coverage percentage for behavior evidence.

## Tasks / Subtasks

- [x] Establish the versioned OpenAPI surface under `/api/v1` (AC: 1)
  - [x] Add URL routing that keeps existing `/health/start/` intact and exposes the API schema at a versioned path, using drf-spectacular rather than a hand-written schema.
  - [x] Add a backend schema generation command/script that runs `manage.py spectacular` with validation and fail-on-warning behavior.
  - [x] Commit the generated OpenAPI artifact in a deterministic location intended for frontend client generation, and make schema generation fail when serializer/view metadata is incomplete.
  - [x] Add a smoke API endpoint only if needed to prove the schema and error contract; do not implement registration, authentication flows, Organizations, Workflows, Tasks, or Process runtime behavior in this story.
- [x] Generate and wire the frontend API client seam (AC: 1)
  - [x] Add the selected OpenAPI TypeScript generation tooling to `Moviqo.Front/` with locked dependencies.
  - [x] Generate TypeScript API types/client code from the committed `/api/v1` schema into `Moviqo.Front/src/shared/api/generated/` or an equivalently isolated generated folder.
  - [x] Update `Moviqo.Front/src/shared/api/index.ts` to export the generated-client seam without bypassing the existing feature-sliced dependency rule.
  - [x] Add a stale-client check that regenerates the schema/client and fails when the working tree differs.
- [x] Implement the RFC 9457 Problem Details contract (AC: 2)
  - [x] Add a backend error module in a shared, non-business location that produces `application/problem+json` responses with `type`, `title`, `status`, stable `code`, optional safe `detail`, optional validation `invalidParams`, and safe `correlationId`.
  - [x] Configure DRF exception handling for API exceptions, `Http404`, permission failures, validation failures, conflicts, and unexpected errors.
  - [x] Ensure serializer/generic-view validation responses also use Problem Details; DRF's exception handler alone is not sufficient for every validation path.
  - [x] Normalize equivalent authorization/not-found/cross-tenant denials so response body, status behavior, and metadata do not reveal whether a hidden resource exists.
  - [x] Add correlation ID middleware or request context support that accepts only safe inbound IDs or creates a new safe ID, returns it where appropriate, and never logs or returns secrets or Process Data.
- [x] Add contract and safety tests for every required error family (AC: 2)
  - [x] Cover validation, authorization, not-found, conflict, and unexpected failures with backend contract tests.
  - [x] Assert forbidden strings and structures are absent: stack traces, database SQL, file paths, environment values, cookies, tokens, authorization headers, private links, Process Field values, and hidden resource identifiers.
  - [x] Assert generated OpenAPI error components match the runtime Problem Details shape used by tests.
  - [x] Add frontend type-level or unit tests proving client consumers receive the generated error type and do not depend on ad hoc `{ detail: string }` responses.
- [x] Establish the combined build/test contract in source control (AC: 3)
  - [x] Add root or documented per-root verification commands that run backend lint/tests/schema checks, frontend typecheck/tests/build/client checks, and architecture tests.
  - [x] Add GitHub Actions workflow(s) because `.github/workflows/` does not exist yet; the workflow must run the same contract commands and fail on stale generated artifacts.
  - [x] Preserve existing Story 1.1 and Story 1.2 verification commands; extend them rather than replacing them with weaker checks.
  - [x] Keep coverage as diagnostic only; CI must block on required behavior, architecture, schema/client, and contract evidence.

### Review Findings

- [x] [Review][Patch] Generated client can double-prefix `/api/v1` URLs [Moviqo.Front/src/shared/api/client.ts:11]
- [x] [Review][Patch] Generated artifact checks pass when schema/client files are untracked [.github/workflows/ci.yml:47]
- [x] [Review][Patch] CI does not run the integration test suite against real PostgreSQL [.github/workflows/ci.yml:45]
- [x] [Review][Patch] Validation Problem Details can echo unsafe validator text [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:132]
- [x] [Review][Patch] Wrapped DRF exceptions drop protocol headers [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:102]

## Dev Notes

### Scope and boundaries

- This story creates the API contract, generated client, error envelope, and verification contract. It is not the implementation story for user registration, authentication flows, tenant-owned data, workflow design, process runtime, landing content, or production deployment.
- Existing `/health/start/` behavior from Story 1.1 must remain minimal and must not be moved under `/api/v1`; health endpoints are operational seams and should not leak topology or credentials.
- Story 1.2 already created the frontend API seam under `Moviqo.Front/src/shared/api/`. Extend that seam and keep feature consumers from importing generated internals directly.
- No AI, broker, Redis, Celery, distributed cache, microservice, SSR server, or hand-maintained duplicate DTO layer belongs in this story.

### Current repo state to preserve

- Backend root: `Moviqo.Back/`
  - `pyproject.toml` already pins Django 5.2.15, DRF 3.17.1, drf-spectacular 0.30.0, Psycopg 3.3.4, pytest 9.1.1, and `REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"`.
  - `src/moviqo/urls.py` currently exposes only `/health/start/`; add versioned API/schema routes without breaking that health check.
  - `tests/architecture/test_backend_spine_contract.py` enforces module boundaries and forbidden dependencies; update it if new shared error/schema modules affect architecture scans.
  - `tests/integration/test_django_spine.py` verifies ASGI, custom user, and health; add API/schema/error tests nearby or under a new contract test folder.
- Frontend root: `Moviqo.Front/`
  - `package.json` already enforces Node 26.6.0, Vite/React/TypeScript/Playwright scripts, architecture tests, and static artifact scanning.
  - `src/shared/api/index.ts` currently exports `ApiResult` and query registry helpers only. Generated OpenAPI code should live below `shared/api` and be exported intentionally.
  - `tests/architecture/frontend-boundaries.test.mjs` forbids upward layer imports and feature deep imports; generated client imports must not create violations.
- Repository CI: `.github/workflows/` is absent. This story should add the first CI workflow instead of assuming one exists.

### Architecture guardrails

- AD-7 is the central rule: REST/JSON under `/api/v1`, drf-spectacular OpenAPI, generated TypeScript client, server-side authorization, Django session/CSRF later, and RFC 9457 Problem Details with stable codes and correlation IDs.
- AD-12 requires safe telemetry: logs, metrics, traces, analytics, and error responses must exclude Process Data, credentials, tokens, private links, stack traces, and sensitive diagnostics.
- AD-16 requires red -> green -> refactor and blocks behavior without executable evidence. The dev agent must create failing tests first for schema validation, stale generated client detection, and each Problem Details error family.
- Keep module ownership intact. Generic HTTP/problem-details primitives may live under `moviqo/building_blocks/` or another approved shared technical package only if they do not contain business concepts. Domain modules must not import another module's internals.

### API and error contract requirements

- Use drf-spectacular for schema generation and validation. Current docs support adding `SpectacularAPIView` to URL patterns and running `manage.py spectacular --file <schema> --validate --fail-on-warn`.
- The API schema path and operation paths must be versioned as `/api/v1/...`. If the served schema route is separate from business endpoints, name it clearly, for example `/api/v1/schema/`.
- Runtime errors and OpenAPI components must use one Problem Details shape. Do not let views return a mix of DRF default `{"detail": ...}`, field-error dictionaries, and Problem Details.
- Error `code` values are stable application codes, not translated display text. Human-readable `title`/`detail` may be localized later, but the code must remain contract-stable.
- Validation errors may identify only authorized fields and constraints. Hidden resource IDs, Organization names, Process Data, submitted confidential values, and existence hints must not appear.
- Unexpected failures must return safe Problem Details and correlation ID, while detailed diagnostics remain in protected technical logs only.

### Frontend client requirements

- Prefer generated types/client code from the OpenAPI artifact. Current `openapi-typescript` docs support generating TypeScript types from a schema path, and `openapi-fetch` can consume those generated `paths` types for a typed fetch client.
- Add dependencies deliberately and lock them. Do not replace the existing query registry with multiple remote-state caches.
- Generated output must be deterministic enough for CI stale checks. If generated files are committed, CI should regenerate and fail on diff. If generated files are not committed, the build must generate them before typecheck and fail if the schema is missing.
- Client code must normalize Problem Details through generated types. Do not preserve a legacy dependency on DRF's default `detail` response shape.

### Testing requirements

- Backend required evidence:
  - `uv sync --frozen`
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py spectacular --file <schema-path> --validate --fail-on-warn --settings=moviqo.settings.test`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
- Frontend required evidence:
  - `npm run check:node`
  - `npm run test:architecture`
  - `npm run test:unit`
  - generated-client stale check
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:e2e` if the story changes the rendered shell or client-visible behavior
- CI required evidence:
  - backend and frontend checks run from their own roots or via root wrappers with explicit working directories.
  - stale schema/client artifacts fail CI.
  - existing architecture checks from Stories 1.1 and 1.2 remain active.

### Previous story intelligence

- Story 1.1 established backend path discipline, module-boundary tests, deterministic build-input tests, secret-file exclusions, and fail-closed production settings. Reuse those patterns and update `tool.moviqo.verify_commands` if Story 1.3 adds required backend checks.
- Story 1.1 local verification succeeded under `uv` with Python 3.14.6, but Docker daemon availability was a local limitation. Do not make Docker builds the only way to prove schema/error behavior.
- Story 1.2 established a static Vite SPA, feature-sliced boundaries, one query registry seam, reducer-based draft-state primitives, artifact secret scanning, and Playwright smoke coverage. Generated client code should integrate with those seams rather than adding a parallel app structure.
- Story 1.2 aligned the frontend runtime contract to Node 26.6.0. Keep that enforcement; do not weaken it for local convenience.
- Recent commits show Story 1.1 and 1.2 were hardened through review. Expect reviewers to reject vague CI claims, stale generated artifacts, and error responses that are only partially converted.

### Project Structure Notes

- Add backend code under `Moviqo.Back/src/moviqo/` and tests under `Moviqo.Back/tests/`; do not place Django code at the repository root.
- Add generated frontend API code under `Moviqo.Front/src/shared/api/`; do not deep-import it from pages/features if an exported seam is available.
- Add CI workflows under `.github/workflows/`. Keep GitHub agent metadata under `.github/agents/` untouched.
- Keep `Moviqo.Infraestructure/` untouched; infrastructure topology stories own the correctly spelled future `Moviqo.Infrastructure/` root.
- Do not modify `Moviqo.AI/`; AI remains outside MVP.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.3]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-387 through FR-393 and NFR-030]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-12, AD-16]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, `## Stack`, `## Structural Seed`, `## Consistency Conventions`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-technology-currency.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-security-data-integrity.md`]
- [Source: `_bmad-output/implementation-artifacts/1-1-establish-the-backend-modular-spine.md`]
- [Source: `_bmad-output/implementation-artifacts/1-2-establish-the-frontend-application-spine.md`]
- [drf-spectacular docs via Context7: schema route and `manage.py spectacular --validate --fail-on-warn`]
- [Django REST Framework docs via Context7: custom `EXCEPTION_HANDLER` and validation exception behavior]
- [openapi-typescript/openapi-fetch docs via Context7: CLI generation and typed fetch client]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- Branch preflight selected `story/1-3-establish-the-api-error-build-and-test-contract`.
- Red phase confirmed with failing `uv run pytest tests/contract` and `npm run test:unit` before implementation.
- Local Node guard preserved: `npm run typecheck` and `npm run build` stop when the runtime does not match the required Node `26.6.0`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status set to `ready-for-dev`.
- Added `/api/v1/schema/` through drf-spectacular and `/api/v1/system/ping/` as the minimal smoke endpoint for schema and error-contract evidence.
- Added shared backend Problem Details handling with safe correlation IDs, normalized authorization/not-found responses, validation `invalidParams`, conflict support, and safe unexpected-error responses.
- Committed deterministic OpenAPI output at `docs/api/openapi-v1.json` and generated TypeScript API types under `Moviqo.Front/src/shared/api/generated/`.
- Wired the frontend API seam through `src/shared/api/index.ts` using `openapi-fetch` and generated `ProblemDetails` types.
- Added backend contract/safety tests, frontend API client unit tests, stale schema/client checks, documented verification commands, and GitHub Actions CI with PostgreSQL-backed migration coverage.
- Verification completed: backend ruff, full pytest, schema generation/diff, makemigrations check, test migrate, production deploy check, health command, frontend architecture, API client stale check, unit tests, direct TypeScript compile, direct Vite build, and static artifact scan.

### File List

- `.github/workflows/ci.yml`
- `README.md`
- `docs/api/openapi-v1.json`
- `Moviqo.Back/README.md`
- `Moviqo.Back/pyproject.toml`
- `Moviqo.Back/src/moviqo/building_blocks/api/__init__.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/correlation.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/views.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/settings/integration.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_api_schema_contract.py`
- `Moviqo.Back/tests/contract/test_problem_details_contract.py`
- `Moviqo.Back/tests/unit/test_build_inputs.py`
- `Moviqo.Front/.npmrc`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/shared/api/client.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/api/index.ts`
- `Moviqo.Front/src/shared/api/model/apiResult.ts`
- `Moviqo.Front/tests/unit/api-client-contract.test.cts`

### Change Log

- 2026-08-03: Implemented Story 1.3 API schema, Problem Details, generated client, verification, and CI contract.
