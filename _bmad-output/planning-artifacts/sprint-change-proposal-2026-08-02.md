---
project: Moviqo
date: 2026-08-02
status: implemented
approvedBy: Jortiz
approvedOn: 2026-08-02
mode: batch
trigger: implementation-readiness-assessment
scopeClassification: moderate
sourceArtifacts:
  - implementation-readiness-report-2026-08-02.md
  - epics.md
  - prds/prd-Moviqo-2026-07-30/prd.md
  - architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md
  - ux-designs/ux-Moviqo-2026-08-01/DESIGN.md
  - ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md
---

# Sprint Change Proposal: Make the Moviqo Backlog Implementation-Ready

## 1. Issue Summary

The 2026-08-02 Implementation Readiness Assessment found that Moviqo's product scope is complete and aligned, but the current epic and story artifact is not safe to use for sprint planning.

The backlog maps all 632 functional requirements, 31 non-functional requirements, 21 architecture requirements, and 25 UX requirements. The failure is in story execution quality rather than product coverage:

- 1,099 acceptance scenarios use the generic action, `the authorized user exercises the capability or an invalid attempt is evaluated`.
- 1,099 scenarios begin from a generic capability-availability precondition.
- 1,311 verification lines state that a requirement is verified without defining the observable test.
- Stories 1.1, 1.4, 1.9, 1.13, 1.21, and 10.6 exceed a practical single-story outcome.
- Stories 8.6 and 10.4 claim backup-expiration behavior before the backup substrate is delivered in Epic 11.
- Binding architecture mechanics are not assigned to the stories that first implement them.
- Gate 2 has no explicit story for a live malware-inspection adapter and fail-closed real-data configuration.

This problem was discovered during planning validation, before sprint planning or implementation. No code or completed story needs to be rolled back.

## 2. Impact Analysis

### Epic impact

All eleven epics remain valid and retain their current business outcomes and order. No epic is removed, deferred, or replaced.

| Epic | Required correction |
| --- | --- |
| 1 | Split five oversized stories; add explicit platform transaction/job/observability foundations; retain the earliest stakeholder E2E preview. |
| 2 | Rewrite criteria around observable role, user, team, and settings behavior. |
| 3 | Rewrite criteria around concrete field configuration, runtime validation, and publication failures. |
| 4 | Rewrite criteria and assign schema, rule-language, publication, and concurrency invariants. |
| 5 | Rewrite criteria and assign atomic command, locking, idempotency, audit, and outbox mechanics. |
| 6 | Rewrite criteria around exact authorization, filtering, pagination, empty, forbidden, and responsive states. |
| 7 | Rewrite criteria; assign file quarantine and PostgreSQL job mechanics; keep the synthetic inspector appropriate to Gate 1. |
| 8 | Rewrite criteria; remove physical backup-expiration completion from Story 8.6. |
| 9 | Rewrite criteria and assign shared locking, stale-write rejection, and immutable-version mechanics. |
| 10 | Rewrite criteria; split Gate 1 certification; move physical backup-expiration behavior out of Story 10.4. |
| 11 | Add live malware inspection and backup-expiration stories; rewrite Gate 2 evidence criteria. |

### Artifact conflicts

- **PRD:** No conflict and no content change. All 632 functional requirements and the Gate 1/Gate 2 boundary remain authoritative.
- **Architecture:** No design change. The existing adopted decisions are correct but must become explicit acceptance criteria in the first implementing stories.
- **UX:** No flow, information-architecture, component, or accessibility change. UX requirements must move from broad release-story repetition into concrete feature-level criteria and focused release evidence.
- **Sprint tracking:** No `sprint-status.yaml` exists, so no backlog-status migration is required during this correction.
- **Document structure:** The corrected backlog should be sharded by epic, with an index and canonical coverage matrix, because the current single file is approximately 900 KB.

### Technical and delivery impact

- No implementation rollback.
- No change to approved product scope.
- No intentional delay to the Epic 1 stakeholder preview or Epic 10 internal UAT target.
- Sprint planning must wait until the corrected stories pass Implementation Readiness.
- Requirement traceability must remain exactly complete after splits and renumbering: no missing, duplicate-primary, or extra requirement IDs.

## 3. Recommended Approach

Use **Direct Adjustment** with moderate backlog reorganization.

The PRD, Architecture, and UX specifications are coherent. Rewriting the PRD or reducing MVP scope would not repair non-executable stories. Rollback is not applicable because the issue was found before implementation. The lowest-risk route is therefore to preserve the eleven-epic value sequence, restructure only the story layer, and rerun readiness.

### Effort, risk, and timeline

| Dimension | Assessment |
| --- | --- |
| Planning effort | Medium-high: every story must be normalized, six oversized stories must be decomposed, and traceability must be regenerated. |
| Product-scope risk | Low: no approved capability is removed or changed. |
| Delivery risk after correction | Lower: stories become independently testable and architectural invariants become visible before coding. |
| Timeline impact | Sprint planning is deferred for the correction and readiness rerun; stakeholder milestone order is unchanged. |

## 4. Detailed Change Proposals

### 4.1 Replace systemic acceptance-criteria boilerplate

**Artifact:** `epics.md`  
**Scope:** Every story in Epics 1–11

**OLD:**

```text
Given the <capability> capability is available; <requirement> is applicable
When the authorized user exercises the capability or an invalid attempt is evaluated
Then <requirement text>
And FR/NFR/UXR is verified by appropriate automated and, where required, manual evidence.
```

**NEW:**

Each criterion identifies:

1. the exact actor, authorization, persisted state, and relevant data;
2. one concrete command, query, user interaction, job execution, or failure;
3. the exact observable response and persisted side effects;
4. the denial, validation, concurrency, retry, or boundary outcome where applicable;
5. the required executable evidence and its layer: domain unit, real PostgreSQL integration, architecture, API contract, Playwright/accessibility, or manual release evidence;
6. traceability metadata on a separate line, without using metadata as the test assertion.

Example conversion:

```text
OLD
Given the Make Team Tasks Available for Claim capability is available; Exclusive claim is applicable
When the authorized user exercises the capability or an invalid attempt is evaluated
Then Claiming a Team Task assigns responsibility to one active Team Member...
And FR29 is verified by appropriate automated and, where required, manual evidence.

NEW
Given an Available Task assigned to Team A and two active members of Team A submit different claim commands concurrently
When both commands execute against PostgreSQL
Then exactly one command commits, the Task becomes Assigned to that member, and the other command receives the stable `task_already_claimed` Problem Details code without changing Task or Process Data
And the winning transaction records the claim audit and outbox entry atomically
And a real-PostgreSQL concurrency test proves the outcome
Traceability: FR29, AD-2, AD-3, AD-7, AD-16
```

**Rationale:** Requirement restatement does not tell an implementer what to build or a tester how to prove it.

### 4.2 Decompose Epic 1 without losing the early stakeholder preview

The exact numbering is regenerated during backlog implementation. Existing downstream story references must be updated atomically. The following outcome map is binding.

#### Story 1.1 — Scaffold the Moviqo Application Spine

**OLD:** One story owns backend and frontend scaffolds, module boundaries, a custom identity seed, API generation, container/static builds, and verification commands.

**NEW:** Split into:

- **Backend modular spine:** approved backend versions, custom user model before the first migration, six module boundaries, ASGI and job composition roots, and import-boundary architecture tests.
- **Frontend application spine:** approved frontend versions, `app → pages → features → entities → shared` dependencies, public feature entry points, query layer, and frontend boundary tests.
- **API and build contract:** `/api/v1`, RFC 9457 errors, drf-spectacular document, generated TypeScript client, immutable backend image, static SPA build, and contract/build checks.
- **Test-first CI contract:** red-green-refactor workflow and the unit, real-PostgreSQL integration, architecture, contract, Playwright, and accessibility test commands required by AD-16.

**Rationale:** Each new story produces one independently verifiable foundation and prevents a scaffold story from masking unfinished architecture.

#### Story 1.4 — Establish Tenant-Isolated Identity and Organization Data

**OLD:** One story owns 26 functional requirements across tenant ownership, authorization, isolation release gates, environment security, telemetry, and the single-Organization identity model.

**NEW:** Split into:

- **Tenant-owned relational foundation — FR394–FR400:** Organization-scoped keys and constraints; immutable `TenantContext`; server authorization; `SET LOCAL`; `FORCE ROW LEVEL SECURITY`; runtime roles that neither own protected tables nor have `BYPASSRLS`; separate migration/maintenance credentials; pool-reuse isolation tests.
- **Tenant-isolation verification gate — FR401–FR402:** a reusable cross-Organization test matrix and a blocking CI/release result.
- **Environment and data-protection baseline — FR424–FR433:** TLS/configuration, provider encryption, secrets, server-only credentials, environment separation, synthetic-data enforcement, redacted telemetry, and fail-closed startup.
- **Single-Organization identity boundary — FR484–FR490:** global normalized email uniqueness, one Membership, no Organization switcher, preserved deactivated association, and explicit multi-Organization deferral.

**Rationale:** These are four different implementable outcomes with different evidence and failure modes.

#### Story 1.9 — Publish the Bilingual Public Landing Experience

**OLD:** One story owns 23 landing requirements plus five quality requirements.

**NEW:** Split along the PRD structure:

- **Landing content and truthful product representation — FR461–FR470.**
- **Conversion, application routing, beta/support/legal links — FR471–FR476.**
- **Bilingual, responsive, accessible, and measurable landing experience — FR477–FR483**, with page-specific performance, browser, localization, keyboard, contrast, and analytics evidence.

**Rationale:** Content accuracy, conversion routing, and presentation/measurement can be implemented and accepted independently.

#### Story 1.13 — Create a Minimal Short Text Task Form

**OLD:** One story owns 18 functional requirements and 18 cross-cutting quality/UX requirements.

**NEW:** Split into:

- **Create and bind the first Short Text Process Field:** FR48, FR108, and FR112, including stable field identity and reuse semantics.
- **Compose the minimal Task Form:** FR168, FR173, FR176, and FR180–FR185, including label/help/control order, default responsive width, runtime entry, and server validation.
- **Validate the minimal Task Form for publication:** FR624–FR627, FR630, and FR632, with concrete blocking issue rows and preservation of the shared draft.

Quality and UX requirements move to the specific story that implements the affected surface; they are not repeated wholesale in all three stories.

**Rationale:** Field definition, form composition/runtime, and publication validation are distinct vertical outcomes.

#### Story 1.21 — Certify the Stakeholder E2E Preview

**OLD:** One release story contains 28 broad NFR/UX criteria, many of which repeat feature implementation obligations.

**NEW:** Split into:

- **Automate the first-workflow E2E journey:** landing → Owner registration → email verification → workflow/form creation → publication → process start → assigned Task save/complete → completed-process timeline.
- **Qualify the preview experience:** supported desktop authoring, responsive participant flows, keyboard operation, automated accessibility checks, bilingual paths, failure/retry states, and synthetic-data enforcement.
- **Approve stakeholder preview evidence:** named build/environment, seeded scenario, passing automated evidence, known limitations, and stakeholder decision record. This gate references evidence; it does not re-implement features.

**Rationale:** The early stakeholder milestone remains at the end of Epic 1 while implementation and release evidence become distinguishable.

### 4.3 Allocate binding architecture mechanics

**OLD:** Architecture rules are repeated broadly or omitted from story-level acceptance criteria.

**NEW:** Assign primary ownership as follows, while affected feature stories include only the concrete slice they exercise:

| Architecture rule | First implementing story/outcome |
| --- | --- |
| AD-1 module ownership | Epic 1 backend modular spine |
| AD-2 tenant context and RLS | Epic 1 tenant-owned relational foundation |
| AD-3 command/audit/idempotency/outbox atomicity | Epic 1 registration command foundation; exercised concretely by every retryable mutation |
| AD-4 schema-versioned JSONB, registry, upcasters, golden fixtures | Epic 1 workflow draft and minimal form foundation |
| AD-5 immutable publication and shared locking | Epic 1 publication; completed by Epic 9 concurrency stories |
| AD-6 one typed deterministic rule language | Epic 3 visual rules/calculations and Epic 4 routing |
| AD-7 identity, authorization, OpenAPI, Problem Details | Epic 1 API/authentication foundations |
| AD-8 quarantine and capability access | Epic 7 file stories; live adapter in Epic 11 |
| AD-9 feature-sliced SPA | Epic 1 frontend spine; enforced by architecture tests |
| AD-10 PostgreSQL job leases and retries | Add an Epic 1 transactional outbox/leased-job foundation before email-dependent preview flows; exercise it in Epics 7, 8, 10, and 11 |
| AD-11 portable isolated deployment | Epic 1 synthetic internal environment |
| AD-12 telemetry and evidence gates | Add an Epic 1 safe-observability foundation; release gates consume its evidence |
| AD-13 independent backups | Epic 11 backup stories |
| AD-14 governed deletion saga | Epics 8 and 10 lifecycle stories plus Epic 11 backup expiry |
| AD-15 deferred AI/distributed systems | Architecture tests and dependency policy in the scaffold |
| AD-16 test-first delivery | Epic 1 CI contract and a concrete test-layer line in every story |

The new job-foundation criteria must explicitly prove `SELECT ... FOR UPDATE SKIP LOCKED`, bounded leases, idempotent handlers, backoff, dead-letter reasons, and recovery of expired leases. The mutation foundation must explicitly prove one transaction for business state, immutable audit, idempotency result, and outbox rows.

**Rationale:** The Architecture Spine is binding; implementation stories must expose the mechanics before code choices can diverge.

### 4.4 Correct backup-expiration sequencing

#### Story 8.6 — Close and Recover an Organization

**OLD:** Story 8.6 claims FR370 physical backup expiration even though independent backups are not implemented until Epic 11.

**NEW:** Story 8.6 owns closure request, the 30-day reversible window, restoration during that window, transition to governed deletion, and creation of an immutable backup-expiration obligation. It does not claim that backup copies have expired.

#### Story 10.4 — Delete the Final Organization Identity Safely

**OLD:** Story 10.4 includes the backup-dependent portion of FR529 in its completion boundary.

**NEW:** Story 10.4 completes tenant rows, credentials, active files/exports, normalized-email release, and the operator-only deletion record only after its governed saga steps succeed. It records the backup-set expiration deadline and affected backup identifiers but does not claim physical backup removal.

#### New Epic 11 story — Enforce Closed-Organization Backup Expiry

**NEW STORY:**

As a Moviqo operator, I want closed or finally deleted Organization data to age out of independent backup sets under the approved retention schedule so that backup recovery cannot reintroduce expired tenant data into normal operation.

Acceptance must prove:

- backup expiration runs only after independent backup creation exists;
- closed/deleted Organization obligations are associated with backup sets without making identity searchable in the Historical Organization Register;
- expired sets are removed according to 7-daily/4-weekly retention;
- retries are idempotent and operator-visible;
- restore procedures prevent expired Organization data from becoming accessible through normal application paths;
- FR370 and the backup-expiration portion of FR529 are traced here.

**Rationale:** Lifecycle intent can be recorded earlier, but physical backup expiry can be accepted only after the backup system exists.

### 4.5 Add the Gate 2 live malware-inspection outcome

**Location:** Epic 11, after dependency/secret scanning and before Gate 2 certification.

**NEW STORY — Enable Live Malware Inspection for Real Data:**

As a Moviqo operator, I want the production file-inspection adapter enabled and health-checked so that no real-data environment accepts files using the synthetic inspector.

Acceptance must prove:

- the `FileInspectionPort` uses the approved live adapter, initially ClamAV, in a real-data environment;
- startup and promotion fail closed when the adapter, signatures, connectivity, or required configuration is missing or unhealthy;
- the synthetic adapter can start only under an explicit `synthetic-only` classification;
- uploaded objects remain private in quarantine while pending;
- clean objects are promoted; infected, failed, or indeterminate objects remain unavailable and cannot complete a Task;
- retries use leased PostgreSQL jobs and do not duplicate file state transitions;
- safe metrics and correlation IDs reveal no filename, Process Data, binary content, private URL, or cross-tenant information;
- contract, real-storage adapter, job-retry, tenant-isolation, and end-to-end tests provide Gate 2 evidence;
- traceability references FR120, FR122, NFR4, NFR27, NFR30, AD-2, AD-3, AD-8, AD-10, AD-12, and AD-16 without creating duplicate primary FR ownership.

**Rationale:** Story 7.2 can provide synthetic Gate 1 inspection behavior, but Gate 2 requires an explicit production adapter and fail-closed configuration.

### 4.6 Split Story 10.6 into focused Gate 1 qualifications

**OLD:** Story 10.6 contains 44 quality/UX acceptance criteria.

**NEW:** Split into:

- **Qualify Gate 1 performance and server-side collections:** NFR1–NFR5, with named profiles, percentile measurements, and recorded evidence.
- **Qualify supported browsers, responsive layouts, localization, and accessibility:** NFR9–NFR17 and applicable UX requirements, with browser/device matrix, automated checks, and manual keyboard evidence appropriate to internal UAT.
- **Qualify Gate 1 operability and consistency:** NFR18, NFR20–NFR22, and NFR25–NFR30, limited to synthetic Gate 1 services; backup health is explicitly marked Gate 2/not enabled rather than falsely passing.
- **Certify feature-complete internal beta:** one final evidence-index and UAT decision story that proves all approved MVP journeys are available to company stakeholders with persistent synthetic data and blocks real customer data.

**Rationale:** Performance, experience compatibility, operational integrity, and release approval require different evidence owners. The final gate should aggregate passing evidence rather than re-implement it.

### 4.7 Normalize quality and UX allocation

**OLD:** NFR and UX text is repeated broadly in release and feature stories.

**NEW:**

- Each NFR or UX requirement has one primary verification owner and may be referenced by other stories only when that story adds distinct evidence.
- Feature criteria use measurable boundaries: response percentile/profile, viewport/device, keyboard sequence, expected accessible name/announcement, permitted/forbidden data, retry count/state, or exact authorization result.
- Gate stories contain evidence indexes, environment/build identity, waiver/known-limit handling, and pass/fail promotion decisions.
- The backlog must say that WCAG 2.2 A/AA is the design and testing baseline; it must not make a conformance claim without the complete evidence required by NFR17.

### 4.8 Regenerate traceability and shard the backlog

After story correction:

1. regenerate the FR, NFR, Architecture, and UX coverage maps;
2. verify 632/632 FRs and 31/31 NFRs with no gaps, extras, or duplicate primary owners;
3. verify all architecture and UX requirements have concrete owners;
4. create `epics/index.md`, one requirements/coverage file, and one file per epic;
5. preserve a clear canonical-source statement and remove or replace the 900-KB monolith to prevent conflicting copies;
6. rerun Implementation Readiness against the canonical sharded artifact.

## 5. Implementation Handoff

### Classification

**Moderate:** product direction and eleven-epic sequence remain unchanged, but backlog decomposition, story IDs, acceptance criteria, dependencies, and traceability require coordinated reorganization.

### Recipients and responsibilities

| Recipient | Responsibility |
| --- | --- |
| Product Owner / PM | Preserve approved scope and milestone intent; approve story boundaries and requirement ownership. |
| Solution Architect | Verify that AD-1–AD-16 are assigned concretely and that no proposed criterion contradicts the Architecture Spine. |
| Developer/backlog author | Rewrite every story, apply the approved splits/additions, regenerate mappings, and shard the artifact. |
| QA/release reviewer | Verify criteria are executable, evidence layers are named, Gate 1 remains synthetic-only, and Gate 2 fails closed without production safeguards. |

### Sequenced action plan

1. Apply the systemic acceptance-criteria standard and architecture ownership matrix.
2. Decompose Epic 1 while preserving the end-of-epic preview journey.
3. Normalize Epics 2–7 feature criteria.
4. Correct lifecycle/backup boundaries in Epics 8 and 10.
5. Normalize Epic 9 concurrency criteria.
6. Split Gate 1 evidence in Epic 10.
7. Add live malware inspection and backup expiry to Epic 11; normalize Gate 2 evidence.
8. Regenerate traceability and shard the corrected backlog.
9. Run Implementation Readiness again.
10. Run Sprint Planning only after readiness reports no critical or major blocker.

### Success criteria

- All approved PRD capabilities remain covered.
- Every story represents one development-sized, independently valuable or enabling outcome.
- No generic `exercises the capability or an invalid attempt is evaluated` clause remains.
- Every scenario has concrete preconditions, action, observable result, failure/boundary behavior where relevant, and named evidence.
- AD-1–AD-16 have explicit primary story ownership.
- Backup expiry has no forward dependency.
- Gate 2 contains a live malware-inspection story and fail-closed configuration evidence.
- Epic 1 still ends with an executable stakeholder E2E preview.
- Epic 10 still ends with feature-complete company-stakeholder UAT using persistent synthetic data.
- Coverage validation remains complete and the rerun readiness verdict is READY.

## Appendix A — Change Navigation Checklist Record

### 1. Understand the Trigger and Context

- [x] 1.1 Triggering artifact identified: implementation-readiness review of the complete epic/story draft; no single implementation story triggered it.
- [x] 1.2 Core problem defined: planning decomposition and testability failure, not a product-scope misunderstanding.
- [x] 1.3 Evidence recorded: generic clauses, boilerplate verification, oversized stories, dependency inversion, unallocated architecture mechanics, and missing live inspection.

### 2. Epic Impact Assessment

- [x] 2.1 Existing epics remain completable after story correction.
- [x] 2.2 Existing epic outcomes remain; story scope and criteria change.
- [x] 2.3 All eleven epics reviewed; all require criteria normalization.
- [x] 2.4 No epic becomes obsolete; no new epic is required.
- [x] 2.5 Epic order remains unchanged; story sequencing changes within Epics 1, 8, 10, and 11.

### 3. Artifact Conflict and Impact Analysis

- [x] 3.1 PRD has no conflict and needs no modification.
- [x] 3.2 Architecture has no conflict; adopted mechanics require story allocation.
- [x] 3.3 UX has no conflict; verification moves to concrete feature/evidence stories.
- [x] 3.4 Traceability, document sharding, readiness evidence, and future sprint tracking are affected.

### 4. Path Forward Evaluation

- [x] 4.1 Direct Adjustment is viable; effort medium-high, product risk low.
- [N/A] 4.2 Rollback is unnecessary because implementation has not started.
- [x] 4.3 Original MVP remains achievable; scope reduction is not recommended.
- [x] 4.4 Direct Adjustment selected because it repairs execution quality while preserving stakeholder value and milestones.

### 5. Sprint Change Proposal Components

- [x] 5.1 Issue summary included.
- [x] 5.2 Epic and artifact impacts included.
- [x] 5.3 Recommended path and alternatives included.
- [x] 5.4 MVP impact and sequenced action plan included.
- [x] 5.5 Agent/role handoff included.

### 6. Final Review and Handoff

- [x] 6.1 Applicable checklist analysis completed.
- [x] 6.2 Proposal checked for consistency with readiness findings.
- [x] 6.3 Explicit user approval received from Jortiz on 2026-08-02.
- [N/A] 6.4 No sprint-status file exists; update only after a future sprint plan is created.
- [x] 6.5 Handoff confirmed: Product Owner/PM, Solution Architect, backlog author/Developer, and QA/release reviewer responsibilities are defined in Section 5.

## Appendix B — Workflow Execution Log

| Field | Final value |
| --- | --- |
| Issue addressed | The complete epic/story draft failed implementation readiness because its acceptance criteria were generic, several stories were oversized, architecture mechanics were not allocated, backup expiry had a forward dependency, and Gate 2 lacked live malware inspection. |
| Change scope | Moderate backlog reorganization; no PRD scope or epic-outcome change. |
| Artifact modified | The approved proposal and the canonical sharded backlog under `epics/`. The obsolete `epics.md` monolith was removed after successful sharding. PRD, Architecture, and UX remain unchanged. |
| Routed to | Product Owner/PM, Solution Architect, backlog author/Developer, and QA/release reviewer. |
| Approval | Approved by Jortiz on 2026-08-02. |
| Next control gate | Rerun Implementation Readiness against the corrected canonical shards before Sprint Planning. |
