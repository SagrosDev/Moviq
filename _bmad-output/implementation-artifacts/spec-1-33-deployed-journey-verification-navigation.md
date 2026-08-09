---
title: 'Fix deployed-journey verification navigation'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Fix deployed-journey verification navigation

## Intent

**Problem:** The deployed journey inserted the verification token with `history.replaceState`, changed the interface language to force React to notice it, and then asserted an unrelated Spanish introductory heading. The real verification API succeeded, but this brittle browser trigger left the expected success state unobserved.

**Approach:** Open the public verification link through normal browser navigation, wait for the authoritative verification response, remove the sensitive query string, and assert the localized verified-success heading plus the registered email.

## Suggested Review Order

**Safe public-link navigation**

- Exercises the real route while sanitizing failures, HTTP errors, and browser history.
  [`deployedJourney.ts:141`](../../Moviqo.Front/tests/e2e/support/deployedJourney.ts#L141)

**Journey outcome assertion**

- Replaces the language-toggle workaround with navigation and a bilingual success assertion.
  [`first-workflow-journey.spec.ts:110`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L110)

- Confirms the user-visible verified state instead of an unchanged introductory heading.
  [`first-workflow-journey.spec.ts:113`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L113)
