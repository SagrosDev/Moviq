# Node Runtime Alignment

This companion records the aligned project-authored Node.js version declarations at `26.5.1` so repository guidance, runtime guards, and delivery artifacts describe one approved frontend runtime.

## In Scope

| Path | Current signal | Required alignment |
| --- | --- | --- |
| `Moviqo.Front/package.json` | Root `engines.node` requires `26.5.1`; guarded scripts depend on `check:node`. | Aligned to `26.5.1`. |
| `Moviqo.Front/tests/build/check-node-version.mjs` | Exact-version assertion requires `26.5.1`. | Aligned to `26.5.1`. |
| `Moviqo.Front/package-lock.json` | Root package metadata records `26.5.1`. | Aligned root package metadata to `26.5.1`; third-party dependency engine entries remain vendor-owned. |
| `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` | Stack table states `Node.js 26.5.1`. | Aligned architecture stack baseline. |
| `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/reviews/review-technology-currency.md` | Technology review states `Node.js 26.5.1`. | Aligned approved runtime record. |
| `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` | Acceptance text assumes a clean checkout with `Node.js 26.5.1`. | Aligned story acceptance text. |
| `_bmad-output/planning-artifacts/epics/requirements-inventory.md` | Requirements inventory pins `Node.js 26.5.1`. | Aligned pinned stack entry. |
| `_bmad-output/implementation-artifacts/1-2-establish-the-frontend-application-spine.md` | Story text and notes use `26.5.1` as the required runtime. | Removed stale mismatch framing. |
| `_bmad-output/implementation-artifacts/1-3-establish-the-api-error-build-and-test-contract.md` | Story notes enforce `26.5.1` as the frontend runtime contract. | Aligned contract notes. |
| `_bmad-output/implementation-artifacts/1-4-establish-the-accessible-bilingual-design-foundation.md` | Story narrative and verification notes use `26.5.1` as the runtime baseline. | Aligned story narrative and verification notes. |
| `_bmad-output/implementation-artifacts/1-5-deploy-the-synthetic-data-internal-environment.md` | Story notes use `26.5.1` as the runtime baseline. | Removed stale blocker language. |

## Out of Scope

- Third-party dependency `engines` metadata inside the lockfile remains vendor-owned unless lockfile regeneration changes it naturally.
- Dependency upgrades implied by Node 26 compatibility are separate change work unless verification proves the current stack cannot run on `26.5.1`.
