# Epic 9: Evolve Live Workflows Without Disrupting Active Work

Designers can publish compatible changes while Processes run, with preserved history, stale-submission protection, assignment updates, and deterministic serialization of publication against Task writes.

**Primary FR coverage:** FR249, FR250, FR251, FR252, FR253, FR254, FR255, FR597, FR598, FR599, FR600, FR601, FR602, FR603, FR604, FR605, FR606, FR607, FR608, FR609, FR610, FR611, FR612, FR613, FR614, FR615, FR616, FR617, FR618.

## Story 9.1: Continue Active Processes on New Versions

As a Designer and participant,
I want compatible publications to affect future execution without rewriting completed work,
So that live Workflows can evolve safely.

**Acceptance Criteria:**

**Given** a Process with completed/current execution under version V and a newly published compatible V+1
**When** the Process next advances
**Then** completed occurrences retain their recorded versions, the current submission evaluates exactly one locked version, and subsequent activation uses the newest compatible snapshot
**And** no mixed-version transaction occurs. Traceability: FR249, FR250, FR251, AD-5.

## Story 9.2: Preserve Repeated Occurrences and Version History

As an auditor,
I want each repeated Task occurrence tied to its execution evidence,
So that version changes and loops remain explainable.

**Acceptance Criteria:**

**Given** repeated Task activations spanning publications
**When** history/timeline/audit is queried
**Then** each occurrence retains unique sequence, activation version, submitted form revision, action, assignment, values evidence, and timestamps while stable Task identity links them
**And** no later publication mutates prior occurrence evidence. Traceability: FR252, FR253, FR254, FR255.

## Story 9.3: Reject Stale or Reassigned Open Forms

As a Task participant,
I want stale forms rejected before saving or completing,
So that I cannot overwrite newer configuration or assignment.

**Acceptance Criteria:**

**Given** an open form carrying Task occurrence, assignment revision, form revision, Workflow version, and optimistic token
**When** Save/Complete reaches the server after any token changed
**Then** the whole command is rejected with a stable reason and authoritative refresh guidance, prior Process Data/Task state remains, and no route/outbox/audit success is written
**And** reassigned users lose access immediately. Traceability: FR597, FR598, FR599, FR600, FR601, FR602, FR603, FR604, FR605, NFR29, NFR30.

## Story 9.4: Apply Published Assignment Changes to Open Tasks

As an Administrator and participant,
I want published assignment changes applied under explicit rules,
So that open work moves without data loss or duplicate notifications.

**Acceptance Criteria:**

**Given** a new compatible publication changes assignment configuration for an open Task
**When** the governed update resolves a valid new target
**Then** existing Task/Process Data is preserved, prior access is revoked, new Member/Team state is applied, revisions advance, and audit/outbox commit atomically
**And** invalid resolution enters Needs Reassignment. Traceability: FR606, FR607, FR608, FR609, FR610, FR611, AD-3, AD-5.

**Given** a stale prior-assignee form or notification failure
**When** submission/delivery occurs
**Then** stale write is rejected and delivery retries independently without reversing reassignment. Traceability: NFR28, NFR30.

## Story 9.5: Serialize Publication and Task Writes

As a Process participant,
I want publication and Task writes serialized on one Workflow head,
So that concurrent changes cannot produce mixed versions.

**Acceptance Criteria:**

**Given** publication and Save/Complete commands for the same Workflow execute concurrently
**When** both acquire the shared Workflow-head lock
**Then** PostgreSQL establishes one order, each command validates against state visible under that order, and each accepted completion evaluates exactly one version
**And** unique versions/downstream Tasks/business outcomes are never duplicated. Traceability: FR612, FR613, FR614, FR615, FR616, FR617, FR618, AD-5.

**Given** injected deadlock/retry/rollback conditions
**When** handlers retry
**Then** idempotency returns one logical result, failed transactions leave prior state intact, and real-PostgreSQL concurrency tests retain the observed lock/evidence trace. Traceability: AD-3, AD-16, NFR25, NFR26, NFR27, NFR28, NFR29, NFR30.
