# Epic List

## Epic 1: Validate the Core Moviqo Journey End to End
Company stakeholders can use the deployed internal environment to register an Owner, create a simple Task Form and executable Workflow, publish it, start a Process, complete its Task, and inspect the result using persistent synthetic data.

**FRs covered:** FR17–FR18, FR20–FR21, FR26, FR39, FR41, FR48, FR108, FR112, FR168, FR173, FR176, FR180–FR185, FR204–FR210, FR212–FR215, FR222–FR223, FR226–FR230, FR235, FR240, FR274–FR275, FR279–FR280, FR282, FR288–FR289, FR293–FR296, FR298, FR302–FR303, FR306, FR308, FR312, FR315–FR316, FR346–FR347, FR374–FR406, FR424–FR433, FR461–FR495, FR546–FR548, FR552, FR568–FR574, FR624–FR627, FR630, FR632

**Implementation notes:** This is the first stakeholder-testable vertical slice. It includes the structural seed, internal UAT deployment, tenant isolation, secure authentication, a minimal Short Text Task Form builder and runtime, Start → Task → End publication, Process execution, My Tasks/My Processes, and an automated E2E regression journey.

## Epic 2: Administer the Organization, People, Teams, and Settings
Owners and Administrators can create and activate users, manage access levels and Teams, protect ownership continuity, configure regional behavior, and administer beta capacity and quotas.

**FRs covered:** FR1–FR10, FR33–FR38, FR407–FR411, FR496–FR519, FR549–FR551, FR553–FR567

**Implementation notes:** Builds on the secure Organization created in Epic 1 and supplies the people, Teams, settings, and limits used by later assignment and runtime capabilities.

## Epic 3: Expand Forms with Rich Process Data and Business Rules
Designers can expand the minimal Epic 1 Form builder with complete Process Field types, reusable data, tables, calculations, conditional behavior, validation, advanced layouts, and informational presentation.

**FRs covered:** FR49–FR107, FR109–FR111, FR113, FR126–FR167, FR169–FR172, FR174–FR175, FR177–FR179, FR186–FR203, FR619–FR623, FR628–FR629, FR631

**Implementation notes:** Form creation begins in Epic 1. This epic adds the rich modeling and visual-rule capabilities without blocking the early stakeholder journey.

## Epic 4: Design and Govern Complete Workflow Definitions
Designers can configure every supported starter, assignment, route, state, draft, publication, inactive-element, duplication, archive, restoration, and version-history behavior.

**FRs covered:** FR19, FR22–FR23, FR40, FR42, FR216–FR221, FR224–FR225, FR231–FR234, FR236–FR239, FR241–FR248, FR256–FR273, FR575–FR596

**Implementation notes:** Completes the Workflow Designer beyond the simple executable path proven in Epic 1.

## Epic 5: Coordinate Assigned Work and Runtime Operations
Members can receive or claim Team work and complete it safely, while Administrators can resolve invalid assignments and cancel Processes without losing data or evidence.

**FRs covered:** FR27–FR32, FR43–FR47, FR211, FR276–FR278, FR281, FR283–FR287

**Implementation notes:** Extends the single-participant runtime proven in Epic 1 to Team claiming, dynamic assignment recovery, operational states, and cancellation.

## Epic 6: Navigate Work and Track Authorized Processes
Members can find actionable work and authorized Processes, while Administrators can operate Needs Attention and All Processes using complete search, filter, sorting, and responsive navigation.

**FRs covered:** FR11–FR16, FR24–FR25, FR290–FR292, FR297, FR299–FR301, FR304–FR305, FR307, FR309–FR311, FR313–FR314, FR317–FR318, FR348–FR351

**Implementation notes:** Expands the basic My Tasks/My Processes path from Epic 1 while preserving strict participant and production-data visibility boundaries.

## Epic 7: Exchange Files and Notify Participants Safely
Designers can configure attachments and notifications, participants can use authorized private files, Owners can receive secure exports, and notification delivery remains localized, traceable, and retryable.

**FRs covered:** FR114–FR125, FR319–FR339, FR412–FR423

**Implementation notes:** Consolidates file lifecycle, access, exports, and event-driven communication because they share authorization, outbox, retry, and audit surfaces.

## Epic 8: Inspect Audit Evidence and Govern Retained Data
Authorized users can inspect and export immutable evidence, and Owners can export or close an Organization under explicit retention, recovery, deletion, and prohibited-data policies.

**FRs covered:** FR340–FR345, FR352–FR369, FR371–FR373

**Implementation notes:** Delivers customer-visible accountability and data-governance controls without exposing technical diagnostics as business audit.

## Epic 9: Evolve Live Workflows Without Disrupting Active Work
Designers can publish compatible changes while Processes run, with preserved history, stale-submission protection, assignment updates, and deterministic serialization of publication against Task writes.

**FRs covered:** FR249–FR255, FR597–FR618

**Implementation notes:** Builds on the Workflow and runtime capabilities already exercised by stakeholders and isolates the highest-risk concurrency boundary for focused validation.

## Epic 10: Complete the Internal Beta Lifecycle and UAT Gate
Stakeholders can test inactivity warnings, Dormant recovery, final deletion, identity release, and historical evidence, then validate the complete product against the Gate 1 end-to-end acceptance journey using persistent synthetic data.

**FRs covered:** FR520–FR545 (FR529 production deletion is completed here; its referenced backup-expiration obligation is evidenced with FR370 in Epic 11)

**Implementation notes:** Completion milestone: feature-complete Gate 1 internal beta. This is not authorization for real customer data.

## Epic 11: Establish Customer Public-Beta Readiness
The team can demonstrate current threat modeling, security traceability, release evidence, vulnerability and secret scanning, independent backups, restoration, and production-readiness controls before permitting real customer data.

**FRs covered:** FR370, FR434–FR460

**Implementation notes:** Completion milestone: Gate 2 customer public-beta readiness and authorization to onboard permitted real customer data. This epic also implements live malware inspection and completes physical backup expiry for closed or finally deleted Organizations after the backup substrate exists.
