---
title: 'Fix deployed-journey verification token lifecycle'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Fix deployed-journey verification token lifecycle

## Intent

**Problem:** The verification navigation helper removed the token query immediately after page load. Because the verification page rereads the current query during its success render, that cleanup changed the view to an invalid-token state before Playwright could observe the successful verification.

**Approach:** Retain the token only until the authoritative response and localized verified UI are visible, then remove it before accessibility inspection. Guarantee the same cleanup on navigation, API, assertion, and accessibility failures before final evidence is captured.

## Suggested Review Order

**Verification lifecycle**

- Keeps the token through the verified render and scrubs it at the safe boundary.
  [`first-workflow-journey.spec.ts:108`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L108)

- Guarantees cleanup when navigation, API, UI, or accessibility validation fails.
  [`first-workflow-journey.spec.ts:121`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L121)

**Safe navigation helpers**

- Leaves successful navigation intact while sanitizing and cleaning failed navigation attempts.
  [`deployedJourney.ts:141`](../../Moviqo.Front/tests/e2e/support/deployedJourney.ts#L141)

- Centralizes token removal without surfacing query contents in diagnostics.
  [`deployedJourney.ts:168`](../../Moviqo.Front/tests/e2e/support/deployedJourney.ts#L168)
