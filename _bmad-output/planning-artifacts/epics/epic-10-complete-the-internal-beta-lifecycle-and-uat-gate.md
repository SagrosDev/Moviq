# Epic 10: Complete the Internal Beta Lifecycle and UAT Gate

Stakeholders can test inactivity warnings, Dormant recovery, final deletion, identity release, and historical evidence, then validate the complete product against Gate 1 using persistent synthetic data.

**Primary FR coverage:** FR520, FR521, FR522, FR523, FR524, FR525, FR526, FR527, FR528, FR529, FR530, FR531, FR532, FR533, FR534, FR535, FR536, FR537, FR538, FR539, FR540, FR541, FR542, FR543, FR544, FR545.

**Dependency note:** Production deletion completes here; referenced physical backup expiration completes in Epic 11.

## Story 10.1: Track Organization Activity and Warn Owners

As an Owner,
I want activity-based warnings before dormancy,
So that ordinary use prevents unintended restriction.

**Acceptance Criteria:**

**Given** the PRD-defined meaningful authenticated actions
**When** one commits
**Then** Organization activity timestamp advances atomically without being changed by passive/system/noise events
**And** inactivity jobs use Organization timezone/deadline rules idempotently. Traceability: FR520.

**Given** warning thresholds are reached without later activity
**When** the lifecycle job runs
**Then** first/final localized Owner warnings are queued once with exact consequence/deadline and authenticated link
**And** later meaningful activity cancels obsolete pending transition. Traceability: FR521, FR522.

## Story 10.2: Enter Dormant Status Without Losing Data

As an Owner,
I want inactivity to restrict rather than erase my Organization initially,
So that I retain a recovery opportunity.

**Acceptance Criteria:**

**Given** 14 complete inactive days and no intervening activity
**When** the lifecycle command commits
**Then** Organization becomes Dormant, business data/files/history remain, normal access/work is blocked, and only the authenticated recovery experience is permitted
**And** sessions/authorization reflect Dormant state. Traceability: FR523, FR524, FR525.

## Story 10.3: Restore a Dormant Organization Within Capacity

As an Owner,
I want to restore during the 14-day recovery window,
So that work resumes if beta capacity permits.

**Acceptance Criteria:**

**Given** an authenticated Owner before the recovery deadline and an available active slot
**When** restoration commits
**Then** Organization becomes Active with all prior data/relationships intact, consumes one slot atomically, resets activity, and audit records outcome
**And** concurrent last-slot attempts cannot exceed capacity. Traceability: FR526, FR527, FR528.

**Given** no capacity or expired recovery window
**When** restore is attempted
**Then** no state changes and an accurate message distinguishes capacity from expired recovery without unsupported promises. Traceability: FR526, FR527, FR528.

## Story 10.4: Delete the Final Organization Identity Safely

As a Moviqo operator,
I want final inactive deletion executed as a resumable saga,
So that production data and credentials disappear before email reuse.

**Acceptance Criteria:**

**Given** 28 complete inactive days with no recovery
**When** the governed deletion saga runs/retries
**Then** it idempotently removes production tenant rows, active binaries/exports, Memberships/credentials/sessions through ordered checkpoints and frees active storage; email remains reserved until those steps finish
**And** audit/evidence records only safe saga identifiers. Traceability: FR529, FR530, FR531, FR532, FR533, FR534, AD-14.

**Given** active deletion completes
**When** normalized emails are released
**Then** later registration creates wholly new account/Organization/Membership/IDs/terms/audit and grants no relationship/access to deleted Organization or backups
**And** a non-identifying backup-expiration obligation/deadline is queued for Epic 11 without claiming physical expiry. Traceability: FR535, FR536; FR370 completion: Story 11.7.

## Story 10.5: Maintain the Minimal Historical Organization Register

As a Moviqo operator,
I want minimal non-restorable beta history,
So that aggregate learning remains without retained customer identity/data.

**Acceptance Criteria:**

**Given** final deletion completes
**When** the operator-only register record is written
**Then** it contains only PRD-approved opaque metadata and excludes names, emails, Memberships, Process Data, files, credentials, searchable former identity, and recovery capability
**And** tenant endpoints cannot reach its separate schema. Traceability: FR537, FR538, FR539, FR540, FR541, FR542.

**Given** a record reaches 24 months
**When** retention runs
**Then** it expires idempotently; only approved non-identifying consolidated statistics may remain and disclosure reflects the retention boundary
**And** no aggregate can reconstruct an Organization. Traceability: FR543, FR544, FR545.

## Story 10.6: Qualify Gate 1 Performance and Collections

As a release reviewer,
I want measured performance under the internal representative profile,
So that stakeholders test a responsive product.

**Acceptance Criteria:**

**Given** documented Gate 1 devices/network/load/data profiles
**When** landing, dashboards, Task Forms, claim/save/complete/configuration, files, and server-side collections are measured
**Then** NFR1, NFR2, NFR3, NFR4, NFR5 thresholds are reported by percentile/profile with failures and constraints, protected collections remain bounded/server-authorized, and file transfers show active/retryable state
**And** evidence contains no Process Data. Traceability: NFR1, NFR2, NFR3, NFR4, NFR5.

## Story 10.7: Qualify Gate 1 Compatibility and Accessibility

As a release reviewer,
I want browser, responsive, localization, and accessibility evidence,
So that internal UAT covers the intended experience.

**Acceptance Criteria:**

**Given** current/previous Chrome, Edge, Firefox, Safari and representative mobile/tablet/laptop/desktop profiles
**When** operational journeys and desktop Designer journeys execute in Spanish/English
**Then** NFR9, NFR10, NFR11, NFR12, NFR13, NFR14, NFR15, NFR16, NFR17 and UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20, UX-DR21, UX-DR22, UX-DR23, UX-DR24 evidence covers responsive boundaries, unsupported-browser message, keyboard, focus, labels, contrast, announcements, validation, non-drag controls, touch, reduced motion, and 200% text
**And** results state WCAG baseline use without a formal conformance claim.

## Story 10.8: Qualify Gate 1 Operability and Consistency

As a release reviewer,
I want synthetic-environment health and failure evidence,
So that internal UAT is reliable without pretending Gate 2 safeguards are enabled.

**Acceptance Criteria:**

**Given** the Gate 1 topology and failure-injection suite
**When** health, alerts, duplicate retries, atomic failures, notification independence, failed completion, and unexpected errors are exercised
**Then** NFR18, NFR20, NFR21, NFR22, and NFR25, NFR26, NFR27, NFR28, NFR29, NFR30 pass for enabled services with safe correlation evidence
**And** live inspection, independent backup health, and lifecycle production schedules are explicitly Not Enabled/Gate 2 rather than passing. Traceability: AD-12.

## Story 10.9: Certify the Feature-Complete Gate 1 Internal Beta

As a company stakeholder,
I want to execute every approved MVP journey with persistent synthetic data,
So that the product is ready for broad internal UAT but not real customer data.

**Acceptance Criteria:**

**Given** an immutable candidate build and synthetic-only environment
**When** the Gate 1 evidence index is evaluated
**Then** every PRD 18.1 journey—including landing, identity/users/Teams, workflow/form design, publication, runtime/navigation, files, notifications, audit, live versions, administration, quotas/localization, closure/recovery/deletion—is executable without developer intervention
**And** all feature, isolation, performance, compatibility/accessibility, operability, migration, and E2E evidence links pass for that build.

**Given** company stakeholders complete UAT
**When** the decision is recorded
**Then** pass/fail, findings, owners, evidence, known limitations, and follow-up stories are retained; any blocker prevents certification
**And** certification explicitly prohibits customer onboarding and real business data until Epic 11 Gate 2 passes.
