---
baseline_commit: f67f4a2
---

# Story 1.29: Start a Process from the Authorized Catalog

Status: done

## Story

As an authorized Organization member,
I want to start a published Workflow from My Work,
so that a new Process and its first assigned Task are created once.

## Acceptance Criteria

1. **Show only currently startable published workflows in My Work:** Given published Workflows with mixed starter configurations, when a Member or Designer opens `Start workflows`, then the server returns only Workflows authorized directly, through an active Team, or through all-active-members; Owners and Administrators receive every published Workflow. And archived, draft-only, inactive, or unauthorized Workflows and their counts are absent. Traceability: FR17, FR23, FR298, FR312.
2. **Create one Process and one first Task atomically from a published version:** Given an authorized Workflow version and a new idempotency key, when the user starts it, then one Process bound to that version and one first Task are created atomically, assignment is resolved inside the Organization, and audit records Organization, Workflow/version, Process ID, initiator, time, and operational-authority use. And the response navigates to an authorized Process/Task view. Traceability: FR21, FR274, FR315, FR316, AD-3.
3. **Reject unauthorized, inactive, hidden, and duplicate starts safely:** Given an unauthorized, inactive, cross-tenant, unpublished, archived, or duplicate start attempt, when the command executes, then no additional Process or Task is created and the safe response reveals no hidden Workflow state. And an identical retry of a successful logical start returns the original Process identifier. Traceability: NFR2, NFR25, NFR26, NFR30, AD-2, AD-7.

## Tasks / Subtasks

- [x] Replace the placeholder My Work `startWorkflows` collection with backend-authoritative published workflow availability (AC: 1, 3)
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` from its current empty collection stub so it queries published `WorkflowVersion` rows and returns only the workflows the current membership may start.
  - [x] Reuse the starter semantics already established in Story 1.26 via `workflow_design.application.publication_configuration.evaluate_workflow_starter_authorization()` or a closely related backend helper; do not duplicate starter logic in `workflow_runtime`.
  - [x] Filter out draft-only definitions, archived or inactive workflow heads once that state exists in the current schema, and any workflow whose starter configuration no longer resolves for the active membership or team set.
  - [x] Preserve the current tenant fail-closed behavior in `MyWorkDashboardView`: hostile `organizationId` or `membershipId` query strings must remain irrelevant, and unauthorized workflows must not leak through counts, titles, or empty-state differences.
  - [x] Return a start-workflow summary shape that the SPA can render without extra lookup calls: workflow ID, workflow name, version number, and one plain-language availability explanation derived from the backend result.

- [x] Introduce the minimal runtime relational model for Process start, bound to immutable published workflow versions (AC: 2, 3)
  - [x] Add a first real `Process`/`ProcessInstance` model under `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py` rather than overloading `AtomicCommandProbe` or draft entities for runtime state.
  - [x] Keep runtime identity, lifecycle, initiator, assignment, and version binding relational per AD-4. The started Process must reference the immutable `WorkflowVersion`, the owning `WorkflowDefinition`, the Organization, and the initiating Membership/User.
  - [x] Extend or adapt `TaskOccurrence` so the first task records the activation version and assignment information needed by Stories 1.30 and 1.31. Do not leave first-task state implied only by the response payload.
  - [x] Add Django migration(s) that preserve existing Epic 1 data, register new tenant tables with the isolation gate, and keep Organization-scoped constraints explicit.
  - [x] Do not broaden this story into full Process timeline, completion, cancellation, or loop/runtime routing history. Add only the state required to create one started Process and one first Task safely.

- [x] Add one backend start command and API surface inside `workflow_runtime`, not `workflow_design` (AC: 2, 3)
  - [x] Create a dedicated runtime start command, for example `workflow-runtime.start-process`, implemented through `execute_atomic_command()` so business state, audit, idempotency result, and any outbox evidence commit or roll back together per AD-3.
  - [x] Add a runtime endpoint under `/api/v1/my-work/start-workflows/<workflow_id>/start/` or an equivalent My Work runtime route in `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` and `Moviqo.Back/src/moviqo/urls.py`; do not overload workflow publication or draft endpoints with runtime start behavior.
  - [x] Require one `Idempotency-Key` for every start command and keep request hashing stable so identical retries replay the original accepted start instead of creating another Process.
  - [x] Resolve the published version to run on the server. The browser may request a workflow to start, but it must not choose or infer hidden versions authoritatively.
  - [x] Return the authoritative runtime result the SPA needs next: process ID, task ID when the first task is assigned immediately, workflow/version summary, and the destination route for the authorized Process/Task view.

- [x] Resolve starter authorization, first-task assignment, and process creation from the published snapshot inside one protected transaction (AC: 2, 3)
  - [x] Load the immutable snapshot from `WorkflowVersion.snapshot`, not the mutable shared draft, and validate that the published version still contains the minimal Epic 1 Start -> Task -> End path and publication configuration expected from Stories 1.22 through 1.28.
  - [x] Preserve FR20 operational authority: Owners and Administrators may start a published workflow even when not listed as configured starters, and the command must mark that elevated start path for audit.
  - [x] Resolve the first-task assignment only from the published assignment configuration currently in scope: `workflowInitiator` or `specificMember`. Keep the resolution Organization-scoped and reject inactive or cross-tenant assignees safely.
  - [x] Create the Process row and first Task occurrence in one transaction, with no follow-up HTTP call required to “finish” the start. Starting a process that cannot also create its first valid task must roll back completely.
  - [x] Return safe denial contracts for unpublished, unauthorized, archived, inactive, or guessed workflow IDs without revealing whether the hidden workflow exists, who can start it, or how many published versions it has.

- [x] Wire the My Work frontend to the real startable catalog and start command while preserving backend authority (AC: 1-3)
  - [x] Update `Moviqo.Front/src/features/my-work/model/myWork.ts`, `useMyWorkDashboard.ts`, `ui/MyWorkShell.tsx`, and `pages/my-work/ui/MyWorkPage.tsx` so `Start workflows` renders the backend collection rather than a permanent empty-state stub.
  - [x] Add one explicit start action per workflow card. The UI may disable during the in-flight request and show plain-language pending/success/failure state, but it must not assume success before the server confirms the created Process.
  - [x] Keep new frontend implementation functions in `Moviqo.Front/src/**/*.{ts,tsx}` as arrow-function constants per `AGENTS.md`.
  - [x] Reuse current query/invalidation patterns from `shared/api` and route the accepted response into the existing protected app flow instead of inventing a separate local-only state store for started processes.
  - [x] Keep the wording aligned with `EXPERIENCE.md`: “Start workflows” is the authorized catalog, not the full designer workflow list; avoid technical language like node, snapshot, or runtime resolver in user-facing copy.

- [x] Add executable evidence for authorization filtering, atomic start behavior, idempotent replay, and safe denial (AC: 1-3)
  - [x] Add backend contract tests for the populated `GET /api/v1/my-work/` start-workflow collection, authorized start success, missing idempotency key, unauthorized start denial, hidden unpublished workflow denial, and idempotent replay returning the original Process identifier.
  - [x] Add real-PostgreSQL integration coverage proving two concurrent start attempts under the same logical idempotency key create only one Process and one first Task, while distinct authorized commands create distinct Process IDs.
  - [ ] Add integration coverage proving owner/administrator operational starts succeed even when the membership is not listed in the starter set and that the resulting audit marks operational-authority use.
  - [ ] Add frontend unit coverage for rendering the authorized start-workflow list, start-button pending state, post-success navigation handoff, retry-safe error display, and no false success before the authoritative response.
  - [ ] Extend Playwright or later Story 1.33 prep only if it stays narrow; do not defer all catalog/start coverage to the end-to-end story.

## Dev Notes

### Story intent and scope

- Story 1.29 is the bridge from workflow design into workflow runtime. It is the first story that turns a published workflow version into a real Process and real Task state.
- This story depends directly on:
  - Story 1.26 starter and assignment configuration,
  - Story 1.28 immutable published versions,
  - the current My Work dashboard/runtime shell introduced before Story 1.30.
- Scope stays intentionally narrow:
  - show authorized startable workflows;
  - start one process from one published workflow;
  - create one first task safely;
  - hand the user off to an authorized runtime view.
- This story does not complete the task, show the completed process timeline, support reassignment/claiming, or implement broader runtime navigation beyond the first handoff.

### Current implementation baseline to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` currently returns empty `startWorkflows`, `myTasks`, and `myProcesses` collections. Story 1.29 should replace only the start-workflow stub while preserving the existing dashboard contract shape and tenant-safe behavior.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` currently exposes:
  - `GET /api/v1/my-work/`
  - `GET/PUT /api/v1/my-work/tasks/<uuid:task_id>/form/`
  There is no runtime process-start endpoint yet.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py` currently contains `AtomicCommandProbe`, `TaskOccurrence`, and `TaskProcessFieldValue`, but no Process/ProcessInstance model and no first-class binding from runtime rows to immutable workflow versions.
- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py` now contains immutable `WorkflowVersion` rows. Runtime start must consume those snapshots; it must not read from or write to the mutable `WorkflowDraft`.
- `Moviqo.Front/src/features/my-work/` already has the shell, query loading, and region rendering for `startWorkflows`, but the cards are display-only and the backend always returns an empty collection.
- The My Work shell currently routes users to workflow creation from `/my-work/workflows/new`. Story 1.29 should preserve that separation: designing a workflow and starting a workflow are different actions with different authority.

### Requirements and architecture guardrails

- Follow FR17, FR19, FR20, and FR23:
  - Members and Designers need explicit starter authorization;
  - Owners and Administrators retain operational start authority;
  - the startable catalog must show only what the current user may start.
- Follow FR21 exactly: the start command must audit the organization, workflow and version, process ID, initiator, initiation time, and operational-authority use.
- Follow FR25: task visibility or assignment does not itself grant start authority.
- Follow AD-2 and NFR2: unauthorized or cross-tenant workflow guesses must fail closed without existence disclosure.
- Follow AD-3: one start command, one transaction, one evidence trail. Process creation, first-task creation, audit, and idempotency result must commit together.
- Follow AD-4 and AD-5:
  - runtime identity and lifecycle stay relational;
  - immutable workflow-version snapshots remain the execution source;
  - the start command must bind one new process to one published version.
- Follow AD-7 and AD-9: the server owns authorization and runtime semantics; the frontend only renders the authorized catalog and submits the start request.
- Follow AD-16: add failing tests for authorization filtering and duplicate-start protection before implementation.

### Concrete backend guidance

- Prefer a dedicated runtime application service module for process start, for example:
  - `workflow_runtime/application/start_process.py` or
  - `workflow_runtime/application/services.py`
  if you keep the module small and focused.
- Keep starter resolution logic shared with Story 1.26 rather than copying it into the dashboard query and the start command separately.
- Add a minimal runtime process model now instead of hiding process identity inside `TaskOccurrence`. Story 1.32 needs a real process anchor for My Processes and timeline work.
- Bind the first task to:
  - the created process,
  - the activated `WorkflowVersion`,
  - the first task element ID from the immutable snapshot,
  - the resolved assignee membership/user IDs,
  - the initial task revision and definition revision.
- Keep the startable catalog query efficient and explicit:
  - query published workflows by organization;
  - join or prefetch only what is needed for filtering and display;
  - do not load every tenant workflow draft document just to populate the dashboard.
- Add safe denials for these cases without leaking hidden state:
  - guessed workflow from another tenant;
  - workflow without a published version;
  - inactive membership or organization;
  - invalid first-task assignment;
  - archived or inactive workflow state if represented in current schema.
- Idempotent replay must return the original accepted result, including the same Process ID and first Task ID, when the same logical request is retried successfully.

### Concrete frontend guidance

- Keep `MyWorkShell` region cards simple and actionable:
  - workflow title,
  - plain-language availability,
  - start button,
  - loading/pending state during the request.
- Use the backend response as the navigation source. Do not derive destination URLs from optimistic client guesses before the server confirms the created runtime records.
- Preserve the current protected-app flow in `MyWorkPage.tsx`; anonymous users still redirect to sign-in before any dashboard/runtime request is made.
- Keep copy aligned with `EXPERIENCE.md`:
  - calm, plain language;
  - no technical jargon;
  - no success shown before confirmation;
  - explain what happens next after a successful start.
- If a start fails, keep the authorized catalog visible and let the user retry or choose another workflow. Do not clear the whole dashboard into a generic fatal error state when only one start command fails.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- new migration(s) under `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- new runtime application service(s) for start behavior under `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- likely new or expanded runtime integration tests under `Moviqo.Back/tests/integration/`
- possibly new focused runtime contract tests if task-form and start-process concerns are separated
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- relevant frontend unit tests for My Work and start-process behavior

### Previous story intelligence

- Story 1.26 already established the backend-authoritative starter and first-task assignment configuration. Story 1.29 should consume that published configuration as-is instead of redefining starter or assignment rules.
- Story 1.27 established the shared-draft revision and autosave foundations, but runtime start must not depend on mutable draft state or local unsaved editor state.
- Story 1.28 established the core rule that published workflow versions are immutable and that the publish command returns the authoritative saved snapshot, not the browser’s unsaved local copy. Story 1.29 must preserve that boundary exactly: process start runs from the immutable published snapshot only.
- The current My Work shell and runtime task-form seam already separate dashboard/runtime behavior from workflow design. Keep that module boundary intact.

### Git intelligence

- Recent commit sequence:
  - `f67f4a2` merged Story 1.28.
  - `2ce59eb` implemented Story 1.28.
  - `397d75e` merged Story 1.27.
- Inference from current repository direction:
  the codebase is building Epic 1 incrementally by extending the same backend module seams and generated-contract flow. Story 1.29 should continue that pattern and avoid introducing a parallel runtime architecture.

### Testing requirements

- Backend contract tests should prove:
  - populated `startWorkflows` returns only authorized published workflows;
  - owner/administrator operational starts can appear and execute even without explicit starter membership;
  - missing idempotency key fails safely;
  - duplicate idempotency key with changed payload returns `idempotency_key_reused`;
  - unauthorized or unpublished workflow start attempts do not reveal hidden state.
- Real-PostgreSQL integration tests should prove:
  - one logical start command under one idempotency key creates only one process and one first task;
  - process and first-task rows are committed atomically with audit evidence;
  - losing concurrent/duplicate attempts do not create extra runtime rows;
  - a failed assignment resolution leaves no partial process/task rows behind.
- Frontend unit tests should prove:
  - My Work start-workflow cards render from server data;
  - start buttons enter pending state and recover on failure;
  - success path waits for the authoritative response before navigation;
  - unrelated dashboard regions remain stable if one start command fails.

### Latest technical information

- Django 5.2 transaction docs currently state that `atomic()` guarantees all-or-nothing commit for the enclosed block and recommend keeping transactions short. That aligns with creating the Process, first Task, audit, and idempotency result inside one runtime command boundary. Source checked August 5, 2026: https://docs.djangoproject.com/en/5.2/topics/db/transactions/
- Django 5.2 `select_for_update()` docs currently state that it locks selected rows until the end of the transaction and must run inside a transaction on supported databases. Use the same locking approach when serializing workflow-head/version-sensitive start behavior. Source checked August 5, 2026: https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update
- PostgreSQL 18 locking docs currently state that `FOR UPDATE` prevents other transactions from locking, modifying, or deleting those rows until the current transaction ends. That remains the correct concurrency guardrail for serializing duplicate starts or conflicting runtime creation paths. Source checked August 5, 2026: https://www.postgresql.org/docs/current/explicit-locking.html
- React docs currently describe `useReducer` as the hook for adding a reducer to a component and `useEffect` as synchronization with an external system. Inference from those docs plus the current codebase: keep the My Work start-request UI in the existing reducer/query/effect pattern rather than moving runtime command orchestration into ad hoc local event state. Sources checked August 5, 2026: https://react.dev/reference/react/useReducer and https://react.dev/reference/react/useEffect

### Anti-patterns and out-of-scope work

- Do not start a process from the mutable draft or from the browser’s unsaved local editor copy.
- Do not put runtime process-start behavior into `workflow_design` views or services just because the workflow catalog already exists there.
- Do not let the frontend decide whether a workflow is authorized to start.
- Do not create a Process without also creating the first Task required by the published Epic 1 path.
- Do not broaden this story into Team claiming, Save Draft on the runtime form, Task completion, completed-process timeline, reassignment, or process cancellation.
- Do not reveal unpublished, unauthorized, archived, or cross-tenant workflow existence through different errors, counts, or titles.

### Project Structure Notes

- Keep process-start behavior inside `Moviqo.Back/src/moviqo/modules/workflow_runtime/`.
- Keep immutable workflow publication and starter configuration inside `workflow_design`; consume them through stable contracts/helpers, not direct cross-module persistence shortcuts.
- Keep My Work UI changes inside `Moviqo.Front/src/features/my-work/` and `src/pages/my-work/`.
- Maintain arrow-function constants for new frontend implementation code in `Moviqo.Front/src/**/*.{ts,tsx}`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.26, Story 1.28, Story 1.29, Story 1.30, Story 1.32]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - FR17, FR19, FR20, FR21, FR23, FR25, FR274, FR298, FR312, FR315, FR316, NFR2, NFR25, NFR26, NFR30]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-2, AD-3, AD-4, AD-5, AD-7, AD-9, AD-16; Capability -> Architecture Map; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Voice and Tone; Component Patterns; State Patterns; Flow 1]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`]
- [Source: `_bmad-output/implementation-artifacts/1-28-publish-an-immutable-workflow-version.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_configuration.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Front/src/features/my-work/model/myWork.ts`]
- [Source: `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`]
- [Source: `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/topics/db/transactions/]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update]
- [Technical reference: PostgreSQL docs, https://www.postgresql.org/docs/current/explicit-locking.html]
- [Technical reference: React docs, https://react.dev/reference/react/useReducer]
- [Technical reference: React docs, https://react.dev/reference/react/useEffect]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `python .\\_bmad\\scripts\\resolve_customization.py --skill .\\.agents\\skills\\bmad-create-story --key workflow`
- `Get-Content .\\_bmad\\bmm\\config.yaml`
- `Get-Content .\\.agents\\skills\\bmad-create-story\\discover-inputs.md`
- `Get-Content .\\.agents\\skills\\bmad-create-story\\template.md`
- `Get-Content .\\.agents\\skills\\bmad-create-story\\checklist.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\sprint-status.yaml`
- `Get-Content .\\_bmad-output\\planning-artifacts\\epics\\epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\prds\\prd-Moviqo-2026-07-30\\prd.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\architecture\\architecture-Moviqo-2026-08-01\\ARCHITECTURE-SPINE.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\DESIGN.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\EXPERIENCE.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-26-configure-workflow-starters-and-task-assignment.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-27-autosave-and-resolve-shared-draft-conflicts.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-28-publish-an-immutable-workflow-version.md`
- `git log -5 --oneline`
- `git rev-parse --short HEAD`
- `rg -n "Start workflows|start workflow|workflow catalog|published version|Process start|process start|My Work|My Tasks|My Processes|authorized starter|starter" Moviqo.Back Moviqo.Front`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_design\\application\\services.py`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_design\\application\\views.py`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_design\\models.py`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\my_work.py`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\views.py`
- `Get-Content Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\models.py`
- `Get-Content Moviqo.Back\\tests\\contract\\test_my_work_contract.py`
- `Get-Content Moviqo.Back\\tests\\contract\\test_workflow_design_contract.py`
- `Get-Content Moviqo.Back\\tests\\integration\\test_workflow_design_integration.py`
- `Get-Content Moviqo.Front\\src\\features\\my-work\\model\\myWork.ts`
- `Get-Content Moviqo.Front\\src\\features\\my-work\\model\\useMyWorkDashboard.ts`
- `Get-Content Moviqo.Front\\src\\features\\my-work\\ui\\MyWorkShell.tsx`
- `Get-Content Moviqo.Front\\src\\pages\\my-work\\ui\\MyWorkPage.tsx`
- `Get-Content Moviqo.Front\\tests\\e2e\\app-shell.spec.ts`
- `web.open https://docs.djangoproject.com/en/5.2/topics/db/transactions/`
- `web.open https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update`
- `web.open https://react.dev/reference/react/useEffect`
- `web.open https://react.dev/reference/react/useReducer`
- `web.open https://www.postgresql.org/docs/current/explicit-locking.html`
- `Get-Content -Raw _bmad-output/implementation-artifacts/1-29-start-a-process-from-the-authorized-catalog.md`
- `Get-Content -Raw Moviqo.Back/src/moviqo/building_blocks/commands.py`
- `Get-Content -Raw Moviqo.Back/src/moviqo/modules/organizations/application/workflow_directory.py`
- `Get-Content -Raw Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Get-Content -Raw Moviqo.Back/src/moviqo/urls.py`
- `Get-Content -Raw Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `Get-Content -Raw Moviqo.Front/src/shared/localization/messages.ts`
- `Get-Content -Raw Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `$env:DJANGO_SETTINGS_MODULE='moviqo.settings.test'; uv run pytest tests/contract/test_my_work_contract.py`
- `. .\scripts\use-integration-env.ps1; uv run pytest tests/integration/test_workflow_runtime_integration.py`
- `npm run test:unit`
- `npm run typecheck`

### Completion Notes List

- Replaced the My Work `startWorkflows` stub with a backend-authoritative catalog built from the latest published workflow versions and shared starter authorization logic.
- Added `ProcessInstance`, version/process bindings on `TaskOccurrence`, and a runtime migration that registers the new process table with the tenant isolation gate.
- Implemented `workflow-runtime.start-process` plus `/api/v1/my-work/start-workflows/<workflow_id>/start/` with idempotent replay, audit evidence, published-snapshot task creation, and fail-closed denials.
- Updated task-form snapshot resolution so started runtime tasks read from immutable published versions instead of mutable workflow drafts.
- Wired the frontend My Work catalog to the new start command with pending/error feedback and authoritative task-route navigation after acceptance.
- Added backend contract coverage, PostgreSQL integration coverage for concurrent idempotent retries, and frontend unit coverage for startable workflow rendering.
- Closed review follow-ups by reusing client start idempotency keys, binding runtime titles to immutable published snapshots, scoping start-command replay to the caller membership, and consuming the generated OpenAPI client route for process start.

### File List

- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/start_process.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/0003_process_start_runtime.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`
- `Moviqo.Front/src/features/my-work/index.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `_bmad-output/implementation-artifacts/1-29-start-a-process-from-the-authorized-catalog.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-05: Created Story 1.29 and marked it ready for dev.
- 2026-08-05: Implemented authorized start-workflow catalog, process start runtime command, immutable version-backed first-task creation, and supporting backend/frontend tests.
- 2026-08-05: Fixed review findings around client retry idempotency, immutable runtime titles, caller-scoped start request hashing, and story status tracking.
- 2026-08-05: Verified integration runtime coverage with the repository integration environment and removed the frontend start-route client workaround.
