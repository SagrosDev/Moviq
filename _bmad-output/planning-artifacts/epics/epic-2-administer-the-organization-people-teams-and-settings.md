# Epic 2: Administer the Organization, People, Teams, and Settings

Owners and Administrators can create and activate users, manage access levels and Teams, protect ownership continuity, configure regional behavior, and administer beta capacity and quotas.

**Primary FR coverage:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR33, FR34, FR35, FR36, FR37, FR38, FR407, FR408, FR409, FR410, FR411, FR496, FR497, FR498, FR499, FR500, FR501, FR502, FR503, FR504, FR505, FR506, FR507, FR508, FR509, FR510, FR511, FR512, FR513, FR514, FR515, FR516, FR517, FR518, FR519, FR549, FR550, FR551, FR553, FR554, FR555, FR556, FR557, FR558, FR559, FR560, FR561, FR562, FR563, FR564, FR565, FR566, FR567.

## Story 2.1: Apply the Hierarchical Role Model

As an Organization user,
I want capabilities inherited through Member, Designer, Administrator, and Owner levels,
So that participation and administration remain predictable.

**Acceptance Criteria:**

**Given** active Memberships at each access level
**When** the authorization matrix exercises participation, design, administration, ownership, Team membership, Task assignment, and Workflow start operations
**Then** Member capabilities are inherited by Designer, Administrator, and Owner; Designer capabilities by Administrator and Owner; and Administrator capabilities by Owner
**And** no lower level receives a higher-level operation. Traceability: FR1, FR2, FR3, FR4, FR6.

**Given** an Organization has one active Owner
**When** an operation would deactivate, delete, or remove ownership from that final Owner
**Then** the command is rejected until another active Owner is designated and no partial role change commits
**And** the stable Problem Details code explains the continuity requirement. Traceability: FR5.

## Story 2.2: Change Password While Authenticated

As an authenticated user,
I want to change my password after proving the current one,
So that I can rotate a credential intentionally.

**Acceptance Criteria:**

**Given** an authenticated active user and correct current password
**When** a new password satisfying Story 1.11 is confirmed
**Then** the new hash commits, existing sessions other than the current confirmed session are revoked according to policy, and audit records the security event without password content
**And** subsequent authentication accepts only the new password. Traceability: FR7, FR374, FR375, FR376, FR377, FR378, FR379.

**Given** an incorrect current password or invalid new password
**When** change is attempted
**Then** the existing hash and sessions remain unchanged and localized safe feedback reveals no credential detail
**And** throttling applies to repeated failures.

## Story 2.3: Deactivate and Reactivate Referenced Users Safely

As an Administrator,
I want to deactivate referenced users without losing history or orphaning work,
So that access ends while business evidence remains intact.

**Acceptance Criteria:**

**Given** a user with directly assigned or claimed open Tasks
**When** an Administrator requests deactivation
**Then** the command is blocked and returns the affected Task identifiers plus Team/published-Workflow assignment impacts the Administrator is authorized to resolve
**And** no session or Membership state changes. Traceability: FR10.

**Given** a historically referenced user with no blocking open Task
**When** deactivation commits
**Then** the Membership becomes inactive, all server sessions are revoked, new Task assignment and Process start authorization cease, and historical actor/creator references remain readable
**And** audit records administrator, reason, time, and affected identity. Traceability: FR8, FR9.

**Given** the inactive Membership remains associated with its original Organization
**When** an authorized Administrator reactivates it
**Then** participation eligibility returns without recreating or reassigning historical relationships
**And** access still follows current role, Team, starter, and assignment rules. Traceability: FR9.

## Story 2.4: Invite and Activate Organization Users

As an Administrator,
I want to create pending users who control their own activation,
So that colleagues can join the correct Organization securely.

**Acceptance Criteria:**

**Given** an unused normalized email and an active Organization
**When** an Owner or Administrator creates a user with name and access level
**Then** one pending account/Membership and one newest 72-hour single-use invitation are committed, while the pending user cannot authenticate, receive Tasks, or start Workflows
**And** the inviter cannot set or learn the user's password. Traceability: FR496, FR498, FR500, FR502, FR503.

**Given** the invited person opens the newest valid link for the exact invited email
**When** they accept terms and set a valid password
**Then** email control is verified, the account/Membership become active in the invitation's Organization, and the token becomes unusable atomically
**And** a different email, expired/revoked/superseded link, or duplicate activation changes nothing. Traceability: FR407, FR497, FR498, FR499.

**Given** an invitation remains pending
**When** an authorized administrator resends or revokes it
**Then** resend invalidates prior links and queues one new message; revoke prevents activation without disclosing account existence
**And** both operations are rate-limited, idempotent, and audited. Traceability: FR409, FR501.

**Given** an active user requests an unused normalized replacement email
**When** the user confirms the newest unexpired single-use link delivered to that replacement address
**Then** the verified replacement becomes the authentication email atomically, the previous address no longer authenticates, and the account remains in its original Organization
**And** before confirmation the existing authentication address remains authoritative; duplicate, expired, superseded, or foreign-address confirmation changes nothing. Traceability: FR408, FR409.

**Given** MVP authentication settings
**When** an administrator inspects or attempts to configure MFA, SSO, federation, social sign-in, passwordless authentication, or passkeys
**Then** no such setting or alternate authentication path exists
**And** verified email plus password remains the supported model. Traceability: FR410, FR411.

## Story 2.5: Manage Privileges and Transfer Ownership

As an Owner,
I want to manage access levels and transfer ownership safely,
So that authority can change without breaking Owner continuity.

**Acceptance Criteria:**

**Given** active Memberships in the same Organization
**When** an Owner promotes/demotes a Member, Designer, or Administrator or transfers ownership
**Then** the server enforces the hierarchical authority boundary, preserves at least one active Owner, applies the new level atomically, and revokes now-invalid access on the next protected request
**And** audit records previous/new level, actor, target, time, and reason. Traceability: FR504, FR505, FR506.

**Given** an Administrator attempts to create/remove an Owner or manage an Owner's privilege
**When** authorization evaluates the command
**Then** it is denied without changing Memberships
**And** the response exposes no authority outside that Administrator's Organization. Traceability: FR504, FR505.

## Story 2.6: Create Teams and Manage Membership

As an Administrator,
I want to create Teams and manage active members,
So that Workflows can target reusable groups.

**Acceptance Criteria:**

**Given** an active Organization
**When** an Owner/Administrator creates or renames a Team and adds/removes active Organization users
**Then** the Team and Membership links remain Organization-scoped, one user may belong to multiple active Teams, and duplicate membership is prevented
**And** changes are audited. Traceability: FR33, FR34.

**Given** a Designer without administrative access
**When** the Designer searches Teams for starter or assignment configuration
**Then** only valid active Teams are selectable and no Team-definition or membership mutation is available
**And** a direct API mutation is denied. Traceability: FR35.

## Story 2.7: Deactivate Teams Without Orphaning Work

As an Administrator,
I want to deactivate referenced Teams only after resolving open work,
So that history remains stable and Tasks remain actionable.

**Acceptance Criteria:**

**Given** a Team has any Available, claimed, assigned, or Needs Reassignment open Task
**When** deactivation is requested
**Then** the command is blocked with an authorized list/count of affected open Tasks and required reassignment action
**And** no Team or Task state changes. Traceability: FR37.

**Given** a historically referenced Team with no open Task
**When** deactivation commits
**Then** its stable identity and historical Workflow/Task/Process/audit relationships remain, but it cannot be chosen for new publication or runtime assignment
**And** physical deletion is unavailable. Traceability: FR36.

**Given** a Team proposed as a production assignee or starter
**When** publication validation runs
**Then** the Team is valid only if active and containing at least one active Member
**And** an invalid Team produces a direct blocking checklist issue. Traceability: FR38.

## Story 2.8: Manage Organization Language and Regional Presentation

As an Owner or Administrator,
I want shared regional settings with personal interface language,
So that dates, numbers, and currency are consistent while navigation remains bilingual.

**Acceptance Criteria:**

**Given** Spanish/English users in one Organization
**When** a user changes personal interface language
**Then** Moviqo-owned UI and corrective messages switch for that user with Spanish fallback, while Designer-authored labels/content remain verbatim and Organization regional formatting does not change
**And** the preference persists. Traceability: FR549, FR550, FR551, FR553.

**Given** an Owner/Administrator selects a supported IANA timezone and regional format
**When** the setting commits
**Then** shared date, time, decimal, grouping, and currency presentation uses the new Organization setting without altering stored UTC instants, ISO dates, or invariant decimal values
**And** existing data re-renders consistently for every user. Traceability: FR554, FR555, FR556, FR557, FR558.

**Given** an invalid/unsupported timezone or format or an unauthorized user
**When** update is attempted
**Then** the setting remains unchanged and a localized safe validation/authorization response is returned
**And** the failed attempt leaks no other Organization setting.

## Story 2.9: Configure Currency Safely

As an Owner or Administrator,
I want an Organization default currency and controlled currency changes,
So that new Currency fields are predictable without rewriting historical values.

**Acceptance Criteria:**

**Given** Organization setup or currency settings
**When** a valid ISO 4217 currency and its standard precision are selected
**Then** new Currency fields inherit that immutable currency identity/precision by default and presentation uses Organization regional formatting
**And** stored values remain invariant decimals. Traceability: FR559, FR560, FR561, FR562.

**Given** Currency Process Fields or historical Currency values already exist
**When** the Organization default changes
**Then** existing field currency identities and stored values remain unchanged; only newly created fields receive the new default
**And** the UI explains the non-retroactive effect before confirmation. Traceability: FR563, FR564, FR565.

**Given** an unsupported code/precision or a change that would reinterpret data
**When** update is submitted
**Then** the server rejects it without partial modification and returns field-specific feedback
**And** audit records every successful default change. Traceability: FR566, FR567.

## Story 2.10: Enforce Automatic Beta Admission and Capacity

As a prospective Owner and Moviqo operator,
I want automatic admission bounded by active-Organization capacity,
So that eligible users start immediately without exceeding the beta environment.

**Acceptance Criteria:**

**Given** active-Organization count is below the configured initial capacity of 20
**When** a valid initial Owner registration activates
**Then** admission is automatic with no manual review and the Organization consumes one active slot atomically
**And** concurrent final-slot attempts admit at most the configured capacity. Traceability: FR507, FR508, FR509, FR511.

**Given** active capacity is full
**When** a new registration/activation or Dormant restoration would consume a slot
**Then** no active Organization is created/restored, existing active Organizations retain priority, and the user receives an accurate non-committal capacity message
**And** no payment or waitlist promise is implied. Traceability: FR510, FR512.

## Story 2.11: Track and Enforce Organization Usage Limits

As an Owner,
I want visible non-destructive beta usage limits,
So that I can manage capacity without losing existing Workflows or Processes.

**Acceptance Criteria:**

**Given** the approved Organization limits and anniversary cycle
**When** usage is queried
**Then** the server returns authorized current/limit values, cycle start/end, and warning state for each metered capability; short-month anniversaries use the last valid day
**And** values are computed from Organization-scoped persisted facts. Traceability: FR513, FR514, FR515, FR516.

**Given** a new command would exceed a limit
**When** it is submitted
**Then** that new creation/action is rejected before persistence with the exact limit and corrective option, while existing Workflows, versions, Processes, data, and files remain usable under their authorization
**And** no charge or automatic upgrade occurs. Traceability: FR517, FR518.

**Given** an approved operator exception
**When** a limit is changed for one Organization
**Then** scope, previous/new value, actor, reason, and validity period are audited and the exception cannot alter another tenant
**And** removing it restores standard enforcement without deleting data. Traceability: FR519.
