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
  surface-base: '#F7FBFA'
  surface-raised: '#FFFFFF'
  surface-soft: '#E7F3F1'
  ink-primary: '#173B3A'
  ink-secondary: '#55706E'
  ink-disabled: '#9AAEAB'
  primary: '#167C80'
  primary-foreground: '#FFFFFF'
  accent: '#D7A84B'
  border: '#C9DEDA'
  error: '#B54747'
  success: '#2E8063'
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

Contrast targets: normal text and controls meet at least 4.5:1 against their adjacent surface; large text meets 3:1; focus indicators and meaningful non-text state indicators meet 3:1. These targets must be verified after implementation.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Explain one decision at the moment it is needed | Present a technical configuration wall at first launch |
| Use calm sea-and-nature cues as restraint and clarity | Add literal waves, beach imagery, or decorative gradients everywhere |
| Pair color with text, labels, and icons | Use color as the only state or permission signal |
| Make the next action obvious | Make users understand BPMN before they can build |
| Keep guidance available without making it mandatory | Trap experienced users in a tutorial |
