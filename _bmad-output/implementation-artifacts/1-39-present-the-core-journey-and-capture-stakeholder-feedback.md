# Story 1.39: Present the Core Journey and Capture Stakeholder Feedback

Status: ready-for-dev

## Story

As a product team,
I want to present the polished deployed core journey to company stakeholders,
so that we can validate its direction and capture actionable feedback.

## Acceptance Criteria

1. **Present the polished functional thin slice:** Given Stories 1.34-1.38 are complete and their focused automated checks and manual acceptance are complete, the selected synthetic-only UAT revision manually demonstrates landing, registration, verification, sign-in, Workflow catalog/creation, React Flow Workflow design, selected-Task Form design, publication, separate Start Process catalog, Task completion, and completed Process timeline through public contracts using safe synthetic data.

2. **Use the exact reviewed build:** The manually tested and presented revision is recorded before the session and remains unchanged throughout it. The compact synthetic-only indicator remains visible where required; no database, private API, authentication, authorization, migration, or deployment bypass is used.

3. **Capture actionable feedback safely:** The review record identifies the build, date, participants, observations, prioritized follow-up, blocking defects, and owners without credentials, tokens, Process Data, private links, private invitation/verification links, or other secrets.

4. **State the decision boundary honestly:** The record states whether the thin slice is suitable for continued stakeholder feedback. It does not certify feature-complete Gate 1, public-beta/production readiness, real-data use, or WCAG conformance; Stories 10.7-10.9 retain comprehensive qualification ownership.

5. **Use manual stakeholder acceptance:** Existing visual approvals and focused Story 1.34-1.38 unit/component/contract/integration evidence are reviewed before the session. The product team manually exercises the stakeholder path, records observations and blocking defects, and does not create additional automated journey requirements as part of this story.

Traceability: Gate 1 early-feedback milestone, AD-9, AD-11, AD-12, AD-16, UX-DR12, UX-DR13, UX-DR23, UX-DR24, UX-DR25.

## Tasks / Subtasks

- [ ] Confirm presentation prerequisites (AC: 1, 2, 5)
  - [ ] Verify Stories 1.34-1.38 are complete with approved visual checkpoints.
  - [ ] Record the selected UAT revision, confirm it reports `synthetic-only`, and complete the documented manual acceptance checklist before stakeholder presentation.
  - [ ] Prepare safe synthetic Workflow, Task Form, Process, and participant data without secrets or prohibited data.

- [ ] Conduct the stakeholder walkthrough (AC: 1, 2)
  - [ ] Demonstrate public/onboarding, separated modules, Workflow/Form authoring, publication, runtime start/task/process completion, and recovery behavior.
  - [ ] Do not use hidden implementation shortcuts or imply later Epic 3/4 capabilities are complete.

- [ ] Record and triage feedback (AC: 3, 4)
  - [ ] Capture observations and prioritize them as blocking, next, later, or out of scope with owners.
  - [ ] Record the continued-feedback decision and its explicit non-certification boundaries.

- [ ] Preserve evidence safely (AC: 3, 5)
  - [ ] Link the manual checklist, reviewed revision, screenshots, and visual evidence using safe references.
  - [ ] Confirm the record excludes credentials, tokens, Process Data, and private links.

## Dev Notes

- This is a presentation and decision story, not an implementation catch-all.
- A defect discovered during the walkthrough is documented and routed to the smallest owning story/change; do not hide it in the review record.
- Follow the established GitHub-to-Cloud-Run deployment flow and exact-build ordering from repository instructions. Do not assume migrations run automatically.

## References

- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
