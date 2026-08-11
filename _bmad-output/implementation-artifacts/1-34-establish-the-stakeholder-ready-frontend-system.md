---
baseline_commit: b49af71da3507024f00bf808f9c0a962bff4f007
---

# Story 1.34: Establish the Stakeholder-Ready Frontend System

Status: done

## Story

As a product team,
I want one enforceable visual system applied to the public and onboarding experience,
so that Moviqo looks coherent, modern, and trustworthy before stakeholders enter the core journey.

## Acceptance Criteria

1. **Approve the visual direction in context:** The Design System page renders representative landing navigation, authentication and registration Forms, buttons, cards, alerts, badges, timeline rows, and the compact UAT indicator at desktop and mobile sizes. Normal, hover, focus, disabled, success, warning, and error states use the candidate palette. Required contrast pairs pass automated checks, but the palette is adjusted and locked only after human screenshot review and approval.

2. **Establish the enforceable frontend foundation:** Pinned `tailwindcss` and `@tailwindcss/vite` 4.3.3 expose approved Moviqo theme variables. Source-owned domain-free primitives under `shared/ui` provide `AppShell`, `AppHeader`, `PageContainer`, `PageHeader`, `Card`, `Button`, `FormGrid`, `FormSection`, `FormField`, `TextInput`, `SelectField`, `PasswordField`, `CheckboxField`, `ActionBar`, `Alert`, `ErrorSummary`, and `Badge`. Native accessible controls live inside these components. Pages do not invent raw control styling, raw colors, arbitrary spacing, dynamically constructed Tailwind fragments, or a second general form-state system. Domain-aware Workflow and Task Form renderers remain in their owning feature slices.

3. **Redesign the public landing page:** The landing page uses a modern responsive header, focused value proposition, credible product visual, disciplined section rhythm, truthful fictional examples, clear primary registration and secondary sign-in actions, and a complete beta/privacy/terms/support footer. Public onboarding does not expose authenticated work, administration, or Design System navigation. UAT retains a clear but compact synthetic-only indicator.

4. **Redesign onboarding and authentication:** Registration groups identity, Organization, regional defaults, and consent into readable aligned sections. Verification, sign-in, password recovery, and password reset use compact widths, consistently full-width fields, aligned actions, and clear states. No undefined class or raw browser-default control remains.

5. **Make registration failure recoverable:** When registration is rejected, a localized error summary names every actionable field, receives focus, links to the relevant control, and reveals/focuses the first invalid field. Inline errors remain associated through `aria-invalid` and `aria-describedby`; errors that do not map to a rendered control receive an actionable form-level explanation. Correctable values are preserved, a field error clears when corrected, duplicate submission remains disabled, and the correlation ID appears only as secondary support detail.

6. **Correct copy and preserve accessibility:** Moviqo-owned Spanish uses correct spelling and accents; English receives review. Labels, errors, help, focus, contrast, keyboard behavior, reduced motion, non-color-only state, and practical 44 CSS-pixel targets remain accessible. Designer-authored content remains verbatim.

Traceability: FR461-FR495, FR546-FR552, AD-9, AD-16, UX-DR1-UX-DR6, UX-DR12-UX-DR14, UX-DR16, UX-DR18-UX-DR20, UX-DR22, UX-DR23.

## Tasks / Subtasks

- [x] Add and pin the styling foundation (AC: 2)
  - [x] Install `tailwindcss` and `@tailwindcss/vite` 4.3.3 and integrate the official Vite plugin.
  - [x] Map the candidate Moviqo colors, spacing, typography, radii, focus, and breakpoint values through Tailwind theme variables.
  - [x] Keep complete static utility class maps; do not generate partial class names dynamically.
  - [x] Preserve the feature-sliced dependency direction and arrow-function convention.

- [x] Build the shared UI primitives (AC: 2, 5, 6)
  - [x] Implement the approved page, card, action, feedback, and field primitives under `shared/ui`.
  - [x] Keep native semantic controls inside the primitives and expose typed variants rather than raw color or spacing props.
  - [x] Implement the twelve-column `FormGrid` and approved spans for Full, Wide, Half, Third, Quarter, Compact, and Auto behavior.
  - [x] Keep these primitives domain-free; the typed field registry and `TaskFormRenderer` are implemented by Story 1.37 in their owning features.

- [x] Run the visual-system checkpoint before broad rollout (AC: 1)
  - [x] Update the existing Design System page with representative real component compositions and state variants.
  - [x] Capture desktop and mobile screenshots using safe fictional data.
  - [x] Record human approval or required token/component adjustments before applying the candidate palette across public surfaces.
  - [x] Add or update contrast/token tests after the palette is approved.

- [x] Redesign the landing page (AC: 3, 5)
  - [x] Replace the scaffold-like header and placeholder product visual with the approved stakeholder-ready composition.
  - [x] Preserve truthful fictional examples and prohibited-claim boundaries while improving the hero, CTA hierarchy, content rhythm, and footer.
  - [x] Keep only public navigation and environment-appropriate registration, sign-in, beta, legal, privacy, and support routes.
  - [x] Make the UAT synthetic-only notice compact, accessible, and unmistakable without consuming the top of the viewport.

- [x] Redesign registration, verification, sign-in, and recovery (AC: 4-6)
  - [x] Replace raw controls and missing `form-card` styling with shared form components.
  - [x] Apply consistent content widths, field alignment, grouping, helper/error placement, and primary/secondary actions.
  - [x] Preserve authentication, CSRF, verification-token scrubbing, password policy, and server-authoritative outcomes.
  - [x] Map every registration `invalidParams` path to a visible field label or an actionable form-level message.
  - [x] Focus the error summary after rejection, allow its entries to reveal/focus fields, and preserve correctable input rather than clearing the password indiscriminately.
  - [x] [Defer] Additional browser/E2E component coverage is deliberately deferred by product decision until Moviqo's implemented journey is stable; no new E2E coverage was added or run.

- [x] Correct visible public/onboarding copy (AC: 6)
  - [x] Review the Spanish and English localization catalogs for these surfaces.
  - [x] Correct missing Spanish accents and misspellings without changing Designer-authored content.
  - [x] Add focused copy tests for required public/onboarding messages and prevent translation keys/placeholders from rendering.

- [x] Verify the foundation and public surfaces (AC: 1-6)
  - [x] Run affected unit, component, architecture, type, and build/static checks.
  - [x] [Defer] Refreshed post-implementation screenshot evidence is deferred with browser/E2E work; the built application received explicit manual approval.
  - [x] Manually verify landing, registration validation recovery, verification, sign-in, recovery, responsive layout, keyboard focus, and bilingual presentation on the built application; approval received on 2026-08-10.

### Review Findings

- [x] [Review][Patch] High: Add a representative public landing-navigation composition while preserving the simplified checkpoint header and excluding internal or authenticated navigation [Moviqo.Front/src/pages/design-system/ui/DesignSystemPage.tsx:30]
- [x] [Review][Patch] High: Raise form-control boundary contrast to the required 3:1 minimum and cover the pair in token tests [Moviqo.Front/src/shared/ui/forms.tsx:74]
- [x] [Review][Patch] Medium: Render the checkpoint authentication and registration examples as semantic forms [Moviqo.Front/src/pages/design-system/ui/DesignSystemPage.tsx:88]
- [x] [Review][Patch] Medium: Stop routine multi-project E2E runs from overwriting the human-approved checkpoint evidence [Moviqo.Front/tests/e2e/design-system-checkpoint.spec.ts:18]
- [x] [Review][Patch] Medium: Make Alert live-region behavior explicit so static success and warning examples are not announced on page load [Moviqo.Front/src/shared/ui/feedback.tsx:73]
- [x] [Review][Patch] Medium: Preserve the field primitives' ref, caller ARIA, required-label, and password-reveal contracts needed for accessible error recovery [Moviqo.Front/src/shared/ui/forms.tsx:36]
- [x] [Review][Patch] Medium: Render non-actionable ErrorSummary entries as text and guard links whose target control is absent [Moviqo.Front/src/shared/ui/feedback.tsx:97]
- [x] [Review][Patch] Low: Give the shared Button a non-submitting default type [Moviqo.Front/src/shared/ui/Button.tsx:29]
- [x] [Review][Patch] Low: Use the informational mark for info badges instead of the warning/error exclamation mark [Moviqo.Front/src/shared/ui/feedback.tsx:88]
- [x] [Review][Patch] Low: Align AppHeader and wide PageContainer content to the same width contract [Moviqo.Front/src/shared/ui/layout.tsx:52]
- [x] [Review][Patch] Low: Replace the static checkpoint-inventory assertion with coverage tied to rendered compositions [Moviqo.Front/tests/unit/design-system.test.cts:82]
- [x] [Review][Patch] Low: Reconcile the Story 1.34 File List with all files included in its baseline diff [\_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md:118]

## Dev Notes

- Tailwind is a styling and token-enforcement tool; the design quality comes from the approved tokens, shared primitives, composition rules, and human visual checkpoint.
- Native controls remain the accessibility foundation. Pages consume source-owned components rather than duplicating raw controls.
- Static forms keep focused local state. Dynamic Task Forms preserve explicit reducers, revision tokens, generated API contracts, and server validation in Story 1.37.
- Use accessible headless primitives only when a complex interaction genuinely requires them.
- The landing page is a first-class deliverable, not a side effect of the component work.

## References

- `AGENTS.md`, Frontend UI implementation
- `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-9
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`

## Dev Agent Record

### Implementation Plan

- Establish the pinned Tailwind theme and source-owned shared primitives with focused tests.
- Build the representative Design System compositions and capture desktop/mobile evidence before broad rollout.
- Apply only the human-approved visual direction to the landing and onboarding/authentication surfaces.
- Migrate each public surface from legacy CSS classes to shared Tailwind-backed primitives, preserving its server-authoritative behavior and adding rendered component contracts before implementation.

### Debug Log References

- Story branch: `story/1-34-establish-the-stakeholder-ready-frontend-system`
- Manual acceptance feedback on 2026-08-10 identified a duplicate native language-select outline, unstyled static legal documents, accidental `i01`-`i03` step labels, undersized context/warning text, and registration submissions without actionable required-field errors. The reported `/verification` path was also reconciled with the canonical `/verify-email?token=...` callback route.
- Human-approved visual checkpoint evidence:
  - `_bmad-output/implementation-artifacts/screenshots/story-1-34/design-system-desktop-es.png`
  - `_bmad-output/implementation-artifacts/screenshots/story-1-34/design-system-mobile-es.png`

### Completion Notes

- Added the exact Tailwind CSS/Vite 4.3.3 foundation and mapped the candidate Moviqo palette, typography, spacing, radii, focus, target, and breakpoint contract into theme variables.
- Added the complete domain-free shared UI primitive set with semantic native controls, typed variants, static utility maps, and responsive twelve-column Form Grid spans.
- Added focused token/contrast/shared-component tests; `npm test` and `npm run build` pass after the foundation work.
- Built and browser-checked the Design System checkpoint compositions and retained the manually approved desktop/mobile evidence. Automated screenshot capture was removed so routine E2E execution cannot replace that evidence; broad public/onboarding rollout remains separate unfinished work.
- Refined the shared password reveal control from a separate text button to an in-field eye/eye-off icon with a 44 px target, localized accessible name and tooltip, pressed state, keyboard operation, and updated checkpoint evidence.
- Refined the shared language selector into one compact native-select pill with globe and chevron affordances, a 44 px target, responsive header behavior, and refreshed desktop/mobile checkpoint evidence.
- Added a token-driven, workflow-inspired Moviqo mark beside the wordmark while keeping the generic shared header brand-agnostic; refreshed desktop/mobile checkpoint evidence and kept the global system-font decision open for human review.
- Human checkpoint review established that the Design System's internal page anchors should not appear as tabs, product navigation, or section titles in the application header. Removed those shortcuts and their hash-tracking state entirely so the checkpoint header contains only the Moviqo identity and language selector; the generic shared header retains conventional optional route navigation for future product use.
- Human visual approval received on 2026-08-10 for the public/onboarding component direction, palette, Moviqo mark, password reveal, language selector, and simplified header. The authenticated module menu is explicitly a separate Story 1.35 shell/mockup and must not be added to the public template.
- Applied all code-review patches: added the separate public landing-navigation example, semantic checkpoint forms, 3:1 control-boundary contrast, safer field/feedback/button contracts, aligned containers, and rendered-composition unit coverage. Typecheck, unit, architecture, and production-build checks pass; E2E was intentionally not run.
- Rebuilt the public landing page with the approved AppShell/AppHeader/Card/ButtonLink system, a credible fictional workflow preview, disciplined responsive sections, public-only navigation, complete legal/support fallbacks, and the compact synthetic-only UAT notice. Removed the obsolete landing/banner CSS and passed the full non-E2E regression suite.
- Migrated registration, verification, sign-in, password recovery, and password reset to one public-only shell and the approved shared controls. Registration now groups identity, organization, regional preferences, and consent; maps unknown server paths to form-level feedback; focuses the linked error summary; preserves correctable values; clears only corrected field errors; and retains duplicate-submit protection while preserving the existing CSRF and server-authoritative transports.
- Corrected source-owned Spanish public/onboarding spelling and accents, reviewed stale English verification wording, and added bilingual rendered-copy checks that reject localization keys and placeholders. Designer-authored landing content remains unchanged.
- `npm test`, `npm run build`, and `git diff --check` passed after the public/onboarding rollout. Per the product decision, no E2E suite was added or run; interactive browser coverage, refreshed implementation screenshots, and final manual acceptance were left open at that implementation checkpoint.
- Applied the first post-rollout manual-review corrections: replaced the language selector's duplicate browser outline with the approved focus ring, increased public context-label and UAT-warning readability, removed the accidental information marker from numbered landing steps, brought all three static legal documents into a responsive shared Moviqo presentation, and added client-side required-field recovery before registration reaches the server. `npm test` and `npm run build` pass; E2E remains intentionally deferred.
- Standardized the workflow-inspired Moviqo mark across React headers, the landing footer, and both header/footer positions on static legal pages. Added the matching deterministic `favicon.ico`, build guards for public brand assets, and replaced every public beta-support fallback with `beta-support@mymoviqo.com`. The full non-E2E test and production-build suites pass.
- Applied the second landing manual-review refinements: changed the language control from a blue to a single teal focus treatment, enlarged and identified the shared workflow mark, shortened the bilingual hero while retaining bounded capability and publishing-target claims, added an accessible connected-workflow illustration, aligned the landing header container, and gave every fictional-case card the same accent and badge treatment. Independent focused review findings were patched; `npm test` and `npm run build` pass without E2E execution.
- Applied the third landing manual-review refinements: restored the preferred explanatory hero copy, removed bilingual-interface promotion throughout the landing, increased hero rhythm and time-to-value prominence, limited the footer to legal/support destinations with localized copyright, changed visible environment badges from UAT to BETA, made the complete language pill activate without focus decoration, redesigned the canonical mark/favicon as a branching workflow, and replaced accent scenario borders with accessible numbered detail rows. `npm test` and `npm run build` pass; E2E remains untouched.
- Applied the fourth header manual-review refinements: replaced the native language menu with a styled accessible popup whose entire pill is interactive, introduced a stronger two-tone Moviqo wordmark across React and static legal surfaces, and inlined the minimal light shell in every landing entry to prevent the transient unstyled black frame. The review also restored registration error-summary focus stability, honored the active registration language, and scrubbed verification tokens from the visible URL. E2E remained intentionally deferred; manual acceptance followed in the next review pass.
- Manual validation of the local built application on `story/1-34-establish-the-stakeholder-ready-frontend-system` was approved on 2026-08-10 after the fourth refinement pass. The latest `npm test`, `npm run build`, and `git diff --check` are green. Story 1.34 is closed without additional E2E work or refreshed screenshot capture, consistent with the explicit product decision to resume browser automation after the implemented journey is stable.

### File List

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md`
- `_bmad-output/implementation-artifacts/1-39-present-the-core-journey-and-capture-stakeholder-feedback.md`
- `_bmad-output/implementation-artifacts/epic-1-context.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `_bmad-output/planning-artifacts/research/technical-react-workflow-and-form-editor-libraries-research-2026-08-10.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Moviqo.Front/package.json`
- `Moviqo.Front/package-lock.json`
- `Moviqo.Front/index.html`
- `Moviqo.Front/en/index.html`
- `Moviqo.Front/es/index.html`
- `Moviqo.Front/public/favicon.ico`
- `Moviqo.Front/public/legal/beta-terms.html`
- `Moviqo.Front/public/legal/legal.css`
- `Moviqo.Front/public/legal/privacy-notice.html`
- `Moviqo.Front/public/legal/prohibited-data.html`
- `Moviqo.Front/public/moviqo-mark.svg`
- `Moviqo.Front/vite.config.ts`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/app/ui/EnvironmentBanner.tsx`
- `Moviqo.Front/src/features/authentication/ui/PasswordRecoveryForm.tsx`
- `Moviqo.Front/src/features/authentication/ui/PasswordResetForm.tsx`
- `Moviqo.Front/src/features/registration/index.ts`
- `Moviqo.Front/src/features/registration/model/registrationForm.ts`
- `Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx`
- `Moviqo.Front/src/features/verification/index.ts`
- `Moviqo.Front/src/features/verification/model/verifyEmail.ts`
- `Moviqo.Front/src/features/verification/ui/VerificationStatusPanel.tsx`
- `Moviqo.Front/src/pages/home/model/landingContent.ts`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/src/pages/password-recovery/ui/PasswordRecoveryPage.tsx`
- `Moviqo.Front/src/pages/password-reset/ui/PasswordResetPage.tsx`
- `Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx`
- `Moviqo.Front/src/pages/sign-in/ui/SignInPage.tsx`
- `Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx`
- `Moviqo.Front/src/pages/design-system/ui/DesignSystemPage.tsx`
- `Moviqo.Front/src/shared/design-system/catalogData.ts`
- `Moviqo.Front/src/shared/design-system/index.ts`
- `Moviqo.Front/src/shared/design-system/tokens.ts`
- `Moviqo.Front/src/shared/branding/MoviqoMark.tsx`
- `Moviqo.Front/src/shared/branding/MoviqoWordmark.tsx`
- `Moviqo.Front/src/shared/branding/index.ts`
- `Moviqo.Front/src/shared/localization/LanguageSelector.tsx`
- `Moviqo.Front/src/shared/localization/index.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/ui/Button.tsx`
- `Moviqo.Front/src/shared/ui/PasswordField.tsx`
- `Moviqo.Front/src/shared/ui/feedback.tsx`
- `Moviqo.Front/src/shared/ui/forms.tsx`
- `Moviqo.Front/src/shared/ui/index.ts`
- `Moviqo.Front/src/shared/ui/layout.tsx`
- `Moviqo.Front/src/widgets/public-page-shell/index.ts`
- `Moviqo.Front/src/widgets/public-page-shell/ui/PublicPageShell.tsx`
- `Moviqo.Front/tests/unit/design-system.test.cts`
- `Moviqo.Front/tests/build/generate-brand-assets.mjs`
- `Moviqo.Front/tests/build/scan-static-artifact.mjs`
- `Moviqo.Front/tests/unit/localization.test.cts`
- `Moviqo.Front/tests/unit/landing-content.test.cts`
- `Moviqo.Front/tests/unit/password-field.test.cts`
- `Moviqo.Front/tests/unit/public-onboarding.test.cts`
- `Moviqo.Front/tests/unit/registration-model.test.cts`
- `Moviqo.Front/tests/unit/shared-ui.test.cts`
- `Moviqo.Front/tests/unit/verification-flow.test.cts`
- `Moviqo.Front/tests/e2e/app-shell.spec.ts`
- `_bmad-output/implementation-artifacts/screenshots/story-1-34/design-system-desktop-es.png`
- `_bmad-output/implementation-artifacts/screenshots/story-1-34/design-system-mobile-es.png`

### Change Log

- 2026-08-10: Completed adversarial review and applied all 12 review patches; story remains in progress because the landing, onboarding/authentication, copy, and manual-acceptance tasks are still open.
- 2026-08-10: Completed the landing and onboarding/authentication implementation plus the bilingual source-copy review. All non-E2E checks pass; story remains in progress for the explicitly deferred browser/E2E component coverage and final manual visual/journey acceptance.
- 2026-08-10: Corrected the first manual-acceptance defects across landing hierarchy, focus presentation, legal-document styling, UAT-warning readability, and registration required-field recovery; retained `in-progress` for refreshed manual acceptance with no E2E work.
- 2026-08-10: Aligned the canonical Moviqo mark across public headers and footers, added its deterministic browser favicon, and moved the public beta-support contract to `beta-support@mymoviqo.com`; retained `in-progress` for refreshed manual acceptance with no E2E work.
- 2026-08-10: Refined the landing focus color, workflow branding/illustration, hero density, and fictional-case consistency from the second manual review; retained `in-progress` for refreshed manual acceptance with no E2E work.
- 2026-08-10: Applied the third manual landing polish across copy, spacing, footer, BETA labeling, full-pill language interaction, branching workflow branding, and numbered fictional-case details; retained `in-progress` for refreshed manual acceptance with no E2E work.
- 2026-08-10: Applied the fourth manual header polish with a custom language popup, branded wordmark, and first-paint shell stabilization; patched the final non-E2E review findings and retained `in-progress` for refreshed manual acceptance.
- 2026-08-10: Recorded final manual validation approval, dispositioned additional E2E coverage and refreshed post-implementation screenshots as intentionally deferred, and closed Story 1.34.

## Suggested Review Order

**Header interaction and identity**

- Start with the styled, keyboard-operable language popup and its complete pill target.
  [`LanguageSelector.tsx:41`](../../Moviqo.Front/src/shared/localization/LanguageSelector.tsx#L41)

- Review the reusable two-tone company wordmark shared by public surfaces.
  [`MoviqoWordmark.tsx:1`](../../Moviqo.Front/src/shared/branding/MoviqoWordmark.tsx#L1)

**First-paint stability**

- Confirm the minimal light shell precedes JavaScript and cannot style controls.
  [`index.html:6`](../../Moviqo.Front/index.html#L6)

**Review hardening**

- Verify field corrections no longer pull focus back to registration errors.
  [`RegistrationForm.tsx:103`](../../Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx#L103)

- Confirm verification URLs retain benign parameters while removing the token.
  [`verifyEmail.ts:15`](../../Moviqo.Front/src/features/verification/model/verifyEmail.ts#L15)

**Closure evidence**

- Review the approved manual gate and explicitly deferred browser evidence.
  [`Story 1.34:57`](./1-34-establish-the-stakeholder-ready-frontend-system.md#L57)

- Confirm the sprint tracker records the accepted story as done.
  [`sprint-status.yaml:56`](./sprint-status.yaml#L56)
