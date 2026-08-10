# Story 1.37: Establish the Dedicated Schema-Driven Form Designer

Status: ready-for-dev

## Story

As a Workflow Designer and Task participant,
I want a dedicated visual Form Designer and runtime rendering to use the same typed definitions,
so that the Form is easy to compose and remains identical in meaning when someone completes the Task.

## Acceptance Criteria

1. **Open a canonical Task-scoped Designer:** `/workflows/:workflowId/tasks/:taskElementId/form` loads the authorized revisioned Workflow draft, verifies that the element is a Task, displays Workflow/Task breadcrumbs and save state, and provides safe return to the Workflow Designer. `/forms` selects an authorized Workflow then one of its Tasks and navigates to the same canonical route.

2. **Establish typed field and structural registries:** A source-owned registry in `features/task-form` defines Short Text configuration, default creation, preview/runtime renderer, value behavior, and presentation validation. Discriminated structural definitions cover Section, Heading, Instruction Text, and Divider without creating Process Data. Unsupported items fail safely and cannot silently disappear.

3. **Build a dedicated constrained workspace:** `features/form-design` provides separate Fields/Layout palettes, twelve-column Form canvas, selected-item properties, runtime-accurate preview, validation summary, and persistent save status. Layout uses approved full, half, third, and quarter spans rather than free-form pixel positioning and reflows safely on supported narrow operational views.

4. **Adopt dnd-kit as interaction adapter:** Select and pin a stable React-19/TypeScript-6-compatible dnd-kit package set. It owns only drag/sort gesture feedback. Drop, click/double-click Add, explicit Move up/down, and width changes dispatch the same Form reducer operations; Moviqo stable IDs, item order, selection, document, revision, conflict, validation, and save behavior remain authoritative.

5. **Render operational Forms from the same registry:** `TaskFormRenderer` in `features/task-form` composes domain-free `shared/ui` fields and Form Grid. Designer preview reuses its item renderers so labels, help, required state, placeholder, width, structural content, disabled state, values, and validation do not drift.

6. **Preserve the data, feature, and explicit-save boundary:** Process Field IDs, Task bindings, control/item IDs, position, width, Task/definition revisions, Save draft, Complete task, idempotency, authorization, and server validation remain governed by the existing generated/backend contracts and explicit reducers. Form Designer changes remain local until **Save draft**, `Ctrl/Cmd+S`, or the guarded Save-and-return action is chosen; no timer, change effect, drag, blur, or navigation autosaves. `features/form-design` and `features/workflow-design` share public entity/document contracts and never deep-import each other. No general Form schema/store becomes authoritative.

7. **Make validation recoverable:** Runtime and Designer Forms provide localized error summaries, associated inline errors, first-invalid-item focus/reveal, non-field failure treatment, non-color-only state, and correction behavior consistent with Story 1.34. Correctable values remain available and correlation IDs remain secondary support information.

8. **Verify design/runtime parity and manual persistence:** Component/contract tests prove route/launcher behavior, registry resolution, Short Text and structural items, approved spans/reflow, dnd-kit plus explicit alternatives, preview/runtime parity, focus/error recovery, explicit Save Draft, no background save requests, dirty navigation, conflict behavior, incomplete coherent Form saving, and unknown-item fail-safe handling. Story 1.33 remains the deployed regression.

Traceability: FR48, FR108-FR113, FR168-FR185, FR194, FR222, FR227, FR235, FR240, AD-4, AD-5, AD-7, AD-9, UX-DR3-UX-DR6, UX-DR14, UX-DR17, UX-DR20, UX-DR21, NFR16, NFR25.

## Tasks / Subtasks

- [ ] Evolve the authoritative Form document contract (AC: 2, 6)
  - [ ] Define discriminated field-binding and structural-item shapes with stable IDs, positions, and approved spans.
  - [ ] Update backend schema validation/serialization, generated OpenAPI types, and existing draft save/publication behavior as required.
  - [ ] Keep structural items non-data and prevent them from receiving Process Field bindings or runtime values.

- [ ] Implement shared registries/renderers (AC: 2, 5)
  - [ ] Define Short Text and structural registry entries with exhaustive resolution.
  - [ ] Build `TaskFormRenderer` from domain-free shared UI primitives and Form Grid.
  - [ ] Reuse the same item renderers in Designer preview and fail safely for unknown kinds.

- [ ] Build the route-level Form Designer (AC: 1, 3, 6)
  - [ ] Load the route-scoped draft and initialize `useFormDesigner` without global editor Context.
  - [ ] Create Fields/Layout palettes, canvas, properties, preview, validation, breadcrumbs, and save-status composition.
  - [ ] Keep Workflow/Task identity visible and navigate safely back to the selected Task in the Workflow Designer.

- [ ] Pin and integrate dnd-kit (AC: 4)
  - [ ] Record the selected stable package/version and accessibility configuration.
  - [ ] Implement pointer and keyboard drag/sort with localized screen-reader instructions and announcements.
  - [ ] Route drag, click/double-click, Move, and width actions through the same reducer commands.

- [ ] Implement recovery and parity (AC: 5, 7)
  - [ ] Map server `invalidParams` paths to visible fields/items or an actionable Form-level message.
  - [ ] Focus/reveal the first invalid item and preserve correctable values across rejection/conflict recovery.
  - [ ] Verify Designer preview and runtime output for every Epic 1 registry item.

- [ ] Implement explicit Form Designer persistence (AC: 1, 6, 8)
  - [ ] Remove/reject autosave orchestration and add Save Draft plus `Ctrl/Cmd+S` over one immutable revision-aware command path.
  - [ ] Preserve local edits during save failure/conflict, expose an explicit retry, and use a new idempotency key only when the payload changes.
  - [ ] Guard return-to-Workflow and other navigation with Save/Discard/Stay; successful save returns to the same Task context without implying publication readiness.

- [ ] Verify the architecture and experience (AC: 8)
  - [ ] Add component/contract tests for routes, registries, layout, interactions, parity, focus, errors, and revisioned save/complete behavior.
  - [ ] Extend architecture checks for feature boundaries and absence of a second Form document/store.
  - [ ] Run affected backend/frontend unit, contract, architecture, type, generated-client, build/static, and existing local journey checks.

## Dev Notes

- A custom Form architecture does not mean raw controls. Shared accessible components supply visual/interaction quality; typed registries supply Moviqo meaning.
- Structural controls are the only Epic 3 capability pulled forward: Section, Heading, Instruction Text, and Divider. Rich fields, tables, calculations, conditional behavior, and validation-rule builders remain Epic 3.
- dnd-kit accessibility defaults require localized instructions/announcements and are not sufficient without product-specific testing. Explicit non-drag operations remain mandatory.
- The backend currently saves the full revisioned Workflow draft. The Form Designer therefore edits the Task-scoped portion of that document and must handle revision conflicts, not invent an independent Form resource without a separate architecture decision.
- Form Designer persistence is explicit. dnd-kit events update only the local reducer; they never cause background requests. Save Draft may persist incomplete but structurally coherent Form layout/configuration, while Workflow publication validation remains the completeness gate.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
- https://dndkit.com/react/hooks/use-sortable/
- https://docs.dndkit.com/guides/accessibility
