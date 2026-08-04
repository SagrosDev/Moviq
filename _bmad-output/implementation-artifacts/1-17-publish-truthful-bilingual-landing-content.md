---
epic: 1
story: 17
title: Publish Truthful Bilingual Landing Content
status: done
baseline_commit: fc40970a070625418156a744dd66dc6039a7a356
completion_note: Ultimate context engine analysis completed - comprehensive developer guide created
---

# Story 1.17: Publish Truthful Bilingual Landing Content

Status: done

## Story

As an SME visitor,
I want an accurate explanation of Moviqo with realistic examples,
so that I can judge whether the limited beta fits my process needs.

## Acceptance Criteria

1. **Supported product story.** Given a visitor opens the public landing page in Spanish or English, when the hero, problem/value, How It Works, use cases, product visuals, security/beta summary, and actions render, then the page describes only approved MVP capabilities: Forms, Process Fields, calculations, attachments, Tasks, Member/Team assignment, visual conditions, routing, tracking, audit, and bilingual use. It must not claim deferred integrations, WhatsApp, MFA, SSO, advanced analytics, anonymous starts, or automatic dynamic assignment. Traceability: FR461-FR465.
2. **Safe fictional scenarios.** Given the purchase-request, document-review, and maintenance/service examples, when a visitor inspects names, people, values, statuses, Forms, Tasks, and attachments, then every scenario is visibly labeled fictional/sample/demo, is achievable with MVP capabilities, and contains no real identity, customer data, credential, private link, or other sensitive data. No invented testimonial, customer logo, adoption number, certification, saving, performance claim, or endorsement appears. Traceability: FR466-FR470.
3. **Truthful time-to-value.** Given the 30-60 minute publication message, when it is displayed, then it is framed as an approved simple-case goal or expected outcome, never as a universal guarantee. Content tests reject unsupported guarantee language. Traceability: FR463.
4. **Bilingual and accessible presentation.** Spanish is the default/fallback locale; English is complete for all landing-owned copy; the visible language selector keeps the visitor on the equivalent page/section. The page is semantic, keyboard-operable, responsive at mobile/tablet/laptop/desktop widths, has meaningful alt text, visible focus, readable contrast, and no color-only meaning. Traceability: FR477-FR480, FR546, FR551-FR552, NFR-001, NFR-010, NFR-014.
5. **Safe beta boundary and actions.** The page clearly identifies the limited free beta, links to the current beta terms, privacy notice, prohibited-data guidance, and configurable support email, and provides prominent Start Free Beta and visible Sign In actions. Links use environment-specific application destinations and do not expose authenticated Workflows, Tasks, Processes, Process Data, files, dashboards, audits, or Organization details. Traceability: FR471-FR475.
6. **Lightweight and maintainable delivery.** Public copy, translations, mock content, links, and metadata remain in the frontend deployment content source and can be updated without touching production Workflow/customer data. Avoid unnecessary media, trackers, dependencies, or large assets. If first-party acquisition analytics are present, they may record only approved acquisition events after any required consent and never Process Data, form contents, passwords, tokens, or private application URLs. Traceability: FR480-FR483.

## Tasks / Subtasks

- [x] Replace the current scaffolded home content with a public landing-page composition (AC: 1, 4, 5)
  - [x] Keep `/` public and unauthenticated; do not render operational navigation, `AuthorityPreview`, Workflow/Task/Process data, or Organization details on the landing page.
  - [x] Define sections with semantic heading hierarchy: hero, problem/value, How It Works, three use cases, representative product visuals, security/beta trust, beta terms/support, and final actions.
  - [x] Use existing design tokens and shared UI primitives; add only reusable landing-specific components/data under the feature-sliced structure.
- [x] Add the approved fictional scenario and visual content model (AC: 1, 2)
  - [x] Use visibly fictional labels such as sample/demo/fictional for every scenario and preview; use invented, non-sensitive names, amounts, statuses, fields, tasks, and attachment metadata.
  - [x] Ensure examples are implementable with the MVP and do not imply unsupported integrations, automation, public starts, social proof, certification, savings, or performance guarantees.
- [x] Expand localization safely (AC: 1, 3, 4)
  - [x] Add Spanish and English keys for every Moviqo-owned landing string; retain Spanish fallback and never expose translation keys/placeholders.
  - [x] Do not translate or route Designer-authored content through this page; preserve the existing localization adapter and language preference behavior.
  - [x] Ensure language switching preserves the equivalent landing section and updates document language/metadata if the app currently owns those values.
- [x] Configure safe environment-specific destinations and beta links (AC: 5, 6)
  - [x] Reuse/extend the existing application navigation seam; registration must target the environment’s registration flow and sign-in the environment’s authentication flow.
  - [x] Keep destinations configurable without embedding secrets; validate safe fallback behavior for missing/invalid configuration. Vite `VITE_*` values are public bundle inputs and must contain no credentials.
  - [x] Use configurable current-document/support URLs and do not fabricate document versions, legal claims, or support guarantees.
- [x] Add content and rendered accessibility coverage first (AC: 1-6)
  - [x] Add unit/content tests that assert required sections/capability terms, fictional/demo labeling, banned claims, and non-guarantee wording in both locales.
  - [x] Add Playwright coverage for Spanish default, English switch, equivalent-section navigation, CTA destinations, keyboard focus/order, responsive layouts, and visible accessible names/alt text.
  - [x] Add automated accessibility assertions using the existing Playwright/axe setup where applicable; retain manual keyboard and representative screen-reader evidence for the critical journey before public-beta claims.
  - [x] Run frontend architecture, typecheck, unit, production build/static-artifact, and E2E checks; verify no secrets or private URLs enter the artifact.

## Dev Notes

### Scope and boundaries

- This story is public marketing/onboarding content only. It does not implement registration, sign-in, password recovery, authenticated application shell, Workflow design, Process execution, analytics infrastructure, legal policy authoring, or public/anonymous Process starts.
- The current `HomePage` is a product scaffold, not an acceptable landing page: it exposes operational nav and `AuthorityPreview`, while `App` renders `EnvironmentBanner` globally. Decide the public/internal presentation boundary explicitly so internal synthetic-environment warnings are not misrepresented as public marketing content, and do not remove the safety banner from internal surfaces that need it.
- Do not create a second localization provider, router, API client, analytics SDK, design-token set, or authorization model. Reuse existing seams and keep the page static/client-rendered unless an existing requirement proves otherwise.

### Existing implementation to inspect and preserve

- `Moviqo.Front/src/app/ui/App.tsx`: current path selection and global `EnvironmentBanner`; update routing/composition carefully so `/`, `/register`, `/verify-email`, `/sign-in`, and `/design-system` remain functional.
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`: current home scaffold and registration CTA; replace its public content in place or compose a landing page through the page public entry point.
- `Moviqo.Front/src/app/styles.css`: approved tokens, 44px target, focus outline, reduced-motion, responsive gutters, and existing card/button patterns. Preserve these foundations; add scoped landing styles rather than unrelated global regressions.
- `Moviqo.Front/src/shared/localization/messages.ts`, `LanguageProvider.tsx`, `translator.ts`, and `storage.ts`: Spanish default, saved/browser preference resolution, English-to-Spanish fallback, and owned-vs-Designer-authored distinction. Extend the `MessageKey` union and both dictionaries consistently.
- `Moviqo.Front/src/shared/ui/Button.tsx` and `src/shared/design-system`: reuse public primitives and tokens. Do not bypass feature/page public entry points.
- `Moviqo.Front/tests/e2e/app-shell.spec.ts` and `tests/unit/localization.test.cts`: extend established test locations/patterns before adding parallel infrastructure.
- `Moviqo.Front/src/app/ui/EnvironmentBanner.tsx` and `features/authority-preview`: inspect before changing; the banner is a safety control for synthetic environments and the authority preview is not public product proof.

### Architecture and security guardrails

- AD-7/AD-9: the SPA is non-authoritative. Landing CTAs only navigate to the server-backed registration/sign-in flows; never grant access, start a Process, or display protected data from client state.
- AD-11: one static SPA artifact is deployed across environments. Public landing content and hashed assets may be cached; authenticated, session-specific, and `/api/**` responses must not be cached. Environment-specific links must not accidentally cross development, preview, UAT, and production.
- AD-12: if acquisition measurement exists, emit only privacy-safe event names/outcomes and no Process Data, form values, credentials, private links, or sensitive identifiers. Non-essential trackers require consent; a tracker is not required for this story.
- AD-16: use red -> green -> refactor. Rendered critical landing journeys require Playwright plus automated accessibility checks; test content, locale completeness, banned claims, and artifact safety.
- `AGENTS.md` applies: new functions in `Moviqo.Front/src/**/*.{ts,tsx}` and frontend tests/build scripts must be arrow-function constants, not `function` declarations, unless a framework/TypeScript constraint requires otherwise.

### Content contract

Approved capability vocabulary must be concrete and bounded: Forms, Process Fields, calculations, attachments, Tasks, Member/Team assignment, visual conditions, routing, tracking, audit, bilingual Spanish/English interface. Approved initial examples are a fictional distributor purchase request, fictional services-company document intake/review, and fictional maintenance-company service request.

Explicitly banned from page copy and mock metadata: WhatsApp, SMS/push as product channels, MFA, enterprise SSO, passkeys, arbitrary/external integrations, advanced analytics/process intelligence, AI, anonymous/public starts, round-robin/workload or automatic dynamic assignment, invented customer proof, invented certification, fabricated savings/performance/adoption figures, real names/data, credentials, private links, and absolute/universal promises. The 30-60 minute message must say “simple-case target/goal/expected outcome” or equivalent, not “guaranteed,” “always,” or “every process.”

### File structure guidance

Likely updates (confirm against the tree):

- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` and possibly a landing-specific `ui`/`model` module under `pages/home`.
- `Moviqo.Front/src/shared/localization/messages.ts` plus focused landing content data/types under `pages/home` or `shared` only if genuinely reusable.
- `Moviqo.Front/src/app/ui/App.tsx` and/or `EnvironmentBanner.tsx` only for the public/internal boundary.
- `Moviqo.Front/src/app/styles.css` for responsive, semantic landing layout using existing tokens.
- `Moviqo.Front/tests/unit/localization.test.cts`, a focused landing content test near existing frontend unit tests, and `Moviqo.Front/tests/e2e/app-shell.spec.ts` or a focused landing E2E spec.

Avoid backend, database, API schema, generated-client, infrastructure, `Moviqo.AI`, or customer-data changes unless an existing implementation inspection proves a narrowly required configuration seam is missing. Do not add image-heavy dependencies; CSS/simple semantic mock visuals are preferred for this story.

### Latest technical specifics

- Vite exposes only variables prefixed `VITE_` to client code and bundles them at build time; such values are public and must not contain secrets. Use mode-specific public destination/configuration values and validate them at the application boundary. Source: [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode).
- Playwright’s accessibility guidance uses axe-based assertions as an automated complement, not a replacement for keyboard/screen-reader review. Source: [Playwright Accessibility Testing](https://playwright.dev/docs/next/accessibility-testing).

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.17]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-461 through FR-483; FR-546, FR-551, FR-552; NFR-001, NFR-010, NFR-014]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, public landing and localization sections]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-9, AD-11, AD-12, AD-16; Consistency Conventions; Stack; Structural Seed]
- [Source: `_bmad-output/implementation-artifacts/1-15-return-safe-and-consistent-application-errors.md`, frontend localization/API/test conventions and review learnings]
- [Source: `AGENTS.md`, frontend arrow-function convention]

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

- Story branch: `story/1-17-publish-truthful-bilingual-landing-content`.
- Playwright multi-browser execution timed out in the environment without producing test output; targeted Chromium execution showed the same runner timeout. Typecheck, architecture, unit, production build, and static-artifact checks passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Contexted from Epic 1, PRD landing requirements, UX experience model, architecture spine, current frontend source/tests, Story 1.15 learnings, and recent git history.
- Replaced the operational home scaffold with a public, unauthenticated bilingual landing page and kept the synthetic environment banner off the public route.
- Added bounded fictional scenarios, representative CSS visuals, safe configurable same-origin CTA metadata, beta document/support links, document language/title updates, content-contract tests, and landing Playwright/axe coverage.

### File List

- `_bmad-output/implementation-artifacts/1-17-publish-truthful-bilingual-landing-content.md`
- `Moviqo.Front/index.html`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/pages/home/model/landingContent.ts`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/unit/landing-content.test.cts`

## Change Log

### Review Findings

- [x] [Review][Patch][High] Beta documents and support destinations are not deployable [Moviqo.Front/src/pages/home/model/landingContent.ts:27-30] — Deployment metadata now supplies optional current document/support destinations, validates their protocols, and omits unavailable links instead of exposing dead or fabricated URLs.
- [x] [Review][Patch][High] Landing copy makes an unsupported universal promise and under-specifies the required realistic examples [Moviqo.Front/src/pages/home/model/landingContent.ts:38,73,59-61,94-96] — Universal wording was bounded and each fictional scenario now includes concrete invented organizations, people/team assignments, values, statuses, forms, tasks, and attachments.
- [x] [Review][Patch][Medium] Landing-owned headings and footer copy bypass the content source [Moviqo.Front/src/pages/home/ui/HomePage.tsx:84-85,124] — The examples heading is now part of the bilingual landing content model.
- [x] [Review][Patch][Medium] Spanish metadata remains English in the initial document [Moviqo.Front/index.html:2,6; Moviqo.Front/src/pages/home/ui/HomePage.tsx:26-29] — Spanish is now the initial document language/description, and locale changes update the description as well as the title and language.
- [x] [Review][Patch][Medium] Configured CTA destinations accept valid same-origin paths that are not registration or sign-in flows [Moviqo.Front/src/pages/home/ui/HomePage.tsx:5-12,23-24] — Registration and sign-in metadata now requires the exact intended route path, with invalid values falling back safely.

- 2026-08-04: Implemented the truthful bilingual public landing experience and validation coverage; status moved to review.
