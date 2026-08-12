---
title: 'Clarify My Work states and add task search'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'dc40d77'
context:
  - '_bmad-output/implementation-artifacts/spec-unified-work-module-empty-guidance.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** My Work currently reuses a generic workspace-not-found message across Tasks, Processes, and Start Process, and retry actions do not explain what they refresh. First-time users can mistake genuine empty collections for application failures. Tasks also lack the search available in Processes.

**Approach:** Give each region direct no-content copy, treat collection-level `404` responses as no-content states, reserve “Actualizar” for other recoverable load failures, and add server-backed task search using the existing paginated My Work endpoint.

## Boundaries & Constraints

**Always:** Preserve the Tasks/Processes tab layout and independent Start Process module; use localized Spanish and English copy; display “no pending tasks,” “no related processes,” or “create a workflow” for empty collections and collection-level `404` responses; use concise refresh guidance for other recoverable failures; reset task pagination when a search is submitted; search only tasks already authorized for the active membership; preserve canonical URLs and existing pagination.

**Ask First:** Any authorization change, treating permission/session failures as empty data, adding a dependency, or changing the endpoint shape beyond an optional task-search query parameter.

**Never:** Show “no está/no están disponibles en este momento,” generic “workspace not found,” “authorized work,” “No pudimos consultar,” or “Intentar de nuevo” wording on these surfaces; treat permission/session failures as ordinary empty content; remove unrelated tests merely to reduce execution time.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Empty tasks | `200` with zero tasks and no search | “No tienes tareas pendientes” guidance | No alert or refresh button |
| Empty processes | `200` with zero processes and no search | “Aún no hay procesos relacionados contigo” guidance | No alert or refresh button |
| Empty start catalog | `200` with zero workflows | Author sees “Crea un flujo para iniciar”; member sees availability guidance | No alert or refresh button |
| Missing collection | My Work returns `404` | Active region uses the same no-content guidance as an empty collection | No alert or refresh control |
| Runtime failure | My Work returns a network or server failure | Active region asks the user to update the corresponding content | Recoverable failures offer “Actualizar”; permission/session failures retain safe handling |
| Task search | User searches by task, workflow, or process reference | Authorized matching tasks are returned from page one | No matches produce a search-specific empty state and clear/update recovery |
| Authoring empty | Workflow/Form catalog succeeds with zero items or returns collection-level `404` | Existing guided empty cards remain visible | No unavailable wording |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` -- accept and document `myTasksSearch`.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py` -- filter authorized task summaries before pagination.
- `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` -- generated query contract.
- `Moviqo.Front/src/features/my-work/model/myWork.ts`, `useMyWorkDashboard.ts`, and `shared/api/query/queryClient.ts` -- carry task search through request and cache identity.
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` and `features/my-work/ui/MyWorkShell.tsx` -- task search controls and contextual state rendering.
- `Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx`, `pages/forms/ui/FormPages.tsx`, and `shared/localization/messages.ts` -- neutral failure copy and Update actions.

## Tasks & Acceptance

**Execution:**
- [x] Backend My Work query and contract -- add tenant-scoped task search across task title, workflow name, and process reference before pagination.
- [x] Frontend query model/cache/UI -- add task-search draft, submit/reset behavior, and shared accessible controls.
- [x] Localized states -- replace generic resource-not-found, unavailable, and retry wording with contextual empty, no-match, and Update copy.
- [x] Focused verification -- update only directly affected contract/unit/E2E coverage, regenerate the API client, typecheck, and build once.

**Acceptance Criteria:**
- Given an empty owner, when My Work loads successfully, then Tasks and Processes describe their own empty state without an error alert or refresh action.
- Given a recoverable My Work failure, when a region is visible, then its copy names that region and the action says “Actualizar.”
- Given authorized tasks, when the user searches by task title, workflow name, or process reference, then matching tasks appear from page one and unrelated tasks do not.
- Given zero workflows, when Flows or Forms loads successfully, then guided creation content appears; a genuine request failure does not claim that the user has zero content.

## Spec Change Log

## Design Notes

The backend applies task search after authorization and authoritative summary resolution, matching the existing process-search pattern. Empty-search copy stays separate from the first-time empty message so users with existing tasks are not told they have none.

## Verification

**Commands:**
- `uv run pytest tests/contract/test_my_work_contract.py -q -k "search or empty"` -- focused backend behavior passes.
- `npm run typecheck` -- generated query and component contracts pass.
- Focused compiled unit files for routing/localization/My Work plus the affected Chromium E2E scenarios -- direct behavior passes without running unrelated suites.
- `npm run build` -- production build and static checks pass once at the end.

**Manual checks:**
- Inspect empty and searched Tasks, empty Processes, Start Process, Flows, and Forms in Spanish at desktop and mobile widths.
