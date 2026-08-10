# Story 1.39: Present the Core Journey and Capture Stakeholder Feedback

Status: ready-for-dev

## Story

As a product team,
I want to present the polished deployed core journey to company stakeholders,
so that we can validate its direction and capture actionable feedback.

## Acceptance Criteria

1. **Present the polished functional thin slice:** Given Stories 1.34-1.38 are complete and a synthetic-only UAT build has a passing Story 1.33 deployed journey, the public UI demonstrates landing, registration, verification, sign-in, Workflow catalog/creation, React Flow Workflow design, selected-Task Form design, publication, separate Start Process catalog, Task completion, and completed Process timeline through public contracts using safe synthetic data.

2. **Use the exact reviewed build:** The presented revision matches the immutable build verified by Story 1.33 after deployment. The compact synthetic-only indicator remains visible where required; no database, private API, authentication, authorization, migration, or deployment bypass is used.

3. **Capture actionable feedback safely:** The review record identifies the build, date, participants, observations, prioritized follow-up, blocking defects, and owners without credentials, tokens, Process Data, private links, private invitation/verification links, or other secrets.

4. **State the decision boundary honestly:** The record states whether the thin slice is suitable for continued stakeholder feedback. It does not certify feature-complete Gate 1, public-beta/production readiness, real-data use, or WCAG conformance; Stories 10.7-10.9 retain comprehensive qualification ownership.

5. **Avoid a new testing program:** Existing visual approvals, focused Story 1.34-1.38 evidence, and the Story 1.33 exact-build journey are reused. No new deployed E2E suite, browser matrix, evidence schema, validator, CI gate, or unrelated implementation is required unless the walkthrough reveals a blocking defect.

Traceability: Gate 1 early-feedback milestone, AD-9, AD-11, AD-12, AD-16, UX-DR12, UX-DR13, UX-DR23, UX-DR24, UX-DR25.

## Tasks / Subtasks

- [ ] Confirm presentation prerequisites (AC: 1, 2, 5)
  - [ ] Verify Stories 1.34-1.38 are complete with approved visual checkpoints.
  - [ ] Confirm the deployed UAT build matches the Story 1.33 evidence and reports `synthetic-only`.
  - [ ] Prepare safe synthetic Workflow, Task Form, Process, and participant data without secrets or prohibited data.

- [ ] Conduct the stakeholder walkthrough (AC: 1, 2)
  - [ ] Demonstrate public/onboarding, separated modules, Workflow/Form authoring, publication, runtime start/task/process completion, and recovery behavior.
  - [ ] Do not use hidden implementation shortcuts or imply later Epic 3/4 capabilities are complete.

- [ ] Record and triage feedback (AC: 3, 4)
  - [ ] Capture observations and prioritize them as blocking, next, later, or out of scope with owners.
  - [ ] Record the continued-feedback decision and its explicit non-certification boundaries.

- [ ] Preserve evidence safely (AC: 3, 5)
  - [ ] Link existing exact-build and visual evidence using safe references.
  - [ ] Confirm the record excludes credentials, tokens, Process Data, and private links.

## Dev Notes

- This is a presentation and decision story, not an implementation catch-all.
- A defect discovered during the walkthrough is documented and routed to the smallest owning story/change; do not hide it in the review record.
- Follow the established GitHub-to-Cloud-Run deployment flow and exact-build ordering from repository instructions. Do not assume migrations run automatically.

## References

- `_bmad-output/implementation-artifacts/1-33-automate-the-first-workflow-e2e-journey.md`
- `_bmad-output/implementation-artifacts/1-34-establish-the-stakeholder-ready-frontend-system.md`
- `_bmad-output/implementation-artifacts/1-35-separate-the-application-modules-and-establish-authoring-navigation.md`
- `_bmad-output/implementation-artifacts/1-36-refactor-the-workflow-editor-and-adopt-react-flow.md`
- `_bmad-output/implementation-artifacts/1-37-establish-the-dedicated-schema-driven-form-designer.md`
- `_bmad-output/implementation-artifacts/1-38-polish-the-authenticated-stakeholder-journey.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-10.md`
