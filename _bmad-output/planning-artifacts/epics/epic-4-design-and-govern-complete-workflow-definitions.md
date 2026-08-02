# Epic 4: Design and Govern Complete Workflow Definitions

Designers can configure every supported starter, assignment, route, state, draft, publication, inactive-element, duplication, archive, restoration, and version-history behavior.

**Primary FR coverage:** FR19, FR22, FR23, FR40, FR42, FR216, FR217, FR218, FR219, FR220, FR221, FR224, FR225, FR231, FR232, FR233, FR234, FR236, FR237, FR238, FR239, FR241, FR242, FR243, FR244, FR245, FR246, FR247, FR248, FR256, FR257, FR258, FR259, FR260, FR261, FR262, FR263, FR264, FR265, FR266, FR267, FR268, FR269, FR270, FR271, FR272, FR273, FR575, FR576, FR577, FR578, FR579, FR580, FR581, FR582, FR583, FR584, FR585, FR586, FR587, FR588, FR589, FR590, FR591, FR592, FR593, FR594, FR595, FR596.

## Story 4.1: Complete Starter and Assignment Configuration

As a Designer,
I want all supported starter and assignee types,
So that published work reaches valid participants.

**Acceptance Criteria:**

**Given** active Members, Teams, Workflow Initiator, and User Reference fields in one Organization
**When** the Designer configures starters or a specific Team/User Reference assignment
**Then** stable scoped references are stored, active/nonempty/type constraints validate, and the assignment explanation names recipient type and invalid-assignee outcome
**And** anonymous/public initiation remains unavailable. Traceability: FR19, FR22, FR23, FR40, FR42, UX-DR9, UX-DR25.

**Given** a referenced user/team/field becomes invalid before publication
**When** validation runs
**Then** publication is blocked through a direct issue link and the shared draft remains intact
**And** no frontend-only override can publish it.

## Story 4.2: Configure Conditional Routing and Cycles

As a Designer,
I want ordered visual routes with explicit default behavior and controlled cycles,
So that Processes advance deterministically.

**Acceptance Criteria:**

**Given** outgoing branches built with the shared typed AST
**When** the Designer orders conditions and defines an explicit default/else route
**Then** the backend validates and evaluates first-match semantics deterministically and preview uses the same interpreter
**And** raw scripts, ambiguous ties, or missing required default block publication. Traceability: FR216, FR217, FR218, FR219, FR220, FR221, AD-6.

**Given** a graph cycle
**When** publication validation evaluates it
**Then** permitted cycles have an executable exit path and occurrence evidence, while non-terminating/unreachable structures produce linked blocking issues
**And** golden fixtures prove branch ordering across schema versions.

## Story 4.3: Validate Complete Workflow Dependencies

As a Designer,
I want one complete publication dependency check,
So that no invalid definition becomes executable.

**Acceptance Criteria:**

**Given** a draft containing graph, Forms, fields, rules, assignments, states, and notifications
**When** full validation runs
**Then** it traverses every stable reference and returns deterministic blocking/warning issues for missing, inactive, incompatible, cyclic, unreachable, or unauthorized dependencies
**And** each issue links to the exact configuration target. Traceability: FR224, FR225, UX-DR10.

**Given** the draft changes after validation
**When** publish is requested with an older revision/result
**Then** validation reruns under the publication lock and no stale passing result can publish.

## Story 4.4: Coordinate Shared Draft Editing

As a Designer,
I want other editors' changes and conflicts made explicit,
So that shared work is never silently overwritten.

**Acceptance Criteria:**

**Given** two authorized Designers edit one shared draft revision
**When** one save commits before the other
**Then** the first increments revision and publishes semantic change metadata; the stale save is wholly rejected and offered reload/reapply guidance
**And** presence does not imply real-time collaborative merging. Traceability: FR231, FR232, FR233, FR234, FR236, FR237, FR238, FR239.

**Given** a recoverable connection failure
**When** a valid edit retries
**Then** local work/saving state remains visible and idempotency prevents duplicate revisions or audit
**And** success is shown only after authoritative server confirmation.

## Story 4.5: Deactivate and Reactivate Tasks Safely

As a Designer,
I want to remove Tasks from future execution without erasing history,
So that definitions can evolve safely.

**Acceptance Criteria:**

**Given** a Task element referenced by published versions or Processes
**When** it is deactivated
**Then** its stable identity/history remain, new valid routes cannot activate it, and unresolved graph/form/rule dependencies block publication
**And** active Task occurrences are not deleted or mutated. Traceability: FR241, FR242, FR243, FR244, FR245, FR246, FR247, FR248.

**Given** dependencies are restored
**When** the element is reactivated
**Then** it becomes eligible for future publication under its stable ID without changing prior snapshots
**And** configuration audit records both transitions.

## Story 4.6: Configure Designer-Defined Instance States

As a Designer,
I want business-friendly Process states mapped to execution positions,
So that users can understand progress beyond system lifecycle status.

**Acceptance Criteria:**

**Given** unique state names and supported graph positions/transitions
**When** the Designer configures, renames, orders, or deactivates states
**Then** stable state IDs persist, labels remain versioned presentation, and invalid/missing mappings block publication
**And** system statuses Active/Needs Attention/Completed/Cancelled remain separate. Traceability: FR256, FR257, FR258, FR259, FR260, FR261.

**Given** a Process advances
**When** its execution position changes
**Then** the versioned state mapping determines its displayed business state and timeline records the transition without rewriting history.

## Story 4.7: Record Task Occurrence and Loop Evidence

As a participant or administrator,
I want repeated Tasks distinguished by occurrence,
So that loops remain auditable.

**Acceptance Criteria:**

**Given** a route activates the same Task element more than once
**When** each occurrence opens and completes
**Then** it receives a unique occurrence ID/sequence while retaining stable Task ID, activation version, submitted form revision, assignee, timestamps, action, and audit
**And** values/history are never overwritten by a later loop. Traceability: FR262, FR263, FR264, FR265.

**Given** authorized timeline display
**When** loop events render
**Then** each occurrence is distinguishable in plain language without exposing restricted Process Data.

## Story 4.8: Synchronize Open Draft Status

As a Designer,
I want draft validation/publication status to reflect the current shared revision,
So that stale badges never imply readiness.

**Acceptance Criteria:**

**Given** a draft revision with validation issues, a passing validation, or edits after validation/publication
**When** catalog/designer status is queried
**Then** Draft, Validation Issues, Ready, or Published-with-new-draft state derives from authoritative revision/evidence and updates after committed changes
**And** stale clients cannot overwrite it. Traceability: FR266, FR267, FR268, FR269, FR270, FR271, FR272, FR273, UX-DR15.

**Given** validation or save fails
**When** the UI updates
**Then** it keeps last confirmed state, exposes retry/action, and never reports publication before server confirmation.

## Story 4.9: Manage Workflow Names and Metadata History

As a Designer,
I want to rename Workflows without changing their identity,
So that catalog labels evolve while history remains traceable.

**Acceptance Criteria:**

**Given** a Workflow and Organization naming rules
**When** an authorized rename/description change uses the current revision
**Then** stable Workflow ID remains, uniqueness/length/localization-safe validation applies, and semantic configuration audit records old/new metadata
**And** published snapshots and Process references remain attributable. Traceability: FR575, FR576, FR577.

## Story 4.10: Archive and Reactivate Workflows

As a Designer,
I want to remove a Workflow from new use without deleting history,
So that active/historical Processes remain intact.

**Acceptance Criteria:**

**Given** a draft/published/historically referenced Workflow
**When** archive commits
**Then** it disappears from new-start and normal active catalog results, new publication/start is denied, and existing Processes/Tasks/versions/audit remain accessible by authorization
**And** physical deletion is allowed only under the PRD's unreferenced boundary. Traceability: FR578, FR579, FR580, FR581, FR582, FR583, FR584.

**Given** an archived Workflow remains valid for reactivation
**When** an authorized Designer reactivates it
**Then** it returns to the catalog with stable identity and prior history, while publication/start still use current validation/version rules.

## Story 4.11: Duplicate Workflow Definitions Safely

As a Designer,
I want to duplicate a Workflow as a new draft definition,
So that I can reuse design without copying runtime history.

**Acceptance Criteria:**

**Given** an authorized source Workflow/version in the same Organization
**When** duplicate is requested with a valid unique name
**Then** one new Workflow/draft with new Workflow/element/field IDs and equivalent supported configuration is created atomically
**And** no Process, Task occurrence, Process Data, file, audit history, assignment occurrence, or version identity is copied. Traceability: FR585, FR586, FR587, FR588, FR589.

**Given** a foreign/unauthorized source or invalid name
**When** duplication is attempted
**Then** no target records are created and no source existence/detail is disclosed.

## Story 4.12: Compare and Restore Published Versions

As a Designer,
I want to inspect version history and restore an old snapshot into the draft,
So that I can recover configuration without rewriting history.

**Acceptance Criteria:**

**Given** two authorized immutable versions
**When** comparison runs
**Then** it presents semantic differences in metadata, graph, forms, fields, rules, assignments, and states using stable IDs
**And** it does not mutate either snapshot. Traceability: FR590, FR591, FR592, FR593.

**Given** an authorized historical version and current draft revision
**When** restore commits
**Then** a schema-upcast copy becomes the new mutable draft revision, immutable versions remain unchanged, and audit records source version
**And** a new publication still requires full current validation.

## Story 4.13: Enforce Published Workflow Quotas

As an Owner and Designer,
I want publication quotas enforced without deleting existing work,
So that beta limits remain understandable and non-destructive.

**Acceptance Criteria:**

**Given** the Organization is below its distinct published-Workflow limit
**When** a first version of a new Workflow publishes
**Then** it consumes one quota unit atomically, while later versions of that same Workflow do not consume another distinct unit
**And** usage becomes visible after commit. Traceability: FR594, FR595, FR596.

**Given** the limit is reached
**When** a new distinct Workflow attempts first publication
**Then** publication is blocked without altering the draft or existing published Workflows/Processes
**And** a stable message states the limit and available administrative action.
