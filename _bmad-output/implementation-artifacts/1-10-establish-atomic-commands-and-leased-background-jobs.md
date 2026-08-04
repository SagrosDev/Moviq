---
baseline_commit: f7c4f64
status: done
---

# Story 1.10: Establish Atomic Commands and Leased Background Jobs

Status: done

## Story

As a Moviqo operator,
I want mutations and external work to be transactional and retry-safe,
so that retries cannot duplicate business outcomes or lose evidence.

## Acceptance Criteria

1. **Given** a retryable business command with an Organization, command type, idempotency key, and request hash
   **When** its application handler succeeds
   **Then** business state, immutable audit, the constrained idempotency result, and required outbox rows commit in one PostgreSQL transaction
   **And** a rollback leaves none of them persisted.

2. **Given** the same idempotency key is retried
   **When** its request hash matches or differs
   **Then** a matching request returns the stored result without repeating side effects, while a different request receives a stable key-reuse conflict
   **And** concurrent real-PostgreSQL tests prove a single committed business outcome.

3. **Given** eligible outbox or job rows and multiple workers
   **When** workers claim work using `SELECT ... FOR UPDATE SKIP LOCKED`
   **Then** each row has one bounded lease owner, expired leases are recoverable, handlers are idempotent, retry delay follows configured backoff, and exhausted work enters dead letter with an operational reason
   **And** external failure cannot reverse committed business state.

4. **Given** the Gate 1 environment
   **When** the job runner is deployed
   **Then** only the minimal outbox/email drain required by the stakeholder journey is enabled
   **And** inspection, backup, and lifecycle schedules remain disabled until their gate-specific stories pass.

## Tasks / Subtasks

- [x] Add the transactional command/idempotency foundation for future state-changing handlers (AC: 1, 2)
  - [x] Introduce durable persistence for command results keyed by `(organization_id, command_type, idempotency_key)` and storing request hash, result envelope, completion status, and timestamps.
  - [x] Add an application-level command coordinator that owns the outer `transaction.atomic()` boundary, joins existing tenant context, and persists business state, immutable audit, idempotency outcome, and outbox rows together.
  - [x] Ensure idempotent replay returns the stored result without re-running the handler, and mismatched request hashes fail with one stable conflict contract rather than an unhandled database error.
- [x] Establish the minimal immutable audit and outbox contracts without violating module boundaries (AC: 1, 2)
  - [x] Add a Governance-facing public application seam for appending immutable transactional audit records from within the caller's transaction.
  - [x] Add a Messaging-facing public application seam for enqueuing outbox work from within the caller's transaction.
  - [x] Keep feature modules consuming those public contracts; do not read or write another module's tables directly from `WorkflowRuntime`, `Organizations`, or future handlers.
- [x] Add PostgreSQL-backed leasing and dead-letter behavior for outbox/job execution (AC: 3)
  - [x] Add outbox/job persistence with lease owner, lease expiry, attempt count, next-attempt time, dead-letter timestamp, and dead-letter reason fields.
  - [x] Implement worker claim logic with `SELECT ... FOR UPDATE SKIP LOCKED`, bounded lease duration, expired-lease recovery, and configured retry backoff.
  - [x] Ensure each handler is safe to run more than once and that delivery or downstream failure never rolls back already committed business state.
- [x] Wire the first Gate 1 runner to the existing messaging/UAT contract only (AC: 3, 4)
  - [x] Add the minimal outbox/email drain entry point needed for the current synthetic-only UAT path and keep it aligned with the existing `resend-outbox` adapter.
  - [x] Surface runner health/configuration through existing backend seams so deployment checks can prove the enabled adapter and disabled-by-gate services.
  - [x] Do not enable malware scanning, backup automation, or lifecycle schedulers in this story.
- [x] Prove the foundation with real PostgreSQL concurrency and failure tests before later feature stories build on it (AC: 1, 2, 3, 4)
  - [x] Add unit tests for command replay, key-reuse conflict, lease expiry recovery, retry scheduling, and dead-letter transitions.
  - [x] Add integration tests against PostgreSQL proving one committed business outcome under concurrent retries and one leased worker per eligible row.
  - [x] Add contract or deploy-check coverage proving the Gate 1 environment still reports only the outbox/email runner path and keeps the other scheduled services disabled by gate.

### Review Findings

- [x] [Review][Patch] Worker leasing mutates outbox rows outside tenant context, so forced PostgreSQL RLS can prevent the drain path from claiming or updating rows at all. [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py:47]
- [x] [Review][Patch] The outbox drain acknowledges `console` and `resend-outbox` messages as delivered without invoking any delivery adapter, which can silently drop email work in UAT. [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py:180]
- [x] [Review][Patch] Lease finalization ignores lost ownership and can misreport success or raise unexpectedly after another worker reclaims the row. [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py:76]
- [x] [Review][Patch] Outbox retry telemetry stores raw exception strings in durable state, which can leak provider responses or tenant-sensitive data into `last_error`. [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py:155]
- [x] [Review][Patch] Story 1.10 still lacks real PostgreSQL coverage for expired-lease recovery, dead-letter transitions, and the actual `drain_outbox_messages()` execution path. [Moviqo.Back/tests/integration/test_atomic_commands_integration.py:88]

## Dev Notes

### Story intent

- Story 1.10 is foundational backend work. It establishes the command, idempotency, audit, outbox, and leased-job primitives that later registration, publication, process-start, save, complete, notification, export, and lifecycle stories will reuse.
- The target outcome is not "background jobs exist." The target outcome is stricter: a retryable mutation must either commit its full business/audit/evidence package once or leave no trace, and any post-commit external work must replay independently without changing the already committed business result.
- On Tuesday, August 4, 2026, the approved Gate 1 scope is still the synthetic-only internal E2E environment. This story must keep that scope narrow by enabling only the minimal outbox/email drain required by the stakeholder journey.

### Epic and cross-story context

- Story 1.6 and Story 1.7 established tenant-scoped transactional context and the isolation release gate. This story must reuse that tenant context for both API commands and worker claims; background execution is not exempt from Organization scoping.
- Story 1.8 already hardened the environment contract so UAT must use `MOVIQO_MESSAGE_DELIVERY_ADAPTER=resend-outbox` and keep malware scanning, independent backups, and lifecycle schedules marked `disabled-by-gate`.
- Story 1.9 narrowed identity semantics to one account and one Organization membership, which removes ambiguity for the Organization scope required by idempotency keys and retryable commands.
- Stories 1.12 through 1.16, 1.28 through 1.31, and later notification/export stories depend on this foundation. If this story gets the transaction owner, idempotency scope, or leasing rules wrong, later business commands will encode the wrong pattern.

### Previous story intelligence

- Story 1.9 already centralized sensitive identity behavior into application services and preserved safe non-disclosing Problem Details responses. Follow the same pattern here: convert integrity/concurrency failures into stable product contracts instead of leaking raw database exceptions.
- Story 1.9 also reinforced that the tenant context should be derived server-side and fail closed. Job execution must preserve that stance by applying the correct Organization context before any protected read or write.
- The current implementation artifacts show a deliberate pattern of adding infrastructure only when it becomes an executable release gate. Keep Story 1.10 incremental and test-led rather than introducing speculative worker frameworks or cross-cutting abstractions that the repo does not yet need.

### Git intelligence

- Recent commits before this story context were `f7c4f64` (merge of Story 1.9), `a0ad988` (Python unit-test fix), `6712789` (unit-test fix), `00bb0df` (main merge), and `c7106a7` (conflict resolution). The immediate pattern is small, corrective backend changes with strong test feedback.
- Stay aligned with that pattern: build the minimum reusable command/job infrastructure that satisfies the acceptance criteria and proves it under tests. Do not introduce a broker, Celery, Redis, or a parallel worker service model.

### Existing repo state to preserve

- [Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py) already provides `tenant_atomic_context()` and `apply_tenant_context()`. Reuse these semantics so request and job execution both set tenant state with transaction-scoped `SET LOCAL`.
- [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py) already exposes the safe RFC 9457 response contract and a generic `Conflict` exception. Extend this seam or an adjacent one for idempotency-key reuse instead of inventing ad hoc error payloads.
- [Moviqo.Back/src/moviqo/jobs/health.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/jobs/health.py) and [Moviqo.Back/tests/integration/test_django_spine.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/integration/test_django_spine.py) already define the minimal startup/health report shape, including `messageDelivery` and `disabledServices`.
- [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py) already treats `resend-outbox` as the UAT messaging adapter, while [Moviqo.Back/src/moviqo/settings/uat_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/uat_contract.py) fails closed unless UAT uses that adapter and keeps the other scheduled services disabled.
- [Moviqo.Back/tests/architecture/test_backend_spine_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/tests/architecture/test_backend_spine_contract.py) already enforces module boundaries and forbids forbidden runtime dependencies. Any new persistence or runner code must fit those checks.

### Architecture guardrails the implementation must follow

- AD-3 is the core rule for this story: one command enters through one application handler, one outer coordinator owns the transaction, called module contracts join that transaction, and business state, immutable audit, idempotency result, and outbox rows commit together or not at all.
- AD-10 is the core job rule: outbox/job rows are claimed with bounded PostgreSQL leases and `SELECT ... FOR UPDATE SKIP LOCKED`, handlers are idempotent, retries use backoff, and exhausted work moves to dead letter with an operational reason.
- AD-2 remains binding for background work: every protected request and job must derive one immutable `TenantContext`; missing or mismatched tenant context must deny the operation without exposing or mutating tenant data.
- AD-1 remains binding for placement: feature modules can call another module only through its `application` contract and cannot import another module's internals or read/write its tables directly.
- AD-12 still applies: telemetry and failure reporting for commands and workers must stay tenant-safe and must not emit Process Data, secrets, tokens, or private links.
- AD-16 remains the implementation discipline: red -> green -> refactor, with real PostgreSQL integration/concurrency evidence rather than hand-waving over transaction and lease behavior.

### Current code behavior this story changes

- There is currently no durable idempotency-result table, no outbox table, no leased-job table, and no generic command coordinator in the backend repo. This story should add those primitives once, in the correct seams, so later stories do not recreate them inconsistently.
- The module `application` packages for `workflow_runtime`, `messaging`, and `governance` are still minimal health/export seams. Story 1.10 should expand those public contracts carefully so later business handlers can append audit and queue outbox work without violating the architecture test.
- The current health and UAT contracts already expose message-delivery mode and disabled-by-gate services. Story 1.10 should extend that contract only far enough to prove the minimal email/outbox runner path exists and that no other scheduled operations were silently enabled.
- There is no current business endpoint that must ship a complete user-facing command flow in this story. A reusable command fixture or small internal reference command used by tests is acceptable if it proves the transaction and replay semantics without adding fake product scope.

### What must be preserved

- The backend must remain a single Django/PostgreSQL codebase with no broker, Redis, Celery, or distributed cache dependency.
- The safe Problem Details contract from Story 1.3 and the non-disclosing failure behavior from Stories 1.7 through 1.9 must remain intact.
- UAT must still fail closed if the message adapter is not `resend-outbox` or if malware scanning, independent backups, or lifecycle schedules are enabled before their gate stories.
- Module boundaries, tenant RLS/runtime-role rules, and `health_start` response semantics must stay green.

### Likely files and seams to touch

- Add shared command/job primitives under `Moviqo.Back/src/moviqo/building_blocks/` if they are genuinely cross-module infrastructure rather than one module's business policy.
- Extend [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py) with public outbox-enqueue and runner-facing seams that future notification stories can reuse.
- Extend [Moviqo.Back/src/moviqo/modules/governance/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/governance/application/__init__.py) with a public transactional-audit append seam rather than letting feature modules write governance tables directly.
- Extend [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py) only if a reference command or command-coordinator integration point is needed there for future workflow mutations.
- Add migrations under the owning app(s) for idempotency, outbox, and job/dead-letter persistence. Be explicit about ownership so later stories know which module owns which tables.
- Add or extend worker entry-point code under `Moviqo.Back/src/moviqo/jobs/` and, if a Django command entry point is needed, keep it under the owning module's `management/commands/` package.
- Update tests under `Moviqo.Back/tests/unit/`, `tests/integration/`, `tests/contract/`, and `tests/architecture/` to cover replay, conflict, leasing, tenant context, and UAT/Gate 1 runner boundaries.

### Likely implementation shape

- Prefer one reusable command coordinator that accepts tenant context, idempotency identity, and a callable handler, rather than each future endpoint re-implementing replay and transaction logic.
- Keep immutable audit append and outbox enqueue as explicit side effects invoked inside that coordinator, not hidden implicit model signals.
- Model worker execution around claim -> lease -> execute -> ack/retry/dead-letter transitions. Make those transitions explicit and testable rather than burying them in a tight loop with side effects that are hard to assert.
- If a generic result envelope is stored for replay, keep it safe and bounded. Do not persist secrets, raw credentials, or tenant-sensitive payloads that later contract tests would have to redact.
- Treat dead-letter as operational evidence, not a silent drop. The reason must be explicit enough for operators and later stories to inspect without exposing protected business data.

### What must not be broken

- `tenant_atomic_context()` and runtime-role activation semantics in PostgreSQL.
- The backend spine architecture tests and forbidden-dependency checks.
- The current startup/health contracts for `messageDelivery`, `fileInspection`, and `disabledServices`.
- The UAT fail-closed environment contract and `resend-outbox` adapter naming already used by tests and settings.

### Testing requirements

- Required local backend verification commands:
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py check --deploy --settings=moviqo.settings.production`
  - `uv run python src/manage.py health_start`
- Required story-specific evidence:
  - A failing test first for same-key same-hash replay returning the stored result without repeating side effects.
  - A failing test first for same-key different-hash reuse returning one stable conflict contract.
  - Real PostgreSQL concurrency coverage proving exactly one committed business outcome under concurrent retries.
  - Real PostgreSQL leasing coverage proving one worker claims each eligible row, expired leases are recoverable, and exhausted work dead-letters with an operational reason.
  - Contract or deploy-check coverage proving the Gate 1 environment reports only the minimal outbox/email runner path and keeps malware scanning, independent backups, and lifecycle schedules disabled by gate.

### Latest technical notes

- The local architecture currency review dated August 1, 2026 already validated the stack versions for Django 5.2.15, DRF 3.17.1, PostgreSQL 17.10, and pytest 9.1.1. Keep this story on that approved stack; do not introduce alternative worker or persistence tooling.
- The architecture adversarial review already called out transaction ownership and idempotency scope as a high-risk ambiguity and resolved it in favor of one outer application coordinator plus unique `(OrganizationId, CommandType, IdempotencyKey)` scope. Treat that resolution as non-negotiable.

### Project Structure Notes

- Keep cross-module infrastructure in shared backend building blocks only when it is truly generic. Business-policy code for notifications still belongs to `moviqo.modules.messaging`, and future workflow/process command handlers still belong to `moviqo.modules.workflow_runtime`.
- Avoid creating a new top-level module just for idempotency or jobs. The existing architecture already reserves `building_blocks`, `jobs`, and module `application` contracts for this kind of work.
- Do not add any frontend code, SPA state, or browser-side retry authority in this story. The acceptance criteria are entirely backend/infrastructure-focused.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.10]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Internal E2E beta]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-1]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-3]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-10]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, Consistency conventions for Mutation and Tests]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-397]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, NFR-025, NFR-026, NFR-027, NFR-028]
- [Source: `_bmad-output/specs/spec-Moviqo/SPEC.md`, CAP-6, CAP-10, Constraints]
- [Source: `_bmad-output/implementation-artifacts/1-8-enforce-environment-and-data-protection-boundaries.md`]
- [Source: `_bmad-output/implementation-artifacts/1-9-enforce-the-single-organization-identity-boundary.md`]
- [Source: `Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py`]
- [Source: `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`]
- [Source: `Moviqo.Back/src/moviqo/jobs/health.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/governance/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/settings/uat_contract.py`]
- [Source: `Moviqo.Back/tests/architecture/test_backend_spine_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_django_spine.py`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from the Epic 1 artifact, local PRD, local architecture spine and review notes, current implementation artifacts for Stories 1.8 and 1.9, current backend code seams, and current sprint status.
- Branch: `story/1-10-establish-atomic-commands-and-leased-background-jobs`
- Validation run on 2026-08-04: `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`, `uv run pytest tests/integration --ds=moviqo.settings.integration`, `uv run python src/manage.py health_start`
- Production deploy-check run on 2026-08-04 with non-production validation env values against local PostgreSQL; result contained only Django warning `security.W009` because the temporary validation secret was intentionally short.

### Completion Notes List

- Added a reusable atomic command coordinator that keeps business writes, immutable audit, stored idempotency results, and outbox rows in one tenant-scoped PostgreSQL transaction.
- Added governance command-result and transactional-audit persistence, messaging outbox persistence and leased worker transitions, and a workflow-runtime probe model used to prove the foundation under tests.
- Added the first Gate 1 outbox drain entry point plus health/UAT reporting that exposes only the email outbox runner path while preserving the disabled-by-gate services contract.
- Added unit, contract, architecture, and PostgreSQL integration coverage for replay, key-reuse conflict, rollback safety, lease recovery, dead-lettering, tenant isolation, and single-outcome concurrency.

### File List

- `Moviqo.Back/src/moviqo/building_blocks/commands.py`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/__init__.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py`
- `Moviqo.Back/src/moviqo/jobs/health.py`
- `Moviqo.Back/src/moviqo/modules/governance/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/migrations/0001_initial.py`
- `Moviqo.Back/src/moviqo/modules/governance/migrations/__init__.py`
- `Moviqo.Back/src/moviqo/modules/governance/models.py`
- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/management/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/management/commands/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/management/commands/drain_outbox.py`
- `Moviqo.Back/src/moviqo/modules/messaging/migrations/0001_initial.py`
- `Moviqo.Back/src/moviqo/modules/messaging/migrations/__init__.py`
- `Moviqo.Back/src/moviqo/modules/messaging/models.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/0001_initial.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Moviqo.Back/src/moviqo/settings/uat_contract.py`
- `Moviqo.Back/tests/contract/test_problem_details_contract.py`
- `Moviqo.Back/tests/integration/test_atomic_commands_integration.py`
- `Moviqo.Back/tests/integration/test_django_spine.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Moviqo.Back/tests/unit/test_atomic_commands.py`
- `Moviqo.Back/tests/unit/test_uat_contract.py`
- `_bmad-output/implementation-artifacts/1-10-establish-atomic-commands-and-leased-background-jobs.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-04: Implemented atomic command coordination, transactional audit/outbox persistence, leased outbox processing, Gate 1 runner reporting, and the supporting PostgreSQL/unit/contract coverage for Story 1.10.
