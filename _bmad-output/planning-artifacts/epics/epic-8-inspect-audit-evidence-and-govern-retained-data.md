# Epic 8: Inspect Audit Evidence and Govern Retained Data

Authorized users can inspect/export immutable evidence, and Owners can export or close an Organization under explicit retention, recovery, deletion, and prohibited-data policies.

**Primary FR coverage:** FR340, FR341, FR342, FR343, FR344, FR345, FR352, FR353, FR354, FR355, FR356, FR357, FR358, FR359, FR360, FR361, FR362, FR363, FR364, FR365, FR366, FR367, FR368, FR369, FR371, FR372, FR373.

**Dependency note:** Physical backup expiration is completed in Epic 11 after the backup substrate exists.

## Story 8.1: Record Configuration Audit

As an Administrator or Designer,
I want configuration changes recorded immutably,
So that authorized reviewers can explain definition and administration history.

**Acceptance Criteria:**

**Given** a successful Organization, identity, Team, Workflow/draft/publication, field/form/rule, or setting command
**When** its transaction commits
**Then** append-only configuration audit records Organization, semantic target/action, safe before/after evidence, actor, time, correlation, and version/revision as applicable
**And** rollback writes no audit. Traceability: FR340, FR342, FR343, AD-3.

## Story 8.2: Record Transactional Audit

As an authorized operations reviewer,
I want Process, Task, assignment, file, and notification actions recorded,
So that runtime outcomes have one evidence trail.

**Acceptance Criteria:**

**Given** a successful runtime mutation or authorized data/file view requiring audit
**When** it commits
**Then** append-only transactional audit records Process/Task occurrence, version/revision, actor/authority, action/result, safe changed-value evidence, and time in the same transaction
**And** tenant scope cannot be changed later. Traceability: FR341, FR344, FR345.

## Story 8.3: Search and Export Authorized Audit Evidence

As an Administrator or authorized Designer,
I want to search and export the audit domain I may inspect,
So that I can investigate without accessing technical secrets.

**Acceptance Criteria:**

**Given** mixed configuration/transactional evidence
**When** an authorized query searches, filters, sorts, paginates, or exports
**Then** server-side results remain Organization/domain/role scoped and show immutable event, actor, target, changed-value-safe evidence, Organization-timezone display, and stable pagination
**And** file content, secrets, tokens, private links, and technical logs remain excluded. Traceability: FR352, FR353, FR354, FR355, FR356, FR357, FR358, FR359.

## Story 8.4: Apply Process and Active-Organization Retention

As an Organization user,
I want active business records retained predictably,
So that inactivity or ordinary UI actions cannot erase history.

**Acceptance Criteria:**

**Given** an active Organization
**When** retention/deletion operations evaluate Workflows, Processes in any status, Process Data, attachments, and audit
**Then** Processes cannot be individually deleted, business data remains while active except explicitly removed files, and inactivity alone performs no deletion
**And** explicit attachment removal follows Story 7.4. Traceability: FR360, FR361, FR362, FR363.

## Story 8.5: Request Export Before Organization Closure

As an Owner,
I want a complete export offered before confirming closure,
So that I can retrieve portable data before destruction.

**Acceptance Criteria:**

**Given** an active Owner opens destructive closure
**When** the confirmation flow renders
**Then** it explains impact/recovery timing, offers the private export flow, requires explicit confirmation, and denies Members/Designers/Administrators
**And** export failure does not silently trigger closure. Traceability: FR364, FR365, FR366, FR367.

## Story 8.6: Close and Recover an Organization

As an Owner,
I want a 30-day reversible closure window,
So that accidental closure can be recovered before active-data deletion.

**Acceptance Criteria:**

**Given** explicit Owner confirmation and current Organization state
**When** closure commits
**Then** the Organization enters Closing with a precise 30-day deadline, normal access/start/new work is restricted, sessions/actions follow policy, and a governed deletion obligation is audited
**And** no active data or backup is claimed deleted yet. Traceability: FR368, AD-14.

**Given** an authorized Owner acts before the deadline
**When** recovery succeeds
**Then** Closing restrictions and pending active-data deletion are cancelled atomically and existing data/relationships remain intact
**And** capacity/security checks remain enforced. Traceability: FR368.

**Given** the deadline passes without recovery
**When** the governed deletion saga runs
**Then** production tenant rows and binary objects are removed through idempotent resumable steps and a non-identifying backup-expiration obligation is emitted for Epic 11
**And** this story does not assert physical backup expiry. Traceability: FR369, AD-14; FR370 completion: Story 11.7.

## Story 8.7: Disclose Beta Data Responsibilities and Restrictions

As an Owner or Designer,
I want clear beta data boundaries,
So that prohibited sensitive data is not intentionally collected.

**Acceptance Criteria:**

**Given** beta terms and Form Designer guidance
**When** users review/accept terms or configure collection
**Then** customer/Designer lawfulness responsibility and Moviqo safeguard responsibility are distinct, and passwords/secrets, card data, government IDs, health information, and other highly regulated data are explicitly prohibited
**And** the reminder is visible/revisitable and not the sole enforcement of platform security. Traceability: FR371, FR372.

**Given** a proposed policy change
**When** governance evaluates it
**Then** it requires a documented future product revision and cannot silently change existing commitments. Traceability: FR373.
