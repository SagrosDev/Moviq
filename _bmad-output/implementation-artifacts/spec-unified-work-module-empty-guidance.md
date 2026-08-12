---
title: 'Unify My Work and guide users through empty authoring states'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'dc40d77'
context:
  - '_bmad-output/implementation-artifacts/spec-authenticated-workspace-ux.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tasks, Processes, and Start Process feel like separate modules, while successful zero-data states are described with authorization or failure language. Forms and Workflows do not explain how a first-time owner should create the prerequisites needed to continue.

**Approach:** Make Tasks and Processes one coherent My Work module with tabs, while keeping Start Process as its current independent route and top-level module. Replace valid empty states across Start Process, My Work, Workflows, and Forms with plain-language guidance and direct next steps, while retaining contextual recovery for genuine request failures.

## Boundaries & Constraints

**Always:** Preserve canonical deep links and React Router navigation; keep Task Form, Process Detail, and `/processes/start` routes intact; show only Tasks or Processes as the active My Work tab; keep Start Process independently reachable from primary navigation; load startable workflows from the existing authoritative My Work response; localize all owned Spanish and English copy; show Create Workflow actions only to roles allowed to author; distinguish HTTP success with zero items from network, permission, session, not-found, and server failures; use shared controls and approved Tailwind tokens; retain keyboard and narrow-screen operation.

**Ask First:** Any API or authorization-contract change, removal of a canonical deep link, new dependency, or Workflow/Form editor redesign.

**Never:** Convert `404` or permission failures into empty data; show “authorized workflows/work” or generic “workspace not found” wording for a valid empty collection; place Start Process inside My Work as a tab, popup, or embedded panel; duplicate the workflow catalog model; remove tests merely to shorten execution time.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Work navigation | Authenticated user opens `/my-work`, Tasks, or Processes | One My Work page shows Tasks and Processes tabs, preserving the selected canonical URL | Task/Process detail deep links remain unchanged |
| Start process | User opens the independent Start Process module | The page lists startable published workflows using the current canonical route | Starting retains idempotency, progress, failure feedback, and destination navigation |
| No startable workflows | Successful Start Process response contains zero workflows | Author sees “Crea un flujo para iniciar” with Create Workflow action; non-author sees that no flows are available yet | No error alert or Retry control |
| Empty work | Successful response contains zero tasks/processes | Active tab explains there is nothing assigned or started yet | Search/pagination behavior remains intact |
| Empty workflow catalog | Successful catalog response contains zero workflows | Page invites an author to create the first workflow | Genuine read failures remain retryable errors |
| Empty Forms | Successful catalog response contains zero workflows | “Aún no tienes formularios” plus two numbered steps: create a workflow with a task, then return to design its form | Genuine selection/draft failures use specific recovery copy |
| Start URL | User opens `/processes/start` | The independent Start Process page opens directly | URL remains protected and browser navigation remains predictable |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx` -- compose Tasks/Processes tabs while preserving the independent Start Process page and mutation.
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` -- render the selected work region and guided start-workflow empty content.
- `Moviqo.Front/src/app/router/navigation.ts` and `routes.tsx` -- collapse Tasks/Processes navigation into My Work while retaining Start Process.
- `Moviqo.Front/src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx` -- helpful first-workflow empty state.
- `Moviqo.Front/src/pages/forms/ui/FormPages.tsx` -- first-form guidance and specific real-error recovery.
- `Moviqo.Front/src/shared/localization/messages.ts` -- bilingual tabs, empty states, setup steps, and recovery copy.
- `Moviqo.Front/tests/unit/application-routing.test.cts` and `my-work-shell.test.cts` -- navigation and state semantics.
- `Moviqo.Front/tests/e2e/my-work.spec.ts` and `authoring-navigation.spec.ts` -- integrated tabs, independent Start Process, empty guidance, focus, and responsive checks.

## Tasks & Acceptance

**Execution:**
- [x] `pages/my-work/ui/MyWorkPage.tsx`, `features/my-work/ui/MyWorkShell.tsx` -- compose unified Tasks/Processes tabs and role-aware Start Process empty guidance while preserving existing start behavior.
- [x] `app/router/navigation.ts`, `routes.tsx` -- reduce separate Tasks/Processes navigation to My Work while retaining the Start Process module and all canonical URLs.
- [x] `pages/workflow-catalog/ui/WorkflowCatalogPage.tsx`, `pages/forms/ui/FormPages.tsx`, `shared/localization/messages.ts` -- implement guided successful-empty states and accurate real-error copy.
- [x] Focused unit/E2E files -- cover the matrix without deleting unrelated protection; run one proportional final validation.

**Acceptance Criteria:**
- Given an authenticated user, when they move between Tasks and Processes, then the content changes as tabs inside one My Work module and the URL remains canonical.
- Given an author with no startable workflow, when they open the Start Process module, then the page says “Crea un flujo para iniciar” and offers Create Workflow without presenting an error.
- Given an owner with no workflows, when they open Forms, then they see “Aún no tienes formularios,” two actionable setup steps, and a Create Workflow action.
- Given a real API failure, when a work or authoring collection cannot load, then the page presents context-specific recovery without claiming the collection is empty.

## Spec Change Log

## Design Notes

The primary application navigation becomes My Work, Start Process, Workflows, and Forms for authoring roles; members see My Work and Start Process. Task and Process detail screens remain within the My Work navigation context.

## Verification

**Commands:**
- `npm run typecheck` -- TypeScript and component contracts pass.
- `npm run test:unit` -- localization, routing, and state tests pass.
- `npm run test:e2e -- tests/e2e/my-work.spec.ts tests/e2e/authoring-navigation.spec.ts --project=chromium-desktop` -- unified journey and empty guidance pass.
- `npm run build` -- production artifact and static safety scan pass once at the end.

**Manual checks (after automated verification):**
- Inspect My Work, Start Process, and Forms as an empty owner at desktop and mobile widths; verify tab focus, Spanish copy, and Create Workflow actions.
