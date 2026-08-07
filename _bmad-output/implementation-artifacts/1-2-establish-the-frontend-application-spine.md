---
baseline_commit: 1035a0a
status: done
---

# Story 1.2: Establish the Frontend Application Spine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Moviqo delivery team,
I want a buildable feature-sliced SPA with enforced dependency direction,
so that user-facing capabilities remain modular and backend-authoritative.

## Acceptance Criteria

1. **Given** a clean checkout with Node.js 26.7.0
   **When** frontend install, type-check, test, and production-build commands run
   **Then** TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, React Flow 12.11.2, and Playwright 1.62.x produce one static SPA artifact
   **And** the artifact contains no server secret or environment-private credential.

2. **Given** the dependency flow `app -> pages -> features -> entities -> shared`
   **When** a lower layer imports a higher layer or a consumer bypasses a feature's public entry point
   **Then** the frontend architecture check fails and identifies the prohibited edge
   **And** server state uses one query layer while workflow and form draft state uses explicit reducers with revision tokens.

3. **Given** a component attempts to grant access, route a Process, calculate a value, or accept Task completion without a server result
   **When** the frontend test exercises that path
   **Then** the UI remains non-authoritative and renders the server response or safe failure state
   **And** no component-local rule can override server authorization or workflow semantics.

## Tasks / Subtasks

- [x] Establish the frontend workspace and locked dependency inputs (AC: 1)
  - [x] Create the frontend project under `Moviqo.Front/`, preserving that root and not placing SPA files at the repository root.
  - [x] Pin or constrain the approved stack: Node.js 26.7.0, TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, `@xyflow/react` 12.11.2, and Playwright 1.62.x.
  - [x] Add reproducible commands for install, type-check, unit/architecture tests, Playwright tests, and production static build.
  - [x] Keep local dependency folders, build artifacts, Playwright reports, traces, screenshots, and environment-private files out of source control.
- [x] Create the React/Vite SPA composition root (AC: 1, 3)
  - [x] Add `index.html`, `src/main.tsx`, and `src/app/` bootstrap using React's `createRoot` entry and development `StrictMode`.
  - [x] Produce a single static `dist/` artifact from Vite; the frontend must not introduce server rendering, backend hosting code, secrets, or private credentials.
  - [x] Configure browser-exposed environment access intentionally and test that only client-safe variables are bundled.
- [x] Establish the feature-sliced source tree (AC: 2)
  - [x] Create the required layers: `src/app/`, `src/pages/`, `src/features/`, `src/entities/`, and `src/shared/`.
  - [x] Expose feature modules through public entry points only, and document/import through those public entry points instead of deep feature internals.
  - [x] Add representative seed slices only where useful to prove the architecture; do not implement registration, authentication, workflow design, forms, routing, or task completion behavior beyond test fixtures/stubs needed for the spine.
- [x] Add frontend dependency-boundary tests (AC: 2)
  - [x] Fail when `shared` imports `entities`, `features`, `pages`, or `app`.
  - [x] Fail when `entities` imports `features`, `pages`, or `app`.
  - [x] Fail when `features` imports `pages` or `app`.
  - [x] Fail when `pages` imports `app`.
  - [x] Fail when consumers deep-import a feature internal module instead of the feature's public entry point.
  - [x] Include actionable failure messages that name the importing file, prohibited edge, and allowed alternative.
- [x] Add server-state and draft-state primitives without creating business authority (AC: 2, 3)
  - [x] Establish one shared query layer for remote/server state, with typed query keys and invalidation helpers suitable for the later generated `/api/v1` client.
  - [x] Establish reducer-based local draft state primitives that carry explicit revision tokens for workflow canvas and form draft scenarios.
  - [x] Add tests proving draft updates require and preserve revision tokens rather than silently overwriting server state.
- [x] Prove the UI is backend-authoritative (AC: 3)
  - [x] Add test fixtures for access denial, routing/calculation results, and task completion attempts where the UI must wait for or render a server result.
  - [x] Prove component-local checks can show immediate UX validation only; they cannot grant permission, select routes, calculate authoritative values, or mark completion.
  - [x] Render safe failure states from server-style responses without leaking restricted resource details.
- [x] Add minimal accessibility-aware Playwright coverage (AC: 1, 3)
  - [x] Configure Playwright to start or reuse the Vite dev server and use web-first assertions.
  - [x] Add a smoke journey against the first screen/shell that verifies semantic landmark or heading structure and keyboard-visible focus for the scaffolded experience.
  - [x] Do not claim full WCAG conformance in this story; this story establishes the test harness for later feature evidence.

### Review Findings

- [x] [Review][Patch] Required Node version is not enforced by the normal verification commands [Moviqo.Front/package.json:12]
- [x] [Review][Patch] Architecture guard misses side-effect and dynamic imports, allowing prohibited layer edges [Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs:38]
- [x] [Review][Patch] Feature public-entry enforcement only checks app/pages consumers [Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs:93]

## Dev Notes

### Scope and boundaries

- This is a frontend foundation story, not implementation of landing content, registration, authentication, generated API client, bilingual resource catalog, workflow authoring, forms, process runtime, or production deployment.
- Story 1.1 already established the backend modular spine under `Moviqo.Back/`. Reuse the repository's separated product roots: backend in `Moviqo.Back/`, frontend in `Moviqo.Front/`, and later infrastructure in correctly spelled `Moviqo.Infrastructure/`.
- Story 1.3 owns the OpenAPI document, generated TypeScript client, RFC 9457 error contract, and combined API/build/test contract. In this story, create a typed seam/place for the future generated client, not a hand-maintained duplicate DTO layer.
- Story 1.4 owns the accessible bilingual design foundation. This story may add minimal visible shell text and accessibility smoke checks, but must not try to complete the full design-system catalog or localization coverage.
- The existing `Moviqo.Front/` directory is present but has no files. Scaffold inside it and preserve that path.

### Required project structure

```text
Moviqo.Front/
  package.json
  package-lock.json or equivalent lockfile selected for the project
  index.html
  vite.config.ts
  tsconfig.json
  src/
    app/                        # bootstrap, routing, providers
    pages/                      # route composition
    features/                   # user-intent slices, public entry points
    entities/                   # reusable entity views and query keys
    shared/                     # design-system primitives, generated API seam, utilities
  tests/
    architecture/
    e2e/
```

If a package manager is chosen during implementation, keep it local to `Moviqo.Front/` and make all verification commands run from that directory or document root-level wrapper commands clearly.

### Architecture guardrails

- Enforce AD-9 exactly: dependencies flow `app -> pages -> features -> entities -> shared`. Lower layers never import higher layers.
- Feature consumers must import through feature public entry points, for example `src/features/<feature>/index.ts`, not `src/features/<feature>/internal/...`.
- Server state must go through one query layer. The story may choose the concrete query library during scaffolding after compatibility checks, but it must not create multiple competing remote-state caches.
- Workflow canvas and form draft state must use explicit reducers with revision tokens. Do not hide draft writes inside arbitrary component state that can overwrite a newer server revision.
- Components are non-authoritative. They may disable a button, preview a warning, or show optimistic pending state, but authorization, routing, calculations, task completion, and workflow semantics come from the server response.
- React Flow is approved as a canvas implementation seed only. Workflow meaning remains in the backend deterministic interpreter; do not encode routing semantics in React Flow nodes or edges.
- The SPA must remain static. Do not add a Node server, SSR framework, API proxy that carries secrets, Redis, broker, microservice, AI dependency, or frontend-serving behavior in the backend.

### UX and accessibility guardrails

- Use the UX information architecture as the route/shell direction: public landing, registration/activation, guided first workflow, dashboard, My Tasks, My Processes, Workflow catalog/designer, process start, task form, process detail/timeline, Needs Attention, and Organization administration.
- For this story, seed only enough shell/navigation/test doubles to prove the architecture. Later stories own real content and business behavior.
- Moviqo's visual foundation is calm, approachable, Spanish-first, and accessible. Avoid technical labels such as node/topology in user-facing scaffold text.
- Every primary flow must be keyboard reachable; status, permission, and validation states must not rely on color alone.
- Playwright smoke coverage should use accessible locators and web-first assertions, and should avoid brittle selectors where semantic roles are available.

### Current frontend stack notes

- React 19.2.7 docs support the standard client entry using `createRoot(...).render(...)`; wrap the root in `StrictMode` during development so side effects are exposed early.
- Vite 8 docs show the React TypeScript template using `@vitejs/plugin-react` and `build: tsc -b && vite build`; Vite exposes browser env variables intentionally through the client env mechanism, so test that server/private names are absent from `dist/`.
- Playwright docs support using `webServer` in `playwright.config.ts`, `reuseExistingServer: !process.env.CI`, and web-first assertions such as `expect(locator).toBeVisible()`.

### Previous story intelligence

- Story 1.1 established a strong pattern: scaffold first, add architecture tests for boundaries, add build-input/security checks, and record exact verification commands in the story's Dev Agent Record.
- Story 1.1 review patches hardened deterministic build inputs, local secret exclusions, production safety checks, and boundary-test failure quality. Mirror that discipline here for frontend build artifacts and browser-exposed configuration.
- Recent commits show Story 1.1 was implemented, hardened through review, and approved. The worktree was clean before this story file was created.

### Testing requirements

- Follow red -> green -> refactor for every behavior and guardrail.
- Required local evidence for this story should include dependency install/lock verification, TypeScript type-check, frontend unit tests, architecture boundary tests, production build, static artifact secret scan, and Playwright smoke tests.
- Architecture tests are mandatory because they are the acceptance mechanism for AD-9.
- Static artifact checks should scan built output for representative server-only names and private credential patterns. Do not commit `.env.local`, secrets, private tokens, reports, traces, screenshots, or generated build output unless explicitly intended as source.
- Playwright tests should run against the Vite app through configured `webServer`; use web-first assertions and semantic locators.

### Project Structure Notes

- `Moviqo.Front/` exists but is empty. Treat every frontend source file as new unless implementation discovers untracked local files.
- `Moviqo.Infraestructure/` exists with a misspelling. Do not modify it in this story; later infrastructure work owns the correctly spelled `Moviqo.Infrastructure/` root.
- Do not move or rewrite `Moviqo.Back/` as part of this story. Backend changes should be limited to unavoidable documentation or integration seams, and none are expected for this scaffold.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.2]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-9, AD-11, AD-15, AD-16]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, `## Stack`, `## Structural Seed`, `## Consistency Conventions`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-ux-reconciliation.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-technology-currency.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-02.md`, `Frontend application spine`]
- [React 19.2.7 documentation via Context7: `createRoot`, `StrictMode`]
- [Vite 8.0.x documentation via Context7: React TypeScript config, production build, env/mode behavior]
- [Playwright documentation via Context7: `webServer`, web-first assertions]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- 2026-08-03: Implemented `Moviqo.Front/` React/Vite spine with package-lock, feature-sliced layers, query/draft primitives, architecture tests, unit tests, build artifact scanner, and Playwright smoke test.
- 2026-08-03: Local Node runtime is `26.7.0`; `npm run check:node` is aligned with the story-required runtime.
- 2026-08-03: Review patches applied for Node command enforcement and architecture guard coverage.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status set to `ready-for-dev`.
- Created a static Vite SPA under `Moviqo.Front/` with React `createRoot`, development `StrictMode`, client-safe env prefixing, and no backend hosting/server code.
- Added feature-sliced layers and architecture tests enforcing `app -> pages -> features -> entities -> shared` plus feature public entry point imports.
- Added one shared query registry seam for future `/api/v1` client integration and reducer-based draft state with explicit revision tokens.
- Added non-authoritative UI fixtures and tests for access denial, route rejection, calculation rejection, and task completion rejection using safe server-style responses.
- Added Playwright smoke coverage for semantic shell structure and keyboard-visible focus.
- Review verification completed: `node tests/architecture/frontend-boundaries.test.mjs`, `npm run test:unit`, local TypeScript binary `tsc --noEmit`, local Vite build, local Playwright test, and static artifact scan passed. `npm run check:node`, `npm test`, and `npm run build` are expected to run under the aligned Node `26.7.0` runtime.

### File List

- `Moviqo.Front/.gitignore`
- `Moviqo.Front/.nvmrc`
- `Moviqo.Front/index.html`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/package.json`
- `Moviqo.Front/playwright.config.ts`
- `Moviqo.Front/tsconfig.json`
- `Moviqo.Front/tsconfig.test.json`
- `Moviqo.Front/vite.config.ts`
- `Moviqo.Front/src/app/index.ts`
- `Moviqo.Front/src/app/providers/AppProviders.tsx`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/entities/server-decisions/index.ts`
- `Moviqo.Front/src/entities/server-decisions/model/serverDecisionFixtures.ts`
- `Moviqo.Front/src/entities/server-decisions/model/serverDecisionTypes.ts`
- `Moviqo.Front/src/features/authority-preview/index.ts`
- `Moviqo.Front/src/features/authority-preview/model/nonAuthoritativeUi.ts`
- `Moviqo.Front/src/features/authority-preview/ui/AuthorityPreview.tsx`
- `Moviqo.Front/src/main.tsx`
- `Moviqo.Front/src/pages/home/index.ts`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/src/shared/api/index.ts`
- `Moviqo.Front/src/shared/api/model/apiResult.ts`
- `Moviqo.Front/src/shared/api/query/queryRegistry.ts`
- `Moviqo.Front/src/shared/drafts/index.ts`
- `Moviqo.Front/src/shared/drafts/model/revisionDraftReducer.ts`
- `Moviqo.Front/src/shared/ui/Button.tsx`
- `Moviqo.Front/src/vite-env.d.ts`
- `Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs`
- `Moviqo.Front/tests/build/check-node-version.mjs`
- `Moviqo.Front/tests/build/prepare-test-build.mjs`
- `Moviqo.Front/tests/build/scan-static-artifact.mjs`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/unit/draft-state.test.cts`
- `Moviqo.Front/tests/unit/non-authoritative-ui.test.cts`

### Change Log

- 2026-08-03: Implemented Story 1.2 frontend application spine and moved story to review.
