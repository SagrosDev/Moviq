# Epic 6: Navigate Work and Track Authorized Processes

Members can find actionable work and authorized Processes, while Administrators can operate Needs Attention and All Processes using complete search, filter, sorting, and responsive navigation.

**Primary FR coverage:** FR11, FR12, FR13, FR14, FR15, FR16, FR24, FR25, FR290, FR291, FR292, FR297, FR299, FR300, FR301, FR304, FR305, FR307, FR309, FR310, FR311, FR313, FR314, FR317, FR318, FR348, FR349, FR350, FR351.

## Story 6.1: Enforce Participant and Production-Data Visibility

As a Process participant,
I want access limited to my authorized Tasks, contributions, and progress,
So that participation never exposes another person's private work.

**Acceptance Criteria:**

**Given** a starter, direct/Team assignee, prior participant, Designer, Administrator, or Owner
**When** Process/Task/Data authorization is evaluated
**Then** participants receive only limited progress and their own authorized contributions; Designers gain no production data through design access; Owners/Administrators receive Organization-wide operational access with data-view audit
**And** assignment visibility never grants Workflow start authority. Traceability: FR11, FR12, FR13, FR14, FR15, FR16, FR24, FR25.

**Given** identifier substitution or a query/filter/count crossing that boundary
**When** the request executes
**Then** no foreign/restricted row, field, attachment, count, or existence signal is returned and no access audit falsely records a denied view.

## Story 6.2: Complete the My Tasks Inbox

As a Member,
I want to find and act on my direct and Team Tasks,
So that urgent work is clear on any operational device.

**Acceptance Criteria:**

**Given** direct Assigned, Team Available, claimed, completed, and unauthorized Tasks
**When** My Tasks is searched, filtered, sorted, or paginated
**Then** server-side Organization-scoped results include only actionable/authorized rows with documented columns/actions and stable pagination
**And** narrow layouts render authorization-safe Task Cards. Traceability: FR290, FR291, FR292, FR304, FR305, FR313, FR314, FR317, FR318, UX-DR8.

**Given** empty, loading, slow/offline, permission-changed, or stale results
**When** the inbox updates
**Then** explicit accessible state/action appears, valid local work is preserved where applicable, and stale actions are rejected by the server.

## Story 6.3: Complete My Processes Tracking

As a participant,
I want to search and follow Processes I started or joined,
So that I can understand progress and history.

**Acceptance Criteria:**

**Given** Processes with mixed participation/status/date/workflow
**When** My Processes queries, searches, filters, sorts, and paginates
**Then** the server returns only authorized Processes with limited status/current-position information and stable URL/query state
**And** no underlying Workflow becomes startable merely through participation. Traceability: FR297, FR300, FR301, FR307.

**Given** a selected authorized Process
**When** detail opens
**Then** header, contributions, files, and timeline are projected independently by authorization and responsive views expose no hidden data.

## Story 6.4: Operate the Needs Attention View

As an Administrator,
I want a focused queue of Processes and Tasks needing intervention,
So that assignment and operational problems are resolved promptly.

**Acceptance Criteria:**

**Given** Needs Reassignment and other documented Needs Attention conditions
**When** an Owner/Administrator searches, filters, sorts, or paginates the view
**Then** server-side results show safe reason, age, Workflow/Process/Task, current state, and permitted action for their Organization only
**And** ordinary participants and Designers without administration receive no queue data. Traceability: FR299, FR309.

**Given** a problem is resolved or becomes stale during action
**When** the command returns
**Then** the row leaves/updates from authoritative state and stale actions do not overwrite newer resolution.

## Story 6.5: Operate the All Processes View

As an Administrator,
I want an Organization-wide Process view,
So that I can support operations without cross-tenant access.

**Acceptance Criteria:**

**Given** an Owner/Administrator and large authorized dataset
**When** All Processes is searched, filtered, sorted, and paginated
**Then** queries execute on the server with bounded pages and return documented status/workflow/date/participant-safe columns from that Organization only
**And** responsive cards preserve the primary action. Traceability: FR310, FR311, NFR5.

**Given** an administrative detail/data view
**When** it succeeds
**Then** authorized access is recorded in audit with actor, scope, Process, time, and action while telemetry excludes Process Data.

## Story 6.6: Protect Process Timeline Privacy

As a participant,
I want a useful timeline that hides other users' restricted submissions,
So that I can follow progress without gaining unintended data access.

**Acceptance Criteria:**

**Given** repeated occurrences and events involving multiple participants
**When** a Member timeline is projected
**Then** it shows authorized task/state/actor/time summaries and the Member's own submitted details, distinguishes loops, and omits another user's exclusive values/attachments
**And** an Owner/Administrator can navigate to full audit under separately audited authority. Traceability: FR348, FR349, FR350, FR351.

**Given** event text, metadata, or counts could reveal restricted data
**When** serialization and rendering run
**Then** projection removes it server-side and the client receives no hidden payload to mask visually.
