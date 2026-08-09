---
title: 'Stabilize deployed-journey session evidence'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Stabilize deployed-journey session evidence

## Intent

**Problem:** The deployed journey read the successful sign-in browser response body after the SPA navigated to `/my-work`. Chromium can discard that body during navigation, causing a Playwright protocol failure even though authentication and navigation succeeded.

**Approach:** Continue validating the public sign-in response and authenticated `/my-work` UI, then read the safe Organization reference from a fresh `/api/v1/auth/session/` request made through Playwright's cookie-sharing browser request context.

## Suggested Review Order

- Preserves the real UI sign-in action and validates authenticated navigation before evidence collection.
  [`first-workflow-journey.spec.ts:132`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L132)

- Reads stable session evidence through the browser context instead of a discarded response body.
  [`first-workflow-journey.spec.ts:140`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L140)

- Retains strict UUID validation before storing the safe Organization reference.
  [`first-workflow-journey.spec.ts:145`](../../Moviqo.Front/tests/e2e/first-workflow-journey.spec.ts#L145)
