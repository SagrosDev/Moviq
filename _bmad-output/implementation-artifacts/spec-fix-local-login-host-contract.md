---
title: 'Fix the local login host contract'
type: 'bugfix'
created: '2026-08-14T20:05:00-05:00'
status: 'done'
route: 'one-shot'
---

# Fix the local login host contract

## Intent

**Problem:** Local sign-in succeeded through `localhost:5173` but failed through `127.0.0.1:5173` because Django rejected the forwarded Host header and the frontend mislabeled that response as invalid credentials. PostgreSQL resolution through `localhost` also added about 24 seconds to authentication on this Windows environment.

**Approach:** Trust both loopback hostnames only in the integration settings and consistently connect the local PostgreSQL service through IPv4. Keep the PowerShell environment script and direct integration-settings defaults aligned, with a contract test preventing drift.

## Suggested Review Order

**Local runtime contract**

- Support both Vite loopback origins and bypass slow Windows hostname resolution.
  [`use-integration-env.ps1:2`](../../Moviqo.Back/scripts/use-integration-env.ps1#L2)

- Preserve the same behavior when integration settings load without the script.
  [`integration.py:8`](../../Moviqo.Back/src/moviqo/settings/integration.py#L8)

**Regression evidence**

- Prevent the two integration entry paths from drifting again.
  [`test_build_inputs.py:60`](../../Moviqo.Back/tests/unit/test_build_inputs.py#L60)
