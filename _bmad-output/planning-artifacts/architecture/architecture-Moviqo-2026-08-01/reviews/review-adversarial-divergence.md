# Adversarial Divergence Review

## Verdict

Pass after autofixes. Two independently implemented compliant feature units were modeled for each load-bearing boundary; the amended rules now prevent materially different transaction, tenant, and document-version semantics.

## Construction tests

### Case 1 — Task completion spans WorkflowRuntime, Files, Governance, and Messaging

Two teams could both claim compliance while one commits inside each module and another uses one outer transaction. They could also scope idempotency differently.

**Finding: High.** AD-3 did not explicitly identify the transaction owner or unique idempotency scope.

**Autofix applied:** the outer application coordinator owns one transaction; called module contracts join and never commit; retryable keys are unique by Organization, command type, and key, with request-content mismatch rejection.

### Case 2 — Old workflow snapshots are read after schema evolution

Two teams could both use `schemaVersion` while one mutates documents in place and another adds ad hoc readers, yielding incompatible immutable history.

**Finding: High.** AD-4 lacked one owner and compatibility mechanism for versioned JSONB.

**Autofix applied:** one backend schema registry owns versions; current writers are singular; historical readers validate/upcast supported versions; golden fixtures protect history.

### Case 3 — Tenant requests through pooled PostgreSQL connections

Two teams could both enable RLS while one uses a table-owning runtime role or session-scoped tenant state, allowing bypass or tenant leakage after pool reuse.

**Finding: High.** RLS mechanics were underspecified.

**Autofix applied:** transaction-scoped `SET LOCAL`, `FORCE ROW LEVEL SECURITY`, non-owner/no-`BYPASSRLS` runtime roles, separate migration credentials, and no tenant state surviving the transaction.

### Case 4 — Internal file adapter reaches a real-data environment

Two deployments could interpret an absent environment flag differently.

**Finding: High.** Synthetic inspection needed an unambiguous fail-closed selector.

**Autofix applied:** the synthetic adapter starts only under explicit `synthetic-only` classification; ambiguous and real-data configurations reject it.

## Residual implementation checks

- Architecture tests must reject cross-module domain/persistence imports.
- PostgreSQL integration tests must exercise pooled cross-tenant requests and privileged-role separation.
- Contract fixtures must preserve JSONB and rule-AST compatibility.
- Command tests must prove partial commits and mismatched idempotency-key reuse are impossible.

