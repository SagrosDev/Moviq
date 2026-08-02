# Epic 3: Expand Forms with Rich Process Data and Business Rules

Designers can expand the minimal Epic 1 Form builder with complete Process Field types, reusable data, tables, calculations, conditional behavior, validation, advanced layouts, and informational presentation.

**Primary FR coverage:** FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR74, FR75, FR76, FR77, FR78, FR79, FR80, FR81, FR82, FR83, FR84, FR85, FR86, FR87, FR88, FR89, FR90, FR91, FR92, FR93, FR94, FR95, FR96, FR97, FR98, FR99, FR100, FR101, FR102, FR103, FR104, FR105, FR106, FR107, FR109, FR110, FR111, FR113, FR126, FR127, FR128, FR129, FR130, FR131, FR132, FR133, FR134, FR135, FR136, FR137, FR138, FR139, FR140, FR141, FR142, FR143, FR144, FR145, FR146, FR147, FR148, FR149, FR150, FR151, FR152, FR153, FR154, FR155, FR156, FR157, FR158, FR159, FR160, FR161, FR162, FR163, FR164, FR165, FR166, FR167, FR169, FR170, FR171, FR172, FR174, FR175, FR177, FR178, FR179, FR186, FR187, FR188, FR189, FR190, FR191, FR192, FR193, FR194, FR195, FR196, FR197, FR198, FR199, FR200, FR201, FR202, FR203, FR619, FR620, FR621, FR622, FR623, FR628, FR629, FR631.

## Story 3.1: Configure Text Fields and Friendly Validation

As a Designer,
I want Short and Long Text fields with understandable constraints,
So that participants enter bounded plain text safely.

**Acceptance Criteria:**

**Given** a new Short or Long Text field
**When** the Designer configures label/help/placeholder/default/minimum/maximum and a supported friendly Short Text format
**Then** defaults and platform maxima are enforced (`255` Short, `10,000` Long), minimum cannot exceed maximum, and email/telephone/URL/alphabetic/alphanumeric feedback is plain-language
**And** raw regex, executable validation, rich text, HTML, and calculation mode are unavailable. Traceability: FR49, FR50, FR51, FR52, FR53.

**Given** a visible/enabled text control at runtime
**When** draft save or Task completion submits empty, malformed, too-short, too-long, or valid text
**Then** UI and server produce the same authorized field result, invalid data is not persisted, and valid plain text is stored exactly once
**And** conditional visibility/editability/required behavior uses the shared rule engine. Traceability: FR54, AD-6.

## Story 3.2: Configure Numeric and Currency Fields

As a Designer,
I want safe Integer, Decimal, and Currency fields,
So that accepted numeric values remain representable and reusable.

**Acceptance Criteria:**

**Given** a new numeric field
**When** defaults, negative-value option, min/max, decimal precision, default value, and Currency ISO code are configured
**Then** the server enforces the documented business defaults and platform Integer range, rejects min greater than max or unsupported precision/currency, and distinguishes empty from zero
**And** every accepted value fits the PostgreSQL precision/scale. Traceability: FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR64.

**Given** Organization regional presentation and invariant stored decimals
**When** users view/edit valid and invalid numeric values or a calculation/rule references them
**Then** grouping/decimal/currency display follows Organization settings without changing stored value, invalid drafts/completions are rejected field-by-field, and compatible references are typed
**And** real-PostgreSQL boundary tests cover minimum, maximum, overflow, empty, zero, and negative cases. Traceability: FR57, FR58, FR65, FR66.

## Story 3.3: Configure Date and Date-Time Fields

As a Designer,
I want bounded Date and Date-Time fields with relative constraints,
So that participants enter calendar values consistently.

**Acceptance Criteria:**

**Given** a new Date or Date-Time field
**When** empty/fixed/Today/Now defaults and fixed, relative-day, or compatible-field min/max constraints are configured
**Then** Date stores no time, Date-Time preserves an instant, the supported range is 1900-01-01 through 2100-12-31, and incompatible/cyclic constraints block publication
**And** display uses Organization format/timezone. Traceability: FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR74.

**Given** manual input and an on-demand calendar/time selector
**When** a participant selects or types an out-of-range, constraint-violating, invalid, or valid value on desktop/mobile
**Then** equivalent inputs receive the same server result, unavailable picker choices cannot be selected, invalid values are not saved/completed, and valid values persist canonically
**And** native mobile controls may be used without changing semantics. Traceability: FR75, FR76, FR77, FR78.

## Story 3.4: Configure Yes/No Fields

As a Designer,
I want explicit-selector and confirmation-checkbox Yes/No controls,
So that required answers have unambiguous meaning.

**Acceptance Criteria:**

**Given** a new Yes/No field
**When** the Designer chooses explicit choices or confirmation checkbox and an empty/Yes/No default
**Then** the stored domain remains empty/Yes/No, explicit choices initially show no selection unless defaulted, and checkbox checked means Yes
**And** the configuration preview uses accessible names/states. Traceability: FR79, FR80, FR81, FR82, FR83.

**Given** the control is required
**When** Task completion occurs
**Then** explicit presentation accepts either Yes or No, confirmation presentation accepts only checked/Yes, and failing input is not persisted as completion
**And** the value is available as a typed operand to rules, calculations, and routing. Traceability: FR82, FR84.

## Story 3.5: Manage Choice Fields and Reusable Lists

As a Designer,
I want stable local or Organization Choice options,
So that selections survive label changes and reusable-list evolution.

**Acceptance Criteria:**

**Given** Single Choice or Multiple Choice
**When** local options or an Organization Choice List is configured
**Then** Single stores one stable option ID, Multiple stores a de-duplicated ordered/set representation of zero or more IDs, labels remain presentation data, and cross-Organization lists/options are rejected
**And** Designers/Administrators/Owners may manage Organization lists. Traceability: FR85, FR86, FR87, FR88, FR89, FR90, FR91.

**Given** an option/list is renamed, reordered, deactivated, historically selected, or proposed for deletion
**When** design/runtime views load or publication validates
**Then** stable historical meaning remains, inactive options cannot be newly selected, referenced items are preserved rather than physically deleted, and invalid required/source states block publication
**And** list changes are audited and typed rules reference option IDs. Traceability: FR88, FR89, FR90, FR91, FR92, FR93, FR94, FR95, FR96.

## Story 3.6: Configure User Reference Fields

As a Designer,
I want a Process Field that references an Organization user,
So that forms and dynamic assignment can use one validated identity.

**Acceptance Criteria:**

**Given** a User Reference field
**When** the Designer configures eligible active Members/roles/Teams and optional/default behavior
**Then** selection queries remain Organization-scoped, store a stable user/Membership reference, and reject inactive, ineligible, or foreign users
**And** labels expose only authorized identity attributes. Traceability: FR97, FR98, FR99, FR100, FR101, FR102, FR103.

**Given** a referenced user later becomes inactive or invalid
**When** a Form displays the historical value or runtime assignment resolves it
**Then** historical identity remains readable to authorized users, new selection is prevented, and assignment enters Needs Reassignment rather than silently choosing another user
**And** rules/calculations use only supported typed identity comparisons. Traceability: FR104, FR105, FR106, FR107.

## Story 3.7: Reuse and Reactivate Process Fields

As a Designer,
I want one Process Field reused across Task Forms and safely deactivated,
So that later Tasks share instance data without copies.

**Acceptance Criteria:**

**Given** one stable Process Field bound to multiple Task Forms
**When** an authorized participant updates it in a later active Task
**Then** the instance holds one current typed value, earlier transactional audit remains immutable, and every authorized reuse displays the same current value
**And** another field is never created implicitly. Traceability: FR109, FR110, FR111.

**Given** a field is referenced by Forms, rules, calculations, routing, instances, or audit
**When** a Designer deactivates and later reactivates it
**Then** physical deletion is blocked, new configuration excludes it while historical references remain valid, and reactivation restores design eligibility without changing stable identity
**And** publication reports any active dependency that cannot execute. Traceability: FR113.

## Story 3.8: Configure Data Tables and Row Editing

As a Designer and Task participant,
I want typed Data Tables with validated row operations,
So that structured repeating data can be collected safely.

**Acceptance Criteria:**

**Given** a Data Table field
**When** columns, minimum/maximum rows, required state, supported types, and common table/column/cell rules are configured
**Then** only MVP column types are accepted, empty/invalid rows do not satisfy minimum, condition scope follows the PRD, and deferred nested/file/long-text/multiple-choice/import/row-visibility features are unavailable
**And** advanced settings are progressively disclosed. Traceability: FR126, FR127, FR128, FR129, FR130, FR131, FR132, FR133, FR134, FR135, FR136, FR141, FR142.

**Given** an enabled editable table in an authorized Task
**When** a participant adds, edits, or removes a row
**Then** stable row identity, typed cell validation, min/max rows, conditional state, Process Data, and semantic audit commit atomically; an invalid operation leaves the prior table intact
**And** later authorized Task reuse displays the same rows. Traceability: FR127, FR128, FR129, FR130, FR131, FR132, FR139.

## Story 3.9: Calculate and Aggregate Table Values

As a Designer,
I want calculated columns and supported aggregates,
So that common table totals require no executable code.

**Acceptance Criteria:**

**Given** compatible same-row columns
**When** a Designer builds a calculated column such as Quantity × Unit price
**Then** the typed AST validates, the backend interpreter computes a read-only value deterministically, and frontend preview uses the backend result
**And** arbitrary script or cross-row expression entry is impossible. Traceability: FR137, FR140, AD-6.

**Given** count, sum, average, minimum, or maximum over a compatible column
**When** rows change or the aggregate is referenced
**Then** the backend recomputes using defined empty/null/precision semantics and persists only the authoritative Process Data representation
**And** golden fixtures cover boundary and schema-version behavior. Traceability: FR138, FR140.

## Story 3.10: Build Calculated Fields Visually

As a Designer,
I want visual typed formulas,
So that derived values are safe, explainable, and consistent.

**Acceptance Criteria:**

**Given** compatible Process Fields and supported operators/functions
**When** the Designer composes, previews, saves, or publishes a formula
**Then** the frontend emits a versioned typed AST, the backend validates operand/result types and dependency graph, and preview invokes the same interpreter used at runtime
**And** raw code/expression text cannot execute. Traceability: FR143, FR144, FR145, FR146, FR147, FR148, FR149, FR150, AD-6.

**Given** missing values, decimal/currency precision, division errors, incompatible units/types, or circular references
**When** validation/evaluation runs
**Then** deterministic documented semantics or a stable blocking issue results, no invalid calculated value is persisted, and dependent fields/routes see only a valid result
**And** golden conformance fixtures cover every operator and supported schema version. Traceability: FR151, FR152, FR153, FR154, FR155.

## Story 3.11: Build Shared Visual Rules

As a Designer,
I want one visual condition language for forms and routing,
So that behavior is predictable across authoring and runtime.

**Acceptance Criteria:**

**Given** typed field/constant operands and supported comparisons/groups
**When** the Designer builds AND/OR conditions
**Then** the draft stores one versioned typed AST with explicit ordering/default semantics, validates compatible operands/references, and renders a plain-language summary
**And** scripts, raw expressions, and nondeterministic functions are impossible. Traceability: FR156, FR157, FR158, FR159, FR160, FR161, FR162, FR163, AD-6.

**Given** a saved rule and representative Process Data
**When** preview and runtime evaluation execute
**Then** both call the backend interpreter and return the same boolean/result plus safe explanation data
**And** missing/inactive references or cycles block publication through linked issues. Traceability: FR164, FR165, FR166, FR167.

## Story 3.12: Apply Conditional Form Behavior

As a Designer,
I want controls conditionally visible, enabled, and required,
So that Task Forms adapt without inconsistent validation.

**Acceptance Criteria:**

**Given** shared visual rules bound to a Form control
**When** referenced values change
**Then** backend-authoritative state determines visibility, enabled/editable state, and requiredness; the UI updates accessibly without treating hidden/disabled controls as required
**And** reappearing/re-enabled controls resume applicable validation. Traceability: FR169, FR170, FR171, FR172, FR173, FR174, FR175.

**Given** a client tampers with hidden/disabled values or completes against stale conditional state
**When** save/completion validates
**Then** unauthorized/stale changes are rejected atomically and only permitted Process Data is persisted
**And** the error identifies the current authorized control state without exposing hidden data.

## Story 3.13: Configure Advanced Responsive Form Widths

As a Designer,
I want supported control widths with deterministic reflow,
So that forms remain readable across participant devices.

**Acceptance Criteria:**

**Given** an authoring viewport of at least 1280×720
**When** the Designer selects supported width/order properties through pointer or non-drag controls
**Then** the draft stores semantic layout values rather than device pixels and preview shows the approved desktop arrangement
**And** unsupported overlaps/widths are rejected. Traceability: FR177, FR178, FR179, UX-DR16, UX-DR21.

**Given** the Form runs on mobile, tablet, laptop, desktop, or at 200% text
**When** available width cannot preserve the authored row
**Then** controls reflow in stable reading/focus order, required labels/help/errors/actions remain available, and no horizontal operation is lost
**And** automated responsive/accessibility tests cover representative layouts. Traceability: UX-DR18, UX-DR20.

## Story 3.14: Create Cross-Field Validation Rules

As a Designer,
I want visual cross-field validation with corrective messages,
So that related values can be checked before save or completion.

**Acceptance Criteria:**

**Given** compatible fields and the shared rule builder
**When** the Designer defines a validation condition, localized corrective message, and applicable save/completion timing
**Then** the versioned AST validates references/types, message requirements, and cycles and appears in plain language
**And** invalid definitions block publication. Traceability: FR186, FR187, FR188, FR189, FR190.

**Given** runtime values that fail or pass the rule
**When** draft save or Task completion is attempted
**Then** the backend interpreter returns field/form-level authorized feedback and rejects the entire invalid write, while a passing attempt commits normally
**And** hidden/restricted values are neither repeated nor exposed in the message. Traceability: FR191, FR192, FR193, AD-6, AD-7.

## Story 3.15: Compose Forms with Layout Components

As a Designer,
I want headings, instructions, separators, and grouped layout,
So that complex Forms remain understandable without collecting fake data.

**Acceptance Criteria:**

**Given** supported non-input layout components
**When** the Designer adds, orders, labels, groups, or conditionally displays them
**Then** they store stable layout IDs, collect no Process Data, preserve semantic heading/reading order, and reflow with neighboring controls
**And** decorative content cannot inject HTML/script. Traceability: FR194, FR195, FR196, FR197, FR198, FR199, FR200.

**Given** conditional layout components become hidden or visible
**When** the Form recomputes layout
**Then** hidden space collapses predictably, focus does not move into hidden content, and related input validation follows its own control state
**And** keyboard, touch, screen-reader, and 200% text tests preserve required operation. Traceability: FR201, FR202, FR203.

## Story 3.16: Present Informational and Read-Only Tasks

As a Designer,
I want Tasks that inform or display authorized data without requiring input,
So that a Process can include acknowledgement or review steps.

**Acceptance Criteria:**

**Given** a Task Form containing only informational/layout/read-only authorized content
**When** the Designer validates and publishes it
**Then** publication accepts it when it has meaningful visible content and a valid completion action, without inventing a required input
**And** an empty/misleading Form receives a blocking issue. Traceability: FR619, FR620, FR621, FR622, FR623.

**Given** a participant opens and completes the informational Task
**When** no editable Process Field is present
**Then** authorized content renders accessibly, completion records the occurrence/audit and routes normally, and no Process Data value is fabricated
**And** restricted values remain absent.

## Story 3.17: Validate Advanced Form Definitions for Publication

As a Designer,
I want complete dependency validation for advanced Forms,
So that published versions cannot contain unusable fields or rules.

**Acceptance Criteria:**

**Given** advanced fields, tables, calculations, conditions, validations, and layouts
**When** publication validation runs
**Then** it detects missing/inactive references, incompatible types, cycles, invalid defaults/constraints, unreachable required input, invalid choice/user/list sources, and hidden-content risks with stable linked issue codes
**And** no version is published until all blocking issues are repaired. Traceability: FR628, FR629, FR631.

**Given** all dependencies are valid
**When** the same draft revision is validated repeatedly
**Then** issue ordering and result are deterministic, preview/runtime conformance fixtures pass, and the checklist contains no stale resolved issue
**And** the immutable publication snapshot includes current schema versions for every document/AST. Traceability: AD-4, AD-6, UX-DR10.
