---
title: 'Resolve synthetic membership through tenant RLS safely'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Resolve synthetic membership through tenant RLS safely

## Intent

**Problem:** The deployed verification-link lookup finds its synthetic user but reports `membership-missing` because its bootstrap query joins the Organization table before setting the organization tenant context, so UAT PostgreSQL RLS hides the joined row.

**Approach:** Resolve only the membership and organization identifiers under the user bootstrap policy, then enter that organization's tenant context before loading and validating the joined Membership and Organization state. Reproduce the separate-request boundary with a transactional PostgreSQL integration test and fresh connections.

## Suggested Review Order

**RLS-safe lookup**

- Separate user-bootstrap discovery from tenant-scoped membership and organization validation.
  [`registration.py:564`](../../Moviqo.Back/src/moviqo/modules/organizations/application/registration.py#L564)

**Regression evidence**

- Commit registration and delivery state, close the database connections, and verify lookup through a fresh PostgreSQL transaction.
  [`test_email_verification_integration.py:121`](../../Moviqo.Back/tests/integration/test_email_verification_integration.py#L121)
