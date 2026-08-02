# Epic 7: Exchange Files and Notify Participants Safely

Designers can configure attachments and notifications, participants can use authorized private files, Owners can receive secure exports, and delivery remains localized, traceable, and retryable.

**Primary FR coverage:** FR114, FR115, FR116, FR117, FR118, FR119, FR120, FR121, FR122, FR123, FR124, FR125, FR319, FR320, FR321, FR322, FR323, FR324, FR325, FR326, FR327, FR328, FR329, FR330, FR331, FR332, FR333, FR334, FR335, FR336, FR337, FR338, FR339, FR412, FR413, FR414, FR415, FR416, FR417, FR418, FR419, FR420, FR421, FR422, FR423.

## Story 7.1: Configure File Attachment Fields

As a Designer,
I want private Attachment fields with understandable limits,
So that participants can provide supported files safely.

**Acceptance Criteria:**

**Given** a new Attachment field
**When** label/help/required/categories/count/per-file/total size/extensions are configured
**Then** defaults are 5 files, 10 MB each, 25 MB total; supported count is 1–10; only the PRD allowlist can be narrowed; executables/scripts/HTML/macros/archives cannot be enabled
**And** quarantine, inspection, authorization, audit, and cleanup are automatic rather than Designer parameters. Traceability: FR114, FR115, FR116, FR117, FR118, FR119, FR125.

## Story 7.2: Validate and Inspect Uploaded Files

As a Task participant,
I want uploads validated and quarantined before use,
So that unsafe files cannot enter Process Data.

**Acceptance Criteria:**

**Given** an authorized upload request
**When** the server issues a grant
**Then** it is opaque, tenant-partitioned, quarantine-only, object-specific, upload-only, and expires within 15 minutes; metadata remains Pending in PostgreSQL
**And** filename extension alone never establishes type. Traceability: FR120, AD-8.

**Given** a quarantined synthetic Gate 1 file
**When** the explicitly synthetic-only inspector validates actual type/size and harmless result
**Then** clean content is promoted and usable; invalid/rejected/failed/pending content remains unavailable and cannot complete a Task
**And** inspection retry is leased/idempotent and auditable. Traceability: FR122, NFR4, NFR27, NFR30, AD-10.

## Story 7.3: Preview and Download Authorized Files

As an authorized user,
I want to preview supported files or download accepted files privately,
So that copied links never replace current permission.

**Acceptance Criteria:**

**Given** an approved file and current Task/Process/field/admin authority
**When** preview/download is requested
**Then** the server revalidates session, Organization, Process, field, and authority and issues a one-file read-only grant expiring within 15 minutes; images/PDF preview in app and other accepted types download
**And** objects/buckets are never public/listable. Traceability: FR121, FR123, FR412, FR413, FR414, FR415.

**Given** permission loss, copied/guessed/modified link, foreign tenant, or expired grant
**When** access is attempted
**Then** no bytes/metadata/existence signal is returned and equivalent failures are safe. Traceability: FR417.

## Story 7.4: Remove Files and Preserve Audit Evidence

As an authorized participant,
I want to remove an attachment while preserving minimal evidence,
So that current access ends without erasing accountability.

**Acceptance Criteria:**

**Given** an authorized current attachment
**When** removal commits
**Then** the Process Data reference/access is revoked transactionally, minimal immutable metadata/audit remains, and binary deletion is queued after commit
**And** repeated cleanup is idempotent. Traceability: FR124, FR416, NFR27.

**Given** upload/removal/preview/download
**When** it succeeds
**Then** audit records Organization, Workflow/version, Process, Task/field where applicable, safe file ID/metadata, actor, time, and action without content/private grant. Traceability: FR124.

## Story 7.5: Configure Task Assignment Notifications

As a Designer and participant,
I want localized assignment notifications with safe context,
So that recipients know work is available without email leaking Process Data.

**Acceptance Criteria:**

**Given** a valid assignment notification setting
**When** direct assignment, Team availability, or claim/reassignment event commits
**Then** an outbox message is written atomically and eligible recipients receive localized Workflow/Task-safe context plus an application link requiring authentication
**And** no Process Field value, attachment, token, or private access grant appears. Traceability: FR319, FR320, FR321, FR322, FR323, FR324, FR325, FR326.

## Story 7.6: Configure Transition Notifications

As a Designer,
I want optional notifications for supported transitions,
So that selected participants can follow important state changes.

**Acceptance Criteria:**

**Given** a supported transition and valid recipient configuration
**When** the transition commits
**Then** one localized outbox message is created with safe template data and current Organization-scoped recipients
**And** invalid/inactive/cross-tenant recipients block publication or enter an operational failure without reversing the transition. Traceability: FR327, FR328, FR329, FR330, FR331.

## Story 7.7: Track and Retry Notification Delivery

As an operator,
I want delivery outcomes retried and traceable,
So that email failure never duplicates business actions.

**Acceptance Criteria:**

**Given** queued notification work
**When** Resend succeeds, transiently fails, or exhausts retries
**Then** delivery status/attempt timestamps/provider-safe ID update idempotently; transient failure backs off; exhaustion dead-letters with reason
**And** Task/Process state never rolls back. Traceability: FR332, FR333, FR334, NFR27, NFR28, AD-10.

**Given** MVP channel configuration
**When** channels are listed
**Then** email is supported and deferred channels are unavailable. Traceability: FR335.

## Story 7.8: Notify Administrators About Operational Problems

As an Owner or Administrator,
I want optional safe operational emails in addition to dashboard alerts,
So that important problems receive attention.

**Acceptance Criteria:**

**Given** Needs Reassignment or another approved operational problem
**When** it is created
**Then** the dashboard alert always exists and configured eligible administrators receive one safe localized email with authenticated navigation
**And** Team-level email requires explicit opt-in and exposes no Process Data. Traceability: FR336, FR337, FR338, FR339.

## Story 7.9: Generate and Deliver Private Organization Exports

As an Owner,
I want a portable Organization export delivered privately,
So that I can retrieve authorized data without treating exports as backups.

**Acceptance Criteria:**

**Given** an active Owner
**When** export is requested
**Then** an Organization-scoped leased job creates documented Workflow/Process/audit/attachment formats in private storage, records request/result audit, and queues a ready notification
**And** retries cannot mix tenants or duplicate logical exports. Traceability: FR418, FR421, FR422.

**Given** a ready export
**When** an active Owner requests download within 24 hours
**Then** a one-object read-only grant expiring within 15 minutes is issued; non-Owners, copied links, and expired exports receive no access
**And** active export storage removes it by 24 hours while downloaded copies remain the Owner's responsibility. Traceability: FR419, FR420, FR423.
