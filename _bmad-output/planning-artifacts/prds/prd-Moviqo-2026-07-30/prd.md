---
title: "Moviqo Product Requirements Document"
status: ready-for-ux-and-architecture
created: 2026-07-30
updated: 2026-08-01
---

# PRD: Moviqo

## 0. Document Purpose

This draft defines the testable MVP requirements for Moviqo. It was developed from the Product Brief, its append-only decision log, and the original PADR input:

- `../../briefs/brief-moviqo-2026-07-30/brief.md`
- `../../briefs/brief-moviqo-2026-07-30/.memlog.md`
- `C:\New folder\Moviqo_PADR.pdf`
- `padr-supersession.md`

Requirements will be grouped by capability with stable functional-requirement identifiers. Detailed implementation mechanisms will be deferred to UX and architecture artifacts.

### 0.1 Source of truth and decision precedence

This PRD and its append-only `.memlog.md` are Moviqo's authoritative product specification. The Product Brief and PADR are preserved as starting artifacts that explain product context and earlier reasoning; they are not co-equal implementation specifications.

When artifacts differ, downstream work applies the following precedence:

1. The latest approved decision recorded in this PRD and its `.memlog.md`.
2. Product Brief context that does not conflict with the PRD.
3. Original PADR rationale or architecture candidates that do not conflict with the PRD and are subsequently confirmed by architecture.

`padr-supersession.md` records the material PADR decisions replaced or refined during PRD analysis. UX, architecture, epics, stories, schemas, tests, and implementation plans must not reintroduce a superseded Brief or PADR decision merely because it remains visible in historical source material.

### 0.2 Product definition

Moviqo is a bilingual, multi-tenant SaaS product that enables small and medium-sized businesses to replace operational processes coordinated through spreadsheets, email, messaging, printed documents, and manual follow-up. A non-technical Owner or Designer can configure structured Forms, Tasks, assignments, calculations, validations, conditional routes, attachments, and tracking without BPMN knowledge or custom software development.

Moviqo's core product promise is a simple path from process idea to executable Workflow. For a simple use case, successful first publication is targeted within thirty minutes and must remain achievable within sixty minutes under the beta success definition in SC-005. Security, reliability, traceability, understandable design, and affordable adoption are product requirements rather than assumptions.

The primary customer hypothesis is an SME without a dedicated automation team. No specific industry is required for the MVP; representative scenarios include purchase-request review, document intake and review, and operational service or maintenance requests. The first registered user creates one Organization, becomes its Owner, and can administer, design, start, and participate in Processes through inherited capabilities.

### 0.3 MVP scope boundary

The MVP includes the public landing and registration journey; one-Organization Accounts; Member, Designer, Administrator, and Owner capabilities; users and Teams; authorized Workflow starters; the Workflow catalog and Designer; Task Forms and Process Fields; the visual rule and calculation engine; Start, Task, Conditional Routing, Transition, and End elements; assignment and manual reassignment; drafts, publication, immutable versions, restoration, inactive elements, and live compatible updates; Process execution; My Tasks and My Processes; administrative operations; notifications; audit and authorized timelines; private files and exports; bilingual application content; Organization regional settings; quotas and lifecycle; and the approved security, recovery, quality, and delivery gates.

The MVP excludes full BPMN compatibility, parallel routing, subprocesses, timers, reminders and SLAs, public or anonymous Process initiation, arbitrary scripts, customer-defined general-purpose background automation, external API integrations, advanced analytics, process intelligence, AI, round-robin or workload assignment, automatic reassignment services, multiple custom Task outcome buttons, real-time collaborative editing, native mobile applications, WhatsApp, SMS, push notifications, MFA, enterprise SSO, passkeys, and formal uptime commitments. Required platform background operations for email, retries, exports, malware inspection, backups, monitoring, and Organization lifecycle remain in scope; architecture selects their implementation mechanism.

Gate 1 provides the feature-complete internal beta with persistent synthetic data. Gate 2 provides customer-production readiness. Real customer onboarding and permitted real-business-data entry begin only after Gate 2 passes.

### 0.4 Domain terminology

- **Account:** The authenticated Moviqo identity identified by one globally unique normalized email address. One MVP Account belongs to exactly one Organization.
- **Organization:** The tenant and immutable isolation boundary for Moviqo business configuration, users, Workflows, Processes, files, exports, notifications, and audit data.
- **Member:** An active Organization user with the common ability to participate in authorized Processes. Designer, Administrator, and Owner are progressively higher access levels that inherit Member capabilities.
- **Workflow:** One reusable operational-process definition owned by an Organization. Versions and drafts belong to the same Workflow and do not create additional Workflow definitions.
- **Shared draft:** The single editable definition associated with a Workflow at one time. It may contain validation errors and cannot affect production execution until successfully published.
- **Published version:** An immutable, sequential, auditable snapshot created by successful Workflow publication.
- **Process:** One runtime execution of a published Workflow. Architecture may call this a process instance internally, but customer-facing interface content uses **Process**, including My Processes and Process number.
- **Workflow element:** A Start, Task, Conditional Routing, or End object in the active Workflow graph. A Transition is the directed connection between elements.
- **Task definition:** The reusable Task configuration inside a Workflow, including its Form, assignment method, notification behavior, and outgoing Transition.
- **Task occurrence:** One runtime visit to a Task definition inside one Process. A loop creates a new occurrence rather than reopening a completed occurrence.
- **Task Form:** The Task-specific presentation that exposes Process Fields and informational components to an authorized participant.
- **Process Field:** A stable Workflow-owned data definition reusable across Task Forms. Its value is stored separately for each Process.
- **Process Data:** The current and historical values, table rows, calculated values, and attachment references captured for one Process under its Organization boundary.
- **Conditional Routing:** An automatic Workflow element that evaluates ordered visual conditions and chooses exactly one outgoing path, including a required default path.
- **Instance State:** The PRD's configuration term for a Designer-defined Workflow-specific business state applied by Start or a Transition. The customer sees the Designer-authored state label rather than a fixed Moviqo approval status.
- **Configuration Audit:** Immutable evidence of changes to Organization and Workflow configuration.
- **Transactional Audit:** Immutable evidence of Process execution, Task occurrences, assignments, Process Data changes, routing, states, files, and authorized operational actions.

## 1. Accounts, Organization Membership, and Roles

### 1.1 Role model

Every active user who belongs to an Organization is a **Member**. Membership provides the common process-participation capabilities; the Designer, Administrator, and Owner access levels add progressively broader capabilities.

For the MVP, access levels are hierarchical:

`Member → Designer → Administrator → Owner`

An Auditor access level is not included in the MVP. A dedicated read-only compliance role may be considered later if validated by customer demand.

#### Functional requirements

- **FR-001 — Member participation:** Every active Organization Member can belong to Teams, receive Tasks through direct or Team assignment, complete authorized Tasks, and start Workflows for which the Member is an Authorized Starter.
- **FR-002 — Designer capabilities:** A Designer has all Member capabilities and can create, configure, validate, publish, and maintain every Workflow definition, Form, Process Field, Calculation, and reusable Organization list in the Designer's Organization.
- **FR-003 — Administrator capabilities:** An Administrator has all Designer capabilities and can manage Organization users, Teams, assignments, open Task reassignment, process-instance operations, and other operational administration.
- **FR-004 — Owner capabilities:** An Owner has all Administrator capabilities and can manage Organization ownership, ownership transfer, billing configuration when introduced, and critical Organization settings.
- **FR-005 — Owner continuity:** An Organization must retain at least one active Owner. The final active Owner cannot be deactivated, deleted, or stripped of ownership until another active Owner has been designated.
- **FR-006 — Process participation independent of access level:** Owners, Administrators, and Designers can belong to Teams and can be directly or indirectly assigned Tasks because all three inherit Member participation capabilities.
- **FR-007 — Password recovery and change:** A user can request a secure forgot-password recovery email and can change their password while authenticated. A recovery response must not disclose whether an email address belongs to an account.
- **FR-008 — User deletion and deactivation:** A user may be physically deleted only when the user has no historical instance, Workflow-creation, Task, file, or audit-data relationship, including authorship references such as `Created By`. A referenced user must instead be deactivated so that historical identity and audit integrity remain intact.
- **FR-009 — Effects of deactivation:** A deactivated user cannot authenticate, receive new Tasks, or start Workflow instances. The user may later be reactivated without losing historical relationships.
- **FR-010 — Deactivation safeguards:** Before deactivation, Moviqo must identify the user's directly assigned or claimed open Tasks and block deactivation until those Tasks have been reassigned. Related Team and published-Workflow assignment impacts must be presented for administrative resolution.

### 1.2 Instance, Task, and process-data visibility

Participation in an instance means that a Member started the instance or received, claimed, or completed a Task in it. Participation does not grant access to every Task or every Process Field in that instance.

- **FR-011 — Participant instance overview:** A Member can view a limited progress overview for instances the Member started or participated in, including the instance identifier, overall status, and current process position.
- **FR-012 — Own contribution access:** A Member can view the Tasks the Member completed and the Process Field values and attachments submitted through those Tasks.
- **FR-013 — Task access boundary:** A Member can open an active Task only when it is assigned directly to that Member or is available to an eligible Team to which the Member belongs. Participation in another Task from the same instance does not grant access.
- **FR-014 — Process-data exposure:** A participant can access Process Fields only through an authorized Task or another explicitly authorized instance view. A participant cannot inspect data entered exclusively through another user's Task merely because both Tasks belong to the same instance.
- **FR-015 — Administrative instance access:** Owners and Administrators can inspect all Organization instances and Tasks for operational support. Such access must be recorded in the audit history where it involves a data view or operational action.
- **FR-016 — Designer production-data boundary:** Designer access to a Workflow definition does not automatically grant access to the Workflow's production instances or business data. A Designer receives production access only through normal participation or an additional administrative access level.

## 2. Permission to Start Workflows

Each published Workflow must define who can create production instances. Authorization to start a Workflow is separate from authorization to receive or complete Tasks within its instances.

- **FR-017 — Authorized Starters:** A Workflow can authorize all active Organization Members, selected active Teams, and/or selected active individual Members to start production instances.
- **FR-018 — Publish validation:** A Workflow cannot be published without at least one valid Authorized Starter configuration.
- **FR-019 — Member and Designer start authorization:** Members and Designers can start a published Workflow only when authorized directly, through an authorized Team, or through an all-active-members configuration.
- **FR-020 — Operational start authority:** Owners and Administrators can start any published Workflow for operational support even when they are not listed as Authorized Starters.
- **FR-021 — Start audit:** Every production-instance creation must record the Organization, Workflow and published version, new instance identifier, initiating user, initiation time, and whether Owner or Administrator operational authority was used.
- **FR-022 — No public initiation in MVP:** The MVP supports authenticated Organization Members only. Anonymous, guest, and public-form initiation are deferred.
- **FR-023 — Startable Workflow visibility:** In the start-Workflow area of the dashboard, Members and Designers can see only published Workflows they are currently authorized to start. Owners and Administrators can see every published Workflow in the Organization.
- **FR-024 — Assigned-instance visibility:** A Member who has a directly assigned Task, or is eligible for a Task assigned to one of the Member's Teams, can see that specific instance in the Member's work and instance views together with the limited progress information defined by FR-011.
- **FR-025 — Assignment does not grant start authority:** Visibility of an instance because of Task assignment does not make the underlying Workflow available for the Member to start unless the Member is also an Authorized Starter.
- **FR-026 — Dashboard separation:** The dashboard must distinguish Workflows available to start, Tasks requiring the Member's attention, and running or historical instances the Member is authorized to follow.

## 3. Teams and Task Assignment

### 3.1 Team Task claiming

- **FR-027 — Team Task availability:** When a Task is assigned to a Team, it becomes Available to every active Member of that Team.
- **FR-028 — Claim before work:** A Team Member must successfully claim an Available Team Task before entering or changing its form data, saving progress, or completing it.
- **FR-029 — Exclusive claim:** Claiming a Team Task assigns responsibility to one active Team Member. Moviqo must prevent two Members from successfully claiming the same Task.
- **FR-030 — Claimed Task access:** After a Team Task is claimed, other Team Members can see that it has been claimed but cannot edit or complete it unless it is subsequently reassigned to them.
- **FR-031 — Claim audit:** Moviqo must record the Team, claiming Member, and claim timestamp in the Task and instance audit history.
- **FR-032 — Deferred assignment strategies:** Collaborative editing, round-robin assignment, workload balancing, automatic assignment, and other advanced Team assignment behaviors are outside the MVP.

### 3.2 Team management

- **FR-033 — Team administration:** Owners and Administrators can create, rename, manage membership for, and deactivate Teams within their Organization.
- **FR-034 — Multiple Team membership:** An active Member can belong to multiple active Teams in the same Organization.
- **FR-035 — Designer Team usage:** Designers can select valid active Teams while configuring authorized Workflows but cannot change Team definitions or membership unless they also have Administrator or Owner access.
- **FR-036 — Historical Team preservation:** A Team referenced by historical Workflow, Task, instance, or audit data cannot be physically deleted. It can be deactivated while its stable identity and historical relationships remain intact.
- **FR-037 — Team deactivation safeguard:** Moviqo must block Team deactivation while the Team has open Tasks. An Owner or Administrator must reassign those Tasks before deactivation.
- **FR-038 — Valid Team reference:** A Team must be active and contain at least one active Member to be a valid production Task assignee or Authorized Starter when a Workflow is published.

### 3.3 Task assignment methods and recovery

Each Task definition must specify exactly one assignment method for production execution.

- **FR-039 — Specific Member assignment:** A Designer can configure a Task for assignment to one specific active Organization Member.
- **FR-040 — Specific Team assignment:** A Designer can configure a Task for assignment to one valid active Team, after which the claiming requirements in FR-027 through FR-031 apply.
- **FR-041 — Workflow Initiator assignment:** A Designer can configure a Task for assignment to the active Member who started the current Workflow instance.
- **FR-042 — User Reference assignment:** A Designer can configure a Task for dynamic assignment to the Organization Member stored in a User Reference Process Field in the current instance.
- **FR-043 — Runtime assignment validation:** When a Task becomes active, Moviqo must resolve its configured assignment and verify that the resulting Member or Team is active and belongs to the same Organization as the instance.
- **FR-044 — Needs Reassignment state:** If an assignment is empty, inactive, invalid, or cannot be resolved, the Task must enter `Needs Reassignment` and must not be editable or completable until an Owner or Administrator resolves it.
- **FR-045 — Administrative reassignment inbox:** Every `Needs Reassignment` Task must appear in the instance-management inbox of the Organization's Owners and Administrators, with the affected Workflow, instance, Task, assignment failure reason, and time of failure.
- **FR-046 — Manual reassignment:** An Owner or Administrator can manually reassign an open Task to a valid active Member or Team. A Member assignment makes the Task assigned to that Member; a Team assignment makes it Available for Team claiming.
- **FR-047 — Reassignment effects:** Reassignment must preserve existing Task and instance data, remove active Task access from the previous assignee when applicable, grant access to the new assignee or Team, and record the administrator, previous assignment, new assignment, timestamp, and reason in the audit history.

## 4. Forms and Process Data

### 4.1 Text fields

- **FR-048 — Short Text field:** A Designer can define a Short Text Process Field and configure its label, help text, placeholder, default value, minimum length, and maximum length. A new field defaults to a minimum of zero and a maximum of 255 characters; the Designer can configure narrower limits, but the platform maximum remains 255 characters.
- **FR-049 — Friendly text validation:** A Designer can apply user-friendly predefined Short Text validation formats, including email address, telephone number, URL, alphabetic text, and alphanumeric text. Validation feedback must be expressed in non-technical language.
- **FR-050 — No raw patterns in MVP:** Direct entry of regular expressions or executable custom text-validation code is outside the MVP.
- **FR-051 — Long Text field:** A Designer can define a Long Text Process Field for multiline plain-text input and configure its label, help text, placeholder, default value, minimum length, and maximum length. A new field defaults to a minimum of zero and a maximum of 10,000 characters; the Designer can configure narrower limits, but the platform maximum remains 10,000 characters.
- **FR-052 — Rich text deferred:** Rich-text editing, embedded HTML, and arbitrary formatted content are outside the MVP.
- **FR-053 — Calculations remain separate:** Short Text and Long Text fields are user-entered fields and do not gain a calculation mode. Derived values must use a separate Calculated Field capability.
- **FR-054 — Common conditional behavior:** Short Text and Long Text fields must support the common Form visibility, editability, and conditional-required behavior defined later in this PRD.

### 4.2 Numeric input safety

- **FR-055 — Integer platform range:** An Integer Process Field accepts whole numbers from `-999,999,999,999,999` through `999,999,999,999,999`. An empty Designer-defined minimum or maximum means the corresponding platform boundary applies.
- **FR-056 — Designer numeric constraints:** A Designer can configure narrower minimum and maximum values within the platform-supported range. Moviqo must prevent publication when configured numeric constraints fall outside the platform range or the minimum exceeds the maximum.
- **FR-057 — Validation before persistence:** Moviqo must validate numeric type, platform range, and configured field constraints in both the user interface and the server before persistence. An invalid numeric value cannot be saved as a draft or submitted to complete a Task, and the user must receive a clear field-level message.
- **FR-058 — Accepted-value storage guarantee:** Every numeric value accepted by server validation must be representable by the persistence layer and must not later fail because of numeric overflow or incompatible precision.
- **FR-059 — Numeric field types:** A Designer can define Integer, Decimal, and Currency Process Fields with an optional default value and editable minimum and maximum constraints.
- **FR-060 — Integer business defaults:** A new Integer field defaults to a minimum of `0`, a maximum of `999,999,999`, no decimal places, and an empty default value.
- **FR-061 — Decimal business defaults:** A new Decimal field defaults to a minimum of `0.00`, a maximum of `999,999,999.99`, two permitted decimal places, and an empty default value.
- **FR-062 — Currency business defaults:** A new Currency field defaults to a minimum of `0.00`, a maximum of `999,999,999.99`, an empty default value, the Organization default currency, and the standard decimal precision of that currency, normally two places. A Currency field must have one valid configured ISO currency code before publication.
- **FR-063 — Negative-value option:** New numeric fields reject negative values by default. A Designer can enable negative values, which initially changes the minimum to the negative equivalent of the default maximum, and can then configure a different valid minimum.
- **FR-064 — Empty is not zero:** Moviqo must preserve the distinction between an empty numeric value and zero and must not insert zero unless the Designer configured zero as the field's default value.
- **FR-065 — Organization-consistent numeric display:** Moviqo displays decimal separators, grouping separators, and currency presentation according to the Organization regional format rather than the viewing user's interface language, without changing the stored value.
- **FR-066 — Numeric reuse:** Integer, Decimal, and Currency fields can be referenced by Calculated Fields, Form conditions, validation rules, and Conditional Routing.

### 4.3 Date and Date-Time fields

- **FR-067 — Date field:** A Designer can define a Date Process Field that stores a calendar date without a time component.
- **FR-068 — Date-Time field:** A Designer can define a Date-Time Process Field that represents an exact date and time.
- **FR-069 — Date defaults:** A new Date or Date-Time field has an empty data default. A Designer can instead configure a fixed value, `Today` for a Date, or `Now` for a Date-Time.
- **FR-070 — Date boundaries:** A Designer can configure minimum and maximum values using fixed dates or times, `Today` or `Now`, a positive or negative number of days relative to those values, or another compatible Date or Date-Time Process Field.
- **FR-071 — Supported date range:** Moviqo supports Date and Date-Time values from January 1, 1900 through December 31, 2100, and must reject out-of-range values before persistence.
- **FR-072 — Organization-consistent date display:** Date values display according to the Organization regional format. Date-Time values use the same regional format and the Organization's configured timezone while preserving the represented instant.
- **FR-073 — Date validation:** Invalid, out-of-range, or constraint-violating Date and Date-Time values cannot be saved as a draft or submitted to complete a Task and must produce a clear field-level message.
- **FR-074 — Date reuse:** Date and Date-Time fields can be referenced by Form conditions, Conditional Routing, validation rules, and supported calculations such as the elapsed days between two dates.
- **FR-075 — Date entry methods:** Every Date and Date-Time control supports manual entry using the Organization regional format and an on-demand calendar picker without requiring the Designer to choose an entry mode.
- **FR-076 — Date-Time entry:** A Date-Time control combines the Date entry methods with an appropriate time selector.
- **FR-077 — Date constraint feedback:** Calendar choices outside the configured or platform range are unavailable, and equivalent manually entered values receive the same validation result.
- **FR-078 — Responsive date input:** Moviqo may use an appropriate native date or time selector on supported mobile devices while preserving the same validation and stored value.

### 4.4 Yes/No fields

- **FR-079 — Yes/No field:** A Designer can define a Yes/No Process Field whose value is empty, Yes, or No until Form validation requires a definitive answer.
- **FR-080 — Explicit selector presentation:** The default Yes/No presentation displays explicit Yes and No choices and begins with no selection unless the Designer configured a default.
- **FR-081 — Confirmation presentation:** A Designer can instead present a Yes/No field as a confirmation checkbox, where checked means Yes and unchecked means No.
- **FR-082 — Required Yes/No behavior:** A required explicit selector must contain either Yes or No before Task completion. A required confirmation checkbox must be checked before Task completion.
- **FR-083 — Configurable default:** A Designer can leave the data default empty or configure Yes or No as the initial value.
- **FR-084 — Yes/No reuse:** A Yes/No field can be referenced by Form conditions, validation rules, Calculated Fields, and Conditional Routing.

### 4.5 Choice fields and reusable lists

- **FR-085 — Separate Choice field types:** Single Choice and Multiple Choice are separate Process Field types and separate Form controls. Single Choice stores one option identifier; Multiple Choice stores zero or more option identifiers.
- **FR-086 — Choice sources:** A Designer can configure either field type with Workflow-local options or with an Organization Choice List reusable by multiple Workflows.
- **FR-087 — Choice List management scope:** Organization Choice Lists belong exclusively to one Organization and are manageable by Designers, Administrators, and Owners. Their exact navigation and management screens are deferred to UX design.
- **FR-088 — Stable option identity:** Every option has a stable internal identifier, current display label, display order, and active or inactive state. Process data stores the stable identifier rather than the label.
- **FR-089 — Current-label display:** Instance Forms and views resolve stored option identifiers to the option's current label, including for historical instance data.
- **FR-090 — Option label audit:** Renaming an option must record its old label, new label, actor, and timestamp in audit history.
- **FR-091 — Used option preservation:** An option referenced by Process Data, a Workflow condition, routing, or audit history cannot be physically deleted. An inactive option remains resolvable and visible for existing values but is unavailable for new selections.
- **FR-092 — Live Organization List additions:** An active option added to an Organization Choice List becomes available for new selections in every referencing Form, including Forms in already-running instances, when the Form is next loaded or the user refreshes the page. Real-time updates to an already-open Form are not required.
- **FR-093 — Workflow-local option updates:** Changes to Workflow-local options require publication of the changed Workflow. Active instances use the updated options when they next load the newest published Form according to the active-instance update policy.
- **FR-094 — Choice defaults and validation:** A Choice field begins empty unless a valid active default is configured. Multiple Choice can define minimum and maximum selection counts.
- **FR-095 — Large-list usability:** A Choice control provides option search when its current source contains more than ten active options. Controls with ten or fewer active options can present the complete selectable list without search.
- **FR-096 — Choice reuse:** Choice values can be referenced by Form conditions, validation rules, Calculated Fields where supported, and Conditional Routing. Multiple Choice conditions include membership tests such as “contains option.”

### 4.6 User Reference fields

- **FR-097 — User Reference field:** A Designer can define a User Reference Process Field that stores one Organization Member's stable membership identifier.
- **FR-098 — Same-Organization selection:** A User Reference control provides a searchable list containing only active Members of the current Organization.
- **FR-099 — Optional Team restriction:** A Designer can restrict a User Reference field so that selectable Members must belong to one or more configured active Teams.
- **FR-100 — User Reference default:** A new User Reference field has an empty default value.
- **FR-101 — Current identity display:** Forms and instance views resolve a stored membership identifier to the Member's current display name.
- **FR-102 — Inactive historical reference:** If a referenced Member becomes inactive, existing User Reference values remain visible with an inactive indicator, but that Member is unavailable for new selections.
- **FR-103 — Dynamic assignment use:** A User Reference field can supply the runtime assignee for a Task according to FR-042 through FR-045.
- **FR-104 — Assignment eligibility:** When a dynamic Task becomes active, its referenced Member must remain active and must satisfy any Team restriction configured on the User Reference field. Failure places the Task in `Needs Reassignment`.
- **FR-105 — User Reference conditions:** User Reference values can be compared by supported Form conditions and Conditional Routing.
- **FR-106 — Single Member scope:** A User Reference field selects one Member. Selecting multiple Members through one field is outside the MVP.

### 4.7 Process Field reuse across Task Forms

Process Fields belong to one Workflow and hold instance data independently from the Form controls that expose them in individual Tasks.

- **FR-107 — Workflow Process Field catalog:** The Form Designer must provide a simple organized view of Process Fields already defined for the current Workflow.
- **FR-108 — Create or reuse:** When adding a Form control, a Designer can create a new Process Field or select an existing compatible Process Field without duplicating its instance data.
- **FR-109 — Clear field organization:** The Designer experience must clearly distinguish fields used in the current Form, active Workflow fields available for reuse, and inactive fields eligible for reactivation. Exact navigation and visual treatment are deferred to UX design.
- **FR-110 — Control removal preserves data:** Removing a Process Field control from a Task Form changes that Task's presentation but does not delete the Process Field, its instance values, or its attachments.
- **FR-111 — Reused value visibility:** When an existing Process Field is placed in a later authorized Task Form, the Form displays the same current instance value, including existing File Attachments, without requiring duplicate entry or storage.
- **FR-112 — Task-specific presentation:** Each Task Form can configure an included Process Field as visible, conditionally visible, editable, read-only, required, or optional without changing the field's stable identity.
- **FR-113 — Inactive field reactivation:** A historically preserved inactive Process Field can be reactivated with its stable identity and surviving instance values. The Designer chooses where and how to place it in active Task Forms.
- **FR-114 — Explicit attachment removal:** An uploaded file is removed from current Process Data only through an explicit authorized removal action, not merely because its control is absent from a later Form. Removal clears the current reference, queues binary deletion after successful persistence, and retains audit metadata.

### 4.8 File Attachment fields

- **FR-115 — File Attachment field:** A Designer can define a File Attachment Process Field that holds one or more private files and their metadata for a Workflow instance.
- **FR-116 — Basic attachment properties:** The primary Designer properties are label, help text, required or optional, allowed high-level file categories, and maximum file count.
- **FR-117 — Attachment defaults:** A new File Attachment field defaults to optional, a maximum of five files, a maximum of 10 MB per file, and a maximum combined field size of 25 MB.
- **FR-118 — Configurable attachment limits:** A Designer can configure a maximum of one through ten files, lower per-file and total-size limits, and narrower allowed file extensions through progressively disclosed advanced properties.
- **FR-119 — Platform file allowlist:** The MVP platform can accept PDF; JPG, PNG, and WebP images; DOCX, XLSX, and PPTX Office documents; and TXT and CSV data files. Executables, scripts, HTML, macro-enabled Office files, and compressed archives are prohibited.
- **FR-120 — Server file validation:** Moviqo must validate actual file type and size on the server rather than relying on filename extensions or browser validation.
- **FR-121 — Private file authorization:** A file must remain private and can be previewed or downloaded only by a user authorized to access the Process Field through the related Task, instance, or administrative authority.
- **FR-122 — Malware inspection:** An uploaded file remains unavailable while malware inspection is pending and must not become previewable or downloadable if inspection fails.
- **FR-123 — Supported preview:** Moviqo provides in-application preview for supported images and PDFs. Other accepted files are available through authorized download.
- **FR-124 — Attachment audit:** Upload, explicit removal, preview, and download events must record the Organization, Workflow, version, instance, Task and Process Field where applicable, file identifier and metadata, actor, timestamp, and action.
- **FR-125 — Designer simplicity:** Security, authorization, malware inspection, audit, and storage cleanup are automatic platform behavior and are not exposed as technical Designer parameters.

### 4.9 Data Table fields

- **FR-126 — Data Table field:** A Designer can define a Data Table Process Field containing a configured set of columns and zero or more instance rows.
- **FR-127 — Row-count validation:** A Designer can configure optional minimum and maximum row counts. A new table is optional with a minimum of zero rows; making it required sets an initial minimum of one valid row.
- **FR-128 — Valid-row requirement:** An empty row or a row containing unresolved field-validation errors does not satisfy the table's minimum-row requirement.
- **FR-129 — Row operations:** An authorized user can add, edit, and remove rows while the Data Table is enabled and editable in the current Task Form.
- **FR-130 — Supported column types:** MVP Data Table columns can use Short Text, Integer, Decimal, Currency, Date, Date-Time, Yes/No, Single Choice, User Reference, and Calculated types.
- **FR-131 — Column validation:** Each non-calculated column uses the defaults and validation properties applicable to its field type and can be configured as required or optional.
- **FR-132 — Table reuse:** Reusing the same Data Table Process Field in a later authorized Task displays the instance's existing rows without duplicating them.
- **FR-133 — Table-level conditions:** A Data Table control can be conditionally visible, enabled or disabled, and required or optional according to common Form rules.
- **FR-134 — Column visibility:** Conditional visibility applies to an entire column and can reference compatible Process Fields outside the table. Individual cells and rows cannot be conditionally hidden in the MVP.
- **FR-135 — Conditional cell behavior:** A column can define enabled or disabled and required or optional rules that are evaluated for each row and can reference compatible Process Fields outside the table and values from the same row.
- **FR-136 — Conditional validation:** Cells in a hidden column and conditionally disabled cells do not apply required validation. When the corresponding column or cell becomes visible and enabled again, its applicable required validation resumes.
- **FR-137 — Calculated columns:** A Calculated column can use a visual formula referencing compatible values from the same row, such as `Quantity × Unit price`, and is read-only to the Task participant.
- **FR-138 — Table aggregates:** Supported table aggregates are count, sum, average, minimum, and maximum over compatible column values.
- **FR-139 — Table audit:** Adding, editing, and removing rows must record the instance, Task, Data Table, stable row identity, changed values, actor, and timestamp in transactional audit history.
- **FR-140 — No executable table logic:** Arbitrary scripts, custom executable code, and arbitrary cross-row conditions or calculations are outside the MVP. Supported aggregates remain available through FR-138.
- **FR-141 — Deferred Data Table capabilities:** Conditional cell or row colors, File Attachment, Long Text, and Multiple Choice cells, nested tables, spreadsheet import/export, and individual-cell or row visibility are deferred.
- **FR-142 — Simple table configuration:** The Designer presents common table and column properties first and progressively discloses row limits and conditional rules as advanced configuration.

### 4.10 Calculated Fields

- **FR-143 — Calculated Field:** A Designer can define a read-only Calculated Process Field with a Text, Integer, Decimal, Currency, Date, or Date-Time result type.
- **FR-144 — Visual formula builder:** A Designer creates a formula by selecting compatible Process Fields, operators, and supported functions through a visual builder without writing executable code.
- **FR-145 — Numeric operations:** Supported numeric operations are addition, subtraction, multiplication, division, parentheses, and rounding to configured precision.
- **FR-146 — Text and date operations:** Supported non-numeric operations are joining field values with fixed text, adding or subtracting days from dates, and calculating elapsed days between dates.
- **FR-147 — Table calculation access:** A Calculated Field can use the count, sum, average, minimum, and maximum aggregates defined by FR-138. Calculated Data Table columns use the same calculation rules with current-row scope.
- **FR-148 — Automatic recalculation:** Calculated values recalculate when referenced data changes, and the server must recalculate them before persistence, Task completion, or Conditional Routing evaluation.
- **FR-149 — Calculation dependency validation:** The formula builder must prevent incompatible references where possible, and Moviqo must block publication for missing, incompatible, or circular calculation dependencies.
- **FR-150 — Empty-source behavior:** An empty referenced value normally produces an empty calculated result rather than a calculation error. A required Calculated Field still blocks Task completion until its inputs produce a valid result.
- **FR-151 — Runtime calculation errors:** Division by zero and other runtime calculation failures produce a field-level error and an empty calculated value. Moviqo must never persist `Infinity`, `NaN`, executable output, or error text as a Process Field value.
- **FR-152 — Draft calculation recovery:** Save Draft can preserve valid user-entered source values and a separate calculation-error state, but cannot persist an invalid or stale calculated result.
- **FR-153 — Completion and routing safety:** A Task cannot complete and routing cannot evaluate while a required Calculated Field has a runtime error.
- **FR-154 — Calculation audit:** Persisted calculation results must be attributable in audit history to the Workflow version and formula definition used.
- **FR-155 — Deferred calculation capabilities:** Nested conditional branches, arbitrary scripts, and custom executable functions are outside the MVP. Pedagogical visual IF/THEN/ELSE branches are supported according to Section 4.11.

### 4.11 Pedagogical visual rule engine

Moviqo uses one localized visual rule engine for conditional Form behavior, Calculated Fields, and Conditional Routing. Designers compose business sentences by selecting fields, operators, values, and results rather than writing code.

- **FR-156 — Shared logical condition builder:** Form conditions, conditional calculations, Form Validation Rules, and Conditional Routing share the same pedagogical builder for the logical IF portion: typed Field, logical or comparison Operator, Value, and All or Any grouping. Each context provides its own valid result editor.
- **FR-157 — Contextual natural-language sentence:** A rule is presented as a localized sentence using selectable tokens equivalent to `IF [Field] [Operator] [Value] THEN [context-specific result]`. Form properties select a property state, calculations produce a typed value or expression, validation blocks completion with a message, and routing selects a path to a valid Workflow element.
- **FR-158 — User-facing terminology:** The builder uses user-facing terms such as Field, is equal to, is greater than, contains, is empty, Then, and Otherwise rather than technical variable names or expression syntax.
- **FR-159 — Pedagogical examples:** The builder must provide localized inline examples or starter templates. A Spanish example is: `Si [Monto] es mayor que [10.000] entonces [Justificación] es [Requerida]; si no, [Justificación] es [Opcional]`.
- **FR-160 — Ordered branches:** A Designer can add ordered IF and ELSE IF branches followed by an ELSE branch. Branches evaluate from top to bottom and the first true branch determines the result.
- **FR-161 — Deterministic fallback:** A conditional calculation requires an ELSE result. Conditional Routing requires its default path. For binary Form-property rules, Moviqo may automatically provide the opposite fallback state.
- **FR-162 — Context-appropriate results:** Form rules produce supported property states such as visible, enabled, or required; Calculated Fields produce a value compatible with their configured result type; Form Validation Rules produce a blocking message; Conditional Routing performs no data operation and selects a valid outgoing path whose target is an active Task, End, or another Conditional Routing element.
- **FR-163 — All or any conditions:** A branch can require that all configured conditions are true or that any configured condition is true.
- **FR-164 — Localized preview:** A Designer can preview the complete rule as a readable localized sentence and test it with sample values before publication.
- **FR-165 — Rule validation:** Moviqo must block publication for incompatible field types, missing references, invalid result types, unresolved paths, or circular dependencies.
- **FR-166 — Non-executable internal translation:** Moviqo translates the visual rule into a safe internal representation understood by the application. Designers cannot enter or execute JavaScript, raw expressions, or other executable code.
- **FR-167 — No nested branches in MVP:** Branches can be ordered but cannot contain another IF/THEN/ELSE structure inside their condition or result during the MVP.

### 4.12 Common conditional Form behavior

- **FR-168 — Common Form defaults:** A new editable Form control defaults to visible, enabled, optional, and empty unless the Designer configures an applicable default value.
- **FR-169 — Conditional control properties:** A Designer can use the visual rule engine to make a Form control visible or hidden, enabled or disabled, and required or optional.
- **FR-170 — Property evaluation order:** Moviqo evaluates visibility first, enabled or disabled state second, and required validation third.
- **FR-171 — Conditional value retention:** Hiding or disabling a control preserves its existing Process Field value unless an authorized user explicitly changes or removes that value through an editable control.
- **FR-172 — Conditional required behavior:** A hidden or disabled control does not apply required validation. Required validation resumes if the control becomes visible and enabled.
- **FR-173 — Draft and completion validation:** Missing required values do not prevent Save Draft but do prevent Complete Task. Type, range, structurally invalid value, prohibited file, and server-safety validation still apply during Save Draft.
- **FR-174 — Consistent evaluation:** Browser and server must evaluate the same visual rule semantics. The server is authoritative before persistence, Task completion, calculation, and routing.
- **FR-175 — Rule dependency protection:** Moviqo must show where a Process Field is referenced and block its removal while a Form rule, calculation, or routing condition still depends on it.

### 4.13 Responsive Form layout and labels

- **FR-176 — Responsive layout grid:** Task Forms use a responsive twelve-column layout grid that automatically aligns controls and prevents overlap.
- **FR-177 — Type-appropriate Auto width:** New controls default to an automatic width appropriate to their type. Standard inputs favor half width for two controls per desktop row; compact inputs such as Yes/No favor quarter width for four controls per row; naturally wide controls such as Long Text, File Attachment, Data Table, and layout components favor full width.
- **FR-178 — Designer width override:** A Designer can override Auto width using simple user-facing options that map to Full, Wide, Half, Third, Quarter, and Compact widths.
- **FR-179 — Compact row density:** Compact width occupies two of twelve columns and permits up to six compatible controls in one sufficiently wide desktop row. Width belongs to each control rather than to the row, and a Designer can apply one width to multiple selected controls.
- **FR-180 — Responsive reflow:** Controls wrap or stack when their configured width is not usable at the current screen size, and become full-width where necessary on mobile devices.
- **FR-181 — Required control label:** Every data-bound Form control and Data Table column has a user-facing label. Placeholder text does not replace the label.
- **FR-182 — Field identity and labels:** A Process Field has a Designer-facing name, an automatically generated stable internal identifier, and a default user-facing label.
- **FR-183 — Task-specific label override:** A Form control can override the default Process Field label for one Task without changing the Process Field identity, value, or labels in other Tasks.
- **FR-184 — Automatic label placement:** Label placement is automatic in the MVP: above standard controls, beside a confirmation checkbox, above a File Attachment area or Calculated Field value, and in the header for Data Table columns. Mobile retains the accessible automatic placement.
- **FR-185 — Label accessibility:** A usable accessible label must remain associated with every data-bound control. Arbitrary label positioning and visually hiding labels are outside the MVP.

### 4.14 Cross-field Form Validation Rules

- **FR-186 — Cross-field validation:** A Designer can define a Form-level blocking validation rule using the pedagogical visual rule engine when valid individual fields can still form an invalid business-data combination.
- **FR-187 — Validation result:** When a blocking validation rule matches, Moviqo prevents Task completion, does not evaluate routing, and presents the Designer-authored validation message.
- **FR-188 — Related-field highlighting:** A Designer can associate a validation rule with relevant Form controls so Moviqo can highlight where the user should correct data.
- **FR-189 — Draft behavior:** A matching cross-field validation rule does not prevent Save Draft, although Moviqo may display its message while the user edits the Form.
- **FR-190 — Validation references:** Cross-field validation can reference compatible Process Fields, Calculated Fields, and supported Data Table aggregates from the same Workflow.
- **FR-191 — Completion validation sequence:** Before completion, Moviqo validates structural input and files, recalculates Calculated Fields, evaluates conditional control state and required values, evaluates cross-field Form Validation Rules, persists successful completion, and only then evaluates Conditional Routing.
- **FR-192 — Validation parity and testing:** Browser and server must evaluate the same Form Validation Rule semantics, and the Designer can preview and test a rule before publication.
- **FR-193 — Validation dependencies:** Moviqo must block publication for missing or incompatible validation references and must expose validation-rule usage during Process Field dependency inspection.

### 4.15 Layout components and conditional reflow

- **FR-194 — Layout components:** The MVP Form Designer provides Section, Heading, Instruction Text, and Divider layout components that do not create or store Process Data.
- **FR-195 — Section grouping:** A Section can contain related Form controls under an optional title and description, occupies the full available Form width, and uses the responsive layout grid for its children.
- **FR-196 — No nested Sections:** A Section cannot be placed inside another Section during the MVP.
- **FR-197 — Conditional Section state:** A Section can be conditionally visible or enabled through the visual rule engine. A hidden or disabled Section applies the corresponding state to its child controls.
- **FR-198 — Section validation behavior:** Child controls hidden or disabled through their Section do not apply required validation, while their existing Process Field values remain stored.
- **FR-199 — Semantic emphasis:** A Section or supported layout element can use Normal, Information, Success, Warning, or Danger emphasis, and the visual rule engine can select an applicable semantic emphasis.
- **FR-200 — Controlled visual system:** Moviqo controls standard typography, spacing, and semantic colors. Arbitrary fonts, unrestricted colors, custom CSS, tabbed Forms, and nested layout containers are outside the MVP.
- **FR-201 — Hidden-control reflow:** A conditionally hidden control is removed from the visible grid and does not reserve its former space. Following visible controls move forward while preserving their configured order and width.
- **FR-202 — Reflow boundaries:** Automatic reflow remains within the current Form or Section and does not move controls across Section boundaries.
- **FR-203 — Visibility restoration:** When a hidden control becomes visible, it returns to its configured sequence position and the visible layout reflows. Other controls retain their configured widths.

## 5. Task Completion and Routing

### 5.1 Task actions

- **FR-204 — Save Draft action:** Every editable Task provides Save Draft, which preserves valid progress without completing the Task or evaluating a Transition or Conditional Routing element.
- **FR-205 — Complete Task action:** Every completable Task provides one primary Complete Task action that initiates final validation, calculation, persistence, completion, and routing.
- **FR-206 — Configurable completion label:** A Designer can replace the displayed Complete Task label with Task-specific business wording without changing its completion behavior.
- **FR-207 — Business decisions as Process Data:** A Designer captures decisions such as authorize, return, or escalate through Process Fields and uses those values in Conditional Routing rather than relying on fixed Moviqo approval actions.
- **FR-208 — Completion sequence:** Complete Task validates structural input and files, recalculates Calculated Fields, evaluates conditional control state and required values, evaluates cross-field validation, persists valid data, completes and locks the Task, and only then evaluates routing to the next element.
- **FR-209 — Failed completion:** If any required completion step fails, the Task remains open, no outgoing route is taken, and the user receives actionable feedback without duplicate next Tasks.
- **FR-210 — Completion audit:** Successful completion records the Organization, Workflow and version, instance, Task, completing Member, completion time, persisted values or value changes according to audit policy, and subsequently selected route.
- **FR-211 — Deferred outcome buttons:** Multiple custom Task outcome buttons and fixed Approve, Reject, or Request Changes actions are outside the MVP.

### 5.2 Workflow graph

- **FR-212 — MVP Workflow elements:** A Workflow graph contains one Start, one End, one or more Tasks, zero or more Conditional Routing elements, and directed Transitions.
- **FR-213 — Minimum valid graph:** A Workflow requires exactly one Start, exactly one End, at least one Task, and at least one valid path from Start through a Task to End.
- **FR-214 — Start and End cardinality:** Start has no incoming Transition and exactly one outgoing Transition to a Task. End has one or more incoming Transitions and no outgoing Transition.
- **FR-215 — Task cardinality:** Every active Task has at least one incoming Transition and exactly one outgoing Transition whose target is an active Task, Conditional Routing element, or End.
- **FR-216 — Conditional Routing cardinality:** Every active Conditional Routing element has at least one incoming Transition and at least two outgoing Transitions, including exactly one default path.
- **FR-217 — Conditional Routing targets:** An outgoing Conditional Routing path can target an active Task, End, or another active Conditional Routing element.
- **FR-218 — Conditional Routing evaluation:** Non-default paths use typed logical conditions in Designer-defined priority order. The first matching condition wins; the default path wins when no configured condition matches.
- **FR-219 — Routing does not mutate data:** Conditional Routing selects one outgoing path and does not create, edit, or delete Process Data.
- **FR-220 — Chained Routing elements:** Conditional Routing elements can chain to split complex logic into understandable visual decisions. Every evaluated condition and selected path must be audited.
- **FR-221 — Cycle rules:** Cycles containing at least one Task are permitted when a possible exit path to End exists. A cycle composed only of automatically evaluated Conditional Routing elements is prohibited, and every automatic chain must terminate at a Task or End.

### 5.3 Graph validation and publication

- **FR-222 — Validation timing:** Moviqo validates a Workflow graph when the draft is saved and again when publication is requested.
- **FR-223 — Reachability and termination:** Every active element must be reachable from Start and must have a possible graph path to End. Disconnected elements and dead ends are publication errors.
- **FR-224 — Reference validation:** Publication validates active element connections, conditions, default paths, Forms, Process Fields, calculations, Form Validation Rules, Task assignments, Authorized Starters, and other dependencies.
- **FR-225 — Automatic-cycle validation:** Publication detects and blocks condition-only cycles and any automatic route that cannot terminate at a Task or End.
- **FR-226 — Actionable validation display:** Validation errors appear in a clear list and highlight the affected canvas element, field, connection, or dependency.
- **FR-227 — Invalid draft handling:** An invalid draft can be saved for continued design work, but cannot be published.
- **FR-228 — Immutable publication:** Successful publication creates the next sequential immutable Workflow version. Editing a published Workflow occurs through a new or existing shared draft.

### 5.4 Shared drafts and concurrent editing

- **FR-229 — One shared draft:** A Workflow has at most one shared editable draft within its Organization. Private per-Designer branches and draft merging are outside the MVP.
- **FR-230 — Draft attribution:** The shared draft records who created it, who last modified it, when it was last saved, and the published version from which it originated.
- **FR-231 — Explicit version access:** The Designer experience distinguishes Edit Draft from View Published. Edit Draft opens the existing shared draft by default; View Published opens the immutable production version.
- **FR-232 — Draft status visibility:** Workflow listings show the latest published version and whether a shared draft exists, including validation-error status and last-editor information.
- **FR-233 — Exclusive edit lease:** Only one authorized Designer can actively edit a Workflow draft at a time. The active editor holds an edit lease scoped to that draft.
- **FR-234 — Concurrent read-only access:** Other authorized Designers can inspect the draft in read-only mode and can see who currently holds the edit lease.
- **FR-235 — Draft autosave:** Moviqo automatically saves valid configuration edits to the shared draft and displays save state so an editor knows whether changes are persisted.
- **FR-236 — Stale lease recovery:** An edit lease automatically expires after ten minutes without editor activity or renewal, allowing another authorized Designer to continue.
- **FR-237 — Administrative takeover:** An Owner or Administrator can force takeover of an active edit lease after confirmation. A Designer can take over an expired lease.
- **FR-238 — Stale-write protection:** Moviqo must reject an outdated save that would overwrite a newer draft revision and require the editor to reload the current draft.
- **FR-239 — Draft collaboration audit:** Lease acquisition, release, expiration, takeover, draft discard, save attribution, and publication are recorded in configuration audit.
- **FR-240 — Production isolation:** Draft edits, validation errors, edit leases, and takeovers do not alter the latest published version or interrupt running production instances.

### 5.5 Inactive Tasks

- **FR-241 — Task removal lifecycle:** A never-published Task can be physically deleted. A published but never-executed Task can disappear from the current graph while remaining in immutable historical versions. An executed Task removed from the current graph is retained under Inactive Elements.
- **FR-242 — Open Task protection:** A draft that deactivates a Task can be saved, but cannot be published while any instance has an open Task occurrence at that Task definition.
- **FR-243 — Deactivation impact confirmation:** Before deactivation, Moviqo shows every active incoming and outgoing Transition and Conditional Routing path that will be affected and requires Designer confirmation.
- **FR-244 — Automatic connection cleanup:** After confirmation, Moviqo removes the deactivated Task's active Transitions and Conditional Routing destination paths from the current draft.
- **FR-245 — No automatic rewiring:** Moviqo does not infer or create replacement connections when a Task is deactivated. The Designer must repair the active graph before publication.
- **FR-246 — Historical preservation:** Deactivation does not delete historical Task occurrences, Form submissions, Process Data, attachments, routing records, or audit history.
- **FR-247 — Inactive Task inspection:** Inactive Elements exposes the Task's stable identity, prior active versions, execution history summary, deactivation attribution, and preserved dependencies.
- **FR-248 — Task reactivation:** Reactivating an inactive Task preserves its stable identity, returns it to the active canvas for Designer placement, and requires new valid connections. Previous connections are not restored automatically.

### 5.6 Versions, active instances, and repeated Task occurrences

- **FR-249 — Active-instance continuation:** An active instance remains at its current open Task occurrence and uses the newest published Workflow definition from that execution point when it continues.
- **FR-250 — Compatible current-Form update:** When an open Task Form loads or refreshes, it uses compatible changes from the newest published definition while preserving existing instance values.
- **FR-251 — Immutable completed history:** Previously completed Task occurrences and previously selected paths are never reopened, replayed, or rewritten merely because the Workflow definition changed.
- **FR-252 — Repeated Task occurrence:** If a valid loop reaches the same Task definition again, Moviqo creates a new Task occurrence rather than reopening the completed occurrence.
- **FR-253 — Task occurrence identity:** Every Task occurrence has a unique execution identifier, references the stable Task definition and Workflow version used, and records an occurrence sequence within the instance.
- **FR-254 — Repeated data editing:** A later Task occurrence can update the same Process Fields where authorized, while transactional audit preserves the previous values and identifies the occurrence that changed them.
- **FR-255 — Version restoration:** Restoring an older published version creates a new shared draft based on that version and preserves every existing version and historical instance record.

### 5.7 Designer-defined Instance States

- **FR-256 — Instance State catalog:** A Designer can define Workflow-specific Instance States with stable identifiers and user-authored labels. Moviqo does not impose fixed approval or rejection states.
- **FR-257 — Initial Instance State:** When Instance States are configured, Start specifies the initial state assigned to a newly created instance.
- **FR-258 — Transition state property:** Every Transition has an optional Set Instance State property. Traversing the Transition applies the configured state; an empty property preserves the current state.
- **FR-259 — Current state visibility:** Authorized dashboards and instance views display the instance's current Designer-defined state.
- **FR-260 — State use and preservation:** A used or referenced Instance State cannot be physically deleted. It can be deactivated while remaining resolvable in historical data and audit.
- **FR-261 — State-change audit:** Every state change records the previous state, new state, Transition, Workflow version, Task occurrence where applicable, actor or system event, and timestamp.

### 5.8 Task occurrence transactional audit

- **FR-262 — Task activation audit:** Every Task occurrence records its activation timestamp, stable Task definition, occurrence identifier and sequence, Workflow version, and Instance State at activation.
- **FR-263 — Assignment audit:** Transactional audit records the initial assigned Member or Team and every claim, release where supported, assignment failure, and administrative reassignment.
- **FR-264 — Task completion audit:** Transactional audit records the completion timestamp, completing Member, Process Data changes, selected Transition, condition evaluations, state before and after routing, and next activated element.
- **FR-265 — Loop chronology:** Instance history presents repeated Task occurrences as separate chronological events so users can distinguish each pass through a loop.

### 5.9 Draft status synchronization

- **FR-266 — Open-view status monitoring:** While a Workflow draft is open, Moviqo periodically checks lightweight draft metadata, including draft revision, last save, current edit lease, and whether the draft remains active, was published, or was discarded.
- **FR-267 — Polling interval:** MVP clients refresh open-draft status approximately every thirty seconds. Real-time collaborative transport is not required.
- **FR-268 — New revision notification:** When a read-only viewer detects a newer saved draft revision, Moviqo shows that a newer revision is available and offers Reload. It does not silently replace or rearrange the canvas being inspected.
- **FR-269 — Published draft transition:** When an open draft is published by another authorized user, a read-only view reloads or redirects to the resulting immutable published version with a clear explanation.
- **FR-270 — Discarded draft transition:** When an open draft is discarded, Moviqo closes the invalid draft view and redirects the viewer to the latest published version or Workflow listing with a clear explanation.
- **FR-271 — Lease-state synchronization:** An open viewer is notified when editing becomes available. An editor who loses the lease through administrative takeover becomes read-only on the next heartbeat or status check, and stale saves remain rejected.
- **FR-272 — No offline push requirement:** A user without the Workflow or Moviqo open receives current draft status on the next dashboard or Workflow load; background push notification is not required.
- **FR-273 — Deferred live collaboration:** Simultaneous multi-user canvas editing, live cursor presence, operation-by-operation canvas streaming, and automatic draft merging are outside the MVP.

## 6. Runtime Lifecycle and Operations

### 6.1 System lifecycle statuses

System lifecycle statuses control Moviqo behavior and remain separate from Designer-defined Instance States, which communicate business meaning.

- **FR-274 — Active instance:** A newly started instance has system status Active and remains Active while it can continue through its published Workflow.
- **FR-275 — Completed instance:** An instance becomes Completed only when execution successfully reaches End. A Completed instance is closed and cannot create additional Task occurrences.
- **FR-276 — Cancelled instance:** An Active instance becomes Cancelled when an authorized Owner or Administrator cancels it. A Cancelled instance cannot continue routing.
- **FR-277 — Needs Attention instance:** An instance displays Needs Attention while one or more current Task occurrences have `Needs Reassignment` or another defined blocking operational condition. Resolving every blocking condition returns the instance to Active.
- **FR-278 — Available Task:** A Task occurrence assigned to a Team has status Available while it is waiting for an eligible active Team Member to claim it.
- **FR-279 — Assigned Task:** A Task occurrence assigned directly to a Member, or successfully claimed by a Team Member, has status Assigned until work is saved or completion succeeds.
- **FR-280 — In Progress Task:** Saving Task work changes an Assigned Task occurrence to In Progress while preserving its current assignee.
- **FR-281 — Needs Reassignment Task:** A Task occurrence with an unresolved or invalid assignment has status Needs Reassignment and cannot be edited or completed until manually reassigned.
- **FR-282 — Completed Task:** A Task occurrence becomes Completed after successful completion validation and persistence. It is immutable and can be followed only by newly activated downstream occurrences.
- **FR-283 — Cancelled Task:** Cancelling the parent instance changes every open Task occurrence to Cancelled and prevents further editing, completion, or routing.

### 6.2 Instance cancellation

- **FR-284 — Cancellation authority:** Owners and Administrators can cancel an Active or Needs Attention instance after confirmation and entry of a required cancellation reason.
- **FR-285 — Cancellation effects:** Cancellation atomically records the instance as Cancelled, cancels every open Task occurrence, prevents further routing, and preserves Process Data, attachments, and history.
- **FR-286 — Cancellation audit:** Cancellation records the cancelling user, reason, timestamp, prior system status, prior Designer-defined Instance State, affected open Task occurrences, and Workflow version.
- **FR-287 — No reopen in MVP:** Completed and Cancelled instances cannot be reopened or returned to Active during the MVP.

### 6.3 My Work dashboard

The user-facing application uses Process for a running Workflow instance. The technical model and PRD retain Workflow Instance where precision is required.

- **FR-288 — My Work navigation:** The authenticated user workspace provides My Tasks, My Processes, and Start a Process within one My Work area.
- **FR-289 — Default landing view:** My Tasks is the default My Work view after authentication so Members are immediately focused on actionable work.
- **FR-290 — My Tasks contents:** My Tasks contains Task occurrences assigned directly to the Member, claimed by the Member, or Available to an active Team to which the Member belongs.
- **FR-291 — My Tasks statuses:** The My Tasks inbox displays Available, Assigned, and In Progress Task occurrences and provides the applicable Claim Task or Open Task action.
- **FR-292 — No completed Tasks in inbox:** Completed and Cancelled Task occurrences do not appear in My Tasks and no completed-Task history filter is included in that inbox during the MVP.
- **FR-293 — My Processes contents:** My Processes contains one row per Process the Member started, currently participates in, or previously participated in through an authorized Task occurrence.
- **FR-294 — My Processes defaults:** My Processes shows Active and Needs Attention Processes by default and provides a Closed filter for Completed and Cancelled Processes.
- **FR-295 — My Processes purpose:** My Processes is a secondary tracking view, not an action inbox. It shows the Process identifier, Workflow name, system status, Designer-defined Instance State, current process position, start date, and last activity within the Member's authorized visibility.
- **FR-296 — Process detail access:** Opening a My Processes row displays the limited authorized overview and timeline, including the Member's own contributions, without granting access to another Member's Task Form or private Task data.
- **FR-297 — Team eligibility visibility:** A Process is visible while a Member is eligible to claim its current Team Task. If another Member claims that Task, the Process ceases to be visible unless the viewing Member started or previously participated in it.
- **FR-298 — Start a Process:** Start a Process lists only published Workflows the Member is authorized to start; Owners and Administrators can start any published Workflow according to FR-020.
- **FR-299 — Administrative runtime views:** Owners and Administrators receive Needs Attention and All Processes operational views with search and filters for Workflow, system status, Instance State, assignee, initiator, and date.
- **FR-300 — Designer data boundary:** Designer access does not add production rows to My Processes or administrative runtime views unless the user participates normally or also has Administrator or Owner access.
- **FR-301 — Deferred dashboard customization:** Custom dashboards, user-configurable widgets, and advanced analytics are outside the MVP.

### 6.4 Dashboard columns, search, filters, and sorting

- **FR-302 — My Tasks columns:** My Tasks displays Task name; Workflow name and Process number; direct or Team assignment; Designer-defined Instance State; Task system status; activation date and time; and the applicable Claim Task or Open Task action.
- **FR-303 — My Tasks search:** A Member can search My Tasks by Task name, Workflow name, and Process number.
- **FR-304 — My Tasks filters:** My Tasks can be filtered by Available, Assigned, or In Progress status; direct or Team assignment; Team; Workflow; Instance State; and activation-date range.
- **FR-305 — My Tasks sorting:** My Tasks can be sorted by activation date, Task name, Workflow, Instance State, and Task status. The default sort presents the oldest actionable Tasks first.
- **FR-306 — My Processes columns:** My Processes displays Process number; Workflow name; the Member's involvement as Initiator, Current Participant, or Previous Participant; current process step; Designer-defined Instance State; system status; start date; last activity; and View Process action.
- **FR-307 — My Processes search and filters:** My Processes supports search by Workflow name and Process number and filters for Active, Needs Attention, Completed, or Cancelled; Started by Me or Participated In; Workflow; Instance State; start-date range; and last-activity range.
- **FR-308 — My Processes sorting:** My Processes can be sorted by Process number, start date, last activity, Workflow, system status, and Instance State. The default sort presents the most recently updated Processes first.
- **FR-309 — Needs Attention columns:** Needs Attention displays Workflow and Process number; blocked current Task; operational problem; expected assignment rule; Instance State; time waiting; and Reassign or View action.
- **FR-310 — All Processes columns:** All Processes displays Process number; Workflow; system status; Instance State; current step; current assigned Member or Team; initiator; start date; last activity; and authorized operational actions.
- **FR-311 — Administrative filters:** Needs Attention and All Processes support applicable filters for Workflow, system status, Instance State, current assigned Member or Team, initiator, assignment-failure reason, Workflow version where meaningful, cancellation status, and relevant date ranges.
- **FR-312 — Start Process catalog:** Start a Process uses a searchable catalog of authorized Workflow cards showing Workflow name, short description, and Start Process action.
- **FR-313 — Table sorting interaction:** A sortable column header exposes its current direction and allows ascending or descending sorting. Non-data action columns are not sortable.
- **FR-314 — Active filter display:** Applied filters are visible as removable filter indicators, and Clear All restores the view's approved defaults.
- **FR-315 — Authorized server querying:** Search, filtering, sorting, and pagination are applied by the server within the requesting user's Organization and authorization scope and cannot reveal counts or records outside that scope.
- **FR-316 — Pagination:** Dashboard tables paginate large result sets while preserving the active search, filters, and sort order.
- **FR-317 — Responsive dashboard presentation:** Desktop and sufficiently wide laptop views use the defined tables. On narrow screens, rows become compact cards that prioritize identifier, status, Task or current step, and primary action while allowing authorized details to expand.
- **FR-318 — Deferred table personalization:** Saved filter views, user-configurable columns, dashboard export, and multi-column custom sorting are outside the MVP.

## 7. Notifications

### 7.1 Task assignment email

- **FR-319 — Task notification property:** Every Task definition provides an `Email users when this Task becomes assigned or available` configuration property.
- **FR-320 — Assignment email default:** The Task assignment-email property is disabled by default. A Designer must explicitly enable it for each Task that should send assignment email.
- **FR-321 — Individual assignment recipient:** When enabled and a Task becomes assigned to an individual Member through configured Member, Workflow Initiator, User Reference, or administrative reassignment, Moviqo emails the newly assigned Member.
- **FR-322 — Team availability recipients:** When enabled and a Task becomes Available to a Team, Moviqo emails the Team's active eligible Members.
- **FR-323 — Reassignment behavior:** The same Task property controls email when an open Task is administratively reassigned to a new Member or Team.
- **FR-324 — Disabled behavior:** When the property is disabled, no assignment or reassignment email is sent. The Task still appears normally in My Tasks and all assignment and audit behavior remains unchanged.
- **FR-325 — No retroactive email:** Changing the Task property affects future assignment events only and neither sends nor withdraws email for an assignment event that already occurred.
- **FR-326 — Assignment source audit:** Assignment and notification history identify whether the assignment came from configured Member, Workflow Initiator, User Reference, Team claim or availability, or administrative reassignment.

### 7.2 Optional Transition email

- **FR-327 — Transition notification property:** Every Transition can optionally enable `Send notification when this path is taken`; the property is disabled by default.
- **FR-328 — Transition notification recipients:** A Designer can select the Process initiator, specific active Members, specific active Teams, a Member from a User Reference field, and/or the Member completing the current Task.
- **FR-329 — Transition notification content:** A Transition email can contain a safe default subject and message, Workflow name, Process number, resulting Instance State where applicable, a secure authorized link, and optional short Designer-authored text.
- **FR-330 — No business data in email:** Process Field values and attachments are not inserted into email during the MVP.
- **FR-331 — Duplicate consolidation:** If the same recipient qualifies for both enabled Task assignment email and Transition email during one routing event, Moviqo sends one consolidated email and records both triggers.

### 7.3 Delivery behavior

- **FR-332 — Email localization:** System-generated email text uses the recipient's selected interface language with Spanish fallback. Designer-authored text remains in the language entered by the Designer, and business dates, numbers, times, and currencies use the Organization regional settings.
- **FR-333 — Delivery tracking:** Notification history records the related event, recipient, channel, pending, sent, failed, or configured-suppression status, attempt count, and relevant timestamps.
- **FR-334 — Idempotent retry:** Moviqo retries temporary email-delivery failures without sending duplicates and exposes permanent failures to Owners and Administrators.
- **FR-335 — Deferred channels:** WhatsApp, SMS, push notification, and a configurable in-application notification center are outside the MVP.

### 7.4 Operational-problem email

- **FR-336 — Operational email setting:** An Organization provides an `Email administrators about operational problems` setting that is disabled by default.
- **FR-337 — Dashboard alert remains automatic:** A Task entering `Needs Reassignment` always appears in the Owners' and Administrators' Needs Attention view regardless of the Organization email setting.
- **FR-338 — Enabled operational email:** When the Organization setting is enabled, Moviqo emails active Owners and Administrators when a Task enters `Needs Reassignment`, including the Workflow, Process number, Task, safe failure reason, and secure operational link.
- **FR-339 — Team email opt-in confirmation:** The disabled-by-default Task notification property applies to both individual assignment and Team availability. Team Members receive availability email only when the Task property is enabled.

## 8. Audit and Process Timeline

### 8.1 Audit domains and access

- **FR-340 — Configuration Audit:** Moviqo maintains Organization-scoped Configuration Audit for changes to users, Teams, memberships, Workflow definitions, Forms, Process Fields, reusable lists, visual rules, calculations, Instance States, Transitions, assignments, Authorized Starters, drafts, edit leases, versions, and permissions.
- **FR-341 — Transactional Audit:** Moviqo maintains Organization-scoped Transactional Audit for Process creation; Task occurrences; assignments, claims, and reassignments; Process Data and file actions; calculations; condition evaluations and selected routes; Instance State changes; Task completion; reaching End; and cancellation.
- **FR-342 — Administrative audit access:** Owners and Administrators can inspect Configuration Audit and Transactional Audit across their Organization.
- **FR-343 — Designer audit access:** Designers can inspect Configuration Audit for Workflow definitions in their Organization. Designer access alone does not grant full Transactional Audit or production-data access.
- **FR-344 — Member timeline instead of audit:** Members receive the simplified authorized Process timeline defined in Section 8.2 rather than access to the complete Transactional Audit.
- **FR-345 — Tenant-isolated audit:** Audit search, viewing, counts, filtering, and export are restricted to the requesting user's Organization and role authorization.

### 8.2 My Processes detail and timeline

- **FR-346 — Process Detail header:** Opening a My Processes row displays Workflow name, Process number, system status, Designer-defined Instance State, current step, start date, and last activity.
- **FR-347 — Simplified timeline:** An authorized Member timeline can show Process start; Task activation and completion summaries; the Member's own assignments and submissions; Instance State changes; repeated loop occurrences; current waiting step; and Process completion or cancellation.
- **FR-348 — Own submission details:** A Member can expand the Member's own completed Task occurrence to view the values submitted through that occurrence, submission time, occurrence number, and attachments that remain available and authorized.
- **FR-349 — Other-user summary boundary:** For another Member's Task occurrence, a regular Member can see only an authorized progress summary such as Task name and completion, and cannot see that user's private Form values, attachments, detailed value changes, assignment administration, condition internals, or notification delivery.
- **FR-350 — Loop timeline:** Repeated visits to one Task definition appear as separate chronological occurrences so the user can distinguish each pass through the loop.
- **FR-351 — Full-audit navigation:** Owners and Administrators can navigate from Process Detail to the complete Transactional Audit for that Process.

### 8.3 Audit integrity and usability

- **FR-352 — Immutable audit entries:** Audit records cannot be edited or deleted through Moviqo and remain attributable to their original event.
- **FR-353 — Audit search and filters:** Authorized audit views support search and filtering by date, actor, Workflow, Process number, Task, event type, and Workflow version where applicable.
- **FR-354 — Value-change evidence:** Process Data change events preserve appropriate previous and new values, the Task occurrence, actor, timestamp, and Workflow version that produced the change.
- **FR-355 — File audit boundary:** File audit retains identifiers and metadata required for evidence but does not duplicate binary file contents in the audit record.
- **FR-356 — Time representation:** Audit timestamps are stored consistently and displayed using the Organization's configured timezone and regional format.
- **FR-357 — Secret exclusion:** Authentication credentials, reset tokens, application secrets, and other prohibited secret values must never be written into business audit records.
- **FR-358 — Audit export:** Owners and Administrators can export audit results within their authorization scope while active filters remain applicable.
- **FR-359 — Technical log separation:** Infrastructure, diagnostic, and application error logs remain separate from Configuration Audit and Transactional Audit.

## 9. Data Retention, Export, and Deletion

- **FR-360 — Process retention:** Active, Needs Attention, Completed, and Cancelled Process records cannot be individually deleted through the MVP application and remain available according to authorization and Organization retention.
- **FR-361 — Active Organization retention:** While an Organization remains active, Moviqo retains its Workflow definitions, Process Data, available attachments, and audit history except for explicitly authorized removals defined by this PRD.
- **FR-362 — No inactivity deletion:** Moviqo does not automatically delete an Organization or its business data solely because users have been inactive.
- **FR-363 — Explicit file deletion:** Explicitly removing an attachment clears its current Process Data reference and deletes its binary object according to FR-114 while retaining minimal immutable audit metadata.
- **FR-364 — Complete Organization export:** An Owner can request an Organization export containing Workflow definitions, Process Data, audit records, and authorized attachments in documented portable formats.
- **FR-365 — Secure export delivery:** Complete export generation occurs as a protected background operation and provides a temporary private download available only to an authorized Owner.
- **FR-366 — Closure authority:** Only an Owner can request Organization closure, after explicit confirmation. Members, Designers, and Administrators cannot delete the Organization.
- **FR-367 — Pre-closure export:** The closure experience offers the Owner an Organization export before destructive deletion proceeds.
- **FR-368 — Reversible closure window:** Organization closure enters a thirty-day recovery window during which an authorized Owner can reverse the closure.
- **FR-369 — Final active-data deletion:** After the recovery window, Moviqo removes active Organization data and binary objects from production storage according to a controlled deletion process.
- **FR-370 — Backup expiration after closure:** Copies remaining in disaster-recovery backups expire through the approved backup-retention schedule and are not exposed through normal application access.
- **FR-371 — Beta data responsibility:** Beta terms state that the customer and its Designers are responsible for the lawfulness and appropriateness of Process Data they collect, while Moviqo remains responsible for agreed platform safeguards.
- **FR-372 — Prohibited beta data:** The public beta prohibits passwords and authentication secrets, payment-card data, government-issued identifiers, health information, and other highly sensitive or regulated data, and the Form Designer presents a clear reminder of this restriction.
- **FR-373 — Evolution through revision:** These MVP retention and export rules can be changed only through a documented future product revision and must not silently alter existing customer commitments.

## 10. Security and Trust

### 10.1 Authentication and sessions

- **FR-374 — Strong password length:** Because the MVP uses password-only authentication, a new or changed password must contain at least 15 characters and may contain up to 128 characters.
- **FR-375 — Passphrase-friendly input:** Passwords may contain spaces and supported Unicode characters. Moviqo must not require arbitrary combinations of uppercase letters, lowercase letters, numbers, or symbols.
- **FR-376 — Weak-password blocking:** Moviqo rejects passwords found in an approved blocklist of common, expected, or known-compromised values and provides a clear, non-sensitive reason to choose another password.
- **FR-377 — Password usability:** Registration, password change, and password reset support password-manager generation and autofill, pasted passwords, and an optional show-password control.
- **FR-378 — Password-change policy:** Moviqo does not require periodic password changes unless there is evidence of compromise or an authorized user requests a reset.
- **FR-379 — Credential protection:** Passwords are stored only using an approved salted password-hashing mechanism and are never stored, returned, audited, or logged in readable form.
- **FR-380 — Authentication throttling:** Moviqo rate-limits repeated unsuccessful authentication and password-recovery attempts without revealing whether an account exists.
- **FR-381 — Secure password recovery:** Password-recovery links are time-limited and single-use. A successful password reset invalidates the user's existing authenticated sessions.
- **FR-382 — Server-side deactivation:** Completing user deactivation immediately marks the user inactive and revokes all of the user's active sessions on the server. No new protected request made with one of those sessions may succeed after the deactivation transaction commits.
- **FR-383 — Authorization on protected requests:** Every protected server request validates the authenticated session and confirms that the user and relevant Organization Membership remain active before returning protected data or performing an operation.
- **FR-384 — Client behavior after revocation:** When an open client next contacts the server after session revocation, it receives an authentication failure, clears locally held session credentials, and returns the user to authentication without displaying protected data from the failed request.
- **FR-385 — No real-time dependency:** Session revocation and deactivation enforcement do not require WebSockets or another persistent real-time channel. An optional lightweight session-status poll may sign an idle open page out sooner, but security enforcement remains server-side on every protected request.
- **FR-386 — Session termination:** Users can sign out, and expired, revoked, or signed-out sessions cannot be reused.

### 10.2 Safe error handling and diagnostic logging

- **FR-387 — Generic authentication errors:** Authentication failures use generic messages such as `Email or password is incorrect`, and password-recovery responses remain the same whether or not the submitted account exists.
- **FR-388 — No resource-existence disclosure:** Authorization and not-found responses must not reveal the existence, identifier, owner, or contents of resources outside the requesting user's Organization and authorization scope.
- **FR-389 — Safe unexpected errors:** Unexpected application failures return a safe user-facing message and a non-sensitive correlation identifier. They never display stack traces, database statements, internal file paths, infrastructure details, environment values, secrets, session or token contents, or unauthorized Process Data.
- **FR-390 — Safe validation errors:** Validation errors may identify only fields and constraints the requesting user is authorized to view and must not unnecessarily repeat confidential values.
- **FR-391 — Protected diagnostics:** Detailed failure diagnostics are available only in access-controlled technical logs and remain separate from Configuration Audit and Transactional Audit.
- **FR-392 — Log sanitization:** Technical logs, audit records, analytics, and monitoring must exclude or redact passwords, reset tokens, session tokens, cookies, authorization headers, private file-access links, application secrets, and other security credentials.
- **FR-393 — Error consistency:** Equivalent security failures use consistent status behavior and messages so that response wording, timing, or metadata does not expose cross-tenant or account-enumeration information.

### 10.3 Tenant isolation and server authorization

- **FR-394 — Organization ownership:** Every tenant-owned business record, configuration record, Process, Task occurrence, Process Data value, file, audit entry, notification, and export has one immutable owning Organization. Platform authentication identities may be global, but Organization Memberships and tenant-owned data remain Organization-scoped.
- **FR-395 — Trusted Organization context:** Every protected server operation derives and validates its Organization context from the authenticated user's active Organization Membership. An Organization identifier supplied by a client is never sufficient authorization by itself.
- **FR-396 — Server-enforced permissions:** The server enforces applicable role, Workflow, Authorized Starter, Task assignment, Process Data, file, audit, notification, and export permissions for every protected read and mutation. Interface visibility alone is not an authorization control.
- **FR-397 — Scoped queries and operations:** Database queries, storage operations, background jobs, notification delivery, export generation, search, filtering, sorting, pagination, analytics, and audit processing must retain and validate their Organization context.
- **FR-398 — Deny by default:** A request or background operation with missing, inactive, ambiguous, or mismatched Organization context is denied without returning or changing tenant-owned data.
- **FR-399 — Identifier tampering protection:** Guessing, substituting, or modifying a record or file identifier cannot reveal whether another Organization's resource exists and cannot expose its data, metadata, counts, or processing status.
- **FR-400 — Organization-limited administration:** Owner and Administrator authority is limited to the Organization in which the corresponding access level is active. The MVP provides no customer-facing cross-Organization administrative role.
- **FR-401 — Automated isolation coverage:** Automated cross-Organization tests cover users and Memberships, Teams, reusable lists, Workflows and versions, shared drafts, Processes, Task occurrences, Process Data, files, dashboards, audits, notifications, background operations, and exports.
- **FR-402 — Isolation release gate:** A failed or incomplete tenant-isolation test suite blocks public-beta release and production deployment.

### 10.4 Account verification and deferred authentication capabilities

- **FR-403 — MVP authentication model:** The MVP authenticates a user with a verified email address and password, subject to the password, throttling, recovery, and session requirements in Section 10.1.
- **FR-404 — Email verification requirement:** A new user must verify control of the account email address before authenticating into Moviqo or accessing protected Organization data.
- **FR-405 — Verification-link protection:** An email-verification link is time-limited, single-use, and invalid after successful verification or replacement by a newer verification link.
- **FR-406 — Initial Owner verification:** A self-registering initial Owner must verify the account email before the new Organization becomes operational or accepts business data.
- **FR-407 — Invited-user verification:** Accepting a valid, time-limited, single-use Organization invitation verifies the invited email address as part of account activation. The invitation cannot activate a different email address.
- **FR-408 — Email-address change:** Changing an account email requires verification of the new address before it becomes the authentication address.
- **FR-409 — Verification abuse protection:** Verification and invitation resend operations are rate-limited and use responses that do not disclose whether an account or invitation exists.
- **FR-410 — MFA deferred:** Multi-factor authentication is outside the MVP. No Organization can require or configure an additional authentication factor during the MVP.
- **FR-411 — SSO and passkeys deferred:** Enterprise single sign-on, identity-provider federation, social sign-in, passwordless authentication, and passkeys are outside the MVP.

### 10.5 Private files and Organization exports

- **FR-412 — Private storage:** File attachments and generated Organization exports are stored in private storage containers or buckets and are never made publicly listable or readable.
- **FR-413 — File-request authorization:** Every attachment preview or download request validates the active session, owning Organization, relevant Process and Process Field, applicable Task access, and administrative authority on the server before returning file content or temporary access.
- **FR-414 — Non-authoritative links:** A stable Moviqo application link never grants file or export access by itself. Knowing, copying, guessing, or modifying a link is insufficient without current authorization.
- **FR-415 — Temporary storage access:** Any temporary storage credential is read-only, scoped to one authorized file and operation, and expires no later than fifteen minutes after issuance.
- **FR-416 — Removal revocation:** After an authorized attachment removal is successfully persisted, Moviqo immediately denies further application access to the file and queues binary deletion according to FR-114.
- **FR-417 — Permission-change enforcement:** If a user loses the Organization, Process, Task, field, or administrative permission required for a file, previously copied Moviqo application links no longer provide access.
- **FR-418 — Organization-scoped export generation:** Organization export generation executes as a protected background operation within the requesting Owner's validated Organization context and cannot include data from another Organization.
- **FR-419 — Export availability window:** A successfully generated Organization export remains available for no more than twenty-four hours and is then automatically removed from active export storage.
- **FR-420 — Owner-only export access:** Only an authenticated, active Owner of the export's Organization can obtain or refresh its temporary download access.
- **FR-421 — Export audit:** Organization export request, generation start, success, failure, download, expiration, and deletion are recorded with Organization, requesting Owner, timestamps, export identifier, and outcome without duplicating exported Process Data in the audit event.
- **FR-422 — Export-ready notification:** An export-ready email contains no direct public storage link or exported business data. It directs the Owner to authenticate in Moviqo before obtaining temporary download access.
- **FR-423 — Downloaded-copy boundary:** Moviqo cannot revoke or delete a copy that an authorized user has already downloaded to a device outside Moviqo's control; the export and download experience must make this responsibility clear.

### 10.6 Data protection and environment security

- **FR-424 — Encrypted transport:** Browser, API, authentication, file, export, and administrative traffic uses HTTPS with provider-supported current TLS. Protected endpoints do not serve protected content over cleartext connections.
- **FR-425 — Provider encryption at rest:** Production databases, private object storage, generated exports, and backup copies use encryption at rest supplied and maintained by the selected infrastructure providers.
- **FR-426 — No custom cryptography:** The MVP does not design or implement custom encryption algorithms, password hashing, token signing, or key-management mechanisms when established platform or framework capabilities are available.
- **FR-427 — Secret isolation:** Password-hashing configuration, database credentials, service keys, API tokens, signing secrets, and other privileged configuration remain outside source code, browser bundles, business audit, analytics, and application logs.
- **FR-428 — Server-only privileged credentials:** Privileged database, authentication, email, and storage credentials are available only to trusted server-side components, use the least privileges practical for their function, and are never sent to the browser.
- **FR-429 — Environment separation:** Development and production use separate configuration, credentials, databases, and storage. A development identity or credential cannot access production resources.
- **FR-430 — No production data in non-production:** Real customer Process Data, attachments, and complete production exports are not copied into development or automated-test environments. Test environments use synthetic or explicitly sanitized data.
- **FR-431 — Process Data logging boundary:** Diagnostic logs, monitoring, analytics, and error reports exclude Process Field values, attachment contents, export contents, passwords, tokens, and private download credentials by default.
- **FR-432 — Safe operational telemetry:** Technical event types, safe internal identifiers, durations, outcomes, counts, and correlation identifiers may be recorded when they do not disclose Process Data or cross-Organization information.
- **FR-433 — Security configuration validation:** Production startup and deployment validate required security configuration and fail safely when critical secrets, private-storage settings, Organization-scope protections, or secure transport protections are missing or invalid.

### 10.7 Security baselines and threat modeling

- **FR-434 — OWASP Top 10 baseline:** MVP design, implementation review, and security testing consider every OWASP Top 10:2025 category: broken access control, security misconfiguration, software supply-chain failures, cryptographic failures, injection, insecure design, authentication failures, software or data integrity failures, security logging and alerting failures, and mishandling of exceptional conditions.
- **FR-435 — OWASP verification catalog:** OWASP ASVS 5.0.0 is used as the technical verification catalog. Before public beta, the team identifies and verifies the ASVS Level 1 requirements applicable to Moviqo and documents why any Level 1 requirement is not applicable.
- **FR-436 — MITRE ATT&CK SaaS scenarios:** Threat modeling uses the MITRE ATT&CK Enterprise SaaS matrix as a source of realistic attack scenarios, including account and credential compromise, web-session cookie or application-token theft, permission abuse, cloud-data collection, exfiltration, service-account misuse, account access removal, and resource hijacking where applicable.
- **FR-437 — MVP threat-model scope:** Before public beta, a documented threat model covers trust boundaries and sensitive flows for registration and authentication, Organization isolation, Workflow design and publication, Process execution, Task assignment, Process Data, files, exports, notifications, audit, backups, and background operations.
- **FR-438 — Security traceability:** Applicable OWASP and MITRE risks are mapped to the Moviqo requirement or architecture control that mitigates them, the test or review that verifies the control, and the current result or accepted-risk decision.
- **FR-439 — Threat-model maintenance:** The threat model and security mapping are reviewed before public beta and updated when architecture, authentication, tenant boundaries, storage, external integrations, or sensitive data flows materially change.
- **FR-440 — Framework claim boundary:** References to OWASP and MITRE guide risk analysis and verification but do not represent certification, endorsement, or complete protection against every listed attack.
- **FR-441 — Explicit deferred-risk handling:** A relevant control intentionally excluded from the MVP, including MFA, must be recorded as an accepted product risk with the approved compensating controls and future-review trigger; framework review does not silently expand MVP scope.

### 10.8 Public-beta security release gates

- **FR-442 — Release-gate scope:** The security gates in this section must pass before onboarding the first public-beta customer and before each production release whose changes can affect the corresponding control.
- **FR-443 — Isolation gate:** The complete automated tenant-isolation suite defined by FR-401 and FR-402 passes without an unresolved failure.
- **FR-444 — Identity and authorization gate:** Automated tests for registration, email verification, authentication, password recovery, throttling, session expiration and revocation, deactivation, role authorization, Workflow authorization, Task access, and Process Data access pass.
- **FR-445 — File, export, and audit gate:** Tests for attachment and export authorization, link expiration, removal revocation, Organization scoping, audit attribution, audit immutability through application interfaces, and audit export authorization pass.
- **FR-446 — Baseline and threat-review gate:** Applicable OWASP ASVS 5.0.0 Level 1 checks are completed, the OWASP Top 10 and MITRE ATT&CK mapping is current, and the threat model contains no unresolved release-blocking risk.
- **FR-447 — Dependency and secret scanning:** The release candidate is checked for known dependency vulnerabilities and accidentally committed or packaged secrets using automated scanning available to the delivery pipeline.
- **FR-448 — Finding severity rule:** An unresolved Critical or High security finding blocks release. An unresolved Medium finding also blocks release when it can affect authentication, session security, tenant isolation, authorization, Process Data or file confidentiality, data integrity, or production availability.
- **FR-449 — Production-configuration gate:** Production security-configuration validation defined by FR-433 passes before deployment can serve customer traffic.
- **FR-450 — Gate evidence:** The tested release identifier, gate results, scan results, approved not-applicable decisions, accepted non-blocking risks, reviewer, and completion time are retained as release evidence without including secrets or customer Process Data.
- **FR-451 — Failed-gate behavior:** A failed, incomplete, or unverifiable release-blocking gate prevents public-beta deployment or customer onboarding until remediated and successfully rechecked.

### 10.9 MVP backup and recovery baseline

- **FR-452 — Daily backup scope:** Moviqo creates an automated backup of the production database and private attachment storage at least once every twenty-four hours.
- **FR-453 — Encrypted separate destination:** Backup copies are encrypted and stored outside the primary production project or equivalent provider failure boundary, using credentials separated from normal application access.
- **FR-454 — Backup retention:** The MVP retains at least seven recoverable daily backups and four recoverable weekly backups, subject to the Organization-closure expiration rule in FR-370.
- **FR-455 — Recovery point objective:** The public-beta recovery point objective is twenty-four hours; after a covered production-data loss, Moviqo may lose no more than the data created or changed since the most recent successful daily backup.
- **FR-456 — Recovery time objective:** The public-beta target is to restore covered production database and attachment service within twenty-four hours after a major recoverable failure is confirmed.
- **FR-457 — Restoration verification:** A complete restoration test succeeds before onboarding the first customer, quarterly during the beta, and after a material change to database, storage, backup, or restoration architecture. The test restores into an isolated environment and verifies database consistency, representative Processes and audits, attachment availability, and Organization isolation.
- **FR-458 — Backup-failure alert:** A failed, incomplete, overdue, or unverifiable backup creates an operational alert for the Moviqo operator and remains open until a subsequent verified backup succeeds or the failure is explicitly resolved.
- **FR-459 — Export distinction:** Customer-requested Organization exports are portability features and do not replace Moviqo's disaster-recovery backups.
- **FR-460 — Real-data onboarding boundary:** Moviqo does not onboard a beta customer for real business data until a secure backup destination is operating and the initial restoration test has passed. Synthetic-data testing may continue before that gate is satisfied.

## 11. Public Landing Page and Beta Acquisition

### 11.1 Purpose, audience, and content

- **FR-461 — Public landing page:** Moviqo provides a public landing page that explains the product without requiring authentication and serves as the primary entry point for MVP beta acquisition.
- **FR-462 — Audience and value proposition:** The landing page addresses Spanish- and English-speaking SMEs that currently operate processes through spreadsheets, email, printed documents, and manual follow-up. Its primary message is that a non-technical user can turn a process idea into a working Moviqo Workflow simply, securely, and reliably.
- **FR-463 — Time-to-value message:** The landing page may communicate the approved target that a user can configure and publish a simple Workflow in approximately thirty to sixty minutes, but must present this as a product goal or expected simple-case outcome rather than a guarantee for every process.
- **FR-464 — Supported-capability accuracy:** Public content describes only MVP-supported capabilities, including Forms, Process Fields, calculations, attachments, Tasks, Team or Member assignment, visual conditions, routing, process tracking, audit, and bilingual use. It must not imply support for deferred capabilities such as arbitrary integrations, WhatsApp, MFA, enterprise SSO, advanced analytics, or fully automatic dynamic assignment.
- **FR-465 — Minimum content structure:** The landing page contains a concise hero section, business problem and value explanation, How It Works, supported use cases, representative product visuals, security and beta-trust summary, free-beta clarification, and clear actions to start or access Moviqo.
- **FR-466 — Representative use cases:** Initial use cases include purchase-request review, document intake and review, and an operational service or maintenance request. Each example must be achievable with the approved MVP Workflow, Form, assignment, condition, file, and tracking capabilities.
- **FR-467 — Fictional example organizations:** Landing-page scenarios and product previews may use fictional organizations, people, Processes, Tasks, amounts, statuses, Forms, and attachments. Every such presentation is labeled clearly as an example, sample, demo, or fictional scenario.
- **FR-468 — No fabricated social proof:** Moviqo does not present fictional organizations or sample people as real customers and does not publish invented testimonials, customer logos, adoption numbers, security certifications, savings, performance results, or endorsements. Real social proof may be added only with accurate evidence and customer permission.
- **FR-469 — Safe mock data:** Landing-page and screenshot mock data contains no real customer Process Data, confidential information, live credentials, private links, or personally identifiable information belonging to a real person.
- **FR-470 — Initial mock scenario set:** The initial landing-page mock set can demonstrate a fictional distributor's purchase request, a fictional services company's document review, and a fictional maintenance company's service request, using visibly fictional names and realistic but invented data.

### 11.2 Conversion and application access

- **FR-471 — Primary application link:** The landing page provides a prominent `Start Free Beta` action that redirects to the Moviqo application registration flow.
- **FR-472 — Existing-user link:** The landing page provides a visible `Sign In` action that redirects to the Moviqo application authentication flow.
- **FR-473 — Configurable application destination:** Registration and sign-in destinations use environment-specific application URLs so development, preview, and production landing pages cannot accidentally redirect users into the wrong environment.
- **FR-474 — Authenticated application boundary:** The public landing page does not expose Workflows, Tasks, Processes, Process Data, files, dashboards, audits, or Organization details. Starting a production Process continues to require authenticated Organization Membership according to FR-022.
- **FR-475 — Free-beta accuracy and support:** The landing page explains that the offer is a limited free beta, not a permanent free-price guarantee, and links to the applicable beta terms, privacy notice, prohibited-data guidance, and a configurable environment-specific support email address before registration. Email is the initial MVP support channel; live chat, a customer ticket portal, and a formal support-response SLA are not required.
- **FR-476 — Registration continuity:** A user selecting Start Free Beta arrives at the Organization registration and verified-email journey defined by Sections 12.2 and 10.4 without having to search for the next action or re-enter campaign information unnecessarily.

### 11.3 Localization, usability, and measurement

- **FR-477 — Bilingual landing page:** The landing page supports Spanish and English. Spanish is the default locale, and a visible language selector allows the visitor to change language while remaining on the equivalent page and section.
- **FR-478 — Responsive and accessible presentation:** The landing page works on mobile, tablet, laptop, and desktop layouts; supports keyboard navigation; preserves visible focus; uses semantic headings and meaningful alternative text; and maintains readable contrast and text sizing.
- **FR-479 — Search and sharing metadata:** Each supported locale provides an accurate page title, description, canonical metadata, language metadata, and social-sharing preview without making unsupported product or customer claims.
- **FR-480 — Lightweight delivery:** The landing page prioritizes fast initial rendering and avoids unnecessary large media, scripts, trackers, or dependencies that would undermine use on typical SME mobile and desktop connections.
- **FR-481 — Privacy-safe acquisition analytics:** If analytics are enabled, Moviqo may measure landing-page views, language selection, use-case engagement, Start Free Beta selection, Sign In selection, registration start, and registration completion without collecting Process Data, form contents, passwords, tokens, or private application URLs.
- **FR-482 — Consent and tracker restraint:** Non-essential analytics or marketing trackers are disabled until any legally required consent is obtained. The MVP may operate with first-party, privacy-minimizing acquisition events only.
- **FR-483 — Marketing-content maintainability:** Authorized Moviqo operators can update landing-page copy, locale translations, mock content, links, and metadata through the deployment content source without changing production Workflow or customer data.

## 12. Account and Organization Onboarding

### 12.1 Single-Organization account boundary

- **FR-484 — One Organization per account:** During the MVP, one Moviqo user account can belong to exactly one Organization and can have exactly one Organization Membership.
- **FR-485 — Globally unique account email:** A normalized email address identifies one Moviqo account and cannot be used to register or activate a Membership in a second Organization.
- **FR-486 — Separate identity for another Organization:** A person who needs access to another Organization during the MVP must register a separate Moviqo account using a different email address.
- **FR-487 — Persistent Organization association:** Deactivating a user preserves the account's association with its original Organization for historical and audit integrity. The deactivated account or its email cannot be reassigned to another Organization during the MVP.
- **FR-488 — No Organization switching:** The MVP provides no Organization selector, active-Organization switching, cross-Organization dashboard, or account-level aggregation across Organizations.
- **FR-489 — Multi-Organization membership deferred:** Allowing one user identity to hold Memberships in multiple Organizations is deferred to a future release and will require a new authorization, navigation, invitation, notification, and audit design.
- **FR-490 — PADR supersession:** FR-484 through FR-489 supersede the PADR decision that one person may collaborate with multiple Organizations through one identity for the MVP.

### 12.2 Organization registration and initial ownership

- **FR-491 — Owner registration fields:** Start Free Beta registration collects the person's display name, Organization name, globally unique email address, password, preferred application language, Organization regional format, Organization timezone, and Organization default currency.
- **FR-492 — Registration defaults:** Spanish is the default preferred language. Moviqo may suggest a regional format and timezone from the browser or device and a corresponding default currency, but the registering person must be able to review and change each Organization setting before completion.
- **FR-493 — Registration acceptance:** Registration requires explicit acceptance of the current beta terms and privacy notice and acknowledgment of the prohibited-data restrictions. Moviqo records the accepted document versions, user, Organization, and timestamp.
- **FR-494 — Pending Organization and environment boundary:** A self-registered Organization and initial account remain Pending until the registration email is verified. In the controlled Gate 1 internal-beta environment, an eligible verified Organization can activate for synthetic-data testing. In the customer-facing production environment, customer activation and real-business-data entry remain disabled until Gate 2 and the real-data onboarding gate in FR-460 pass.
- **FR-495 — Initial Owner activation:** Successful email verification activates the eligible Organization and account and grants the first user Owner access, including inherited Administrator, Designer, and Member capabilities.

### 12.3 Organization user creation and activation

- **FR-496 — Pending-user creation:** An active Owner or Administrator can create a Pending user in the current Organization by entering the person's display name, globally unique email address, and initial Member, Designer, or Administrator access level.
- **FR-497 — Organization-bound activation:** A Pending user is bound to the creating Organization and cannot activate into or be reassigned to another Organization.
- **FR-498 — Activation-link lifetime:** Creating a Pending user sends a time-limited, single-use activation link to the entered email address. The link expires seven days after issuance and is invalidated when used, revoked, or replaced by a newer activation link.
- **FR-499 — User-controlled activation:** The activation flow confirms the invited email, allows the user to review the display name, requires the user to create their own password and accept the applicable beta terms and privacy notice, and then changes the user to Active.
- **FR-500 — Pending-user restrictions:** A Pending user cannot authenticate into protected Moviqo areas, start Processes, receive or claim Tasks, access Organization data, or count as an active Team member.
- **FR-501 — Resend and revoke:** An Owner or Administrator can resend activation, which invalidates the previous link, or revoke a Pending user before activation. Both actions are audited.
- **FR-502 — Password ownership:** An Owner or Administrator never creates, receives, retrieves, exports, or views another user's password or activation credential.
- **FR-503 — Membership statuses:** MVP user Membership status is Pending, Active, or Deactivated. Status changes preserve historical identity and follow the deactivation safeguards in FR-008 through FR-010.
- **FR-504 — Administrator privilege boundary:** An Administrator can create and manage Members, Designers, and Administrators but cannot create an Owner, grant or remove ownership, deactivate an Owner, or modify ownership-transfer authority.
- **FR-505 — Owner management authority:** An Owner can manage every non-Owner access level and can transfer ownership only to another active user in the same Organization, subject to the last-active-Owner safeguard in FR-005.
- **FR-506 — Identity administration audit:** Pending-user creation, activation delivery, resend, revocation, activation, access-level change, deactivation, reactivation, and ownership transfer record the Organization, affected user, acting user or system event, previous and new state, timestamp, and safe outcome metadata.

### 12.4 Automatic beta admission and active-Organization capacity

- **FR-507 — Environment-appropriate automatic activation:** In the controlled Gate 1 internal-beta environment, an eligible test Organization activates automatically after registration, email verification, required terms acceptance, and availability within the configured test capacity. In the customer-facing production environment, automatic activation additionally requires satisfaction of the platform-wide Gate 2 and real-data release gates and availability within production beta capacity.
- **FR-508 — No manual admission review:** The MVP requires no Moviqo-operator review or manual approval for an eligible Organization to activate.
- **FR-509 — Initial active capacity:** The initial beta permits no more than twenty Active Organizations at one time. Dormant, recoverable, and finally deleted Organizations do not count as Active.
- **FR-510 — Capacity-full behavior:** When twenty Organizations are Active, Moviqo prevents another Organization from activating, explains that beta capacity is currently full, and preserves existing-user Sign In. It does not create partially authorized access to business features.
- **FR-511 — Configurable global capacity:** The maximum Active-Organization capacity is protected operational configuration and can be increased for the beta without changing application code, customer pricing, or existing Organization data. Reducing the setting never deactivates an already Active Organization.
- **FR-512 — Active-Organization priority:** Active Organizations retain their places. Moviqo does not deactivate an Active Organization, exceed configured capacity, or pause an Active Organization to activate or restore another Organization.

### 12.5 Beta Organization usage limits

- **FR-513 — Initial Organization limits:** Unless an audited Organization-specific exception applies, the initial beta permits up to ten Pending or Active users, ten non-archived published Workflow definitions, two hundred new Processes per usage cycle, one hundred megabytes of active attachment storage, and five hundred system-generated emails per usage cycle for each Organization. Published versions do not count as separate Workflow definitions.
- **FR-514 — Anniversary usage cycle:** An Organization's monthly Process-start and email counters use a monthly cycle anchored to the Organization activation date and time. For example, an Organization activated on February 15 begins its next cycle on March 15.
- **FR-515 — Short-month anniversary:** When the activation day does not exist in a month, the usage cycle renews on that month's final calendar day while retaining the original activation-day anchor for later months.
- **FR-516 — Usage visibility and warning:** Owners and Administrators can view current usage, cycle dates, and limits. Moviqo displays an approaching-limit warning at approximately eighty percent and a clear reached-limit message at one hundred percent.
- **FR-517 — Non-destructive limit enforcement:** Reaching a limit never deletes or corrupts existing data. User and Workflow limits block additional creation; the Process limit blocks new Process starts while allowing open work to continue; the attachment limit blocks additional uploads while allowing non-file work; and the email limit suppresses additional optional email while preserving in-application Tasks and operational visibility.
- **FR-518 — No automatic charge:** Beta limits never initiate a charge, paid upgrade, or automatic plan conversion.
- **FR-519 — Audited exceptions:** An authorized Moviqo operator can increase an Organization-specific beta limit through protected operational configuration. The previous limit, new limit, reason, actor, and timestamp are audited, and lowering a limit never deletes existing data.

### 12.6 Inactivity, dormancy, recovery, and automatic deletion

- **FR-520 — Organization activity timestamp:** A successful Sign In or authenticated product activity by any Active user updates the Organization's last-active timestamp. Automated background operations, notification delivery, and Moviqo-operator maintenance do not count as customer activity.
- **FR-521 — First inactivity warning:** After seven complete days without Organization activity, Moviqo emails every Active Owner that the Organization is approaching Dormant status and states the dormancy, recovery, export, and deletion dates.
- **FR-522 — Final pre-dormancy warning:** After twelve complete inactive days, Moviqo sends every Active Owner a final warning that Dormant status will begin after fourteen complete inactive days.
- **FR-523 — Automatic Dormant status:** After fourteen complete inactive days, Moviqo marks the Organization Dormant, suspends normal Organization access and Process execution, and immediately removes it from the Active-Organization capacity count.
- **FR-524 — Dormant data preservation:** Entering Dormant status does not alter Workflows, open Tasks, Processes, Process Data, attachments, or audit history. Those records remain preserved throughout the recovery period.
- **FR-525 — Restricted recovery access:** During Dormant recovery, an Owner can authenticate only into a restricted recovery area to inspect the deletion deadline, request an Organization export, close the account permanently where supported, or attempt restoration. Other Organization users cannot access normal business features.
- **FR-526 — Capacity-bound restoration:** A Dormant Organization can be restored only when the number of Active Organizations is below the configured limit at the instant restoration commits. Restoration never displaces an Active Organization, reserves capacity, receives priority over a new activation, or causes capacity to be exceeded.
- **FR-527 — Restoration outcome:** Successful restoration returns the preserved Organization to Active status, resumes authorized access and open work, resets the inactivity timer, and records the restoration. When capacity is full, restoration remains unavailable and the Owner retains restricted export access until deletion.
- **FR-528 — Fourteen-day recovery maximum:** Dormant recovery lasts no more than fourteen days. Moviqo displays and communicates the exact final-deletion timestamp and sends a final deletion warning before the recovery period expires.
- **FR-529 — Final inactive-data deletion:** After twenty-eight complete days of continuous inactivity, comprising fourteen days before Dormant status and fourteen days of recovery, Moviqo permanently removes the Organization's production records and binary files through the controlled deletion process and frees its remaining storage. Disaster-recovery copies expire according to FR-370 and FR-454.
- **FR-530 — No silent policy:** The landing page, registration flow, beta terms, and restricted recovery area clearly disclose the inactivity timeline and consequences before the customer entrusts business data to Moviqo.
- **FR-531 — Inactivity lifecycle audit:** Inactivity warnings, Dormant entry, attempted and successful restoration, export actions, final warning, final deletion, and delivery outcomes are audited without storing Process Data in the lifecycle event.
- **FR-532 — Inactivity-deletion supersession:** FR-520 through FR-531 create the approved beta exception to FR-362. Moviqo does not delete an Organization for inactivity except through this disclosed warning, Dormant, recovery, and final-deletion lifecycle.

### 12.7 Final identity deletion and Historical Organization Register

- **FR-533 — Complete Organization identity deletion:** Final Organization deletion removes the Organization, every user account and Membership belonging to it, access levels, Teams, invitations, Workflows, Processes, Tasks, Process Data, tenant audit records, active exports, and production file objects, subject only to backup expiration and the minimal Historical Organization Register defined below.
- **FR-534 — Credential invalidation on final deletion:** Final deletion invalidates every related session, activation link, verification link, password-reset link, file credential, and export credential before or as the active records are removed.
- **FR-535 — Email release:** After final Organization deletion commits, its former normalized email addresses are no longer reserved and may be used to register new Moviqo accounts.
- **FR-536 — Fresh registration after deletion:** Registration with a released email creates a new user account, Organization, Membership, identifiers, terms acceptance, and audit history. It grants no access to and creates no relationship with the deleted Organization or its backups.
- **FR-537 — Historical Organization Register:** Moviqo maintains a separate operator-only Historical Organization Register containing one minimal record for each finally deleted Organization so beta history, deletion execution, and backup expiration can be demonstrated without retaining the customer workspace.
- **FR-538 — Permitted historical metadata:** The Historical Organization Register may retain an opaque former-Organization identifier or deletion-receipt identifier; activation, last-activity, Dormant, closure, and final-deletion timestamps; deletion reason and policy version; accepted beta-terms version; anonymous aggregate counts such as users, distinct published Workflows, completed Processes, and storage usage at closure; and backup-expiration due date and completion status.
- **FR-539 — Prohibited historical contents:** The Historical Organization Register must not retain Organization display names, user names, email addresses, passwords or credentials, IP addresses, Workflow or Task names, Process Field definitions or values, attachment names or contents, export contents, notification message contents, or other data that could recreate the deleted customer workspace.
- **FR-540 — Historical-register isolation:** Historical Organization records are unavailable to customer Owners, Administrators, Designers, and Members; are accessible only through protected Moviqo-operator controls; and cannot be searched using a former email address.
- **FR-541 — Non-restorable historical record:** A Historical Organization record is evidence and aggregate product telemetry only. It cannot be reactivated, converted into an Organization, or used to restore deleted data.
- **FR-542 — Backup separation after deletion:** Disaster-recovery backups containing deleted Organization data remain inaccessible through normal application and Historical Organization Register operations and expire according to the approved backup-retention schedule. The register may track backup expiration status without exposing backup contents.
- **FR-543 — Historical-retention disclosure:** The beta terms and privacy notice disclose the limited Historical Organization Register, its purpose, permitted metadata, access boundary, and approved retention period before customer onboarding.
- **FR-544 — Historical-record retention:** Moviqo retains an individual Historical Organization record for no more than twenty-four months after final Organization deletion and then permanently deletes that record.
- **FR-545 — Consolidated statistics after expiration:** After an individual historical record expires, Moviqo may retain only consolidated, irreversible product statistics that cannot identify, isolate, reconstruct, or link back to a former Organization, user, email address, Workflow, or Process.

## 13. Application Localization and Organization Regional Settings

### 13.1 Interface-language boundary

- **FR-546 — Supported application languages:** Moviqo-owned public and authenticated interface content supports Spanish and English. Spanish is the default and fallback when no valid saved preference or translation exists.
- **FR-547 — Personal interface language:** Each user has a personal interface-language preference that controls Moviqo-owned navigation, buttons, system statuses, validation feedback, errors, confirmations, help content, and system-generated email text.
- **FR-548 — Organization language default:** The initial Owner's selected language becomes the Organization default. New Pending users inherit that default but can select Spanish or English during activation and later change their personal preference without changing Organization business data.
- **FR-549 — Organization-language administration:** Owners and Administrators can change the Organization default language for future users and Organization-level fallback content. The change does not overwrite existing users' personal language preferences.
- **FR-550 — Designer-content boundary:** Workflow names and descriptions, element and Task names, Form labels and instructions, choice labels, reusable-list labels, validation messages, Instance States, completion labels, and Designer-authored notification text display exactly as configured by the Designer and are not automatically translated.
- **FR-551 — Deferred authored-content localization:** Automatic translation and separate language variants for Designer-authored Workflow and Form content are outside the MVP.
- **FR-552 — Translation safety:** Missing application translations fall back to Spanish and never expose internal translation keys, template identifiers, or untranslated developer placeholders to the user.

### 13.2 Shared regional presentation

- **FR-553 — Organization regional settings:** Each Organization has one regional-format setting, one timezone, and one default ISO currency code configured during initial Owner registration.
- **FR-554 — Regional-settings administration:** Owners and Administrators can change the Organization regional format and timezone. Presentation changes apply consistently to subsequent views without rewriting stored Date, Date-Time, numeric, Currency, Process Data, or audit values.
- **FR-555 — Organization-consistent business values:** Shared business dates, Date-Time values, numbers, and currencies use the Organization regional settings for every viewer, regardless of personal interface language.
- **FR-556 — Locale-neutral persistence:** Moviqo stores dates, instants, numbers, and monetary amounts in locale-neutral representations and applies Organization formatting only for authorized input and presentation.
- **FR-557 — Regional input semantics:** Manual date and numeric input is parsed and validated according to the Organization regional format, and the interface provides an unambiguous expected-format example where manual input could be misunderstood.
- **FR-558 — Email and audit formatting:** System email text and audit event names follow the viewing or recipient user's interface language, while included business values follow the Organization regional format and timezone.

### 13.3 Currency behavior

- **FR-559 — Currency as a field type:** Currency is a Process Field or supported Data Table column type, not a separate true-or-false presentation property. Selecting the Currency type automatically applies the Organization default currency.
- **FR-560 — Progressive currency override:** A progressively disclosed `Use a different currency` property allows a Designer to select another valid ISO currency code for an exceptional Currency field or column without requiring ordinary Designers to choose a currency each time.
- **FR-561 — Organization-currency correction and lock:** The Owner can correct the Organization default currency only while no Currency field or column has been published. Publishing the first Currency field or column locks the Organization default currency for the MVP.
- **FR-562 — Published field-currency immutability:** A Currency field or column's ISO currency code cannot change after its first publication. A Designer needing a different currency must create another Currency field or column.
- **FR-563 — Mixed-currency safety:** Calculations, comparisons, conditions, and Data Table aggregates cannot combine or directly compare Currency values with different ISO currency codes. Publication is blocked with a clear dependency error when a rule or calculation violates this boundary.
- **FR-564 — No exchange-rate conversion:** Exchange-rate lookup, automatic monetary conversion, rate history, and conversion gains or losses are outside the MVP.
- **FR-565 — Unambiguous currency display:** Currency presentation includes the ISO code when a symbol could be ambiguous, for example `USD $100.00` or `COP $100,00`, using the Organization regional format.

### 13.4 Localization release readiness

- **FR-566 — Translation completeness gate:** Spanish and English application-owned content for the approved MVP flows is reviewed before public beta; missing or unsafe production translations block release until corrected or safely covered by the Spanish fallback.
- **FR-567 — Deferred language expansion:** Additional application languages, right-to-left layouts, and automatic locale generation are outside the MVP.

## 14. Workflow Catalog and Definition Lifecycle

### 14.1 Catalog access, creation, and discovery

- **FR-568 — Organization-wide Designer catalog:** Active Designers, Administrators, and Owners can view and manage every Workflow definition in their Organization. Members without Designer capability do not receive Workflow-definition access merely because they can start or participate in Processes.
- **FR-569 — Production-data boundary:** Workflow catalog and definition access does not grant a Designer access to Process rows, Task submissions, Process Field values, attachments, or Transactional Audit beyond the production-data boundaries already defined in this PRD.
- **FR-570 — Workflow creation metadata:** Creating a Workflow requires a name that is unique among the Organization's non-archived Workflow definitions, ignoring letter case, and permits an optional short description.
- **FR-571 — Initial blank canvas:** A newly created Workflow opens as a shared Draft Only definition with Start and End already placed on the canvas. It remains invalid for publication until the Designer adds at least one Task and satisfies all graph, assignment, Form, and Authorized Starter requirements.
- **FR-572 — Catalog status and columns:** The catalog displays Workflow name and description; Draft Only, Published, Published with Draft, or Archived status; latest published version; draft validation status; creator; last editor; last-modified time; latest publication time; and authorized actions.
- **FR-573 — Active-Process summary:** The catalog may display the count of Active or Needs Attention Processes for operational awareness without exposing their rows or Process Data to a Designer who lacks production-data access.
- **FR-574 — Catalog querying:** The Workflow catalog supports search by name and description, filters by lifecycle and validation status, and sorting by name, creation date, last-modified date, and latest publication date.

### 14.2 Naming and metadata history

- **FR-575 — Active-name uniqueness:** A non-archived Workflow name must remain unique within its Organization, ignoring letter case. A duplicate, reactivation, rename, or creation that conflicts with another non-archived name is blocked with a clear message.
- **FR-576 — Metadata editing:** A Draft Only Workflow can change name and description directly in its draft. A published Workflow changes name or description through the shared draft, and the change becomes the current production metadata only after publication.
- **FR-577 — Historical metadata:** Every published version preserves the Workflow name and description present at its publication time, even when later versions use different metadata.

### 14.3 Delete, archive, and reactivate

- **FR-578 — Draft-only deletion:** A never-published Workflow with no runtime history can be physically deleted after explicit confirmation, releasing its draft-only resources and identifiers from active use while retaining the applicable Configuration Audit event.
- **FR-579 — Published archive boundary:** A Workflow that has ever been published cannot be physically deleted independently from its Organization. It can only be Archived, except during final Organization deletion.
- **FR-580 — Archive runtime behavior:** Archiving immediately removes the Workflow from Start a Process and prevents new Process starts while allowing existing Processes and open Tasks to continue under the approved live-version rules.
- **FR-581 — Archive preservation:** Archiving preserves published versions, the shared draft where one exists, Workflow configuration, active and historical Processes, Process Data, files, and audit history.
- **FR-582 — Archived definition access:** An Archived Workflow and any preserved draft are read-only. Archiving releases its edit lease, and editing cannot resume until an authorized user reactivates the Workflow.
- **FR-583 — Reactivation readiness:** Reactivating an Archived Workflow does not create a new published version, but Moviqo checks current Workflow-name uniqueness, Authorized Starters, assignments, references, dependencies, and runtime readiness before allowing new Process starts.
- **FR-584 — Reactivation requiring changes:** If the latest published definition is no longer ready for new starts, Moviqo can reactivate the catalog definition in a Needs Update state, keeps new starts blocked, and requires a valid shared draft to be published before the Workflow returns to Published operation.

### 14.4 Workflow duplication

- **FR-585 — Duplicate source:** A Designer can duplicate a Draft Only Workflow's current draft or the latest published version of a Published or Archived Workflow.
- **FR-586 — Independent duplicate identity:** Duplication creates a new Draft Only Workflow with a new unique name and new Workflow, element, Process Field, Form, rule, calculation, state, and Workflow-local option identifiers.
- **FR-587 — Copied definition configuration:** Duplication copies the selected source's Forms, fields, layout, conditions, calculations, states, Tasks, routing, assignments, and Authorized Starters. Organization Choice Lists remain references to the same Organization-owned reusable lists rather than being copied.
- **FR-588 — No runtime-data duplication:** Duplication never copies Processes, Task occurrences, submitted Process Data, attachments, notification history, Transactional Audit, published-version history, or source edit leases.
- **FR-589 — Duplicate validation and audit:** Copied assignments, starters, references, and dependencies must pass normal validation before publication. Configuration Audit records the source Workflow and source draft or version, duplicating user, new Workflow, and timestamp.

### 14.5 Version history and restoration

- **FR-590 — Version History view:** Version History displays each immutable version's sequential number, Workflow name and description at publication, publication timestamp, publisher, originating draft, and restoration source where applicable.
- **FR-591 — Restoration reason:** Restoring an older published version requires a Designer-entered reason and creates or replaces the permitted shared draft only after confirmation without changing the current published version.
- **FR-592 — Restoration comparison:** Before publishing a draft restored from an older version, the Designer can compare that draft with the latest published version and inspect added, changed, reactivated, and retired elements, fields, assignments, rules, and metadata.
- **FR-593 — Restoration publication sequence:** Publishing a restored draft creates the next sequential immutable version and records the source version, restoration reason, Designer, validation result, and publication timestamp.

### 14.6 Beta-limit interaction

- **FR-594 — Published-Workflow quota unit:** The ten-Workflow beta limit counts non-archived Workflow definitions with at least one published version. Drafts and additional versions do not count as separate published Workflow definitions.
- **FR-595 — Archive frees published capacity:** Archiving a published Workflow releases one published-Workflow place without deleting its definitions, versions, running Processes, or history.
- **FR-596 — Quota-safe publication:** Draft creation and duplication are permitted independently of available published capacity, but publication and reactivation for new starts are blocked while all ten published-Workflow places are occupied unless an audited Organization-specific exception applies.

## 15. MVP Quality and Non-Functional Requirements

### 15.1 Performance and beta-load profile

- **NFR-001 — Landing-page responsiveness:** The public landing page becomes usable within approximately three seconds under the documented representative mobile-network and device test profile.
- **NFR-002 — Application-view responsiveness:** Authenticated dashboards and Task Forms become usable within approximately three seconds for Organizations operating within approved beta limits under the documented normal-load test profile.
- **NFR-003 — Interactive-operation latency:** Claim Task, Save Draft, Complete Task, and standard configuration saves return a successful result or actionable failure within two seconds for at least ninety-five percent of normal-load requests, excluding file transfer and external email-delivery time.
- **NFR-004 — File-transfer feedback:** File uploads and downloads expose progress or an equivalent active state and provide a clear, safe, retryable failure result rather than leaving the user uncertain about completion.
- **NFR-005 — Server-side collection querying:** Search, filtering, sorting, and pagination for protected collections execute on the server within the authorized Organization scope rather than requiring the client to download an unrestricted data set.
- **NFR-006 — Representative definition profile:** Performance verification includes Workflows with up to fifty active elements, Task Forms with up to fifty controls, Data Tables with up to one hundred rows, and paginated dashboards with at least one thousand authorized records. These are test profiles rather than hard feature limits unless a separate approved limit applies.
- **NFR-007 — Representative beta load:** Before public launch, beta-load verification covers twenty Organizations and at least fifty concurrent authenticated users performing a representative mix of dashboard, Form, Task, Workflow, and file operations.
- **NFR-008 — Performance evidence:** Performance evidence records the tested build, environment, data profile, request mix, percentile results, failures, and known infrastructure constraints without including customer Process Data.

### 15.2 Supported browsers and devices

- **NFR-009 — Browser support window:** Moviqo supports the current and immediately previous stable major versions of Chrome, Edge, Firefox, and Safari available at the time of each production release.
- **NFR-010 — Responsive operational flows:** Landing, registration, authentication, My Work dashboards, Process tracking, Task Forms, Organization administration, and restricted recovery work on supported mobile, tablet, laptop, and desktop layouts.
- **NFR-011 — Designer screen baseline:** Workflow and Form design are optimized and tested for supported laptop and desktop browsers with a viewport of at least 1280 by 720 CSS pixels.
- **NFR-012 — Deferred mobile design:** Authoring Workflows and Forms on narrow mobile layouts and providing native mobile applications are outside the MVP. Mobile users can still perform the supported operational flows in NFR-010.
- **NFR-013 — Unsupported-browser behavior:** When Moviqo detects a known unsupported browser, it provides a clear upgrade or supported-browser message and does not imply that an unsafe or incompatible operation succeeded.

### 15.3 Accessibility baseline

- **NFR-014 — Accessibility reference:** Moviqo uses the applicable WCAG 2.2 Level A and Level AA success criteria as the design and testing baseline for the landing page, authentication, dashboards, Task Forms, and Organization administration.
- **NFR-015 — Core accessible interaction:** Core MVP flows support keyboard navigation, visible focus, semantic labels and headings, meaningful alternatives for non-text content, readable contrast, screen-reader announcements for material state changes, accessible validation feedback, and text enlargement to two hundred percent without loss of required content or operation.
- **NFR-016 — Non-drag Designer alternatives:** Where practical for the MVP, Workflow and Form Designer operations that use dragging also provide non-drag controls, such as buttons for adding elements and property-based methods for configuring order, width, or connections.
- **NFR-017 — Conformance-claim boundary:** The beta does not advertise formal WCAG conformance until every page and applicable state, language, responsive variation, and dynamic interaction included in the claim has completed the required automated and manual verification. Using WCAG as a baseline does not by itself constitute certification.

### 15.4 Availability, health, and service communication

- **NFR-018 — No beta uptime SLA:** The free beta provides no contractual uptime percentage or enterprise availability SLA.
- **NFR-019 — Availability disclosure:** Beta terms disclose relevant free-provider, planned-maintenance, outage, support, recovery, and availability limitations without weakening the approved security, backup, or tenant-isolation responsibilities.
- **NFR-020 — Health coverage:** Moviqo monitors frontend reachability, API health, database connectivity, private storage access, email delivery integration, daily backups, and scheduled inactivity-lifecycle execution.
- **NFR-021 — Safe health endpoints:** Health and readiness endpoints expose no credentials, customer identity, Process Data, internal topology, stack trace, or unnecessary provider detail.
- **NFR-022 — Operator alerting:** Repeated or material health, backup, email, storage, scheduled-operation, or application failures create a Moviqo-operator alert with a safe correlation identifier and remain traceable until resolved.
- **NFR-023 — Planned-maintenance communication:** Moviqo communicates planned maintenance to affected beta users in advance when practical and states the expected impact and time window without making an unsupported restoration promise.
- **NFR-024 — Known-outage communication:** During a known material outage, Moviqo provides an accessible safe service message or status communication that explains the affected capability without exposing sensitive infrastructure information.

### 15.5 Safe failure, consistency, and retry behavior

- **NFR-025 — Duplicate-operation prevention:** Process start, Team Task claim, Save Draft, Complete Task, Workflow publication, and administrative reassignment prevent duplicate business results when the client or server safely retries the same logical operation.
- **NFR-026 — All-or-nothing business outcome:** A business operation that must change multiple related records either completes every required state change or leaves the previous valid business state intact. For example, Complete Task cannot persist a completed current Task without also recording required audit and routing state and creating the valid next Task or End result.
- **NFR-027 — Independent background retry:** Email delivery, export generation, malware inspection, backup, and deletion retries do not duplicate the underlying business action, file, export, or lifecycle transition.
- **NFR-028 — Notification-failure independence:** Failure to deliver an assignment, Transition, or operational notification after a successful business operation does not reverse Task completion, routing, assignment, reassignment, or Process state. Notification failure is recorded and retried independently according to the applicable notification policy.
- **NFR-029 — Failed completion containment:** A failed Task-completion attempt leaves the Task open, does not select an outgoing route, and does not create a duplicate or unauthorized next Task.
- **NFR-030 — Safe unexpected failure:** Unexpected failures follow the approved safe error and correlation-identifier requirements, preserve tenant isolation, and do not expose or partially commit unauthorized Process Data.
- **NFR-031 — Recovery objectives:** Recoverable production-data failures are handled according to the approved public-beta twenty-four-hour recovery point and recovery time targets in FR-455 and FR-456.

## 16. Active Process Live-Version Concurrency

### 16.1 Open Form version and assignment checks

- **FR-597 — No periodic runtime-Form polling:** An open runtime Task Form does not periodically poll for Workflow publication, Form-definition, or assignment changes. No WebSocket or persistent real-time channel is required for this purpose.
- **FR-598 — Explicit-action checks:** Moviqo checks the current Task assignment and latest applicable published Form definition when the user selects Save Draft or Complete Task. Manually refreshing or reopening the Task also loads the current authorized definition.
- **FR-599 — Opened-definition identity:** An editable Task Form submission identifies the Task occurrence and the published definition revision against which the Form was opened so the server can detect stale assignment or definition state.
- **FR-600 — Reassigned open-Form rejection:** If the requesting user is no longer the authorized assignee when Save Draft or Complete Task reaches the server, Moviqo rejects the operation, persists none of the values submitted by that attempt, and displays that the Task was reassigned and is no longer available.
- **FR-601 — Reassigned Form exit:** After reassignment rejection, the stale Form closes or returns the user to My Tasks. Values persisted through earlier successful saves remain unchanged and audited, while unsaved browser-only values from the rejected request are not committed.
- **FR-602 — Stale-definition rejection:** If a newer applicable published Form definition exists than the revision submitted by an otherwise authorized user, Save Draft or Complete Task persists none of that attempt's submitted values and requires the user to reload the updated Form before trying again.
- **FR-603 — Latest Form after reload:** Reloading or reopening the authorized Task uses the newest compatible published definition and current Process Data, including newly added controls, requirements, validations, calculations, visibility, and enabled rules.
- **FR-604 — New requirements on open Tasks:** A new required field or validation in the latest current-Task Form applies after reload and must pass before completion, even when the Task occurrence was activated under an earlier version.
- **FR-605 — Removed-control preservation:** A control removed by the latest definition no longer appears after reload, but its previously persisted Process Field value and historical audit remain preserved according to FR-110 and FR-171.

### 16.2 Published assignment changes for open Tasks

- **FR-606 — Open-assignment impact preview:** Before publishing a Task assignment change, Moviqo displays the number of affected open Task occurrences and the expected assignment result for each affected Process where it can be resolved safely.
- **FR-607 — Publication-time assignment resolution:** Publication evaluates the new assignment configuration for every affected open Task occurrence using that Process's current authorized Process Data.
- **FR-608 — Unresolvable change blocks publication:** Publication is blocked when a proposed assignment change for an existing open Task cannot resolve to a valid Active Member or Team, including an empty or inactive User Reference. The Designer must correct the definition or an Administrator must resolve the affected operational state before retrying publication.
- **FR-609 — Valid open-Task reassignment:** When the new assignment resolves, publication reassigns the open Task occurrence, removes previous active access, grants the resulting Member or Team access, preserves previously persisted Process Data, and audits the previous and new assignment.
- **FR-610 — Reassignment status result:** A new Team assignment becomes Available for eligible Team claiming; a new individual, initiator, or valid User Reference assignment becomes Assigned to the resolved Member.
- **FR-611 — Reassignment notification behavior:** Email caused by publication-time reassignment follows the affected Task's existing assignment-email property and does not introduce a separate mandatory notification.

### 16.3 Publication and Task-write serialization

- **FR-612 — Serialized conflicting operations:** Publication and Save Draft or Complete Task operations that can affect the same open Task are serialized by the server so their commits have one deterministic order and cannot partially combine definition versions.
- **FR-613 — Publication-first outcome:** If publication commits first, a submission from the previous Form revision fails the assignment or stale-definition check, persists no submitted values, and requires the authorized user to reopen or reload the resulting current Task state.
- **FR-614 — Task-write-first outcome:** If a valid Save Draft or Complete Task operation begins against the current published version first, the conflicting publication waits for that operation to commit. The Task write uses the version that was current when its protected transaction began; publication then evaluates the resulting current execution point before committing.
- **FR-615 — Completion version consistency:** One Complete Task operation uses one published definition version consistently for final validation, calculation, persistence, Task completion, routing, Instance State update, required audit, and next Task or End creation.
- **FR-616 — New version after completion-first ordering:** When completion commits before a waiting publication, the completed occurrence and route remain attributed to their selected version, the publication never rewrites that history, and the Process uses the newly published version from the resulting execution point onward.
- **FR-617 — Atomic publication impact:** Publication of live Form, assignment, routing, and state changes and all required publication-time open-Task assignment updates either commits as one valid publication outcome or leaves the previous published version and open assignments current.
- **FR-618 — Concurrency audit:** Publication impact, assignment updates, stale-definition rejections, reassignment rejections, and the definition version used by every successful Save Draft and Complete Task are recorded without persisting values from rejected submissions.

## 17. Informational Task Forms and Publication Validation

### 17.1 Informational presentation

- **FR-619 — Instruction Text purpose:** A Designer uses the existing Instruction Text layout component to present static instructions, explanations, notices, or other Designer-authored information. Instruction Text does not create a Process Field or store Process Data.
- **FR-620 — Read-only Display Value:** When a Process Field is included in a Task Form as read-only, Moviqo renders it as a clear label-and-value Display Value rather than as a disabled editable input. Display Value is a presentation mode for an existing Process Field, not a separate Process Field type.
- **FR-621 — Type-appropriate read-only rendering:** Read-only text, numeric, currency, date, date-time, Yes/No, Choice, User Reference, and Calculated values use an appropriate formatted display; File Attachment values provide authorized preview or download actions; and Data Tables use a non-editable table presentation.
- **FR-622 — Empty read-only value:** A visible read-only Process Field without a current value displays a localized neutral placeholder equivalent to `No value` rather than an editable empty control.
- **FR-623 — Optional acknowledgment:** When an informational Task requires explicit confirmation, the Designer can add a required Yes/No Process Field, label it with business wording such as `I acknowledge this information`, and use the normal Complete Task action. Moviqo does not force acknowledgment for every informational Task.

### 17.2 Task Form publication checks

- **FR-624 — One Form per active Task:** Every active Task has exactly one Task Form whose definition is validated as part of Workflow publication.
- **FR-625 — Meaningful visible content:** Each active Task Form must contain at least one meaningful component that is visible under at least one valid rule outcome. An editable, read-only, or Calculated Process Field, File Attachment, Data Table, or non-empty Instruction Text satisfies this requirement.
- **FR-626 — Decorative-only Form rejection:** A Form containing only empty or decorative Heading, Section, or Divider components does not satisfy the meaningful-content requirement and blocks publication.
- **FR-627 — Form-reference validation:** Publication blocks when an active Task Form contains duplicate use of the same Process Field in that Form, missing or incompatible references, incomplete labels or required type configuration, invalid layout relationships, or references to inactive or unavailable configuration.
- **FR-628 — Structured-control validation:** Publication requires each Data Table to have at least one valid column and each Workflow-local or Organization Choice List used by a Choice field to contain at least one active selectable option.
- **FR-629 — Rule and calculation validation:** Publication blocks for incomplete, incompatible, missing, or circular Form rules, validation rules, calculations, dependencies, and references, using the existing visual-rule and dependency requirements.
- **FR-630 — Constraint consistency:** Publication blocks internally contradictory control constraints, including a minimum greater than a maximum, invalid decimal precision, impossible date boundaries, invalid table row limits, or an invalid File Attachment size or count configuration.
- **FR-631 — Hidden-content warning:** If Form rules can produce a valid runtime state in which every meaningful component is hidden, Moviqo presents a publication warning so the Designer can confirm that an intentionally empty visible Form is acceptable. This warning does not replace blocking errors for invalid rules.
- **FR-632 — Draft preservation:** Form publication errors and warnings do not prevent saving the shared Workflow draft. Blocking errors prevent publication until corrected.

## 18. Delivery and Validation Gates

These gates define implementation, deployment, and validation order. They do not weaken any final public-beta requirement. Gate 1 deploys the complete MVP business functionality to a controlled internal-beta environment using persistent synthetic data. Gate 2 hardens and verifies that same product for deployment or promotion to the customer-facing public-beta environment.

### 18.1 Gate 1 — Feature-complete internal beta and UAT

Gate 1 includes:

- Deployment to a controlled environment accessible to authorized stakeholders and company manual testers rather than public-beta customers.
- The responsive Spanish-and-English public landing page defined in Section 11, using clearly identified fictional examples and mock customer scenarios rather than fabricated testimonials or customer claims.
- Working landing-page navigation to registration through `Start Free Beta` and to authentication through `Sign In`.
- All approved MVP user-visible business functionality, backed by persistent application storage rather than browser-only or disposable mock storage.
- Registration, email verification, sign-in, sign-out, password recovery, sessions, one Account per Organization, and creation of the initial Owner and Organization.
- Creation and activation of multiple test Organizations, each using separate accounts, with server-enforced Organization scoping and authorization across users, Teams, Workflows, drafts, Processes, Tasks, Process Data, files, dashboards, audits, notifications, and exports.
- Initial automated isolation tests and manual attempts to cross Organization boundaries. The complete release-blocking tenant-isolation suite and production evidence remain Gate 2 requirements, but tenant isolation itself is implemented in Gate 1.
- Complete approved Member, role, Team, starter-permission, Task-assignment, and administrative-reassignment functionality.
- Complete approved Workflow catalog, Designer, Form, Process Field, validation, calculation, rule, draft, publication, version, inactive-element, restoration, Start, Task, Transition, Conditional Routing, and End functionality.
- Starting Processes, saving Form drafts and Process Data, uploading harmless synthetic files, completing assigned or available Tasks as different test users, following routing decisions and loops, applying live compatible updates, reaching End, and inspecting My Tasks, My Processes, timelines, operational views, and audit history.
- Approved localization, notification, quota, lifecycle, and other testable MVP behavior, using controlled test equivalents such as an email sandbox where a production integration is not yet authorized.
- Synthetic users, Organizations, Processes, business data, files, and clearly labeled mock examples suitable for functional tests and stakeholder demonstrations.

Gate 1 passes when the approved MVP business functionality is available in the controlled deployed environment and manual testers can begin on the landing page; register, activate, and use multiple isolated test Organizations; create users and Teams; create and publish valid Workflows and Forms; start and execute Processes as applicable test users; persist synthetic Process Data across sessions and application restarts; exercise assignments, rules, routes, loops, and versions; reach End successfully; and inspect the resulting operational views and history without developer intervention during the tested flow.

Gate 1 is not authorization to onboard customers with real business data. Its deployed environment permits only synthetic or mock data and harmless test files until Gate 2 controls pass.

### 18.2 Gate 2 — Customer public-beta production readiness

Gate 2 uses the functionally complete Gate 1 product, resolves discovered defects, completes production integrations and safeguards, and verifies the controls required before real customer onboarding. It is not a second business-functionality build and does not defer an approved core Workflow, Form, runtime, or administrative feature from Gate 1. Gate 2 includes:

- The full automated tenant-isolation suite across records, files, drafts, Tasks, dashboards, audits, notifications, exports, and background operations.
- Password recovery, authentication throttling, deactivation enforcement, session revocation, and the approved password-only MVP security requirements.
- Private file access, expiring file and export credentials, server file validation, malware inspection, and removal of access through expired or unauthorized links.
- Safe logs and errors, secrets management, environment separation, encryption, and exclusion or sanitization of Process Data in diagnostic telemetry.
- Database and attachment backups, retention, off-site encrypted storage, and at least one successful restoration test against the approved recovery objectives.
- Audit-integrity testing, dependency and vulnerability checks, threat review against the OWASP Top 10, applicable OWASP ASVS MVP controls, and relevant MITRE ATT&CK scenarios.
- Operational monitoring and alerts for the application, API, database, storage, email, backup, and Organization-lifecycle functions.
- Approved beta terms, privacy information, prohibited-sensitive-data guidance, and the Designer-facing information notice that explains customer responsibility for configured Process Data.

Gate 2 passes only when the approved release-blocking security, isolation, authentication, audit, backup-restoration, and operational checks succeed. The verified product can then be deployed or promoted to the customer-facing public-beta environment, after which automatic customer activation and entry of permitted real business data may begin.

## 19. MVP Beta Success Criteria

Gate 1 demonstrates the functional product with synthetic data, and Gate 2 authorizes real-business-data onboarding. The following outcome criteria measure whether the subsequent public beta validates Moviqo's product value. Capacity limits are operating boundaries and do not replace these success measures.

- **SC-001 — Participating Organizations:** At least five distinct Organizations use Moviqo during the public beta. The approved platform capacity remains twenty Active Organizations.
- **SC-002 — Published Workflow adoption:** At least twenty distinct Workflow definitions are successfully published across participating Organizations. Additional published versions of the same Workflow definition do not count as additional Workflows.
- **SC-003 — Completed Process volume:** At least one hundred Processes reach an End element successfully and therefore become Completed. Cancelled, failed, or still-running Processes do not count.
- **SC-004 — Thirty-day Organization retention:** At least two of the initial five participating Organizations remain active during their thirtieth day after activation. Qualification requires at least one Member to sign in and perform a meaningful authenticated product action, such as designing or publishing a Workflow, starting a Process, saving Process Data, claiming or completing a Task, or performing an authorized operational action. Automated background activity does not qualify.
- **SC-005 — Time to first publication:** A non-technical Owner can create and successfully publish a simple valid Workflow within no more than sixty minutes, with thirty minutes as the target. Measurement starts when the Owner selects `Create Workflow` and ends when publication succeeds.
- **SC-006 — Independent end-to-end operation:** At least one participating Organization creates, publishes, starts, executes, and completes a Workflow without developer intervention during the measured flow.
- **SC-007 — Willingness to pay:** At least one participating Organization confirms through recorded beta feedback that it would consider continuing with Moviqo under an affordable paid plan. Actual payment is not required during the free beta.
- **SC-008 — Isolation and data reliability:** The beta has no confirmed cross-Organization data exposure and no customer-data loss that remains unrecovered beyond the approved recovery objectives.
