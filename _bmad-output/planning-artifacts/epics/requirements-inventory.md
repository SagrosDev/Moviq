# Requirements Inventory

## Functional Requirements

### Functional Requirement Capability Index

1. **Accounts, membership, roles, and visibility — FR1–FR16**
   - Role inheritance and capabilities — FR1–FR6
   - Password recovery, deletion, deactivation, and continuity — FR7–FR10
   - Participant, Task, Process Data, administrator, and Designer visibility boundaries — FR11–FR16
2. **Permission to start Workflows — FR17–FR26**
   - Authorized Starter configuration and publication validation — FR17–FR22
   - Start catalog, assignment visibility, and dashboard separation — FR23–FR26
3. **Teams and Task assignment — FR27–FR47**
   - Team availability, claiming, exclusivity, and audit — FR27–FR32
   - Team creation, membership, lifecycle, and validity — FR33–FR38
   - Member, Team, initiator, and User Reference assignment plus recovery — FR39–FR47
4. **Forms and Process Data — FR48–FR203**
   - Text fields — FR48–FR54; numeric fields — FR55–FR66; Date/Date-Time — FR67–FR78; Yes/No — FR79–FR84
   - Choice fields and reusable lists — FR85–FR96; User Reference — FR97–FR106; reusable Process Fields — FR107–FR114
   - File Attachments — FR115–FR125; Data Tables — FR126–FR142; Calculated Fields — FR143–FR155
   - Visual rule engine — FR156–FR167; conditional behavior — FR168–FR175; responsive layout/labels — FR176–FR185
   - Cross-field validation — FR186–FR193; layout components and conditional reflow — FR194–FR203
5. **Task completion and Workflow routing — FR204–FR273**
   - Save Draft, Complete Task, validation, and routing — FR204–FR211
   - Graph elements, transitions, routes, and cycles — FR212–FR221; validation and publication — FR222–FR228
   - Shared drafts, autosave, leases, and stale-write protection — FR229–FR240
   - Inactive Tasks — FR241–FR248; versions, active Processes, loops, and restoration — FR249–FR255
   - Instance States — FR256–FR261; occurrence audit — FR262–FR265; draft synchronization — FR266–FR273
6. **Process runtime, operations, and navigation — FR274–FR318**
   - Process and Task lifecycle states — FR274–FR283; cancellation — FR284–FR287
   - My Tasks, My Processes, Start a Process, Needs Attention, and All Processes — FR288–FR301
   - Columns, search, filters, sorting, pagination, and responsive cards — FR302–FR318
7. **Notifications — FR319–FR339**
   - Assignment and Team email — FR319–FR326; Transition email — FR327–FR331
   - Localization, tracking, retry, and channels — FR332–FR335; operational-problem email — FR336–FR339
8. **Audit and Process timeline — FR340–FR359**
   - Audit domains and role-scoped access — FR340–FR345; Process Detail and authorized timeline — FR346–FR351
   - Immutability, evidence, search, export, and log separation — FR352–FR359
9. **Retention, export, and deletion — FR360–FR373**
   - Process and Organization retention — FR360–FR363; export and closure — FR364–FR370
   - Beta data responsibility, prohibited data, and policy revision — FR371–FR373
10. **Security and trust — FR374–FR460**
    - Authentication, passwords, recovery, sessions, revocation, and deactivation — FR374–FR386
    - Safe errors/logging — FR387–FR393; tenant isolation/authorization — FR394–FR402
    - Verification and deferred MFA/SSO/passkeys — FR403–FR411; private files/exports — FR412–FR423
    - Transport, encryption, secrets, environments, and telemetry — FR424–FR433
    - OWASP/MITRE/threat modeling — FR434–FR441; security gates — FR442–FR451; backup/recovery — FR452–FR460
11. **Public landing page and beta acquisition — FR461–FR483**
    - Audience, value, accurate claims, examples, and trust — FR461–FR470
    - Registration/sign-in conversion, environment routing, terms, and support — FR471–FR476
    - Localization, responsive accessibility, metadata, performance, analytics, and maintainability — FR477–FR483
12. **Account and Organization onboarding — FR484–FR545**
    - One-Organization accounts — FR484–FR490; initial Owner registration/activation — FR491–FR495
    - User creation, invitation, activation, roles, ownership, and identity audit — FR496–FR506
    - Automatic admission and capacity — FR507–FR512; beta quotas — FR513–FR519
    - Inactivity, Dormant recovery, and deletion — FR520–FR532; final deletion and Historical Register — FR533–FR545
13. **Localization and regional settings — FR546–FR567**
    - Interface languages and authored content — FR546–FR552; regional settings — FR553–FR558
    - Currency behavior — FR559–FR565; localization readiness — FR566–FR567
14. **Workflow catalog and definition lifecycle — FR568–FR596**
    - Catalog, Workflow creation, blank canvas, discovery, and status — FR568–FR574
    - Naming/history — FR575–FR577; deletion/archive/reactivation — FR578–FR584
    - Duplication — FR585–FR589; version history/restoration — FR590–FR593; quota behavior — FR594–FR596
15. **Active Process live-version concurrency — FR597–FR618**
    - Open-Form version and assignment checks — FR597–FR605
    - Publication-time open-Task assignment changes — FR606–FR611
    - Publication and Task-write serialization — FR612–FR618
16. **Informational Task Forms and publication validation — FR619–FR632**
    - Instruction Text, Display Value, read-only rendering, and acknowledgment — FR619–FR623
    - Meaningful Form content, structured controls, rules, dependencies, constraints, and draft preservation — FR624–FR632

### Complete Functional Requirement List

FR1: Member participation — Every active Organization Member can belong to Teams, receive Tasks through direct or Team assignment, complete authorized Tasks, and start Workflows for which the Member is an Authorized Starter.
FR2: Designer capabilities — A Designer has all Member capabilities and can create, configure, validate, publish, and maintain every Workflow definition, Form, Process Field, Calculation, and reusable Organization list in the Designer's Organization.
FR3: Administrator capabilities — An Administrator has all Designer capabilities and can manage Organization users, Teams, assignments, open Task reassignment, process-instance operations, and other operational administration.
FR4: Owner capabilities — An Owner has all Administrator capabilities and can manage Organization ownership, ownership transfer, billing configuration when introduced, and critical Organization settings.
FR5: Owner continuity — An Organization must retain at least one active Owner. The final active Owner cannot be deactivated, deleted, or stripped of ownership until another active Owner has been designated.
FR6: Process participation independent of access level — Owners, Administrators, and Designers can belong to Teams and can be directly or indirectly assigned Tasks because all three inherit Member participation capabilities.
FR7: Password recovery and change — A user can request a secure forgot-password recovery email and can change their password while authenticated. A recovery response must not disclose whether an email address belongs to an account.
FR8: User deletion and deactivation — A user may be physically deleted only when the user has no historical instance, Workflow-creation, Task, file, or audit-data relationship, including authorship references such as `Created By`. A referenced user must instead be deactivated so that historical identity and audit integrity remain intact.
FR9: Effects of deactivation — A deactivated user cannot authenticate, receive new Tasks, or start Workflow instances. The user may later be reactivated without losing historical relationships.
FR10: Deactivation safeguards — Before deactivation, Moviqo must identify the user's directly assigned or claimed open Tasks and block deactivation until those Tasks have been reassigned. Related Team and published-Workflow assignment impacts must be presented for administrative resolution.
FR11: Participant instance overview — A Member can view a limited progress overview for instances the Member started or participated in, including the instance identifier, overall status, and current process position.
FR12: Own contribution access — A Member can view the Tasks the Member completed and the Process Field values and attachments submitted through those Tasks.
FR13: Task access boundary — A Member can open an active Task only when it is assigned directly to that Member or is available to an eligible Team to which the Member belongs. Participation in another Task from the same instance does not grant access.
FR14: Process-data exposure — A participant can access Process Fields only through an authorized Task or another explicitly authorized instance view. A participant cannot inspect data entered exclusively through another user's Task merely because both Tasks belong to the same instance.
FR15: Administrative instance access — Owners and Administrators can inspect all Organization instances and Tasks for operational support. Such access must be recorded in the audit history where it involves a data view or operational action.
FR16: Designer production-data boundary — Designer access to a Workflow definition does not automatically grant access to the Workflow's production instances or business data. A Designer receives production access only through normal participation or an additional administrative access level.
FR17: Authorized Starters — A Workflow can authorize all active Organization Members, selected active Teams, and/or selected active individual Members to start production instances.
FR18: Publish validation — A Workflow cannot be published without at least one valid Authorized Starter configuration.
FR19: Member and Designer start authorization — Members and Designers can start a published Workflow only when authorized directly, through an authorized Team, or through an all-active-members configuration.
FR20: Operational start authority — Owners and Administrators can start any published Workflow for operational support even when they are not listed as Authorized Starters.
FR21: Start audit — Every production-instance creation must record the Organization, Workflow and published version, new instance identifier, initiating user, initiation time, and whether Owner or Administrator operational authority was used.
FR22: No public initiation in MVP — The MVP supports authenticated Organization Members only. Anonymous, guest, and public-form initiation are deferred.
FR23: Startable Workflow visibility — In the start-Workflow area of the dashboard, Members and Designers can see only published Workflows they are currently authorized to start. Owners and Administrators can see every published Workflow in the Organization.
FR24: Assigned-instance visibility — A Member who has a directly assigned Task, or is eligible for a Task assigned to one of the Member's Teams, can see that specific instance in the Member's work and instance views together with the limited progress information defined by FR-011.
FR25: Assignment does not grant start authority — Visibility of an instance because of Task assignment does not make the underlying Workflow available for the Member to start unless the Member is also an Authorized Starter.
FR26: Dashboard separation — The dashboard must distinguish Workflows available to start, Tasks requiring the Member's attention, and running or historical instances the Member is authorized to follow.
FR27: Team Task availability — When a Task is assigned to a Team, it becomes Available to every active Member of that Team.
FR28: Claim before work — A Team Member must successfully claim an Available Team Task before entering or changing its form data, saving progress, or completing it.
FR29: Exclusive claim — Claiming a Team Task assigns responsibility to one active Team Member. Moviqo must prevent two Members from successfully claiming the same Task.
FR30: Claimed Task access — After a Team Task is claimed, other Team Members can see that it has been claimed but cannot edit or complete it unless it is subsequently reassigned to them.
FR31: Claim audit — Moviqo must record the Team, claiming Member, and claim timestamp in the Task and instance audit history.
FR32: Deferred assignment strategies — Collaborative editing, round-robin assignment, workload balancing, automatic assignment, and other advanced Team assignment behaviors are outside the MVP.
FR33: Team administration — Owners and Administrators can create, rename, manage membership for, and deactivate Teams within their Organization.
FR34: Multiple Team membership — An active Member can belong to multiple active Teams in the same Organization.
FR35: Designer Team usage — Designers can select valid active Teams while configuring authorized Workflows but cannot change Team definitions or membership unless they also have Administrator or Owner access.
FR36: Historical Team preservation — A Team referenced by historical Workflow, Task, instance, or audit data cannot be physically deleted. It can be deactivated while its stable identity and historical relationships remain intact.
FR37: Team deactivation safeguard — Moviqo must block Team deactivation while the Team has open Tasks. An Owner or Administrator must reassign those Tasks before deactivation.
FR38: Valid Team reference — A Team must be active and contain at least one active Member to be a valid production Task assignee or Authorized Starter when a Workflow is published.
FR39: Specific Member assignment — A Designer can configure a Task for assignment to one specific active Organization Member.
FR40: Specific Team assignment — A Designer can configure a Task for assignment to one valid active Team, after which the claiming requirements in FR-027 through FR-031 apply.
FR41: Workflow Initiator assignment — A Designer can configure a Task for assignment to the active Member who started the current Workflow instance.
FR42: User Reference assignment — A Designer can configure a Task for dynamic assignment to the Organization Member stored in a User Reference Process Field in the current instance.
FR43: Runtime assignment validation — When a Task becomes active, Moviqo must resolve its configured assignment and verify that the resulting Member or Team is active and belongs to the same Organization as the instance.
FR44: Needs Reassignment state — If an assignment is empty, inactive, invalid, or cannot be resolved, the Task must enter `Needs Reassignment` and must not be editable or completable until an Owner or Administrator resolves it.
FR45: Administrative reassignment inbox — Every `Needs Reassignment` Task must appear in the instance-management inbox of the Organization's Owners and Administrators, with the affected Workflow, instance, Task, assignment failure reason, and time of failure.
FR46: Manual reassignment — An Owner or Administrator can manually reassign an open Task to a valid active Member or Team. A Member assignment makes the Task assigned to that Member; a Team assignment makes it Available for Team claiming.
FR47: Reassignment effects — Reassignment must preserve existing Task and instance data, remove active Task access from the previous assignee when applicable, grant access to the new assignee or Team, and record the administrator, previous assignment, new assignment, timestamp, and reason in the audit history.
FR48: Short Text field — A Designer can define a Short Text Process Field and configure its label, help text, placeholder, default value, minimum length, and maximum length. A new field defaults to a minimum of zero and a maximum of 255 characters; the Designer can configure narrower limits, but the platform maximum remains 255 characters.
FR49: Friendly text validation — A Designer can apply user-friendly predefined Short Text validation formats, including email address, telephone number, URL, alphabetic text, and alphanumeric text. Validation feedback must be expressed in non-technical language.
FR50: No raw patterns in MVP — Direct entry of regular expressions or executable custom text-validation code is outside the MVP.
FR51: Long Text field — A Designer can define a Long Text Process Field for multiline plain-text input and configure its label, help text, placeholder, default value, minimum length, and maximum length. A new field defaults to a minimum of zero and a maximum of 10,000 characters; the Designer can configure narrower limits, but the platform maximum remains 10,000 characters.
FR52: Rich text deferred — Rich-text editing, embedded HTML, and arbitrary formatted content are outside the MVP.
FR53: Calculations remain separate — Short Text and Long Text fields are user-entered fields and do not gain a calculation mode. Derived values must use a separate Calculated Field capability.
FR54: Common conditional behavior — Short Text and Long Text fields must support the common Form visibility, editability, and conditional-required behavior defined later in this PRD.
FR55: Integer platform range — An Integer Process Field accepts whole numbers from `-999,999,999,999,999` through `999,999,999,999,999`. An empty Designer-defined minimum or maximum means the corresponding platform boundary applies.
FR56: Designer numeric constraints — A Designer can configure narrower minimum and maximum values within the platform-supported range. Moviqo must prevent publication when configured numeric constraints fall outside the platform range or the minimum exceeds the maximum.
FR57: Validation before persistence — Moviqo must validate numeric type, platform range, and configured field constraints in both the user interface and the server before persistence. An invalid numeric value cannot be saved as a draft or submitted to complete a Task, and the user must receive a clear field-level message.
FR58: Accepted-value storage guarantee — Every numeric value accepted by server validation must be representable by the persistence layer and must not later fail because of numeric overflow or incompatible precision.
FR59: Numeric field types — A Designer can define Integer, Decimal, and Currency Process Fields with an optional default value and editable minimum and maximum constraints.
FR60: Integer business defaults — A new Integer field defaults to a minimum of `0`, a maximum of `999,999,999`, no decimal places, and an empty default value.
FR61: Decimal business defaults — A new Decimal field defaults to a minimum of `0.00`, a maximum of `999,999,999.99`, two permitted decimal places, and an empty default value.
FR62: Currency business defaults — A new Currency field defaults to a minimum of `0.00`, a maximum of `999,999,999.99`, an empty default value, the Organization default currency, and the standard decimal precision of that currency, normally two places. A Currency field must have one valid configured ISO currency code before publication.
FR63: Negative-value option — New numeric fields reject negative values by default. A Designer can enable negative values, which initially changes the minimum to the negative equivalent of the default maximum, and can then configure a different valid minimum.
FR64: Empty is not zero — Moviqo must preserve the distinction between an empty numeric value and zero and must not insert zero unless the Designer configured zero as the field's default value.
FR65: Organization-consistent numeric display — Moviqo displays decimal separators, grouping separators, and currency presentation according to the Organization regional format rather than the viewing user's interface language, without changing the stored value.
FR66: Numeric reuse — Integer, Decimal, and Currency fields can be referenced by Calculated Fields, Form conditions, validation rules, and Conditional Routing.
FR67: Date field — A Designer can define a Date Process Field that stores a calendar date without a time component.
FR68: Date-Time field — A Designer can define a Date-Time Process Field that represents an exact date and time.
FR69: Date defaults — A new Date or Date-Time field has an empty data default. A Designer can instead configure a fixed value, `Today` for a Date, or `Now` for a Date-Time.
FR70: Date boundaries — A Designer can configure minimum and maximum values using fixed dates or times, `Today` or `Now`, a positive or negative number of days relative to those values, or another compatible Date or Date-Time Process Field.
FR71: Supported date range — Moviqo supports Date and Date-Time values from January 1, 1900 through December 31, 2100, and must reject out-of-range values before persistence.
FR72: Organization-consistent date display — Date values display according to the Organization regional format. Date-Time values use the same regional format and the Organization's configured timezone while preserving the represented instant.
FR73: Date validation — Invalid, out-of-range, or constraint-violating Date and Date-Time values cannot be saved as a draft or submitted to complete a Task and must produce a clear field-level message.
FR74: Date reuse — Date and Date-Time fields can be referenced by Form conditions, Conditional Routing, validation rules, and supported calculations such as the elapsed days between two dates.
FR75: Date entry methods — Every Date and Date-Time control supports manual entry using the Organization regional format and an on-demand calendar picker without requiring the Designer to choose an entry mode.
FR76: Date-Time entry — A Date-Time control combines the Date entry methods with an appropriate time selector.
FR77: Date constraint feedback — Calendar choices outside the configured or platform range are unavailable, and equivalent manually entered values receive the same validation result.
FR78: Responsive date input — Moviqo may use an appropriate native date or time selector on supported mobile devices while preserving the same validation and stored value.
FR79: Yes/No field — A Designer can define a Yes/No Process Field whose value is empty, Yes, or No until Form validation requires a definitive answer.
FR80: Explicit selector presentation — The default Yes/No presentation displays explicit Yes and No choices and begins with no selection unless the Designer configured a default.
FR81: Confirmation presentation — A Designer can instead present a Yes/No field as a confirmation checkbox, where checked means Yes and unchecked means No.
FR82: Required Yes/No behavior — A required explicit selector must contain either Yes or No before Task completion. A required confirmation checkbox must be checked before Task completion.
FR83: Configurable default — A Designer can leave the data default empty or configure Yes or No as the initial value.
FR84: Yes/No reuse — A Yes/No field can be referenced by Form conditions, validation rules, Calculated Fields, and Conditional Routing.
FR85: Separate Choice field types — Single Choice and Multiple Choice are separate Process Field types and separate Form controls. Single Choice stores one option identifier; Multiple Choice stores zero or more option identifiers.
FR86: Choice sources — A Designer can configure either field type with Workflow-local options or with an Organization Choice List reusable by multiple Workflows.
FR87: Choice List management scope — Organization Choice Lists belong exclusively to one Organization and are manageable by Designers, Administrators, and Owners. Their exact navigation and management screens are deferred to UX design.
FR88: Stable option identity — Every option has a stable internal identifier, current display label, display order, and active or inactive state. Process data stores the stable identifier rather than the label.
FR89: Current-label display — Instance Forms and views resolve stored option identifiers to the option's current label, including for historical instance data.
FR90: Option label audit — Renaming an option must record its old label, new label, actor, and timestamp in audit history.
FR91: Used option preservation — An option referenced by Process Data, a Workflow condition, routing, or audit history cannot be physically deleted. An inactive option remains resolvable and visible for existing values but is unavailable for new selections.
FR92: Live Organization List additions — An active option added to an Organization Choice List becomes available for new selections in every referencing Form, including Forms in already-running instances, when the Form is next loaded or the user refreshes the page. Real-time updates to an already-open Form are not required.
FR93: Workflow-local option updates — Changes to Workflow-local options require publication of the changed Workflow. Active instances use the updated options when they next load the newest published Form according to the active-instance update policy.
FR94: Choice defaults and validation — A Choice field begins empty unless a valid active default is configured. Multiple Choice can define minimum and maximum selection counts.
FR95: Large-list usability — A Choice control provides option search when its current source contains more than ten active options. Controls with ten or fewer active options can present the complete selectable list without search.
FR96: Choice reuse — Choice values can be referenced by Form conditions, validation rules, Calculated Fields where supported, and Conditional Routing. Multiple Choice conditions include membership tests such as “contains option.”
FR97: User Reference field — A Designer can define a User Reference Process Field that stores one Organization Member's stable membership identifier.
FR98: Same-Organization selection — A User Reference control provides a searchable list containing only active Members of the current Organization.
FR99: Optional Team restriction — A Designer can restrict a User Reference field so that selectable Members must belong to one or more configured active Teams.
FR100: User Reference default — A new User Reference field has an empty default value.
FR101: Current identity display — Forms and instance views resolve a stored membership identifier to the Member's current display name.
FR102: Inactive historical reference — If a referenced Member becomes inactive, existing User Reference values remain visible with an inactive indicator, but that Member is unavailable for new selections.
FR103: Dynamic assignment use — A User Reference field can supply the runtime assignee for a Task according to FR-042 through FR-045.
FR104: Assignment eligibility — When a dynamic Task becomes active, its referenced Member must remain active and must satisfy any Team restriction configured on the User Reference field. Failure places the Task in `Needs Reassignment`.
FR105: User Reference conditions — User Reference values can be compared by supported Form conditions and Conditional Routing.
FR106: Single Member scope — A User Reference field selects one Member. Selecting multiple Members through one field is outside the MVP.
FR107: Workflow Process Field catalog — The Form Designer must provide a simple organized view of Process Fields already defined for the current Workflow.
FR108: Create or reuse — When adding a Form control, a Designer can create a new Process Field or select an existing compatible Process Field without duplicating its instance data.
FR109: Clear field organization — The Designer experience must clearly distinguish fields used in the current Form, active Workflow fields available for reuse, and inactive fields eligible for reactivation. Exact navigation and visual treatment are deferred to UX design.
FR110: Control removal preserves data — Removing a Process Field control from a Task Form changes that Task's presentation but does not delete the Process Field, its instance values, or its attachments.
FR111: Reused value visibility — When an existing Process Field is placed in a later authorized Task Form, the Form displays the same current instance value, including existing File Attachments, without requiring duplicate entry or storage.
FR112: Task-specific presentation — Each Task Form can configure an included Process Field as visible, conditionally visible, editable, read-only, required, or optional without changing the field's stable identity.
FR113: Inactive field reactivation — A historically preserved inactive Process Field can be reactivated with its stable identity and surviving instance values. The Designer chooses where and how to place it in active Task Forms.
FR114: Explicit attachment removal — An uploaded file is removed from current Process Data only through an explicit authorized removal action, not merely because its control is absent from a later Form. Removal clears the current reference, queues binary deletion after successful persistence, and retains audit metadata.
FR115: File Attachment field — A Designer can define a File Attachment Process Field that holds one or more private files and their metadata for a Workflow instance.
FR116: Basic attachment properties — The primary Designer properties are label, help text, required or optional, allowed high-level file categories, and maximum file count.
FR117: Attachment defaults — A new File Attachment field defaults to optional, a maximum of five files, a maximum of 10 MB per file, and a maximum combined field size of 25 MB.
FR118: Configurable attachment limits — A Designer can configure a maximum of one through ten files, lower per-file and total-size limits, and narrower allowed file extensions through progressively disclosed advanced properties.
FR119: Platform file allowlist — The MVP platform can accept PDF; JPG, PNG, and WebP images; DOCX, XLSX, and PPTX Office documents; and TXT and CSV data files. Executables, scripts, HTML, macro-enabled Office files, and compressed archives are prohibited.
FR120: Server file validation — Moviqo must validate actual file type and size on the server rather than relying on filename extensions or browser validation.
FR121: Private file authorization — A file must remain private and can be previewed or downloaded only by a user authorized to access the Process Field through the related Task, instance, or administrative authority.
FR122: Malware inspection — An uploaded file remains unavailable while malware inspection is pending and must not become previewable or downloadable if inspection fails.
FR123: Supported preview — Moviqo provides in-application preview for supported images and PDFs. Other accepted files are available through authorized download.
FR124: Attachment audit — Upload, explicit removal, preview, and download events must record the Organization, Workflow, version, instance, Task and Process Field where applicable, file identifier and metadata, actor, timestamp, and action.
FR125: Designer simplicity — Security, authorization, malware inspection, audit, and storage cleanup are automatic platform behavior and are not exposed as technical Designer parameters.
FR126: Data Table field — A Designer can define a Data Table Process Field containing a configured set of columns and zero or more instance rows.
FR127: Row-count validation — A Designer can configure optional minimum and maximum row counts. A new table is optional with a minimum of zero rows; making it required sets an initial minimum of one valid row.
FR128: Valid-row requirement — An empty row or a row containing unresolved field-validation errors does not satisfy the table's minimum-row requirement.
FR129: Row operations — An authorized user can add, edit, and remove rows while the Data Table is enabled and editable in the current Task Form.
FR130: Supported column types — MVP Data Table columns can use Short Text, Integer, Decimal, Currency, Date, Date-Time, Yes/No, Single Choice, User Reference, and Calculated types.
FR131: Column validation — Each non-calculated column uses the defaults and validation properties applicable to its field type and can be configured as required or optional.
FR132: Table reuse — Reusing the same Data Table Process Field in a later authorized Task displays the instance's existing rows without duplicating them.
FR133: Table-level conditions — A Data Table control can be conditionally visible, enabled or disabled, and required or optional according to common Form rules.
FR134: Column visibility — Conditional visibility applies to an entire column and can reference compatible Process Fields outside the table. Individual cells and rows cannot be conditionally hidden in the MVP.
FR135: Conditional cell behavior — A column can define enabled or disabled and required or optional rules that are evaluated for each row and can reference compatible Process Fields outside the table and values from the same row.
FR136: Conditional validation — Cells in a hidden column and conditionally disabled cells do not apply required validation. When the corresponding column or cell becomes visible and enabled again, its applicable required validation resumes.
FR137: Calculated columns — A Calculated column can use a visual formula referencing compatible values from the same row, such as `Quantity × Unit price`, and is read-only to the Task participant.
FR138: Table aggregates — Supported table aggregates are count, sum, average, minimum, and maximum over compatible column values.
FR139: Table audit — Adding, editing, and removing rows must record the instance, Task, Data Table, stable row identity, changed values, actor, and timestamp in transactional audit history.
FR140: No executable table logic — Arbitrary scripts, custom executable code, and arbitrary cross-row conditions or calculations are outside the MVP. Supported aggregates remain available through FR-138.
FR141: Deferred Data Table capabilities — Conditional cell or row colors, File Attachment, Long Text, and Multiple Choice cells, nested tables, spreadsheet import/export, and individual-cell or row visibility are deferred.
FR142: Simple table configuration — The Designer presents common table and column properties first and progressively discloses row limits and conditional rules as advanced configuration.
FR143: Calculated Field — A Designer can define a read-only Calculated Process Field with a Text, Integer, Decimal, Currency, Date, or Date-Time result type.
FR144: Visual formula builder — A Designer creates a formula by selecting compatible Process Fields, operators, and supported functions through a visual builder without writing executable code.
FR145: Numeric operations — Supported numeric operations are addition, subtraction, multiplication, division, parentheses, and rounding to configured precision.
FR146: Text and date operations — Supported non-numeric operations are joining field values with fixed text, adding or subtracting days from dates, and calculating elapsed days between dates.
FR147: Table calculation access — A Calculated Field can use the count, sum, average, minimum, and maximum aggregates defined by FR-138. Calculated Data Table columns use the same calculation rules with current-row scope.
FR148: Automatic recalculation — Calculated values recalculate when referenced data changes, and the server must recalculate them before persistence, Task completion, or Conditional Routing evaluation.
FR149: Calculation dependency validation — The formula builder must prevent incompatible references where possible, and Moviqo must block publication for missing, incompatible, or circular calculation dependencies.
FR150: Empty-source behavior — An empty referenced value normally produces an empty calculated result rather than a calculation error. A required Calculated Field still blocks Task completion until its inputs produce a valid result.
FR151: Runtime calculation errors — Division by zero and other runtime calculation failures produce a field-level error and an empty calculated value. Moviqo must never persist `Infinity`, `NaN`, executable output, or error text as a Process Field value.
FR152: Draft calculation recovery — Save Draft can preserve valid user-entered source values and a separate calculation-error state, but cannot persist an invalid or stale calculated result.
FR153: Completion and routing safety — A Task cannot complete and routing cannot evaluate while a required Calculated Field has a runtime error.
FR154: Calculation audit — Persisted calculation results must be attributable in audit history to the Workflow version and formula definition used.
FR155: Deferred calculation capabilities — Nested conditional branches, arbitrary scripts, and custom executable functions are outside the MVP. Pedagogical visual IF/THEN/ELSE branches are supported according to Section 4.11.
FR156: Shared logical condition builder — Form conditions, conditional calculations, Form Validation Rules, and Conditional Routing share the same pedagogical builder for the logical IF portion: typed Field, logical or comparison Operator, Value, and All or Any grouping. Each context provides its own valid result editor.
FR157: Contextual natural-language sentence — A rule is presented as a localized sentence using selectable tokens equivalent to `IF [Field] [Operator] [Value] THEN [context-specific result]`. Form properties select a property state, calculations produce a typed value or expression, validation blocks completion with a message, and routing selects a path to a valid Workflow element.
FR158: User-facing terminology — The builder uses user-facing terms such as Field, is equal to, is greater than, contains, is empty, Then, and Otherwise rather than technical variable names or expression syntax.
FR159: Pedagogical examples — The builder must provide localized inline examples or starter templates. A Spanish example is: `Si [Monto] es mayor que [10.000] entonces [Justificación] es [Requerida]; si no, [Justificación] es [Opcional]`.
FR160: Ordered branches — A Designer can add ordered IF and ELSE IF branches followed by an ELSE branch. Branches evaluate from top to bottom and the first true branch determines the result.
FR161: Deterministic fallback — A conditional calculation requires an ELSE result. Conditional Routing requires its default path. For binary Form-property rules, Moviqo may automatically provide the opposite fallback state.
FR162: Context-appropriate results — Form rules produce supported property states such as visible, enabled, or required; Calculated Fields produce a value compatible with their configured result type; Form Validation Rules produce a blocking message; Conditional Routing performs no data operation and selects a valid outgoing path whose target is an active Task, End, or another Conditional Routing element.
FR163: All or any conditions — A branch can require that all configured conditions are true or that any configured condition is true.
FR164: Localized preview — A Designer can preview the complete rule as a readable localized sentence and test it with sample values before publication.
FR165: Rule validation — Moviqo must block publication for incompatible field types, missing references, invalid result types, unresolved paths, or circular dependencies.
FR166: Non-executable internal translation — Moviqo translates the visual rule into a safe internal representation understood by the application. Designers cannot enter or execute JavaScript, raw expressions, or other executable code.
FR167: No nested branches in MVP — Branches can be ordered but cannot contain another IF/THEN/ELSE structure inside their condition or result during the MVP.
FR168: Common Form defaults — A new editable Form control defaults to visible, enabled, optional, and empty unless the Designer configures an applicable default value.
FR169: Conditional control properties — A Designer can use the visual rule engine to make a Form control visible or hidden, enabled or disabled, and required or optional.
FR170: Property evaluation order — Moviqo evaluates visibility first, enabled or disabled state second, and required validation third.
FR171: Conditional value retention — Hiding or disabling a control preserves its existing Process Field value unless an authorized user explicitly changes or removes that value through an editable control.
FR172: Conditional required behavior — A hidden or disabled control does not apply required validation. Required validation resumes if the control becomes visible and enabled.
FR173: Draft and completion validation — Missing required values do not prevent Save Draft but do prevent Complete Task. Type, range, structurally invalid value, prohibited file, and server-safety validation still apply during Save Draft.
FR174: Consistent evaluation — Browser and server must evaluate the same visual rule semantics. The server is authoritative before persistence, Task completion, calculation, and routing.
FR175: Rule dependency protection — Moviqo must show where a Process Field is referenced and block its removal while a Form rule, calculation, or routing condition still depends on it.
FR176: Responsive layout grid — Task Forms use a responsive twelve-column layout grid that automatically aligns controls and prevents overlap.
FR177: Type-appropriate Auto width — New controls default to an automatic width appropriate to their type. Standard inputs favor half width for two controls per desktop row; compact inputs such as Yes/No favor quarter width for four controls per row; naturally wide controls such as Long Text, File Attachment, Data Table, and layout components favor full width.
FR178: Designer width override — A Designer can override Auto width using simple user-facing options that map to Full, Wide, Half, Third, Quarter, and Compact widths.
FR179: Compact row density — Compact width occupies two of twelve columns and permits up to six compatible controls in one sufficiently wide desktop row. Width belongs to each control rather than to the row, and a Designer can apply one width to multiple selected controls.
FR180: Responsive reflow — Controls wrap or stack when their configured width is not usable at the current screen size, and become full-width where necessary on mobile devices.
FR181: Required control label — Every data-bound Form control and Data Table column has a user-facing label. Placeholder text does not replace the label.
FR182: Field identity and labels — A Process Field has a Designer-facing name, an automatically generated stable internal identifier, and a default user-facing label.
FR183: Task-specific label override — A Form control can override the default Process Field label for one Task without changing the Process Field identity, value, or labels in other Tasks.
FR184: Automatic label placement — Label placement is automatic in the MVP: above standard controls, beside a confirmation checkbox, above a File Attachment area or Calculated Field value, and in the header for Data Table columns. Mobile retains the accessible automatic placement.
FR185: Label accessibility — A usable accessible label must remain associated with every data-bound control. Arbitrary label positioning and visually hiding labels are outside the MVP.
FR186: Cross-field validation — A Designer can define a Form-level blocking validation rule using the pedagogical visual rule engine when valid individual fields can still form an invalid business-data combination.
FR187: Validation result — When a blocking validation rule matches, Moviqo prevents Task completion, does not evaluate routing, and presents the Designer-authored validation message.
FR188: Related-field highlighting — A Designer can associate a validation rule with relevant Form controls so Moviqo can highlight where the user should correct data.
FR189: Draft behavior — A matching cross-field validation rule does not prevent Save Draft, although Moviqo may display its message while the user edits the Form.
FR190: Validation references — Cross-field validation can reference compatible Process Fields, Calculated Fields, and supported Data Table aggregates from the same Workflow.
FR191: Completion validation sequence — Before completion, Moviqo validates structural input and files, recalculates Calculated Fields, evaluates conditional control state and required values, evaluates cross-field Form Validation Rules, persists successful completion, and only then evaluates Conditional Routing.
FR192: Validation parity and testing — Browser and server must evaluate the same Form Validation Rule semantics, and the Designer can preview and test a rule before publication.
FR193: Validation dependencies — Moviqo must block publication for missing or incompatible validation references and must expose validation-rule usage during Process Field dependency inspection.
FR194: Layout components — The MVP Form Designer provides Section, Heading, Instruction Text, and Divider layout components that do not create or store Process Data.
FR195: Section grouping — A Section can contain related Form controls under an optional title and description, occupies the full available Form width, and uses the responsive layout grid for its children.
FR196: No nested Sections — A Section cannot be placed inside another Section during the MVP.
FR197: Conditional Section state — A Section can be conditionally visible or enabled through the visual rule engine. A hidden or disabled Section applies the corresponding state to its child controls.
FR198: Section validation behavior — Child controls hidden or disabled through their Section do not apply required validation, while their existing Process Field values remain stored.
FR199: Semantic emphasis — A Section or supported layout element can use Normal, Information, Success, Warning, or Danger emphasis, and the visual rule engine can select an applicable semantic emphasis.
FR200: Controlled visual system — Moviqo controls standard typography, spacing, and semantic colors. Arbitrary fonts, unrestricted colors, custom CSS, tabbed Forms, and nested layout containers are outside the MVP.
FR201: Hidden-control reflow — A conditionally hidden control is removed from the visible grid and does not reserve its former space. Following visible controls move forward while preserving their configured order and width.
FR202: Reflow boundaries — Automatic reflow remains within the current Form or Section and does not move controls across Section boundaries.
FR203: Visibility restoration — When a hidden control becomes visible, it returns to its configured sequence position and the visible layout reflows. Other controls retain their configured widths.
FR204: Save Draft action — Every editable Task provides Save Draft, which preserves valid progress without completing the Task or evaluating a Transition or Conditional Routing element.
FR205: Complete Task action — Every completable Task provides one primary Complete Task action that initiates final validation, calculation, persistence, completion, and routing.
FR206: Configurable completion label — A Designer can replace the displayed Complete Task label with Task-specific business wording without changing its completion behavior.
FR207: Business decisions as Process Data — A Designer captures decisions such as authorize, return, or escalate through Process Fields and uses those values in Conditional Routing rather than relying on fixed Moviqo approval actions.
FR208: Completion sequence — Complete Task validates structural input and files, recalculates Calculated Fields, evaluates conditional control state and required values, evaluates cross-field validation, persists valid data, completes and locks the Task, and only then evaluates routing to the next element.
FR209: Failed completion — If any required completion step fails, the Task remains open, no outgoing route is taken, and the user receives actionable feedback without duplicate next Tasks.
FR210: Completion audit — Successful completion records the Organization, Workflow and version, instance, Task, completing Member, completion time, persisted values or value changes according to audit policy, and subsequently selected route.
FR211: Deferred outcome buttons — Multiple custom Task outcome buttons and fixed Approve, Reject, or Request Changes actions are outside the MVP.
FR212: MVP Workflow elements — A Workflow graph contains one Start, one End, one or more Tasks, zero or more Conditional Routing elements, and directed Transitions.
FR213: Minimum valid graph — A Workflow requires exactly one Start, exactly one End, at least one Task, and at least one valid path from Start through a Task to End.
FR214: Start and End cardinality — Start has no incoming Transition and exactly one outgoing Transition to a Task. End has one or more incoming Transitions and no outgoing Transition.
FR215: Task cardinality — Every active Task has at least one incoming Transition and exactly one outgoing Transition whose target is an active Task, Conditional Routing element, or End.
FR216: Conditional Routing cardinality — Every active Conditional Routing element has at least one incoming Transition and at least two outgoing Transitions, including exactly one default path.
FR217: Conditional Routing targets — An outgoing Conditional Routing path can target an active Task, End, or another active Conditional Routing element.
FR218: Conditional Routing evaluation — Non-default paths use typed logical conditions in Designer-defined priority order. The first matching condition wins; the default path wins when no configured condition matches.
FR219: Routing does not mutate data — Conditional Routing selects one outgoing path and does not create, edit, or delete Process Data.
FR220: Chained Routing elements — Conditional Routing elements can chain to split complex logic into understandable visual decisions. Every evaluated condition and selected path must be audited.
FR221: Cycle rules — Cycles containing at least one Task are permitted when a possible exit path to End exists. A cycle composed only of automatically evaluated Conditional Routing elements is prohibited, and every automatic chain must terminate at a Task or End.
FR222: Validation timing — Moviqo validates a Workflow graph when the draft is saved and again when publication is requested.
FR223: Reachability and termination — Every active element must be reachable from Start and must have a possible graph path to End. Disconnected elements and dead ends are publication errors.
FR224: Reference validation — Publication validates active element connections, conditions, default paths, Forms, Process Fields, calculations, Form Validation Rules, Task assignments, Authorized Starters, and other dependencies.
FR225: Automatic-cycle validation — Publication detects and blocks condition-only cycles and any automatic route that cannot terminate at a Task or End.
FR226: Actionable validation display — Validation errors appear in a clear list and highlight the affected canvas element, field, connection, or dependency.
FR227: Invalid draft handling — An invalid draft can be saved for continued design work, but cannot be published.
FR228: Immutable publication — Successful publication creates the next sequential immutable Workflow version. Editing a published Workflow occurs through a new or existing shared draft.
FR229: One shared draft — A Workflow has at most one shared editable draft within its Organization. Private per-Designer branches and draft merging are outside the MVP.
FR230: Draft attribution — The shared draft records who created it, who last modified it, when it was last saved, and the published version from which it originated.
FR231: Explicit version access — The Designer experience distinguishes Edit Draft from View Published. Edit Draft opens the existing shared draft by default; View Published opens the immutable production version.
FR232: Draft status visibility — Workflow listings show the latest published version and whether a shared draft exists, including validation-error status and last-editor information.
FR233: Exclusive edit lease — Only one authorized Designer can actively edit a Workflow draft at a time. The active editor holds an edit lease scoped to that draft.
FR234: Concurrent read-only access — Other authorized Designers can inspect the draft in read-only mode and can see who currently holds the edit lease.
FR235: Draft autosave — Moviqo automatically saves valid configuration edits to the shared draft and displays save state so an editor knows whether changes are persisted.
FR236: Stale lease recovery — An edit lease automatically expires after ten minutes without editor activity or renewal, allowing another authorized Designer to continue.
FR237: Administrative takeover — An Owner or Administrator can force takeover of an active edit lease after confirmation. A Designer can take over an expired lease.
FR238: Stale-write protection — Moviqo must reject an outdated save that would overwrite a newer draft revision and require the editor to reload the current draft.
FR239: Draft collaboration audit — Lease acquisition, release, expiration, takeover, draft discard, save attribution, and publication are recorded in configuration audit.
FR240: Production isolation — Draft edits, validation errors, edit leases, and takeovers do not alter the latest published version or interrupt running production instances.
FR241: Task removal lifecycle — A never-published Task can be physically deleted. A published but never-executed Task can disappear from the current graph while remaining in immutable historical versions. An executed Task removed from the current graph is retained under Inactive Elements.
FR242: Open Task protection — A draft that deactivates a Task can be saved, but cannot be published while any instance has an open Task occurrence at that Task definition.
FR243: Deactivation impact confirmation — Before deactivation, Moviqo shows every active incoming and outgoing Transition and Conditional Routing path that will be affected and requires Designer confirmation.
FR244: Automatic connection cleanup — After confirmation, Moviqo removes the deactivated Task's active Transitions and Conditional Routing destination paths from the current draft.
FR245: No automatic rewiring — Moviqo does not infer or create replacement connections when a Task is deactivated. The Designer must repair the active graph before publication.
FR246: Historical preservation — Deactivation does not delete historical Task occurrences, Form submissions, Process Data, attachments, routing records, or audit history.
FR247: Inactive Task inspection — Inactive Elements exposes the Task's stable identity, prior active versions, execution history summary, deactivation attribution, and preserved dependencies.
FR248: Task reactivation — Reactivating an inactive Task preserves its stable identity, returns it to the active canvas for Designer placement, and requires new valid connections. Previous connections are not restored automatically.
FR249: Active-instance continuation — An active instance remains at its current open Task occurrence and uses the newest published Workflow definition from that execution point when it continues.
FR250: Compatible current-Form update — When an open Task Form loads or refreshes, it uses compatible changes from the newest published definition while preserving existing instance values.
FR251: Immutable completed history — Previously completed Task occurrences and previously selected paths are never reopened, replayed, or rewritten merely because the Workflow definition changed.
FR252: Repeated Task occurrence — If a valid loop reaches the same Task definition again, Moviqo creates a new Task occurrence rather than reopening the completed occurrence.
FR253: Task occurrence identity — Every Task occurrence has a unique execution identifier, references the stable Task definition and Workflow version used, and records an occurrence sequence within the instance.
FR254: Repeated data editing — A later Task occurrence can update the same Process Fields where authorized, while transactional audit preserves the previous values and identifies the occurrence that changed them.
FR255: Version restoration — Restoring an older published version creates a new shared draft based on that version and preserves every existing version and historical instance record.
FR256: Instance State catalog — A Designer can define Workflow-specific Instance States with stable identifiers and user-authored labels. Moviqo does not impose fixed approval or rejection states.
FR257: Initial Instance State — When Instance States are configured, Start specifies the initial state assigned to a newly created instance.
FR258: Transition state property — Every Transition has an optional Set Instance State property. Traversing the Transition applies the configured state; an empty property preserves the current state.
FR259: Current state visibility — Authorized dashboards and instance views display the instance's current Designer-defined state.
FR260: State use and preservation — A used or referenced Instance State cannot be physically deleted. It can be deactivated while remaining resolvable in historical data and audit.
FR261: State-change audit — Every state change records the previous state, new state, Transition, Workflow version, Task occurrence where applicable, actor or system event, and timestamp.
FR262: Task activation audit — Every Task occurrence records its activation timestamp, stable Task definition, occurrence identifier and sequence, Workflow version, and Instance State at activation.
FR263: Assignment audit — Transactional audit records the initial assigned Member or Team and every claim, release where supported, assignment failure, and administrative reassignment.
FR264: Task completion audit — Transactional audit records the completion timestamp, completing Member, Process Data changes, selected Transition, condition evaluations, state before and after routing, and next activated element.
FR265: Loop chronology — Instance history presents repeated Task occurrences as separate chronological events so users can distinguish each pass through a loop.
FR266: Open-view status monitoring — While a Workflow draft is open, Moviqo periodically checks lightweight draft metadata, including draft revision, last save, current edit lease, and whether the draft remains active, was published, or was discarded.
FR267: Polling interval — MVP clients refresh open-draft status approximately every thirty seconds. Real-time collaborative transport is not required.
FR268: New revision notification — When a read-only viewer detects a newer saved draft revision, Moviqo shows that a newer revision is available and offers Reload. It does not silently replace or rearrange the canvas being inspected.
FR269: Published draft transition — When an open draft is published by another authorized user, a read-only view reloads or redirects to the resulting immutable published version with a clear explanation.
FR270: Discarded draft transition — When an open draft is discarded, Moviqo closes the invalid draft view and redirects the viewer to the latest published version or Workflow listing with a clear explanation.
FR271: Lease-state synchronization — An open viewer is notified when editing becomes available. An editor who loses the lease through administrative takeover becomes read-only on the next heartbeat or status check, and stale saves remain rejected.
FR272: No offline push requirement — A user without the Workflow or Moviqo open receives current draft status on the next dashboard or Workflow load; background push notification is not required.
FR273: Deferred live collaboration — Simultaneous multi-user canvas editing, live cursor presence, operation-by-operation canvas streaming, and automatic draft merging are outside the MVP.
FR274: Active instance — A newly started instance has system status Active and remains Active while it can continue through its published Workflow.
FR275: Completed instance — An instance becomes Completed only when execution successfully reaches End. A Completed instance is closed and cannot create additional Task occurrences.
FR276: Cancelled instance — An Active instance becomes Cancelled when an authorized Owner or Administrator cancels it. A Cancelled instance cannot continue routing.
FR277: Needs Attention instance — An instance displays Needs Attention while one or more current Task occurrences have `Needs Reassignment` or another defined blocking operational condition. Resolving every blocking condition returns the instance to Active.
FR278: Available Task — A Task occurrence assigned to a Team has status Available while it is waiting for an eligible active Team Member to claim it.
FR279: Assigned Task — A Task occurrence assigned directly to a Member, or successfully claimed by a Team Member, has status Assigned until work is saved or completion succeeds.
FR280: In Progress Task — Saving Task work changes an Assigned Task occurrence to In Progress while preserving its current assignee.
FR281: Needs Reassignment Task — A Task occurrence with an unresolved or invalid assignment has status Needs Reassignment and cannot be edited or completed until manually reassigned.
FR282: Completed Task — A Task occurrence becomes Completed after successful completion validation and persistence. It is immutable and can be followed only by newly activated downstream occurrences.
FR283: Cancelled Task — Cancelling the parent instance changes every open Task occurrence to Cancelled and prevents further editing, completion, or routing.
FR284: Cancellation authority — Owners and Administrators can cancel an Active or Needs Attention instance after confirmation and entry of a required cancellation reason.
FR285: Cancellation effects — Cancellation atomically records the instance as Cancelled, cancels every open Task occurrence, prevents further routing, and preserves Process Data, attachments, and history.
FR286: Cancellation audit — Cancellation records the cancelling user, reason, timestamp, prior system status, prior Designer-defined Instance State, affected open Task occurrences, and Workflow version.
FR287: No reopen in MVP — Completed and Cancelled instances cannot be reopened or returned to Active during the MVP.
FR288: My Work navigation — The authenticated user workspace provides My Tasks, My Processes, and Start a Process within one My Work area.
FR289: Default landing view — My Tasks is the default My Work view after authentication so Members are immediately focused on actionable work.
FR290: My Tasks contents — My Tasks contains Task occurrences assigned directly to the Member, claimed by the Member, or Available to an active Team to which the Member belongs.
FR291: My Tasks statuses — The My Tasks inbox displays Available, Assigned, and In Progress Task occurrences and provides the applicable Claim Task or Open Task action.
FR292: No completed Tasks in inbox — Completed and Cancelled Task occurrences do not appear in My Tasks and no completed-Task history filter is included in that inbox during the MVP.
FR293: My Processes contents — My Processes contains one row per Process the Member started, currently participates in, or previously participated in through an authorized Task occurrence.
FR294: My Processes defaults — My Processes shows Active and Needs Attention Processes by default and provides a Closed filter for Completed and Cancelled Processes.
FR295: My Processes purpose — My Processes is a secondary tracking view, not an action inbox. It shows the Process identifier, Workflow name, system status, Designer-defined Instance State, current process position, start date, and last activity within the Member's authorized visibility.
FR296: Process detail access — Opening a My Processes row displays the limited authorized overview and timeline, including the Member's own contributions, without granting access to another Member's Task Form or private Task data.
FR297: Team eligibility visibility — A Process is visible while a Member is eligible to claim its current Team Task. If another Member claims that Task, the Process ceases to be visible unless the viewing Member started or previously participated in it.
FR298: Start a Process — Start a Process lists only published Workflows the Member is authorized to start; Owners and Administrators can start any published Workflow according to FR-020.
FR299: Administrative runtime views — Owners and Administrators receive Needs Attention and All Processes operational views with search and filters for Workflow, system status, Instance State, assignee, initiator, and date.
FR300: Designer data boundary — Designer access does not add production rows to My Processes or administrative runtime views unless the user participates normally or also has Administrator or Owner access.
FR301: Deferred dashboard customization — Custom dashboards, user-configurable widgets, and advanced analytics are outside the MVP.
FR302: My Tasks columns — My Tasks displays Task name; Workflow name and Process number; direct or Team assignment; Designer-defined Instance State; Task system status; activation date and time; and the applicable Claim Task or Open Task action.
FR303: My Tasks search — A Member can search My Tasks by Task name, Workflow name, and Process number.
FR304: My Tasks filters — My Tasks can be filtered by Available, Assigned, or In Progress status; direct or Team assignment; Team; Workflow; Instance State; and activation-date range.
FR305: My Tasks sorting — My Tasks can be sorted by activation date, Task name, Workflow, Instance State, and Task status. The default sort presents the oldest actionable Tasks first.
FR306: My Processes columns — My Processes displays Process number; Workflow name; the Member's involvement as Initiator, Current Participant, or Previous Participant; current process step; Designer-defined Instance State; system status; start date; last activity; and View Process action.
FR307: My Processes search and filters — My Processes supports search by Workflow name and Process number and filters for Active, Needs Attention, Completed, or Cancelled; Started by Me or Participated In; Workflow; Instance State; start-date range; and last-activity range.
FR308: My Processes sorting — My Processes can be sorted by Process number, start date, last activity, Workflow, system status, and Instance State. The default sort presents the most recently updated Processes first.
FR309: Needs Attention columns — Needs Attention displays Workflow and Process number; blocked current Task; operational problem; expected assignment rule; Instance State; time waiting; and Reassign or View action.
FR310: All Processes columns — All Processes displays Process number; Workflow; system status; Instance State; current step; current assigned Member or Team; initiator; start date; last activity; and authorized operational actions.
FR311: Administrative filters — Needs Attention and All Processes support applicable filters for Workflow, system status, Instance State, current assigned Member or Team, initiator, assignment-failure reason, Workflow version where meaningful, cancellation status, and relevant date ranges.
FR312: Start Process catalog — Start a Process uses a searchable catalog of authorized Workflow cards showing Workflow name, short description, and Start Process action.
FR313: Table sorting interaction — A sortable column header exposes its current direction and allows ascending or descending sorting. Non-data action columns are not sortable.
FR314: Active filter display — Applied filters are visible as removable filter indicators, and Clear All restores the view's approved defaults.
FR315: Authorized server querying — Search, filtering, sorting, and pagination are applied by the server within the requesting user's Organization and authorization scope and cannot reveal counts or records outside that scope.
FR316: Pagination — Dashboard tables paginate large result sets while preserving the active search, filters, and sort order.
FR317: Responsive dashboard presentation — Desktop and sufficiently wide laptop views use the defined tables. On narrow screens, rows become compact cards that prioritize identifier, status, Task or current step, and primary action while allowing authorized details to expand.
FR318: Deferred table personalization — Saved filter views, user-configurable columns, dashboard export, and multi-column custom sorting are outside the MVP.
FR319: Task notification property — Every Task definition provides an `Email users when this Task becomes assigned or available` configuration property.
FR320: Assignment email default — The Task assignment-email property is disabled by default. A Designer must explicitly enable it for each Task that should send assignment email.
FR321: Individual assignment recipient — When enabled and a Task becomes assigned to an individual Member through configured Member, Workflow Initiator, User Reference, or administrative reassignment, Moviqo emails the newly assigned Member.
FR322: Team availability recipients — When enabled and a Task becomes Available to a Team, Moviqo emails the Team's active eligible Members.
FR323: Reassignment behavior — The same Task property controls email when an open Task is administratively reassigned to a new Member or Team.
FR324: Disabled behavior — When the property is disabled, no assignment or reassignment email is sent. The Task still appears normally in My Tasks and all assignment and audit behavior remains unchanged.
FR325: No retroactive email — Changing the Task property affects future assignment events only and neither sends nor withdraws email for an assignment event that already occurred.
FR326: Assignment source audit — Assignment and notification history identify whether the assignment came from configured Member, Workflow Initiator, User Reference, Team claim or availability, or administrative reassignment.
FR327: Transition notification property — Every Transition can optionally enable `Send notification when this path is taken`; the property is disabled by default.
FR328: Transition notification recipients — A Designer can select the Process initiator, specific active Members, specific active Teams, a Member from a User Reference field, and/or the Member completing the current Task.
FR329: Transition notification content — A Transition email can contain a safe default subject and message, Workflow name, Process number, resulting Instance State where applicable, a secure authorized link, and optional short Designer-authored text.
FR330: No business data in email — Process Field values and attachments are not inserted into email during the MVP.
FR331: Duplicate consolidation — If the same recipient qualifies for both enabled Task assignment email and Transition email during one routing event, Moviqo sends one consolidated email and records both triggers.
FR332: Email localization — System-generated email text uses the recipient's selected interface language with Spanish fallback. Designer-authored text remains in the language entered by the Designer, and business dates, numbers, times, and currencies use the Organization regional settings.
FR333: Delivery tracking — Notification history records the related event, recipient, channel, pending, sent, failed, or configured-suppression status, attempt count, and relevant timestamps.
FR334: Idempotent retry — Moviqo retries temporary email-delivery failures without sending duplicates and exposes permanent failures to Owners and Administrators.
FR335: Deferred channels — WhatsApp, SMS, push notification, and a configurable in-application notification center are outside the MVP.
FR336: Operational email setting — An Organization provides an `Email administrators about operational problems` setting that is disabled by default.
FR337: Dashboard alert remains automatic — A Task entering `Needs Reassignment` always appears in the Owners' and Administrators' Needs Attention view regardless of the Organization email setting.
FR338: Enabled operational email — When the Organization setting is enabled, Moviqo emails active Owners and Administrators when a Task enters `Needs Reassignment`, including the Workflow, Process number, Task, safe failure reason, and secure operational link.
FR339: Team email opt-in confirmation — The disabled-by-default Task notification property applies to both individual assignment and Team availability. Team Members receive availability email only when the Task property is enabled.
FR340: Configuration Audit — Moviqo maintains Organization-scoped Configuration Audit for changes to users, Teams, memberships, Workflow definitions, Forms, Process Fields, reusable lists, visual rules, calculations, Instance States, Transitions, assignments, Authorized Starters, drafts, edit leases, versions, and permissions.
FR341: Transactional Audit — Moviqo maintains Organization-scoped Transactional Audit for Process creation; Task occurrences; assignments, claims, and reassignments; Process Data and file actions; calculations; condition evaluations and selected routes; Instance State changes; Task completion; reaching End; and cancellation.
FR342: Administrative audit access — Owners and Administrators can inspect Configuration Audit and Transactional Audit across their Organization.
FR343: Designer audit access — Designers can inspect Configuration Audit for Workflow definitions in their Organization. Designer access alone does not grant full Transactional Audit or production-data access.
FR344: Member timeline instead of audit — Members receive the simplified authorized Process timeline defined in Section 8.2 rather than access to the complete Transactional Audit.
FR345: Tenant-isolated audit — Audit search, viewing, counts, filtering, and export are restricted to the requesting user's Organization and role authorization.
FR346: Process Detail header — Opening a My Processes row displays Workflow name, Process number, system status, Designer-defined Instance State, current step, start date, and last activity.
FR347: Simplified timeline — An authorized Member timeline can show Process start; Task activation and completion summaries; the Member's own assignments and submissions; Instance State changes; repeated loop occurrences; current waiting step; and Process completion or cancellation.
FR348: Own submission details — A Member can expand the Member's own completed Task occurrence to view the values submitted through that occurrence, submission time, occurrence number, and attachments that remain available and authorized.
FR349: Other-user summary boundary — For another Member's Task occurrence, a regular Member can see only an authorized progress summary such as Task name and completion, and cannot see that user's private Form values, attachments, detailed value changes, assignment administration, condition internals, or notification delivery.
FR350: Loop timeline — Repeated visits to one Task definition appear as separate chronological occurrences so the user can distinguish each pass through the loop.
FR351: Full-audit navigation — Owners and Administrators can navigate from Process Detail to the complete Transactional Audit for that Process.
FR352: Immutable audit entries — Audit records cannot be edited or deleted through Moviqo and remain attributable to their original event.
FR353: Audit search and filters — Authorized audit views support search and filtering by date, actor, Workflow, Process number, Task, event type, and Workflow version where applicable.
FR354: Value-change evidence — Process Data change events preserve appropriate previous and new values, the Task occurrence, actor, timestamp, and Workflow version that produced the change.
FR355: File audit boundary — File audit retains identifiers and metadata required for evidence but does not duplicate binary file contents in the audit record.
FR356: Time representation — Audit timestamps are stored consistently and displayed using the Organization's configured timezone and regional format.
FR357: Secret exclusion — Authentication credentials, reset tokens, application secrets, and other prohibited secret values must never be written into business audit records.
FR358: Audit export — Owners and Administrators can export audit results within their authorization scope while active filters remain applicable.
FR359: Technical log separation — Infrastructure, diagnostic, and application error logs remain separate from Configuration Audit and Transactional Audit.
FR360: Process retention — Active, Needs Attention, Completed, and Cancelled Process records cannot be individually deleted through the MVP application and remain available according to authorization and Organization retention.
FR361: Active Organization retention — While an Organization remains active, Moviqo retains its Workflow definitions, Process Data, available attachments, and audit history except for explicitly authorized removals defined by this PRD.
FR362: No inactivity deletion — Moviqo does not automatically delete an Organization or its business data solely because users have been inactive.
FR363: Explicit file deletion — Explicitly removing an attachment clears its current Process Data reference and deletes its binary object according to FR-114 while retaining minimal immutable audit metadata.
FR364: Complete Organization export — An Owner can request an Organization export containing Workflow definitions, Process Data, audit records, and authorized attachments in documented portable formats.
FR365: Secure export delivery — Complete export generation occurs as a protected background operation and provides a temporary private download available only to an authorized Owner.
FR366: Closure authority — Only an Owner can request Organization closure, after explicit confirmation. Members, Designers, and Administrators cannot delete the Organization.
FR367: Pre-closure export — The closure experience offers the Owner an Organization export before destructive deletion proceeds.
FR368: Reversible closure window — Organization closure enters a thirty-day recovery window during which an authorized Owner can reverse the closure.
FR369: Final active-data deletion — After the recovery window, Moviqo removes active Organization data and binary objects from production storage according to a controlled deletion process.
FR370: Backup expiration after closure — Copies remaining in disaster-recovery backups expire through the approved backup-retention schedule and are not exposed through normal application access.
FR371: Beta data responsibility — Beta terms state that the customer and its Designers are responsible for the lawfulness and appropriateness of Process Data they collect, while Moviqo remains responsible for agreed platform safeguards.
FR372: Prohibited beta data — The public beta prohibits passwords and authentication secrets, payment-card data, government-issued identifiers, health information, and other highly sensitive or regulated data, and the Form Designer presents a clear reminder of this restriction.
FR373: Evolution through revision — These MVP retention and export rules can be changed only through a documented future product revision and must not silently alter existing customer commitments.
FR374: Strong password length — Because the MVP uses password-only authentication, a new or changed password must contain at least 15 characters and may contain up to 128 characters.
FR375: Passphrase-friendly input — Passwords may contain spaces and supported Unicode characters. Moviqo must not require arbitrary combinations of uppercase letters, lowercase letters, numbers, or symbols.
FR376: Weak-password blocking — Moviqo rejects passwords found in an approved blocklist of common, expected, or known-compromised values and provides a clear, non-sensitive reason to choose another password.
FR377: Password usability — Registration, password change, and password reset support password-manager generation and autofill, pasted passwords, and an optional show-password control.
FR378: Password-change policy — Moviqo does not require periodic password changes unless there is evidence of compromise or an authorized user requests a reset.
FR379: Credential protection — Passwords are stored only using an approved salted password-hashing mechanism and are never stored, returned, audited, or logged in readable form.
FR380: Authentication throttling — Moviqo rate-limits repeated unsuccessful authentication and password-recovery attempts without revealing whether an account exists.
FR381: Secure password recovery — Password-recovery links are time-limited and single-use. A successful password reset invalidates the user's existing authenticated sessions.
FR382: Server-side deactivation — Completing user deactivation immediately marks the user inactive and revokes all of the user's active sessions on the server. No new protected request made with one of those sessions may succeed after the deactivation transaction commits.
FR383: Authorization on protected requests — Every protected server request validates the authenticated session and confirms that the user and relevant Organization Membership remain active before returning protected data or performing an operation.
FR384: Client behavior after revocation — When an open client next contacts the server after session revocation, it receives an authentication failure, clears locally held session credentials, and returns the user to authentication without displaying protected data from the failed request.
FR385: No real-time dependency — Session revocation and deactivation enforcement do not require WebSockets or another persistent real-time channel. An optional lightweight session-status poll may sign an idle open page out sooner, but security enforcement remains server-side on every protected request.
FR386: Session termination — Users can sign out, and expired, revoked, or signed-out sessions cannot be reused.
FR387: Generic authentication errors — Authentication failures use generic messages such as `Email or password is incorrect`, and password-recovery responses remain the same whether or not the submitted account exists.
FR388: No resource-existence disclosure — Authorization and not-found responses must not reveal the existence, identifier, owner, or contents of resources outside the requesting user's Organization and authorization scope.
FR389: Safe unexpected errors — Unexpected application failures return a safe user-facing message and a non-sensitive correlation identifier. They never display stack traces, database statements, internal file paths, infrastructure details, environment values, secrets, session or token contents, or unauthorized Process Data.
FR390: Safe validation errors — Validation errors may identify only fields and constraints the requesting user is authorized to view and must not unnecessarily repeat confidential values.
FR391: Protected diagnostics — Detailed failure diagnostics are available only in access-controlled technical logs and remain separate from Configuration Audit and Transactional Audit.
FR392: Log sanitization — Technical logs, audit records, analytics, and monitoring must exclude or redact passwords, reset tokens, session tokens, cookies, authorization headers, private file-access links, application secrets, and other security credentials.
FR393: Error consistency — Equivalent security failures use consistent status behavior and messages so that response wording, timing, or metadata does not expose cross-tenant or account-enumeration information.
FR394: Organization ownership — Every tenant-owned business record, configuration record, Process, Task occurrence, Process Data value, file, audit entry, notification, and export has one immutable owning Organization. Platform authentication identities may be global, but Organization Memberships and tenant-owned data remain Organization-scoped.
FR395: Trusted Organization context — Every protected server operation derives and validates its Organization context from the authenticated user's active Organization Membership. An Organization identifier supplied by a client is never sufficient authorization by itself.
FR396: Server-enforced permissions — The server enforces applicable role, Workflow, Authorized Starter, Task assignment, Process Data, file, audit, notification, and export permissions for every protected read and mutation. Interface visibility alone is not an authorization control.
FR397: Scoped queries and operations — Database queries, storage operations, background jobs, notification delivery, export generation, search, filtering, sorting, pagination, analytics, and audit processing must retain and validate their Organization context.
FR398: Deny by default — A request or background operation with missing, inactive, ambiguous, or mismatched Organization context is denied without returning or changing tenant-owned data.
FR399: Identifier tampering protection — Guessing, substituting, or modifying a record or file identifier cannot reveal whether another Organization's resource exists and cannot expose its data, metadata, counts, or processing status.
FR400: Organization-limited administration — Owner and Administrator authority is limited to the Organization in which the corresponding access level is active. The MVP provides no customer-facing cross-Organization administrative role.
FR401: Automated isolation coverage — Automated cross-Organization tests cover users and Memberships, Teams, reusable lists, Workflows and versions, shared drafts, Processes, Task occurrences, Process Data, files, dashboards, audits, notifications, background operations, and exports.
FR402: Isolation release gate — A failed or incomplete tenant-isolation test suite blocks public-beta release and production deployment.
FR403: MVP authentication model — The MVP authenticates a user with a verified email address and password, subject to the password, throttling, recovery, and session requirements in Section 10.1.
FR404: Email verification requirement — A new user must verify control of the account email address before authenticating into Moviqo or accessing protected Organization data.
FR405: Verification-link protection — An email-verification link is time-limited, single-use, and invalid after successful verification or replacement by a newer verification link.
FR406: Initial Owner verification — A self-registering initial Owner must verify the account email before the new Organization becomes operational or accepts business data.
FR407: Invited-user verification — Accepting a valid, time-limited, single-use Organization invitation verifies the invited email address as part of account activation. The invitation cannot activate a different email address.
FR408: Email-address change — Changing an account email requires verification of the new address before it becomes the authentication address.
FR409: Verification abuse protection — Verification and invitation resend operations are rate-limited and use responses that do not disclose whether an account or invitation exists.
FR410: MFA deferred — Multi-factor authentication is outside the MVP. No Organization can require or configure an additional authentication factor during the MVP.
FR411: SSO and passkeys deferred — Enterprise single sign-on, identity-provider federation, social sign-in, passwordless authentication, and passkeys are outside the MVP.
FR412: Private storage — File attachments and generated Organization exports are stored in private storage containers or buckets and are never made publicly listable or readable.
FR413: File-request authorization — Every attachment preview or download request validates the active session, owning Organization, relevant Process and Process Field, applicable Task access, and administrative authority on the server before returning file content or temporary access.
FR414: Non-authoritative links — A stable Moviqo application link never grants file or export access by itself. Knowing, copying, guessing, or modifying a link is insufficient without current authorization.
FR415: Temporary storage access — Any temporary storage credential is read-only, scoped to one authorized file and operation, and expires no later than fifteen minutes after issuance.
FR416: Removal revocation — After an authorized attachment removal is successfully persisted, Moviqo immediately denies further application access to the file and queues binary deletion according to FR-114.
FR417: Permission-change enforcement — If a user loses the Organization, Process, Task, field, or administrative permission required for a file, previously copied Moviqo application links no longer provide access.
FR418: Organization-scoped export generation — Organization export generation executes as a protected background operation within the requesting Owner's validated Organization context and cannot include data from another Organization.
FR419: Export availability window — A successfully generated Organization export remains available for no more than twenty-four hours and is then automatically removed from active export storage.
FR420: Owner-only export access — Only an authenticated, active Owner of the export's Organization can obtain or refresh its temporary download access.
FR421: Export audit — Organization export request, generation start, success, failure, download, expiration, and deletion are recorded with Organization, requesting Owner, timestamps, export identifier, and outcome without duplicating exported Process Data in the audit event.
FR422: Export-ready notification — An export-ready email contains no direct public storage link or exported business data. It directs the Owner to authenticate in Moviqo before obtaining temporary download access.
FR423: Downloaded-copy boundary — Moviqo cannot revoke or delete a copy that an authorized user has already downloaded to a device outside Moviqo's control; the export and download experience must make this responsibility clear.
FR424: Encrypted transport — Browser, API, authentication, file, export, and administrative traffic uses HTTPS with provider-supported current TLS. Protected endpoints do not serve protected content over cleartext connections.
FR425: Provider encryption at rest — Production databases, private object storage, generated exports, and backup copies use encryption at rest supplied and maintained by the selected infrastructure providers.
FR426: No custom cryptography — The MVP does not design or implement custom encryption algorithms, password hashing, token signing, or key-management mechanisms when established platform or framework capabilities are available.
FR427: Secret isolation — Password-hashing configuration, database credentials, service keys, API tokens, signing secrets, and other privileged configuration remain outside source code, browser bundles, business audit, analytics, and application logs.
FR428: Server-only privileged credentials — Privileged database, authentication, email, and storage credentials are available only to trusted server-side components, use the least privileges practical for their function, and are never sent to the browser.
FR429: Environment separation — Development and production use separate configuration, credentials, databases, and storage. A development identity or credential cannot access production resources.
FR430: No production data in non-production — Real customer Process Data, attachments, and complete production exports are not copied into development or automated-test environments. Test environments use synthetic or explicitly sanitized data.
FR431: Process Data logging boundary — Diagnostic logs, monitoring, analytics, and error reports exclude Process Field values, attachment contents, export contents, passwords, tokens, and private download credentials by default.
FR432: Safe operational telemetry — Technical event types, safe internal identifiers, durations, outcomes, counts, and correlation identifiers may be recorded when they do not disclose Process Data or cross-Organization information.
FR433: Security configuration validation — Production startup and deployment validate required security configuration and fail safely when critical secrets, private-storage settings, Organization-scope protections, or secure transport protections are missing or invalid.
FR434: OWASP Top 10 baseline — MVP design, implementation review, and security testing consider every OWASP Top 10:2025 category: broken access control, security misconfiguration, software supply-chain failures, cryptographic failures, injection, insecure design, authentication failures, software or data integrity failures, security logging and alerting failures, and mishandling of exceptional conditions.
FR435: OWASP verification catalog — OWASP ASVS 5.0.0 is used as the technical verification catalog. Before public beta, the team identifies and verifies the ASVS Level 1 requirements applicable to Moviqo and documents why any Level 1 requirement is not applicable.
FR436: MITRE ATT&CK SaaS scenarios — Threat modeling uses the MITRE ATT&CK Enterprise SaaS matrix as a source of realistic attack scenarios, including account and credential compromise, web-session cookie or application-token theft, permission abuse, cloud-data collection, exfiltration, service-account misuse, account access removal, and resource hijacking where applicable.
FR437: MVP threat-model scope — Before public beta, a documented threat model covers trust boundaries and sensitive flows for registration and authentication, Organization isolation, Workflow design and publication, Process execution, Task assignment, Process Data, files, exports, notifications, audit, backups, and background operations.
FR438: Security traceability — Applicable OWASP and MITRE risks are mapped to the Moviqo requirement or architecture control that mitigates them, the test or review that verifies the control, and the current result or accepted-risk decision.
FR439: Threat-model maintenance — The threat model and security mapping are reviewed before public beta and updated when architecture, authentication, tenant boundaries, storage, external integrations, or sensitive data flows materially change.
FR440: Framework claim boundary — References to OWASP and MITRE guide risk analysis and verification but do not represent certification, endorsement, or complete protection against every listed attack.
FR441: Explicit deferred-risk handling — A relevant control intentionally excluded from the MVP, including MFA, must be recorded as an accepted product risk with the approved compensating controls and future-review trigger; framework review does not silently expand MVP scope.
FR442: Release-gate scope — The security gates in this section must pass before onboarding the first public-beta customer and before each production release whose changes can affect the corresponding control.
FR443: Isolation gate — The complete automated tenant-isolation suite defined by FR-401 and FR-402 passes without an unresolved failure.
FR444: Identity and authorization gate — Automated tests for registration, email verification, authentication, password recovery, throttling, session expiration and revocation, deactivation, role authorization, Workflow authorization, Task access, and Process Data access pass.
FR445: File, export, and audit gate — Tests for attachment and export authorization, link expiration, removal revocation, Organization scoping, audit attribution, audit immutability through application interfaces, and audit export authorization pass.
FR446: Baseline and threat-review gate — Applicable OWASP ASVS 5.0.0 Level 1 checks are completed, the OWASP Top 10 and MITRE ATT&CK mapping is current, and the threat model contains no unresolved release-blocking risk.
FR447: Dependency and secret scanning — The release candidate is checked for known dependency vulnerabilities and accidentally committed or packaged secrets using automated scanning available to the delivery pipeline.
FR448: Finding severity rule — An unresolved Critical or High security finding blocks release. An unresolved Medium finding also blocks release when it can affect authentication, session security, tenant isolation, authorization, Process Data or file confidentiality, data integrity, or production availability.
FR449: Production-configuration gate — Production security-configuration validation defined by FR-433 passes before deployment can serve customer traffic.
FR450: Gate evidence — The tested release identifier, gate results, scan results, approved not-applicable decisions, accepted non-blocking risks, reviewer, and completion time are retained as release evidence without including secrets or customer Process Data.
FR451: Failed-gate behavior — A failed, incomplete, or unverifiable release-blocking gate prevents public-beta deployment or customer onboarding until remediated and successfully rechecked.
FR452: Daily backup scope — Moviqo creates an automated backup of the production database and private attachment storage at least once every twenty-four hours.
FR453: Encrypted separate destination — Backup copies are encrypted and stored outside the primary production project or equivalent provider failure boundary, using credentials separated from normal application access.
FR454: Backup retention — The MVP retains at least seven recoverable daily backups and four recoverable weekly backups, subject to the Organization-closure expiration rule in FR-370.
FR455: Recovery point objective — The public-beta recovery point objective is twenty-four hours; after a covered production-data loss, Moviqo may lose no more than the data created or changed since the most recent successful daily backup.
FR456: Recovery time objective — The public-beta target is to restore covered production database and attachment service within twenty-four hours after a major recoverable failure is confirmed.
FR457: Restoration verification — A complete restoration test succeeds before onboarding the first customer, quarterly during the beta, and after a material change to database, storage, backup, or restoration architecture. The test restores into an isolated environment and verifies database consistency, representative Processes and audits, attachment availability, and Organization isolation.
FR458: Backup-failure alert — A failed, incomplete, overdue, or unverifiable backup creates an operational alert for the Moviqo operator and remains open until a subsequent verified backup succeeds or the failure is explicitly resolved.
FR459: Export distinction — Customer-requested Organization exports are portability features and do not replace Moviqo's disaster-recovery backups.
FR460: Real-data onboarding boundary — Moviqo does not onboard a beta customer for real business data until a secure backup destination is operating and the initial restoration test has passed. Synthetic-data testing may continue before that gate is satisfied.
FR461: Public landing page — Moviqo provides a public landing page that explains the product without requiring authentication and serves as the primary entry point for MVP beta acquisition.
FR462: Audience and value proposition — The landing page addresses Spanish- and English-speaking SMEs that currently operate processes through spreadsheets, email, printed documents, and manual follow-up. Its primary message is that a non-technical user can turn a process idea into a working Moviqo Workflow simply, securely, and reliably.
FR463: Time-to-value message — The landing page may communicate the approved target that a user can configure and publish a simple Workflow in approximately thirty to sixty minutes, but must present this as a product goal or expected simple-case outcome rather than a guarantee for every process.
FR464: Supported-capability accuracy — Public content describes only MVP-supported capabilities, including Forms, Process Fields, calculations, attachments, Tasks, Team or Member assignment, visual conditions, routing, process tracking, audit, and bilingual use. It must not imply support for deferred capabilities such as arbitrary integrations, WhatsApp, MFA, enterprise SSO, advanced analytics, or fully automatic dynamic assignment.
FR465: Minimum content structure — The landing page contains a concise hero section, business problem and value explanation, How It Works, supported use cases, representative product visuals, security and beta-trust summary, free-beta clarification, and clear actions to start or access Moviqo.
FR466: Representative use cases — Initial use cases include purchase-request review, document intake and review, and an operational service or maintenance request. Each example must be achievable with the approved MVP Workflow, Form, assignment, condition, file, and tracking capabilities.
FR467: Fictional example organizations — Landing-page scenarios and product previews may use fictional organizations, people, Processes, Tasks, amounts, statuses, Forms, and attachments. Every such presentation is labeled clearly as an example, sample, demo, or fictional scenario.
FR468: No fabricated social proof — Moviqo does not present fictional organizations or sample people as real customers and does not publish invented testimonials, customer logos, adoption numbers, security certifications, savings, performance results, or endorsements. Real social proof may be added only with accurate evidence and customer permission.
FR469: Safe mock data — Landing-page and screenshot mock data contains no real customer Process Data, confidential information, live credentials, private links, or personally identifiable information belonging to a real person.
FR470: Initial mock scenario set — The initial landing-page mock set can demonstrate a fictional distributor's purchase request, a fictional services company's document review, and a fictional maintenance company's service request, using visibly fictional names and realistic but invented data.
FR471: Primary application link — The landing page provides a prominent `Start Free Beta` action that redirects to the Moviqo application registration flow.
FR472: Existing-user link — The landing page provides a visible `Sign In` action that redirects to the Moviqo application authentication flow.
FR473: Configurable application destination — Registration and sign-in destinations use environment-specific application URLs so development, preview, and production landing pages cannot accidentally redirect users into the wrong environment.
FR474: Authenticated application boundary — The public landing page does not expose Workflows, Tasks, Processes, Process Data, files, dashboards, audits, or Organization details. Starting a production Process continues to require authenticated Organization Membership according to FR-022.
FR475: Free-beta accuracy and support — The landing page explains that the offer is a limited free beta, not a permanent free-price guarantee, and links to the applicable beta terms, privacy notice, prohibited-data guidance, and a configurable environment-specific support email address before registration. Email is the initial MVP support channel; live chat, a customer ticket portal, and a formal support-response SLA are not required.
FR476: Registration continuity — A user selecting Start Free Beta arrives at the Organization registration and verified-email journey defined by Sections 12.2 and 10.4 without having to search for the next action or re-enter campaign information unnecessarily.
FR477: Bilingual landing page — The landing page supports Spanish and English. Spanish is the default locale, and a visible language selector allows the visitor to change language while remaining on the equivalent page and section.
FR478: Responsive and accessible presentation — The landing page works on mobile, tablet, laptop, and desktop layouts; supports keyboard navigation; preserves visible focus; uses semantic headings and meaningful alternative text; and maintains readable contrast and text sizing.
FR479: Search and sharing metadata — Each supported locale provides an accurate page title, description, canonical metadata, language metadata, and social-sharing preview without making unsupported product or customer claims.
FR480: Lightweight delivery — The landing page prioritizes fast initial rendering and avoids unnecessary large media, scripts, trackers, or dependencies that would undermine use on typical SME mobile and desktop connections.
FR481: Privacy-safe acquisition analytics — If analytics are enabled, Moviqo may measure landing-page views, language selection, use-case engagement, Start Free Beta selection, Sign In selection, registration start, and registration completion without collecting Process Data, form contents, passwords, tokens, or private application URLs.
FR482: Consent and tracker restraint — Non-essential analytics or marketing trackers are disabled until any legally required consent is obtained. The MVP may operate with first-party, privacy-minimizing acquisition events only.
FR483: Marketing-content maintainability — Authorized Moviqo operators can update landing-page copy, locale translations, mock content, links, and metadata through the deployment content source without changing production Workflow or customer data.
FR484: One Organization per account — During the MVP, one Moviqo user account can belong to exactly one Organization and can have exactly one Organization Membership.
FR485: Globally unique account email — A normalized email address identifies one Moviqo account and cannot be used to register or activate a Membership in a second Organization.
FR486: Separate identity for another Organization — A person who needs access to another Organization during the MVP must register a separate Moviqo account using a different email address.
FR487: Persistent Organization association — Deactivating a user preserves the account's association with its original Organization for historical and audit integrity. The deactivated account or its email cannot be reassigned to another Organization during the MVP.
FR488: No Organization switching — The MVP provides no Organization selector, active-Organization switching, cross-Organization dashboard, or account-level aggregation across Organizations.
FR489: Multi-Organization membership deferred — Allowing one user identity to hold Memberships in multiple Organizations is deferred to a future release and will require a new authorization, navigation, invitation, notification, and audit design.
FR490: PADR supersession — FR-484 through FR-489 supersede the PADR decision that one person may collaborate with multiple Organizations through one identity for the MVP.
FR491: Owner registration fields — Start Free Beta registration collects the person's display name, Organization name, globally unique email address, password, preferred application language, Organization regional format, Organization timezone, and Organization default currency.
FR492: Registration defaults — Spanish is the default preferred language. Moviqo may suggest a regional format and timezone from the browser or device and a corresponding default currency, but the registering person must be able to review and change each Organization setting before completion.
FR493: Registration acceptance — Registration requires explicit acceptance of the current beta terms and privacy notice and acknowledgment of the prohibited-data restrictions. Moviqo records the accepted document versions, user, Organization, and timestamp.
FR494: Pending Organization and environment boundary — A self-registered Organization and initial account remain Pending until the registration email is verified. In the controlled Gate 1 internal-beta environment, an eligible verified Organization can activate for synthetic-data testing. In the customer-facing production environment, customer activation and real-business-data entry remain disabled until Gate 2 and the real-data onboarding gate in FR-460 pass.
FR495: Initial Owner activation — Successful email verification activates the eligible Organization and account and grants the first user Owner access, including inherited Administrator, Designer, and Member capabilities.
FR496: Pending-user creation — An active Owner or Administrator can create a Pending user in the current Organization by entering the person's display name, globally unique email address, and initial Member, Designer, or Administrator access level.
FR497: Organization-bound activation — A Pending user is bound to the creating Organization and cannot activate into or be reassigned to another Organization.
FR498: Activation-link lifetime — Creating a Pending user sends a time-limited, single-use activation link to the entered email address. The link expires seven days after issuance and is invalidated when used, revoked, or replaced by a newer activation link.
FR499: User-controlled activation — The activation flow confirms the invited email, allows the user to review the display name, requires the user to create their own password and accept the applicable beta terms and privacy notice, and then changes the user to Active.
FR500: Pending-user restrictions — A Pending user cannot authenticate into protected Moviqo areas, start Processes, receive or claim Tasks, access Organization data, or count as an active Team member.
FR501: Resend and revoke — An Owner or Administrator can resend activation, which invalidates the previous link, or revoke a Pending user before activation. Both actions are audited.
FR502: Password ownership — An Owner or Administrator never creates, receives, retrieves, exports, or views another user's password or activation credential.
FR503: Membership statuses — MVP user Membership status is Pending, Active, or Deactivated. Status changes preserve historical identity and follow the deactivation safeguards in FR-008 through FR-010.
FR504: Administrator privilege boundary — An Administrator can create and manage Members, Designers, and Administrators but cannot create an Owner, grant or remove ownership, deactivate an Owner, or modify ownership-transfer authority.
FR505: Owner management authority — An Owner can manage every non-Owner access level and can transfer ownership only to another active user in the same Organization, subject to the last-active-Owner safeguard in FR-005.
FR506: Identity administration audit — Pending-user creation, activation delivery, resend, revocation, activation, access-level change, deactivation, reactivation, and ownership transfer record the Organization, affected user, acting user or system event, previous and new state, timestamp, and safe outcome metadata.
FR507: Environment-appropriate automatic activation — In the controlled Gate 1 internal-beta environment, an eligible test Organization activates automatically after registration, email verification, required terms acceptance, and availability within the configured test capacity. In the customer-facing production environment, automatic activation additionally requires satisfaction of the platform-wide Gate 2 and real-data release gates and availability within production beta capacity.
FR508: No manual admission review — The MVP requires no Moviqo-operator review or manual approval for an eligible Organization to activate.
FR509: Initial active capacity — The initial beta permits no more than twenty Active Organizations at one time. Dormant, recoverable, and finally deleted Organizations do not count as Active.
FR510: Capacity-full behavior — When twenty Organizations are Active, Moviqo prevents another Organization from activating, explains that beta capacity is currently full, and preserves existing-user Sign In. It does not create partially authorized access to business features.
FR511: Configurable global capacity — The maximum Active-Organization capacity is protected operational configuration and can be increased for the beta without changing application code, customer pricing, or existing Organization data. Reducing the setting never deactivates an already Active Organization.
FR512: Active-Organization priority — Active Organizations retain their places. Moviqo does not deactivate an Active Organization, exceed configured capacity, or pause an Active Organization to activate or restore another Organization.
FR513: Initial Organization limits — Unless an audited Organization-specific exception applies, the initial beta permits up to ten Pending or Active users, ten non-archived published Workflow definitions, two hundred new Processes per usage cycle, one hundred megabytes of active attachment storage, and five hundred system-generated emails per usage cycle for each Organization. Published versions do not count as separate Workflow definitions.
FR514: Anniversary usage cycle — An Organization's monthly Process-start and email counters use a monthly cycle anchored to the Organization activation date and time. For example, an Organization activated on February 15 begins its next cycle on March 15.
FR515: Short-month anniversary — When the activation day does not exist in a month, the usage cycle renews on that month's final calendar day while retaining the original activation-day anchor for later months.
FR516: Usage visibility and warning — Owners and Administrators can view current usage, cycle dates, and limits. Moviqo displays an approaching-limit warning at approximately eighty percent and a clear reached-limit message at one hundred percent.
FR517: Non-destructive limit enforcement — Reaching a limit never deletes or corrupts existing data. User and Workflow limits block additional creation; the Process limit blocks new Process starts while allowing open work to continue; the attachment limit blocks additional uploads while allowing non-file work; and the email limit suppresses additional optional email while preserving in-application Tasks and operational visibility.
FR518: No automatic charge — Beta limits never initiate a charge, paid upgrade, or automatic plan conversion.
FR519: Audited exceptions — An authorized Moviqo operator can increase an Organization-specific beta limit through protected operational configuration. The previous limit, new limit, reason, actor, and timestamp are audited, and lowering a limit never deletes existing data.
FR520: Organization activity timestamp — A successful Sign In or authenticated product activity by any Active user updates the Organization's last-active timestamp. Automated background operations, notification delivery, and Moviqo-operator maintenance do not count as customer activity.
FR521: First inactivity warning — After seven complete days without Organization activity, Moviqo emails every Active Owner that the Organization is approaching Dormant status and states the dormancy, recovery, export, and deletion dates.
FR522: Final pre-dormancy warning — After twelve complete inactive days, Moviqo sends every Active Owner a final warning that Dormant status will begin after fourteen complete inactive days.
FR523: Automatic Dormant status — After fourteen complete inactive days, Moviqo marks the Organization Dormant, suspends normal Organization access and Process execution, and immediately removes it from the Active-Organization capacity count.
FR524: Dormant data preservation — Entering Dormant status does not alter Workflows, open Tasks, Processes, Process Data, attachments, or audit history. Those records remain preserved throughout the recovery period.
FR525: Restricted recovery access — During Dormant recovery, an Owner can authenticate only into a restricted recovery area to inspect the deletion deadline, request an Organization export, close the account permanently where supported, or attempt restoration. Other Organization users cannot access normal business features.
FR526: Capacity-bound restoration — A Dormant Organization can be restored only when the number of Active Organizations is below the configured limit at the instant restoration commits. Restoration never displaces an Active Organization, reserves capacity, receives priority over a new activation, or causes capacity to be exceeded.
FR527: Restoration outcome — Successful restoration returns the preserved Organization to Active status, resumes authorized access and open work, resets the inactivity timer, and records the restoration. When capacity is full, restoration remains unavailable and the Owner retains restricted export access until deletion.
FR528: Fourteen-day recovery maximum — Dormant recovery lasts no more than fourteen days. Moviqo displays and communicates the exact final-deletion timestamp and sends a final deletion warning before the recovery period expires.
FR529: Final inactive-data deletion — After twenty-eight complete days of continuous inactivity, comprising fourteen days before Dormant status and fourteen days of recovery, Moviqo permanently removes the Organization's production records and binary files through the controlled deletion process and frees its remaining storage. Disaster-recovery copies expire according to FR-370 and FR-454.
FR530: No silent policy — The landing page, registration flow, beta terms, and restricted recovery area clearly disclose the inactivity timeline and consequences before the customer entrusts business data to Moviqo.
FR531: Inactivity lifecycle audit — Inactivity warnings, Dormant entry, attempted and successful restoration, export actions, final warning, final deletion, and delivery outcomes are audited without storing Process Data in the lifecycle event.
FR532: Inactivity-deletion supersession — FR-520 through FR-531 create the approved beta exception to FR-362. Moviqo does not delete an Organization for inactivity except through this disclosed warning, Dormant, recovery, and final-deletion lifecycle.
FR533: Complete Organization identity deletion — Final Organization deletion removes the Organization, every user account and Membership belonging to it, access levels, Teams, invitations, Workflows, Processes, Tasks, Process Data, tenant audit records, active exports, and production file objects, subject only to backup expiration and the minimal Historical Organization Register defined below.
FR534: Credential invalidation on final deletion — Final deletion invalidates every related session, activation link, verification link, password-reset link, file credential, and export credential before or as the active records are removed.
FR535: Email release — After final Organization deletion commits, its former normalized email addresses are no longer reserved and may be used to register new Moviqo accounts.
FR536: Fresh registration after deletion — Registration with a released email creates a new user account, Organization, Membership, identifiers, terms acceptance, and audit history. It grants no access to and creates no relationship with the deleted Organization or its backups.
FR537: Historical Organization Register — Moviqo maintains a separate operator-only Historical Organization Register containing one minimal record for each finally deleted Organization so beta history, deletion execution, and backup expiration can be demonstrated without retaining the customer workspace.
FR538: Permitted historical metadata — The Historical Organization Register may retain an opaque former-Organization identifier or deletion-receipt identifier; activation, last-activity, Dormant, closure, and final-deletion timestamps; deletion reason and policy version; accepted beta-terms version; anonymous aggregate counts such as users, distinct published Workflows, completed Processes, and storage usage at closure; and backup-expiration due date and completion status.
FR539: Prohibited historical contents — The Historical Organization Register must not retain Organization display names, user names, email addresses, passwords or credentials, IP addresses, Workflow or Task names, Process Field definitions or values, attachment names or contents, export contents, notification message contents, or other data that could recreate the deleted customer workspace.
FR540: Historical-register isolation — Historical Organization records are unavailable to customer Owners, Administrators, Designers, and Members; are accessible only through protected Moviqo-operator controls; and cannot be searched using a former email address.
FR541: Non-restorable historical record — A Historical Organization record is evidence and aggregate product telemetry only. It cannot be reactivated, converted into an Organization, or used to restore deleted data.
FR542: Backup separation after deletion — Disaster-recovery backups containing deleted Organization data remain inaccessible through normal application and Historical Organization Register operations and expire according to the approved backup-retention schedule. The register may track backup expiration status without exposing backup contents.
FR543: Historical-retention disclosure — The beta terms and privacy notice disclose the limited Historical Organization Register, its purpose, permitted metadata, access boundary, and approved retention period before customer onboarding.
FR544: Historical-record retention — Moviqo retains an individual Historical Organization record for no more than twenty-four months after final Organization deletion and then permanently deletes that record.
FR545: Consolidated statistics after expiration — After an individual historical record expires, Moviqo may retain only consolidated, irreversible product statistics that cannot identify, isolate, reconstruct, or link back to a former Organization, user, email address, Workflow, or Process.
FR546: Supported application languages — Moviqo-owned public and authenticated interface content supports Spanish and English. Spanish is the default and fallback when no valid saved preference or translation exists.
FR547: Personal interface language — Each user has a personal interface-language preference that controls Moviqo-owned navigation, buttons, system statuses, validation feedback, errors, confirmations, help content, and system-generated email text.
FR548: Organization language default — The initial Owner's selected language becomes the Organization default. New Pending users inherit that default but can select Spanish or English during activation and later change their personal preference without changing Organization business data.
FR549: Organization-language administration — Owners and Administrators can change the Organization default language for future users and Organization-level fallback content. The change does not overwrite existing users' personal language preferences.
FR550: Designer-content boundary — Workflow names and descriptions, element and Task names, Form labels and instructions, choice labels, reusable-list labels, validation messages, Instance States, completion labels, and Designer-authored notification text display exactly as configured by the Designer and are not automatically translated.
FR551: Deferred authored-content localization — Automatic translation and separate language variants for Designer-authored Workflow and Form content are outside the MVP.
FR552: Translation safety — Missing application translations fall back to Spanish and never expose internal translation keys, template identifiers, or untranslated developer placeholders to the user.
FR553: Organization regional settings — Each Organization has one regional-format setting, one timezone, and one default ISO currency code configured during initial Owner registration.
FR554: Regional-settings administration — Owners and Administrators can change the Organization regional format and timezone. Presentation changes apply consistently to subsequent views without rewriting stored Date, Date-Time, numeric, Currency, Process Data, or audit values.
FR555: Organization-consistent business values — Shared business dates, Date-Time values, numbers, and currencies use the Organization regional settings for every viewer, regardless of personal interface language.
FR556: Locale-neutral persistence — Moviqo stores dates, instants, numbers, and monetary amounts in locale-neutral representations and applies Organization formatting only for authorized input and presentation.
FR557: Regional input semantics — Manual date and numeric input is parsed and validated according to the Organization regional format, and the interface provides an unambiguous expected-format example where manual input could be misunderstood.
FR558: Email and audit formatting — System email text and audit event names follow the viewing or recipient user's interface language, while included business values follow the Organization regional format and timezone.
FR559: Currency as a field type — Currency is a Process Field or supported Data Table column type, not a separate true-or-false presentation property. Selecting the Currency type automatically applies the Organization default currency.
FR560: Progressive currency override — A progressively disclosed `Use a different currency` property allows a Designer to select another valid ISO currency code for an exceptional Currency field or column without requiring ordinary Designers to choose a currency each time.
FR561: Organization-currency correction and lock — The Owner can correct the Organization default currency only while no Currency field or column has been published. Publishing the first Currency field or column locks the Organization default currency for the MVP.
FR562: Published field-currency immutability — A Currency field or column's ISO currency code cannot change after its first publication. A Designer needing a different currency must create another Currency field or column.
FR563: Mixed-currency safety — Calculations, comparisons, conditions, and Data Table aggregates cannot combine or directly compare Currency values with different ISO currency codes. Publication is blocked with a clear dependency error when a rule or calculation violates this boundary.
FR564: No exchange-rate conversion — Exchange-rate lookup, automatic monetary conversion, rate history, and conversion gains or losses are outside the MVP.
FR565: Unambiguous currency display — Currency presentation includes the ISO code when a symbol could be ambiguous, for example `USD $100.00` or `COP $100,00`, using the Organization regional format.
FR566: Translation completeness gate — Spanish and English application-owned content for the approved MVP flows is reviewed before public beta; missing or unsafe production translations block release until corrected or safely covered by the Spanish fallback.
FR567: Deferred language expansion — Additional application languages, right-to-left layouts, and automatic locale generation are outside the MVP.
FR568: Organization-wide Designer catalog — Active Designers, Administrators, and Owners can view and manage every Workflow definition in their Organization. Members without Designer capability do not receive Workflow-definition access merely because they can start or participate in Processes.
FR569: Production-data boundary — Workflow catalog and definition access does not grant a Designer access to Process rows, Task submissions, Process Field values, attachments, or Transactional Audit beyond the production-data boundaries already defined in this PRD.
FR570: Workflow creation metadata — Creating a Workflow requires a name that is unique among the Organization's non-archived Workflow definitions, ignoring letter case, and permits an optional short description.
FR571: Initial blank canvas — A newly created Workflow opens as a shared Draft Only definition with Start and End already placed on the canvas. It remains invalid for publication until the Designer adds at least one Task and satisfies all graph, assignment, Form, and Authorized Starter requirements.
FR572: Catalog status and columns — The catalog displays Workflow name and description; Draft Only, Published, Published with Draft, or Archived status; latest published version; draft validation status; creator; last editor; last-modified time; latest publication time; and authorized actions.
FR573: Active-Process summary — The catalog may display the count of Active or Needs Attention Processes for operational awareness without exposing their rows or Process Data to a Designer who lacks production-data access.
FR574: Catalog querying — The Workflow catalog supports search by name and description, filters by lifecycle and validation status, and sorting by name, creation date, last-modified date, and latest publication date.
FR575: Active-name uniqueness — A non-archived Workflow name must remain unique within its Organization, ignoring letter case. A duplicate, reactivation, rename, or creation that conflicts with another non-archived name is blocked with a clear message.
FR576: Metadata editing — A Draft Only Workflow can change name and description directly in its draft. A published Workflow changes name or description through the shared draft, and the change becomes the current production metadata only after publication.
FR577: Historical metadata — Every published version preserves the Workflow name and description present at its publication time, even when later versions use different metadata.
FR578: Draft-only deletion — A never-published Workflow with no runtime history can be physically deleted after explicit confirmation, releasing its draft-only resources and identifiers from active use while retaining the applicable Configuration Audit event.
FR579: Published archive boundary — A Workflow that has ever been published cannot be physically deleted independently from its Organization. It can only be Archived, except during final Organization deletion.
FR580: Archive runtime behavior — Archiving immediately removes the Workflow from Start a Process and prevents new Process starts while allowing existing Processes and open Tasks to continue under the approved live-version rules.
FR581: Archive preservation — Archiving preserves published versions, the shared draft where one exists, Workflow configuration, active and historical Processes, Process Data, files, and audit history.
FR582: Archived definition access — An Archived Workflow and any preserved draft are read-only. Archiving releases its edit lease, and editing cannot resume until an authorized user reactivates the Workflow.
FR583: Reactivation readiness — Reactivating an Archived Workflow does not create a new published version, but Moviqo checks current Workflow-name uniqueness, Authorized Starters, assignments, references, dependencies, and runtime readiness before allowing new Process starts.
FR584: Reactivation requiring changes — If the latest published definition is no longer ready for new starts, Moviqo can reactivate the catalog definition in a Needs Update state, keeps new starts blocked, and requires a valid shared draft to be published before the Workflow returns to Published operation.
FR585: Duplicate source — A Designer can duplicate a Draft Only Workflow's current draft or the latest published version of a Published or Archived Workflow.
FR586: Independent duplicate identity — Duplication creates a new Draft Only Workflow with a new unique name and new Workflow, element, Process Field, Form, rule, calculation, state, and Workflow-local option identifiers.
FR587: Copied definition configuration — Duplication copies the selected source's Forms, fields, layout, conditions, calculations, states, Tasks, routing, assignments, and Authorized Starters. Organization Choice Lists remain references to the same Organization-owned reusable lists rather than being copied.
FR588: No runtime-data duplication — Duplication never copies Processes, Task occurrences, submitted Process Data, attachments, notification history, Transactional Audit, published-version history, or source edit leases.
FR589: Duplicate validation and audit — Copied assignments, starters, references, and dependencies must pass normal validation before publication. Configuration Audit records the source Workflow and source draft or version, duplicating user, new Workflow, and timestamp.
FR590: Version History view — Version History displays each immutable version's sequential number, Workflow name and description at publication, publication timestamp, publisher, originating draft, and restoration source where applicable.
FR591: Restoration reason — Restoring an older published version requires a Designer-entered reason and creates or replaces the permitted shared draft only after confirmation without changing the current published version.
FR592: Restoration comparison — Before publishing a draft restored from an older version, the Designer can compare that draft with the latest published version and inspect added, changed, reactivated, and retired elements, fields, assignments, rules, and metadata.
FR593: Restoration publication sequence — Publishing a restored draft creates the next sequential immutable version and records the source version, restoration reason, Designer, validation result, and publication timestamp.
FR594: Published-Workflow quota unit — The ten-Workflow beta limit counts non-archived Workflow definitions with at least one published version. Drafts and additional versions do not count as separate published Workflow definitions.
FR595: Archive frees published capacity — Archiving a published Workflow releases one published-Workflow place without deleting its definitions, versions, running Processes, or history.
FR596: Quota-safe publication — Draft creation and duplication are permitted independently of available published capacity, but publication and reactivation for new starts are blocked while all ten published-Workflow places are occupied unless an audited Organization-specific exception applies.
FR597: No periodic runtime-Form polling — An open runtime Task Form does not periodically poll for Workflow publication, Form-definition, or assignment changes. No WebSocket or persistent real-time channel is required for this purpose.
FR598: Explicit-action checks — Moviqo checks the current Task assignment and latest applicable published Form definition when the user selects Save Draft or Complete Task. Manually refreshing or reopening the Task also loads the current authorized definition.
FR599: Opened-definition identity — An editable Task Form submission identifies the Task occurrence and the published definition revision against which the Form was opened so the server can detect stale assignment or definition state.
FR600: Reassigned open-Form rejection — If the requesting user is no longer the authorized assignee when Save Draft or Complete Task reaches the server, Moviqo rejects the operation, persists none of the values submitted by that attempt, and displays that the Task was reassigned and is no longer available.
FR601: Reassigned Form exit — After reassignment rejection, the stale Form closes or returns the user to My Tasks. Values persisted through earlier successful saves remain unchanged and audited, while unsaved browser-only values from the rejected request are not committed.
FR602: Stale-definition rejection — If a newer applicable published Form definition exists than the revision submitted by an otherwise authorized user, Save Draft or Complete Task persists none of that attempt's submitted values and requires the user to reload the updated Form before trying again.
FR603: Latest Form after reload — Reloading or reopening the authorized Task uses the newest compatible published definition and current Process Data, including newly added controls, requirements, validations, calculations, visibility, and enabled rules.
FR604: New requirements on open Tasks — A new required field or validation in the latest current-Task Form applies after reload and must pass before completion, even when the Task occurrence was activated under an earlier version.
FR605: Removed-control preservation — A control removed by the latest definition no longer appears after reload, but its previously persisted Process Field value and historical audit remain preserved according to FR-110 and FR-171.
FR606: Open-assignment impact preview — Before publishing a Task assignment change, Moviqo displays the number of affected open Task occurrences and the expected assignment result for each affected Process where it can be resolved safely.
FR607: Publication-time assignment resolution — Publication evaluates the new assignment configuration for every affected open Task occurrence using that Process's current authorized Process Data.
FR608: Unresolvable change blocks publication — Publication is blocked when a proposed assignment change for an existing open Task cannot resolve to a valid Active Member or Team, including an empty or inactive User Reference. The Designer must correct the definition or an Administrator must resolve the affected operational state before retrying publication.
FR609: Valid open-Task reassignment — When the new assignment resolves, publication reassigns the open Task occurrence, removes previous active access, grants the resulting Member or Team access, preserves previously persisted Process Data, and audits the previous and new assignment.
FR610: Reassignment status result — A new Team assignment becomes Available for eligible Team claiming; a new individual, initiator, or valid User Reference assignment becomes Assigned to the resolved Member.
FR611: Reassignment notification behavior — Email caused by publication-time reassignment follows the affected Task's existing assignment-email property and does not introduce a separate mandatory notification.
FR612: Serialized conflicting operations — Publication and Save Draft or Complete Task operations that can affect the same open Task are serialized by the server so their commits have one deterministic order and cannot partially combine definition versions.
FR613: Publication-first outcome — If publication commits first, a submission from the previous Form revision fails the assignment or stale-definition check, persists no submitted values, and requires the authorized user to reopen or reload the resulting current Task state.
FR614: Task-write-first outcome — If a valid Save Draft or Complete Task operation begins against the current published version first, the conflicting publication waits for that operation to commit. The Task write uses the version that was current when its protected transaction began; publication then evaluates the resulting current execution point before committing.
FR615: Completion version consistency — One Complete Task operation uses one published definition version consistently for final validation, calculation, persistence, Task completion, routing, Instance State update, required audit, and next Task or End creation.
FR616: New version after completion-first ordering — When completion commits before a waiting publication, the completed occurrence and route remain attributed to their selected version, the publication never rewrites that history, and the Process uses the newly published version from the resulting execution point onward.
FR617: Atomic publication impact — Publication of live Form, assignment, routing, and state changes and all required publication-time open-Task assignment updates either commits as one valid publication outcome or leaves the previous published version and open assignments current.
FR618: Concurrency audit — Publication impact, assignment updates, stale-definition rejections, reassignment rejections, and the definition version used by every successful Save Draft and Complete Task are recorded without persisting values from rejected submissions.
FR619: Instruction Text purpose — A Designer uses the existing Instruction Text layout component to present static instructions, explanations, notices, or other Designer-authored information. Instruction Text does not create a Process Field or store Process Data.
FR620: Read-only Display Value — When a Process Field is included in a Task Form as read-only, Moviqo renders it as a clear label-and-value Display Value rather than as a disabled editable input. Display Value is a presentation mode for an existing Process Field, not a separate Process Field type.
FR621: Type-appropriate read-only rendering — Read-only text, numeric, currency, date, date-time, Yes/No, Choice, User Reference, and Calculated values use an appropriate formatted display; File Attachment values provide authorized preview or download actions; and Data Tables use a non-editable table presentation.
FR622: Empty read-only value — A visible read-only Process Field without a current value displays a localized neutral placeholder equivalent to `No value` rather than an editable empty control.
FR623: Optional acknowledgment — When an informational Task requires explicit confirmation, the Designer can add a required Yes/No Process Field, label it with business wording such as `I acknowledge this information`, and use the normal Complete Task action. Moviqo does not force acknowledgment for every informational Task.
FR624: One Form per active Task — Every active Task has exactly one Task Form whose definition is validated as part of Workflow publication.
FR625: Meaningful visible content — Each active Task Form must contain at least one meaningful component that is visible under at least one valid rule outcome. An editable, read-only, or Calculated Process Field, File Attachment, Data Table, or non-empty Instruction Text satisfies this requirement.
FR626: Decorative-only Form rejection — A Form containing only empty or decorative Heading, Section, or Divider components does not satisfy the meaningful-content requirement and blocks publication.
FR627: Form-reference validation — Publication blocks when an active Task Form contains duplicate use of the same Process Field in that Form, missing or incompatible references, incomplete labels or required type configuration, invalid layout relationships, or references to inactive or unavailable configuration.
FR628: Structured-control validation — Publication requires each Data Table to have at least one valid column and each Workflow-local or Organization Choice List used by a Choice field to contain at least one active selectable option.
FR629: Rule and calculation validation — Publication blocks for incomplete, incompatible, missing, or circular Form rules, validation rules, calculations, dependencies, and references, using the existing visual-rule and dependency requirements.
FR630: Constraint consistency — Publication blocks internally contradictory control constraints, including a minimum greater than a maximum, invalid decimal precision, impossible date boundaries, invalid table row limits, or an invalid File Attachment size or count configuration.
FR631: Hidden-content warning — If Form rules can produce a valid runtime state in which every meaningful component is hidden, Moviqo presents a publication warning so the Designer can confirm that an intentionally empty visible Form is acceptable. This warning does not replace blocking errors for invalid rules.
FR632: Draft preservation — Form publication errors and warnings do not prevent saving the shared Workflow draft. Blocking errors prevent publication until corrected.

## Non-Functional Requirements

### Non-Functional Requirement Capability Index

1. **Performance and beta-load profile — NFR1–NFR8:** responsiveness, latency, file feedback, server querying, representative data/load profiles, and evidence.
2. **Supported browsers and devices — NFR9–NFR13:** browser support, responsive operations, desktop authoring baseline, deferred mobile authoring, and unsupported-browser handling.
3. **Accessibility baseline — NFR14–NFR17:** WCAG 2.2 A/AA, keyboard/focus/labels/contrast/screen-reader/text enlargement, non-drag alternatives, and claim boundaries.
4. **Availability, health, and communication — NFR18–NFR24:** no beta SLA, disclosure, health coverage, safe endpoints, alerts, maintenance, and outages.
5. **Safe failure, consistency, and retry — NFR25–NFR31:** duplicate prevention, atomic outcomes, idempotent background work, notification independence, completion containment, safe failures, and recovery objectives.

### Complete Non-Functional Requirement List

NFR1: Landing-page responsiveness — The public landing page becomes usable within approximately three seconds under the documented representative mobile-network and device test profile.
NFR2: Application-view responsiveness — Authenticated dashboards and Task Forms become usable within approximately three seconds for Organizations operating within approved beta limits under the documented normal-load test profile.
NFR3: Interactive-operation latency — Claim Task, Save Draft, Complete Task, and standard configuration saves return a successful result or actionable failure within two seconds for at least ninety-five percent of normal-load requests, excluding file transfer and external email-delivery time.
NFR4: File-transfer feedback — File uploads and downloads expose progress or an equivalent active state and provide a clear, safe, retryable failure result rather than leaving the user uncertain about completion.
NFR5: Server-side collection querying — Search, filtering, sorting, and pagination for protected collections execute on the server within the authorized Organization scope rather than requiring the client to download an unrestricted data set.
NFR6: Representative definition profile — Performance verification includes Workflows with up to fifty active elements, Task Forms with up to fifty controls, Data Tables with up to one hundred rows, and paginated dashboards with at least one thousand authorized records. These are test profiles rather than hard feature limits unless a separate approved limit applies.
NFR7: Representative beta load — Before public launch, beta-load verification covers twenty Organizations and at least fifty concurrent authenticated users performing a representative mix of dashboard, Form, Task, Workflow, and file operations.
NFR8: Performance evidence — Performance evidence records the tested build, environment, data profile, request mix, percentile results, failures, and known infrastructure constraints without including customer Process Data.
NFR9: Browser support window — Moviqo supports the current and immediately previous stable major versions of Chrome, Edge, Firefox, and Safari available at the time of each production release.
NFR10: Responsive operational flows — Landing, registration, authentication, My Work dashboards, Process tracking, Task Forms, Organization administration, and restricted recovery work on supported mobile, tablet, laptop, and desktop layouts.
NFR11: Designer screen baseline — Workflow and Form design are optimized and tested for supported laptop and desktop browsers with a viewport of at least 1280 by 720 CSS pixels.
NFR12: Deferred mobile design — Authoring Workflows and Forms on narrow mobile layouts and providing native mobile applications are outside the MVP. Mobile users can still perform the supported operational flows in NFR-010.
NFR13: Unsupported-browser behavior — When Moviqo detects a known unsupported browser, it provides a clear upgrade or supported-browser message and does not imply that an unsafe or incompatible operation succeeded.
NFR14: Accessibility reference — Moviqo uses the applicable WCAG 2.2 Level A and Level AA success criteria as the design and testing baseline for the landing page, authentication, dashboards, Task Forms, and Organization administration.
NFR15: Core accessible interaction — Core MVP flows support keyboard navigation, visible focus, semantic labels and headings, meaningful alternatives for non-text content, readable contrast, screen-reader announcements for material state changes, accessible validation feedback, and text enlargement to two hundred percent without loss of required content or operation.
NFR16: Non-drag Designer alternatives — Where practical for the MVP, Workflow and Form Designer operations that use dragging also provide non-drag controls, such as buttons for adding elements and property-based methods for configuring order, width, or connections.
NFR17: Conformance-claim boundary — The beta does not advertise formal WCAG conformance until every page and applicable state, language, responsive variation, and dynamic interaction included in the claim has completed the required automated and manual verification. Using WCAG as a baseline does not by itself constitute certification.
NFR18: No beta uptime SLA — The free beta provides no contractual uptime percentage or enterprise availability SLA.
NFR19: Availability disclosure — Beta terms disclose relevant free-provider, planned-maintenance, outage, support, recovery, and availability limitations without weakening the approved security, backup, or tenant-isolation responsibilities.
NFR20: Health coverage — Moviqo monitors frontend reachability, API health, database connectivity, private storage access, email delivery integration, daily backups, and scheduled inactivity-lifecycle execution.
NFR21: Safe health endpoints — Health and readiness endpoints expose no credentials, customer identity, Process Data, internal topology, stack trace, or unnecessary provider detail.
NFR22: Operator alerting — Repeated or material health, backup, email, storage, scheduled-operation, or application failures create a Moviqo-operator alert with a safe correlation identifier and remain traceable until resolved.
NFR23: Planned-maintenance communication — Moviqo communicates planned maintenance to affected beta users in advance when practical and states the expected impact and time window without making an unsupported restoration promise.
NFR24: Known-outage communication — During a known material outage, Moviqo provides an accessible safe service message or status communication that explains the affected capability without exposing sensitive infrastructure information.
NFR25: Duplicate-operation prevention — Process start, Team Task claim, Save Draft, Complete Task, Workflow publication, and administrative reassignment prevent duplicate business results when the client or server safely retries the same logical operation.
NFR26: All-or-nothing business outcome — A business operation that must change multiple related records either completes every required state change or leaves the previous valid business state intact. For example, Complete Task cannot persist a completed current Task without also recording required audit and routing state and creating the valid next Task or End result.
NFR27: Independent background retry — Email delivery, export generation, malware inspection, backup, and deletion retries do not duplicate the underlying business action, file, export, or lifecycle transition.
NFR28: Notification-failure independence — Failure to deliver an assignment, Transition, or operational notification after a successful business operation does not reverse Task completion, routing, assignment, reassignment, or Process state. Notification failure is recorded and retried independently according to the applicable notification policy.
NFR29: Failed completion containment — A failed Task-completion attempt leaves the Task open, does not select an outgoing route, and does not create a duplicate or unauthorized next Task.
NFR30: Safe unexpected failure — Unexpected failures follow the approved safe error and correlation-identifier requirements, preserve tenant isolation, and do not expose or partially commit unauthorized Process Data.
NFR31: Recovery objectives — Recoverable production-data failures are handled according to the approved public-beta twenty-four-hour recovery point and recovery time targets in FR-455 and FR-456.

## Additional Requirements

### PRD Delivery and Validation Requirements

- **Gate 1 — Feature-complete internal beta and UAT:** Deploy the complete persistent MVP to a controlled company-only environment using synthetic data and harmless test files. Manual testers must be able to traverse landing, registration, activation, isolated Organizations, users, Teams, Workflow/Form design and publication, Process start/execution, assignments, rules, routes, loops, live versions, files, dashboards, timelines, administration, notifications, quotas, localization, and audit without developer intervention. Gate 1 does not permit customer onboarding or real business data.
- **Gate 2 — Customer public-beta production readiness:** Using the feature-complete Gate 1 product, pass tenant-isolation, authentication/session, authorization, private-file/malware inspection, expiring-link, safe-log/error, secret/environment, backup/restoration, audit-integrity, dependency/vulnerability, OWASP/MITRE threat, monitoring, lifecycle, terms/privacy, prohibited-data, and customer-responsibility gates before accepting permitted real customer data.
- **SC1 — Participating Organizations:** At least five distinct Organizations use Moviqo during public beta, within the approved twenty-Active-Organization capacity.
- **SC2 — Published Workflow adoption:** At least twenty distinct Workflow definitions are published; additional versions do not count as distinct Workflows.
- **SC3 — Completed Process volume:** At least one hundred Processes reach End and become Completed.
- **SC4 — Thirty-day retention:** At least two of the initial five Organizations remain active on day thirty through a meaningful authenticated product action.
- **SC5 — Time to first publication:** A non-technical Owner publishes a simple valid Workflow within sixty minutes, with thirty minutes as the target, measured from Create Workflow to successful publication.
- **SC6 — Independent end-to-end operation:** At least one participating Organization designs, publishes, starts, executes, and completes a Workflow without developer intervention during the measured flow.
- **SC7 — Willingness to pay:** At least one Organization records that it would consider continuing under an affordable paid plan; actual beta payment is not required.
- **SC8 — Isolation and reliability:** The beta has no confirmed cross-Organization exposure and no customer-data loss remaining unrecovered beyond the approved objectives.

### Architecture Requirements

- Use the Architecture Structural Seed as the project scaffold: `Moviqo.Back`, `Moviqo.Front`, and the correctly named `Moviqo.Infrastructure`; make this the first implementation story.
- Build a modular monolith with hexagonal Django modules for Organizations, WorkflowDesign, WorkflowRuntime, Files, Messaging, and Governance; cross-module calls use public application contracts or integration events only.
- Derive an immutable `TenantContext` for every protected request and job; include `OrganizationId` in tenant rows and relationships, enforce application authorization plus PostgreSQL `FORCE ROW LEVEL SECURITY`, and isolate operator history in a separate unreachable schema.
- Execute each state-changing command through one application handler and one PostgreSQL transaction that atomically commits business state, immutable audit, idempotency results, and outbox messages.
- Store authorization-critical and operational state relationally; store versioned workflow snapshots, draft documents, typed rule ASTs, layouts, and Process Field values as schema-versioned JSONB governed by one backend schema registry.
- Implement one mutable optimistic-revision draft and append-only immutable published versions; serialize publication and Task writes on the Workflow head and reject stale assignment or form revisions atomically.
- Implement one versioned, typed, deterministic backend rule AST/interpreter for Form behavior, calculations, validation, and routing; frontend authoring emits the AST and preview/test calls the backend interpreter.
- Start with a custom Django user model; use verified-email/password authentication, same-origin Secure HttpOnly session cookies, Django CSRF, server-side DRF authorization, OpenAPI-generated TypeScript clients, and RFC 9457 Problem Details.
- Keep file metadata/lifecycle in PostgreSQL and binaries in private object storage; use tenant-partitioned opaque keys, 15-minute object-specific grants, quarantine, server validation, malware inspection, transactional access revocation, and 24-hour export expiry.
- Structure the React SPA by dependency flow `app → pages → features → entities → shared`; centralize remote-state querying and use explicit reducers plus revision tokens for workflow/form drafts.
- Run asynchronous email, export, inspection, cleanup, lifecycle, and retry work through PostgreSQL outbox/job rows with bounded leases, `SKIP LOCKED`, idempotent handlers, backoff, and dead-letter reasons; do not add Redis, Celery, or a message broker for MVP.
- Build one static SPA artifact and one immutable Python backend image; deploy the UAT topology through Firebase Hosting, Cloud Run, Supabase PostgreSQL, private GCS, and Resend in `us-east1`, with declarative isolated local/UAT/production infrastructure.
- Prevent caching of `/api/**`, authenticated, or session-specific responses; allow caching only for public landing content and immutable hashed assets.
- Emit OpenTelemetry-compatible logs, metrics, and traces with correlation IDs and centralized redaction; exclude Process Data, secrets, tokens, private links, and file content.
- Gate promotion on test, tenant-isolation, authorization, file/export, dependency, secret, migration, OWASP ASVS, accessibility, backup, and restoration evidence with the PRD severity rules.
- Add independent encrypted logical PostgreSQL and attachment backups every 24 hours, retain 7 daily and 4 weekly sets, alert on failures, and preserve isolated restoration evidence for the 24-hour RPO/RTO targets.
- Implement Organization dormancy, closure, final deletion, credential invalidation, email release, backup expiry, and Historical Organization Register retention as an audited resumable idempotent governance saga.
- Keep AI, microservices, distributed caches, brokers, real-time collaboration, and cross-Organization Process Data analytics outside MVP.
- Follow red → green → refactor for every behavior and defect; use unit/table tests, real PostgreSQL integration tests, architecture tests, OpenAPI contract tests, and Playwright journeys with automated accessibility checks.
- Apply the Architecture consistency conventions for naming, UUIDv7 identifiers, tenant-scoped keys, UTC/`timestamptz`, ISO dates/currencies, JSON schema versions, `/api/v1`, ETag/`If-Match`, pagination, audit, environment configuration, and localization.
- Use the pinned stack: Python 3.14.6, Django 5.2.15 LTS, DRF 3.17.1, Psycopg 3.3.4, drf-spectacular 0.30.0, PostgreSQL 17.10, Node.js 24.18.0 LTS, TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, React Flow 12.11.2, ClamAV 1.5.3, pytest 9.1.1, and Playwright 1.62.x.

## UX Design Requirements

UX-DR1: Implement the complete design-token layer: the specified surface, ink, primary, accent, border, error, and success colors; system-sans typography roles; 4–32 px spacing scale; mobile/desktop gutters; and small/medium/large/full radii.
UX-DR2: Verify implemented color contrast at 4.5:1 for normal text and controls, 3:1 for large text, and 3:1 for focus indicators and meaningful non-text states; never use color as the sole status, permission, error, or success signal.
UX-DR3: Implement Primary Button with the primary/foreground tokens, medium radius, and plain action verbs such as Continue, Save draft, and Publish workflow.
UX-DR4: Implement Guidance Card with soft surface styling; it explains one concept and one next action, is contextual, dismissible and revisitable, and is never the only explanation of a required action.
UX-DR5: Implement Form Field with the fixed sequence label, concise help, control, and accessible inline validation, including responsive reflow and an accessible label that is not replaced by placeholder text.
UX-DR6: Implement Guided Step with one focal decision, a clear title and rationale, Continue, Back, Save draft, and Skip only when safe; pair it with a plain-language named-step Progress Indicator that exposes no graph terminology.
UX-DR7: Implement Workflow Element with a recognizable label and short plain-language purpose, scan-friendly non-color-only distinctions, and visible non-drag add/configure controls alongside drag interactions where practical.
UX-DR8: Implement Task Card for My Tasks and narrow layouts, prioritizing task name, workflow, status, assignee, and one primary action, with expandable authorized context only.
UX-DR9: Implement Assignment Control that states recipient type, recipient name, why/when work becomes available, and what happens if the assignee becomes invalid.
UX-DR10: Implement Publish Checklist with plain-language issue rows, explicit status text, direct links to affected configuration, blocking behavior for required checks, and preservation of the shared draft.
UX-DR11: Implement Timeline as readable event rows showing authorized actor, time, state, and task position while preventing visual previews of restricted Process Data.
UX-DR12: Apply the calm sea-and-water visual identity through fresh surfaces, restrained blue-green accents, generous spacing, tonal layering, light borders, moderate rounding, and minimal shadow; exclude literal beach imagery, decorative waves, pervasive gradients, dense console styling, and arbitrary visual customization.
UX-DR13: Use patient-colleague voice and tone: plain verbs, short explanations, sentence-case labels, concrete examples, and user-facing process language rather than nodes, graph topology, assignee resolvers, or generic technical errors.
UX-DR14: Implement the defined information architecture and access boundaries across Public Landing, Registration/Activation, Guided First Workflow, Dashboard, My Tasks, My Processes, Workflow Catalog, Workflow Designer, Process Start, Task Form, Process Detail/Timeline, Needs Attention, and Organization Administration.
UX-DR15: Make first visit, Draft, Validation Issue, Published, Assigned Task, Team Task Available, Needs Reassignment, Empty My Tasks, Permission Denied, Offline/Slow Connection, and Completed Process states explicit with the specified messaging, actions, persistence, and authorization boundaries.
UX-DR16: Ensure every primary operational flow works with keyboard, pointer, and touch; use one modal layer at a time, prefer inline guided panels, confirm destructive/irreversible actions, and avoid confirmation for routine save or Task completion.
UX-DR17: Preserve valid draft and entered Form work across navigation and recoverable connection failures; expose saving state and retry, and never report completion until confirmed by the server.
UX-DR18: Announce material state changes to assistive technologies; provide semantic headings/labels, meaningful non-text alternatives, visible focus, accessible validation, screen-reader support, usable touch targets of at least 44×44 CSS pixels where practical, and 200% text enlargement without loss of required operation.
UX-DR19: Treat motion as supplementary and remove non-essential transitions when reduced-motion is requested; motion must never be required to understand progress or complete a task.
UX-DR20: Implement responsive operational surfaces for mobile, tablet, laptop, and desktop: tables become compact cards on narrow screens; Task Forms stack/reflow full-width; administration prioritizes search, status, and one action; operational details remain expandable and authorization-safe.
UX-DR21: Optimize Workflow and Form authoring for laptop/desktop with full canvas/list, properties, validation, and publication; on narrow screens provide view/light navigation only and do not claim mobile authoring support.
UX-DR22: Implement Spanish-first application UI with English selection and Spanish fallback; retain Designer-authored content verbatim and localize field-specific corrective error messages in the user's interface language.
UX-DR23: Implement the first-workflow journey from landing through verified Owner registration, dominant Create your first workflow action, guided business-language stages, assignment explanation, publish checklist repair, publication, and first Process start.
UX-DR24: Implement the assigned-work journey so Members land on My Tasks, see only authorized direct/Team work, claim Team Tasks before editing, receive accessible validation, can save or complete, and see only authorized resulting progress.
UX-DR25: Keep candidate-facing/anonymous participation explicitly outside MVP; preserve only the documented future extension point without exposing an anonymous fallback.

## FR Coverage Map

FR1: Epic 2 - Member participation
FR2: Epic 2 - Designer capabilities
FR3: Epic 2 - Administrator capabilities
FR4: Epic 2 - Owner capabilities
FR5: Epic 2 - Owner continuity
FR6: Epic 2 - Process participation independent of access level
FR7: Epic 2 - Password recovery and change
FR8: Epic 2 - User deletion and deactivation
FR9: Epic 2 - Effects of deactivation
FR10: Epic 2 - Deactivation safeguards
FR11: Epic 6 - Participant instance overview
FR12: Epic 6 - Own contribution access
FR13: Epic 6 - Task access boundary
FR14: Epic 6 - Process-data exposure
FR15: Epic 6 - Administrative instance access
FR16: Epic 6 - Designer production-data boundary
FR17: Epic 1 - Authorized Starters
FR18: Epic 1 - Publish validation
FR19: Epic 4 - Member and Designer start authorization
FR20: Epic 1 - Operational start authority
FR21: Epic 1 - Start audit
FR22: Epic 4 - No public initiation in MVP
FR23: Epic 4 - Startable Workflow visibility
FR24: Epic 6 - Assigned-instance visibility
FR25: Epic 6 - Assignment does not grant start authority
FR26: Epic 1 - Dashboard separation
FR27: Epic 5 - Team Task availability
FR28: Epic 5 - Claim before work
FR29: Epic 5 - Exclusive claim
FR30: Epic 5 - Claimed Task access
FR31: Epic 5 - Claim audit
FR32: Epic 5 - Deferred assignment strategies
FR33: Epic 2 - Team administration
FR34: Epic 2 - Multiple Team membership
FR35: Epic 2 - Designer Team usage
FR36: Epic 2 - Historical Team preservation
FR37: Epic 2 - Team deactivation safeguard
FR38: Epic 2 - Valid Team reference
FR39: Epic 1 - Specific Member assignment
FR40: Epic 4 - Specific Team assignment
FR41: Epic 1 - Workflow Initiator assignment
FR42: Epic 4 - User Reference assignment
FR43: Epic 5 - Runtime assignment validation
FR44: Epic 5 - Needs Reassignment state
FR45: Epic 5 - Administrative reassignment inbox
FR46: Epic 5 - Manual reassignment
FR47: Epic 5 - Reassignment effects
FR48: Epic 1 - Short Text field
FR49: Epic 3 - Friendly text validation
FR50: Epic 3 - No raw patterns in MVP
FR51: Epic 3 - Long Text field
FR52: Epic 3 - Rich text deferred
FR53: Epic 3 - Calculations remain separate
FR54: Epic 3 - Common conditional behavior
FR55: Epic 3 - Integer platform range
FR56: Epic 3 - Designer numeric constraints
FR57: Epic 3 - Validation before persistence
FR58: Epic 3 - Accepted-value storage guarantee
FR59: Epic 3 - Numeric field types
FR60: Epic 3 - Integer business defaults
FR61: Epic 3 - Decimal business defaults
FR62: Epic 3 - Currency business defaults
FR63: Epic 3 - Negative-value option
FR64: Epic 3 - Empty is not zero
FR65: Epic 3 - Organization-consistent numeric display
FR66: Epic 3 - Numeric reuse
FR67: Epic 3 - Date field
FR68: Epic 3 - Date-Time field
FR69: Epic 3 - Date defaults
FR70: Epic 3 - Date boundaries
FR71: Epic 3 - Supported date range
FR72: Epic 3 - Organization-consistent date display
FR73: Epic 3 - Date validation
FR74: Epic 3 - Date reuse
FR75: Epic 3 - Date entry methods
FR76: Epic 3 - Date-Time entry
FR77: Epic 3 - Date constraint feedback
FR78: Epic 3 - Responsive date input
FR79: Epic 3 - Yes/No field
FR80: Epic 3 - Explicit selector presentation
FR81: Epic 3 - Confirmation presentation
FR82: Epic 3 - Required Yes/No behavior
FR83: Epic 3 - Configurable default
FR84: Epic 3 - Yes/No reuse
FR85: Epic 3 - Separate Choice field types
FR86: Epic 3 - Choice sources
FR87: Epic 3 - Choice List management scope
FR88: Epic 3 - Stable option identity
FR89: Epic 3 - Current-label display
FR90: Epic 3 - Option label audit
FR91: Epic 3 - Used option preservation
FR92: Epic 3 - Live Organization List additions
FR93: Epic 3 - Workflow-local option updates
FR94: Epic 3 - Choice defaults and validation
FR95: Epic 3 - Large-list usability
FR96: Epic 3 - Choice reuse
FR97: Epic 3 - User Reference field
FR98: Epic 3 - Same-Organization selection
FR99: Epic 3 - Optional Team restriction
FR100: Epic 3 - User Reference default
FR101: Epic 3 - Current identity display
FR102: Epic 3 - Inactive historical reference
FR103: Epic 3 - Dynamic assignment use
FR104: Epic 3 - Assignment eligibility
FR105: Epic 3 - User Reference conditions
FR106: Epic 3 - Single Member scope
FR107: Epic 3 - Workflow Process Field catalog
FR108: Epic 1 - Create or reuse
FR109: Epic 3 - Clear field organization
FR110: Epic 3 - Control removal preserves data
FR111: Epic 3 - Reused value visibility
FR112: Epic 1 - Task-specific presentation
FR113: Epic 3 - Inactive field reactivation
FR114: Epic 7 - Explicit attachment removal
FR115: Epic 7 - File Attachment field
FR116: Epic 7 - Basic attachment properties
FR117: Epic 7 - Attachment defaults
FR118: Epic 7 - Configurable attachment limits
FR119: Epic 7 - Platform file allowlist
FR120: Epic 7 - Server file validation
FR121: Epic 7 - Private file authorization
FR122: Epic 7 - Malware inspection
FR123: Epic 7 - Supported preview
FR124: Epic 7 - Attachment audit
FR125: Epic 7 - Designer simplicity
FR126: Epic 3 - Data Table field
FR127: Epic 3 - Row-count validation
FR128: Epic 3 - Valid-row requirement
FR129: Epic 3 - Row operations
FR130: Epic 3 - Supported column types
FR131: Epic 3 - Column validation
FR132: Epic 3 - Table reuse
FR133: Epic 3 - Table-level conditions
FR134: Epic 3 - Column visibility
FR135: Epic 3 - Conditional cell behavior
FR136: Epic 3 - Conditional validation
FR137: Epic 3 - Calculated columns
FR138: Epic 3 - Table aggregates
FR139: Epic 3 - Table audit
FR140: Epic 3 - No executable table logic
FR141: Epic 3 - Deferred Data Table capabilities
FR142: Epic 3 - Simple table configuration
FR143: Epic 3 - Calculated Field
FR144: Epic 3 - Visual formula builder
FR145: Epic 3 - Numeric operations
FR146: Epic 3 - Text and date operations
FR147: Epic 3 - Table calculation access
FR148: Epic 3 - Automatic recalculation
FR149: Epic 3 - Calculation dependency validation
FR150: Epic 3 - Empty-source behavior
FR151: Epic 3 - Runtime calculation errors
FR152: Epic 3 - Draft calculation recovery
FR153: Epic 3 - Completion and routing safety
FR154: Epic 3 - Calculation audit
FR155: Epic 3 - Deferred calculation capabilities
FR156: Epic 3 - Shared logical condition builder
FR157: Epic 3 - Contextual natural-language sentence
FR158: Epic 3 - User-facing terminology
FR159: Epic 3 - Pedagogical examples
FR160: Epic 3 - Ordered branches
FR161: Epic 3 - Deterministic fallback
FR162: Epic 3 - Context-appropriate results
FR163: Epic 3 - All or any conditions
FR164: Epic 3 - Localized preview
FR165: Epic 3 - Rule validation
FR166: Epic 3 - Non-executable internal translation
FR167: Epic 3 - No nested branches in MVP
FR168: Epic 1 - Common Form defaults
FR169: Epic 3 - Conditional control properties
FR170: Epic 3 - Property evaluation order
FR171: Epic 3 - Conditional value retention
FR172: Epic 3 - Conditional required behavior
FR173: Epic 1 - Draft and completion validation
FR174: Epic 3 - Consistent evaluation
FR175: Epic 3 - Rule dependency protection
FR176: Epic 1 - Responsive layout grid
FR177: Epic 3 - Type-appropriate Auto width
FR178: Epic 3 - Designer width override
FR179: Epic 3 - Compact row density
FR180: Epic 1 - Responsive reflow
FR181: Epic 1 - Required control label
FR182: Epic 1 - Field identity and labels
FR183: Epic 1 - Task-specific label override
FR184: Epic 1 - Automatic label placement
FR185: Epic 1 - Label accessibility
FR186: Epic 3 - Cross-field validation
FR187: Epic 3 - Validation result
FR188: Epic 3 - Related-field highlighting
FR189: Epic 3 - Draft behavior
FR190: Epic 3 - Validation references
FR191: Epic 3 - Completion validation sequence
FR192: Epic 3 - Validation parity and testing
FR193: Epic 3 - Validation dependencies
FR194: Epic 3 - Layout components
FR195: Epic 3 - Section grouping
FR196: Epic 3 - No nested Sections
FR197: Epic 3 - Conditional Section state
FR198: Epic 3 - Section validation behavior
FR199: Epic 3 - Semantic emphasis
FR200: Epic 3 - Controlled visual system
FR201: Epic 3 - Hidden-control reflow
FR202: Epic 3 - Reflow boundaries
FR203: Epic 3 - Visibility restoration
FR204: Epic 1 - Save Draft action
FR205: Epic 1 - Complete Task action
FR206: Epic 1 - Configurable completion label
FR207: Epic 1 - Business decisions as Process Data
FR208: Epic 1 - Completion sequence
FR209: Epic 1 - Failed completion
FR210: Epic 1 - Completion audit
FR211: Epic 5 - Deferred outcome buttons
FR212: Epic 1 - MVP Workflow elements
FR213: Epic 1 - Minimum valid graph
FR214: Epic 1 - Start and End cardinality
FR215: Epic 1 - Task cardinality
FR216: Epic 4 - Conditional Routing cardinality
FR217: Epic 4 - Conditional Routing targets
FR218: Epic 4 - Conditional Routing evaluation
FR219: Epic 4 - Routing does not mutate data
FR220: Epic 4 - Chained Routing elements
FR221: Epic 4 - Cycle rules
FR222: Epic 1 - Validation timing
FR223: Epic 1 - Reachability and termination
FR224: Epic 4 - Reference validation
FR225: Epic 4 - Automatic-cycle validation
FR226: Epic 1 - Actionable validation display
FR227: Epic 1 - Invalid draft handling
FR228: Epic 1 - Immutable publication
FR229: Epic 1 - One shared draft
FR230: Epic 1 - Draft attribution
FR231: Epic 4 - Explicit version access
FR232: Epic 4 - Draft status visibility
FR233: Epic 4 - Exclusive edit lease
FR234: Epic 4 - Concurrent read-only access
FR235: Epic 1 - Draft autosave
FR236: Epic 4 - Stale lease recovery
FR237: Epic 4 - Administrative takeover
FR238: Epic 4 - Stale-write protection
FR239: Epic 4 - Draft collaboration audit
FR240: Epic 1 - Production isolation
FR241: Epic 4 - Task removal lifecycle
FR242: Epic 4 - Open Task protection
FR243: Epic 4 - Deactivation impact confirmation
FR244: Epic 4 - Automatic connection cleanup
FR245: Epic 4 - No automatic rewiring
FR246: Epic 4 - Historical preservation
FR247: Epic 4 - Inactive Task inspection
FR248: Epic 4 - Task reactivation
FR249: Epic 9 - Active-instance continuation
FR250: Epic 9 - Compatible current-Form update
FR251: Epic 9 - Immutable completed history
FR252: Epic 9 - Repeated Task occurrence
FR253: Epic 9 - Task occurrence identity
FR254: Epic 9 - Repeated data editing
FR255: Epic 9 - Version restoration
FR256: Epic 4 - Instance State catalog
FR257: Epic 4 - Initial Instance State
FR258: Epic 4 - Transition state property
FR259: Epic 4 - Current state visibility
FR260: Epic 4 - State use and preservation
FR261: Epic 4 - State-change audit
FR262: Epic 4 - Task activation audit
FR263: Epic 4 - Assignment audit
FR264: Epic 4 - Task completion audit
FR265: Epic 4 - Loop chronology
FR266: Epic 4 - Open-view status monitoring
FR267: Epic 4 - Polling interval
FR268: Epic 4 - New revision notification
FR269: Epic 4 - Published draft transition
FR270: Epic 4 - Discarded draft transition
FR271: Epic 4 - Lease-state synchronization
FR272: Epic 4 - No offline push requirement
FR273: Epic 4 - Deferred live collaboration
FR274: Epic 1 - Active instance
FR275: Epic 1 - Completed instance
FR276: Epic 5 - Cancelled instance
FR277: Epic 5 - Needs Attention instance
FR278: Epic 5 - Available Task
FR279: Epic 1 - Assigned Task
FR280: Epic 1 - In Progress Task
FR281: Epic 5 - Needs Reassignment Task
FR282: Epic 1 - Completed Task
FR283: Epic 5 - Cancelled Task
FR284: Epic 5 - Cancellation authority
FR285: Epic 5 - Cancellation effects
FR286: Epic 5 - Cancellation audit
FR287: Epic 5 - No reopen in MVP
FR288: Epic 1 - My Work navigation
FR289: Epic 1 - Default landing view
FR290: Epic 6 - My Tasks contents
FR291: Epic 6 - My Tasks statuses
FR292: Epic 6 - No completed Tasks in inbox
FR293: Epic 1 - My Processes contents
FR294: Epic 1 - My Processes defaults
FR295: Epic 1 - My Processes purpose
FR296: Epic 1 - Process detail access
FR297: Epic 6 - Team eligibility visibility
FR298: Epic 1 - Start a Process
FR299: Epic 6 - Administrative runtime views
FR300: Epic 6 - Designer data boundary
FR301: Epic 6 - Deferred dashboard customization
FR302: Epic 1 - My Tasks columns
FR303: Epic 1 - My Tasks search
FR304: Epic 6 - My Tasks filters
FR305: Epic 6 - My Tasks sorting
FR306: Epic 1 - My Processes columns
FR307: Epic 6 - My Processes search and filters
FR308: Epic 1 - My Processes sorting
FR309: Epic 6 - Needs Attention columns
FR310: Epic 6 - All Processes columns
FR311: Epic 6 - Administrative filters
FR312: Epic 1 - Start Process catalog
FR313: Epic 6 - Table sorting interaction
FR314: Epic 6 - Active filter display
FR315: Epic 1 - Authorized server querying
FR316: Epic 1 - Pagination
FR317: Epic 6 - Responsive dashboard presentation
FR318: Epic 6 - Deferred table personalization
FR319: Epic 7 - Task notification property
FR320: Epic 7 - Assignment email default
FR321: Epic 7 - Individual assignment recipient
FR322: Epic 7 - Team availability recipients
FR323: Epic 7 - Reassignment behavior
FR324: Epic 7 - Disabled behavior
FR325: Epic 7 - No retroactive email
FR326: Epic 7 - Assignment source audit
FR327: Epic 7 - Transition notification property
FR328: Epic 7 - Transition notification recipients
FR329: Epic 7 - Transition notification content
FR330: Epic 7 - No business data in email
FR331: Epic 7 - Duplicate consolidation
FR332: Epic 7 - Email localization
FR333: Epic 7 - Delivery tracking
FR334: Epic 7 - Idempotent retry
FR335: Epic 7 - Deferred channels
FR336: Epic 7 - Operational email setting
FR337: Epic 7 - Dashboard alert remains automatic
FR338: Epic 7 - Enabled operational email
FR339: Epic 7 - Team email opt-in confirmation
FR340: Epic 8 - Configuration Audit
FR341: Epic 8 - Transactional Audit
FR342: Epic 8 - Administrative audit access
FR343: Epic 8 - Designer audit access
FR344: Epic 8 - Member timeline instead of audit
FR345: Epic 8 - Tenant-isolated audit
FR346: Epic 1 - Process Detail header
FR347: Epic 1 - Simplified timeline
FR348: Epic 6 - Own submission details
FR349: Epic 6 - Other-user summary boundary
FR350: Epic 6 - Loop timeline
FR351: Epic 6 - Full-audit navigation
FR352: Epic 8 - Immutable audit entries
FR353: Epic 8 - Audit search and filters
FR354: Epic 8 - Value-change evidence
FR355: Epic 8 - File audit boundary
FR356: Epic 8 - Time representation
FR357: Epic 8 - Secret exclusion
FR358: Epic 8 - Audit export
FR359: Epic 8 - Technical log separation
FR360: Epic 8 - Process retention
FR361: Epic 8 - Active Organization retention
FR362: Epic 8 - No inactivity deletion
FR363: Epic 8 - Explicit file deletion
FR364: Epic 8 - Complete Organization export
FR365: Epic 8 - Secure export delivery
FR366: Epic 8 - Closure authority
FR367: Epic 8 - Pre-closure export
FR368: Epic 8 - Reversible closure window
FR369: Epic 8 - Final active-data deletion
FR370: Epic 11 - Backup expiration after closure (Epic 8 records the governed expiration obligation; Epic 11 proves physical expiry against the implemented backup substrate)
FR371: Epic 8 - Beta data responsibility
FR372: Epic 8 - Prohibited beta data
FR373: Epic 8 - Evolution through revision
FR374: Epic 1 - Strong password length
FR375: Epic 1 - Passphrase-friendly input
FR376: Epic 1 - Weak-password blocking
FR377: Epic 1 - Password usability
FR378: Epic 1 - Password-change policy
FR379: Epic 1 - Credential protection
FR380: Epic 1 - Authentication throttling
FR381: Epic 1 - Secure password recovery
FR382: Epic 1 - Server-side deactivation
FR383: Epic 1 - Authorization on protected requests
FR384: Epic 1 - Client behavior after revocation
FR385: Epic 1 - No real-time dependency
FR386: Epic 1 - Session termination
FR387: Epic 1 - Generic authentication errors
FR388: Epic 1 - No resource-existence disclosure
FR389: Epic 1 - Safe unexpected errors
FR390: Epic 1 - Safe validation errors
FR391: Epic 1 - Protected diagnostics
FR392: Epic 1 - Log sanitization
FR393: Epic 1 - Error consistency
FR394: Epic 1 - Organization ownership
FR395: Epic 1 - Trusted Organization context
FR396: Epic 1 - Server-enforced permissions
FR397: Epic 1 - Scoped queries and operations
FR398: Epic 1 - Deny by default
FR399: Epic 1 - Identifier tampering protection
FR400: Epic 1 - Organization-limited administration
FR401: Epic 1 - Automated isolation coverage
FR402: Epic 1 - Isolation release gate
FR403: Epic 1 - MVP authentication model
FR404: Epic 1 - Email verification requirement
FR405: Epic 1 - Verification-link protection
FR406: Epic 1 - Initial Owner verification
FR407: Epic 2 - Invited-user verification
FR408: Epic 2 - Email-address change
FR409: Epic 2 - Verification abuse protection
FR410: Epic 2 - MFA deferred
FR411: Epic 2 - SSO and passkeys deferred
FR412: Epic 7 - Private storage
FR413: Epic 7 - File-request authorization
FR414: Epic 7 - Non-authoritative links
FR415: Epic 7 - Temporary storage access
FR416: Epic 7 - Removal revocation
FR417: Epic 7 - Permission-change enforcement
FR418: Epic 7 - Organization-scoped export generation
FR419: Epic 7 - Export availability window
FR420: Epic 7 - Owner-only export access
FR421: Epic 7 - Export audit
FR422: Epic 7 - Export-ready notification
FR423: Epic 7 - Downloaded-copy boundary
FR424: Epic 1 - Encrypted transport
FR425: Epic 1 - Provider encryption at rest
FR426: Epic 1 - No custom cryptography
FR427: Epic 1 - Secret isolation
FR428: Epic 1 - Server-only privileged credentials
FR429: Epic 1 - Environment separation
FR430: Epic 1 - No production data in non-production
FR431: Epic 1 - Process Data logging boundary
FR432: Epic 1 - Safe operational telemetry
FR433: Epic 1 - Security configuration validation
FR434: Epic 11 - OWASP Top 10 baseline
FR435: Epic 11 - OWASP verification catalog
FR436: Epic 11 - MITRE ATT&CK SaaS scenarios
FR437: Epic 11 - MVP threat-model scope
FR438: Epic 11 - Security traceability
FR439: Epic 11 - Threat-model maintenance
FR440: Epic 11 - Framework claim boundary
FR441: Epic 11 - Explicit deferred-risk handling
FR442: Epic 11 - Release-gate scope
FR443: Epic 11 - Isolation gate
FR444: Epic 11 - Identity and authorization gate
FR445: Epic 11 - File, export, and audit gate
FR446: Epic 11 - Baseline and threat-review gate
FR447: Epic 11 - Dependency and secret scanning
FR448: Epic 11 - Finding severity rule
FR449: Epic 11 - Production-configuration gate
FR450: Epic 11 - Gate evidence
FR451: Epic 11 - Failed-gate behavior
FR452: Epic 11 - Daily backup scope
FR453: Epic 11 - Encrypted separate destination
FR454: Epic 11 - Backup retention
FR455: Epic 11 - Recovery point objective
FR456: Epic 11 - Recovery time objective
FR457: Epic 11 - Restoration verification
FR458: Epic 11 - Backup-failure alert
FR459: Epic 11 - Export distinction
FR460: Epic 11 - Real-data onboarding boundary
FR461: Epic 1 - Public landing page
FR462: Epic 1 - Audience and value proposition
FR463: Epic 1 - Time-to-value message
FR464: Epic 1 - Supported-capability accuracy
FR465: Epic 1 - Minimum content structure
FR466: Epic 1 - Representative use cases
FR467: Epic 1 - Fictional example organizations
FR468: Epic 1 - No fabricated social proof
FR469: Epic 1 - Safe mock data
FR470: Epic 1 - Initial mock scenario set
FR471: Epic 1 - Primary application link
FR472: Epic 1 - Existing-user link
FR473: Epic 1 - Configurable application destination
FR474: Epic 1 - Authenticated application boundary
FR475: Epic 1 - Free-beta accuracy and support
FR476: Epic 1 - Registration continuity
FR477: Epic 1 - Bilingual landing page
FR478: Epic 1 - Responsive and accessible presentation
FR479: Epic 1 - Search and sharing metadata
FR480: Epic 1 - Lightweight delivery
FR481: Epic 1 - Privacy-safe acquisition analytics
FR482: Epic 1 - Consent and tracker restraint
FR483: Epic 1 - Marketing-content maintainability
FR484: Epic 1 - One Organization per account
FR485: Epic 1 - Globally unique account email
FR486: Epic 1 - Separate identity for another Organization
FR487: Epic 1 - Persistent Organization association
FR488: Epic 1 - No Organization switching
FR489: Epic 1 - Multi-Organization membership deferred
FR490: Epic 1 - PADR supersession
FR491: Epic 1 - Owner registration fields
FR492: Epic 1 - Registration defaults
FR493: Epic 1 - Registration acceptance
FR494: Epic 1 - Pending Organization and environment boundary
FR495: Epic 1 - Initial Owner activation
FR496: Epic 2 - Pending-user creation
FR497: Epic 2 - Organization-bound activation
FR498: Epic 2 - Activation-link lifetime
FR499: Epic 2 - User-controlled activation
FR500: Epic 2 - Pending-user restrictions
FR501: Epic 2 - Resend and revoke
FR502: Epic 2 - Password ownership
FR503: Epic 2 - Membership statuses
FR504: Epic 2 - Administrator privilege boundary
FR505: Epic 2 - Owner management authority
FR506: Epic 2 - Identity administration audit
FR507: Epic 2 - Environment-appropriate automatic activation
FR508: Epic 2 - No manual admission review
FR509: Epic 2 - Initial active capacity
FR510: Epic 2 - Capacity-full behavior
FR511: Epic 2 - Configurable global capacity
FR512: Epic 2 - Active-Organization priority
FR513: Epic 2 - Initial Organization limits
FR514: Epic 2 - Anniversary usage cycle
FR515: Epic 2 - Short-month anniversary
FR516: Epic 2 - Usage visibility and warning
FR517: Epic 2 - Non-destructive limit enforcement
FR518: Epic 2 - No automatic charge
FR519: Epic 2 - Audited exceptions
FR520: Epic 10 - Organization activity timestamp
FR521: Epic 10 - First inactivity warning
FR522: Epic 10 - Final pre-dormancy warning
FR523: Epic 10 - Automatic Dormant status
FR524: Epic 10 - Dormant data preservation
FR525: Epic 10 - Restricted recovery access
FR526: Epic 10 - Capacity-bound restoration
FR527: Epic 10 - Restoration outcome
FR528: Epic 10 - Fourteen-day recovery maximum
FR529: Epic 10 - Final inactive-data deletion
FR530: Epic 10 - No silent policy
FR531: Epic 10 - Inactivity lifecycle audit
FR532: Epic 10 - Inactivity-deletion supersession
FR533: Epic 10 - Complete Organization identity deletion
FR534: Epic 10 - Credential invalidation on final deletion
FR535: Epic 10 - Email release
FR536: Epic 10 - Fresh registration after deletion
FR537: Epic 10 - Historical Organization Register
FR538: Epic 10 - Permitted historical metadata
FR539: Epic 10 - Prohibited historical contents
FR540: Epic 10 - Historical-register isolation
FR541: Epic 10 - Non-restorable historical record
FR542: Epic 10 - Backup separation after deletion
FR543: Epic 10 - Historical-retention disclosure
FR544: Epic 10 - Historical-record retention
FR545: Epic 10 - Consolidated statistics after expiration
FR546: Epic 1 - Supported application languages
FR547: Epic 1 - Personal interface language
FR548: Epic 1 - Organization language default
FR549: Epic 2 - Organization-language administration
FR550: Epic 2 - Designer-content boundary
FR551: Epic 2 - Deferred authored-content localization
FR552: Epic 1 - Translation safety
FR553: Epic 2 - Organization regional settings
FR554: Epic 2 - Regional-settings administration
FR555: Epic 2 - Organization-consistent business values
FR556: Epic 2 - Locale-neutral persistence
FR557: Epic 2 - Regional input semantics
FR558: Epic 2 - Email and audit formatting
FR559: Epic 2 - Currency as a field type
FR560: Epic 2 - Progressive currency override
FR561: Epic 2 - Organization-currency correction and lock
FR562: Epic 2 - Published field-currency immutability
FR563: Epic 2 - Mixed-currency safety
FR564: Epic 2 - No exchange-rate conversion
FR565: Epic 2 - Unambiguous currency display
FR566: Epic 2 - Translation completeness gate
FR567: Epic 2 - Deferred language expansion
FR568: Epic 1 - Organization-wide Designer catalog
FR569: Epic 1 - Production-data boundary
FR570: Epic 1 - Workflow creation metadata
FR571: Epic 1 - Initial blank canvas
FR572: Epic 1 - Catalog status and columns
FR573: Epic 1 - Active-Process summary
FR574: Epic 1 - Catalog querying
FR575: Epic 4 - Active-name uniqueness
FR576: Epic 4 - Metadata editing
FR577: Epic 4 - Historical metadata
FR578: Epic 4 - Draft-only deletion
FR579: Epic 4 - Published archive boundary
FR580: Epic 4 - Archive runtime behavior
FR581: Epic 4 - Archive preservation
FR582: Epic 4 - Archived definition access
FR583: Epic 4 - Reactivation readiness
FR584: Epic 4 - Reactivation requiring changes
FR585: Epic 4 - Duplicate source
FR586: Epic 4 - Independent duplicate identity
FR587: Epic 4 - Copied definition configuration
FR588: Epic 4 - No runtime-data duplication
FR589: Epic 4 - Duplicate validation and audit
FR590: Epic 4 - Version History view
FR591: Epic 4 - Restoration reason
FR592: Epic 4 - Restoration comparison
FR593: Epic 4 - Restoration publication sequence
FR594: Epic 4 - Published-Workflow quota unit
FR595: Epic 4 - Archive frees published capacity
FR596: Epic 4 - Quota-safe publication
FR597: Epic 9 - No periodic runtime-Form polling
FR598: Epic 9 - Explicit-action checks
FR599: Epic 9 - Opened-definition identity
FR600: Epic 9 - Reassigned open-Form rejection
FR601: Epic 9 - Reassigned Form exit
FR602: Epic 9 - Stale-definition rejection
FR603: Epic 9 - Latest Form after reload
FR604: Epic 9 - New requirements on open Tasks
FR605: Epic 9 - Removed-control preservation
FR606: Epic 9 - Open-assignment impact preview
FR607: Epic 9 - Publication-time assignment resolution
FR608: Epic 9 - Unresolvable change blocks publication
FR609: Epic 9 - Valid open-Task reassignment
FR610: Epic 9 - Reassignment status result
FR611: Epic 9 - Reassignment notification behavior
FR612: Epic 9 - Serialized conflicting operations
FR613: Epic 9 - Publication-first outcome
FR614: Epic 9 - Task-write-first outcome
FR615: Epic 9 - Completion version consistency
FR616: Epic 9 - New version after completion-first ordering
FR617: Epic 9 - Atomic publication impact
FR618: Epic 9 - Concurrency audit
FR619: Epic 3 - Instruction Text purpose
FR620: Epic 3 - Read-only Display Value
FR621: Epic 3 - Type-appropriate read-only rendering
FR622: Epic 3 - Empty read-only value
FR623: Epic 3 - Optional acknowledgment
FR624: Epic 1 - One Form per active Task
FR625: Epic 1 - Meaningful visible content
FR626: Epic 1 - Decorative-only Form rejection
FR627: Epic 1 - Form-reference validation
FR628: Epic 3 - Structured-control validation
FR629: Epic 3 - Rule and calculation validation
FR630: Epic 1 - Constraint consistency
FR631: Epic 3 - Hidden-content warning
FR632: Epic 1 - Draft preservation
