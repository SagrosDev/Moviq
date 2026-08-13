---
title: 'Keep Form canvas control types visible after renaming'
type: 'feature'
created: '2026-08-13'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e345c4e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Form canvas cards currently present only mutable labels or content. Once a designer renames “Section” to “Applicant data,” the canvas no longer communicates that the item is a Section; Dividers expose an internal identifier such as `divider-5`. The full-width text drag handle also dominates each card, while mixed-width dragging can miss the intended target and temporarily stretch, shrink, or overlap cards.

**Approach:** Redesign the card header as one compact row containing the persistent localized type/icon and an icon-only reorder handle with an accessible tooltip. Make pointer collision detection follow the item under the pointer, keep keyboard fallback behavior, and prevent sortable transforms from scaling cards across different grid spans.

## Boundaries & Constraints

**Always:** Show the localized type for Short text, Section, Heading, Instruction text, and Divider. Reuse one Form Designer-owned type-icon implementation in the palette and canvas. Keep decorative icons hidden from assistive technology, keep visible type text in the selection button’s accessible name, and give the reorder icon the existing localized drag label through an accessible name and tooltip. Preserve the selection button ID, keyboard Space/arrow sorting, explicit Move actions, spans, disabled semantics, and 44px targets. Pointer drops must resolve from the item under the pointer with a keyboard-compatible fallback. Dragged and displaced cards retain their original visual scale. Use approved Tailwind tokens and existing localization messages.

**Ask First:** Any new icon dependency, shared-UI API change, new Form item type, document/schema change, drag library replacement, or removal of a non-drag alternative.

**Never:** Infer the type from user-authored text, show raw stable IDs as the primary card label, create a focus target solely for the marker, move domain-aware icons into `shared/ui`, scale a card to match another span during drag, rely only on center-distance collision for pointer input, or change persistence/runtime behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Renamed structural item | Section content is “Applicant data” | Card shows Section icon/type and “Applicant data” | Type remains independent of content |
| Renamed field | Short Text placement label is customized | Card shows Short Text icon/type and custom label | Shared field identity is unchanged |
| Divider | Divider has no author content | Card shows Divider icon/type without exposing `divider-*` | Selection and sorting remain available |
| Blank invalid content | Heading/Section/Instruction content is blank | Type marker remains identifiable while validation handles missing content | No internal ID is used as user guidance |
| Read-only editor | Lease is held elsewhere | Type markers remain visible; existing controls remain disabled | No new interactive marker is introduced |
| Mixed grid spans | Half-width item is dragged over full-width item | Pointer target becomes the reorder destination and cards retain stable proportions | Dropping outside valid targets leaves order unchanged |
| Keyboard reorder | Drag handle receives Space and arrow input | Existing localized announcements and deterministic reorder remain | Pointer-specific collision logic falls back safely |

</frozen-after-approval>

## Code Map

- `Moviqo.Front/src/features/form-design/ui/FormDesignerItemTypeIcon.tsx` — feature-owned decorative icon source shared by palette and canvas.
- `Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx` — palette consumer of the shared type icon.
- `Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx` — canvas card type marker, authored label/content, and accessible selection name.
- `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx` — pointer-aware collision strategy and drag lifecycle authority.
- `Moviqo.Front/src/shared/localization/messages.ts` — existing bilingual Form item type labels; no new keys expected.
- `Moviqo.Front/tests/unit/form-designer.test.cts` — structural regression for shared icons, localized type marker, and hidden internal IDs.
- `Moviqo.Front/tests/e2e/form-designer.spec.ts` — browser evidence that renamed items retain visible type identity.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerItemTypeIcon.tsx` — extract the palette SVGs into one typed, decorative Form Designer icon component.
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx` — consume the extracted icon without changing add/drag/keyboard behavior.
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx` — compose a compact card header with type marker, authored label, and icon-only accessible drag handle; omit internal IDs and preserve card scale during mixed-span sorting.
- [x] `Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx` — prefer pointer-under-item collisions with closest-center fallback for keyboard input and preserve authoritative reducer updates on valid drop only.
- [x] `Moviqo.Front/tests/unit/form-designer.test.cts` — verify shared icons, marker/handle accessibility, pointer collision fallback, translation-only transforms, and absence of raw-ID presentation.
- [x] `Moviqo.Front/tests/e2e/form-designer.spec.ts` — assert renamed items retain type labels, Divider hides its ID, and mixed-width pointer plus keyboard reorders persist without distorted drag presentation.

**Acceptance Criteria:**
- Given any supported Form item has been renamed, when its canvas card renders, then the localized immutable control type remains visible beside its matching icon.
- Given a keyboard or screen-reader user focuses a canvas item, when the selection button is announced, then its accessible name contains the control type and available authored label/content without an extra focus stop.
- Given a Divider or blank structural item renders, when the designer reviews the canvas, then its type is understandable without exposing a generated identifier.
- Given the editor is editable or read-only, when type markers render, then all existing selection, sorting, focus, sizing, and disabled behavior remains unchanged.
- Given differently sized items share the canvas, when one is dragged over another, then the hovered item determines the destination and neither card is visually rescaled or structurally distorted.
- Given the compact reorder button is focused or hovered, when its purpose is requested, then the existing localized “Drag to reorder” text is available without consuming the card width.

## Spec Change Log

- 2026-08-13 review patches: kept keyboard drag order provisional until drop so Escape cannot dirty or save an unfinished reorder; scoped visual pointer hit-testing to the active Form Designer workspace; removed duplicate accessible tooltip description; stabilized mixed-span and cancellation browser assertions.

## Design Notes

The type marker and authored label belong inside the existing canvas selection button, while the reorder control remains the only dedicated drag focus target beside it. A decorative icon supports scanning; localized visible type text provides non-color meaning. Pointer-first collision detection addresses mixed grid spans, while closest-center fallback retains keyboard coordinate support. Translation-only sortable transforms prevent dnd-kit’s rectangle scaling from deforming cards of different widths.

## Verification

**Commands:**
- `npm run typecheck` — TypeScript accepts the extracted icon and item-kind mapping.
- `npm run test:unit` — Form Designer and existing frontend regressions pass.
- `npm run test:architecture` — feature/shared boundaries remain valid.
- `$env:CI='true'; $env:MOVIQO_E2E_REUSE_SERVER='1'; .\node_modules\.bin\playwright.cmd test tests/e2e/form-designer.spec.ts --project=chromium-desktop --reporter=line` — browser confirms persistent type identity after rename.
- `npm run build` — production generation and artifact scans pass.
- `git diff --check` — no whitespace errors.

**Manual checks:**
- Add all five item types, rename editable content, and confirm each remains immediately identifiable in Spanish and English.

## Suggested Review Order

**Drag lifecycle and geometry**

- Pointer targeting follows the visible item while keyboard movement commits only on drop.
  [`FormDesignerWorkspace.tsx:66`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx#L66)

- Drop completion applies one authoritative reducer command; cancellation remains non-mutating.
  [`FormDesignerWorkspace.tsx:209`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx#L209)

- The fixed-size overlay prevents mixed-span cards from stretching during movement.
  [`FormDesignerWorkspace.tsx:479`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerWorkspace.tsx#L479)

**Canvas identity and controls**

- Immutable localized type identity stays separate from mutable authored content.
  [`FormDesignerCanvas.tsx:58`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx#L58)

- Compact selection and reorder controls preserve 44-pixel targets and keyboard access.
  [`FormDesignerCanvas.tsx:104`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerCanvas.tsx#L104)

- One feature-owned icon source keeps palette and canvas representations consistent.
  [`FormDesignerItemTypeIcon.tsx:9`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerItemTypeIcon.tsx#L9)

- Equal-width palette controls reuse those icons without changing add behavior.
  [`FormDesignerPalette.tsx:23`](../../Moviqo.Front/src/features/form-design/ui/FormDesignerPalette.tsx#L23)

**Regression evidence**

- Browser coverage proves renamed identity, cancel, pointer order, stable scale, and persistence.
  [`form-designer.spec.ts:204`](../../Moviqo.Front/tests/e2e/form-designer.spec.ts#L204)

- Structural checks protect feature boundaries, accessibility, transforms, and hidden IDs.
  [`form-designer.test.cts:410`](../../Moviqo.Front/tests/unit/form-designer.test.cts#L410)
