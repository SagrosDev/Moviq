---
baseline_commit: 6c0659d
status: done
---

# Story 1.4: Establish the Accessible Bilingual Design Foundation

Status: done

## Story

As a Moviqo user,
I want a consistent Spanish-first interface with English available,
so that the first journey is understandable and operable across supported devices.

## Acceptance Criteria

1. **Given** the application is rendered in either supported language
   **When** a Moviqo-owned label, instruction, validation message, status, or navigation item is requested
   **Then** Spanish and English resources exist, the user's language is used, and a missing English entry falls back to Spanish without altering Designer-authored content
   **And** language selection is keyboard accessible and persists for the user.

2. **Given** the design-system reference page
   **When** automated visual and accessibility checks run
   **Then** the approved color, typography, spacing, gutter, radius, focus, reduced-motion, and minimum practical 44x44 CSS-pixel target tokens are demonstrated
   **And** contrast is at least 4.5:1 for normal text/controls and 3:1 for large text, focus indicators, and meaningful non-text states.

3. **Given** a representative primary button, guidance card, form field, guided step, workflow element, task card, assignment control, publish checklist, and timeline
   **When** each component is operated by keyboard and inspected through its accessible tree
   **Then** it exposes the specified content hierarchy, plain-language action, visible focus, semantic name/state, and non-color-only status
   **And** the component catalog records responsive behavior and its permitted authorization-safe content.

4. **Given** a supported mobile, tablet, laptop, or desktop viewport
   **When** an operational surface is resized to 200% text or a Designer surface is opened below its supported authoring width
   **Then** operational content reflows without loss of required action, while narrow Designer layouts provide view/light navigation and do not claim authoring support
   **And** automated checks use the current and previous stable major versions of Chrome, Edge, Firefox, and Safari.

## Tasks / Subtasks

- [x] Establish the shared localization foundation (AC: 1)
  - [x] Add a feature-sliced-safe localization module under `Moviqo.Front/src/shared/` with typed Moviqo-owned message keys, Spanish default resources, English resources, and Spanish fallback behavior for missing English entries.
  - [x] Add a language provider at the app/provider boundary that resolves saved user preference first, then valid browser/user seed preference if available, then Spanish.
  - [x] Add a keyboard-accessible language selector that persists the selected language locally until user-profile persistence exists; keep the persistence adapter isolated so later user preference APIs can replace it.
  - [x] Add tests proving Moviqo-owned labels, navigation, statuses, validation/help text, and component catalog copy resolve in Spanish and English, and that missing English entries render Spanish text instead of internal keys.
  - [x] Preserve Designer-authored content verbatim by never sending workflow/form names, labels, instructions, choice labels, validation messages, instance states, or notification text through the Moviqo-owned translation catalog.
- [x] Replace the scaffold visual shell with approved design tokens (AC: 2)
  - [x] Create shared design tokens for the approved palette, typography, spacing, gutters, radii, focus indicators, reduced-motion behavior, and practical minimum target size.
  - [x] Update `src/app/styles.css` and shared UI primitives to use these tokens rather than the current scaffold colors (`#f7f5ef`, `#006d77`, `#17211b`) where they conflict with `DESIGN.md`.
  - [x] Keep the interface calm and work-focused: no literal wave imagery, decorative gradients, one-note color treatment, or color-only statuses.
  - [x] Add automated contrast checks or deterministic unit assertions for the token pairs used by text, controls, focus indicators, and meaningful non-text state indicators.
  - [x] Respect `prefers-reduced-motion`; motion may clarify but must never carry required meaning.
- [x] Build the design-system reference page/catalog (AC: 2, 3)
  - [x] Add a route/page under `src/pages/` that demonstrates the design foundation and component catalog without bypassing feature-sliced dependency rules.
  - [x] Implement representative shared UI/catalog components: primary button, guidance card, form field, guided step, workflow element, task card, assignment control, publish checklist, and timeline.
  - [x] Ensure each component has semantic names/states, visible focus, non-color-only status, and plain-language action text in both languages.
  - [x] Document responsive behavior and permitted authorization-safe content in code-adjacent catalog data or typed fixtures consumed by the page/tests; do not put unrestricted Process Data examples in the catalog.
  - [x] Keep components presentational or demo-backed only. Do not implement registration, authentication, Workflow authoring, Task completion, server authorization, or runtime semantics in this story.
- [x] Extend accessibility and responsive verification (AC: 2, 3, 4)
  - [x] Add Playwright coverage for keyboard traversal, semantic landmarks/headings, focus visibility, language switching, component accessible names/states, and 200% text operation.
  - [x] Add axe-core or equivalent automated accessibility checks scoped to the design-system page using WCAG 2.2 A/AA-relevant tags; treat the result as baseline evidence, not a formal conformance claim.
  - [x] Expand Playwright projects beyond the current Chromium-only config to cover representative desktop Chrome, Edge-equivalent Chromium, Firefox, WebKit/Safari, plus mobile/tablet operational viewports.
  - [x] Verify that operational surfaces reflow on mobile/tablet/laptop/desktop and that narrow Designer/catalog authoring examples explicitly provide view/light navigation instead of claiming full authoring support.
  - [x] Store screenshots/traces/reports as ignored generated artifacts; do not commit Playwright report output unless explicitly approved.
- [x] Integrate the new evidence into the verification contract (AC: 1, 2, 3, 4)
  - [x] Add any required dependencies deliberately to `Moviqo.Front/package.json` and `package-lock.json`; keep Node 26.5.1 enforcement intact.
  - [x] Extend frontend unit, architecture, typecheck, build, and e2e scripts only through the existing frontend root.
  - [x] Update `.github/workflows/ci.yml` so CI runs the new localization, design-system, accessibility, and browser/viewport checks.
  - [x] Update `README.md` verification commands if scripts change.
  - [x] Preserve backend schema/client checks from Story 1.3 and frontend architecture guards from Story 1.2.

### Review Findings

- [x] [Review][Patch] Hard-coded English catalog metadata bypasses the localization catalog [Moviqo.Front/src/pages/design-system/ui/DesignSystemPage.tsx:53]
- [x] [Review][Patch] Direct design-system route has no keyboard-reachable language selector [Moviqo.Front/src/app/ui/App.tsx:10]
- [x] [Review][Patch] Assignment control catalog example is static and not keyboard-operable [Moviqo.Front/src/shared/ui/catalog.tsx:90]
- [x] [Review][Patch] Local language storage can crash rendering or switching when storage is unavailable [Moviqo.Front/src/shared/localization/storage.ts:32]
- [x] [Review][Patch] Form-field demo exposes a required error while the field is already populated [Moviqo.Front/src/shared/ui/catalog.tsx:35]
- [x] [Review][Patch] Shared Button lets caller className replace the accessibility-critical base class [Moviqo.Front/src/shared/ui/Button.tsx:9]

## Dev Notes

### Scope and boundaries

- This story establishes the accessible bilingual design foundation and representative component catalog. It is not a business-flow implementation story.
- Do not implement registration, authentication, user-profile APIs, Organization settings APIs, landing conversion, Workflow Designer behavior, Form runtime persistence, Task completion, server authorization, or Process timeline data loading here.
- Use the existing static React/Vite SPA under `Moviqo.Front/`. Do not add SSR, a Node server, backend-hosted frontend code, a second UI application, a second remote-state cache, AI, Redis, broker, microservice, or runtime business-rule engine.
- The language selector may persist locally only as a temporary adapter until later user preference stories provide server persistence. Keep the adapter easy to replace with generated `/api/v1` client calls.
- Designer-authored content is outside the Moviqo-owned translation catalog by requirement. The dev agent must create an explicit API/type boundary or helper naming that makes this hard to misuse.

### Current repo state to preserve

- `Moviqo.Front/src/app/ui/App.tsx` composes `AppProviders` and `HomePage`.
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` currently contains English-only scaffold text and primary navigation labels. Convert this shell to the localization/design foundation instead of creating a parallel home shell.
- `Moviqo.Front/src/app/styles.css` currently contains scaffold colors and global focus styles. Replace or refactor these into approved token usage while preserving semantic focus behavior.
- `Moviqo.Front/src/shared/ui/Button.tsx` is a minimal primitive. Extend shared UI primitives from this location/pattern rather than adding component implementations under `pages/`.
- `Moviqo.Front/playwright.config.ts` currently runs only Chromium. Extend it for browser and viewport coverage instead of creating a second Playwright config.
- `Moviqo.Front/tests/architecture/frontend-boundaries.test.mjs` already enforces `app -> pages -> features -> entities -> shared` and feature public entry imports. New localization, tokens, and components must pass those checks.
- Story 1.3 added generated API client code under `src/shared/api/` and CI stale checks. Do not move or weaken that seam.

### Localization requirements

- Spanish is the default and fallback language for Moviqo-owned public and authenticated interface content.
- Each Moviqo-owned navigation item, button, system status, validation feedback, error title/detail where represented in the frontend, confirmation, help text, and catalog label must have Spanish and English resources unless a test intentionally proves English fallback to Spanish.
- Missing application translations must never expose internal keys, template identifiers, TODO text, or developer placeholders.
- Stable error `code` values from the API remain contract identifiers and are not localized; user-facing titles/details can be localized later from safe codes.
- Designer-authored workflow/form/business text displays exactly as configured by the Designer. Do not auto-translate it, normalize its language, or use it as a translation key.
- The language selector must be reachable and operable by keyboard, expose its current state accessibly, and persist the chosen language for later page loads.

### Design-system requirements

- Approved tokens from `DESIGN.md`:
  - `surface-base #F7FBFA`, `surface-raised #FFFFFF`, `surface-soft #E7F3F1`
  - `ink-primary #173B3A`, `ink-secondary #55706E`, `ink-disabled #9AAEAB`
  - `primary #167C80`, `primary-foreground #FFFFFF`, `accent #D7A84B`
  - `border #C9DEDA`, `error #B54747`, `success #2E8063`
  - typography: system sans-serif; display 36px/600/1.15, heading 24px/600/1.25, body 16px/400/1.5, label 14px/600/1.35
  - spacing: 4, 8, 12, 16, 24, 32px; gutters 16px mobile and 32px desktop
  - radii: 6px fields, 10px controls, 16px guidance/major onboarding surfaces, 9999px only for status indicators or avatars
- Contrast targets: at least 4.5:1 for normal text and controls; at least 3:1 for large text, focus indicators, and meaningful non-text states.
- Interactive targets should be at least 44x44 CSS pixels where practical. If a compact target cannot meet that size, document the exception and keep it keyboard operable.
- Status, permission, validation, selected, disabled, and focus states must not rely on color alone.
- Use plain user language. Avoid technical labels such as node, topology, resolver, or graph in user-facing catalog examples unless they are clearly developer-only test names.

### Component catalog requirements

- Primary button: plain action verbs such as "Continuar", "Guardar borrador", or "Publicar flujo"; disabled/loading states must be named and non-color-only.
- Guidance card: one concept, one next action, dismissible/revisitable behavior represented if interactive.
- Form field: label, concise help, input, and inline validation in that order; placeholder must never replace the accessible label.
- Guided step: one decision per step with Back/Continue/Save draft/Skip only where safe.
- Workflow element: recognizable label and short explanation; visual distinction supports scanning without requiring color recognition.
- Task card: task name, workflow, status, assignee, and primary action; authorized details only.
- Assignment control: recipient type/name plus when work becomes available; no cross-Organization or inactive-user examples except safe blocked states.
- Publish checklist: plain-language issue rows with status text and direct configuration target.
- Timeline: actor, time, state, and task position; no restricted Process Field values or private data previews.

### Responsive and accessibility requirements

- Operational pages/components must work on supported mobile, tablet, laptop, and desktop layouts.
- Workflow/Form authoring remains optimized for laptop/desktop at 1280x720 CSS pixels or larger. Narrow Designer examples must offer view/light navigation and must not imply full authoring support.
- Support keyboard navigation, visible focus, semantic labels/headings, meaningful non-text alternatives, accessible validation feedback, state-change announcements where material, readable contrast, and 200% text enlargement without loss of required operation.
- Browser support follows the current and immediately previous stable major versions of Chrome, Edge, Firefox, and Safari at release time. In Playwright, use Chromium as Chrome/Edge-family coverage, Firefox, and WebKit as Safari-family coverage, with explicit notes where true branded browser validation remains manual/provider-limited.
- Do not claim formal WCAG conformance. Evidence should be described as the baseline required by NFR-014 through NFR-017.

### Latest technical notes

- Playwright Test supports `webServer` with `reuseExistingServer: !process.env.CI` and browser/device `projects`; extend the existing config rather than replacing it. Current docs show Chromium, Firefox, WebKit, and mobile device descriptors as the intended pattern.
- axe-core supports rule selection by tags including `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa`; there is no single tag that aggregates every WCAG version/level. Configure tags deliberately and report violations with rule ID, impact, and affected targets.
- Keep React 19.2.7, Vite 8.2.x, TypeScript 6.0.x, Playwright 1.62.x, and `@xyflow/react` 12.11.2 constraints from the Architecture Spine and existing `package.json` unless a compatibility issue is documented and approved.

### Previous story intelligence

- Story 1.1 established path discipline, deterministic build-input checks, secret exclusions, and fail-closed production settings. Apply the same discipline to generated Playwright reports, screenshots, traces, visual baselines, and any local language-preference storage.
- Story 1.2 established the frontend source tree, React/Vite static SPA, feature-sliced architecture tests, a single query registry, reducer-based draft primitives, and Playwright smoke coverage. Reuse those seams and extend the existing tests.
- Story 1.2 intentionally enforces Node 26.5.1. Do not weaken that guard.
- Story 1.3 established `/api/v1` schema/client generation, Problem Details, CI, and the `src/shared/api/` generated-client seam. This story should not create hand-maintained duplicate DTOs or bypass generated contracts.
- Recent commits show Story 1.3 was merged in `6c0659d`; CI and stale artifact checks are now part of the normal contract.

### Testing requirements

- Follow red -> green -> refactor for each behavior and guardrail.
- Required frontend evidence should include:
  - `npm run check:node`
  - `npm run test:architecture`
  - localization/unit tests for language resolution, fallback, persistence adapter, and Designer-content bypass
  - token/contrast tests for approved color pairs and target-size rules where deterministic
  - accessible component tests or Playwright assertions for names, states, focus, keyboard operation, and non-color-only statuses
  - `npm run check:api-client`
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:e2e`
- If browser installation is missing locally, record the exact blocked command and keep CI configured to run the full browser matrix.
- Backend checks are not expected unless the implementation changes shared API/schema behavior. If backend files are touched, run the Story 1.3 backend verification contract.

### Project Structure Notes

- Add localization, design tokens, and generic UI primitives under `Moviqo.Front/src/shared/`.
- Add route-level catalog composition under `Moviqo.Front/src/pages/`.
- Add feature behavior only when it represents a user intent and expose it through `src/features/<feature>/index.ts`.
- Keep tests under `Moviqo.Front/tests/unit`, `Moviqo.Front/tests/architecture`, and `Moviqo.Front/tests/e2e` as appropriate.
- Do not move backend, frontend, docs API, or CI files outside their existing roots.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.4]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-546 through FR-552]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, NFR-009 through NFR-017]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-9, AD-11, AD-12, AD-16, Stack, Consistency Conventions]
- [Source: `_bmad-output/implementation-artifacts/1-1-establish-the-backend-modular-spine.md`]
- [Source: `_bmad-output/implementation-artifacts/1-2-establish-the-frontend-application-spine.md`]
- [Source: `_bmad-output/implementation-artifacts/1-3-establish-the-api-error-build-and-test-contract.md`]
- [Playwright docs via Context7: projects, browser/device descriptors, `webServer`, `reuseExistingServer`]
- [axe-core docs via Context7: WCAG tag selection and violation reporting]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-08-03: Activated `bmad-dev-story`; resolver fallback used because `python3` is unavailable on Windows environment.
- 2026-08-03: Git branch preflight completed; created/switched to `story/1-4-establish-the-accessible-bilingual-design-foundation`.
- 2026-08-03: `npm install axe-core --save-dev` completed with the repo aligned to Node 26.5.1.
- 2026-08-03: Verification run: `npm run test:unit` passed.
- 2026-08-03: Verification run: `npm run test:architecture` passed.
- 2026-08-03: Verification run: `npm run check:api-client` passed; generated schema content remained unchanged.
- 2026-08-03: Verification run: `npx tsc --noEmit` passed.
- 2026-08-03: Guarded `npm run typecheck`, `npm run build`, and `npm run test:e2e` expect the aligned Node 26.5.1 runtime.
- 2026-08-03: Raw build verification passed with `npx vite build`; static artifact scan passed with `node ./tests/build/scan-static-artifact.mjs`.
- 2026-08-03: Installed missing Playwright Firefox/WebKit browsers with `npx playwright install chromium firefox webkit`.
- 2026-08-03: Full browser/viewport matrix passed with `npx playwright test` across 30 tests.
- 2026-08-03: Converted frontend source/test function declarations to arrow function constants; `npm run test:unit`, `npm run test:architecture`, `npx tsc --noEmit`, and `npx vite build` passed afterward.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status set to `ready-for-dev`.
- Implemented typed Spanish/English Moviqo-owned localization with Spanish fallback, isolated local language persistence, provider wiring at the app boundary, and explicit Designer-authored text bypass helpers.
- Replaced the scaffold shell styling with approved design tokens, accessible focus treatment, practical 44px targets, non-color-only statuses, and reduced-motion handling.
- Added the design-system catalog route and representative presentational components for button, guidance card, form field, guided step, workflow element, task card, assignment control, publish checklist, and timeline.
- Added deterministic localization/design-token unit tests and Playwright coverage for keyboard focus, language switching/persistence, semantic component states, axe baseline checks, 200% text, and mobile/tablet/desktop browser projects.
- Integrated `axe-core`, CI Playwright browser installation/e2e execution, and README verification updates while preserving Node 26.5.1 enforcement and existing API-client/architecture guards.
- Converted frontend functions in source and frontend test/build helper files to arrow function constants and added a repo-level agent instruction for future frontend implementation.

### File List

- .github/workflows/ci.yml
- AGENTS.md
- Moviqo.Front/package-lock.json
- Moviqo.Front/package.json
- Moviqo.Front/playwright.config.ts
- Moviqo.Front/src/app/providers/AppProviders.tsx
- Moviqo.Front/src/app/styles.css
- Moviqo.Front/src/app/ui/App.tsx
- Moviqo.Front/src/features/authority-preview/ui/AuthorityPreview.tsx
- Moviqo.Front/src/pages/design-system/index.ts
- Moviqo.Front/src/pages/design-system/ui/DesignSystemPage.tsx
- Moviqo.Front/src/pages/home/ui/HomePage.tsx
- Moviqo.Front/src/shared/design-system/catalogData.ts
- Moviqo.Front/src/shared/design-system/contrast.ts
- Moviqo.Front/src/shared/design-system/index.ts
- Moviqo.Front/src/shared/design-system/tokens.ts
- Moviqo.Front/src/shared/localization/LanguageProvider.tsx
- Moviqo.Front/src/shared/localization/LanguageSelector.tsx
- Moviqo.Front/src/shared/localization/index.ts
- Moviqo.Front/src/shared/localization/messages.ts
- Moviqo.Front/src/shared/localization/storage.ts
- Moviqo.Front/src/shared/localization/translator.ts
- Moviqo.Front/src/shared/ui/Button.tsx
- Moviqo.Front/src/shared/ui/catalog.tsx
- Moviqo.Front/tests/e2e/app-shell.spec.ts
- Moviqo.Front/tests/unit/design-system.test.cts
- Moviqo.Front/tests/unit/localization.test.cts
- README.md
- _bmad-output/implementation-artifacts/1-4-establish-the-accessible-bilingual-design-foundation.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-08-03: Created Story 1.4 context for accessible bilingual design foundation and moved story to ready-for-dev.
- 2026-08-03: Implemented accessible bilingual design foundation and moved story to review.
- 2026-08-03: Converted frontend function declarations to arrow function constants and documented the frontend function convention.
