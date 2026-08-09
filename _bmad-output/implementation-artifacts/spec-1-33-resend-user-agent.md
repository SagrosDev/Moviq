---
title: 'Send the required Resend User-Agent header'
type: 'bugfix'
created: '2026-08-09'
status: 'done'
route: 'one-shot'
---

# Send the required Resend User-Agent header

## Intent

**Problem:** Resend rejects Moviqo's direct email API requests with HTTP 403 because the application does not explicitly identify itself with the required `User-Agent` header.

**Approach:** Add the safe static identifier `moviqo-back/1.0` to every Resend request and verify it for both synthetic-journey and normal-recipient delivery paths.

## Suggested Review Order

**Provider request**

- Define a stable identifier without embedding environment or customer information.
  [`__init__.py:25`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L25)

- Attach the required header to every Resend email request.
  [`__init__.py:303`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L303)

**Verification**

- Prove synthetic delivery carries the explicit application identity.
  [`test_resend_delivery.py:26`](../../Moviqo.Back/tests/unit/test_resend_delivery.py#L26)

- Prove normal customer-recipient delivery carries the same header.
  [`test_resend_delivery.py:76`](../../Moviqo.Back/tests/unit/test_resend_delivery.py#L76)
