---
title: 'Make My Work scalable, complete, and visually coherent'
type: 'feature'
created: '2026-08-14T16:40:00-05:00'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c89eaeb'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** My Tasks wastes desktop space with one large card per assignment, My Processes excludes active processes, the Task page repeats poorly organized identity text, and reduced-motion users see a frozen loading ring. Operational work therefore feels incomplete and difficult to scan at realistic volume.

**Approach:** Use compact desktop reports with equivalent mobile cards and clear pagination; include authorized active and completed processes; simplify Task identity and metadata; and keep loading visibly active through preference-appropriate motion.

## Boundaries & Constraints

**Always:** Keep TanStack Query and backend authority; authorize by exact Organization plus matching initiator or assignee membership/user; preserve mobile reflow, semantic tables/definition lists, localization, focus, safe process data, and the authored Task Form grid.

**Ask First:** Exposing Process Data or another person's submission; adding bulk actions, advanced filters, or a new search read model; changing assignment/routing; forcing spatial animation under reduced motion.

**Never:** Duplicate server state; authorize from role/team/start permission alone; link to another user's Task; show raw revisions, full UUIDs, or implementation terms; cause mobile page overflow; introduce page-specific loaders or raw controls.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Large inbox | Many open assignments | Tasks report shows Task, Workflow, Process, Status, Assigned, Action with search/pages | Distinguish empty search from empty inbox |
| Mixed processes | Viewer initiated or owns work in active/completed processes | Processes report includes both, ordered by latest activity, with safe step and authorized detail | Cross-tenant/outsider viewers receive neither summary nor detail |
| Active process | Open Task exists | Show active status/global Task label; initiator takes precedence | Missing Task uses a safe localized fallback |
| Narrow screen | Below desktop breakpoint | Reports become single-column `<dl>` cards with equivalent data/action | Long labels wrap without horizontal document loss |
| Task page | Assigned Task opens | Parent breadcrumb, Task H1, Workflow subtitle, Process and Status form one hierarchy | Revision remains internal; values and form layout are preserved |
| Motion preference | Normal or reduced motion | Ring rotates normally; reduced mode uses an active non-spatial pulse | One localized polite atomic status remains authoritative |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` — authorized query, projection, search, and pagination.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` — public serializers/descriptions.
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` — reports, cards, actions, pagination.
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts` — retained-data fetching state.
- `Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx`, `pages/task-form/ui/TaskFormPage.tsx` — Task hierarchy.
- `Moviqo.Front/src/shared/ui/feedback.tsx`, `src/app/styles.css` — loading feedback.
- `Moviqo.Front/src/shared/localization/messages.ts` — reviewed copy.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`, `views.py`, backend contract/integration tests — include active/completed processes, enforce tenant/member/user authorization, resolve safe steps/involvement, and return page/totalItems/totalPages metadata.
- [x] `docs/api/openapi-v1.json`, `Moviqo.Front/src/shared/api/generated/schema.d.ts` — regenerate the additive contract.
- [x] `MyWorkShell.tsx`, `useMyWorkDashboard.ts`, localization and My Work tests — render Tasks/Processes tables, mobile cards, paging, actions, and refresh status.
- [x] `TaskFormPage.tsx`, `TaskFormPanel.tsx`, localization and Task tests — remove redundant eyebrow/current crumb/revision and compose one hierarchy without changing the Form document.
- [x] `feedback.tsx`, `styles.css`, shared UI/browser tests — retain normal rotation and add an active reduced-motion opacity/color pulse.
- [x] Story 1.38 markdown/screenshots — refresh exact-revision evidence.

**Acceptance Criteria:**
- Given desktop or narrow layouts, when Tasks and Processes render, then equivalent data is scannable, searchable, paginated, keyboard accessible, and free of page overflow.
- Given an authorized active process, when its report row/detail opens, then safe status, current step, and timeline appear; unauthorized viewers learn nothing.
- Given an assigned Task, when opened, then the Task title is the only H1 and Workflow, Process, Status, breadcrumb, form, and actions have clear hierarchy.
- Given either motion preference, when loading persists, then visible feedback continues changing without spatial reduced-motion animation or duplicate announcements.

## Spec Change Log

## Design Notes

Keep report rendering domain-aware in `features/my-work`; use native tables, not ARIA grids. Desktop actions are secondary links; mobile cards use `<dl>/<dt>/<dd>`. Active detail may reuse the authorized timeline, but never links to another assignee's Task. Reduced-motion animation may change opacity/token color only, never transform, position, or scale.

## Verification

**Commands:**
- Backend Ruff and pytest — active/completed authorization, isolation, ordering, search, pagination, and detail pass.
- API generation, frontend typecheck/unit/architecture — deterministic contract and frontend suites pass.
- Chromium My Work/Task Form and preview qualification — reports, cards, active process, Task hierarchy, both motion modes, accessibility, and screenshots pass.
- Frontend build and `git diff --check` — production/static and whitespace gates pass.

**Manual checks:**
- Review desktop/mobile reports, active process visibility, Task hierarchy, and active normal/reduced-motion feedback.

## Suggested Review Order

**Authorized active processes**

- Start with the tenant/member/user boundary and mixed active/completed read model.
  [`my_work.py:265`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L265)

- Current participation outranks historical work without exposing another assignee's data.
  [`my_work.py:351`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L351)

- Process position derives safely from lifecycle status, audits, and authoritative Tasks.
  [`my_work.py:431`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L431)

- Bilingual semantic aliases make displayed participation and fallback positions searchable.
  [`my_work.py:492`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L492)

**Scannable work reports**

- Tasks use a semantic desktop table and equivalent narrow-screen definition cards.
  [`MyWorkShell.tsx:270`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L270)

- Processes expose active/completed status, safe participation, and uniquely named actions.
  [`MyWorkShell.tsx:452`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L452)

- Server page totals drive explicit, bounded report navigation.
  [`MyWorkShell.tsx:651`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L651)

- Retained query results announce refreshes while unsafe stale Start actions stay disabled.
  [`MyWorkShell.tsx:386`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L386)

**Task and loading hierarchy**

- Task identity is one H1 with concise Workflow, Process, and Status context.
  [`TaskFormPanel.tsx:41`](../../Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx#L41)

- Active Process detail now describes its lifecycle consistently instead of claiming completion.
  [`ProcessDetailPage.tsx:64`](../../Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx#L64)

- One shared loader rotates normally and pulses non-spatially under reduced motion.
  [`feedback.tsx:113`](../../Moviqo.Front/src/shared/ui/feedback.tsx#L113)

- Reduced-motion CSS overrides only opacity animation for the shared indicator.
  [`styles.css:188`](../../Moviqo.Front/src/app/styles.css#L188)

**Contracts and evidence**

- Additive collection metadata is declared in the public serializer contract.
  [`views.py:106`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py#L106)

- Contract tests cover active authorization, detail, mixed participation, and safe fallbacks.
  [`test_my_work_contract.py:778`](../../Moviqo.Back/tests/contract/test_my_work_contract.py#L778)

- Browser coverage exercises both report modes, active detail, mobile reflow, and accessibility.
  [`my-work.spec.ts:201`](../../Moviqo.Front/tests/e2e/my-work.spec.ts#L201)

- Preview qualification captures Tasks, Processes, and Task hierarchy across supported profiles.
  [`stakeholder-preview-qualification.spec.ts:171`](../../Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts#L171)
