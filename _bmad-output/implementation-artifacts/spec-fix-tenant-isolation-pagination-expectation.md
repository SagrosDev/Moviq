---
title: 'Fix the tenant-isolation pagination expectation'
type: 'bugfix'
created: '2026-08-14T20:30:00-05:00'
status: 'done'
route: 'one-shot'
---

# Fix the tenant-isolation pagination expectation

## Intent

**Problem:** The tenant-isolation pipeline test still expected the pre-pagination My Work response and failed after the endpoint correctly added page totals to every collection.

**Approach:** Update the exact empty-dashboard expectation with the additive pagination metadata while retaining the hostile organization and membership identifier leakage assertions unchanged.

## Suggested Review Order

- Match the current API contract without weakening hostile-tenant isolation coverage.
  [`test_tenant_isolation.py:1179`](../../Moviqo.Back/tests/integration/test_tenant_isolation.py#L1179)
