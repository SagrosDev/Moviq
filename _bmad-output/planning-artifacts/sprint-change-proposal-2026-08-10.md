# Sprint Change Proposal — Stakeholder-Ready Frontend and Separated Authoring Modules

Date: 2026-08-10
Status: Approved and applied
Decision authority: Product owner

## 1. Issue Summary

Story 1.33 proves the deployed synthetic-only journey functions, but the current presentation is not stakeholder-ready. Public/authentication Forms mix raw controls and inconsistent layouts, registration can report "Correct the marked values" without revealing or focusing the rejected field, and the authenticated application combines unrelated modules on long pages.

Direct application review exposed a more serious information-architecture failure: Workflow creation appends a 962-line custom editor below the creation Form; its guided action buttons appear hundreds of lines before the HTML path preview, so a reducer update can occur without any visible local feedback. Workflow graph authoring, assignment, Form configuration, validation, save, and publication compete on one surface. My Tasks, Start Process, and My Processes similarly behave as regions of one dashboard rather than canonical modules.

The backend already provides tenant-authorized Workflow catalog and draft-detail endpoints, so the correction does not require a parallel backend or persistence model. It requires route-level modules, clear navigation, deliberate client-state ownership, and dedicated visual editors.

The persistence review also found that the current Workflow Editor waits 800 ms after a semantic change and then saves automatically, while the backend save validator rejects ordinary intermediate authoring states such as a Workflow that temporarily contains only Start. This combination turns normal editing into repeated background validation errors and creates unnecessary revision/idempotency churn. The approved correction removes autosave and automatic retry from both designers, preserves explicit revision/conflict safeguards, and separates draft persistence from publication-readiness validation.

## 2. Impact Analysis

### Epic impact

Epic 1 remains valid and grows from 36 to 39 active stories:

| Story | Responsibility |
|---|---|
| 1.34 | Shared visual system, landing/onboarding redesign, and recoverable registration validation. |
| 1.35 | React Router/TanStack Query foundation and separate Dashboard, work, start, Workflow, and Form modules. |
| 1.36 | Dedicated Workflow Editor decomposition and React Flow canvas adapter over the existing reducer/document. |
| 1.37 | Dedicated typed Form Designer/runtime architecture with dnd-kit interaction, Short Text, and minimum structural layout controls. |
| 1.38 | Integrate and visually polish the authenticated stakeholder journey. |
| 1.39 | Present the exact polished build and capture stakeholder feedback. |

Future Epic 3 extends the field registry with rich Process Field types, calculations, validation rules, conditional Form behavior, and advanced layout behavior. Epic 4 extends the Workflow model with Conditional Routing, branching, loops, and complete version governance. Neither future epic is replaced or pulled wholesale into Epic 1.

### Artifact impact

- **PRD:** FR235 now requires explicit draft saving rather than autosave. FR194's minimum structural layout controls (Section, Heading, Instruction Text, Divider) move into the Epic 1 stakeholder slice; richer layout and conditional behavior remain in Epic 3.
- **Architecture AD-9:** Binds React Router to canonical layouts/routes, TanStack Query to server state, React Flow to Workflow canvas interaction, dnd-kit to Form Designer gestures, focused reducers to unsaved documents, and Context to stable application services only.
- **UX:** Separates authoring and runtime modules, adds Workflow/Form catalogs and canonical deep links, defines palette/canvas/properties workspaces, and requires immediate visible feedback for every editor action.
- **Repository rules:** Prevent manual pathname growth, global editor Context, competing Workflow/Form documents, drag-only operation, and general form-builder authority.
- **Epic/context/index/sprint:** Adds Story 1.35, moves the editor stories to 1.36-1.37, moves polish to 1.38 and walkthrough to 1.39, and records 39 active stories.

### Technical impact

- Replace the manual pathname-comparison router with React Router declarative/nested routes and protected layouts.
- Use TanStack Query for Workflow catalogs, draft reads, startable Workflows, Tasks, Processes, and deliberate cache invalidation. Do not use it as the mutable editor document.
- Keep unsaved Workflow/Form documents, revision tokens, conflicts, explicit-save commands, and transient canvas/selection behavior in focused route-level hooks/reducers.
- Remove timer-, event-, blur-, drag-, and navigation-triggered saves and all automatic save retries. **Save draft**/`Ctrl/Cmd+S` is the only draft-persistence trigger.
- Split draft-save validity from publication readiness: save incomplete but structurally coherent documents; reject malformed, dangling, unknown, unauthorized, or stale content; validate a saved revision explicitly; publish only that same unchanged validated revision.
- Preserve the existing draft-save endpoint and encode validation policy server-side. Do not add a second draft endpoint or a client flag that bypasses validation; publication-validation and publish load the authoritative saved revision instead of accepting unsaved candidate content as authoritative.
- Protect dirty navigation with **Save**, **Discard**, and **Stay** choices. Preserve the same immutable payload and idempotency key only for a user-requested retry of an unchanged failed command.
- Use the existing generated API client and current Workflow catalog/draft contracts; no second API client or backend service is introduced.
- Use installed `@xyflow/react` 12.11.2 through a typed Moviqo adapter.
- Select and pin React-19/TypeScript-6-compatible React Router, TanStack Query, and stable dnd-kit package versions in their implementing stories.
- Keep Form.io, SurveyJS Creator, JSON Forms, RJSF, React Hook Form, Formik, Redux, and Zustand out of the authoritative editor path unless a later evidence-backed architecture decision requires them.

## 3. Recommended Path

Use a **Direct Adjustment with moderate backlog reorganization**. A dedicated navigation/module story must precede the editor refactors because the Form Designer needs reload-safe Workflow/Task identity and the Workflow Editor must no longer depend on post-creation in-memory state.

No rollback is required. Stories 1.1-1.33 remain valid. This change does not add another deployed E2E suite; focused component/integration tests cover the new routing and editor interactions while Story 1.33 remains the deployed journey regression.

## 4. Detailed Change Proposals

### Story 1.34 — frontend system and registration recovery

**UNCHANGED:** Establish Tailwind tokens, shared UI primitives, human palette approval, public/onboarding redesign, reviewed bilingual copy, and actionable field/form error recovery.

### Story 1.35 — separate application modules and authoring navigation

**OLD:** Workflow creation, editing, Form configuration, My Tasks, Start Process, and My Processes could remain combined on long pages with a manual pathname router.

**NEW:** Adopt canonical route-level modules and protected layouts. Workflow creation navigates to `/workflows/:workflowId/design`; `/forms` selects an existing Workflow and Task before navigating to `/workflows/:workflowId/tasks/:taskElementId/form`; `/processes/start`, `/my-work/tasks`, and `/my-work/processes` are independent modules. React Router owns navigation and deep links; TanStack Query owns server catalogs/read models; editor reducers remain local and revision-aware.

Unsaved editor state is route-local. Navigation away from a dirty Workflow/Form asks the user to **Save**, **Discard**, or **Stay**; it never saves implicitly.

### Story 1.36 — dedicated Workflow Editor with React Flow

**OLD:** A long custom editor placed action buttons far above an HTML path preview and mixed graph, assignment, Form, validation, and publication controls.

**NEW:** Create a dedicated desktop Workflow workspace with element palette, React Flow canvas, accessible outline, selected-element properties, persistent save state, and Validate/Publish action bar. Start, Task, End, and sequence Transition operations support drag/connect gestures plus click/double-click and keyboard alternatives. Adding an element immediately reveals and selects it. A selected Task exposes a clear Design Form action to the canonical Form route.

React Flow remains an adapter: the Moviqo reducer/document is the sole semantic and persisted authority. Conditional Routing is architecturally extensible but not displayed or implemented until Epic 4.

Saving is explicit. **Save draft** and `Ctrl/Cmd+S` submit one immutable revision-aware snapshot and may persist an incomplete but structurally coherent Workflow. No edit, drag, blur, timer, route change, or failed response initiates a background save/retry. **Validate** evaluates publication readiness for the saved revision; **Publish** accepts only that same unchanged validated revision. Story 1.36 also splits the current backend save validator from publication validation so normal intermediate drafts no longer fail merely because Start, Task, End, or a complete path is still missing.

### Story 1.37 — dedicated schema-driven Form Designer

**OLD:** Form configuration was embedded in the Workflow Editor and limited to raw Short Text configuration. Drag/reorder support was optional and the Form had no canonical route.

**NEW:** Establish a dedicated Form Designer route and launcher with Workflow/Task context, Fields/Layout palette, constrained twelve-column canvas, properties panel, runtime-accurate preview, validation summary, and persistent save status. Adopt dnd-kit as the pointer/keyboard gesture adapter while retaining click/double-click Add and explicit Move controls.

Epic 1 implements Short Text plus Section, Heading, Instruction Text, and Divider through discriminated typed registry entries. Designer preview and operational Task Forms share runtime renderers. Rich fields, calculations, validation rules, and conditional behavior remain in Epic 3. General form-builder schemas are excluded.

The Form Designer uses the same explicit persistence contract: **Save draft**/`Ctrl/Cmd+S`, no background saves or retries, revision-aware conflict handling, and dirty-navigation protection. Validation remains distinct from saving an incomplete but coherent Form.

### Stories 1.38-1.39 — integration and review

The former authenticated polish story becomes Story 1.38 and consumes Stories 1.34-1.37. The walkthrough becomes Story 1.39 and requires visual approvals plus the existing exact-build Story 1.33 deployed regression.

## 5. Target Information Architecture

```text
AUTHORING

Workflow Catalog
    -> Create Workflow
    -> Workflow Designer
         -> Select Task
         -> Design Form
         -> Validate
         -> Publish

Form Designer Launcher
    -> Select Workflow
    -> Select Task
    -> Form Designer

RUNTIME

Dashboard
    -> Start a Process -> Published Workflow Catalog
    -> My Tasks -> Task Form
    -> My Processes -> Process Timeline
```

Canonical routes:

| Module | Route |
|---|---|
| Dashboard | `/my-work` |
| My Tasks | `/my-work/tasks` |
| My Processes | `/my-work/processes` |
| Start Process catalog | `/processes/start` |
| Workflow catalog | `/workflows` |
| Create Workflow | `/workflows/new` |
| Workflow Designer | `/workflows/:workflowId/design` |
| Form Designer launcher | `/forms` |
| Form Designer | `/workflows/:workflowId/tasks/:taskElementId/form` |
| Task Form | `/my-work/tasks/:taskId` |
| Process detail | `/my-work/processes/:processId` |

## 6. Delivery and Handoff

| Role | Responsibility |
|---|---|
| Product/UX | Approve Story 1.34 palette/components and Story 1.38 end-to-end screenshots. |
| Frontend | Implement route/query ownership, editor adapters, shared primitives, feature boundaries, and accessible interactions. |
| Backend | Split draft-save structural integrity from publication-readiness validation while preserving authorization, optimistic revisions, idempotency, atomicity, and stable errors; evolve the schema only where minimum structural Form items require it. |
| QA | Add focused component/integration evidence and rerun Story 1.33; do not create a new deployed E2E program. |
| Stakeholders | Review the exact Story 1.39 build and provide actionable feedback. |

Sequence:

1. Implement Story 1.34 and stop at the public Design System visual checkpoint.
2. Implement Story 1.35 module/routing/query foundation.
3. Implement Story 1.36 React Flow Workflow Designer without changing Epic 1 Workflow semantics.
4. Implement Story 1.37 Form registry/Designer/runtime parity with Short Text and minimum structural items.
5. Integrate and visually approve the authenticated path in Story 1.38.
6. Deploy the exact build, rerun Story 1.33, and conduct Story 1.39.

## 7. Success Criteria

- Creating a Workflow navigates to a dedicated Designer and survives reload/deep link.
- Every Workflow palette action produces immediate visible selection/reveal on the React Flow canvas.
- A Task provides a clear Design Form action, and `/forms` can select an existing Workflow and Task.
- Start Process, My Tasks, and My Processes are independent discoverable modules.
- React Flow never becomes a second Workflow business/persistence model.
- dnd-kit never becomes a second Form document/state model.
- Form Designer preview and runtime Task Form resolve the same typed definitions/renderers.
- Workflow/Form authoring remains keyboard-operable without drag-only dependencies.
- Workflow/Form edits never trigger a background save or automatic retry; only **Save draft**, `Ctrl/Cmd+S`, or the explicit validated publication action may persist.
- Incomplete but structurally coherent drafts save successfully, while malformed, dangling, unknown, unauthorized, and stale documents fail without erasing local work.
- Validation targets a saved revision, and publication is available only for that same unchanged validated revision.
- Leaving a dirty designer offers **Save**, **Discard**, or **Stay**.
- An unchanged failed save can be retried explicitly with the same immutable payload and idempotency key; changed content creates a new command.
- Failed Forms reveal the rejected control or provide an actionable Form-level explanation.
- No conditionals or rich data fields are presented as functional before their owning epics.
- No new deployed E2E program is introduced.

## Appendix A — Correct Course Checklist

- [x] Trigger documented with direct screenshot/application evidence.
- [x] Current editor, router, catalogs, draft contracts, and backlog inspected.
- [x] Epic 1 remains viable; no rollback or MVP reduction is needed.
- [x] Future impact: Epic 3 extends Forms and Epic 4 extends Workflows; neither is invalidated.
- [x] PRD impact: minimum structural layout controls move forward; rich/conditional behavior remains with Epic 3.
- [x] PRD persistence amendment: FR235 replaces autosave with explicit Save draft and separates draft persistence from publication readiness.
- [x] Architecture impact: React Router, TanStack Query, React Flow, dnd-kit, reducer, Context, and feature boundaries are explicit in AD-9.
- [x] UX impact: canonical modules and authoring-to-runtime navigation are specified.
- [x] Story impact: Stories 1.35-1.39 are independently implementable and testable.
- [x] Testing impact: focused component/integration evidence plus existing Story 1.33 regression; no new E2E program.
- [x] Product owner approved the correction on 2026-08-10.
- [x] Product owner approved the explicit-save persistence amendment on 2026-08-10.
- [x] Handoff: implement Story 1.34 first, followed by Stories 1.35-1.39.

## Appendix B — References

- React Router routing and nested layouts: https://reactrouter.com/start/declarative/routing
- React Flow custom nodes and interaction: https://reactflow.dev/learn/customization/custom-nodes and https://reactflow.dev/learn/concepts/adding-interactivity
- React Flow external palette drag/drop boundary: https://reactflow.dev/examples/interaction/drag-and-drop
- dnd-kit sortable/accessibility guidance: https://dndkit.com/react/hooks/use-sortable/ and https://docs.dndkit.com/guides/accessibility
- TanStack Query server/client-state boundary: https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state

## Appendix C — Workflow Execution Log

| Item | Result |
|---|---|
| Workflow | Correct Course |
| Issue addressed | Stakeholder presentation quality, invisible Workflow editor feedback, monolithic page structure, and missing dedicated Workflow/Form modules. |
| Scope decision | Add one module/routing story; renumber editor/polish/walkthrough stories; move minimum structural Form controls forward; retain conditionals/rich fields in later epics. |
| Artifacts modified | AGENTS, Architecture, UX, Epic 1/Epic 3/list/index/requirements inventory/context, sprint status, Stories 1.34-1.39, and this proposal. |
| Approval | Product owner approved option `a` on 2026-08-10. |
| Next action | Implement Story 1.34 and stop at its visual checkpoint before module/editor work. |

## Appendix D — Approved Persistence Amendment

Date: 2026-08-10
Decision: Remove Workflow/Form Designer autosave and automatic retry.

- Story 1.35 owns dirty-route protection and local editor-state boundaries.
- Story 1.36 removes the Workflow autosave scheduler, adds explicit Save Draft, splits backend draft-save integrity from publication readiness, and binds Validate/Publish to the matching saved revision.
- Story 1.37 applies the same explicit-save contract to the Form Designer.
- Story 1.34 is unaffected.
- No new epic or deployed E2E program is required; focused backend and frontend tests prove the changed persistence behavior.
