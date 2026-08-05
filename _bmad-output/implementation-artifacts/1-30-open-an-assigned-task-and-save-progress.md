---
baseline_commit: ddd70b70697c2d59dee97bf817fe296eee4889e4
---

# Story 1.30: Open an Assigned Task and Save Progress

Status: done

## Story

As an assigned Member,
I want to open my active Task and save valid progress,
so that I can continue later without completing it.

## Acceptance Criteria

1. **Open only the authorized assigned Task form from My Tasks:** Given an active Task directly assigned to the signed-in Member, when My Tasks loads and the Member opens it, then the server returns only the authorized Task Form, current Process Field value, Task and Workflow names, status, and safe Process context. And another Member or Organization receives no existence signal or data. Traceability: FR279, FR280, FR302, FR303, AD-2, AD-7.
2. **Save valid draft progress once and show it when reopened:** Given a valid Short Text value and current Task/form revision, when Save draft is submitted, then the value and transactional audit commit while the Task remains open, the response confirms saved state, and reopening shows the saved value. And retrying the same command does not duplicate audit or value history. Traceability: FR204, NFR25, NFR26, UX-DR17.
3. **Reject stale, invalid, or unauthorized saves atomically:** Given invalid text, a stale form revision, revoked assignment, completed or cancelled Task, or lost permission, when Save draft is submitted, then the whole write is rejected, the prior valid value remains, and a stable localized error identifies only authorized corrective information. And a concurrency integration test proves no partial Process Data commit. Traceability: NFR29, NFR30, AD-5, AD-16.

## Tasks / Subtasks

- [x] Replace the My Tasks placeholder region with backend-authoritative assigned-task summaries and an open-task action (AC: 1)
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` so `myTasks` is no longer an empty collection and instead returns only directly assigned tasks for the active Membership in Epic 1 scope.
  - [x] Keep the query Organization-scoped, fail closed, and explicit: task ID, task title from the authoritative published snapshot, workflow name, task system status, activation timestamp, process identifier or safe process label, and one `Open task` action target.
  - [x] Preserve Story 1.20 shell semantics and Story 1.29 start-workflow behavior; do not broaden this story into the full Epic 6 inbox with team-available tasks, filters, sorting, pagination, or history.
  - [x] Keep FR302 and FR303 in view when shaping the projection so today's contract can evolve into the later full My Tasks table without a breaking redesign.

- [x] Tighten runtime read authorization around assigned tasks and return safe process context in the task-form projection (AC: 1, 3)
  - [x] Update `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py` so reads succeed only for the current direct assignee, the active Organization, and an open runtime task state.
  - [x] Add safe Process context to the response, such as Process ID or number and any minimal workflow/task naming needed by the page, without exposing unrelated participant data, private Process Data, or hidden timeline information.
  - [x] Treat revoked assignment, completed tasks, cancelled tasks, stale definition mismatch, and cross-tenant guesses as the same safe unavailable resource from the caller's perspective unless the caller is already authorized to receive a corrective conflict.
  - [x] Continue reading the authoritative form definition from `WorkflowVersion.snapshot` when `workflow_version_id` is present. Do not fall back to mutable drafts for started runtime tasks.

- [x] Make save-draft fail closed for runtime status, assignment, and revision transitions while preserving one transaction boundary (AC: 2, 3)
  - [x] Extend `save_task_form_draft()` in `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py` so it rejects saves when the task is no longer open for the caller, including reassigned, completed, cancelled, or otherwise invalid runtime status.
  - [x] Keep validation, value persistence, task status transition, audit append, and idempotency result inside the existing `execute_atomic_command()` boundary per AD-3.
  - [x] Preserve the current Epic 1 status seam: the task stays open, but a successful first save moves the task from `assigned` to `in_progress` and subsequent valid saves keep the same assignee and open task identity.
  - [x] Ensure identical retries under the same logical request replay the stored accepted result without duplicating `TaskProcessFieldValue` history or `workflow-runtime.task-draft-saved` audit rows.
  - [x] Reject stale revision or definition drift before mutating any persisted value, and keep the prior valid value intact on every rejected path.

- [x] Wire My Tasks and the Task Form page into one authorized open-and-resume flow without moving authority into the browser (AC: 1-3)
  - [x] Update `Moviqo.Front/src/features/my-work/model/myWork.ts`, `useMyWorkDashboard.ts`, `ui/MyWorkShell.tsx`, and `pages/my-work/ui/MyWorkPage.tsx` so My Tasks renders real assigned-work cards and links the Member to `/my-work/tasks/<taskId>`.
  - [x] Keep new frontend implementation functions as arrow-function constants per `AGENTS.md`.
  - [x] Update `Moviqo.Front/src/features/task-form/model/taskForm.ts`, `ui/TaskFormPanel.tsx`, and `pages/task-form/ui/TaskFormPage.tsx` so the page renders safe process/task context, shows authoritative save success or failure, and preserves typed local work until the server confirms the save.
  - [x] Use controlled inputs plus the existing reducer pattern; do not introduce optimistic completion, browser-only authorization rules, localStorage persistence, or a second remote-state stack.
  - [x] Keep copy aligned with `EXPERIENCE.md`: patient-colleague voice, plain verbs such as `Open task` and `Save draft`, no graph/runtime jargon, and no success shown before the server confirms it.

- [x] Add executable evidence for assigned-task listing, safe open behavior, idempotent save replay, and concurrency rejection (AC: 1-3)
  - [x] Expand `Moviqo.Back/tests/contract/test_my_work_contract.py` to cover populated `myTasks`, direct-assignee-only visibility, no existence leak for another tenant or another member, and safe task metadata in the My Work payload.
  - [x] Expand `Moviqo.Back/tests/contract/test_task_form_contract.py` to cover reading a started task from a published runtime snapshot, saving valid progress, stale revision rejection, revoked-assignment or closed-task denial, and idempotent replay without duplicate side effects.
  - [x] Expand `Moviqo.Back/tests/integration/test_task_form_integration.py` or add focused runtime integration coverage proving concurrent save attempts cannot partially commit value plus status plus audit, and that losing stale attempts leave the prior committed value unchanged.
  - [x] Add frontend unit coverage for My Tasks rendering, open-task navigation affordance, task-form save pending/error/success states, stale-save reload guidance, and preservation of local field text during recoverable failures.
  - [x] Extend Playwright coverage only if it stays narrow and deterministic; do not defer all assigned-task open/save behavior to Story 1.33.

## Dev Notes

### Story intent and scope

- Story 1.30 is the first complete assigned-work runtime loop after Story 1.29:
  - Story 1.29 creates one `ProcessInstance` and one directly assigned `TaskOccurrence`.
  - Story 1.30 makes that task visible in My Tasks, lets the assignee open it safely, and save progress without completion.
- Scope stays narrow on purpose:
  - direct assignment only;
  - open one assigned task;
  - save valid Short Text progress;
  - preserve the current value when the task is reopened.
- This story does not implement:
  - task completion and routing to End (Story 1.31),
  - completed-process timeline and My Processes detail (Story 1.32),
  - end-to-end regression journey (Story 1.33),
  - team-available or claimed-task inbox behavior (Epic 5 and Epic 6),
  - richer forms, rules, or conditional behavior (Epic 3).

### Story foundation from Epic 1 and PRD

- The epic requires the open experience to be driven from `My Tasks`, not from a hidden direct route. The user should see assigned work in the authenticated My Work area and open it from there.
- FR279 and FR280 define the lifecycle seam that must now become observable:
  - direct-assigned tasks begin as `Assigned`;
  - saving work changes the task to `In Progress`;
  - the current assignee is preserved.
- FR302 and FR303 mean the My Tasks projection chosen now must already support real task naming and search-ready metadata such as task name, workflow name, and process identity, even if full search/filter UX arrives later.
- UX-DR17 and Flow 2 in `EXPERIENCE.md` require failed save/completion paths to preserve entered work where safe, never show success before server confirmation, and communicate next action clearly.

### Previous story intelligence

- Story 1.24 already implemented the minimal runtime task-form read/save seam. Reuse it. Do not create a parallel runtime form service or a second save endpoint just because My Tasks is now real.
- Story 1.24 also established several hard-won guardrails that still apply here:
  - task-form reads must fail closed after definition drift;
  - missing or duplicate controls must be rejected with field-targeted feedback;
  - save transport failures must not strand the UI in a false `saving` state.
- Story 1.20 established the My Work shell shape and safe anonymous/revoked-session behavior. Preserve the existing region shells, localized state handling, and query invalidation patterns instead of inventing a separate assigned-work dashboard.
- Story 1.29 established that runtime tasks are created from immutable `WorkflowVersion.snapshot` rows and that the start command already routes to `/my-work/tasks/<taskId>`. Story 1.30 must consume that route and runtime data model rather than redesigning it.

### Current implementation baseline to preserve

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` currently returns real `startWorkflows` but still returns empty `myTasks` and `myProcesses`. Story 1.30 should replace only the `myTasks` stub.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py` already:
  - reads the authoritative task document from `workflow_version.snapshot` when available;
  - validates visible controls;
  - stores values by stable `field_id`;
  - increments `TaskOccurrence.revision`;
  - flips task status to `in_progress` on successful save;
  - records `workflow-runtime.task-draft-saved` audit within `execute_atomic_command()`.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py` now has the minimum relational runtime anchors needed for this story:
  - `ProcessInstance`
  - `TaskOccurrence`
  - `TaskProcessFieldValue`
  Story 1.30 should extend behavior around those models, not replace them with draft-derived pseudo-runtime records.
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` already renders all three My Work regions with loading/error/empty states and `startWorkflows` cards. It does not yet render any task cards.
- `Moviqo.Front/src/features/task-form/model/taskForm.ts` and `pages/task-form/ui/TaskFormPage.tsx` already implement the reducer-based runtime form page, network-failure normalization, and authoritative save flow. This story should extend that flow with authorized open/resume semantics and better page context, not replace it with a new form engine.

### Architecture and business guardrails

- Follow AD-2: all reads and writes remain Organization-scoped and membership-scoped. Another Membership guessing a `taskId` must not learn whether the task exists, who owns it, or what process it belongs to.
- Follow AD-3: save-draft remains one command and one transaction. Task value changes, task status mutation, idempotency result, and audit must commit or roll back together.
- Follow AD-4: workflow/task/process identity stays relational; runtime values stay keyed by stable Process Field IDs; form definitions continue to come from versioned JSON snapshots.
- Follow AD-5: stale task revision or definition drift rejects the whole save. Runtime saves must not read from mutable drafts for started tasks and must not partially advance runtime state.
- Follow AD-7 and AD-9: the server owns authorization and runtime semantics. The frontend may reflect save status and inline validation but may not infer hidden work, assume success, or reclassify a task locally.
- Follow AD-16: add failing contract/integration tests before implementation, especially around stale or concurrent saves and hidden-task denial.

### Concrete backend guidance

- Reuse `TaskOccurrence.status` as the source of truth for open-vs-closed task behavior. Do not add a browser-only notion of â€œeditableâ€.
- Introduce a focused My Tasks query inside `workflow_runtime`, likely adjacent to `read_my_work_dashboard()`, that:
  - filters `TaskOccurrence` by `organization_id`, `assignee_membership_id`, and `assignee_user_id`;
  - returns only Epic 1-relevant open statuses for this story;
  - joins only the workflow/version data needed to build safe display metadata.
- Prefer published-snapshot titles for task and workflow naming where runtime rows may outlive mutable workflow-head edits, consistent with Story 1.29â€™s snapshot-title fix.
- Extend `_task_form_response()` with the smallest safe process context the UI needs next, such as `processId` and possibly a plain process reference string. Do not expose timeline rows, other participants, or broader process history here.
- Preserve the current stable Problem Details codes where they already fit:
  - `task_form_invalid`
  - `task_form_revision_conflict`
  - `resource_not_found`
  Add new application codes only if the existing safe contract cannot express the corrective action cleanly.
- Closed, revoked, or reassigned task saves should fail before mutating `TaskProcessFieldValue` rows. A rejected save must leave the stored value, task revision, and task status exactly as they were.

### Concrete frontend guidance

- Keep `My Tasks` as the default active My Work region from Story 1.20 and begin rendering actual task cards there.
- Task cards should stay simple and plain-language:
  - task title,
  - workflow name,
  - current task status,
  - safe process reference,
  - one primary `Open task` action.
- Reuse the current protected routing and session handling. Anonymous or revoked users must still be redirected safely to sign-in with no protected task identifier in a return URL.
- On the task form page:
  - keep the existing controlled reducer model;
  - preserve typed local text during recoverable save failures;
  - show save success only after the server response arrives;
  - provide reload guidance on stale revision/definition drift rather than pretending the save succeeded.
- Continue using Spanish-first localization with English fallback in `Moviqo.Front/src/shared/localization/messages.ts`.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- possibly small supporting helpers under `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/integration/test_task_form_integration.py`
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `Moviqo.Front/tests/unit/task-form.test.cts`

### Testing requirements

- Backend contract tests should prove:
  - `GET /api/v1/my-work/` returns direct assigned tasks only for the active Membership;
  - another Membership in the same Organization cannot open or learn about a direct-assigned task it does not own;
  - a started task reopened after a valid save returns the saved value and updated status;
  - stale revision, invalid value, revoked assignment, and closed-task paths preserve the prior valid value and return safe Problem Details.
- Real-PostgreSQL integration tests should prove:
  - concurrent or replayed saves under the same logical request do not duplicate value history or audit evidence;
  - losing stale attempts do not partially commit `TaskProcessFieldValue`, task status, or task revision;
  - cross-tenant and cross-membership access still fail closed.
- Frontend unit tests should prove:
  - My Tasks cards render from server data and expose one `Open task` action;
  - the task form preserves local input on recoverable failures;
  - stale-save and load-error states route the user toward retry or reload without false success;
  - success state appears only after the authoritative server response.

### Latest technical information

- Django 5.2 documentation checked on August 5, 2026 still describes `atomic()` as the transaction boundary that guarantees commit-or-rollback behavior for the enclosed block. Keep save-draft logic inside one command transaction rather than scattering runtime mutations across separate handlers. Source: https://docs.djangoproject.com/en/5.2/topics/db/transactions/
- Django 5.2 documentation checked on August 5, 2026 still states that `select_for_update()` locks selected rows until the end of the transaction and raises a `TransactionManagementError` if evaluated in autocommit mode on supported databases. That remains the correct guardrail for serializing runtime task-save paths. Source: https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update
- React v19.2 documentation checked on August 5, 2026 still states that controlled text inputs require `value` plus an `onChange` handler that updates that value. Keep the task form as a controlled input surface. Source: https://react.dev/reference/react-dom/components/input
- React v19.2 documentation checked on August 5, 2026 still describes `useReducer` as the hook for adding a reducer to a component. Inference from that guidance plus the current codebase: continue the reducer-based task-form editor instead of moving save/open state into scattered component locals. Source: https://react.dev/reference/react/useReducer

### Anti-patterns and out-of-scope work

- Do not create a second runtime task-form endpoint or a duplicate browser-only task cache.
- Do not read live mutable workflow drafts for started tasks that already have `workflow_version_id`.
- Do not expose another userâ€™s task assignment, process existence, counts, or workflow titles through My Tasks or task-form error differences.
- Do not broaden this story into team claiming, reassignment UX, task completion, completed-process history, or full My Tasks filtering and sorting.
- Do not show save success before the server confirms it, and do not discard typed local work on recoverable network failures.

### Project Structure Notes

- Keep assigned-work list behavior in `Moviqo.Front/src/features/my-work/` and route composition in `src/pages/my-work/`.
- Keep task-form behavior in `Moviqo.Front/src/features/task-form/` and `src/pages/task-form/`; do not collapse it back into `MyWorkPage.tsx`.
- Keep runtime backend behavior inside `Moviqo.Back/src/moviqo/modules/workflow_runtime/`.
- Maintain arrow-function constants for new frontend implementation code and tests per `AGENTS.md`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.24, Story 1.29, Story 1.30, Story 1.31, Story 1.32]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - FR204, FR279, FR280, FR288, FR289, FR302, FR303, NFR25, NFR26, NFR29, NFR30]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR204, FR279, FR280, FR302, FR303, UX-DR15, UX-DR17, UX-DR24]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-2, AD-3, AD-4, AD-5, AD-7, AD-9, AD-16; Capability -> Architecture Map; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Voice and Tone; Component Patterns; State Patterns; Interaction Primitives; Flow 2]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-20-provide-the-authenticated-my-work-shell.md`]
- [Source: `_bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`]
- [Source: `_bmad-output/implementation-artifacts/1-29-start-a-process-from-the-authorized-catalog.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/start_process.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_task_form_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`]
- [Source: `Moviqo.Back/tests/integration/test_task_form_integration.py`]
- [Source: `Moviqo.Front/src/features/my-work/model/myWork.ts`]
- [Source: `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`]
- [Source: `Moviqo.Front/src/features/task-form/model/taskForm.ts`]
- [Source: `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Source: `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/topics/db/transactions/]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update]
- [Technical reference: React docs, https://react.dev/reference/react-dom/components/input]
- [Technical reference: React docs, https://react.dev/reference/react/useReducer]

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
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\EXPERIENCE.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\DESIGN.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-20-provide-the-authenticated-my-work-shell.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-24-compose-and-run-the-minimal-task-form.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-29-start-a-process-from-the-authorized-catalog.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\sprint-status.yaml`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\my_work.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\start_process.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\task_form.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\views.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\models.py`
- `Get-Content .\\Moviqo.Back\\tests\\contract\\test_my_work_contract.py`
- `Get-Content .\\Moviqo.Back\\tests\\contract\\test_task_form_contract.py`
- `Get-Content .\\Moviqo.Back\\tests\\integration\\test_workflow_runtime_integration.py`
- `Get-Content .\\Moviqo.Back\\tests\\integration\\test_task_form_integration.py`
- `Get-Content .\\Moviqo.Front\\src\\features\\my-work\\model\\myWork.ts`
- `Get-Content .\\Moviqo.Front\\src\\features\\my-work\\ui\\MyWorkShell.tsx`
- `Get-Content .\\Moviqo.Front\\src\\features\\task-form\\model\\taskForm.ts`
- `Get-Content .\\Moviqo.Front\\src\\features\\task-form\\ui\\TaskFormPanel.tsx`
- `Get-Content .\\Moviqo.Front\\src\\pages\\my-work\\ui\\MyWorkPage.tsx`
- `Get-Content .\\Moviqo.Front\\src\\pages\\task-form\\ui\\TaskFormPage.tsx`
- `Get-Content .\\Moviqo.Front\\tests\\unit\\task-form.test.cts`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `git rev-parse HEAD`
- `rg -n "FR279|FR280|FR302|FR303|My Tasks|Save draft|assigned Task" _bmad-output\\planning-artifacts`
- `web.open https://docs.djangoproject.com/en/5.2/topics/db/transactions/`
- `web.open https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://react.dev/reference/react/useReducer`

### Completion Notes List

- Created the Story 1.30 implementation guide with concrete backend, frontend, UX, and test guardrails tied to the existing runtime/task-form seams.
- Carried forward prior-story learnings from Stories 1.20, 1.24, and 1.29 so the dev agent reuses the current runtime architecture instead of inventing a parallel flow.
- Completed implementation, review remediation, and verification for the assigned-task open/save flow on August 5, 2026.
- Verified frontend unit tests with `npm run test:unit`.
- Verified frontend typing with `npm run typecheck`.
- Verified Playwright assigned-task coverage with `npx playwright test tests/e2e/my-work.spec.ts`.
- Verified backend contract coverage with `uv run pytest tests/contract/test_my_work_contract.py tests/contract/test_task_form_contract.py`.
- Verified PostgreSQL integration coverage with `. .\scripts\use-integration-env.ps1; uv run pytest tests/integration/test_task_form_integration.py`.
- Marked Story 1.30 as `done` in sprint tracking.

### File List

- `_bmad-output/implementation-artifacts/1-30-open-an-assigned-task-and-save-progress.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
