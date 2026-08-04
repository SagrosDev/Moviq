---
epic: 1
story: 18
title: Connect Landing Conversion to Registration and Sign-In
status: done
baseline_commit: 6da6fae547a86f5abb5802b82477d38cabc8af4e
completion_note: Ultimate context engine analysis completed - comprehensive developer guide created
---

# Story 1.18: Connect Landing Conversion to Registration and Sign-In

Status: done

## Story

As an interested visitor,
I want clear routes to registration, sign-in, support, and beta terms,
so that I can enter the correct environment with informed expectations.

## Acceptance Criteria

1. **Environment-safe conversion routes.** Given environment-specific registration and sign-in destinations, when a visitor activates `Start Free Beta` or `Sign In`, then the browser reaches the matching environment's application route and never a development, preview, or production destination from another environment. Registration preserves the visitor's selected interface language. Traceability: FR471, FR472, FR473, FR476.
2. **Public/authenticated boundary.** Given an unauthenticated visitor uses the public page or a copied landing link, then no Workflow, Task, Process, Process Data, file, dashboard, audit, or Organization detail is returned; starting a production Process still requires an authenticated active Membership. Traceability: FR474.
3. **Beta disclosure before registration.** Given the limited free-beta disclosure, when the visitor reviews it before registration, then it states that free beta is not a permanent price guarantee and links to the environment-appropriate beta terms, privacy notice, prohibited-data guidance, and support email. It makes no live-chat, ticket-portal, or formal support-response SLA promise. Traceability: FR475.
4. **Registration continuity.** Selecting `Start Free Beta` reaches the existing Organization registration and verified-email journey without requiring the visitor to search for the next action or re-enter campaign information unnecessarily. Traceability: FR476, FR491-FR495.

## Tasks / Subtasks

- [x] Define one public configuration contract for each deployable environment (AC: 1, 3)
  - [x] Provide registration and sign-in destinations for the environment's own application route, with safe local fallbacks for development.
  - [x] Provide beta-terms, privacy, prohibited-data, and support-email destinations from the environment's deployable public content/configuration.
  - [x] Keep public configuration free of credentials, tokens, private application URLs, or customer data.
- [x] Complete landing conversion links using the existing `HomePage`, `landingContent`, and metadata/configuration seam (AC: 1, 3, 4)
  - [x] Keep `Start Free Beta` prominent and ensure every landing CTA resolves to the registration flow.
  - [x] Ensure `Sign In` is visible and resolves to the authentication flow.
  - [x] Preserve the selected `es`/`en` preference when navigating to registration; do not introduce a second language store. If a cross-origin application destination is required by deployment, carry locale through an explicit allowlisted mechanism and verify it is consumed by `LanguageProvider`.
  - [x] Render configured legal/support links only when valid and make the support link an email channel; never fabricate unavailable destinations.
- [x] Harden environment and URL validation (AC: 1, 2, 3)
  - [x] Reject open redirects, unsupported protocols, arbitrary hosts, and routes outside the intended registration/sign-in paths.
  - [x] Ensure each built landing artifact references only its matching environment; do not infer environment from a user-controlled query string or referrer.
  - [x] Keep the public root route unauthenticated and do not add any protected resource query or process-start behavior to the landing page.
- [x] Add focused unit, integration/contract, and Playwright coverage (AC: 1-4)
  - [x] Test valid and invalid destination configuration, same-environment routing, and absence of cross-environment/open-redirect behavior.
  - [x] Test Spanish and English CTA labels, language continuity into registration, and registration-to-verification next-action continuity.
  - [x] Test all required beta/legal/support links and assert that unsupported support promises are absent.
  - [x] Test direct `/`, `/register`, and `/sign-in` navigation as unauthenticated; assert no protected data is present and no Process can start without Membership authentication.

## Dev Notes

### Current implementation to extend

- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` already renders the public landing CTAs and reads `moviqo-*` metadata. Its `configuredDestination` helper currently accepts same-origin route fallbacks for `/register` and `/sign-in`, and valid `http:`, `https:`, or `mailto:` links for optional documents/support. Preserve the fail-closed behavior and tighten it only where required by this story.
- `Moviqo.Front/src/pages/home/model/landingContent.ts` owns bilingual landing copy and currently defines `/register` and `/sign-in` fallbacks while optional beta/legal/support destinations are empty. Do not duplicate these values in page components.
- `Moviqo.Front/src/shared/localization/LanguageProvider.tsx` and `storage.ts` persist the selected language under `moviqo.language`; `RegistrationPage` and `SignInPage` already use the shared `LanguageSelector`. Reuse this mechanism.
- `Moviqo.Front/src/app/ui/App.tsx` maps `/` to `HomePage`, `/register` to `RegistrationPage`, and `/sign-in` to `SignInPage`. The existing root behavior must remain public and must not expose the `EnvironmentBanner` or authenticated application data.
- The existing registration implementation already owns the first Organization/Owner form and verification handoff. This story connects to it; it does not reimplement registration, verification, sessions, or backend authorization.

### Architecture compliance

- **AD-7:** Server-side identity, authorization, session, CSRF, and generated API contracts remain authoritative. Landing links are navigation only; never authorize or start a Process in the browser.
- **AD-9:** Keep the feature-sliced SPA dependency direction (`app → pages → features → entities → shared`). Landing configuration belongs in the existing home model/configuration seam; do not add page-to-page coupling or a new router.
- **AD-11:** Build one static SPA artifact per isolated environment. Environment-specific public values may be injected at build/deploy time, but must not include secrets. Firebase `/api/**` must continue to target only the matching backend and authenticated/session responses must not be cached.
- **AD-12:** Do not emit campaign values, email addresses, tokens, private links, or Process Data into logs/telemetry. If conversion measurement is present, use only the privacy-safe policy from the later landing measurement story; analytics is not required to complete this story.
- **AD-16:** Use red → green → refactor. Critical conversion and boundary paths require Playwright evidence; URL/configuration logic gets focused unit tests.

### Environment/configuration guardrails

- Current Vite configuration exposes only variables with the custom `VITE_CLIENT_` prefix (`Moviqo.Front/vite.config.ts`). Any build-time public setting must follow that boundary and be typed in `Moviqo.Front/src/vite-env.d.ts`; never expose server-prefixed or secret values.
- Prefer the existing generated `index.html` metadata contract unless a deployment change demonstrably requires another public configuration mechanism. If changing it, preserve validation and document the exact per-environment inputs in infrastructure/deployment artifacts.
- Vite replaces exposed variables at build time and exposes them in the client bundle; they are public, not secrets. See [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode). Environment selection must be a deployment concern, never user input.
- The UAT environment is synthetic-only and must not receive production-like identifiers or destinations. Preserve `Moviqo.Infrastructure/operations/validate_uat.py` release-gate expectations and the UAT host declarations.

### UX and content requirements

- Spanish remains the default/fallback locale; English must be complete for all new landing-owned copy. The visible selector must continue to work on the equivalent landing page/section.
- Use the existing patient-colleague voice, semantic links, visible focus, keyboard operation, meaningful labels, and readable contrast. Do not make support, terms, or conversion information available only through color or hover.
- The disclosure must say “limited free beta” and explicitly avoid a permanent free-price guarantee. Do not claim live chat, a ticket portal, or a response SLA. Do not add anonymous/public Process initiation.
- Preserve the truthful fictional/sample/demo boundaries established by Story 1.17.

### Suggested file structure

Likely updates (confirm exact names before editing):

- `Moviqo.Front/index.html` and/or deployment content/configuration for public environment destinations and beta/legal/support links.
- `Moviqo.Front/src/pages/home/model/landingContent.ts` for any new bilingual link/disclosure copy or typed configuration.
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` for conversion/link behavior and validation.
- `Moviqo.Front/src/shared/localization/LanguageProvider.tsx`, `storage.ts`, or a small shared navigation helper only if locale continuity cannot be proven through the existing persistence.
- `Moviqo.Front/src/app/ui/App.tsx` only if route handling needs a minimal safe correction; do not replace the existing route composition.
- `Moviqo.Front/tests/unit/landing-content.test.cts`, `Moviqo.Front/tests/e2e/app-shell.spec.ts`, plus a focused configuration test if needed.
- `Moviqo.Infrastructure/*` only when required to bind environment-specific public configuration; do not change backend topology or secrets wiring for this frontend story.

### Testing requirements

- Run focused frontend unit/typecheck and Playwright tests first, then the repository frontend architecture/build/static-artifact checks.
- Assert negative properties: no cross-environment destination, no open redirect, no unsupported URL scheme, no protected data on public routes, no anonymous Process start, no secret in the static artifact, and no unsupported support promise.
- Verify both locales and direct navigation (not only clicks), including copied `/` links and browser reloads. Verify language remains selected when the visitor enters `/register` and `/sign-in`.
- Do not use mocks to claim backend authorization. Existing authenticated route/API tests and server Membership authorization remain the evidence for protected Process behavior.

### Project Structure Notes

- This is a frontend/deployment integration story following Story 1.17. Reuse the existing landing, localization, registration, sign-in, and metadata seams; avoid adding dependencies or a general-purpose navigation framework.
- `AGENTS.md` requires new frontend functions in `Moviqo.Front/src/**/*.{ts,tsx}` and frontend tests/build scripts to use arrow-function constants. Follow that rule for all new code.
- No repository `project-context.md` was found during activation; `AGENTS.md`, the architecture spine, and existing story conventions are authoritative.

### Previous Story Intelligence

- Story 1.17 added the public bilingual landing and deliberately introduced safe configurable CTA/document metadata. Its review fixed invalid route acceptance, unsupported guarantees, incomplete bilingual metadata, and dead/fabricated links. Preserve those fixes.
- Story 1.17's current CTA fallbacks are `/register` and `/sign-in`; optional legal/support links are omitted when configuration is empty. This story must make the deployed environment supply truthful destinations rather than hard-code invented URLs.
- Story 1.16 established the shared localization, safe Problem Details, and auth page patterns. Do not bypass those patterns or return raw navigation/configuration errors to users.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.18]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Sections 0.3, 11.2, 12.2, and FR-471–FR-476]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`, FR471–FR476]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-9, AD-11, AD-12, AD-16, Environment Gates, Consistency Conventions]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Foundation, Information Architecture, Accessibility Floor]
- [Source: `_bmad-output/implementation-artifacts/1-17-publish-truthful-bilingual-landing-content.md`]
- [Source: `Moviqo.Front/src/pages/home/ui/HomePage.tsx`]
- [Source: `Moviqo.Front/src/pages/home/model/landingContent.ts`]
- [Source: `Moviqo.Front/src/shared/localization/LanguageProvider.tsx`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `AGENTS.md`]
- [Vite environment variables and modes](https://vite.dev/guide/env-and-mode)

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

- Workflow customization resolver could not run because `python3` is unavailable; base customization was applied directly. No team or user override file exists.
- No repository `project-context.md` was found.
- Recent implementation history: Story 1.17 landing work is merged on `main`; current HEAD is `6da6fae`.
- Story branch preflight completed on `story/1-18-connect-landing-conversion-to-registration-and-sign-in`; existing worktree changes were preserved.

### Implementation Plan

- Kept the existing metadata seam as the public environment contract and added an explicit public-origin allowlist for document links.
- Made application destinations same-origin and path-bound, and restricted support destinations to validated `mailto:` links.
- Preserved shared localization storage for CTA continuity and added unit plus Playwright coverage for route safety and public boundaries.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented environment-safe CTA/document/support destination validation and explicit bilingual limited-beta price disclosure.
- Verified with frontend unit, architecture, API-client, typecheck, build/static-artifact, and Chromium Playwright suites.
- Contexted from Epic 1, PRD requirements FR471–FR476, architecture/UX artifacts, Story 1.17 and 1.16 learnings, current landing/auth/localization source, infrastructure configuration, AGENTS.md, and current Vite guidance.

### File List

- `_bmad-output/implementation-artifacts/1-18-connect-landing-conversion-to-registration-and-sign-in.md`
- `Moviqo.Front/index.html`
- `Moviqo.Front/public/legal/beta-terms.html`
- `Moviqo.Front/public/legal/privacy-notice.html`
- `Moviqo.Front/public/legal/prohibited-data.html`
- `Moviqo.Front/src/pages/home/model/landingContent.ts`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/tests/unit/landing-content.test.cts`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`

### Change Log

- 2026-08-04: Connected landing conversion with environment-safe public configuration, locale continuity coverage, and support/legal link validation; status moved to review.

### Review Findings

- [x] [Review][Patch][High] Required beta/legal/support destinations were absent from the deployable artifact [Moviqo.Front/index.html:10-14; Moviqo.Front/src/pages/home/ui/HomePage.tsx:159-162] — AC 3 requires links to environment-appropriate beta terms, privacy notice, prohibited-data guidance, and a support email. The public artifact now supplies three same-origin guidance documents and the configured beta support email; the added pages are intentionally bounded and avoid unsupported guarantees.
- [x] [Review][Patch][High] Cross-origin registration and sign-in destinations were rejected [Moviqo.Front/src/pages/home/ui/HomePage.tsx:25-28,50-53] — AC 1 now accepts only explicitly allowlisted application origins and carries a validated `lang` query parameter; the registration/sign-in provider consumes that parameter for locale continuity.
- [x] [Review][Patch][Medium] Public-boundary coverage did not verify protected-data or anonymous-process behavior [Moviqo.Front/tests/e2e/app-shell.spec.ts:63-74] — The E2E coverage now checks direct public registration navigation, absence of process-start controls, and that no non-authentication API v1 requests occur on public routes.
