---
title: 'Document the repeatable UAT release procedure'
type: 'chore'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Document the Repeatable UAT Release Procedure

## Intent

**Problem:** UAT releases required reconstructing when to update Cloud Run services and jobs, Firebase Hosting, and Resend, which made routine merges slow and error-prone.

**Approach:** Add one operational runbook with a change-based decision matrix, safe release ordering, pinned Firebase commands, verification stop conditions, and direct UAT console links.

## Suggested Review Order

**Release decisions and safety**

- Start with the matrix that determines which UAT targets change.
  [`UAT-RELEASE-RUNBOOK.md:23`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L23)

- Verify migration releases stop unless build, migrate, and deploy are ordered safely.
  [`UAT-RELEASE-RUNBOOK.md:39`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L39)

- Confirm provenance mismatches stop instead of being hidden by environment edits.
  [`UAT-RELEASE-RUNBOOK.md:65`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L65)

**Operator procedures**

- Review the pinned, copy-paste Firebase deployment procedure.
  [`UAT-RELEASE-RUNBOOK.md:108`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L108)

- Use direct console links during each release.
  [`UAT-RELEASE-RUNBOOK.md:180`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L180)

- Finish with explicit release stop conditions.
  [`UAT-RELEASE-RUNBOOK.md:204`](../../Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md#L204)
