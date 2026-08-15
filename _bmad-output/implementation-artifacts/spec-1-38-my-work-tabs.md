---
title: 'Make Mi trabajo a task-first tabbed workspace'
type: 'feature'
created: '2026-08-13T19:25:00-05:00'
status: 'done'
review_loop_iteration: 1
baseline_commit: '9f3ad04d28f993234d00d0cd0ef63e2165aab446'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current Panel duplicates the globally available Start Process module as a summary card and makes users pass through an overview before reaching their assigned work. This weakens the distinction between work that needs attention and the separate action for starting a process.

**Approach:** Rename Panel to **Mi trabajo** / **My work**, make `/my-work` open **Mis tareas** / **My tasks** directly, and expose **Mis procesos** / **My processes** as the sibling route-backed tab. Keep Start Process only in the primary application navigation.

## Boundaries & Constraints

**Always:** Preserve `/my-work/tasks`, `/my-work/tasks/:taskId`, `/my-work/processes`, and `/my-work/processes/:processId` deep links; keep Tasks and Processes as dedicated route identities backed by TanStack Query; retain localized loading, empty, error, search, pagination, responsive, focus, and authorization behavior; use shared page, navigation, and control primitives; update Story 1.38 and its exact-revision visual evidence to match the approved navigation.

**Ask First:** Removing or renaming existing task/process deep links; removing Start Process from primary navigation; merging Start Process data or controls into Mi trabajo; changing backend read models or authorization.

**Never:** Restore a Dashboard summary-card layer, place Start Process inside the task/process tab set, duplicate server state, expose Process Data in navigation, or weaken keyboard/accessibility behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Default entry | User selects Mi trabajo or opens `/my-work` | Mi trabajo page opens with Mis tareas active and assigned-task content visible | Existing localized loading/error/retry behavior remains within Mis tareas |
| Process tab | User selects Mis procesos | Route changes to `/my-work/processes`; Mis procesos is active and process content is visible | Existing process empty/error/search/pagination behavior remains |
| Existing task link | User opens `/my-work/tasks` or a task breadcrumb | Mis tareas remains active without losing the task deep-link family | Invalid child identities keep existing safe route/error behavior |
| Start Process | User views Mi trabajo | No Start Process card or tab is present; primary navigation still links to `/processes/start` | Start Process failures remain isolated to its dedicated module |
| Narrow viewport | Operational page is 390 CSS pixels wide | Both tabs remain discoverable and operational content reflows without horizontal loss | Full authoring support is not implied |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/app/router/routes.tsx` — maps `/my-work` to the default work module while retaining deep links.
- `Moviqo.Front/src/app/router/navigation.ts` — owns the primary Mi trabajo label/current-page behavior and document title.
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` — composes the page heading, route-backed tabs, and selected work region.
- `Moviqo.Front/src/features/my-work/ui/MyWorkOverview.tsx` — obsolete summary-card layer to remove.
- `Moviqo.Front/src/shared/localization/messages.ts` — Spanish/English navigation and page copy.
- `Moviqo.Front/tests/e2e/my-work.spec.ts` — route, tab, responsive, and Start Process separation coverage.
- `Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts` — exact-revision desktop/mobile visual qualification and capture.
- `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md` — acceptance wording, evidence, and implementation record.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Front/src/app/router/routes.tsx`, `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` — make Tasks the `/my-work` default and keep route-backed Tasks/Processes tabs.
- [x] `Moviqo.Front/src/features/my-work/index.ts`, `Moviqo.Front/src/features/my-work/ui/MyWorkOverview.tsx` — remove the superseded summary-card component and export.
- [x] `Moviqo.Front/src/shared/localization/messages.ts` — rename Panel/Dashboard to Mi trabajo/My work and remove obsolete overview copy.
- [x] `Moviqo.Front/tests/unit/*`, `Moviqo.Front/tests/e2e/my-work.spec.ts` — replace summary-card expectations with tab/default-route and separation assertions.
- [x] `Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts` — capture the task-first desktop surface and retain mobile/runtime qualification.
- [x] `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md` — record the human-directed navigation correction and refreshed evidence.

- [x] `Moviqo.Front/src/shared/ui/feedback.tsx`, `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`, `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` — present unmistakable shared loading feedback and remove competing controls while work lists load or a process is being created.
- [x] `Moviqo.Front/tests/unit/shared-ui.test.cts`, `Moviqo.Front/tests/unit/my-work-shell.test.cts`, `Moviqo.Front/tests/e2e/my-work.spec.ts` — verify the prominent loader, initial interaction lock, live status, and delayed process-start behavior.

**Acceptance Criteria:**
- Given an authenticated user, when they enter Mi trabajo, then Mis tareas is the active tab and its content is immediately available without an intermediate overview.
- Given the Mi trabajo tabs, when Mis procesos is selected, then the canonical process-list route and equivalent accessible active state are shown.
- Given primary navigation and Mi trabajo, when both are inspected, then Start Process appears only as its separate primary module and not as a card or work tab.
- Given Spanish or English and supported operational widths, when the work routes render, then naming, focus, tab discovery, recovery states, and reflow remain localized and accessible.

## Spec Change Log

- **2026-08-14 — manual walkthrough feedback:** The Tasks and Processes loading state was visually too subtle and left search controls available, while Start Process exposed only a disabled button during a slow creation request. Preserved the existing localized shared `LoadingState` contract, strengthened its visual treatment, replaced initial region controls while loading, replaced all Start Process actions while creation is pending, and added a synchronous duplicate-start guard.

## Verification

**Commands:**
- `npm run typecheck` — expected: TypeScript succeeds.
- `npm run test:unit` — expected: routing, localization, architecture, and work-module tests pass.
- `npm run test:e2e -- --project=chromium-desktop tests/e2e/my-work.spec.ts` — expected: task-first tabs and separated Start Process journey pass.
- `npm run test:e2e:preview-qualification` — expected: bilingual desktop/mobile qualification passes with profile-specific skips only.
- `npm run build` — expected: generated-client drift, production build, and static scan succeed.
- `git diff --check` — expected: no whitespace errors.

**Manual checks:**
- [ ] Review the refreshed Spanish desktop Mi trabajo and mobile operational screenshots, confirm no redundant Start Process card, and approve the exact built revision during the post-change walkthrough.

**Review result (2026-08-14):** Automated recapture and pixel inspection passed on the patched worktree. Jortiz will perform the exact-built-revision walkthrough after the review changes; human acceptance remains pending.

## Suggested Review Order

**Mi trabajo navigation**

- Start here: Tasks and Processes are route-backed siblings under one work heading.
  [`MyWorkPage.tsx:86`](../../Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx#L86)

- The canonical entry opens Tasks while preserving every existing work deep link.
  [`routes.tsx:73`](../../Moviqo.Front/src/app/router/routes.tsx#L73)

- Primary navigation keeps Start Process separate and labels the workspace consistently.
  [`navigation.ts:39`](../../Moviqo.Front/src/app/router/navigation.ts#L39)

- Reviewed Spanish and English catalog copy replaces the former Panel/Dashboard terminology.
  [`messages.ts:618`](../../Moviqo.Front/src/shared/localization/messages.ts#L618)

**Runtime completion and timeline**

- Backend authority routes terminal processes to timelines and continuing work to Mi trabajo.
  [`complete_task.py:257`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py#L257)

- Completion feedback distinguishes process end from a next-task handoff without auto-navigation.
  [`TaskFormPanel.tsx:83`](../../Moviqo.Front/src/features/task-form/ui/TaskFormPanel.tsx#L83)

- Timeline presentation accepts backend event/status shapes while localizing safe fallback labels.
  [`ProcessDetailPage.tsx:28`](../../Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx#L28)

**Authoring interaction polish**

- Repeated Form additions remount one polite success announcement per accepted action.
  [`FormDesignerWorkspace.tsx:413`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx#L413)

- Workflow additions share one live region while retaining visible localized confirmation.
  [`WorkflowDraftEditor.tsx:192`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx#L192)

- Catalog failures remain recoverable instead of being presented as an empty catalog.
  [`WorkflowCatalogPage.tsx:11`](../../Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx#L11)

**Verification and evidence**

- Browser coverage proves direct Tasks entry, Process switching, and Start Process separation.
  [`my-work.spec.ts:39`](../../Moviqo.Front/tests/e2e/my-work.spec.ts#L39)

- Qualification captures the exact desktop and mobile Mi trabajo surfaces for approval.
  [`stakeholder-preview-qualification.spec.ts:171`](../../Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts#L171)

- Backend contract coverage protects both terminal and continuing completion destinations.
  [`test_task_form_contract.py:923`](../../Moviqo.Back/tests/contract/test_task_form_contract.py#L923)

- Story evidence records the broader bilingual, accessibility, build, and review results.
  [`1-38-polish-the-authenticated-stakeholder-journey.md:82`](1-38-polish-the-authenticated-stakeholder-journey.md#L82)

## Suggested Review Order

**Loading feedback**

- Start here: initial work regions replace interactions with one prominent shared status.
  [`MyWorkShell.tsx:252`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L252)

- Process creation replaces every competing action until the command settles.
  [`MyWorkShell.tsx:320`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L320)

- A synchronous guard prevents rapid clicks from issuing duplicate start commands.
  [`MyWorkPage.tsx:66`](../../Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx#L66)

- Keyed refreshes retain prior results, preserving search and pagination focus context.
  [`useMyWorkDashboard.ts:28`](../../Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts#L28)

- The shared status uses stronger tokenized visuals and reduced-motion-safe animation.
  [`feedback.tsx:113`](../../Moviqo.Front/src/shared/ui/feedback.tsx#L113)

**Verification**

- Unit coverage verifies all three localized loaders and removes initial competing controls.
  [`my-work-shell.test.cts:97`](../../Moviqo.Front/tests/unit/my-work-shell.test.cts#L97)

- Browser coverage holds the start response and observes the complete pending interaction.
  [`my-work.spec.ts:117`](../../Moviqo.Front/tests/e2e/my-work.spec.ts#L117)

- Shared UI coverage protects the loader's visual and accessible contract.
  [`shared-ui.test.cts:322`](../../Moviqo.Front/tests/unit/shared-ui.test.cts#L322)
