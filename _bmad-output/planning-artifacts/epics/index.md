---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - ../prds/prd-Moviqo-2026-07-30/prd.md
  - ../architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md
  - ../ux-designs/ux-Moviqo-2026-08-01/DESIGN.md
  - ../ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md
  - ../implementation-readiness-report-2026-08-02.md
  - ../sprint-change-proposal-2026-08-02.md
  - ../sprint-change-proposal-2026-08-10.md
status: validated
canonical: true
---

# Moviqo — Epic Breakdown

This index is the canonical entry point for the corrected, implementation-oriented backlog. The obsolete whole-document `epics.md` was removed after sharding.

## Foundation

- [Overview](./overview.md)
- [Requirements inventory and FR coverage map](./requirements-inventory.md)
- [Approved epic list](./epic-list.md)

## Corrected epics and stories

1. [Validate the Core Moviqo Journey End to End](./epic-1-validate-the-core-moviqo-journey-end-to-end.md) — 39 active stories; separated authoring/runtime modules, stakeholder-ready public UI, React Flow Workflow authoring, a dedicated drag-enabled schema-driven Form Designer, and a landing-to-completed-Process preview backed by the deployed E2E journey.
2. [Administer the Organization, People, Teams, and Settings](./epic-2-administer-the-organization-people-teams-and-settings.md) — 11 stories.
3. [Expand Forms with Rich Process Data and Business Rules](./epic-3-expand-forms-with-rich-process-data-and-business-rules.md) — 17 stories.
4. [Design and Govern Complete Workflow Definitions](./epic-4-design-and-govern-complete-workflow-definitions.md) — 13 stories.
5. [Coordinate Assigned Work and Runtime Operations](./epic-5-coordinate-assigned-work-and-runtime-operations.md) — 5 stories.
6. [Navigate Work and Track Authorized Processes](./epic-6-navigate-work-and-track-authorized-processes.md) — 6 stories.
7. [Exchange Files and Notify Participants Safely](./epic-7-exchange-files-and-notify-participants-safely.md) — 9 stories.
8. [Inspect Audit Evidence and Govern Retained Data](./epic-8-inspect-audit-evidence-and-govern-retained-data.md) — 7 stories.
9. [Evolve Live Workflows Without Disrupting Active Work](./epic-9-evolve-live-workflows-without-disrupting-active-work.md) — 5 stories.
10. [Complete the Internal Beta Lifecycle and UAT Gate](./epic-10-complete-the-internal-beta-lifecycle-and-uat-gate.md) — 9 stories; feature-complete synthetic-data internal UAT.
11. [Establish Customer Public-Beta Readiness](./epic-11-establish-customer-public-beta-readiness.md) — 9 stories; live inspection, backups, expiry, restoration, and Gate 2.

## Correction controls

- Every FR has exactly one primary epic owner.
- Story criteria use concrete Given/When/Then behavior and named evidence boundaries.
- Architecture decisions AD-1–AD-16 are assigned to their first implementing outcomes and exercised where relevant.
- Physical backup expiry is implemented only after the Epic 11 backup substrate exists.
- Gate 1 permits company stakeholders and synthetic data only; Gate 2 is required before invited customers or permitted real data.
