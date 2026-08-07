---
baseline_commit: c1cf682c10a949d858a5458bd074cf3680c527eb
---

# Story 1.20: Provide the Authenticated My Work Shell

Status: done

## Story

As an active Organization member,
I want a clear authenticated home separating work I can start, do, and follow,
so that the first workflow journey has an understandable navigation anchor.

## Acceptance Criteria

1. **Authenticated My Work shell:** Given an active session and active Membership, when the user opens My Work, the page exposes distinct `Start workflows`, `My tasks`, and `My processes` regions with semantic headings and explicit loading, empty, error, and retry states. Every protected query is server-authorized and Organization-scoped. Traceability: FR26, FR288, FR289, UX-DR14, UX-DR15.
2. **Default and safe navigation:** After successful sign-in the user lands on My Work, with My Tasks as the default view. The shell offers navigation to the three regions without exposing an Organization switcher, cross-Organization aggregate, or anonymous/public process-start path. A session that is anonymous or inactive cannot render protected shell content.
3. **Responsive and accessible operation:** On mobile, tablet, laptop, and desktop, and at 200% text enlargement, primary navigation and actions remain operable without horizontal loss. Narrow layouts may render authorized collection rows as compact cards. Focus order follows reading order; headings, labels, status text, retry actions, and material loading/error changes are accessible; permission/status state is never conveyed by color alone. Traceability: UX-DR18, UX-DR20, NFR10, NFR15.
4. **Authorization-safe content:** The API returns only records the current active Membership may see. The UI does not infer or display counts, labels, workflow names, task metadata, or process metadata for unauthorized work. Do not use client-supplied `organizationId` as authorization.
5. **Revoked-session behavior:** Given My Work is open and the session is revoked, when the next protected query receives an authentication failure, all cached protected query data is cleared, no failed response is rendered, and the client transitions safely to sign-in. The return route contains no protected resource identifier. Traceability: FR384, AD-9.

## Tasks / Subtasks

- [x] Add the backend read-only My Work contract in `WorkflowRuntime` (AC: 1, 4)
  - [x] Define one authenticated, tenant-scoped query contract for startable published workflows, the current member's actionable tasks, and authorized processes; keep authorization and filtering on the server.
  - [x] Use `Organizations.Contracts`/the existing active-membership authorization seam; do not import Organizations persistence internals into WorkflowRuntime or read another module's tables directly.
  - [x] Return explicit projections with stable UUIDv7 identifiers, safe display metadata, status, and pagination/limits appropriate for a dashboard; never return Process Data or unauthorized existence signals.
  - [x] Add DRF endpoint(s) under `/api/v1`, document them with drf-spectacular, use Problem Details for safe failures, and regenerate `Moviqo.Front/src/shared/api/generated/schema.d.ts` plus `docs/api/openapi-v1.json` through the repository command.
  - [x] Apply `TenantContext` and transaction-scoped tenant state before querying. Add positive and negative tenant-isolation/authorization coverage using the repository's real-PostgreSQL integration pattern.
- [x] Implement the feature-sliced frontend shell (AC: 1–5)
  - [x] Add a `pages/my-work` route and a focused feature/model layer for My Work queries; use the existing `shared/api` client and query registry rather than a second remote-state library or ad hoc fetch cache.
  - [x] Reuse `SessionProvider`, the `moviqo:session-expired` event, `createQueryKey`, existing design tokens, `LanguageProvider`, and shared UI controls. Clear/invalidate protected query state on session expiry before redirecting.
  - [x] Render My Tasks as the default region/view and keep Start workflows and My processes visibly distinct. Provide server-driven empty, loading, error, and retry states for each region; do not show optimistic success or client-authoritative permissions.
  - [x] Keep route composition in `app`; expose feature APIs through public `index.ts` entries and preserve `app → pages → features → entities → shared` dependency direction.
  - [x] Use Spanish-first keys with English translations/fallback. Keep designer-authored content verbatim when it appears in server results. Use plain business language such as “Start a process”, “My tasks”, and “My processes”, not graph or implementation terminology.
  - [x] Implement responsive CSS with existing tokens: stacked/compact cards at narrow widths, no fixed-width dashboard table, minimum practical 44×44px targets, visible focus, reduced-motion support, and no horizontal overflow at 200% text.
- [x] Integrate authentication navigation (AC: 2, 5)
  - [x] Change successful sign-in and protected-root routing to My Work without breaking public landing, registration, verification, recovery, or design-system routes.
  - [x] Ensure loading/anonymous session states cannot briefly show protected dashboard content. Preserve the existing safe sign-out and session-expiry redirect behavior; do not put a protected ID in query parameters or return URLs.
- [x] Add executable evidence (AC: 1–5)
  - [x] Add backend contract, authorization, tenant-isolation, and query behavior tests; include empty/error/unauthorized cases and verify no protected data leaks in response or logs.
  - [x] Add frontend unit tests for query state, invalidation, session expiry, and safe routing. Test files and new frontend implementation functions must use arrow-function constants per `AGENTS.md`.
  - [x] Add Playwright coverage for authenticated My Work, default My Tasks, all three semantic regions, mocked server loading/empty/error/retry responses, keyboard focus, mobile width, 200% text, and revoked-session transition. Use role/name-based locators and the existing axe-core approach; automated checks do not replace manual assistive-technology review.

### Review Findings

- [x] [Review][Patch] Authenticated root routing still falls back to the public landing instead of My Work [Moviqo.Front/src/app/ui/App.tsx:13]
- [x] [Review][Patch] My Work skips the post-tenant active-organization validation required by the tenant access seam [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py:74]
- [x] [Review][Patch] `/api/v1/my-work/` documents only `200` and omits Problem Details failure responses [Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py:68]
- [x] [Review][Patch] My Work contract coverage does not exercise hostile tenant identifiers or the required tenant-isolation evidence path [Moviqo.Back/tests/contract/test_my_work_contract.py:25]

## Dev Notes

### Scope and dependencies

- This story establishes the authenticated navigation/read shell only. Task claim/open, Process start mutation, workflow creation, task forms, and process completion belong to later stories (1.21 onward); provide links/actions only where they are authorized and represented by the server contract.
- The PRD defines My Work as one authenticated area containing Start a Process, My Tasks, and My Processes; My Tasks is the default post-authentication view. Members must not browse Organization work by default. Access derives from direct assignment, eligible Team assignment, participation, or explicit administrative authority. [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` §2.1, §6.3, FR-024–FR-026, FR-288–FR-298]
- The epic intentionally names the first region `Start workflows`; product-facing PRD language also uses `Start a Process`. Choose one consistent localized heading and make its purpose clear without exposing technical terminology.

### Existing implementation to preserve

- `Moviqo.Front/src/app/ui/App.tsx` is the current route composition root and currently sends `/` to the public `HomePage`; do not make `/` a protected dashboard for anonymous users.
- `Moviqo.Front/src/features/authentication/model/SessionProvider.tsx` bootstraps `/api/v1/auth/session/`, listens for `moviqo:session-expired`, sets anonymous state, and redirects to `/sign-in`. Extend this behavior so protected query cache/state is cleared before the transition; retain the existing public-route behavior.
- `Moviqo.Front/src/shared/api/client.ts` dispatches `moviqo:session-expired` on 401/403 and already adds same-origin credentials and CSRF headers. Use it; do not create bearer-token storage or a parallel API wrapper.
- `Moviqo.Front/src/shared/api/query/queryRegistry.ts` currently provides query keys/invalidation primitives, not a full cache. Expand it minimally or add a clearly owned query-state module under `shared/api/query`; do not add Redux, React Query, Redis, WebSockets, or another distributed cache for this story.
- `Moviqo.Front/src/shared/localization/messages.ts` already contains navigation keys and bilingual design-system vocabulary. Add only the required My Work keys to both dictionaries, allowing Spanish fallback for missing English entries.
- Existing styles in `Moviqo.Front/src/app/styles.css` already define Moviqo tokens, focus outlines, reduced motion, app header/nav, cards, and responsive foundations. Extend these patterns instead of introducing a second design system.
- Backend authentication is in `Moviqo.Back/src/moviqo/modules/organizations/application/session.py` and current session views. `WorkflowRuntime` currently has only a probe model and no My Work read endpoint; create the smallest coherent query/application structure needed for this story.

### Architecture guardrails

- Follow AD-1, AD-2, AD-7, AD-9, AD-12, and AD-16. Backend authorization is authoritative; UI filtering is presentation only.
- Every protected query must derive tenant context from the active session/Membership, use Organization-scoped relationships and explicit projections, and avoid unbounded collection loads. Do not accept a client Organization identifier as an authorization input.
- Use `/api/v1`, OpenAPI-generated TypeScript types, RFC 9457 Problem Details, safe correlation IDs, and no Process Data, credentials, private links, or cross-tenant identifiers in telemetry.
- No AI, broker, Redis, Celery, distributed cache, WebSocket, real-time channel, or public/anonymous initiation is in scope.
- Stack is pinned by the repository: Python 3.14.6, Django 5.2.15, DRF 3.17.1, PostgreSQL 17.10, Node 26.7.0, TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, and Playwright 1.62.x. Do not upgrade dependencies as part of this story.

### File structure expectations

Likely updates/new files (confirm against actual implementation before editing):

- Backend: `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/`, `views.py`/serializers or equivalent public application files, `urls.py`, migrations/models only if a real read model is required, and `Moviqo.Back/tests/{unit,contract,integration}/`.
- Frontend: `Moviqo.Front/src/app/ui/App.tsx`, `src/features/authentication/model/SessionProvider.tsx` or a public cache-invalidation seam, `src/pages/my-work/{index.ts,ui/...}`, `src/features/my-work/{index.ts,model,ui}`, `src/shared/api/query/...`, `src/shared/localization/messages.ts`, `src/app/styles.css`, generated API schema, and focused unit/e2e tests.
- Generated artifacts: update `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` only through the existing generation/check commands. Do not hand-edit generated output.
- All new `.ts`/`.tsx` functions, including tests/build helpers, must be arrow-function constants unless a framework or TypeScript constraint requires otherwise. [Source: `AGENTS.md`]

### Testing and acceptance details

- Verify active Membership positive access and inactive/revoked/foreign Membership negative access. Assert identical safe failure behavior where existence disclosure could occur.
- For each region, assert loading is announced or semantically represented, empty state explains the next action, error state offers retry, and retry performs a fresh authorized query without revealing stale protected content.
- Verify navigation with keyboard and touch, semantic `main`/`nav`/headings, visible focus, reading-order focus, non-color-only state labels, and no horizontal overflow at a 390px viewport and 200% text.
- For session revocation, mock the next protected response as 401/403 and assert protected headings/cards/counts disappear, the query registry/cache is cleared, the route becomes `/sign-in` without a protected identifier, and no failed response body is rendered.
- Follow red → green → refactor. Use real PostgreSQL for tenant, authorization, transaction, and query integration behavior; use Playwright for user-visible behavior and accessibility. Playwright’s official accessibility guidance recommends axe-based automated checks together with manual assessment, and its testing guidance favors resilient user-visible locators. [Source: https://playwright.dev/docs/next/accessibility-testing; https://playwright.dev/docs/best-practices]

### Out of scope / anti-patterns

- Do not implement task claiming, process starting, workflow design, process detail, administration, dashboard customization, or completed-task history in this story.
- Do not render hard-coded synthetic work as if it came from the server, expose unauthorized counts/labels, infer permissions from role strings in the browser, or rely on client-side Organization filtering.
- Do not cache protected data in localStorage, URL parameters, analytics, or persistent browser storage. Session cookies remain server-owned, same-origin, Secure, HttpOnly, and appropriately SameSite.

## References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` — Story 1.20]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` — FR-026, FR-288–FR-298, FR-384, UX-DR14, UX-DR15, UX-DR18, UX-DR20, NFR-010, NFR-015]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` — §2.1, §6.3, §10.1, §15.2–§15.5]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` — AD-1, AD-2, AD-7, AD-9, AD-12, AD-16; Capability → Architecture Map; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` — Information Architecture, State Patterns, Interaction Primitives, Accessibility Floor, Responsive & Platform]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` — Colors, Typography, Layout & Spacing, Components]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`, `Moviqo.Front/src/features/authentication/model/SessionProvider.tsx`, `Moviqo.Front/src/shared/api/client.ts`, `Moviqo.Front/src/shared/api/query/queryRegistry.ts`, `Moviqo.Front/src/shared/localization/messages.ts`, `Moviqo.Front/src/app/styles.css`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/session.py`, `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`, `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`, `Moviqo.Back/src/moviqo/urls.py`]
- [Technical reference: React `useContext` and `useEffect`, https://react.dev/reference/react/useContext and https://react.dev/reference/react/useEffect]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `uv run pytest -p no:tmpdir tests/contract/test_my_work_contract.py`
- `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
- `npm run generate:api-client`
- `npm run typecheck`
- `npm run test:unit`
- `npx playwright test tests/e2e/my-work.spec.ts`

### Completion Notes List

- Added `/api/v1/my-work/` as an authenticated, tenant-context-protected dashboard contract that currently returns safe empty collections for startable workflows, actionable tasks, and authorized processes until later runtime stories add real entities.
- Added the feature-sliced My Work page, localized region navigation, protected-query cache state, and session-expiry clearing so anonymous or revoked sessions cannot keep protected shell content on screen.
- Changed successful sign-in routing to `/my-work` and preserved public landing, recovery, verification, registration, and design-system routes.
- Regenerated `docs/api/openapi-v1.json` and reran `npm run generate:api-client`; the OpenAPI JSON changed and the TypeScript generation step completed, but `schema.d.ts` produced no tracked diff in this workspace.
- Backend contract tests passed. Full schema-contract pytest execution is blocked by a local Windows temp-directory permission issue in pytest's tmpdir cleanup/plugin path, so schema validation was verified by the repository `spectacular --validate --fail-on-warn` command instead.

### File List

- `_bmad-output/implementation-artifacts/1-20-provide-the-authenticated-my-work-shell.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/my_work.py`
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_my_work_contract.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/authentication/index.ts`
- `Moviqo.Front/src/features/authentication/model/SessionProvider.tsx`
- `Moviqo.Front/src/features/authentication/model/sessionRouting.ts`
- `Moviqo.Front/src/features/my-work/index.ts`
- `Moviqo.Front/src/features/my-work/model/myWork.ts`
- `Moviqo.Front/src/features/my-work/model/useMyWorkDashboard.ts`
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx`
- `Moviqo.Front/src/pages/my-work/index.ts`
- `Moviqo.Front/src/pages/my-work/ui/MyWorkPage.tsx`
- `Moviqo.Front/src/pages/sign-in/ui/SignInPage.tsx`
- `Moviqo.Front/src/shared/api/index.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/api/query/queryRegistry.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/e2e/my-work.spec.ts`
- `Moviqo.Front/tests/unit/my-work-shell.test.cts`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-04: Implemented the authenticated My Work shell, protected dashboard contract, localized shell states, query-cache invalidation, and focused backend/frontend automated coverage.
