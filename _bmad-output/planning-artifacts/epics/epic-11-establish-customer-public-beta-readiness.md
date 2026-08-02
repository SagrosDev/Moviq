# Epic 11: Establish Customer Public-Beta Readiness

The team can demonstrate threat modeling, security traceability, live file inspection, independent backups/expiry/restoration, and production-readiness controls before permitting real customer data.

**Primary FR coverage:** FR370, FR434, FR435, FR436, FR437, FR438, FR439, FR440, FR441, FR442, FR443, FR444, FR445, FR446, FR447, FR448, FR449, FR450, FR451, FR452, FR453, FR454, FR455, FR456, FR457, FR458, FR459, FR460.

## Story 11.1: Maintain the OWASP and MITRE Threat Model

As a security reviewer,
I want a current traceable threat model,
So that public-beta controls address relevant SaaS abuse paths.

**Acceptance Criteria:**

**Given** current architecture/data flows and MVP scope
**When** OWASP Top 10/ASVS Level 1 and relevant MITRE ATT&CK SaaS scenarios are reviewed
**Then** assets, actors, trust boundaries, threats, mitigations, verification, owner/status, and residual risk map to requirements/stories/tests
**And** framework use is described as a baseline, not unsupported certification. Traceability: FR434, FR435, FR436, FR437, FR438, FR439, FR440.

## Story 11.2: Record Deferred Security Risks Explicitly

As a security reviewer,
I want deferred risks named and approved,
So that omissions cannot be mistaken for completed safeguards.

**Acceptance Criteria:**

**Given** an out-of-MVP or unresolved security item
**When** it is deferred
**Then** the register records scenario, affected asset, reason, compensating control, owner, review date, release severity, and future decision
**And** Critical/High or applicable Medium findings cannot be deferred past Gate 2 without the PRD-authorized disposition. Traceability: FR441.

## Story 11.3: Run Public-Beta Security Release Gates

As a release reviewer,
I want all production security gates evaluated against one build,
So that failed isolation, identity, file/export, audit, or threat controls block promotion.

**Acceptance Criteria:**

**Given** a Gate 2 candidate
**When** isolation, authentication/session, authorization, private file/export, expiring link, safe error/log, audit integrity, baseline, threat, and configuration gates run
**Then** each produces immutable evidence tied to build/environment and any missing/failing blocker prevents promotion/startup
**And** no manual checkbox substitutes for required executable evidence. Traceability: FR442, FR443, FR444, FR445, FR446.

## Story 11.4: Scan Dependencies and Secrets and Enforce Severity Rules

As a release reviewer,
I want reproducible dependency, image, IaC, and secret scans,
So that unacceptable findings cannot reach public beta.

**Acceptance Criteria:**

**Given** source, lockfiles, built SPA/image, and infrastructure/configuration
**When** approved scanners run
**Then** results identify tool/database time, artifact/build, finding, applicability, severity, owner, and disposition without printing secrets
**And** unresolved Critical/High and relevant Medium findings block release. Traceability: FR447, FR448, FR449, FR450, FR451.

## Story 11.5: Enable Live Malware Inspection for Real Data

As a Moviqo operator,
I want a healthy live file-inspection adapter,
So that no real-data environment accepts files through the synthetic inspector.

**Acceptance Criteria:**

**Given** a real-data/public-beta classification
**When** the application and inspection worker start
**Then** `FileInspectionPort` selects the approved ClamAV 1.5.3 adapter and startup/promotion fails if adapter configuration, signatures, connectivity, or health is missing/stale
**And** the synthetic adapter is rejected outside explicit `synthetic-only`. Traceability: FR120, FR122, AD-8.

**Given** pending quarantined files including clean, infected, invalid, indeterminate, and transient-failure fixtures
**When** leased inspection jobs run/retry
**Then** only clean validated files promote; every other result remains unavailable and unusable for completion; retries do not duplicate transitions; exhausted failures alert safely
**And** adapter/job/storage/tenant/E2E tests emit no filename/content/private URL/Process Data. Traceability: NFR4, NFR27, NFR30, AD-2, AD-3, AD-10, AD-12, AD-16.

## Story 11.6: Create Independent Encrypted Backups

As a Moviqo operator,
I want portable daily database and attachment backups outside the primary failure boundary,
So that provider recovery is not the only copy.

**Acceptance Criteria:**

**Given** production data/storage and independent encrypted destination
**When** the 24-hour backup job runs
**Then** it creates a consistent logical PostgreSQL export and copies new attachment objects with integrity manifest, encryption, timestamps, build/schema metadata, and tenant-safe inventory
**And** destination credentials/failure boundary are separate from primary production. Traceability: FR452, FR453.

**Given** successful backup sets
**When** retention executes
**Then** at least 7 recoverable daily and 4 weekly sets remain while older sets expire subject to closed-Organization obligations
**And** measured schedules support 24-hour RPO/RTO targets. Traceability: FR454, FR455, FR456, AD-13.

## Story 11.7: Enforce Closed-Organization Backup Expiry

As a Moviqo operator,
I want closed/deleted Organization data to age out with backup retention,
So that disaster-recovery copies do not remain accessible indefinitely.

**Acceptance Criteria:**

**Given** an Epic 8 closure or Epic 10 final deletion obligation associated with backup sets through opaque identifiers
**When** each set reaches its approved retention deadline
**Then** the set/object expires idempotently, obligation progress is auditable/operator-visible, and the Historical Organization Register gains no searchable identity
**And** retries cannot restore normal-application access. Traceability: FR370, FR529 backup clause, FR454, AD-14.

**Given** an isolated restore containing an Organization whose expiration obligation is effective
**When** restore validation/reconciliation runs
**Then** expired Organization data is removed/quarantined before environment availability and tenant endpoints can never expose it
**And** evidence proves the control without retaining customer identity.

## Story 11.8: Verify Restoration and Backup Operations

As a Moviqo operator,
I want to prove backups restore consistent isolated data and alert on failure,
So that recovery capability is evidenced before onboarding.

**Acceptance Criteria:**

**Given** the initial pre-customer gate, quarterly schedule, or material storage change
**When** an isolated restoration test runs
**Then** database consistency, representative Processes/audit, attachments, tenant isolation, schema migrations, and backup-expiry reconciliation pass within recorded RPO/RTO
**And** the result is retained as build/environment evidence. Traceability: FR457, NFR31.

**Given** a failed, incomplete, overdue, or unverifiable backup/restore
**When** monitoring evaluates it
**Then** an operator alert remains open until verified recovery or explicit resolution and real-data promotion/onboarding is blocked
**And** customer exports are clearly documented as portability rather than disaster recovery. Traceability: FR458, FR459, FR460.

## Story 11.9: Certify Gate 2 Customer Public-Beta Readiness

As a release reviewer,
I want one fail-closed production-readiness decision,
So that permitted customer data is accepted only after every safeguard passes.

**Acceptance Criteria:**

**Given** an immutable production candidate and real-data configuration
**When** Gate 2 evaluates the PRD 18.2 evidence index
**Then** security/threat/scanning, tenant isolation, auth/authorization, live inspection, private files/exports, safe logs/errors, backups/expiry/restore, audit, monitoring, lifecycle schedules, migrations, performance/load, compatibility/accessibility, terms/privacy/prohibited-data, and customer-responsibility evidence all pass for that build
**And** missing safeguards block startup or promotion. Traceability: NFR6, NFR7, NFR8, NFR18, NFR19, NFR20, NFR21, NFR22, NFR23, NFR24, NFR27, NFR28, NFR30, NFR31.

**Given** representative beta-load verification
**When** 20 Organizations and at least 50 concurrent authenticated users perform the documented dashboard/Form/Task/Workflow/file mix with representative definition sizes
**Then** evidence records percentiles, failures, infrastructure constraints, tested build/environment/data profile, and no Process Data
**And** applicable severity or recovery failures block certification.

**Given** all evidence passes and reviewers approve
**When** promotion completes
**Then** only invited beta users and permitted data may onboard under published terms/limitations, monitoring/schedules are active, and decision/evidence/approvers/date are retained
**And** no unsupported uptime, WCAG certification, security certification, or restoration guarantee is advertised.
