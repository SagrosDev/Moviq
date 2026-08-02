# PRD Reconciliation Review

## Verdict

Pass with two clear amendments. The spine covers the PRD's load-bearing capabilities and preserves PRD authority, but the environment gates and database RLS execution mechanics need to be made harder to misread.

## Coverage checked

- Organization-scoped identity, roles, Teams, and one-Organization account model
- Workflow graph/Form/rule design, immutable publication, restoration, and live-version concurrency
- Process execution, Tasks, Team claiming, assignments, Process Data, routing, calculations, and audit
- Private files, notifications, exports, quotas, dormancy/deletion, localization, security, and release gates
- Performance envelope, idempotency, all-or-nothing mutation, monitoring, and backup requirements
- Landing-to-completed-Process internal journey and later public-beta readiness

## Findings

### High — Internal E2E can be mistaken for the PRD's real-data public beta

The spine defers malware inspection, independent backup/restore, and lifecycle schedulers for company-only synthetic E2E, while the PRD requires those safeguards before permitted real data. This is consistent with the user's approved sequencing, but the distinction is spread across AD-8, AD-10, AD-11, AD-13, and Deferred.

**Disposition:** Autofix. Add one Environment Gates section defining Internal E2E and Real-data/Public Beta as explicit promotion states with blocking conditions.

### High — RLS rule lacks connection-role and transaction-setting mechanics

AD-2 requires PostgreSQL RLS but does not state how Django pooled connections receive and clear tenant context or which roles may bypass RLS. Independent builders could implement unsafe session-level context or run the API as a table owner.

**Disposition:** Autofix. Require `SET LOCAL` tenant context inside every transaction, FORCE ROW LEVEL SECURITY, non-owner/no-BYPASSRLS runtime roles, and separate migration/maintenance credentials.

## Quiet requirements that landed

- Backend-authoritative authorization and no cross-tenant existence disclosure
- Immutable versions and exact-version Task occurrence evidence
- Transactional audit/outbox with delivery failure isolated from business commits
- Spanish/English application localization and Organization regional formats
- Synthetic Gate 1-style E2E journey and later real-data release safeguards
- TDD and isolation/release evidence as implementation gates
