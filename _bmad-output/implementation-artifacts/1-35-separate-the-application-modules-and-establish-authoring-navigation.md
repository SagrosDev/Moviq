# Story 1.35: Separate the Application Modules and Establish Authoring Navigation

Status: ready-for-dev

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

- [ ] Pin and install the routing/query dependencies after focused compatibility checks (AC: 1, 5)
  - [ ] Record the selected React Router and TanStack Query versions in `package.json`, the lockfile, and Architecture Stack.
  - [ ] Add Router and Query providers at the application boundary; keep Session and Language providers independent and narrowly typed.
  - [ ] Configure Query defaults deliberately, including retry behavior for authorization/validation errors and cache clearing on sign-out/Organization change.

- [ ] Replace the manual application router (AC: 1, 6)
  - [ ] Define public, authentication, and protected layout routes with route-level error/not-found states.
  - [ ] Replace full-page `window.location.assign` for same-origin application navigation with router navigation while preserving security-sensitive redirects and copied-link behavior.
  - [ ] Preserve `/`, `/es`, `/en`, `/register`, `/verify-email`, `/sign-in`, `/password-recovery`, `/password-reset`, and `/design-system` behavior.

- [ ] Build the authenticated shell and runtime route modules (AC: 2, 6)
  - [ ] Create role-appropriate primary navigation for Dashboard, Tasks, Processes, Start Process, Workflows, and Forms.
  - [ ] Extract the existing My Work regions into route-level pages while reusing current authorized API contracts.
  - [ ] Keep Task Form and Process detail URLs canonical and compatible with existing server destinations.

- [ ] Build the Workflow catalog/create/design navigation (AC: 3, 5)
  - [ ] Add a typed Workflow catalog query over `GET /api/v1/workflow-design/workflows/`.
  - [ ] Navigate creation acceptance to the new Workflow Designer route.
  - [ ] Add a route-level draft loader/query seam over the existing Workflow draft detail endpoint and initialize the editor reducer from the accepted snapshot.

- [ ] Build the Form launcher and canonical Task Form-design route shell (AC: 4)
  - [ ] Select Workflow first, then expose Tasks from the authorized draft; avoid a cross-tenant global Task search.
  - [ ] Provide stable Workflow/Task breadcrumbs and safe return destinations.
  - [ ] Reserve the route-level Designer implementation for Story 1.37 while making the navigation contract testable now.

- [ ] Verify behavior and architecture (AC: 7)
  - [ ] Add route/component tests for deep-link, reload, role, redirect, focus, empty/error, and navigation behavior.
  - [ ] Extend architecture tests to reject manual pathname growth, page deep imports, sibling-feature deep imports, and global editor Context.
  - [ ] Run affected unit, component, architecture, type, generated-client, and build/static checks.
  - [ ] Manually walk Dashboard, Tasks, Processes, Start Process, Workflow creation/design, Form launcher/design, copied deep links, reloads, and back/breadcrumb behavior with representative roles.

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
