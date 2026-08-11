# Story 1.38: Polish the Authenticated Stakeholder Journey

Status: ready-for-dev

## Story

As a company stakeholder,
I want the authenticated thin journey to use the approved visual system and separated modules,
so that I can evaluate Moviqo's product value without unfinished interface quality or confusing navigation distracting from the workflow.

## Acceptance Criteria

1. **Apply the system across authenticated modules:** Dashboard, My Tasks, My Processes, Start Process, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail/timeline compose the approved Story 1.34 primitives and Stories 1.35-1.37 architecture with consistent containers, spacing, typography, cards, statuses, breadcrumbs, empty states, and action bars. No browser-default or missing page-level control style remains.

2. **Present coherent module navigation:** Role-appropriate navigation clearly separates authoring from runtime. Workflow catalog/create/design, Task-to-Form design, validation/publication, Start Process, Task completion, and Process timeline transitions preserve user context and use predictable back/breadcrumb behavior without returning to unrelated combined pages.

3. **Make editor interactions self-evident:** Workflow and Form palette actions produce immediate visible selection/reveal and localized feedback. Canvas/palette/properties hierarchy is clear, disabled operations explain why when necessary, save/conflict status remains persistent, and action priority does not resemble an undifferentiated button wall.

4. **Prioritize authorized work and progress:** Dashboard summaries lead to dedicated Start Process, Tasks, and Processes modules. Cards prioritize authorized information and next action without exposing Process Data. Operational layouts reflow for supported narrow screens; full Workflow/Form authoring communicates its desktop boundary.

5. **Complete bilingual and accessibility polish:** Spanish spelling/accents and English copy are reviewed across navigation, empty/error states, Workflow/Form palettes, properties, validation, publication, runtime handoffs, and support guidance. Visible focus, reduced motion, non-color-only states, headings/landmarks, and practical target sizes are preserved.

6. **Approve the exact presentation manually:** Human-reviewed desktop/mobile operational screenshots and supported desktop authoring screenshots demonstrate the approved palette, alignment, hierarchy, modules, interactions, and responsive behavior. Focused unit/component/integration checks remain green, and a manual walkthrough verifies the complete stakeholder path, recovery behavior, bilingual presentation, and authoring-to-runtime continuity on the exact built revision.

Traceability: UX-DR3-UX-DR24, AD-9, AD-12, AD-16, NFR16, NFR30.

## Tasks / Subtasks

- [ ] Polish authenticated shell and catalogs (AC: 1, 2, 4)
  - [ ] Apply navigation, page heading, content container, card, empty/error state, and action patterns.
  - [ ] Ensure Dashboard is an overview and dedicated modules own full Tasks, Processes, Start, Workflows, and Forms behavior.

- [ ] Polish Workflow/Form authoring transitions (AC: 2, 3)
  - [ ] Verify Workflow create -> Designer -> selected Task -> Form Designer -> Workflow -> Validate -> Publish continuity.
  - [ ] Replace ambiguous button groups with palettes, contextual properties, persistent state, and one dominant action per region.
  - [ ] Confirm immediate Add feedback and keyboard alternatives in both editors.

- [ ] Polish runtime journey (AC: 1, 4)
  - [ ] Apply the shared Task Form renderer and recoverable validation patterns.
  - [ ] Align Start Process, task completion, and Process timeline handoffs.

- [ ] Complete bilingual/accessibility review (AC: 5)
  - [ ] Review all new module/editor copy and interaction announcements in Spanish and English.
  - [ ] Verify landmarks, focus order, reduced motion, targets, and non-color-only state.

- [ ] Run the visual checkpoint and manual acceptance (AC: 6)
  - [ ] Capture representative operational desktop/mobile and desktop authoring screenshots.
  - [ ] Resolve visual/navigation defects before Story 1.39.
  - [ ] Run affected unit, component, integration, architecture, type, and build/static checks.
  - [ ] Manually walk the polished public, authoring, and runtime path on the exact built revision and record blocking defects and approval.

## Dev Notes

- This story integrates and polishes completed foundations; it must not create another Workflow/Form state model.
- Do not imply mobile supports full authoring. Operational flows remain responsive; authoring may provide safe view/navigation below the supported desktop width.
- Human visual review is required in addition to automated contrast/accessibility evidence.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
