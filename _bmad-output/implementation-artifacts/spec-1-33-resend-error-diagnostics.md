---
title: 'Expose safe Resend delivery failure diagnostics'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Expose safe Resend delivery failure diagnostics

## Intent

**Problem:** The UAT outbox reports only `resend-delivery-failed`, hiding whether Resend returned an actionable HTTP status or the request failed at the network boundary.

**Approach:** Preserve only the bounded HTTP status category or a generic network-failure category while continuing to exclude provider bodies, URLs, headers, API keys, recipients, and email content from logs and persisted failure reasons.

## Suggested Review Order

**Failure classification**

- Separate safe HTTP status diagnostics from network failures at the provider boundary.
  [`__init__.py:309`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L309)

- Permit only bounded HTTP status categories into persisted outbox diagnostics.
  [`__init__.py:401`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L401)

**Verification**

- Prove HTTP and network categories exclude provider response details.
  [`test_resend_delivery.py:298`](../../Moviqo.Back/tests/unit/test_resend_delivery.py#L298)
