---
baseline_commit: fcf4aa93063c49190854b9cbfc9243d170d974d3
---

# Story 1.35: Separate the Application Modules and Establish Authoring Navigation

Status: done

## Story

As an authenticated Moviqo user,
I want each major authoring and runtime responsibility in a clear, reload-safe module,
so that I can find my work and move between Workflow, Form, and Process activities without searching through one long page.

## Acceptance Criteria

1. **Adopt canonical routing and layouts:** Select and pin a React-19/TypeScript-6-compatible React Router version. Replace the pathname-comparison router with declarative nested public/authenticated layouts, route parameters, role-aware navigation, active state, localized not-found handling, and reload-safe deep links. Preserve landing language routes and all existing public authentication URLs.

2. **Separate runtime modules:** `/my-work` becomes a concise Dashboard/overview. `/my-work/tasks`, `/my-work/processes`, and `/processes/start` are independent modules with their own headings, loading/empty/error states, and canonical detail links. The Start Process catalog shows only authorized published Workflows and remains server-authoritative.

3. **Separate Workflow creation and design:** `/workflows` lists the authorized Workflow catalog, `/workflows/new` creates a Workflow, and successful creation navigates to `/workflows/:workflowId/design`. Opening or reloading the Designer loads the draft through the existing catalog/detail contracts; the creation page never appends the editor below its Form or becomes required in navigation history.

4. **Establish Form navigation:** `/forms` provides authorized Workflow and Task selectors. Selecting Design Form from a Task or completing both launcher selections navigates to `/workflows/:workflowId/tasks/:taskElementId/form`. Missing, stale, forbidden, or non-Task identities produce localized recoverable states without cross-tenant existence disclosure.

5. **Separate server and editor state:** Select and pin a compatible TanStack Query version. Use it as the only cache for catalogs/read models with keys that include Organization/resource identity and deliberate invalidation. Unsaved Workflow/Form documents, revisions, conflicts, explicit Save Draft state, selection, and interaction state remain in focused feature reducers/hooks; they are not copied into Query cache, global Context, Redux, or Zustand.

6. **Preserve authorization and accessible navigation:** Navigation visibility reflects membership capability for clarity but never substitutes for backend authorization. Page titles, landmarks, breadcrumbs, current-location state, focus after navigation, skip links, and supported narrow layouts remain keyboard/screen-reader usable and bilingual.

7. **Verify the module boundary:** Unit, component, and integration tests cover public/protected redirects, route matching, deep-link/reload state restoration, role navigation, loading/empty/error states, Workflow creation redirect, Workflow-to-Form navigation, Form launcher selection, and separate runtime modules. Manual acceptance verifies that a user can discover and move between each module, reload canonical URLs, and return without losing authorized context.

Traceability: AD-7, AD-9, AD-16, UX-DR14, UX-DR20, UX-DR21, NFR16, NFR30.

## Tasks / Subtasks

- [x] Pin and install the routing/query dependencies after focused compatibility checks (AC: 1, 5)
  - [x] Record the selected React Router and TanStack Query versions in `package.json`, the lockfile, and Architecture Stack.
  - [x] Add Router and Query providers at the application boundary; keep Session and Language providers independent and narrowly typed.
  - [x] Configure Query defaults deliberately, including retry behavior for authorization/validation errors and cache clearing on sign-out/Organization change.

- [x] Replace the manual application router (AC: 1, 6)
  - [x] Define public, authentication, and protected layout routes with route-level error/not-found states.
  - [x] Replace full-page `window.location.assign` for same-origin application navigation with router navigation while preserving security-sensitive redirects and copied-link behavior.
  - [x] Preserve `/`, `/es`, `/en`, `/register`, `/verify-email`, `/sign-in`, `/password-recovery`, `/password-reset`, and `/design-system` behavior.

- [x] Build the authenticated shell and runtime route modules (AC: 2, 6)
  - [x] Create role-appropriate primary navigation for Dashboard, Tasks, Processes, Start Process, Workflows, and Forms.
  - [x] Extract the existing My Work regions into route-level pages while reusing current authorized API contracts.
  - [x] Keep Task Form and Process detail URLs canonical and compatible with existing server destinations.

- [x] Build the Workflow catalog/create/design navigation (AC: 3, 5)
  - [x] Add a typed Workflow catalog query over `GET /api/v1/workflow-design/workflows/`.
  - [x] Navigate creation acceptance to the new Workflow Designer route.
  - [x] Add a route-level draft loader/query seam over the existing Workflow draft detail endpoint and initialize the editor reducer from the accepted snapshot.

- [x] Build the Form launcher and canonical Task Form-design route shell (AC: 4)
  - [x] Select Workflow first, then expose Tasks from the authorized draft; avoid a cross-tenant global Task search.
  - [x] Provide stable Workflow/Task breadcrumbs and safe return destinations.
  - [x] Reserve the route-level Designer implementation for Story 1.37 while making the navigation contract testable now.

- [x] Verify behavior and architecture (AC: 7)
  - [x] Add route/component tests for deep-link, reload, role, redirect, focus, empty/error, and navigation behavior.
  - [x] Extend architecture tests to reject manual pathname growth, page deep imports, sibling-feature deep imports, and global editor Context.
  - [x] Run affected unit, component, architecture, type, generated-client, and build/static checks.
  - [x] Manually walk Dashboard, Tasks, Processes, Start Process, Workflow creation/design, Form launcher/design, copied deep links, reloads, and back/breadcrumb behavior with representative roles.

### Review Findings

- [x] [Review][Patch] Do not cache a Task completion response under the Task Form document query key [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:131]
- [x] [Review][Patch] Preserve dirty Task Form values when Reload Latest fails with retained cached data [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:135]
- [x] [Review][Patch] Keep retryable Workflow draft-save failures recoverable instead of deadlocking the editor [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:134]
- [x] [Review][Patch] Block same-origin Task Form navigation while correctable values are dirty [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:82]
- [x] [Review][Patch] Restore the requested protected deep link after successful sign-in [Moviqo.Front/src/app/router/RoutePages.tsx:61]
- [x] [Review][Patch] Expose every assigned Task and startable Workflow from the dedicated runtime modules [Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx:208]
- [x] [Review][Patch] Invalidate Organization read models after Task completion before redirecting [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:131]
- [x] [Review][Patch] Render unknown URLs inside the appropriate public or authenticated layout [Moviqo.Front/src/app/router/routes.tsx:88]
- [x] [Review][Patch] Give public-route failures a public recovery destination [Moviqo.Front/src/app/router/RoutePages.tsx:152]
- [x] [Review][Patch] Replace the internal Story 1.37 Form placeholder with product-facing localized guidance [Moviqo.Front/src/pages/forms/ui/FormPages.tsx:147]
- [x] [Review][Patch] Type Workflow catalog and draft reads through the generated API contract [Moviqo.Front/src/features/workflow-design/model/queries.ts:26]
- [x] [Review][Patch] Accept a newer Task Form query revision when the editor is clean [Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx:75]
- [x] [Review][Patch] Accept a newer Workflow query revision when the editor is clean [Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx:39]
- [x] [Review][Patch] Clear abandoned save-before-leaving intent when the user stays [Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx:97]
- [x] [Review][Patch] Add rendered redirect, Workflow-to-Form action, and authoring error-state coverage required by AC7 [Moviqo.Front/tests/unit/application-routing.test.cts:47]
- [x] [Review][Patch] Give dedicated runtime sections a valid accessible name [Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx:80]
- [x] [Review][Patch] Verify the selected Task still belongs to the selected Workflow before Form navigation [Moviqo.Front/src/pages/forms/ui/FormPages.tsx:72]
- [x] [Review][Patch] Validate and safely encode the Playwright local host configuration [Moviqo.Front/playwright.config.ts:4]
- [x] [Review][Defer] Localize pre-existing server-owned runtime labels and summaries [Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx:231] — deferred, pre-existing

## Dev Notes

- Existing backend contracts already provide Workflow catalog and draft detail/read; use them before proposing new endpoints.
- Recommended route map: `/my-work`, `/my-work/tasks`, `/my-work/processes`, `/processes/start`, `/workflows`, `/workflows/new`, `/workflows/:workflowId/design`, `/forms`, `/workflows/:workflowId/tasks/:taskElementId/form`.
- TanStack Query manages server state, not the mutable visual editor. Do not let automatic refetch overwrite a dirty draft; route hooks must define the handoff from accepted snapshot to reducer explicitly.
- Editor routes do not autosave. While dirty, same-origin navigation and browser unload must warn before abandonment and provide Save/Discard/Stay recovery. A successful **Save draft** updates the accepted Query snapshot deliberately; automatic refetch never implies that local work was saved.
- This story establishes page/module shells and navigation, not the React Flow canvas or Form canvas implementation.

## References

- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
- `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-9
- `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- https://reactrouter.com/start/declarative/routing
- https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state

## Dev Agent Record

### Debug Log References

- Branch: `story/1-35-separate-the-application-modules-and-establish-authoring-navigation`

### Implementation Plan

- Establish pinned Router and Query foundations with Organization-scoped server-state ownership.
- Replace pathname branching with nested public/authenticated routes and isolated runtime modules.
- Introduce canonical Workflow and Form authoring navigation while keeping dirty editor documents reducer-local.
- Validate architecture, localization, accessibility, deep links, responsive qualification, and production output.

### Completion Notes

- Pinned `react-router` 7.18.0 and `@tanstack/react-query` 5.101.4 after React 19 and TypeScript compatibility checks; recorded both in the Architecture Stack.
- Replaced the manual router with lazy declarative routes, authenticated/public layouts, route parameters, localized error handling, role navigation, breadcrumbs, skip-link/focus behavior, and reload-safe canonical URLs.
- Split Dashboard, Tasks, Processes, Start Process, Workflow catalog/create/design, Form launcher, and Form route shell into dedicated modules using the existing authorized API contracts.
- Made TanStack Query the sole server-state cache with Organization/resource query keys, bounded retries, deliberate invalidation, and session/Organization cache clearing; retained unsaved editor state and revision conflict handling in focused reducers.
- Preserved explicit Workflow draft saving and added Save/Discard/Stay navigation recovery so automatic refetch never overwrites or falsely saves dirty work.
- Verified representative desktop journeys across all modules, creation redirect, dirty navigation recovery, deep-link reload, role navigation, empty/error states, keyboard focus, and form launch. Existing narrow-profile qualification correctly presents localized desktop-authoring guidance while supported runtime/catalog shells remain usable at narrow width and 200% text.
- Validation: `npm test`, `npm run build`, 14/15 desktop Playwright scenarios plus the corrected focused Design System scenario (all 15 validated), and the authoring journey at the supported desktop profile. `git diff --check` is clean.

### File List

- `Moviqo.Front/package.json`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/playwright.config.ts`
- `Moviqo.Front/src/app/providers/AppProviders.tsx`
- `Moviqo.Front/src/app/router/index.ts`
- `Moviqo.Front/src/app/router/navigation.ts`
- `Moviqo.Front/src/app/router/RoutePages.tsx`
- `Moviqo.Front/src/app/router/routes.tsx`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/authentication/model/SessionProvider.tsx`
- `Moviqo.Front/src/features/authentication/model/sessionRouting.ts`
- `Moviqo.Front/src/features/my-work/index.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/navigation.ts`
- `Moviqo.Front/src/features/workflow-design/model/queries.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCreateForm.tsx`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/pages/forms/index.ts`
- `Moviqo.Front/src/pages/forms/ui/FormPages.tsx`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx`
- `Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx`
- `Moviqo.Front/src/pages/workflow-catalog/index.ts`
- `Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/pages/workflow-design/index.ts`
- `Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx`
- `Moviqo.Front/src/shared/api/index.ts`
- `Moviqo.Front/src/shared/api/query/queryClient.ts`
- `Moviqo.Front/src/shared/api/query/queryRegistry.ts` (removed)
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/ui/index.ts`
- `Moviqo.Front/src/shared/ui/layout.tsx`
- `Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/e2e/authoring-navigation.spec.ts`
- `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts`
- `Moviqo.Front/tests/e2e/my-work.spec.ts`
- `Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts`
- `Moviqo.Front/tests/unit/api-client-contract.test.cts`
- `Moviqo.Front/tests/unit/application-foundation.test.cts`
- `Moviqo.Front/tests/unit/application-routing.test.cts`
- `Moviqo.Front/tests/unit/authoring-navigation.test.cts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`

### Change Log

- 2026-08-11: Implemented canonical module routing, TanStack Query server-state ownership, runtime/authoring route separation, dirty-navigation recovery, and full Story 1.35 verification. Status moved to review.
