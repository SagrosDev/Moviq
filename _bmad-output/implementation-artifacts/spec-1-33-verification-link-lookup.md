---
title: 'Read delivered synthetic verification links reliably'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Read delivered synthetic verification links reliably

## Intent

**Problem:** UAT successfully delivers the synthetic registration email through Resend, but the deployed journey cannot retrieve its verification link because the delivered outbox lookup relies on database-specific JSON-array equality.

**Approach:** Select delivered registration candidates using tenant, message type, creation time, and delivery state, then apply the exact recipient comparison to decoded JSON payloads in application code. Keep the query streamed and prove the behavior against PostgreSQL.

## Suggested Review Order

**Delivered-message lookup**

- Preserve tenant, message-type, time-window, delivery, and dead-letter constraints while matching the decoded recipient exactly.
  [`__init__.py:65`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L65)

**Verification**

- Prove a delivered synthetic registration message can be retrieved from PostgreSQL and exposes its single-use verification link.
  [`test_email_verification_integration.py:118`](../../Moviqo.Back/tests/integration/test_email_verification_integration.py#L118)
