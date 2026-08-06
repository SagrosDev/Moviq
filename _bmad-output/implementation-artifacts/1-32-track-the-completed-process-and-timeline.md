---
baseline_commit: df5330d
---

# Story 1.32: Track the Completed Process and Timeline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Process participant,
I want to see the completed Process and my authorized timeline,
so that I can confirm what happened without viewing another user's private contribution.

## Acceptance Criteria

1. **Return authorized completed-process tracking rows for My Processes:** Given a user who started or completed the Process, when My Processes loads, then the server returns the Process identifier, Workflow/version, overall `completed` status, current/end position, dates, and the user's authorized contribution summary. And results remain searchable and paginated inside the Organization and participation boundary. Traceability: FR293, FR294, FR295, FR296, FR306, FR308, FR346, AD-2, AD-7.
2. **Render one safe Process Detail header and simplified timeline:** Given the first Start -> Task -> End Process, when Process Detail loads, then readable event rows show the authorized actor, time, state, task position, start, save/complete, and End evidence in the Organization timezone. And restricted Process Field values, technical topology, and another user's exclusive data never appear. Traceability: FR296, FR346, FR347, UX-DR11, AD-3, AD-4.
3. **Fail closed for unauthorized, guessed, or revoked Process access:** Given an unauthorized user, guessed Process identifier, or revoked participation, when Process Detail or its timeline is requested, then no header, timeline, value, event count, or existence signal is returned. And denial uses the same safe unavailable-resource contract already used by My Work and Task Form endpoints. Traceability: NFR2, NFR30, AD-2, AD-7.

## Tasks / Subtasks

- [ ] Extend backend-authoritative My Processes summaries from the current empty placeholder (AC: 1, 3)
  - [ ] Replace the `_empty_collection(MY_PROCESS_LIMIT)` placeholder in `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` with an authorized process-summary query built from `ProcessInstance`, `TaskOccurrence`, and transactional audit evidence rather than browser-derived state.
  - [ ] Keep the current collection contract shape `{ items, limit, hasMore }`; do not swap the frontend to DRF's default `count/next/previous/results` envelope unless a dedicated custom adapter is introduced for that exact shape.
  - [ ] Implement Organization-scoped, participation-scoped search and pagination for My Processes, with the default sort ordered by most recent activity first and an explicit closed/completed path that still satisfies FR294.
  - [ ] Derive involvement truthfully for this slice from relational runtime data and audit, using only authorized values such as `Initiator` and `Previous participant`; do not infer participation from guessed identifiers or expose another user's active/private task context.

- [ ] Add one safe Process Detail + timeline backend contract (AC: 1-3)
  - [ ] Extend `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` with a dedicated Process Detail endpoint under `/api/v1/my-work/processes/<uuid:process_id>/` or an equally explicit equivalent contract, and document it in OpenAPI.
  - [ ] Return a header projection with Process number/id, Workflow name, workflow version number, system status, current/end position, started date, completed date, last activity, and any allowed contribution summary needed by the SPA.
  - [ ] Return a simplified timeline projection sourced from `governance_transactional_audit_record` events already emitted by `workflow-runtime.process-started`, `workflow-runtime.task-draft-saved`, `workflow-runtime.task-completed`, and `workflow-runtime.process-completed`.
  - [ ] Normalize denied or unavailable Process Detail reads to the same safe `resource_not_found` behavior used by the existing task-form and My Work surfaces.

- [ ] Keep timeline evidence privacy-safe and schema-stable (AC: 2-3)
  - [ ] Treat audit rows as the canonical history source for the timeline, but project only authorized display fields such as actor display name, safe event label, task position label, and timestamp.
  - [ ] Reuse the completing member's own submitted value from Story 1.31 only where FR012/FR296 allow it; never expose another participant's exclusive Process Field value merely because it exists in the same Process.
  - [ ] Do not leak internal graph topology, hidden element IDs beyond what the UI explicitly needs, raw audit payloads, or event counts that reveal inaccessible work.
  - [ ] Preserve future compatibility for loops and richer runtime events by using stable event-kind mapping and presentation helpers instead of hardcoding only one HTML timeline string.

- [ ] Add the missing frontend route and query seam for My Processes detail tracking (AC: 1-3)
  - [ ] Extend `Moviqo.Front/src/app/ui/App.tsx` path matching to recognize a new Process Detail route such as `/my-work/processes/:processId`, following the same hand-rolled route matching pattern already used for task forms.
  - [ ] Extend `Moviqo.Front/src/features/my-work/model/myWork.ts` with typed summary/detail/timeline contracts and a dedicated read function for Process Detail without breaking current dashboard loading.
  - [ ] Update `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` so the My Processes region stops rendering placeholder cards and instead shows authorized Process summaries, a closed/completed discovery path, and a `View process` action.
  - [ ] Keep new frontend implementation functions as arrow-function constants per `AGENTS.md`.

- [ ] Build one accessible Process Detail page with authorized timeline presentation (AC: 2-3)
  - [ ] Add a new page surface under `Moviqo.Front/src/pages/` for Process Detail and keep it consistent with the current `TaskFormPage` / `MyWorkPage` shell pattern.
  - [ ] Reuse the existing timeline styling seam in `Moviqo.Front/src/app/styles.css` and the timeline guidance from `EXPERIENCE.md` / `DESIGN.md` instead of inventing a second visual pattern.
  - [ ] Add bilingual copy to `Moviqo.Front/src/shared/localization/messages.ts` for My Processes filters, empty states, Process Detail header labels, timeline event labels, and denied/error recovery states.
  - [ ] Keep language plain and patient-colleague: explain what happened, not implementation jargon; do not imply access to hidden contributions or technical workflow topology.

- [ ] Add executable evidence for list visibility, timeline correctness, and fail-closed access (AC: 1-3)
  - [ ] Extend `Moviqo.Back/tests/contract/test_my_work_contract.py` to cover completed-process summaries, search, pagination boundaries, detail header/timeline projection, and same-organization/cross-tenant denial cases.
  - [ ] Add real-PostgreSQL integration coverage in `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py` or a focused companion file proving completed-process tracking survives real transactions and reflects committed audit order rather than mutable in-memory assumptions.
  - [ ] Add frontend unit coverage for My Processes rendering, Process Detail loading/error states, closed/completed discovery, and the View Process action.
  - [ ] Regenerate any generated API artifacts that change, including `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts`; do not hand-edit generated output.

### Review Findings

- [x] [Review][Patch] My Processes UI does not implement the required search, pagination, or closed/completed discovery path [Moviqo.Front/src/features/my-work/model/myWork.ts:113]
- [x] [Review][Patch] Process and timeline dates render in the browser locale instead of the Organization timezone required by AC2 [Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx:40]
- [x] [Review][Patch] Contribution summary exposes the first stored field value without checking whether that field is the viewer's safe authorized contribution [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py:312]

## Dev Notes

### Story intent and scope

- Story 1.32 is the first consumer of the runtime completion evidence created in Story 1.31.
- The thin-slice goal is not a generic workflow-monitoring suite. It is:
  - one truthful My Processes list for authorized participants;
  - one safe Process Detail page for the first completed Start -> Task -> End flow;
  - one simplified timeline that proves what happened without exposing another participant's private contribution.
- Keep this story deliberately narrower than later Epic 6 operational tracking:
  - no all-processes administration view;
  - no Needs Attention operational inbox work;
  - no team-claim history or reassignment behavior from Epic 5;
  - no cancel flow, loop authoring UX, or cross-Workflow analytics.

### Story foundation from Epic 1, requirements inventory, and UX

- Epic 1 Story 1.32 requires completed-process tracking after Story 1.31 moves a Process to `completed`.
- FR293-FR296 define My Processes as a participant tracking surface, not a general work browser.
- FR306 and FR346 require the summary and detail header to show Process number/id, Workflow name, status, current step, dates, and the member's involvement.
- FR347 allows a simplified authorized timeline, but only with safe event rows such as Process start, Task save/complete summaries, waiting/completed state, and the member's own submissions.
- UX component guidance in `EXPERIENCE.md` and `DESIGN.md` already defines:
  - `My Processes` as a dashboard region;
  - `Timeline` rows that show actor, time, state, and task position;
  - plain-language, non-technical status copy;
  - no restricted-data preview inside timeline rows.

### Previous story intelligence

- Story 1.20 created the authenticated My Work shell and established the dashboard region structure. Extend it; do not fork a separate workspace shell for Process Detail.
- Story 1.29 created one `ProcessInstance` and one first `TaskOccurrence` bound to an immutable published version.
- Story 1.30 established the task-form read/save contract and the privacy rule that another member cannot discover a task or its Process Data by guessing identifiers.
- Story 1.31 added the runtime evidence this story should consume directly:
  - `TaskOccurrence.status = "completed"` and `ProcessInstance.status = "completed"`;
  - `completed_at` timestamps on task and process;
  - transactional audit rows for `workflow-runtime.task-completed` and `workflow-runtime.process-completed`;
  - the accepted completion response already routes users back to `/my-work` because completed-process tracking was deferred here.
- Preserve Story 1.31 behavior:
  - completed tasks remain hidden from the open-task contract;
  - timeline/detail must not require reopening a completed task form to reconstruct evidence;
  - Process tracking must come from runtime/audit state, not frontend-local assumptions.

### Concrete existing-code seams to extend

- Backend seams already in the critical path:
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py`
  - `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
  - `Moviqo.Back/src/moviqo/modules/governance/models.py`
- Current backend facts from the codebase:
  - `read_my_work_dashboard()` already fills `startWorkflows` and `myTasks`, but `myProcesses` is still an empty collection placeholder.
  - `TaskOccurrence` already carries `completed_at`; `ProcessInstance` already carries `completed_at` and `last_activity_at`.
  - transactional audit rows currently exist for process start, task draft save, task complete, and process complete, which is enough to seed the first timeline.
- Frontend seams already ready for extension:
  - `Moviqo.Front/src/app/ui/App.tsx`
  - `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
  - `Moviqo.Front/src/features/my-work/model/myWork.ts`
  - `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
  - `Moviqo.Front/src/shared/localization/messages.ts`
  - `Moviqo.Front/src/app/styles.css`
- Current frontend facts from the codebase:
  - route matching is manual string/regex matching in `App.tsx`; there is no process-detail route yet;
  - `MyWorkShell` already renders a My Processes region, but it only displays placeholder fields and no action link;
  - timeline CSS/design-system examples already exist and should be reused rather than replaced.

### Architecture and business guardrails

- Follow AD-2: every My Processes summary and Process Detail read stays Organization-scoped and participation-scoped. A guessed `processId` must reveal nothing.
- Follow AD-3: timeline evidence must reflect committed audit history, not partially committed or browser-invented state.
- Follow AD-4: lifecycle anchors remain relational (`ProcessInstance`, `TaskOccurrence`); timeline rendering may read JSON payloads from audit rows, but must not replace relational authorization with opaque document scanning.
- Follow AD-7: server-side authorization decides whether a member may see a Process summary, Process Detail header, or contribution snippet.
- Follow AD-9: keep remote state in the existing query layer. Do not push process-tracking truth into component-local caches or derived optimistic state.
- Follow AD-16: add contract and integration coverage before implementation, especially for fail-closed access and pagination/search behavior.

### Backend implementation guidance

- Preferred projection model:
  - My Processes summary rows should come from authorized `ProcessInstance` membership involvement, then decorate with safe workflow/version/title fields from the authoritative snapshot/runtime rows.
  - Process Detail should compose:
    - one header projection from `ProcessInstance`, `WorkflowDefinition`, `WorkflowVersion`, and possibly the final active/completed task row;
    - one timeline projection from filtered `TransactionalAuditRecord` rows ordered chronologically.
- Keep authorization strict:
  - allowed viewers in this Epic 1 slice are the initiator and members who actually participated through an authorized task occurrence;
  - do not broaden access to Designers by definition ownership alone;
  - do not broaden access to Owners/Administrators through operational authority here unless the contract explicitly supports it and tests prove it.
- Treat Process contributions carefully:
  - the participant may see their own saved/completed short-text contribution from the completed task;
  - another member's exclusive value must remain absent from summaries and timeline rows;
  - if value projection becomes ambiguous, prefer omitting the value and showing only the safe event summary.
- Pagination/search:
  - keep search and page parameters explicit and deterministic;
  - ensure ordering is stable under pagination, ideally using `-last_activity_at` plus a unique tiebreaker such as `id`;
  - avoid unbounded collection loads.
- Safe event mapping for the first slice should cover at least:
  - Process started
  - Task progress saved
  - Task completed
  - Process completed / End reached
  Inference: use stable internal event kinds and localized frontend labels rather than returning raw audit event names to the UI.

### Frontend and UX guidance

- My Processes should stop reading like a placeholder status dump. It should become a real participant-tracking list with:
  - Workflow name
  - safe Process reference
  - completed/system status
  - last activity or completion date
  - involvement label
  - `View process` action
- Add a minimal discovery path for closed/completed Processes that does not bury the first completed Epic 1 process. If FR294 is implemented with a toggle/filter, keep the copy plain and obvious.
- Process Detail should visually prioritize:
  - header summary first;
  - timeline second;
  - no raw JSON, internal IDs, or graph/debug terminology.
- Reuse the existing shell/header/language selector behavior from `MyWorkPage` and `TaskFormPage`.
- Keep new frontend code in arrow-function constant form.

### Git intelligence

- The latest relevant commits on August 5, 2026 show the runtime flow moving in sequence:
  - `67f6ff2` implemented Story 1.31 completion.
  - `76a0d38` adjusted schema fields used by the runtime frontend.
  - `df5330d` merged Story 1.31 review fixes.
- Inference: Story 1.32 should continue the existing `workflow_runtime` and `my-work` seams instead of introducing a new monitoring architecture or separate process-history subsystem.

### Latest technical information

- Django 5.2 documentation checked on August 5, 2026 still states that `Paginator` uses an object's `count()` when available before falling back to `len()`. For My Processes, keep the backend query paginated from a `QuerySet` so count and slicing stay database-backed. Source: https://docs.djangoproject.com/en/5.2/topics/pagination/
- Django 5.2 documentation checked on August 5, 2026 still states that `select_related()` avoids extra queries for foreign-key and one-to-one relationships by joining them in the same query, and warns against indiscriminate use with every relation. For process summaries, use targeted `select_related()` for workflow/process/version relations, but do not expect it to solve audit-row collection or many-row timeline projection by itself. Source: https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-related
- Django REST Framework documentation checked on August 5, 2026 still documents `PageNumberPagination` with the standard `count/next/previous/results` response shape. Because the current frontend expects `{ items, limit, hasMore }`, use a custom adapter or keep the existing custom collection envelope instead of silently switching response shapes. Source: https://www.django-rest-framework.org/api-guide/pagination/
- React documentation checked on August 5, 2026 still presents `useReducer` as the appropriate hook when state update logic should live in one reducer function outside the event handlers. Inference for this codebase: if My Processes detail/filter/pagination UI grows beyond simple local toggles, keep reducer-driven state patterns consistent with the current frontend architecture instead of ad hoc mutable component state. Source: https://react.dev/reference/react/useReducer

### Anti-patterns and out-of-scope work

- Do not expose raw transactional-audit payloads directly to the browser.
- Do not make Process Detail depend on opening or reusing the closed task-form endpoint.
- Do not reveal unauthorized event counts, hidden task titles, or another member's exclusive submission value.
- Do not replace the existing My Work shell with a second dashboard or a new global router framework.
- Do not broaden this story into admin all-process tracking, cancellation, team claiming, reassignment, notifications, or export/audit search work from later epics.

### Project Structure Notes

- Keep runtime tracking logic inside `Moviqo.Back/src/moviqo/modules/workflow_runtime/`.
- Keep audit-read shaping close to runtime query code; do not create cross-module table reads that violate AD-1.
- Keep Process Detail UI under `Moviqo.Front/src/pages/` and reusable My Processes/query code under `Moviqo.Front/src/features/my-work/`.
- Keep generated API artifacts generated, not hand-authored.
- No `project-context.md` file was discovered in the accessible workspace during story creation; rely on the planning artifacts, implementation artifacts, and current codebase as the authoritative context set for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.20, Story 1.29, Story 1.30, Story 1.31, Story 1.32]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR293, FR294, FR295, FR296, FR306, FR308, FR346, FR347, NFR2, NFR30]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-2, AD-3, AD-4, AD-7, AD-9, AD-16; Capability -> Architecture Map; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Component Patterns; State Patterns; Interaction Primitives]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Timeline; Layout & Spacing; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-20-provide-the-authenticated-my-work-shell.md`]
- [Source: `_bmad-output/implementation-artifacts/1-29-start-a-process-from-the-authorized-catalog.md`]
- [Source: `_bmad-output/implementation-artifacts/1-30-open-an-assigned-task-and-save-progress.md`]
- [Source: `_bmad-output/implementation-artifacts/1-31-complete-the-task-and-reach-end.md`]
- [Source: `Moviqo.Back/src/moviqo/building_blocks/commands.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/governance/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/governance/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Back/tests/contract/test_my_work_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_task_form_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/app/styles.css`]
- [Source: `Moviqo.Front/src/features/my-work/model/myWork.ts`]
- [Source: `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Source: `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `Moviqo.Front/tests/unit/task-form.test.cts`]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/topics/pagination/]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-related]
- [Technical reference: Django REST Framework docs, https://www.django-rest-framework.org/api-guide/pagination/]
- [Technical reference: React docs, https://react.dev/reference/react/useReducer]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `python .\_bmad\scripts\resolve_customization.py --skill .\.agents\skills\bmad-create-story --key workflow`
- `Get-Content .\_bmad\bmm\config.yaml`
- `Get-Content .\.agents\skills\bmad-create-story\discover-inputs.md`
- `Get-Content .\.agents\skills\bmad-create-story\template.md`
- `Get-Content .\.agents\skills\bmad-create-story\checklist.md`
- `Get-Content .\_bmad-output\implementation-artifacts\sprint-status.yaml`
- `Get-Content .\_bmad-output\planning-artifacts\epics\epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content .\_bmad-output\planning-artifacts\prds\prd-Moviqo-2026-07-30\prd.md`
- `Get-Content .\_bmad-output\planning-artifacts\architecture\architecture-Moviqo-2026-08-01\ARCHITECTURE-SPINE.md`
- `Get-Content .\_bmad-output\planning-artifacts\ux-designs\ux-Moviqo-2026-08-01\EXPERIENCE.md`
- `Get-Content .\_bmad-output\planning-artifacts\ux-designs\ux-Moviqo-2026-08-01\DESIGN.md`
- `Get-Content .\_bmad-output\implementation-artifacts\1-31-complete-the-task-and-reach-end.md`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `Get-Content .\Moviqo.Back\src\moviqo\building_blocks\commands.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\governance\application\__init__.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\governance\models.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\workflow_runtime\application\complete_task.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\workflow_runtime\application\my_work.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\workflow_runtime\application\views.py`
- `Get-Content .\Moviqo.Back\src\moviqo\modules\workflow_runtime\models.py`
- `Get-Content .\Moviqo.Back\tests\contract\test_my_work_contract.py`
- `Get-Content .\Moviqo.Back\tests\contract\test_task_form_contract.py`
- `Get-Content .\Moviqo.Back\tests\integration\test_workflow_runtime_integration.py`
- `Get-Content .\Moviqo.Front\src\app\ui\App.tsx`
- `Get-Content .\Moviqo.Front\src\app\styles.css`
- `Get-Content .\Moviqo.Front\src\features\my-work\model\myWork.ts`
- `Get-Content .\Moviqo.Front\src\features\my-work\ui\MyWorkShell.tsx`
- `Get-Content .\Moviqo.Front\src\pages\my-work\ui\MyWorkPage.tsx`
- `Get-Content .\Moviqo.Front\src\pages\task-form\ui\TaskFormPage.tsx`
- `Get-Content .\Moviqo.Front\src\shared\localization\messages.ts`
- `Get-Content .\Moviqo.Front\tests\unit\task-form.test.cts`
- `uv run pytest tests/contract/test_my_work_contract.py`
- `uv run pytest tests/integration/test_workflow_runtime_integration.py --ds=moviqo.settings.integration`
- `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
- `npm run test:unit`
- `npm run generate:api-client`
- `web.open https://docs.djangoproject.com/en/5.2/topics/pagination/`
- `web.open https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-related`
- `web.open https://www.django-rest-framework.org/api-guide/pagination/`
- `web.open https://react.dev/reference/react/useReducer`

### Completion Notes List

- Replaced the backend `myProcesses` placeholder with authorized completed-process summaries, deterministic search/page handling, and a safe Process Detail audit projection under `/api/v1/my-work/processes/<uuid:process_id>/`.
- Added contract coverage for completed-process summaries, pagination/search, authorized detail timeline rows, and fail-closed access, plus PostgreSQL integration coverage that reads the committed audit order through the runtime query layer.
- Updated the frontend My Processes region to show real summary cards with a `View process` action, added the `/my-work/processes/:processId` route, and built a Process Detail page that reuses the existing shell and timeline styling seam.
- Regenerated `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` from the implemented contract instead of hand-editing generated files.
- Validation completed for `uv run pytest tests/contract/test_my_work_contract.py`, `npm run test:unit`, `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`, and `npm run generate:api-client`.
- PostgreSQL integration execution remains blocked in this shell because `moviqo.settings.integration` requires `MOVIQO_SECRET_KEY`; the new integration test exists but could not be executed locally on August 5, 2026.

### File List

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_runtime_integration.py`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/my-work/index.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/process-detail/index.ts`
- `Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `_bmad-output/implementation-artifacts/1-32-track-the-completed-process-and-timeline.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/api/openapi-v1.json`
