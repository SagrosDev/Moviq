# Epic 5: Coordinate Assigned Work and Runtime Operations

Members can receive or claim Team work and complete it safely, while Administrators can resolve invalid assignments and cancel Processes without losing data or evidence.

**Primary FR coverage:** FR27, FR28, FR29, FR30, FR31, FR32, FR43, FR44, FR45, FR46, FR47, FR211, FR276, FR277, FR278, FR281, FR283, FR284, FR285, FR286, FR287.

## Story 5.1: Make Team Tasks Available for Claim

As a Team Member,
I want to claim an Available Team Task exclusively,
So that exactly one eligible person becomes responsible.

**Acceptance Criteria:**

**Given** an open Task assigned to an active nonempty Team
**When** eligible active members view My Tasks
**Then** each sees the Task as Available but cannot edit/save/complete before claiming; nonmembers see no existence signal
**And** collaborative editing, round-robin, balancing, and automatic assignment are absent. Traceability: FR27, FR28, FR32.

**Given** two eligible members claim concurrently
**When** PostgreSQL executes both commands
**Then** exactly one commits assignment/status/audit/idempotency/outbox atomically and the loser receives `task_already_claimed`
**And** other Team members can see claimed status but cannot edit/complete unless reassigned. Traceability: FR29, FR30, FR31, AD-3, AD-16.

## Story 5.2: Resolve Runtime Assignments Safely

As an Administrator,
I want invalid runtime assignments surfaced for resolution,
So that a Process pauses safely rather than losing work.

**Acceptance Criteria:**

**Given** a Task activation using specific Member, Team, initiator, or User Reference assignment
**When** resolution produces an empty, inactive, foreign, invalid, or missing target
**Then** the Task enters Needs Reassignment, cannot be edited/completed, and no unauthorized target receives access
**And** the reason is stored safely in transactional audit. Traceability: FR43, FR44.

**Given** a Needs Reassignment Task
**When** Owners/Administrators open the attention inbox
**Then** they see Workflow, Process, Task, failure reason/time, and permitted action within their Organization
**And** ordinary participants do not receive administrative details. Traceability: FR45.

## Story 5.3: Reassign Open Work Without Data Loss

As an Administrator,
I want to reassign an open Task to a valid Member or Team,
So that work resumes with existing data intact.

**Acceptance Criteria:**

**Given** an open assigned/available/claimed/Needs Reassignment Task and current revision
**When** an Owner/Administrator selects a valid active Member or Team and supplies a reason
**Then** prior access is revoked, existing Task/Process Data is preserved, Member assignment becomes Assigned or Team assignment becomes Available, and audit/outbox commit atomically
**And** stale forms from the former assignee are rejected. Traceability: FR46, FR47, AD-3, AD-5.

**Given** an invalid/foreign/inactive target or stale Task revision
**When** reassignment is attempted
**Then** no Task/access/data change commits and the response contains an actionable stable code without foreign detail.

## Story 5.4: Apply Complete Runtime Status Transitions

As a Process participant,
I want runtime statuses to follow valid transitions,
So that dashboards and actions reflect authoritative state.

**Acceptance Criteria:**

**Given** Process and Task lifecycle states
**When** activation, availability, claim, assignment failure/recovery, save, completion, route, End, or cancellation occurs
**Then** only the documented transition is accepted, timestamps/version/occurrence evidence update atomically, and no terminal state reopens implicitly
**And** invalid transitions return stable conflicts. Traceability: FR211, FR276, FR277, FR278, FR281, FR283.

**Given** transaction failure or concurrent competing commands
**When** a transition executes
**Then** either the entire state/audit/idempotency/outbox outcome commits once or prior state remains intact
**And** real-PostgreSQL tests cover every transition edge. Traceability: NFR25, NFR26, NFR27, NFR28, NFR29, NFR30, AD-3.

## Story 5.5: Cancel a Process Safely

As an Administrator,
I want to cancel an active Process with a reason,
So that no further work occurs while evidence remains.

**Acceptance Criteria:**

**Given** an Active or Needs Attention Process
**When** an Owner/Administrator confirms cancellation with a reason
**Then** the Process becomes Cancelled, every open Task becomes non-actionable, current data/files/history remain under authorization, and audit/outbox commit once
**And** participants cannot perform cancellation. Traceability: FR284, FR285, FR286, FR287.

**Given** a stale, repeated, foreign, Completed, or already Cancelled Process
**When** cancellation is attempted
**Then** no duplicate transition or notification occurs and the safe response reveals no unauthorized Process detail
**And** open-form submissions after committed cancellation are wholly rejected.
