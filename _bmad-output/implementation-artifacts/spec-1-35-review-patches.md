---
title: 'Harden Story 1.35 routing and editor state'
type: 'bugfix'
created: '2026-08-11'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'fcf4aa93063c49190854b9cbfc9243d170d974d3'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.35 passes its current automated suite but contains reachable cache corruption, edit-loss, save-deadlock, deep-link, module-completeness, recovery, accessibility, and contract-typing defects recorded by the completed code review.

**Approach:** Correct every recorded patch finding through focused Router, TanStack Query, editor, runtime-contract, localization, accessibility, and test changes while preserving backend authority and the existing Story 1.35 architecture.

## Boundaries & Constraints

**Always:** Preserve canonical routes, Organization-scoped query keys, explicit editor saves, reducer-owned dirty documents, generated OpenAPI types, localized Moviqo copy, accessible shared primitives, safe cross-tenant errors, and frontend arrow-function declarations. Extend the existing My Work contract for pagination rather than introducing a competing catalog or cache.

**Ask First:** Any database migration, new dependency, replacement endpoint, change to authorization semantics, or modification to deployed infrastructure.

**Never:** Cache Task completion DTOs as Task Form documents; overwrite dirty editor state during refetch; autosave Workflow/Form documents; bypass generated contracts with unchecked DTO casts; expose internal story terminology; weaken backend authorization; modify the deferred pre-existing runtime-label localization item.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Protected deep link | Anonymous user opens a Task, Process, Workflow, or Form URL | Sign-in returns to the validated original pathname, search, and hash | Unsafe/external destinations fall back to `/my-work` |
| Workflow save failure | Dirty Workflow save receives retryable failure | Editor remains operable and offers a bounded retry path | Local draft and navigation blocker remain intact |
| Task navigation | Dirty Task Form uses header, breadcrumb, Back, or browser unload | User receives Save/Discard/Stay or native unload protection | Failed save never proceeds or drops values |
| Task completion | Completion succeeds and the Task URL is revisited | Completion result is not treated as a form document; My Work data refreshes | Completed form cache is removed before redirect |
| Reload latest | Refetch fails while stale cache exists | Local values remain unchanged | Error remains recoverable and stale data is not dispatched |
| Clean refetch | Newer accepted Task/Workflow revision arrives while clean | Reducer adopts the new accepted snapshot | Dirty state is never overwritten |
| Dedicated collections | More Tasks/Workflows exist than one server page | Canonical modules expose navigation to every authorized item | Invalid pages are normalized and safe empty/error states remain |
| Form launcher | Workflow changes or selected Task becomes stale | Open action remains disabled unless the Task belongs to the current draft | Canonical recoverable route remains available |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/app/router/` and `pages/sign-in/` -- nested layouts, not-found/error recovery, and protected return destinations.
- `Moviqo.Front/src/pages/task-form/` and `pages/workflow-design/` -- query-to-reducer handoff, dirty navigation, save/reload/completion state.
- `Moviqo.Front/src/features/workflow-design/` -- retry behavior, generated Workflow query contracts, and Form navigation identities.
- `Moviqo.Front/src/features/my-work/` and `pages/my-work/` -- independent runtime collection queries, pagination, and accessible region naming.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/` plus `docs/api/openapi-v1.json` -- existing My Work pagination contract extension.
- `Moviqo.Front/tests/` and `Moviqo.Back/tests/contract/` -- regression and acceptance coverage.

## Tasks & Acceptance

**Execution:**
- [x] Router/sign-in files -- preserve validated protected destinations and keep not-found/error states within the correct shell.
- [x] Task/Workflow editor pages and reducers -- fix retry, dirty-navigation, cache-shape, invalidation, reload, clean-refetch, and stale leave-intent paths.
- [x] My Work backend/frontend contracts -- page Tasks and startable Workflows without changing authorization or introducing a second endpoint.
- [x] Workflow/Form query and launcher files -- consume generated types, validate current selection, and replace internal placeholder copy.
- [x] Shared UI/configuration -- repair accessible region naming and safely validate local Playwright hosts.
- [x] Tests -- cover every matrix row plus rendered role/error/Workflow-to-Form navigation.

**Acceptance Criteria:**
- Given any recorded Story 1.35 review finding, when its triggering state occurs, then the user retains authorized context and correctable work without crashes, hidden records, deadlocks, stale read models, unsafe navigation, or internal copy.
- Given generated-client, architecture, unit, backend contract, type, build, and focused Playwright checks, when they run, then all pass and protect the corrected transitions.

## Spec Change Log

- 2026-08-11: Implemented all 18 approved Story 1.35 review patches and added focused backend, unit, and rendered browser coverage.
- 2026-08-11: Hardened retained-editor refetch errors, Task completion invalidation, Workflow identity changes, modified-click navigation, trailing-slash routing, immediate process-start handoff, optional publication defaults, and dirty-editor sign-out sequencing after fresh adversarial review. Deferred the pre-existing My Work materialization cost.

## Verification

**Commands:**
- `npm run test` in `Moviqo.Front` -- all architecture, generated-contract, and unit tests pass.
- `npm run build` in `Moviqo.Front` -- typecheck and production/static checks pass.
- `npm run test:e2e -- --project=chromium-desktop tests/e2e/authoring-navigation.spec.ts tests/e2e/app-shell.spec.ts` -- focused routing/editor journeys pass.
- `uv run pytest tests/contract/test_my_work_contract.py` in `Moviqo.Back` -- My Work pagination and authorization contract passes.
- `git diff --check` -- no whitespace errors.

**Results (2026-08-11):** Backend My Work contract 24 passed; API schema contract 3 passed; frontend typecheck, architecture, unit, Vite production build, and static scan passed. The focused Chromium suite passed 12 unaffected scenarios, exposed one stale Workflow identity regression, and passed that scenario after correction. `npm run test` reaches `check:api-client` and reports the intentional generated schema difference from `HEAD`; regeneration is deterministic and the remaining test/build subcommands passed independently.

## Suggested Review Order

**Application routing and recovery**

- Start with the canonical nested route map and module boundaries.
  [`routes.tsx:52`](../../Moviqo.Front/src/app/router/routes.tsx#L52)

- Review authenticated-shell redirects, protected returns, and blocker-aware sign-out.
  [`RoutePages.tsx:35`](../../Moviqo.Front/src/app/router/RoutePages.tsx#L35)

- Confirm normalized path matching preserves active navigation and titles.
  [`navigation.ts:12`](../../Moviqo.Front/src/app/router/navigation.ts#L12)

**Editor authority and recovery**

- Follow Task cache ownership, completion invalidation, refetch recovery, and dirty navigation.
  [`TaskFormPage.tsx:75`](../../Moviqo.Front/src/pages/task-form/ui/TaskFormPage.tsx#L75)

- Inspect Workflow identity resets, retained refetch errors, and save-before-leave handling.
  [`WorkflowDesignPage.tsx:24`](../../Moviqo.Front/src/pages/workflow-design/ui/WorkflowDesignPage.tsx#L24)

- Verify optional generated publication children normalize to valid defaults.
  [`queries.ts:48`](../../Moviqo.Front/src/features/workflow-design/model/queries.ts#L48)

**My Work completeness**

- Review server-authorized pagination at the existing dashboard boundary.
  [`my_work.py:68`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L68)

- Trace immediate process-start handoff and background cache invalidation.
  [`MyWorkPage.tsx:39`](../../Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx#L39)

- Confirm dedicated regions remain accessible, page-aware, and canonically linked.
  [`MyWorkShell.tsx:60`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L60)

**Interaction and evidence**

- Check the shared modified-click predicate used by application link consumers.
  [`layout.tsx:84`](../../Moviqo.Front/src/shared/ui/layout.tsx#L84)

- Exercise the canonical creation, blocker, Form launch, and deep-link journey.
  [`authoring-navigation.spec.ts:46`](../../Moviqo.Front/tests/e2e/authoring-navigation.spec.ts#L46)

- Validate pagination and tenant authorization at the backend contract boundary.
  [`test_my_work_contract.py:45`](../../Moviqo.Back/tests/contract/test_my_work_contract.py#L45)
