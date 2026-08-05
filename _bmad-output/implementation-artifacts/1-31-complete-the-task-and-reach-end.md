---
baseline_commit: 472aeb4
---

# Story 1.31: Complete the Task and Reach End

Status: done

## Story

As an assigned Member,
I want to complete the valid Task once,
so that the Process reaches End with consistent data and evidence.

## Acceptance Criteria

1. **Complete the open assigned Task and finish the first Process in one command:** Given an open assigned Task, valid Form value, current assignment/form revisions, and matching published execution version, when Complete Task is submitted, then the handler locks the required Workflow and Task state and atomically saves Process Data, completes the Task occurrence, records version, revision, action, audit, and idempotency, evaluates the sole route, and marks the Process `completed` at End. And no follow-up HTTP call is required to finish routing or close the Process. Traceability: FR205, FR208, FR210, FR275, FR282, AD-3, AD-5.
2. **Reject invalid, stale, unauthorized, or failed completion attempts without partial state:** Given invalid Form data, stale version or revision, lost assignment, cancelled or completed Task, or failed route evaluation, when completion is attempted, then the Task remains open in its prior valid state, no outgoing route or duplicate next Task is created, and the response returns a stable actionable code. And failure-injection coverage proves all-or-nothing behavior. Traceability: FR208, FR209, NFR26, NFR29, NFR30, AD-16.
3. **Serialize concurrent and replayed completion attempts:** Given concurrent or retried completion commands, when PostgreSQL executes them, then exactly one logical completion commits, identical retries return the accepted result, and stale competitors are rejected. And audit contains one task-completed event and one process-completed transition. Traceability: NFR25, NFR26, AD-3, AD-5.

## Tasks / Subtasks

- [x] Add one runtime completion command that owns validation, persistence, completion, and End routing (AC: 1-3)
  - [x] Create a dedicated runtime command, for example `workflow-runtime.complete-task`, under `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`, implemented through `execute_atomic_command()` so Task state, Process state, audit, and idempotency commit or roll back together.
  - [x] Reuse the existing task-form projection and validation seam from `task_form.py` instead of creating a parallel completion-only form interpreter.
  - [x] Lock the current `TaskOccurrence` row with `select_for_update(of=("self",))` and serialize the version-sensitive runtime decision path against the same execution state Story 1.29 and Story 1.30 already established.
  - [x] Keep the scope intentionally narrow to the current Epic 1 Start -> Task -> End path. Do not broaden this story into conditional branching UX, multiple downstream tasks, team claiming, cancellation, or reassignment.

- [x] Extend runtime persistence so completion records final Task and Process outcomes truthfully (AC: 1-3)
  - [x] Update `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py` so `TaskOccurrence` and `ProcessInstance` can represent completion cleanly, including final status and timestamps such as `completed_at` if needed by the contract and later Story 1.32 timeline work.
  - [x] Preserve the existing relational runtime anchors: `ProcessInstance` remains the process lifecycle source of truth, `TaskOccurrence` remains the task lifecycle source of truth, and `TaskProcessFieldValue` remains keyed by stable Process Field IDs.
  - [x] Mark the current task `completed`, prevent later mutation through the normal open-task read/save path, and mark the containing process `completed` only after the End route is resolved successfully.
  - [x] Do not create a downstream `TaskOccurrence` for this story’s sole End path. End is the only valid successor and completion must close the Process instead of creating extra runtime rows.

- [x] Add one backend-authoritative completion API surface and contract (AC: 1-3)
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` with a completion endpoint or action contract under `/api/v1/my-work/tasks/<uuid:task_id>/...` that requires `Idempotency-Key`.
  - [x] Return the authoritative post-completion result the SPA needs next: completed Task status, completed Process status or outcome summary, process/task/workflow identifiers, and the safe next route or handoff message.
  - [x] Reuse RFC 9457 Problem Details and stable application codes for invalid form data, stale revision, unavailable task, and idempotency key reuse.
  - [x] Regenerate `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` through the repository generation flow; do not hand-edit generated artifacts.

- [x] Reuse and tighten the existing runtime validation seam for completion, not just save-draft (AC: 1-2)
  - [x] Split shared validation/projection helpers in `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py` only as needed so save-draft and complete-task both read the same authoritative published task document and visible controls.
  - [x] Keep stale revision and definition drift fail-closed: if `workflow_version.source_draft_revision`, `definition_revision`, or `task.revision` no longer match the client submission, reject the whole completion before mutating values or status.
  - [x] Preserve Story 1.30 behavior for draft saves. Completing a task must build on the current open/save contract rather than breaking it.
  - [x] Treat completed, cancelled, reassigned, cross-tenant, and non-assignee requests as the same unavailable resource unless the caller is already authorized to receive a corrective stale or invalid response.

- [x] Implement the End-route evaluation for the minimal published snapshot (AC: 1-2)
  - [x] Read the immutable workflow snapshot from `WorkflowVersion.snapshot`, not the mutable draft.
  - [x] Verify the active task still belongs to the same published Start -> Task -> End graph and that the current task has exactly one valid route to an `end` element in the snapshot.
  - [x] Record the chosen route and completed end-state evidence in audit payloads so Story 1.32 can later render a truthful timeline without reconstructing hidden logic.
  - [x] If the route cannot be resolved or does not terminate in End, reject the completion atomically and leave the task open.

- [x] Wire the task-form frontend to a real completion action without moving authority into the browser (AC: 1-2)
  - [x] Extend `Moviqo.Front/src/features/task-form/model/taskForm.ts`, `ui/TaskFormPanel.tsx`, and `pages/task-form/ui/TaskFormPage.tsx` so the `Complete task` button becomes active only when the server contract allows it and submits one authoritative completion request.
  - [x] Keep new frontend implementation functions as arrow-function constants per `AGENTS.md`.
  - [x] Preserve the reducer-driven controlled-input model. Do not introduce a second remote-state stack, optimistic completion, or local-only route evaluation.
  - [x] After successful completion, show a clear confirmed state and route the user back to an authorized next surface, most likely `/my-work`, because detailed completed-process tracking is still deferred to Story 1.32.
  - [x] Keep copy aligned with `EXPERIENCE.md`: plain language, no implementation jargon, no routine confirmation prompt before completion, and no success shown before the server confirms the completed outcome.

- [x] Add executable evidence for successful completion, safe failure, and concurrency (AC: 1-3)
  - [x] Expand `Moviqo.Back/tests/contract/test_task_form_contract.py` to cover successful completion, closed-task denial after completion, stale revision rejection, invalid completion validation, and idempotent replay returning the accepted completed result.
  - [x] Expand `Moviqo.Back/tests/contract/test_my_work_contract.py` or add focused runtime contract coverage proving a completed task disappears from `myTasks` for the assignee and no duplicate runtime rows are created.
  - [x] Expand `Moviqo.Back/tests/integration/test_task_form_integration.py` and/or `test_workflow_runtime_integration.py` to prove transaction containment, one-winner concurrency, one task-completed audit, and one process-completed audit/transition under PostgreSQL.
  - [x] Add frontend unit coverage for completion button enablement, pending state, success handoff, stale/reload guidance, and failure paths that preserve typed local values.
  - [x] Extend Playwright only if the coverage remains narrow and deterministic; do not defer all completion verification to Story 1.33.

## Dev Notes

### Story intent and scope

- Story 1.31 closes the first real runtime loop created across Stories 1.29 and 1.30:
  - Story 1.29 creates one `ProcessInstance` and one first `TaskOccurrence` from an immutable published version.
  - Story 1.30 lets the direct assignee open that task and save progress without completing it.
  - Story 1.31 must complete that same task once and drive the process to End inside one authoritative backend command.
- Scope remains narrow on purpose:
  - one directly assigned task;
  - one short-text form value;
  - one Start -> Task -> End route;
  - no downstream task creation because End is terminal.
- This story does not implement:
  - completed-process list/detail/timeline UI (Story 1.32),
  - the full end-to-end preview automation (Story 1.33),
  - team task claiming or reassignment (Epic 5),
  - richer form/rule/calculation behavior from Epic 3 and Epic 4 beyond what is already required to complete the current minimal task safely.

### Story foundation from Epic 1, requirements inventory, and UX

- FR205 requires every completable task to expose one primary completion action that triggers final validation, persistence, completion, and routing. The current disabled `Complete task` affordance in the UI is the intended seam to activate.
- FR208 defines the completion order: validate structural input, persist valid data, complete and lock the task, then evaluate routing. Inference for the current Epic 1 slice: because only one short-text control exists and the path is Start -> Task -> End, the practical completion flow is “validate visible controls -> persist final value if needed -> complete current task -> resolve the single End route -> mark process completed.”
- FR209 and NFR29 require failed completion to leave the task open with no duplicate next task and no route advance.
- FR210 requires audit to record workflow/version, instance, task, completing member, completion time, persisted values or value changes according to policy, and the selected route.
- FR275 and FR282 require that:
  - a process becomes `completed` only when execution reaches End successfully;
  - a completed task is immutable and followed only by valid downstream occurrences, which in this story means no additional task because the successor is End.
- UX Flow 2 and Interaction Primitives in `EXPERIENCE.md` require:
  - no routine confirmation before completion;
  - entered values remain preserved on recoverable failure;
  - the task leaves the assignee’s attention list only after authoritative server confirmation.

### Previous story intelligence

- Story 1.24 already established the minimal runtime task-form read/save seam. Reuse it. Do not create a second completion-specific form document reader.
- Story 1.29 established the immutable execution boundary:
  - runtime tasks read from `WorkflowVersion.snapshot`;
  - `ProcessInstance` and `TaskOccurrence` are real relational runtime records;
  - the browser does not decide workflow version or routing.
- Story 1.30 established the open/save loop and several guardrails that still apply here:
  - open-task authorization is direct-assignee-only for Epic 1;
  - stale revision and definition drift must reject the whole write;
  - value persistence, status mutation, audit, and idempotency belong in one atomic command;
  - typed local form state must survive recoverable save failures.
- Current baseline to preserve:
  - `TaskOccurrence.status` moves from `assigned` to `in_progress` on successful save;
  - `OPEN_TASK_STATUSES` is currently `{"assigned", "in_progress"}`;
  - the task-form API currently returns `actions: { saveDraft: true, complete: false }`;
  - `My Tasks` lists only open assigned tasks and derives titles from the authoritative snapshot.

### Concrete existing-code seams to extend

- Backend runtime files already in the critical path:
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/start_process.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `task_form.py` already:
  - loads the authoritative published task document;
  - validates submitted visible controls;
  - writes `TaskProcessFieldValue` rows under stable field IDs;
  - increments `task.revision`;
  - records `workflow-runtime.task-draft-saved` audit.
  Story 1.31 should factor or reuse these helpers so completion does not fork into a separate inconsistent validator.
- `start_process.py` already proves the preferred runtime pattern:
  - one command via `execute_atomic_command()`;
  - immutable snapshot read;
  - runtime row creation;
  - transactional audit append.
  Story 1.31 should follow the same pattern for completion.
- `my_work.py` currently excludes non-open statuses from `My Tasks`. Once completion sets a terminal status, the task should disappear from that list naturally without frontend filtering tricks.
- Frontend runtime files already ready for extension:
  - `Moviqo.Front/src/features/task-form/model/taskForm.ts`
  - `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
  - `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
  They already use controlled inputs and a reducer. Keep that pattern.

### Architecture and business guardrails

- Follow AD-2: reads and writes remain Organization-scoped and membership-scoped. Another member or organization guessing a `taskId` must receive no existence signal.
- Follow AD-3: completion is one command, one transaction, one evidence trail. If final value persistence, task completion, process completion, route evidence, audit, or idempotency cannot all commit, none of them should persist.
- Follow AD-4: runtime lifecycle remains relational, while form/routing definition comes from schema-versioned JSON snapshots keyed by stable element and field IDs.
- Follow AD-5:
  - lock the same version-sensitive runtime state consistently;
  - reject stale task revision or definition revision;
  - execute against exactly one immutable published version.
- Follow AD-7 and AD-9: the server owns authorization, completion semantics, and routing. The frontend can render pending/error/success state, but it cannot infer that completion succeeded before the backend confirms it.
- Follow AD-16: add failing contract/integration tests before implementation, especially for transaction-failure containment and concurrent completion attempts.

### Backend implementation guidance

- Preferred command shape:
  - introduce `complete_task.py` or a similarly focused helper under `workflow_runtime/application/`;
  - keep save-draft and complete-task as separate commands with shared validation helpers.
- Completion should likely require these client inputs:
  - `expectedTaskRevision`;
  - the visible control payload;
  - one `Idempotency-Key`.
  Inference from current code: `definitionRevision` does not need to be client-submitted if the backend already validates it against the authoritative runtime task document, but the backend must still enforce it.
- Persist the final visible field values before task completion inside the same command if they changed since the last save. A valid “complete without a preceding save” path should still end with the accepted final value persisted exactly once.
- Suggested terminal statuses:
  - `TaskOccurrence.status = "completed"`
  - `ProcessInstance.status = "completed"`
  Preserve current open statuses for unfinished work and do not overload `in_progress` to mean completed.
- Record distinct audit events for clarity, for example:
  - `workflow-runtime.task-completed`
  - `workflow-runtime.process-completed`
  Include workflow/version/process/task identifiers, actor, completion time, route target, and persisted field IDs or value-change summary.
- Keep safe denials aligned with current patterns:
  - unavailable task -> `resource_not_found`
  - stale task revision or definition drift -> conflict with reload guidance
  - invalid control values -> `task_form_invalid`
  - idempotency key reuse with different request hash -> `idempotency_key_reused`
- Do not require or perform a second HTTP call to “finalize” the process after the completion command succeeds. The accepted completion response should already reflect the completed runtime state.

### Frontend and UX guidance

- Turn the existing disabled completion affordance into a real server action only when `document.actions.complete` is true.
- Reuse the current reducer model and input ownership:
  - inputs stay controlled;
  - completion pending/error state is explicit;
  - local text remains visible if completion fails recoverably.
- Keep patient-colleague language from `EXPERIENCE.md`. Recommended copy direction:
  - success: confirm the task is complete and the process reached its end;
  - stale conflict: ask the user to reload the latest task;
  - invalid values: keep field-level guidance attached to visible controls.
- Do not add a confirmation modal for routine task completion. `EXPERIENCE.md` explicitly says not to confirm routine saves or task completion.
- Because Story 1.32 owns completed-process tracking, the safest accepted handoff here is:
  - show authoritative success on the task page;
  - then return the user to `/my-work`, where the completed task no longer appears in `My Tasks`.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- new focused runtime completion service under `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- new migration(s) under `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/integration/test_task_form_integration.py`
- `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/task-form.test.cts`

### Testing requirements

- Backend contract tests should prove:
  - authorized completion of an open assigned task succeeds once and returns a completed result;
  - the completed task can no longer be read or saved through the open-task contract;
  - invalid completion preserves the prior stored value and open status;
  - stale revision and definition drift return stable conflict guidance;
  - identical completion retries replay the accepted completed result without duplicate side effects.
- Real-PostgreSQL integration tests should prove:
  - exactly one concurrent completion wins;
  - losing attempts do not partially commit value changes, task status, process status, or audit;
  - one accepted completion creates one task-completed audit and one process-completed audit;
  - a route-resolution or injected transaction failure leaves the task open and the process active.
- Frontend unit tests should prove:
  - the completion button reflects authoritative availability;
  - pending completion disables duplicate submission;
  - success appears only after the server response;
  - local field text survives recoverable failure;
  - stale or unavailable errors direct the user toward reload rather than showing false success.

### Git intelligence

- Recent commit titles show the current runtime direction:
  - `472aeb4` updated the OpenAPI schema around My Tasks runtime metadata.
  - `81d3079` refined runtime response fields for assigned-task context.
  - `1b7ce1f` implemented Story 1.30.
- Inference from that sequence: the repository is evolving the same runtime seams incrementally. Story 1.31 should continue extending the existing `workflow_runtime` contract instead of introducing a new completion architecture.

### Latest technical information

- Django 5.2 documentation checked on August 5, 2026 still states that `atomic()` guarantees commit-or-rollback behavior for the enclosed block and advises keeping transactions short. Completion should stay inside one short runtime command transaction. Source: https://docs.djangoproject.com/en/5.2/topics/db/transactions/
- Django 5.2 documentation checked on August 5, 2026 still states that `select_for_update()` locks selected rows until the transaction ends and raises `TransactionManagementError` if evaluated in autocommit mode on supported backends. That remains the correct guardrail for serializing concurrent completion attempts. Source: https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update
- PostgreSQL 18 documentation checked on August 5, 2026 still states that `FOR UPDATE` prevents selected rows from being locked, modified, or deleted by other transactions until the current transaction ends. That is the right row-level locking model for one-winner task completion. Source: https://www.postgresql.org/docs/current/explicit-locking.html
- React documentation checked on August 5, 2026 still states that controlled inputs use a `value` prop plus `onChange`, and `useReducer` remains the standard top-level hook for reducer-managed component state. Inference for this codebase: keep the task form controlled and reducer-driven during completion instead of switching to ad hoc mutable local state. Sources: https://react.dev/reference/react-dom/components/input and https://react.dev/reference/react/useReducer

### Anti-patterns and out-of-scope work

- Do not create a second task-form document reader, completion-only shadow validator, or browser-owned route decision.
- Do not create a duplicate downstream task or partial process-completed state when End routing fails.
- Do not read mutable workflow drafts for started runtime tasks that already bind to `workflow_version_id`.
- Do not reveal hidden task existence, assignment, or process state through differentiated unauthorized errors.
- Do not broaden this story into My Processes timeline/detail UX, team assignment behavior, reassignment, cancellation, or richer conditional routing UX.

### Project Structure Notes

- Keep runtime completion logic inside `Moviqo.Back/src/moviqo/modules/workflow_runtime/`.
- Keep task-form UI changes inside `Moviqo.Front/src/features/task-form/` and `src/pages/task-form/`.
- Keep generated API artifacts generated, not hand-authored.
- Maintain arrow-function constants for any new frontend implementation code and tests per `AGENTS.md`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.29, Story 1.30, Story 1.31, Story 1.32]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR205, FR206, FR207, FR208, FR209, FR210, FR275, FR279, FR280, FR282, FR302, FR303, NFR25, NFR26, NFR29, NFR30]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-2, AD-3, AD-4, AD-5, AD-7, AD-9, AD-16; Capability -> Architecture Map; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Voice and Tone; Component Patterns; State Patterns; Interaction Primitives; Flow 2]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`]
- [Source: `_bmad-output/implementation-artifacts/1-29-start-a-process-from-the-authorized-catalog.md`]
- [Source: `_bmad-output/implementation-artifacts/1-30-open-an-assigned-task-and-save-progress.md`]
- [Source: `Moviqo.Back/src/moviqo/building_blocks/commands.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/start_process.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_task_form_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_task_form_integration.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`]
- [Source: `Moviqo.Front/src/features/task-form/model/taskForm.ts`]
- [Source: `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`]
- [Source: `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `Moviqo.Front/tests/unit/task-form.test.cts`]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/topics/db/transactions/]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update]
- [Technical reference: PostgreSQL docs, https://www.postgresql.org/docs/current/explicit-locking.html]
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
- `Get-Content .\\_bmad-output\\planning-artifacts\\architecture\\architecture-Moviqo-2026-08-01\\ARCHITECTURE-SPINE.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\EXPERIENCE.md`
- `Get-Content .\\_bmad-output\\planning-artifacts\\ux-designs\\ux-Moviqo-2026-08-01\\DESIGN.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-20-provide-the-authenticated-my-work-shell.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-24-compose-and-run-the-minimal-task-form.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-29-start-a-process-from-the-authorized-catalog.md`
- `Get-Content .\\_bmad-output\\implementation-artifacts\\1-30-open-an-assigned-task-and-save-progress.md`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\building_blocks\\commands.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\my_work.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\start_process.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\task_form.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\application\\views.py`
- `Get-Content .\\Moviqo.Back\\src\\moviqo\\modules\\workflow_runtime\\models.py`
- `Get-Content .\\Moviqo.Back\\tests\\contract\\test_my_work_contract.py`
- `Get-Content .\\Moviqo.Back\\tests\\contract\\test_task_form_contract.py`
- `Get-Content .\\Moviqo.Back\\tests\\integration\\test_task_form_integration.py`
- `Get-Content .\\Moviqo.Back\\tests\\integration\\test_workflow_runtime_integration.py`
- `Get-Content .\\Moviqo.Front\\src\\features\\task-form\\model\\taskForm.ts`
- `Get-Content .\\Moviqo.Front\\src\\features\\task-form\\ui\\TaskFormPanel.tsx`
- `Get-Content .\\Moviqo.Front\\src\\pages\\task-form\\ui\\TaskFormPage.tsx`
- `Get-Content .\\Moviqo.Front\\src\\shared\\localization\\messages.ts`
- `Get-Content .\\Moviqo.Front\\tests\\unit\\task-form.test.cts`
- `git log --oneline -5`
- `web.open https://docs.djangoproject.com/en/5.2/topics/db/transactions/`
- `web.open https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update`
- `web.open https://www.postgresql.org/docs/current/explicit-locking.html`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://react.dev/reference/react/useReducer`

### Completion Notes List

- Created the Story 1.31 implementation guide with concrete backend, frontend, runtime, UX, and test guardrails tied to the current `workflow_runtime` seams.
- Carried forward prior-story learnings from Stories 1.24, 1.29, and 1.30 so the dev agent can extend the current runtime architecture instead of inventing a parallel completion flow.
- Resolved the skill customization workflow, found no additional activation steps, and produced the story in the default implementation-artifacts location.
- Implemented `workflow-runtime.complete-task` with shared task-form validation, End-route resolution, idempotent replay, and one-command audit evidence for task and process completion.
- Added runtime completion timestamps, a dedicated `/api/v1/my-work/tasks/<uuid:task_id>/complete/` API contract, and regenerated `docs/api/openapi-v1.json` plus the frontend generated schema.
- Wired the task-form SPA to an authoritative completion action with pending, error, success, and redirect handoff states, and verified it with backend contract/integration tests and frontend unit/type checks.

### File List

- `_bmad-output/implementation-artifacts/1-31-complete-the-task-and-reach-end.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/migrations/0004_runtime_completion_timestamps.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/contract/test_task_form_contract.py`
- `Moviqo.Back/tests/integration/test_task_form_integration.py`
- `Moviqo.Front/src/features/task-form/index.ts`
- `Moviqo.Front/src/features/task-form/model/taskForm.ts`
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/task-form.test.cts`
- `docs/api/openapi-v1.json`
