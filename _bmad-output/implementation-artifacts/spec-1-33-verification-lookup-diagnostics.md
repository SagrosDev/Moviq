---
title: 'Diagnose synthetic verification-link lookup failures safely'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Diagnose synthetic verification-link lookup failures safely

## Intent

**Problem:** The exact UAT build still returns the same synthetic verification-link `404` after successful Resend delivery, while the public response intentionally hides which internal lookup gate failed.

**Approach:** Classify each bounded outbox and scope state with fixed, privacy-safe enums, then record only the allowlisted reason through a dedicated redacted logger without changing the public `404` contract.

## Suggested Review Order

**Lookup evidence**

- Classify not-enqueued, pending, processing, expired-lease, retrying, dead-lettered, malformed, mismatched, truncated, and delivered states with deterministic precedence.
  [`__init__.py:35`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L35)

- Assign fixed reason codes for scope, membership, delivery, recipient, and link-parsing failures.
  [`registration.py:497`](../../Moviqo.Back/src/moviqo/modules/organizations/application/registration.py#L497)

**Safe observability**

- Allowlist and emit only the fixed reason code while preserving the synthetic endpoint's public `404` response.
  [`views.py:511`](../../Moviqo.Back/src/moviqo/modules/organizations/application/views.py#L511)

- Prove diagnostic logs exclude the email, run token, operator key, and verification URL while the public problem-details schema stays unchanged.
  [`test_registration_contract.py:290`](../../Moviqo.Back/tests/contract/test_registration_contract.py#L290)
