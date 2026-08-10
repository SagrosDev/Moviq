# Story 1.34: Establish the Stakeholder-Ready Frontend System

Status: ready-for-dev

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

- [ ] Add and pin the styling foundation (AC: 2)
  - [ ] Install `tailwindcss` and `@tailwindcss/vite` 4.3.3 and integrate the official Vite plugin.
  - [ ] Map the candidate Moviqo colors, spacing, typography, radii, focus, and breakpoint values through Tailwind theme variables.
  - [ ] Keep complete static utility class maps; do not generate partial class names dynamically.
  - [ ] Preserve the feature-sliced dependency direction and arrow-function convention.

- [ ] Build the shared UI primitives (AC: 2, 5, 6)
  - [ ] Implement the approved page, card, action, feedback, and field primitives under `shared/ui`.
  - [ ] Keep native semantic controls inside the primitives and expose typed variants rather than raw color or spacing props.
  - [ ] Implement the twelve-column `FormGrid` and approved spans for Full, Wide, Half, Third, Quarter, Compact, and Auto behavior.
  - [ ] Keep these primitives domain-free; the typed field registry and `TaskFormRenderer` are implemented by Story 1.37 in their owning features.

- [ ] Run the visual-system checkpoint before broad rollout (AC: 1)
  - [ ] Update the existing Design System page with representative real component compositions and state variants.
  - [ ] Capture desktop and mobile screenshots using safe fictional data.
  - [ ] Record human approval or required token/component adjustments before applying the candidate palette across public surfaces.
  - [ ] Add or update contrast/token tests after the palette is approved.

- [ ] Redesign the landing page (AC: 3, 5)
  - [ ] Replace the scaffold-like header and placeholder product visual with the approved stakeholder-ready composition.
  - [ ] Preserve truthful fictional examples and prohibited-claim boundaries while improving the hero, CTA hierarchy, content rhythm, and footer.
  - [ ] Keep only public navigation and environment-appropriate registration, sign-in, beta, legal, privacy, and support routes.
  - [ ] Make the UAT synthetic-only notice compact, accessible, and unmistakable without consuming the top of the viewport.

- [ ] Redesign registration, verification, sign-in, and recovery (AC: 4-6)
  - [ ] Replace raw controls and missing `form-card` styling with shared form components.
  - [ ] Apply consistent content widths, field alignment, grouping, helper/error placement, and primary/secondary actions.
  - [ ] Preserve authentication, CSRF, verification-token scrubbing, password policy, and server-authoritative outcomes.
  - [ ] Map every registration `invalidParams` path to a visible field label or an actionable form-level message.
  - [ ] Focus the error summary after rejection, allow its entries to reveal/focus fields, and preserve correctable input rather than clearing the password indiscriminately.
  - [ ] Add browser component coverage for multiple field errors, non-field errors, keyboard focus, correction, and duplicate submission.

- [ ] Correct visible public/onboarding copy (AC: 6)
  - [ ] Review the Spanish and English localization catalogs for these surfaces.
  - [ ] Correct missing Spanish accents and misspellings without changing Designer-authored content.
  - [ ] Add focused copy tests for required public/onboarding messages and prevent translation keys/placeholders from rendering.

- [ ] Verify the foundation and public surfaces (AC: 1-6)
  - [ ] Run affected unit, architecture, type, build/static, and existing local Playwright checks.
  - [ ] Review approved desktop/mobile screenshots after implementation.
  - [ ] Do not create another deployed E2E journey, branded-browser matrix, or formal WCAG claim in this story.

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
