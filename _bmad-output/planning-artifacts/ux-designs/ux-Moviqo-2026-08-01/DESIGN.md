---
name: Moviqo
description: Calm, approachable process automation for small businesses without development teams.
status: final
created: 2026-08-01
updated: 2026-08-01
sources:
  - "../../prds/prd-Moviqo-2026-07-30/prd.md"
  - "../../briefs/brief-moviqo-2026-07-30/brief.md"
  - "../../prds/prd-Moviqo-2026-07-30/padr-supersession.md"
colors:
  surface-base: '#F8FAFC'
  surface-raised: '#FFFFFF'
  surface-soft: '#F1F5F9'
  ink-primary: '#0F172A'
  ink-secondary: '#475569'
  ink-disabled: '#94A3B8'
  primary: '#0F766E'
  primary-hover: '#115E59'
  primary-foreground: '#FFFFFF'
  accent: '#2563EB'
  border: '#CBD5E1'
  focus: '#2563EB'
  warning: '#B45309'
  error: '#B91C1C'
  success: '#15803D'
typography:
  display:
    fontFamily: 'System sans-serif'
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.15'
  heading:
    fontFamily: 'System sans-serif'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
  body:
    fontFamily: 'System sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'System sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.35'
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  gutter-mobile: 16px
  gutter-desktop: 32px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  guidance-card:
    background: '{colors.surface-soft}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.lg}'
  field:
    background: '{colors.surface-raised}'
    border: '{colors.border}'
    radius: '{rounded.sm}'
---

## Brand & Style

Moviqo should feel like a calm guide beside the user: clear, friendly, and quietly capable. The sea-and-water direction is expressed through fresh surfaces, natural blue-green accents, and generous breathing room—not through literal beach imagery or decorative waves. The interface should make process automation feel approachable rather than technical.

The tokens are derived from the user's visual direction and should be verified against implemented components during delivery.

The revised palette is a candidate until the Story 1.34 visual checkpoint renders representative real components at desktop and mobile sizes and receives human approval. Numeric contrast compliance is necessary but is not visual approval.

## Colors

- **Sea primary** `{colors.primary}` marks the next meaningful action, active navigation, and links.
- **Water-soft surface** `{colors.surface-soft}` holds guidance and orientation without competing with the task.
- **Natural ink** `{colors.ink-primary}` keeps instructional text warm and readable.
- **Sand accent** `{colors.accent}` is reserved for gentle emphasis, tips, and non-critical attention—not errors.
- Error and success colors communicate state plainly and are never the sole signal.

## Typography

Use a familiar system sans-serif for clarity, speed, and broad language support. Headings should be warm and direct; labels should use sentence case. Avoid dense technical labels, all-caps navigation, and decorative display typography.

## Layout & Spacing

Use a responsive twelve-column layout for Forms on wide screens. On mobile, controls reflow into a single readable column. Keep the active task or next guided step visually dominant. Desktop authoring may use a wider workspace; operational flows use compact cards and progressive disclosure on narrow screens.

Authentication uses a compact centered content column. Registration uses clear onboarding sections rather than one undifferentiated field wall. Public landing content uses a deliberate reading width and visible section rhythm. At most one primary action leads each region; supporting and destructive actions are visually distinct.

## Implementation Contract

- Tailwind CSS theme variables are the implementation API for these tokens.
- Source-owned shared components contain native accessible controls; pages and features compose them.
- Raw component-level colors, arbitrary spacing scales, and dynamically constructed Tailwind class fragments are prohibited.
- Desktop Task Forms use twelve columns and explicit approved spans; narrow Forms stack without overlap or lost actions.
- Static forms use focused local state. Dynamic Workflow and Task Forms use the existing reducers, schema-driven renderer, generated contracts, and server-authoritative validation rather than a second general form library.
- React Router owns public/authenticated layouts and canonical module URLs. Workflow creation navigates to the dedicated Designer; Workflow/Form editors must reload from route identity and server state rather than depend on a previous page's in-memory state.
- TanStack Query owns server catalogs and read models. Route-level Workflow/Form hooks own unsaved documents, explicit Save Draft, revision conflicts, and transient selection; editor documents do not belong in application Context.
- The Workflow Editor uses React Flow for canvas interaction and presentation, while the Moviqo reducer remains the canonical workflow document. Every drag or connection gesture has an equivalent discoverable non-drag operation.
- Generic controls and Form Grid live in the shared UI kit; the typed Task Form field registry/runtime renderer, Workflow canvas, and dedicated Form Designer remain in their owning feature slices. A pinned dnd-kit package set supplements click/double-click and explicit keyboard operations without owning Form state. Designer preview reuses the runtime field renderer.
- Every form field follows label, concise help, control, and associated validation. Buttons use one clear primary action per region with consistent secondary and destructive treatment.
- Failed submission presents a localized error summary, focuses it, links to and focuses the first invalid field, preserves correctable values, and provides an actionable form-level message for errors that cannot map to a visible control. Correlation IDs are secondary support details.
- Spanish copy uses correct accents and spelling; English copy receives review before stakeholder presentation.

## Visual Approval Checkpoint

Before the candidate palette or redesigned primitives are applied across the application, the Design System page must render representative landing navigation, authentication and registration forms, Task Form fields, buttons, cards, alerts, badges, timeline rows, and the UAT indicator in normal, hover, focus, disabled, success, warning, and error states. Capture desktop and mobile screenshots, obtain human approval, then lock the tokens and protect required contrast pairs with automated tests.

## Landing Page Presentation

The public landing page must look like the product entry point rather than a scaffold. Use a modern responsive header, clear value-focused hero, credible product visual, restrained section rhythm, strong primary/secondary CTA hierarchy, truthful fictional examples, and a complete footer for beta, privacy, terms, support, registration, and sign-in routes. Public onboarding must not expose authenticated application or Design System navigation. In UAT, retain a clear but compact synthetic-only indicator that does not dominate the viewport.

## Elevation & Depth

Prefer tonal layering and light borders over heavy shadows. Guidance cards may use a very soft shadow or surface contrast to separate teaching content from work content. Avoid visual noise that makes the product feel like an administration console.

## Shapes

Use friendly, moderate rounding: `{rounded.sm}` for fields, `{rounded.md}` for controls, and `{rounded.lg}` for guidance cards and major onboarding surfaces. Reserve `{rounded.full}` for status indicators or avatars only.

## Components

- **Primary button** — Uses `{colors.primary}` and a plain action verb such as “Continue”, “Save draft”, or “Publish workflow”.
- **Guidance card** — Uses `{components.guidance-card}`. Explains one concept, gives one next action, and can be dismissed or revisited.
- **Form field** — Uses `{components.field}`. Label, short help text, input, and inline validation appear in that order.
- **Guided step** — Uses a clear step title and one focal decision, with the primary button as the next action.
- **Progress indicator** — Shows named steps in plain language; never exposes implementation terminology such as nodes or graph topology.
- **Workflow element** — Uses a recognizable label and short explanation. Visual distinction should support scanning without requiring color recognition.
- **Task card** — Prioritizes task name, current status, assignee, and primary action; expands for authorized details.
- **Assignment control** — Presents the recipient type, recipient name, and a short explanation of when work becomes available.
- **Publish checklist** — Uses plain-language issue rows with status text and links to the relevant configuration.
- **Timeline** — Uses readable event rows with actor, time, state, and task position; restricted data is not visually previewed.

## Workflow and Form Authoring

Workflow and Form authoring are separate route-level modules, not stacked sections of the Workflow creation page. Workflow creation redirects to the new Workflow's canonical Designer route. Selecting a Task exposes a prominent Design Form action; the separate Form launcher selects an existing Workflow and Task before opening the same canonical Form route.

The desktop Workflow Editor uses a clear toolbar, element palette, React Flow canvas, accessible outline, selected-element properties, publish checklist, and persistent save status. Palette items support drag-to-canvas, click/double-click addition, and keyboard addition. A successful Add reveals, selects, and announces the new element immediately. React Flow is never a second workflow state model. The minimum Start → Task → End path and sequence Transitions remain operable by keyboard and explicit controls without dragging. Conditional Routing is not shown as functional until Epic 4.

The Form Designer uses a constrained twelve-column layout rather than free-form pixel positioning. It provides separate Fields and Layout palette groups, Form canvas, properties panel, runtime-accurate preview, validation summary, and persistent save status. Palette items support drag/drop through dnd-kit, click/double-click addition, and explicit Move controls. Epic 1 supports Short Text plus Section, Heading, Instruction Text, and Divider through extensible typed registry entries. Later field types, calculations, rules, and conditional layout behavior extend that registry without replacing the document contract.

Contrast targets: normal text and controls meet at least 4.5:1 against their adjacent surface; large text meets 3:1; focus indicators and meaningful non-text state indicators meet 3:1. These targets must be verified after implementation.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Explain one decision at the moment it is needed | Present a technical configuration wall at first launch |
| Use calm sea-and-nature cues as restraint and clarity | Add literal waves, beach imagery, or decorative gradients everywhere |
| Pair color with text, labels, and icons | Use color as the only state or permission signal |
| Make the next action obvious | Make users understand BPMN before they can build |
| Keep guidance available without making it mandatory | Trap experienced users in a tutorial |
