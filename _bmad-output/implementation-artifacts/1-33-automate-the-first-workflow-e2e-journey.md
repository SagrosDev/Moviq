---
baseline_commit: b31a153
---

# Story 1.33: Automate the First-Workflow E2E Journey

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a delivery team,
I want the representative stakeholder journey automated against the deployed application,
so that every build proves the thin slice remains executable end to end.

## Acceptance Criteria

1. **Automate the real thin-slice journey against the deployed synthetic-only application:** Given a clean synthetic test identity and available UAT capacity, when Playwright follows landing -> Owner registration -> email verification -> sign-in -> Workflow creation -> Start -> Task -> End design -> Short Text Form -> starter/assignment -> validation repair -> publication -> Process start -> Task save/complete -> completed timeline, then every step uses public browser/API contracts, persistent PostgreSQL state, the real UAT email outbox path, and private synthetic storage configuration. And the final evidence identifies build, environment, safe Organization/Process IDs, duration, and screenshots/traces without Process Data secrets. Traceability: Gate 1 early preview, UX-DR23, UX-DR24, AD-16.
2. **Fail promotion on the first actionable end-to-end or accessibility break:** Given any journey assertion, accessibility check, tenant boundary, or required service fails, when CI or preview promotion evaluates the journey, then promotion fails at the first actionable step with its correlation/evidence reference. And no fallback bypasses authentication, authorization, publication, Task completion, or persistence. Traceability: NFR25, NFR26, NFR27, NFR28, NFR29, NFR30, AD-12.

## Tasks / Subtasks

- [x] Add a deployed-journey Playwright execution mode without breaking the current local mocked E2E coverage (AC: 1, 2)
  - [x] Extend [Moviqo.Front/playwright.config.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/playwright.config.ts) so local specs can still use the current Vite-backed `webServer`, while a second env-driven mode can target the deployed UAT base URL directly without starting Vite.
  - [x] Preserve the current local browser matrix and add an explicit deployed-journey project/profile for the minimum release evidence path; do not silently replace local mocked specs with UAT-only execution.
  - [x] Keep `trace`, screenshots, and any retained failure artifacts configured so the failing step remains inspectable in CI/promotion evidence.

- [x] Introduce a synthetic-only test harness for clean identities and real verification-email retrieval (AC: 1, 2)
  - [x] Add a test support seam that can provision or reset one synthetic Organization/account safely before the run and tear down or rotate it afterward without touching production-like resources.
  - [x] Because no existing public inbox-inspection seam was found in the repo, add one explicit synthetic-only verification-link retrieval path that reads the real outbox/email result without bypassing registration or verification semantics.
  - [x] Keep that retrieval seam operator-safe and environment-scoped: it must be unavailable outside `synthetic-only`, must not expose unrelated tenant mail, and must not require direct database table reads from Playwright.

- [x] Automate the full representative stakeholder journey with resilient user-visible assertions (AC: 1)
  - [x] Add a dedicated spec such as `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts` that starts from the public landing page and performs the real registration, verification, sign-in, workflow-authoring, publication, process-start, task-save, task-complete, and completed-timeline path.
  - [x] Reuse the real routes already present in the SPA and API contracts: `/register`, `/verify-email`, `/sign-in`, `/my-work`, `/my-work/workflows/new`, `/my-work/tasks/:taskId`, and `/my-work/processes/:processId`.
  - [x] Assert on user-visible labels, headings, actions, and safe timeline/process evidence instead of CSS structure or implementation-only details.
  - [x] Verify that publication first fails with the expected checklist issue until starter/assignment or equivalent required configuration is repaired, then succeeds once the required fix is made.
  - [x] Verify that the final Process detail/timeline reflects the completed Start -> Task -> End flow and that any surfaced identifiers are safe references, not raw Process Data.

- [x] Add accessibility and evidence capture to the deployed journey (AC: 1, 2)
  - [x] Run automated accessibility checks at the critical public and authenticated milestones reached by the journey, keeping the checks scoped to the active page/region after the UI settles.
  - [x] Persist actionable evidence for failures: trace, screenshot, browser/project, build ID, environment host, and correlation-safe identifiers.
  - [x] Ensure logs, test output, and artifact names never print passwords, verification tokens, session cookies, raw email bodies, or submitted Process Field values.

- [x] Wire the deployed journey into release evidence without weakening existing local verification (AC: 2)
  - [x] Extend [Moviqo.Front/package.json](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/package.json), [README.md](C:/Endava/EndevLocal/Moviqo/README.md), and [`.github/workflows/ci.yml`](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml) with a named command/job for the deployed first-workflow journey.
  - [x] Keep the existing local `npm run test:e2e` path for mocked/browser-shell coverage, and add a separate release-gate command for the deployed journey when the required UAT environment variables/secrets are present.
  - [x] Make the release-gate output fail on the first actionable step and print enough context to locate the failed stage quickly without leaking sensitive data.

- [x] Add backend and contract support only where the real journey lacks a safe automation seam (AC: 1, 2)
  - [x] If the synthetic-only email retrieval/provisioning path requires backend support, add it under the existing Organizations/Messaging/UAT seams rather than creating ad hoc scripts that bypass application contracts.
  - [x] Cover any new synthetic-only support path with unit/contract tests proving it is unavailable outside UAT, tenant-safe, and free of sensitive data leakage.
  - [x] Do not add any endpoint, setting, or helper that would permit production or public-beta environments to inspect outbox contents or impersonate accounts.

### Review Findings

- [x] [Review][Patch] [High] Fail the deployed-journey job when required gate configuration is missing instead of returning a green skipped gate [.github/workflows/ci.yml:113]
- [x] [Review][Patch] [High] Assert the deployed backend build identity matches the commit under test before certifying it [Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts:29]
- [x] [Review][Patch] [High] Tear down or rotate synthetic organizations so repeated runs cannot exhaust the 100-organization capacity [Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts:30]
- [x] [Review][Patch] [High] Require successful outbox delivery evidence before exposing the verification link so a broken Resend/drain service fails the journey [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py:64]
- [x] [Review][Patch] [High] Bind verification-link retrieval to an expiring run or tenant scope instead of allowing one shared key to retrieve any recipient's token [Moviqo.Back/src/moviqo/modules/organizations/application/views.py:464]
- [x] [Review][Patch] [High] Prevent retained Playwright traces, screenshots, and videos from capturing passwords, verification tokens, or submitted Process Data [Moviqo.Front/playwright.config.ts:58]
- [x] [Review][Patch] [High] Attach safe journey metadata on failures and upload Playwright evidence from CI with an always-running artifact step [Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts:229]
- [x] [Review][Patch] [High] Run accessibility scans at the workflow designer, validation repair, task form, completion, and process timeline milestones [Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts:98]
- [x] [Review][Patch] [High] Add a tracked staging/build step that refreshes the untracked Infrastructure dist directory from the current frontend build before Firebase deploys it [Moviqo.Infrastructure/firebase.json:3]
- [x] [Review][Patch] [High] Require and deploy the real UAT public application base URL so verification links cannot fall back to https://moviqo.local [Moviqo.Infrastructure/modules/cloud-run-service.json:27]
- [x] [Review][Patch] [Medium] Capture a safe reference to the persisted Organization ID rather than labeling a random run prefix as Organization evidence [Moviqo.Front/tests/e2e/support/deployedJourney.ts:50]
- [x] [Review][Patch] [Medium] Replace Django's development server with a production-capable WSGI or ASGI server for the Cloud Run service [Moviqo.Back/Dockerfile:18]
- [x] [Review][Patch] [Medium] Derive the CSRF bootstrap endpoint from relative deployment base paths as well as absolute origins [Moviqo.Front/src/shared/api/client.ts:98]
- [x] [Review][Patch] [Medium] Refresh cached CSRF state after session token rotation instead of indefinitely preferring a stale module token [Moviqo.Front/src/shared/api/csrf.ts:14]
- [x] [Review][Patch] [Medium] Stop applying production-name substring validation to the secret value of the synthetic verification API key [Moviqo.Back/src/moviqo/settings/uat_contract.py:67]
- [ ] [Review][Verify] Deploy the coordinated migration, backend, frontend, and UAT configuration changes, then confirm the hardened `deployed-journey` job passes against that exact build.

## Dev Notes

### Story intent and scope

- Story 1.33 is the first release-style proof that Epic 1's thin slice works as one real journey in the deployed synthetic-only environment, not just as isolated unit, contract, integration, or mocked browser tests.
- This story is narrower than a complete cross-browser regression suite for every feature. The required outcome is one representative landing-to-completed-process journey that exercises the real public and authenticated seams already built in Stories 1.12 through 1.32.
- Keep the story focused on executable evidence for the first workflow journey:
  - real registration and verification;
  - real sign-in and protected routing;
  - real workflow creation, validation repair, and publication;
  - real Process start, task save/complete, and completed timeline;
  - real UAT environment boundaries and safe evidence capture.
- Do not broaden this into:
  - multi-Organization load testing;
  - visual regression baselines for every page;
  - generic admin/support journeys;
  - Gate 2 public-beta hardening;
  - synthetic data lifecycle cleanup beyond what the test needs.

### Story foundation from Epic 1, PRD, and UX

- Epic 1 Story 1.33 explicitly requires the journey to run against the deployed application, persistent PostgreSQL state, the real UAT email path, and private synthetic storage.
- PRD Gate 1 requires stakeholders to begin on the landing page, register, verify, create/publish a valid Workflow, start a Process, complete it, and inspect resulting operational views without developer intervention.
- `EXPERIENCE.md` defines the relevant user surfaces and flow order:
  - Public landing;
  - Registration and activation;
  - Dashboard / My Work;
  - Workflow Designer;
  - Process start;
  - Task Form;
  - Process detail and timeline.
- UX-DR23 and UX-DR24 imply evidence should be meaningful to stakeholders and reviewers, not just to developers reading raw logs.

### Previous story intelligence

- Story 1.32 already delivered the completed Process detail/timeline route and My Processes summary cards. Reuse those exact seams for the end-state assertions instead of inventing a second history surface.
- Story 1.31 already leaves successful completion at `/my-work` and records the runtime/audit evidence required for the timeline proof.
- Stories 1.25 through 1.29 already established the publication checklist, starter/assignment requirements, immutable publication, and Process start flow that this journey must drive through the browser.
- Story 1.20 created the authenticated My Work shell and existing Playwright coverage for mocked My Work states; preserve that coverage and add the deployed journey alongside it.

### Concrete existing-code seams to extend

- Frontend E2E/config seams already in place:
  - [Moviqo.Front/playwright.config.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/playwright.config.ts)
  - [Moviqo.Front/tests/e2e/app-shell.spec.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/tests/e2e/app-shell.spec.ts)
  - [Moviqo.Front/tests/e2e/my-work.spec.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/tests/e2e/my-work.spec.ts)
  - [Moviqo.Front/tests/e2e/password-recovery.spec.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/tests/e2e/password-recovery.spec.ts)
- Frontend route/page seams already present in the live app:
  - [Moviqo.Front/src/app/ui/App.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/app/ui/App.tsx)
  - [Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx)
  - [Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx)
  - [Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx)
  - [Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx)
  - [Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx)
- Backend/UAT seams already relevant:
  - [Moviqo.Back/src/moviqo/urls.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/urls.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/registration.py)
  - [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py)
  - [Moviqo.Back/src/moviqo/settings/uat_contract.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/settings/uat_contract.py)
  - [Moviqo.Infrastructure/README.md](C:/Endava/EndevLocal/Moviqo/Moviqo.Infrastructure/README.md)
  - [Moviqo.Infrastructure/environments/uat/uat-environment.json](C:/Endava/EndevLocal/Moviqo/Moviqo.Infrastructure/environments/uat/uat-environment.json)
- Current facts from the codebase:
  - The existing Playwright specs mostly mock API routes and run against the local Vite app.
  - `playwright.config.ts` already defines a multi-browser matrix, `baseURL`, locale, and `trace: "retain-on-failure"`.
  - The SPA already exposes all routes needed for the representative journey.
  - Registration generates a real verification URL using `MOVIQO_PUBLIC_APP_BASE_URL` and the public `/verify-email?token=...` route.
  - No reusable inbox-inspection or verification-link retrieval seam for E2E was found in the accessible repo; that must be created deliberately and kept synthetic-only.

### Architecture and security guardrails

- Follow AD-7: the browser test must use server-owned sessions, CSRF, and API contracts. Do not seed authenticated cookies by hand and do not bypass sign-in for the main representative journey.
- Follow AD-11: this must exercise the deployed synthetic-only topology, not a developer-only fork. Firebase Hosting -> Cloud Run -> Supabase PostgreSQL -> private GCS -> Resend/outbox remains the required path.
- Follow AD-12: failing evidence must be actionable and safe. Include build/environment/correlation-safe metadata, but do not leak Process Data, tokens, credentials, or raw email payloads.
- Follow AD-16: keep executable evidence layered correctly. Local unit/contract/integration tests remain in place; this story adds the critical landing-to-completed-Process Playwright release journey.
- Preserve tenant and environment boundaries from Stories 1.5 through 1.8:
  - any inbox or account-provisioning helper must be unavailable outside `synthetic-only`;
  - no helper may expose unrelated tenant mail or state;
  - do not create production-capable debug endpoints.

### Frontend and Playwright guidance

- Keep new frontend implementation functions as arrow-function constants per `AGENTS.md`.
- Prefer resilient, user-visible Playwright locators such as roles, labels, and visible text. Do not anchor the representative journey to CSS classes or DOM structure that users never see.
- Keep the journey deterministic:
  - use one clean synthetic identity per run or per isolated worker;
  - ensure stale prior state cannot make publication or Process assertions pass accidentally;
  - avoid tests that depend on execution order across files.
- Preserve the existing local mocked specs. The deployed journey should be an additional proof path, not a replacement for fast local route-mocked E2E coverage.
- The publication-repair step is important. The journey should intentionally hit the first blocking checklist state, fix it through the UI, and then publish successfully so the proof covers validation behavior instead of only the happy path.

### UAT/environment guidance

- `Moviqo.Infrastructure/README.md` and `uat-environment.json` already define UAT as `synthetic-only` in `us-east1` with private storage, Supabase PostgreSQL, Cloud Run, and the `resend-outbox` adapter.
- `uat_contract.py` already enforces:
  - `MOVIQO_ENVIRONMENT_CLASS=synthetic-only`;
  - `MOVIQO_MESSAGE_DELIVERY_ADAPTER=resend-outbox`;
  - only the `outbox-email-drain` runner path;
  - disabled-by-gate malware scanning, backups, and lifecycle schedules.
- The E2E journey must respect those contracts:
  - no direct production-like SMTP or mailbox dependency;
  - no public bucket/object inspection;
  - no reliance on local mocked API routes during deployed execution.

### Latest technical information

- Playwright best-practices documentation checked on August 6, 2026 still recommends testing user-visible behavior, keeping tests isolated, and preferring resilient locators such as `getByRole()` over DOM-structure selectors. Apply that directly to the first-workflow journey so failures represent real user breakage, not markup churn. Source: https://playwright.dev/docs/best-practices
- Playwright authentication documentation checked on August 6, 2026 still recommends shared `storageState` only when tests do not mutate shared server-side state; when tests change server state, separate accounts or isolation are required. Inference for this story: the representative create/publish/start/complete journey should use a clean synthetic identity and must not rely on a pre-baked shared account to skip the required auth proof. Source: https://playwright.dev/docs/auth
- Playwright configuration documentation checked on August 6, 2026 still documents `baseURL`, `locale`, `timezoneId`, `trace`, `screenshot`, and `video` as first-class `use` options. For this repo, keep `baseURL` env-driven for deployed UAT, preserve locale/timezone control for reproducible date assertions, and retain failure artifacts for diagnosis. Source: https://playwright.dev/docs/test-use-options
- Playwright accessibility documentation checked on August 6, 2026 still recommends running accessibility scans as ordinary tests after the page reaches the desired state and notes that `@axe-core/playwright` supports scoped analysis via `AxeBuilder`. Inference for this repo: keep milestone accessibility checks scoped to the active page/region after the journey settles rather than scanning unrelated hidden surfaces. Source: https://playwright.dev/docs/accessibility-testing

### Anti-patterns and out-of-scope work

- Do not replace the current local Playwright suite with a UAT-only suite.
- Do not bypass registration, verification, sign-in, publication, task save, or task completion with direct API shortcuts for the main release-proof journey.
- Do not read database tables directly from Playwright or expose raw outbox rows publicly.
- Do not log or persist passwords, verification tokens, session cookies, raw email bodies, or submitted Short Text field values in CI artifacts.
- Do not weaken the synthetic-only UAT contract by adding operator helpers that could run against production or public beta later.
- Do not turn this into a broad cross-browser feature matrix for every later epic. Story 1.34 will extend language/layout/accessibility qualification.

### Project Structure Notes

- Keep deployed-journey browser tests under `Moviqo.Front/tests/e2e/`.
- If helper fixtures or setup files are needed, keep them close to the Playwright suite rather than scattering ad hoc scripts across the repo.
- If backend synthetic-only test support is required, keep it inside the existing Organizations/Messaging/UAT seams and prove the environment guardrails with tests.
- Update the repo verification contract only through the existing documented commands in [README.md](C:/Endava/EndevLocal/Moviqo/README.md) and [`.github/workflows/ci.yml`](C:/Endava/EndevLocal/Moviqo/.github/workflows/ci.yml).
- No `project-context.md` file was discovered in the accessible workspace during story creation; rely on the planning artifacts, implementation artifacts, infrastructure contract, and current codebase as the authoritative context set for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.12 through Story 1.33]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - Sections 0.3, 12, 15, 18, SC-006]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-7, AD-11, AD-12, AD-16; Stack; Structural Seed]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Information Architecture; Component Patterns; State Patterns; Key Flows]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Timeline; Do's and Don'ts]
- [Source: `Moviqo.Front/playwright.config.ts`]
- [Source: `Moviqo.Front/package.json`]
- [Source: `Moviqo.Front/tests/e2e/app-shell.spec.ts`]
- [Source: `Moviqo.Front/tests/e2e/my-work.spec.ts`]
- [Source: `Moviqo.Front/tests/e2e/password-recovery.spec.ts`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx`]
- [Source: `Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx`]
- [Source: `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`]
- [Source: `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`]
- [Source: `Moviqo.Front/src/pages/process-detail/ui/ProcessDetailPage.tsx`]
- [Source: `Moviqo.Front/tests/unit/workflow-design-create.test.cts`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/settings/uat_contract.py`]
- [Source: `Moviqo.Back/tests/contract/test_registration_contract.py`]
- [Source: `Moviqo.Infrastructure/README.md`]
- [Source: `Moviqo.Infrastructure/environments/uat/uat-environment.json`]
- [Source: `.github/workflows/ci.yml`]
- [Technical reference: Playwright best practices, https://playwright.dev/docs/best-practices]
- [Technical reference: Playwright authentication, https://playwright.dev/docs/auth]
- [Technical reference: Playwright configuration, https://playwright.dev/docs/test-use-options]
- [Technical reference: Playwright accessibility testing, https://playwright.dev/docs/accessibility-testing]

## Dev Agent Record

### Agent Model Used

Codex

### Implementation Plan

- Preserve the existing local Playwright matrix and add an environment-selected deployed UAT project with retained failure artifacts.
- Add a synthetic-only, managed-secret-protected verification-link seam over the real outbox path and prove its environment boundary with backend contracts.
- Automate the complete public-to-completed-timeline browser journey using unique synthetic identities, user-visible locators, API completion signals, accessibility checks, and safe evidence.
- Wire the journey into GitHub Actions and document the UAT runtime/secret contract without weakening existing local verification.

### Debug Log References

- `git switch -c story/1-33-automate-the-first-workflow-e2e-journey`
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
- `Get-Content .\_bmad-output\implementation-artifacts\1-32-track-the-completed-process-and-timeline.md`
- `git log -5 --oneline`
- `rg --files Moviqo.Front | rg 'playwright|e2e|package.json|vite|tests'`
- `rg -n "playwright|axe|e2e|Start Free Beta|Sign In|my-work|processes" Moviqo.Front Moviqo.Back docs -g '!**/node_modules/**'`
- `Get-Content .\Moviqo.Front\package.json`
- `Get-Content .\Moviqo.Front\playwright.config.ts`
- `Get-Content .\Moviqo.Front\tests\e2e\app-shell.spec.ts`
- `Get-Content .\Moviqo.Front\tests\e2e\my-work.spec.ts`
- `Get-Content .\Moviqo.Front\tests\e2e\password-recovery.spec.ts`
- `Get-Content .\Moviqo.Front\src\pages\registration\ui\RegistrationPage.tsx`
- `Get-Content .\Moviqo.Front\src\pages\verification\ui\VerificationPage.tsx`
- `Get-Content .\Moviqo.Front\src\pages\my-work\ui\MyWorkPage.tsx`
- `rg -n "synthetic-only|Resend|Cloud Run|Firebase|Supabase|UAT|playwright|email outbox|verification token|verification" _bmad-output Moviqo.Back Moviqo.Front Moviqo.Infrastructure scripts docs -g '!**/node_modules/**'`
- `Get-Content .\Moviqo.Back\src\moviqo\settings\integration.py`
- `Get-Content .\Moviqo.Infrastructure\README.md`
- `Get-Content .\Moviqo.Infrastructure\environments\uat\uat-environment.json`
- `Get-Content .\Moviqo.Back\src\moviqo\settings\uat_contract.py`
- `Get-Content .\.github\workflows\ci.yml`
- `Get-Content .\Moviqo.Front\tests\unit\workflow-design-create.test.cts`
- `Get-Content .\Moviqo.Back\tests\contract\test_registration_contract.py`
- `Get-Content .\Moviqo.Front\src\app\ui\App.tsx`
- `Get-Content .\Moviqo.Front\src\pages\workflow-create\ui\WorkflowCreatePage.tsx`
- `web.open https://playwright.dev/docs/best-practices`
- `web.open https://playwright.dev/docs/auth`
- `web.open https://playwright.dev/docs/test-use-options`
- `web.open https://playwright.dev/docs/accessibility-testing`

### Completion Notes List

- Created the Story 1.33 implementation artifact with concrete tasks for a deployed Playwright journey, synthetic-only email verification retrieval, release-gate wiring, and safety guardrails.
- Preserved the distinction between existing local mocked E2E coverage and the new deployed UAT journey, so the dev agent is directed to add a second proof path rather than replace the current suite.
- Captured the missing inbox/outbox inspection seam explicitly as work to add under the existing synthetic-only UAT boundary instead of leaving the dev agent to invent an unsafe shortcut.
- Included current official Playwright guidance checked on August 6, 2026 for resilient locators, test isolation, auth-state tradeoffs, configuration, and accessibility scanning.
- Implemented and stabilized the full deployed journey from registration through the completed Process timeline, including API-coupled actions and unique workflow/process scoping.
- Added CSRF/session compatibility for Firebase Hosting to Cloud Run, synthetic-only verification retrieval, managed-secret wiring, and contract coverage that hides the seam outside UAT.
- Verified backend lint and tests (`222 passed`, `51 skipped`), frontend unit/architecture/API/build checks, UAT infrastructure validation, and the complete local Playwright matrix (`90 passed`).
- Confirmed by the user that `main` contains the latest changes and the GitHub Actions `deployed-journey` UAT gate passed on August 8, 2026.
- Applied all 15 code-review patches with a short-lived tenant-scoped synthetic run, confirmed outbox delivery polling, capacity-releasing rotation, exact deployed-build validation, sanitized failure evidence, expanded accessibility coverage, CSRF rotation recovery, deterministic Firebase staging, and a production-capable Cloud Run server.
- Verified the hardened change set with backend lint and tests (`226 passed`, `51 skipped`), migration drift checks, frontend unit/type/architecture checks, production Vite build and artifact scan, UAT infrastructure validation, Firebase staging (including replacement), the CI Playwright matrix (`30 passed`), and deployed-project test discovery. The live UAT gate still needs to run after deployment of this coordinated contract.
- Diagnosed the remaining live gate failure as Resend rejecting the unverified `onboarding@resend.dev`/local sender path. Registered `mymoviqo.com`, verified `updates.mymoviqo.com` through Cloudflare DNS and Resend, and prepared the explicit sender contract `Moviqo <notifications@updates.mymoviqo.com>`. Real UAT recipients remain unchanged; only the reserved deployed-journey `.test` identity uses the controlled mailbox redirect.

### File List

- `.github/workflows/ci.yml`
- `Moviqo.Back/Dockerfile`
- `Moviqo.Back/pyproject.toml`
- `Moviqo.Back/uv.lock`
- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0015_retired_registration_state.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/settings/production.py`
- `Moviqo.Back/src/moviqo/settings/uat.py`
- `Moviqo.Back/src/moviqo/settings/uat_contract.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_registration_contract.py`
- `Moviqo.Back/tests/integration/test_django_spine.py`
- `Moviqo.Back/tests/unit/test_production_contract.py`
- `Moviqo.Back/tests/unit/test_uat_contract.py`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/package.json`
- `Moviqo.Front/playwright.config.ts`
- `Moviqo.Front/src/features/authentication/index.ts`
- `Moviqo.Front/src/features/authentication/model/session.ts`
- `Moviqo.Front/src/features/registration/model/submitRegistration.ts`
- `Moviqo.Front/src/shared/api/client.ts`
- `Moviqo.Front/src/shared/api/csrf.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/tests/build/check-node-version.mjs`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts`
- `Moviqo.Front/tests/e2e/my-work.spec.ts`
- `Moviqo.Front/tests/e2e/support/deployedJourney.ts`
- `Moviqo.Front/tests/e2e/support/mockCsrf.ts`
- `Moviqo.Front/tests/unit/api-client-contract.test.cts`
- `Moviqo.Infrastructure/README.md`
- `Moviqo.Infrastructure/.gitignore`
- `Moviqo.Infrastructure/environments/uat/uat-environment.json`
- `Moviqo.Infrastructure/firebase.json`
- `Moviqo.Infrastructure/modules/cloud-run-service.json`
- `Moviqo.Infrastructure/operations/validate_uat.py`
- `Moviqo.Infrastructure/operations/stage_frontend.py`
- `README.md`
- `_bmad-output/implementation-artifacts/1-11-enforce-the-password-and-credential-policy.md`
- `_bmad-output/implementation-artifacts/1-12-register-the-initial-owner-and-organization.md`
- `_bmad-output/implementation-artifacts/1-15-return-safe-and-consistent-application-errors.md`
- `_bmad-output/implementation-artifacts/1-2-establish-the-frontend-application-spine.md`
- `_bmad-output/implementation-artifacts/1-20-provide-the-authenticated-my-work-shell.md`
- `_bmad-output/implementation-artifacts/1-3-establish-the-api-error-build-and-test-contract.md`
- `_bmad-output/implementation-artifacts/1-33-automate-the-first-workflow-e2e-journey.md`
- `_bmad-output/implementation-artifacts/1-4-establish-the-accessible-bilingual-design-foundation.md`
- `_bmad-output/implementation-artifacts/1-5-deploy-the-synthetic-data-internal-environment.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-technology-currency.md`
- `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `_bmad-output/specs/spec-Moviqo/SPEC.md`
- `_bmad-output/specs/spec-Moviqo/runtime-alignment.md`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-08: Implemented Story 1.33, stabilized the deployed first-workflow UAT journey, completed all local regression gates, and confirmed the `main` deployed-journey job passes.
- 2026-08-08: Applied all adversarial review patches and returned the story to in-progress pending deployment and a live run of the hardened gate.
- 2026-08-08: Replaced the temporary Resend test sender contract with the verified `updates.mymoviqo.com` sender; live exact-build verification remains required before closing the story.
