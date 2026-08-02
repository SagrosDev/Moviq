# Security and Data-Integrity Review

## Verdict

Pass for architecture finalization. Internal E2E is explicitly synthetic-only, while safeguards omitted from that beta are mandatory release gates before any real customer data is permitted.

## Findings and disposition

### High — RLS can be bypassed by role ownership or leaked pool state

**Disposition:** Fixed in AD-2 with `FORCE ROW LEVEL SECURITY`, transaction-scoped tenant context, restricted runtime roles, separate maintenance credentials, and pool-safety requirements.

### High — Synthetic file approval could accidentally become a production default

**Disposition:** Fixed in AD-8 and Environment Gates. It requires explicit synthetic-only classification and otherwise fails closed.

### High — Deferred safeguards were distributed across several decisions

**Disposition:** Fixed with one binding Environment Gates table. Live inspection, independent backup/restore evidence, lifecycle enforcement, security/isolation checks, and accessibility evidence block real-data/public-beta promotion.

### Medium — Edge caching and proxy interpretation could undermine sessions

**Disposition:** Fixed in AD-7 and AD-11. Hosts, proxy headers, HTTPS and CSRF origins are explicit; API and authenticated responses are never cached.

### Medium — Signed file capabilities needed tighter scope

**Disposition:** Fixed in AD-8. Object keys are server-generated and opaque; upload/read grants are object-specific, least-privilege, and expire within 15 minutes.

## Required verification evidence

- Cross-tenant RLS tests using the actual runtime database role and connection pool.
- CSRF, cookie, trusted-proxy, cache-header, and authorization tests through the deployed Firebase/Cloud Run route.
- File capability tests for wrong tenant, wrong operation, expiry, revoked metadata, and non-approved inspection states.
- Startup/release tests proving each environment gate fails closed.
- Restore evidence and lifecycle-job evidence before real-data/public beta.

