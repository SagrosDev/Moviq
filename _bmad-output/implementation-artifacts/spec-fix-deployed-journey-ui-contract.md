---
title: 'Reconcile deployed journey with the Story 1.38 UI contract'
type: 'bugfix'
created: '2026-09-04'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'fec83033493157d06e26e93da4308c3acabba227'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md'
  - '{project-root}/Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The real UAT deployed journey still drives UI controls and navigation that were replaced by Stories 1.34–1.38. Both language profiles can fail before reaching the approved Task completion and Process timeline flow, so the release gate no longer proves the current product journey.

**Approach:** Reconcile the Playwright journey with source-owned localization keys and the current accessible Workflow/Form authoring interactions while preserving API-coupled assertions, tenant-safe evidence, and the exact-deployed-revision gate.

## Boundaries & Constraints

**Always:** Run both Spanish and English deployed profiles; locate visible Moviqo copy through the localization catalog; follow the current React Flow keyboard connection flow and dedicated Form Designer route; use publication as the authoritative validation action; retain real registration, email verification, sign-in, save, completion, timeline, accessibility, cleanup, and sanitized evidence checks; target `https://moviqo-uat-synthetic.web.app` only after frontend and backend represent the exact commit.

**Ask First:** Changing product UI behavior, backend contracts, authorization, GitHub secrets/variables, deployment triggers, or the established GitHub-to-Cloud-Run release process.

**Never:** Weaken assertions merely to make CI green; hard-code one language’s visible copy in the bilingual journey; restore removed editor controls; log or request secret values; accept a run that raced deployment or tested mixed frontend/backend revisions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Spanish journey | `deployed-journey-es` | Registration through completed timeline follows current localized controls | Any failed API, locator, accessibility, cleanup, or build check fails the profile with sanitized evidence |
| English journey | `deployed-journey-en` | Same authoritative path uses English catalog copy | No Spanish-only selector remains |
| Publication blockers | Incomplete Workflow draft | Publish returns validation blockers; the journey repairs configuration and Form design, then publishes successfully | The expected blocked response is asserted without treating it as a successful API action |
| Story 1.38 completion | Terminal Task completes | Explicit localized timeline link opens the authorized Process detail | URL, expected events, and accessibility are verified without brittle total-event cardinality |
| Deployment race | UAT does not yet represent the commit | Journey is not accepted as release evidence | Wait for matching backend health and matching Firebase frontend, then rerun |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts` — real bilingual UAT path and UI/API assertions.
- `Moviqo.Front/tests/e2e/support/deployedJourney.ts` — build verification, API helpers, cleanup, and sanitized evidence.
- `Moviqo.Front/playwright.config.ts` — Spanish and English deployed projects.
- `.github/workflows/ci.yml` — main-push job and exact expected build identifier.
- `Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md` — authoritative exact-revision deployment and rerun sequence.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts` — replace stale language, registration, workflow-create, editor connection, publication, assignment, Form Designer, region, heading, and timeline locators with current localized accessible interactions.
- [x] `Moviqo.Front/tests/e2e/support/deployedJourney.ts` — remove the obsolete publication-readiness helper if it has no remaining caller; preserve all security, evidence, and cleanup helpers.
- [x] `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md` — record the repaired deployed-journey gate and keep Story 1.38 in progress until the exact deployed run passes.

**Acceptance Criteria:**
- Given either deployed language profile, when the full UAT journey runs against one exact deployed commit, then it reaches and verifies the completed Process timeline using only current accessible controls and localized copy.
- Given an incomplete Workflow, when Publish is attempted, then the journey observes the expected blocking response, repairs starter, assignment, and Form requirements through current editors, saves, and publishes successfully.
- Given the automatic main-push run races deployment, when evidence is assessed, then it is rejected until backend health and Firebase Hosting match the commit and the journey is rerun successfully.

## Spec Change Log

- 2026-09-04: Reconciled the bilingual deployed journey with the approved UI contract, removed the unused readiness helper, and recorded the still-pending exact-deployment gate in Story 1.38.
- 2026-09-04: Follow-up review required the UAT origin/build identifier, coupled blocked Publish to its problem codes, verified all repaired blockers and rendered success states, and made the blocked response wait atomic with its click.
- 2026-09-04: Independent review tightened exact UAT URL and problem-envelope checks, brought the Form Designer into the accessibility scan, verified repaired editor state after return, and recorded the pre-existing absence of automated Firebase build attestation.

## Verification

**Commands:**
- `npm run typecheck` — expected: current test and application TypeScript compile with pinned Node 26.7.0.
- `npm run test:unit` — expected: frontend regression suite passes.
- `npm run test:e2e:deployed-journey -- --list` — expected: both deployed profiles discover exactly one journey each without requiring secret values.
- `git diff --check` — expected: no whitespace errors.

**Manual checks:**
- After the exact commit is deployed to both Cloud Run and Firebase Hosting, rerun `deployed-journey`; require both language profiles and uploaded sanitized evidence to pass before marking Story 1.38 done.

## Suggested Review Order

**Authoritative bilingual journey**

- Start with server-authoritative blockers, current-editor repair, and successful publication.
  [`first-workflow-journey.spec.ts:248`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L248)

- Reject noncanonical UAT URLs and verify the expected backend build before setup.
  [`first-workflow-journey.spec.ts:92`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L92)

- Follow localized registration and React Flow keyboard construction in both languages.
  [`first-workflow-journey.spec.ts:103`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L103)

- Exercise the dedicated Form Designer and verify repaired state after returning.
  [`first-workflow-journey.spec.ts:294`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L294)

- Verify explicit completion handoff, completed status, and semantic timeline events.
  [`first-workflow-journey.spec.ts:397`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L397)

**Localized active-participant behavior**

- Keep active-process contribution copy in present tense in both catalogs.
  [`messages.ts:935`](../../Moviqo.Front/src/shared/localization/messages.ts#L935)

- Preserve current and legacy Spanish search phrases during the copy transition.
  [`my_work.py:517`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py#L517)

- Cover the current visible Spanish phrase through the backend contract.
  [`test_my_work_contract.py:839`](../../Moviqo.Back/tests/contract/test_my_work_contract.py#L839)

**Support and release traceability**

- Retain API coupling, accessibility enforcement, cleanup, and sanitized evidence helpers.
  [`deployedJourney.ts:232`](../../Moviqo.Front/tests/e2e/support/deployedJourney.ts#L232)

- Keep Story 1.38 open until both exact-deployment language profiles pass.
  [`1-38-polish-the-authenticated-stakeholder-journey.md:50`](./1-38-polish-the-authenticated-stakeholder-journey.md#L50)

- Track missing Firebase attestation separately from this UI-contract repair.
  [`deferred-work.md:105`](./deferred-work.md#L105)
