---
epic: 1
story: 19
title: Deliver an Accessible, Measurable Landing Experience
status: done
baseline_commit: 2e5ed05ad8d9d6ae0ed0527013811f4034f3152c
completion_note: Ultimate context engine analysis completed - comprehensive developer guide created
---

# Story 1.19: Deliver an Accessible, Measurable Landing Experience

Status: done

## Story

As a mobile or desktop visitor,
I want a fast, accessible, shareable landing page in my selected language,
so that I can understand and reach Moviqo without unnecessary tracking.

## Acceptance Criteria

1. **Complete localized discovery metadata.** Given Spanish and English page variants, when localized copy, navigation, metadata, alternate-language links, title, and share description are inspected, each language is complete and discoverable, missing Moviqo-owned English text falls back to Spanish, and search/share metadata contains no misleading claim. Designer/customer data is never embedded. Traceability: FR477, FR479.
2. **Fast, responsive, accessible delivery.** Given the documented representative mobile-network/device profile, when the production landing build is measured, primary content and conversion actions become usable within approximately three seconds, assets are lightweight and cacheable, and the page remains operable by keyboard, touch, screen reader, and 200% text enlargement. Automated checks cover supported browser majors and required contrast/focus behavior. Traceability: FR478, FR480, NFR1, NFR9, NFR10, NFR14, NFR15.
3. **Privacy-safe optional measurement.** Given acquisition measurement is enabled, when a page view or conversion event is recorded, it contains only the privacy-safe event, language, campaign/referrer class, and coarse device/performance data approved by policy. No non-essential tracker runs before required consent, and the page remains usable when tracking is declined or blocked. Traceability: FR481, FR482.
4. **Content-source validation.** Given an authorized content maintainer changes landing copy or links, when the static content build validates, both languages, required sections, safe claims, application destinations, and legal/support links are checked before deployment. The change does not require modifying authenticated application logic. Traceability: FR483.

## Tasks / Subtasks

- [x] Establish the landing metadata contract in the existing public content/configuration seam (AC: 1, 4)
  - [x] Define localized `<title>`, description, canonical URL, `og:title`, `og:description`, `og:url`, `og:image` policy if an image is used, and `og:locale`/alternate locale metadata without unsupported claims.
  - [x] Keep Spanish as the default and fallback for Moviqo-owned strings; do not silently use English as a fallback or translate Designer-authored content.
  - [x] Make language selection update visible content and equivalent-page metadata without duplicating the existing `LanguageProvider`/`moviqo.language` store.
  - [x] Add `hreflang`/alternate-language links only when their URLs are valid and environment-safe; canonical and share URLs must not expose private application routes or user-controlled query strings.
  - [x] Preserve the environment-safe registration/sign-in/legal/support validation delivered in Story 1.18.
- [x] Harden responsive and accessible presentation using existing landing markup, tokens, and CSS (AC: 2)
  - [x] Preserve semantic heading order, landmarks, meaningful alternatives for visual mockups, visible focus, keyboard navigation, readable contrast, non-color state communication, and touch target sizing.
  - [x] Verify layouts at mobile, tablet, laptop, desktop, and 200% text enlargement; no required action or content may be lost to horizontal overflow.
  - [x] Respect reduced-motion preferences and avoid adding large media, decorative animation, font downloads, or dependencies without measured benefit.
  - [x] Keep the page usable when CSS, analytics, images, or optional metadata are unavailable.
- [x] Add privacy-safe measurement only if the repository’s policy/configuration enables it (AC: 3)
  - [x] Use first-party, minimal events for page view, language selection, use-case engagement, Start Free Beta, Sign In, registration start, and registration completion only where the event is already observable.
  - [x] Permit only event name, selected locale, coarse campaign/referrer class, and coarse device/performance data; never send Process Data, form values, email addresses, private URLs, passwords, tokens, or raw campaign identifiers.
  - [x] Gate all non-essential analytics/marketing scripts behind required consent. A blocked or declined tracker must not affect rendering, navigation, or conversion.
  - [x] Do not invent a consent UI or third-party provider when the repository has no approved policy/provider; a disabled measurement path is valid and must be documented/tested.
- [x] Add measurable performance and accessibility evidence (AC: 2, 3)
  - [x] Add/extend Playwright coverage for both locales, metadata, keyboard focus/order, direct reload/share entry, responsive viewports, 200% text, reduced motion, and absence of protected/customer data.
  - [x] Reuse the existing `axe-core` injection pattern in `tests/e2e/app-shell.spec.ts`; do not add `@axe-core/playwright` solely to duplicate the existing harness unless there is a concrete need.
  - [x] Add focused unit/build tests for fallback metadata, safe claims, valid destinations, safe event payloads, consent/blocked-tracker behavior, and static artifact leakage.
  - [x] Capture a production-build performance check under the documented representative profile, reporting the tested build/profile and failures rather than asserting an unmeasured guarantee.
- [x] Add static content quality gates (AC: 1, 4)
  - [x] Validate that both locales contain all required landing sections, localized navigation/CTA labels, metadata, legal/support links, and truthful beta wording.
  - [x] Reject unsupported claims, fabricated social proof, real/customer/Designer data, secrets, private links, unsupported schemes, cross-environment destinations, and tracker payload fields in the built artifact.
  - [x] Keep content/configuration changes isolated from authenticated application logic and preserve the existing feature-sliced dependency direction.

## Dev Notes

### Existing implementation to extend

- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` currently renders the complete public landing page, updates `document.documentElement.lang`, title, and description on language changes, and reads public destinations from metadata through `configuredMetaDestination`. Extend this seam rather than adding a new router, CMS, language store, or page-to-page coupling.
- `Moviqo.Front/src/pages/home/model/landingContent.ts` owns the `es`/`en` copy, scenarios, labels, CTA fallbacks, and legal/support destination defaults. Keep all landing-owned copy and validation inputs centralized here or in a small adjacent home-model module.
- `Moviqo.Front/index.html` is the current static metadata/public-configuration seam. Story 1.18 added environment-safe registration, sign-in, legal, prohibited-data, and support metadata. Preserve its fail-closed validation and do not place secrets in it.
- `Moviqo.Front/src/shared/localization/LanguageProvider.tsx` and `storage.ts` persist the selected locale under `moviqo.language`. Reuse them for metadata and locale continuity; do not introduce a second preference store.
- `Moviqo.Front/src/app/styles.css` contains the landing responsive layout, shared focus/reduced-motion rules, design tokens, and touch-target sizing. Read and extend the existing rules rather than replacing the design system.
- `Moviqo.Front/tests/e2e/app-shell.spec.ts` already injects `axe-core/axe.min.js`, tests keyboard focus, locale persistence, public boundaries, and safe CTAs. Extend these tests and keep new frontend test functions as arrow-function constants where applicable under `AGENTS.md`; Playwright test callbacks already follow the framework’s required API.

### Architecture and security guardrails

- **AD-7 / AD-9:** The server remains authoritative for identity, authorization, session, CSRF, and generated API contracts. The landing page is public navigation/content only; it must not authorize, start, or query a Process and must preserve the feature-sliced direction `app → pages → features → entities → shared`.
- **AD-11:** Build one static SPA artifact per isolated environment. Public metadata/configuration may be build/deploy injected but is public. Firebase/CDN may cache public landing content and immutable hashed assets only; never cache `/api/**`, authenticated, or session-specific responses.
- **AD-12:** Telemetry must use structured, tenant-safe metadata and centralized redaction. Never emit Process Data, credentials, tokens, private links, email addresses, form contents, or raw private URLs.
- **AD-16:** Use red → green → refactor. Critical landing-to-auth navigation uses Playwright; content/configuration uses focused unit/build checks; accessibility uses automated checks plus manual keyboard/screen-reader evidence before the relevant release gate. Automated axe checks are necessary but not sufficient for a formal conformance claim.
- Preserve the public/authenticated boundary from Stories 1.17–1.18: no Workflow, Task, Process, Process Data, file, dashboard, audit, Organization detail, or anonymous Process initiation may appear or be requested on public landing routes.
- Preserve clearly labeled fictional/sample/demo scenarios and the prohibition on invented testimonials, customer logos, adoption numbers, certifications, savings, endorsements, or unsupported capability claims.

### Performance and accessibility requirements

- Target approximately three seconds for usable primary content and conversion actions under the documented representative mobile-network/device profile. Measure the production build, not only development mode; record browser, viewport, network/device assumptions, build identifier, and results.
- Keep landing content mostly static and lightweight. Avoid adding a tracker, large image, web font, animation library, or UI dependency without bundle/network evidence and a privacy review.
- Use WCAG 2.2 Level A/AA as the project baseline: semantic landmarks/headings, meaningful alternatives, visible focus with at least 3:1 contrast, normal text/controls at least 4.5:1, large text at least 3:1, keyboard/touch operation, readable reflow at 200%, reduced-motion support, and no state communicated by color alone.
- Verify both language variants and direct URL reloads. Metadata must be correct before/after locale changes; `lang`, title, description, canonical, Open Graph locale, and alternate language references must not remain stale.

### Measurement contract

If measurement is enabled, define a typed allowlist rather than forwarding arbitrary browser/URL data. Event names should be a closed set corresponding to the AC. Normalize locale to `es`/`en`; reduce referrer/campaign to an approved coarse class; use coarse performance/device buckets. Never include query-string campaign values verbatim, full referrers, registration form values, user identity, protected resource identifiers, or application URLs. Consent/blocked-tracker behavior must fail open for page usability and fail closed for non-essential collection.

### Content maintenance contract

The static build is the validation boundary for marketing content. Required sections and keys must exist in both locales; Spanish fallback is explicit for missing Moviqo-owned English keys. Validation must inspect safe claims and all public destinations before deployment. Marketing updates must not require edits to `Moviqo.Front/src/app/ui/App.tsx`, authenticated features, API services, or backend authorization code.

### Library/framework requirements

- Use the versions already pinned in `Moviqo.Front/package.json`: React 19.2.7, Vite ~8.2.0, TypeScript ~6.0.0, Playwright ~1.62.0, and `axe-core` ^4.12.1. Do not upgrade dependencies as part of this story.
- Vite’s configured `envPrefix` is `VITE_CLIENT_`; any public value must remain explicitly typed and must never contain a secret. Vite exposes prefixed values in the client bundle, so environment selection is a deployment concern, not user input. [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- Reuse the existing `axe-core` browser-injection approach. Automated accessibility catches common issues but does not replace manual keyboard and representative screen-reader checks. [Playwright accessibility testing](https://playwright.dev/docs/next/accessibility-testing)

### Likely files

Likely updates (confirm exact names and current behavior before editing):

- `Moviqo.Front/index.html` and/or a typed home public-metadata/configuration module for localized canonical/share/alternate metadata.
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx` for metadata synchronization and optional measurement hooks.
- `Moviqo.Front/src/pages/home/model/landingContent.ts` for complete typed locale content, metadata, required-section validation, and safe claims.
- `Moviqo.Front/src/app/styles.css` for responsive, 200% text, focus, contrast, and reduced-motion corrections.
- `Moviqo.Front/src/vite-env.d.ts` only if a new public build variable is genuinely required; keep the `VITE_CLIENT_` boundary.
- `Moviqo.Front/tests/unit/landing-content.test.cts`, relevant build/static-artifact tests, and `Moviqo.Front/tests/e2e/app-shell.spec.ts`.
- Deployment/infrastructure files only if needed to document or inject public environment metadata; do not change backend topology, secrets wiring, or authenticated application logic.

### Testing requirements

- Run focused unit/typecheck and Playwright tests first, then frontend architecture, API-client, build, and static-artifact checks.
- Assert positive and negative properties: both locales and fallback, correct metadata, no misleading claims, no embedded Designer/customer data, no secret/private URL, no tracker before consent, usable blocked-tracker path, no cross-environment/open redirect, no protected public data, no anonymous Process start, focus/contrast/landmark correctness, and 200% responsive operation.
- Test supported browser majors and representative mobile/tablet/desktop viewports. Include direct navigation and reloads, not only CTA clicks.
- Do not use mocks to claim backend authorization. Existing server Membership authorization and protected-route tests remain the evidence for authenticated behavior.

### Previous story intelligence

- Story 1.18 completed environment-safe CTA/legal/support destinations, locale continuity into registration/sign-in, public-boundary checks, and static legal pages. Preserve its allowlist, fail-closed behavior, and `lang` handoff.
- Story 1.17 established the bilingual landing content and fictional examples; its review corrected invalid route acceptance, unsupported guarantees, incomplete bilingual metadata, and dead/fabricated links. Do not regress those fixes.
- Existing E2E coverage uses an `axe-core` script injection rather than `@axe-core/playwright`; build on that established pattern.

### Project structure notes

- This is a frontend/static-content and release-evidence story. Keep work in the existing home page/model/styles/test seams; do not create a general-purpose router, analytics platform, CMS, backend endpoint, or duplicate localization mechanism.
- New frontend implementation and test/build helper functions must be arrow-function constants per repository `AGENTS.md`, unless a framework or type-system constraint requires otherwise.
- No repository `project-context.md` was found. `AGENTS.md`, the architecture spine, UX artifacts, current source, and prior story files are authoritative.

## References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.19]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`, FR477–FR483, NFR1, NFR9–NFR10, NFR14–NFR15]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Sections 11.3 and 18]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-7, AD-9, AD-11, AD-12, AD-16, Environment Gates, Consistency Conventions]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Accessibility Floor]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`, Brand & Style, Colors, Typography, Contrast targets]
- [Source: `_bmad-output/implementation-artifacts/1-18-connect-landing-conversion-to-registration-and-sign-in.md`]
- [Source: `Moviqo.Front/src/pages/home/ui/HomePage.tsx`]
- [Source: `Moviqo.Front/src/pages/home/model/landingContent.ts`]
- [Source: `Moviqo.Front/src/app/styles.css`]
- [Source: `Moviqo.Front/tests/e2e/app-shell.spec.ts`]
- [Source: `AGENTS.md`]
- [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [Playwright accessibility testing](https://playwright.dev/docs/next/accessibility-testing)

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

- Story 1.19 was explicitly selected by the user and was `ready-for-dev` in the complete sprint status file.
- No repository `project-context.md` was found.
- Current HEAD contains the merged Story 1.18 implementation; its landing/legal/locale seams are the baseline.
- Current dependency versions and existing axe-core/Playwright harness were inspected; no dependency upgrade is required.
- Story branch preflight selected `story/1-19-deliver-an-accessible-measurable-landing-experience` and preserved the pre-existing story/sprint worktree edits.
- Vite production build passed with static metadata and non-essential tracker checks; the measured artifact was 258.29 kB JavaScript / 76.95 kB gzip and 11.25 kB CSS / 2.65 kB gzip.
- Full frontend regression suite passed; full Playwright suite passed 66/66 across Chromium, Edge-family, Firefox, WebKit, mobile Chrome, and tablet Safari. Focused landing checks passed 5/5 in Chromium.

### Completion Notes List

- Implemented localized title, description, canonical, Open Graph, locale, and alternate-language metadata using the existing language provider.
- Added content validation for required sections, truthful claims, and legal/support copy; preserved Story 1.18 destination validation.
- Added a typed, redacting measurement payload allowlist. Measurement remains disabled because no approved consent provider or policy is configured.
- Added static artifact metadata/tracker gates and Playwright coverage for metadata, keyboard/accessibility, responsive 200% text, locale reload, and public data boundaries.

### File List

- `Moviqo.Front/index.html`
- `Moviqo.Front/src/pages/home/model/landingContent.ts`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/tests/build/scan-static-artifact.mjs`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `Moviqo.Front/tests/unit/landing-content.test.cts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-19-deliver-an-accessible-measurable-landing-experience.md`

### Change Log

- 2026-08-04: Implemented Story 1.19 landing metadata, privacy-safe measurement contract, validation gates, responsive/accessibility evidence, and full regression coverage. Status moved to review.
- 2026-08-04: Added prerendered Spanish and English landing entry pages with localized static metadata and reciprocal alternate URLs. Review findings resolved; status moved to done.

### Review Findings

- [x] [Review][Patch] Localized share metadata is not discoverable from the static landing artifact [Moviqo.Front/index.html:7] — fixed with prerendered `/es/` and `/en/` Vite entry pages, locale-aware initialization, reciprocal metadata, and static artifact assertions.
  - The initial HTML contains only Spanish metadata, a relative `og:url`, and a `moviqo.invalid` canonical. The English variant is applied only by the React `useEffect`, while the single alternate link is rewritten to the same canonical URL for either locale (`Moviqo.Front/src/pages/home/ui/HomePage.tsx:79-91`, `Moviqo.Front/src/pages/home/model/landingContent.ts:85-102`). Crawlers and share scrapers that do not execute the SPA receive Spanish/placeholder metadata, and both hreflang variants resolve to one URL, so English discovery and canonical/share correctness are not guaranteed. Generate environment-safe absolute localized metadata/alternate URLs in the served artifact, or use a documented server/deployment mechanism that provides equivalent locale-specific HTML.

- [x] [Review][Patch] Content validation is not enforced by the production build [Moviqo.Front/src/pages/home/model/landingContent.ts:107] — fixed by adding the `validate:landing` build step and strengthening required-field validation.
  - `validateLandingContent` is only called by `tests/unit/landing-content.test.cts`; `npm run build` invokes `scan-static-artifact.mjs`, which checks metadata markers and forbidden strings but never invokes the content validator or validates required localized fields, destinations, or links. A maintainer can therefore change landing content to an incomplete or unsafe value and still produce a successful deployment artifact, violating AC4's static-build validation boundary. Wire the validator and destination/link checks into the build or a required prebuild validation step, and ensure that validation exercises the actual build content.
