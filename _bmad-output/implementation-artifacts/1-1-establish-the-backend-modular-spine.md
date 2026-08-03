---
baseline_commit: b63084c0587460bbcbc643ddbe5de57ab7302965
status: done
---

# Story 1.1: Establish the Backend Modular Spine

Status: done

## Story

As a Moviqo delivery team,
I want a buildable modular backend with enforced ownership boundaries,
so that product behavior starts from one consistent server foundation.

## Acceptance Criteria

1. **Given** a clean repository checkout with the approved Python toolchain
   **When** the backend verification command runs
   **Then** Django 5.2.15 LTS starts through the ASGI composition root on Python 3.14.6 with DRF 3.17.1, Psycopg 3.3.4, drf-spectacular 0.30.0, PostgreSQL 17.10, and pytest 9.1.1 constraints resolved
   **And** the first migration uses a minimal custom Moviqo user model rather than Django's default user.

2. **Given** the `organizations`, `workflow_design`, `workflow_runtime`, `files`, `messaging`, and `governance` modules
   **When** an architecture fixture imports another module's domain or persistence implementation, reads its tables directly, or creates a cyclic dependency
   **Then** the architecture test fails with the source module, prohibited target, and permitted public-contract alternative
   **And** API and job composition roots may call module application services without weakening the boundary.

3. **Given** the backend build configuration
   **When** CI creates the production artifact twice from the same commit and locked dependencies
   **Then** both builds produce the same immutable backend image inputs and a successful health-start check
   **And** no AI, broker, Redis, Celery, distributed cache, or microservice dependency is present.

## Tasks / Subtasks

- [x] Establish the backend project and dependency lock (AC: 1, 3)
  - [x] Create `Moviqo.Back/pyproject.toml` with the approved Python, Django, DRF, Psycopg, drf-spectacular, pytest, and PostgreSQL compatibility constraints.
  - [x] Add the reproducible local/CI commands for install, lint/type checks if selected by the project, unit tests, architecture tests, migrations check, and health-start verification.
  - [x] Keep the virtual environment and generated artifacts out of source control.
- [x] Create the Django composition roots (AC: 1, 3)
  - [x] Add `src/manage.py`, `src/moviqo/settings/`, `src/moviqo/asgi.py`, and `src/moviqo/urls.py`.
  - [x] Make settings environment-aware and fail closed for missing critical configuration; do not add production credentials or real customer data.
  - [x] Expose an intentionally minimal health-start path without implementing later feature endpoints.
- [x] Establish the custom identity seed before the first migration (AC: 1)
  - [x] Add the minimal custom Django user model in the Organizations module and configure `AUTH_USER_MODEL` before running migrations.
  - [x] Create the initial migration with the custom user model and verify a clean database can migrate from zero.
  - [x] Register the model with Django admin only as a development/inspection aid; do not implement registration, verification, roles, or Organization membership in this story.
- [x] Create the six backend module boundaries (AC: 2)
  - [x] Add `organizations`, `workflow_design`, `workflow_runtime`, `files`, `messaging`, and `governance` module packages with public application-contract entry points.
  - [x] Add `building_blocks/` for primitives only and `jobs/` for short-lived worker command entry points.
  - [x] Keep module internals private and prevent direct cross-module domain, persistence, and table access.
- [x] Add architecture-boundary tests (AC: 2)
  - [x] Test permitted composition-root-to-application-service calls.
  - [x] Test forbidden lower-layer imports, direct cross-module persistence access, and cyclic dependencies with actionable failure messages.
  - [x] Ensure the checks run in the normal backend verification command.
- [x] Add deterministic backend image/build verification (AC: 3)
  - [x] Define one immutable backend container build from the locked dependency inputs.
  - [x] Verify two builds from the same commit use equivalent inputs and both pass the health-start check.
  - [x] Explicitly reject AI, broker, Redis, Celery, distributed cache, and microservice dependencies in dependency/build checks.

## Dev Notes

### Scope and boundaries

- This is an enabling foundation story, not the implementation of authentication, Organization registration, API resources, workflow behavior, frontend code, deployment infrastructure, or background business jobs.
- Story 1.2 owns the frontend application spine. Story 1.3 owns the generated API/error/build/test contract. Story 1.6 owns tenant-owned relational data beyond the minimal custom user migration. Do not pull those stories forward except where a minimal composition-root seam is required for this story's acceptance criteria.
- The Architecture Spine explicitly defines a structural seed, not an external starter repository. Create the seed under the paths below.

### Required project structure

```text
Moviqo.Back/
  pyproject.toml
  src/
    manage.py
    moviqo/
      settings/
      asgi.py
      urls.py
      building_blocks/
      modules/
        organizations/
        workflow_design/
        workflow_runtime/
        files/
        messaging/
        governance/
      jobs/
  tests/
    unit/
    integration/
    architecture/
```

### Architecture guardrails

- One backend codebase serves API and worker processes. Modules communicate only through public application contracts or integration events; they never import another module's domain/persistence implementation or read/write another module's tables directly.
- Use the custom user model from the first migration. Future models reference it through `settings.AUTH_USER_MODEL`/`get_user_model()`, never a hard-coded Django `User` import.
- Keep business concepts out of `building_blocks/`; it is for generic primitives only.
- Keep worker entry points short-lived and separate from the HTTP composition root. Do not introduce a broker, Redis, Celery, distributed cache, microservices, or AI dependencies.
- The backend must remain suitable for the later ASGI deployment and immutable-container topology; do not add frontend-serving or provider-specific coupling here.

### Approved versions

Python 3.14.6; Django 5.2.15 LTS; Django REST Framework 3.17.1; Psycopg 3.3.4; drf-spectacular 0.30.0; PostgreSQL 17.10; pytest 9.1.1. Use the Architecture Spine as the source of truth if package resolution exposes a compatibility issue; do not silently substitute versions.

### Testing requirements

- Follow red → green → refactor for each behavior.
- Use unit tests for pure boundary/validation helpers, real PostgreSQL integration only when database behavior is involved, and architecture tests for import/dependency rules.
- Verify from a clean checkout: dependency resolution, initial migration from zero, ASGI import/start, architecture checks, forbidden-dependency checks, and deterministic build inputs.
- Coverage is diagnostic; passing behavior and architecture evidence are required instead of a universal percentage target.

### Project Structure Notes

- The repository currently contains planning artifacts and a minimal README; no backend implementation exists to preserve or refactor.
- Create the backend under `Moviqo.Back/` exactly as specified. Do not place Django code at the repository root or mix it with the future `Moviqo.Front/` and `Moviqo.Infrastructure/` trees.
- Rename/use the correctly spelled `Moviqo.Infrastructure/` only in its own later story; this story should not implement provider infrastructure.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.1]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, `## Stack`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, `## Structural Seed`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, `AD-1`, `AD-7`, `AD-11`, `AD-15`, `AD-16`]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-02.md`, `Story 1.1 — Scaffold the Moviqo Application Spine`]
- [Django documentation: custom user model and first migration](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/)
- [Django documentation: ASGI deployment](https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/)
- [Python 3.14 documentation: virtual environments](https://docs.python.org/3.14/library/venv.html)

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- 2026-08-02: Added backend scaffold and tests for dependency constraints, Django composition root, custom user model, module boundaries, and deterministic build inputs.
- 2026-08-02: `py -m pytest` could not run because the active interpreter has no `pytest` installed.
- 2026-08-02: `py --list` shows Python 3.13, 3.12, and 3.11 only; required Python 3.14.6 is not installed.
- 2026-08-02: `uv` is not installed, so pinned dependency sync and frozen verification cannot run locally.
- 2026-08-02: `py -m compileall -q src tests` passed for the backend scaffold.
- 2026-08-03: Generated `uv.lock`, synced dependencies with Python 3.14.6, and verified Django 5.2.15, DRF 3.17.1, Psycopg 3.3.4, drf-spectacular 0.30.0, and pytest 9.1.1.
- 2026-08-03: `uv run ruff check src tests` passed.
- 2026-08-03: `uv run pytest` passed: 16 tests.
- 2026-08-03: `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run` passed: no changes detected.
- 2026-08-03: `uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput` passed from zero, applying `organizations.0001_initial`.
- 2026-08-03: Development and production health-start checks passed; production check used synthetic local environment values only.
- 2026-08-03: `uv run python src/manage.py check --deploy` exited 0 with expected development-default security warnings.
- 2026-08-03: Docker client exists but the local Docker daemon is not running, so actual image builds were not executed locally; locked deterministic image inputs are covered by unit tests and `Dockerfile`.
- 2026-08-03: Quick Dev review ran Blind Hunter and Edge Case Hunter; patch-level findings were applied for architecture guard coverage, deterministic image inputs, forbidden lockfile dependencies, production deploy settings, module health coverage, ASGI coverage, and secret-file ignores.
- 2026-08-03: `uv run ruff check src tests` passed after review patches.
- 2026-08-03: `uv run pytest` passed: 19 tests.
- 2026-08-03: `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run` passed: no changes detected.
- 2026-08-03: `uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput` passed.
- 2026-08-03: Production `check --deploy` passed with no issues using synthetic local environment values.
- 2026-08-03: Production `health_start` passed with synthetic local environment values.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status set to `ready-for-dev`.
- Backend scaffold is implemented but not complete under the story definition because the approved local toolchain is missing.
- Completed backend modular spine under `Moviqo.Back/` with Django ASGI composition roots, environment-aware settings, and minimal health-start seam.
- Added minimal custom `organizations.MoviqoUser` and folded all custom-user state into `organizations.0001_initial`.
- Added six module packages with public application-contract entry points plus architecture tests for public-contract imports, forbidden internal imports, and dependency cycles.
- Added locked dependency inputs via `uv.lock` and container build inputs that use `uv sync --frozen --no-dev`.
- Added verification coverage for dependency constraints, forbidden dependencies, deterministic build inputs, ASGI/custom-user behavior, health-start, and module boundaries.
- Review patches hardened architecture tests, build-input determinism coverage, production checks, module health coverage, and local secret-file exclusions.

### File List

- `_bmad-output/implementation-artifacts/1-1-establish-the-backend-modular-spine.md`
- `Moviqo.Back/.dockerignore`
- `Moviqo.Back/.gitignore`
- `Moviqo.Back/Dockerfile`
- `Moviqo.Back/README.md`
- `Moviqo.Back/pyproject.toml`
- `Moviqo.Back/src/manage.py`
- `Moviqo.Back/src/moviqo/__init__.py`
- `Moviqo.Back/src/moviqo/asgi.py`
- `Moviqo.Back/src/moviqo/building_blocks/__init__.py`
- `Moviqo.Back/src/moviqo/jobs/__init__.py`
- `Moviqo.Back/src/moviqo/jobs/health.py`
- `Moviqo.Back/src/moviqo/modules/__init__.py`
- `Moviqo.Back/src/moviqo/modules/files/__init__.py`
- `Moviqo.Back/src/moviqo/modules/files/apps.py`
- `Moviqo.Back/src/moviqo/modules/files/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/apps.py`
- `Moviqo.Back/src/moviqo/modules/governance/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/management/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/management/commands/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/management/commands/health_start.py`
- `Moviqo.Back/src/moviqo/modules/messaging/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/apps.py`
- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/admin.py`
- `Moviqo.Back/src/moviqo/modules/organizations/apps.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0001_initial.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/apps.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/apps.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/settings/__init__.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/settings/development.py`
- `Moviqo.Back/src/moviqo/settings/env.py`
- `Moviqo.Back/src/moviqo/settings/production.py`
- `Moviqo.Back/src/moviqo/settings/test.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/architecture/test_backend_spine_contract.py`
- `Moviqo.Back/tests/integration/test_django_spine.py`
- `Moviqo.Back/tests/unit/test_build_inputs.py`
- `Moviqo.Back/uv.lock`

### Change Log

- 2026-08-02: Started implementation and added the backend modular spine scaffold. Full completion is blocked by missing Python 3.14.6, `uv`, and installed test dependencies.
- 2026-08-03: Completed story implementation, added lockfile-backed deterministic build inputs, resolved migration drift, and moved story to review.

## Suggested Review Order

**Composition Roots**

- One health seam now verifies every public module contract.
  [`health.py:11`](../../Moviqo.Back/src/moviqo/jobs/health.py#L11)

- HTTP health delegates to the shared backend health job.
  [`urls.py:9`](../../Moviqo.Back/src/moviqo/urls.py#L9)

**Production Guardrails**

- Invalid boolean env values fail closed instead of coercing.
  [`env.py:29`](../../Moviqo.Back/src/moviqo/settings/env.py#L29)

- Production requires explicit host configuration and deploy security defaults.
  [`production.py:7`](../../Moviqo.Back/src/moviqo/settings/production.py#L7)

**Architecture Enforcement**

- Import parsing now resolves relative imports before boundary checks.
  [`test_backend_spine_contract.py:47`](../../Moviqo.Back/tests/architecture/test_backend_spine_contract.py#L47)

- Cross-module imports are limited to public application contracts.
  [`test_backend_spine_contract.py:137`](../../Moviqo.Back/tests/architecture/test_backend_spine_contract.py#L137)

- Direct cross-module table references are now detected.
  [`test_backend_spine_contract.py:185`](../../Moviqo.Back/tests/architecture/test_backend_spine_contract.py#L185)

- Forbidden dependencies are checked in both declarations and lockfile.
  [`test_backend_spine_contract.py:105`](../../Moviqo.Back/tests/architecture/test_backend_spine_contract.py#L105)

**Build And Test Evidence**

- Image input hashing includes the copied source tree.
  [`test_build_inputs.py:20`](../../Moviqo.Back/tests/unit/test_build_inputs.py#L20)

- Git and Docker contexts exclude local secrets.
  [`test_build_inputs.py:61`](../../Moviqo.Back/tests/unit/test_build_inputs.py#L61)

- ASGI application is imported, not only named in settings.
  [`test_django_spine.py:13`](../../Moviqo.Back/tests/integration/test_django_spine.py#L13)
