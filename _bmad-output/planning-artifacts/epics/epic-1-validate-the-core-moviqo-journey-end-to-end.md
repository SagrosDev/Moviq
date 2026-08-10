# Epic 1: Validate the Core Moviqo Journey End to End

Company stakeholders can use the deployed internal environment to register an Owner, create a simple Task Form and executable Workflow, publish it, start a Process, complete its Task, and inspect the result using persistent synthetic data.

**Primary FR coverage:** FR17, FR18, FR20, FR21, FR26, FR39, FR41, FR48, FR108, FR112, FR168, FR173, FR176, FR180, FR181, FR182, FR183, FR184, FR185, FR194, FR204, FR205, FR206, FR207, FR208, FR209, FR210, FR212, FR213, FR214, FR215, FR222, FR223, FR226, FR227, FR228, FR229, FR230, FR235, FR240, FR274, FR275, FR279, FR280, FR282, FR288, FR289, FR293, FR294, FR295, FR296, FR298, FR302, FR303, FR306, FR308, FR312, FR315, FR316, FR346, FR347, FR374, FR375, FR376, FR377, FR378, FR379, FR380, FR381, FR382, FR383, FR384, FR385, FR386, FR387, FR388, FR389, FR390, FR391, FR392, FR393, FR394, FR395, FR396, FR397, FR398, FR399, FR400, FR401, FR402, FR403, FR404, FR405, FR406, FR424, FR425, FR426, FR427, FR428, FR429, FR430, FR431, FR432, FR433, FR461, FR462, FR463, FR464, FR465, FR466, FR467, FR468, FR469, FR470, FR471, FR472, FR473, FR474, FR475, FR476, FR477, FR478, FR479, FR480, FR481, FR482, FR483, FR484, FR485, FR486, FR487, FR488, FR489, FR490, FR491, FR492, FR493, FR494, FR495, FR546, FR547, FR548, FR552, FR568, FR569, FR570, FR571, FR572, FR573, FR574, FR624, FR625, FR626, FR627, FR630, FR632.

## Story 1.1: Establish the Backend Modular Spine

As a Moviqo delivery team,
I want a buildable modular backend with enforced ownership boundaries,
So that product behavior starts from one consistent server foundation.

**Acceptance Criteria:**

**Given** a clean repository checkout with the approved Python toolchain
**When** the backend verification command runs
**Then** Django 5.2.15 LTS starts through the ASGI composition root on Python 3.14.6 with DRF 3.17.1, Psycopg 3.3.4, drf-spectacular 0.30.0, PostgreSQL 17.10, and pytest 9.1.1 constraints resolved
**And** the first migration uses a minimal custom Moviqo user model rather than Django's default user.

**Given** the `organizations`, `workflow_design`, `workflow_runtime`, `files`, `messaging`, and `governance` modules
**When** an architecture fixture imports another module's domain or persistence implementation, reads its tables directly, or creates a cyclic dependency
**Then** the architecture test fails with the source module, prohibited target, and permitted public-contract alternative
**And** API and job composition roots may call module application services without weakening the boundary.

**Given** the backend build configuration
**When** CI creates the production artifact twice from the same commit and locked dependencies
**Then** both builds produce the same immutable backend image inputs and a successful health-start check
**And** no AI, broker, Redis, Celery, distributed cache, or microservice dependency is present.

Traceability: AD-1, AD-7, AD-11, AD-15, AD-16.

## Story 1.2: Establish the Frontend Application Spine

As a Moviqo delivery team,
I want a buildable feature-sliced SPA with enforced dependency direction,
So that user-facing capabilities remain modular and backend-authoritative.

**Acceptance Criteria:**

**Given** a clean checkout with Node.js 26.7.0
**When** frontend install, type-check, test, and production-build commands run
**Then** TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, React Flow 12.11.2, and Playwright 1.62.x produce one static SPA artifact
**And** the artifact contains no server secret or environment-private credential.

**Given** the dependency flow `app → pages → features → entities → shared`
**When** a lower layer imports a higher layer or a consumer bypasses a feature's public entry point
**Then** the frontend architecture check fails and identifies the prohibited edge
**And** server state uses one query layer while workflow and form draft state uses explicit reducers with revision tokens.

**Given** a component attempts to grant access, route a Process, calculate a value, or accept Task completion without a server result
**When** the frontend test exercises that path
**Then** the UI remains non-authoritative and renders the server response or safe failure state
**And** no component-local rule can override server authorization or workflow semantics.

Traceability: AD-9, AD-11, AD-16, UX-DR14.

## Story 1.3: Establish the API, Error, Build, and Test Contract

As a Moviqo delivery team,
I want generated API contracts and mandatory test layers,
So that backend and frontend changes remain compatible and verifiable.

**Acceptance Criteria:**

**Given** the backend API schema command runs
**When** endpoints and serializers are valid
**Then** it emits a valid `/api/v1` OpenAPI document and generates the TypeScript client used by the SPA
**And** CI fails on an undocumented endpoint, incompatible schema change, or stale generated client.

**Given** an API validation, authorization, not-found, conflict, or unexpected failure
**When** the client receives the response
**Then** the response conforms to RFC 9457 Problem Details, contains a stable application code and safe correlation identifier where applicable, and excludes stack traces, secrets, Process Data, and cross-tenant existence signals
**And** contract tests cover each error family.

**Given** a behavior change or defect correction
**When** it is submitted for review
**Then** evidence shows a focused failing test, the passing implementation, and refactoring under green tests
**And** CI selects the applicable domain/table tests, real-PostgreSQL integration tests, architecture tests, API contract tests, and Playwright accessibility journey tests without substituting a coverage percentage for behavior evidence.

Traceability: FR387, FR388, FR389, FR390, FR391, FR392, FR393, AD-7, AD-12, AD-16, NFR30.

## Story 1.4: Establish the Accessible Bilingual Design Foundation

As a Moviqo user,
I want a consistent Spanish-first interface with English available,
So that the first journey is understandable and operable across supported devices.

**Acceptance Criteria:**

**Given** the application is rendered in either supported language
**When** a Moviqo-owned label, instruction, validation message, status, or navigation item is requested
**Then** Spanish and English resources exist, the user's language is used, and a missing English entry falls back to Spanish without altering Designer-authored content
**And** language selection is keyboard accessible and persists for the user. Traceability: FR546, FR547, FR548, FR552, UX-DR22.

**Given** the design-system reference page
**When** automated visual and accessibility checks run
**Then** the approved color, typography, spacing, gutter, radius, focus, reduced-motion, and minimum practical 44×44 CSS-pixel target tokens are demonstrated
**And** contrast is at least 4.5:1 for normal text/controls and 3:1 for large text, focus indicators, and meaningful non-text states. Traceability: UX-DR1, UX-DR2, UX-DR12, UX-DR18, UX-DR19, NFR14, NFR15.

**Given** a representative primary button, guidance card, form field, guided step, workflow element, task card, assignment control, publish checklist, and timeline
**When** each component is operated by keyboard and inspected through its accessible tree
**Then** it exposes the specified content hierarchy, plain-language action, visible focus, semantic name/state, and non-color-only status
**And** the component catalog records responsive behavior and its permitted authorization-safe content. Traceability: UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR13, UX-DR16.

**Given** a supported mobile, tablet, laptop, or desktop viewport
**When** an operational surface is resized to 200% text or a Designer surface is opened below its supported authoring width
**Then** operational content reflows without loss of required action, while narrow Designer layouts provide view/light navigation and do not claim authoring support
**And** automated checks use the current and previous stable major versions of Chrome, Edge, Firefox, and Safari. Traceability: UX-DR20, UX-DR21, NFR9, NFR10, NFR11, NFR12, NFR13, NFR17.

## Story 1.5: Deploy the Synthetic-Data Internal Environment

As a company stakeholder,
I want a persistent internal environment that rejects real customer data,
So that the thin Moviqo journey can be tested safely outside a developer workstation.

**Acceptance Criteria:**

**Given** the declarative UAT infrastructure configuration
**When** the approved build is deployed in `us-east1`
**Then** Firebase Hosting serves the SPA and rewrites `/api/**` to the Cloud Run Django ASGI service backed by Supabase PostgreSQL, private GCS, and Resend
**And** authenticated, session-specific, and API responses are never CDN-cached while public content and hashed assets may be cached.

**Given** the environment classification is absent, ambiguous, or not `synthetic-only`
**When** the UAT application or synthetic file inspector starts
**Then** startup fails before accepting a request
**And** production credentials or resources cannot be reached from the UAT identity.

**Given** the internal environment is classified `synthetic-only`
**When** a stakeholder creates persistent test data and harmless files and later revisits the environment
**Then** the data remains available inside the same isolated test Organization
**And** prominent environment messaging prohibits customer onboarding and real business data.

**Given** scaling, health, and capacity settings are inspected
**When** the environment reaches its approved low-cost threshold or a required service becomes unavailable
**Then** scaling remains within configured caps and a safe operator alert identifies the build, service class, and correlation ID without Process Data
**And** live malware scanning, independent backup automation, and lifecycle schedules are explicitly disabled rather than falsely reported healthy.

Traceability: Gate 1, AD-8, AD-11, AD-12, NFR18, NFR20, NFR21, NFR22, NFR23, NFR24.

## Story 1.6: Establish Tenant-Owned Relational Data

As an Organization user,
I want every protected record and operation isolated to my Organization,
So that identifiers, queries, jobs, and administrative authority cannot cross tenants.

**Acceptance Criteria:**

**Given** the Organization and Membership entities first needed for registration and authentication
**When** their schema, tenant-key conventions, and reusable RLS policy helpers are migrated
**Then** each tenant row has immutable `OrganizationId`, tenant relationships and uniqueness constraints include it, and operator-only history has a separate-schema boundary unreachable from tenant endpoints
**And** migrations use credentials separate from runtime roles; later stories create only their needed entities and must apply the same registered tenant policy. Traceability: FR394, AD-2.

**Given** an authenticated active Membership
**When** a protected request or job starts its outer database transaction
**Then** the server derives one immutable `TenantContext`, executes transaction-scoped `SET LOCAL`, and rejects any client-supplied Organization identifier as authorization by itself
**And** pooled connections do not retain the tenant setting after transaction completion. Traceability: FR395, FR397, FR398, AD-2.

**Given** tenant tables with `FORCE ROW LEVEL SECURITY` and runtime roles that neither own those tables nor hold `BYPASSRLS`
**When** a request, job, guessed identifier, join, search, count, or administrative operation uses missing or mismatched tenant context
**Then** PostgreSQL and application authorization return no tenant data and commit no mutation
**And** equivalent cross-tenant failures use the same safe status and Problem Details code. Traceability: FR396, FR399, FR400, AD-2, AD-7.

## Story 1.7: Enforce the Tenant-Isolation Release Gate

As a release reviewer,
I want cross-Organization isolation proved against every protected resource class,
So that an incomplete isolation implementation cannot be promoted.

**Acceptance Criteria:**

**Given** two Organizations with colliding human-readable names and distinct UUIDv7 Organization/Membership resources
**When** the reusable isolation harness substitutes identifiers and tenant context for every tenant entity currently implemented
**Then** every read returns no foreign data, every mutation leaves foreign state unchanged, and logs expose no foreign identifier or count
**And** real PostgreSQL tests exercise application authorization and RLS; an architecture/migration check requires each later Team, list, workflow/version, draft, Process, Task occurrence, Process Data, file, dashboard, audit, notification, job, and export entity to register the same positive/negative isolation suite when that entity is introduced. Traceability: FR401, AD-2, AD-16.

**Given** any resource class lacks a passing positive and negative isolation test
**When** CI or a production promotion evaluates the isolation gate
**Then** the gate fails with the missing class and evidence link
**And** the build cannot be promoted. Traceability: FR402, AD-12.

## Story 1.8: Enforce Environment and Data-Protection Boundaries

As a Moviqo operator,
I want environment, credential, transport, and telemetry safeguards to fail closed,
So that protected data cannot leak through configuration or diagnostics.

**Acceptance Criteria:**

**Given** a protected browser, API, file, export, or administration request
**When** it arrives over cleartext or through an untrusted host/origin/proxy configuration
**Then** protected content is not served and production startup fails for unsafe HTTPS, trusted-host, proxy-header, cookie, or CSRF-origin settings
**And** framework/provider cryptography is used without custom algorithms. Traceability: FR424, FR425, FR426, AD-7.

**Given** application, database, storage, email, or signing credentials
**When** source, frontend bundles, logs, audit, analytics, runtime identities, and environment boundaries are inspected
**Then** credentials remain in managed server-side configuration with least practical privilege, development identities cannot access production, and provider encryption at rest is enabled
**And** a missing critical secret or private-storage setting blocks startup. Traceability: FR425, FR427, FR428, FR429, FR430, FR433.

**Given** a request containing Process Field values, attachment/export content, passwords, tokens, cookies, authorization headers, or private links
**When** it succeeds or fails and telemetry is emitted
**Then** structured logs, metrics, traces, analytics, and error reports contain only allowed safe identifiers, durations, outcomes, counts, and correlation IDs
**And** redaction tests prove prohibited content is absent. Traceability: FR431, FR432, AD-12, NFR30.

## Story 1.9: Enforce the Single-Organization Identity Boundary

As an account holder,
I want my identity bound to one Organization during MVP,
So that authentication and navigation have one unambiguous tenant context.

**Acceptance Criteria:**

**Given** a normalized email already identifies an account or Membership
**When** registration or invitation attempts to use it for another Organization
**Then** no second account or Membership is created and the response does not reveal the existing Organization
**And** a person needing another Organization must use a different email. Traceability: FR484, FR485, FR486.

**Given** a user's Membership is deactivated
**When** the identity is queried, reactivated, or offered for another Organization
**Then** its historical Organization association remains intact, reactivation restores only that Membership, and reassignment to another Organization is rejected
**And** no Organization selector, switcher, cross-Organization dashboard, or account aggregation is exposed. Traceability: FR487, FR488.

**Given** a request proposes multi-Organization Membership or the superseded PADR behavior
**When** MVP authorization validates it
**Then** the operation is rejected as unsupported and no partial Membership is written
**And** the future extension is documented as requiring new authorization, navigation, invitation, notification, and audit design. Traceability: FR489, FR490.

## Story 1.10: Establish Atomic Commands and Leased Background Jobs

As a Moviqo operator,
I want mutations and external work to be transactional and retry-safe,
So that retries cannot duplicate business outcomes or lose evidence.

**Acceptance Criteria:**

**Given** a retryable business command with an Organization, command type, idempotency key, and request hash
**When** its application handler succeeds
**Then** business state, immutable audit, the constrained idempotency result, and required outbox rows commit in one PostgreSQL transaction
**And** a rollback leaves none of them persisted.

**Given** the same idempotency key is retried
**When** its request hash matches or differs
**Then** a matching request returns the stored result without repeating side effects, while a different request receives a stable key-reuse conflict
**And** concurrent real-PostgreSQL tests prove a single committed business outcome.

**Given** eligible outbox or job rows and multiple workers
**When** workers claim work using `SELECT ... FOR UPDATE SKIP LOCKED`
**Then** each row has one bounded lease owner, expired leases are recoverable, handlers are idempotent, retry delay follows configured backoff, and exhausted work enters dead letter with an operational reason
**And** external failure cannot reverse committed business state.

**Given** the Gate 1 environment
**When** the job runner is deployed
**Then** only the minimal outbox/email drain required by the stakeholder journey is enabled
**And** inspection, backup, and lifecycle schedules remain disabled until their gate-specific stories pass.

Traceability: AD-3, AD-10, AD-12, AD-16, NFR25, NFR26, NFR27, NFR28.

## Story 1.11: Enforce the Password and Credential Policy

As an account holder,
I want strong but usable password controls,
So that my credential is protected without arbitrary composition rules.

**Acceptance Criteria:**

**Given** registration, password reset, or authenticated password change
**When** a password shorter than 15 characters, longer than 128 characters, or present in the approved weak/compromised blocklist is submitted
**Then** the server rejects it with a localized corrective message that does not echo the password
**And** no credential or partial account change is persisted. Traceability: FR374, FR376.

**Given** a 15–128 character passphrase containing spaces or supported Unicode
**When** it is pasted, autofilled, generated by a password manager, or entered with the optional reveal control
**Then** the UI and server accept it without requiring uppercase, lowercase, digit, or symbol combinations
**And** the reveal control exposes an accessible pressed state. Traceability: FR375, FR377.

**Given** an accepted password
**When** it is stored or a periodic-change policy is evaluated
**Then** only Django's approved salted password hash is persisted, readable credentials never enter API responses, audit, or logs, and no periodic change is required without compromise evidence or an authorized reset
**And** automated tests inspect persistence and redacted telemetry. Traceability: FR378, FR379, AD-7, AD-16.

## Story 1.12: Register the Initial Owner and Organization

As a prospective Owner,
I want to register myself and a new Organization,
So that I can begin the verified first-workflow journey.

**Acceptance Criteria:**

**Given** no account uses the normalized email and active-Organization capacity is available
**When** the visitor submits personal name, Organization name, email, accepted password, required beta terms/privacy acceptance, language, and required regional defaults
**Then** one pending account, pending Organization, and Owner Membership are created atomically with UUIDv7 identifiers
**And** the response exposes no protected Organization data before verification. Traceability: FR491, FR492, FR493, FR494, AD-2, AD-3.

**Given** required registration data, consent, password, email uniqueness, or capacity is invalid
**When** registration is submitted
**Then** the server returns field-specific safe Problem Details, creates no account/Organization/Membership, and preserves non-secret valid form entries for correction
**And** equivalent existing-email cases do not disclose account existence. Traceability: FR374, FR375, FR376, FR377, FR387, FR390, FR493.

**Given** registration commits successfully
**When** the outbox worker processes the verification message
**Then** a Spanish- or English-localized email is sent according to the registrant's selected language and contains a single-use verification link
**And** delivery retry does not create another Organization or account. Traceability: FR494, AD-3, AD-10.

## Story 1.13: Verify Email and Activate the Organization

As a registered Owner,
I want to verify my email securely,
So that my Organization becomes operational only after account control is proven.

**Acceptance Criteria:**

**Given** a pending initial Owner with the newest unexpired unused verification token
**When** the matching email link is opened
**Then** the account email is marked verified and the pending Organization and Owner Membership become active in one transaction
**And** the activation audit records actor, Organization, time, and outcome without storing the token. Traceability: FR403, FR404, FR405, FR406, FR495.

**Given** an expired, already-used, superseded, malformed, or email-mismatched token
**When** verification is attempted
**Then** no activation state changes, a safe localized recovery action is shown, and the response does not reveal unrelated account data
**And** concurrent attempts can activate the account at most once. Traceability: FR405, AD-3, AD-7.

**Given** an unverified account
**When** it attempts authentication or protected Organization access
**Then** the server denies access and returns the same safe verification-required behavior regardless of protected resource identifier
**And** no Process Data can be accepted before activation. Traceability: FR404, FR406.

## Story 1.14: Sign In and Out with Secure Sessions

As an active verified user,
I want secure session-based authentication,
So that I can enter Moviqo and terminate access reliably.

**Acceptance Criteria:**

**Given** an active verified user and correct password
**When** sign-in succeeds
**Then** Django creates a same-origin `Secure`, `HttpOnly`, appropriately `SameSite` session cookie, rotates the session identifier, and returns the user's active Membership context
**And** unsafe requests without valid CSRF protection are rejected. Traceability: FR383, FR403, AD-7.

**Given** repeated incorrect credentials from an account/network risk context
**When** the throttle threshold is reached
**Then** further attempts receive generic bounded throttling behavior without revealing whether the email exists
**And** successful authentication does not expose password or session contents in audit or telemetry. Traceability: FR380, FR387, FR392, FR393.

**Given** a signed-in user
**When** the user signs out or the session expires or is revoked
**Then** the server invalidates the session and later protected requests using it fail authentication
**And** the SPA clears session-derived state and returns to authentication without rendering protected response data. Traceability: FR384, FR386.

**Given** a user is deactivated in a committed administration transaction
**When** any existing session next calls a protected endpoint
**Then** the server denies it because both user and Membership activity are checked on every request
**And** enforcement requires no WebSocket or persistent real-time channel. Traceability: FR382, FR383, FR384, FR385.

## Story 1.15: Return Safe and Consistent Application Errors

As a Moviqo user,
I want failures to be useful without exposing protected information,
So that I can recover safely and provide support with a correlation identifier.

**Acceptance Criteria:**

**Given** incorrect sign-in data, an unknown recovery email, or a resource outside the user's Organization/scope
**When** the request fails
**Then** equivalent cases use consistent status, timing-tolerant behavior, and generic localized messages that reveal no account or resource existence
**And** the Problem Details payload contains only authorized fields. Traceability: FR387, FR388, FR393.

**Given** authorized input violates a business constraint
**When** server validation fails
**Then** the response identifies only visible fields and constraints, does not unnecessarily repeat submitted confidential values, and commits no partial mutation
**And** the generated client maps the stable application code to accessible inline and summary feedback. Traceability: FR390, AD-7, UX-DR5.

**Given** an unexpected exception
**When** the global handler responds and records diagnostics
**Then** the user receives a safe message and correlation ID while stack traces, SQL, paths, infrastructure, environment values, credentials, private links, and Process Data remain confined to access-controlled redacted technical logs
**And** technical diagnostics remain separate from business audit. Traceability: FR389, FR391, FR392, NFR30, AD-12.

## Story 1.16: Recover a Forgotten Password Securely

As an account holder,
I want to recover a forgotten password without account disclosure,
So that I can regain access and invalidate potentially exposed sessions.

**Acceptance Criteria:**

**Given** any syntactically valid recovery email
**When** the recovery request is submitted
**Then** the same response and externally observable behavior are returned whether or not an account exists
**And** rate limiting prevents repeated abuse without including the email or token in logs. Traceability: FR7, FR380, FR387.

**Given** an active account and its newest unexpired unused recovery token
**When** the user submits a password satisfying Story 1.11
**Then** the password hash changes, the token becomes unusable, and every existing authenticated session is revoked in one transaction
**And** a replay, expired token, superseded token, or concurrent second submission changes nothing. Traceability: FR381, AD-3, AD-7.

## Story 1.17: Publish Truthful Bilingual Landing Content

As an SME visitor,
I want an accurate explanation of Moviqo with realistic examples,
So that I can judge whether the limited beta fits my process needs.

**Acceptance Criteria:**

**Given** a visitor opens the public landing page in Spanish or English
**When** the hero, problem/value, How It Works, use cases, product visuals, security/beta summary, and actions render
**Then** the page describes the approved Forms, Process Fields, calculations, attachments, Tasks, Member/Team assignment, visual conditions, routing, tracking, audit, and bilingual capabilities
**And** it makes no claim for deferred integrations, WhatsApp, MFA, SSO, advanced analytics, anonymous starts, or automatic dynamic assignment. Traceability: FR461, FR462, FR463, FR464, FR465.

**Given** the purchase request, document review, and maintenance/service examples
**When** a visitor inspects their names, people, values, statuses, forms, tasks, and attachments
**Then** each scenario is visibly labeled fictional/sample/demo, is achievable with the MVP, and contains no real identity, customer data, credential, or private link
**And** no invented testimonial, customer logo, adoption number, certification, saving, performance claim, or endorsement appears. Traceability: FR466, FR467, FR468, FR469, FR470.

**Given** the 30–60 minute publication message
**When** it is displayed
**Then** it is framed as an approved simple-case product goal or expected outcome rather than a guarantee
**And** content tests prevent unsupported guarantee language. Traceability: FR463.

## Story 1.18: Connect Landing Conversion to Registration and Sign-In

As an interested visitor,
I want clear routes to registration, sign-in, support, and beta terms,
So that I can enter the correct environment with informed expectations.

**Acceptance Criteria:**

**Given** environment-specific registration and sign-in destinations
**When** the visitor activates `Start Free Beta` or `Sign In`
**Then** the browser reaches the matching environment's application route and never a development/preview/production destination from another environment
**And** registration preserves the visitor's selected interface language. Traceability: FR471, FR472, FR473, FR476.

**Given** an unauthenticated visitor
**When** the public page or a copied landing link is used
**Then** no Workflow, Task, Process, Process Data, file, dashboard, audit, or Organization detail is returned
**And** starting a production Process continues to require an authenticated Membership. Traceability: FR474.

**Given** the limited free-beta disclosure
**When** the visitor reviews it before registration
**Then** it states that free beta is not a permanent price guarantee and links to environment-appropriate beta terms, privacy notice, prohibited-data guidance, and support email
**And** it makes no live-chat, ticket-portal, or formal support-response SLA promise. Traceability: FR475.

## Story 1.19: Deliver an Accessible, Measurable Landing Experience

As a mobile or desktop visitor,
I want a fast, accessible, shareable landing page in my selected language,
So that I can understand and reach Moviqo without unnecessary tracking.

**Acceptance Criteria:**

**Given** Spanish and English page variants
**When** localized copy, navigation, metadata, alternate-language links, title, and share description are inspected
**Then** each language is complete and discoverable, missing owned English text falls back to Spanish, and search/share metadata contains no misleading claim
**And** Designer/customer data is never embedded. Traceability: FR477, FR479.

**Given** the documented representative mobile-network/device profile
**When** the production landing build is measured
**Then** primary content and conversion actions become usable within approximately three seconds, assets are lightweight and cacheable, and the page remains operable by keyboard, touch, screen reader, and 200% text enlargement
**And** automated checks cover supported browser majors and required contrast/focus behavior. Traceability: FR478, FR480, NFR1, NFR9, NFR10, NFR14, NFR15.

**Given** acquisition measurement is enabled
**When** a page view or conversion event is recorded
**Then** it contains only privacy-safe event, language, campaign/referrer class, and coarse device/performance data approved by policy
**And** no non-essential tracker runs before required consent and the page remains usable when tracking is declined or blocked. Traceability: FR481, FR482.

**Given** an authorized content maintainer changes landing copy or links
**When** the static content build validates
**Then** both languages, required sections, safe claims, application destinations, and legal/support links are checked before deployment
**And** the change does not require modifying authenticated application logic. Traceability: FR483.

## Story 1.20: Provide the Authenticated My Work Shell

As an active Organization member,
I want a clear authenticated home separating work I can start, do, and follow,
So that the first workflow journey has an understandable navigation anchor.

**Acceptance Criteria:**

**Given** an active session and Membership
**When** the user opens My Work
**Then** the page exposes distinct `Start workflows`, `My tasks`, and `My processes` regions with semantic headings, loading, empty, error, and retry states
**And** every query is server-authorized and Organization-scoped. Traceability: FR26, FR288, FR289, UX-DR14, UX-DR15.

**Given** a mobile, tablet, laptop, or desktop viewport
**When** the shell reflows or text is enlarged to 200%
**Then** primary navigation and actions remain available without horizontal loss of operation, tables may become compact cards, and focus order follows reading order
**And** no hidden region leaks a count or label for unauthorized work. Traceability: UX-DR18, UX-DR20, NFR10, NFR15.

**Given** the session is revoked while My Work is open
**When** the next query fails authentication
**Then** cached protected query data is cleared, a safe authentication transition occurs, and no failed response renders protected content
**And** the return route does not encode a protected resource identifier. Traceability: FR384, AD-9.

## Story 1.21: Create a Workflow and Shared Draft

As a Designer,
I want to create a named Workflow with one shared mutable draft,
So that I can begin configuring a process without creating conflicting copies.

**Acceptance Criteria:**

**Given** an active Designer, Administrator, or Owner and a name that is unique under the Organization's naming rule
**When** the user creates a Workflow
**Then** one Workflow catalog record and one schema-versioned draft document with stable IDs and optimistic revision `1` are committed in the Organization
**And** the creator, time, name, language-neutral identifiers, audit, and idempotency result are recorded atomically. Traceability: FR568, FR569, FR570, FR571, FR572, FR573, FR574, AD-2, AD-3, AD-4.

**Given** a duplicate/invalid name, stale idempotency-key reuse, or a user without design permission
**When** creation is attempted
**Then** no Workflow or draft is created and the API returns a stable localized validation, conflict, or authorization code without exposing another tenant's catalog
**And** the entered safe name remains available for correction. Traceability: FR568, FR569, FR570, FR571, FR572, FR573, FR574, AD-7, UX-DR5.

**Given** the draft document is read after a supported schema version changes
**When** the backend schema registry loads it
**Then** the document validates and is upcast in memory through registered deterministic steps while writers emit only the current schema version
**And** golden fixtures prove supported historical versions remain readable and unknown write fields are rejected. Traceability: FR229, FR230, AD-4.

## Story 1.22: Design a Basic Start–Task–End Graph

As a Designer,
I want to connect Start, one Task, and End using guided controls,
So that the first Workflow has one understandable executable path.

**Acceptance Criteria:**

**Given** a new shared draft
**When** the Designer adds Start, Task, and End through pointer, keyboard, or non-drag controls and connects them in order
**Then** the draft stores stable element/connection IDs and renders one Start → Task → End path with plain-language labels
**And** the server accepts only supported element and connection types. Traceability: FR212, FR213, FR214, FR215, UX-DR6, UX-DR7.

**Given** a second Start, a missing End, a disconnected Task, an End with outgoing work, or another invalid connection
**When** the edit is saved or validated
**Then** the server rejects the invalid mutation or returns a precise draft validation issue linked to the affected element
**And** the last valid shared draft remains available. Traceability: FR212, FR213, FR214, FR215, FR632, AD-6.

**Given** two sequential draft edits using revision tokens
**When** each valid edit commits
**Then** the draft revision advances exactly once per command and the response contains the authoritative document/revision
**And** audit identifies the semantic element or connection change rather than storing only an opaque document replacement. Traceability: AD-3, AD-4, AD-5.

## Story 1.23: Create and Bind the First Short Text Process Field

As a Designer,
I want a reusable Short Text Process Field with stable identity,
So that the first Task can collect one value and later Tasks can reuse it.

**Acceptance Criteria:**

**Given** a Workflow draft
**When** the Designer creates a Short Text Process Field with label, help text, placeholder, optional default, minimum, and maximum
**Then** the draft assigns one stable field ID, defaults minimum to `0` and maximum to `255`, rejects a maximum above `255` or minimum above maximum, and stores no executable validation pattern
**And** friendly predefined formats remain a later Epic 3 extension. Traceability: FR48.

**Given** the stable field is placed on the first Task Form
**When** the binding is saved, removed from that Form, or later placed again
**Then** the Form references the same field ID rather than copying its data definition or Process value
**And** removing a control does not delete the Process Field or historical values. Traceability: FR108, FR112, AD-4.

**Given** a draft snapshot with the field definition
**When** schema-registry golden fixtures serialize, validate, and reload it
**Then** field identity, constraints, and binding remain equivalent across supported document versions
**And** malformed or unknown current-version fields are rejected on write. Traceability: AD-4, AD-16.

## Story 1.24: Compose and Run the Minimal Task Form

As a Designer and assigned Member,
I want one accessible Short Text control on a Task Form,
So that the first Process can collect and preserve a participant's input.

**Acceptance Criteria:**

**Given** a Task with an empty Form
**When** the Designer adds the Short Text control
**Then** the control uses the ordered label, concise help, input, and inline validation structure; defaults to full responsive width; and stores its position and stable field binding in the draft
**And** authoring works at 1280×720 or larger through pointer and non-drag controls. Traceability: FR168, FR173, FR176, FR180, FR181, FR182, FR183, FR184, FR185, UX-DR5, UX-DR21.

**Given** an assigned participant opens the active Task
**When** the Form loads at supported mobile through desktop widths
**Then** the control stacks/reflows without losing label, help, current value, validation, save, or complete actions
**And** placeholder text never substitutes for the accessible label. Traceability: FR180, FR181, FR182, FR183, FR184, FR185, UX-DR18, UX-DR20.

**Given** text outside configured length/default constraints or text valid under them
**When** the participant saves a draft
**Then** invalid text is rejected before persistence with localized field feedback, while valid text is stored once under the Process Field ID without completing the Task
**And** a real-PostgreSQL test proves an invalid save leaves the prior value intact. Traceability: FR204, NFR3, AD-3, AD-16.

## Story 1.25: Validate the Minimal Workflow for Publication

As a Designer,
I want a plain-language publish checklist for the first Workflow,
So that I can repair blocking graph, Form, and assignment issues without losing my draft.

**Acceptance Criteria:**

**Given** a draft missing a valid starter, Task assignment, Start–Task–End path, required field binding, or valid Task Form
**When** publication validation runs
**Then** the backend returns deterministic blocking issue rows with stable codes, affected element/field IDs, localized explanations, and direct configuration targets
**And** no published version is created. Traceability: FR624, FR625, FR626, FR627, FR630, UX-DR10.

**Given** hidden, disabled, empty, or informational Form content
**When** the minimal Form is evaluated for publication
**Then** the checklist applies the PRD's input/required/content rules and warns when hidden content would make the Task misleading or impossible
**And** the rule result comes from the backend validator rather than UI-only logic. Traceability: FR625, FR626, FR627, FR630, AD-6.

**Given** validation issues exist
**When** the Designer follows an issue link, corrects the draft, navigates away, reconnects after a recoverable failure, and validates again
**Then** valid draft work is preserved, saving/retry state is explicit, resolved issues disappear, and no completion/publication success appears before server confirmation
**And** the shared draft remains the only editable draft. Traceability: FR632, UX-DR10, UX-DR17.

## Story 1.26: Configure Workflow Starters and Task Assignment

As a Designer,
I want to authorize starters and assign the first Task,
So that the published Workflow can be started and completed by intended Organization members.

**Acceptance Criteria:**

**Given** active Organization Members and Teams
**When** the Designer configures all active Members, selected active Teams, selected active Members, a specific active Member Task assignee, or Workflow Initiator assignment
**Then** the draft stores stable Organization-scoped references and explains who receives the Task and when
**And** no cross-Organization, inactive, empty Team, or unsupported assignment is accepted. Traceability: FR17, FR39, FR41, UX-DR9.

**Given** no valid Authorized Starter remains
**When** publication validation runs
**Then** publication is blocked with a starter-specific issue and the draft remains editable
**And** configuring at least one valid starter clears that issue. Traceability: FR18.

**Given** an Owner or Administrator is not listed as a starter
**When** start authorization is evaluated after publication
**Then** operational authority permits the start and marks it as such for audit, while Members and Designers require direct, Team, or all-active-member authorization
**And** Task assignment does not itself grant start authority. Traceability: FR20, AD-7.

## Story 1.27: Save Explicitly and Resolve Shared-Draft Conflicts

As a Designer,
I want to decide when my Workflow/Form draft is saved against the latest shared revision,
So that incomplete work is preserved on demand without background errors or silent concurrent overwrites.

**Acceptance Criteria:**

**Given** unsaved local authoring changes and the current server revision
**When** the Designer chooses Save draft or `Ctrl/Cmd+S`
**Then** the client submits one immutable snapshot and the server accepts incomplete but structurally coherent work, increments the revision once, and returns the authoritative saved revision
**And** no timer, change event, drag, blur, or navigation sends a background save. Traceability: FR222, FR223, FR227, FR235, UX-DR17.

**Given** the server revision advanced because another user saved first
**When** the stale client submits its edit with `If-Match` or equivalent generated contract
**Then** the whole save is rejected with a stable conflict code, no portion overwrites the shared draft, and the UI offers reload/reapply guidance
**And** a real-PostgreSQL concurrency test proves lost updates cannot occur. Traceability: FR226, FR227, FR235, AD-5.

**Given** a recoverable offline or slow connection
**When** an explicit save has an unknown or failed outcome
**Then** the UI keeps the local work, exposes unsaved/save-failed state, and offers an explicit retry using the same immutable payload and logical idempotency key
**And** changed content uses a new command key, no automatic retry runs, and the UI reports saved only after server confirmation. Traceability: FR240, NFR25, UX-DR15, UX-DR17.

## Story 1.28: Publish an Immutable Workflow Version

As a Designer,
I want to publish a valid draft as an immutable version,
So that new Processes execute a stable reviewed definition.

**Acceptance Criteria:**

**Given** a valid shared draft at revision `R` and no published version for that command
**When** an authorized Designer publishes with the matching revision and idempotency key
**Then** the handler locks the Workflow head, appends the next sequential immutable snapshot, records publication audit/idempotency/outbox atomically, and leaves the mutable draft available for later edits
**And** the snapshot contains current schema versions and stable element/field IDs. Traceability: FR228, AD-3, AD-4, AD-5.

**Given** a validation issue, stale revision, concurrent publication, or repeated request
**When** publication is attempted
**Then** invalid/stale attempts create no version, concurrent attempts serialize to unique sequence numbers, and an identical retry returns its stored result without a duplicate version
**And** a different payload under the same key receives a stable conflict. Traceability: NFR25, NFR26, NFR30, AD-5.

**Given** a published snapshot
**When** any application path attempts to mutate it
**Then** persistence rejects the change and the original snapshot remains byte/semantic-equivalent to its golden fixture
**And** future draft edits cannot alter running or historical version content. Traceability: AD-4, AD-5.

## Story 1.29: Start a Process from the Authorized Catalog

As an authorized Organization member,
I want to start a published Workflow from My Work,
So that a new Process and its first assigned Task are created once.

**Acceptance Criteria:**

**Given** published Workflows with mixed starter configurations
**When** a Member or Designer opens `Start workflows`
**Then** the server returns only Workflows authorized directly, through an active Team, or through all-active-members; Owners/Administrators receive every published Workflow
**And** archived, draft-only, inactive, or unauthorized Workflows and their counts are absent. Traceability: FR17, FR23, FR298, FR312.

**Given** an authorized Workflow version and a new idempotency key
**When** the user starts it
**Then** one Process bound to that version and one first Task are created atomically, assignment is resolved inside the Organization, and audit records Organization, Workflow/version, Process ID, initiator, time, and operational-authority use
**And** the response navigates to an authorized Process/Task view. Traceability: FR21, FR274, FR315, FR316, AD-3.

**Given** an unauthorized, inactive, cross-tenant, unpublished, archived, or duplicate start attempt
**When** the command executes
**Then** no additional Process or Task is created and the safe response reveals no hidden Workflow state
**And** an identical retry of a successful logical start returns the original Process identifier. Traceability: NFR2, NFR25, NFR26, NFR30, AD-2, AD-7.

## Story 1.30: Open an Assigned Task and Save Progress

As an assigned Member,
I want to open my active Task and save valid progress,
So that I can continue later without completing it.

**Acceptance Criteria:**

**Given** an active Task directly assigned to the signed-in Member
**When** My Tasks loads and the Member opens it
**Then** the server returns only the authorized Task Form, current Process Field value, Task/Workflow names, status, and safe Process context
**And** another Member or Organization receives no existence signal or data. Traceability: FR279, FR280, FR302, FR303, AD-2, AD-7.

**Given** a valid Short Text value and current Task/form revision
**When** Save draft is submitted
**Then** the value and transactional audit commit while the Task remains open, the response confirms saved state, and reopening shows the saved value
**And** retrying the same command does not duplicate audit or value history. Traceability: FR204, NFR25, NFR26, UX-DR17.

**Given** invalid text, a stale form revision, revoked assignment, completed/cancelled Task, or lost permission
**When** Save draft is submitted
**Then** the whole write is rejected, the prior valid value remains, and a stable localized error identifies only authorized corrective information
**And** a concurrency integration test proves no partial Process Data commit. Traceability: NFR29, NFR30, AD-5, AD-16.

## Story 1.31: Complete the Task and Reach End

As an assigned Member,
I want to complete the valid Task once,
So that the Process reaches End with consistent data and evidence.

**Acceptance Criteria:**

**Given** an open assigned Task, valid Form value, current assignment/form revisions, and matching published execution version
**When** Complete Task is submitted
**Then** the handler locks the required Workflow/Task state and atomically saves Process Data, completes the Task occurrence, records version/revision/action/audit/idempotency, evaluates the sole route, and marks the Process Completed at End
**And** no independent HTTP call is required to create the outcome. Traceability: FR205, FR206, FR207, FR208, FR209, FR210, FR275, FR282, AD-3, AD-5.

**Given** invalid Form data, stale version/revision, lost assignment, cancelled/completed Task, or failed route evaluation
**When** completion is attempted
**Then** the Task remains open in its prior valid state, no outgoing route or duplicate next Task is created, and the response contains a stable actionable code
**And** transaction-failure injection tests prove all-or-nothing behavior. Traceability: NFR26, NFR29, NFR30, AD-16.

**Given** two concurrent or retried completion commands
**When** PostgreSQL executes them
**Then** exactly one logical completion commits and every identical retry returns that result; competing stale attempts are rejected
**And** audit contains one completion and one Process-completed transition. Traceability: NFR25, AD-3, AD-5.

## Story 1.32: Track the Completed Process and Timeline

As a Process participant,
I want to see the completed Process and my authorized timeline,
So that I can confirm what happened without viewing another user's private contribution.

**Acceptance Criteria:**

**Given** a user who started or completed the Process
**When** My Processes and Process Detail load
**Then** the server returns the Process identifier, Workflow/version, overall Completed status, current/end position, dates, and the user's completed Task contribution
**And** results are searchable/paginated within the Organization and authorization scope. Traceability: FR293, FR294, FR295, FR296, FR306, FR346.

**Given** the first Start–Task–End Process
**When** its simplified timeline renders
**Then** readable event rows show authorized actor, time, state, Task position, start, save/complete, and End evidence in Organization timezone
**And** restricted Process Field values, technical topology, and another user's exclusive data do not appear. Traceability: FR308, FR347, UX-DR11.

**Given** an unauthorized user, guessed Process identifier, or revoked participation
**When** Process Detail or timeline is requested
**Then** no header, timeline, value, event count, or existence signal is returned
**And** the denial uses the same safe contract as an unavailable resource. Traceability: NFR2, NFR30, AD-2, AD-7.

## Story 1.33: Automate the First-Workflow E2E Journey

As a delivery team,
I want the representative stakeholder journey automated against the deployed application,
So that every build proves the thin slice remains executable end to end.

**Acceptance Criteria:**

**Given** a clean synthetic test identity and available UAT capacity
**When** Playwright follows landing → Owner registration → email verification → sign-in → Workflow creation → Start–Task–End design → Short Text Form → starter/assignment → validation repair → publication → Process start → Task save/complete → completed timeline
**Then** every step uses public browser/API contracts, persistent PostgreSQL state, the real UAT email outbox path, and private synthetic storage configuration
**And** the final evidence identifies build, environment, Organization/Process safe IDs, duration, and screenshots/traces without Process Data secrets. Traceability: Gate 1 early preview, UX-DR23, UX-DR24, AD-16.

**Given** any journey assertion, accessibility check, tenant boundary, or required service fails
**When** CI or preview promotion evaluates the journey
**Then** promotion fails at the first actionable step with its correlation/evidence reference
**And** no test fallback bypasses authentication, authorization, publication, Task completion, or persistence. Traceability: NFR25, NFR26, NFR27, NFR28, NFR29, NFR30, AD-12.

## Superseded Planning Note: Former Story 1.34 — Qualify the Stakeholder Preview Experience

> Superseded by the approved 2026-08-09 course correction. This is no longer an active Epic 1 story. Comprehensive compatibility and accessibility qualification remains owned by Story 10.7, with failure and operability qualification in Story 10.8. The former criteria are retained below as planning history.

As a company stakeholder,
I want the thin journey usable in both languages and representative layouts,
So that early feedback reflects the intended experience rather than developer-only operation.

**Acceptance Criteria:**

**Given** the automated journey in Spanish and English
**When** it runs on the supported desktop authoring viewport and representative mobile participant viewport
**Then** owned UI text is localized with Spanish fallback, Designer content is preserved, operational pages reflow, and narrow screens do not claim Workflow/Form authoring support
**And** browser/device results identify the tested versions and viewport profiles. Traceability: NFR9, NFR10, NFR11, NFR12, NFR13, UX-DR20, UX-DR21, UX-DR22.

**Given** registration, authentication, first-workflow authoring, Task Form, and Process timeline states
**When** automated accessibility checks and a manual keyboard walkthrough run
**Then** headings, labels, focus order/visibility, validation association, live announcements, contrast, reduced motion, touch targets, and 200% text operation meet the documented baseline
**And** the evidence is described as a baseline verification, not a formal WCAG conformance claim. Traceability: NFR14, NFR15, NFR16, NFR17, UX-DR16, UX-DR18, UX-DR19.

**Given** validation, permission denial, slow/offline recovery, duplicate action, and unexpected failure test cases
**When** each state is exercised
**Then** valid work is preserved where permitted, destructive/irreversible actions are confirmed, routine save/complete is not needlessly confirmed, and success is never shown before server confirmation
**And** errors use the patient-colleague voice and stable safe codes. Traceability: UX-DR13, UX-DR15, UX-DR17, NFR30.

## Superseded Planning Note: Former Story 1.35 — Approve the Stakeholder E2E Preview

> Removed by the first approved course correction because formal preview certification remains owned by Epic 10. The former criteria are retained as planning history and are not active Epic 1 scope.

As a release reviewer,
I want one evidence index and stakeholder decision for the thin internal preview,
So that the team can gather early end-to-end feedback without implying MVP or real-data readiness.

**Acceptance Criteria:**

**Given** a candidate build in the synthetic-only internal environment
**When** the preview evidence is assembled
**Then** it links the passing automated E2E journey, isolation gate, build/contract checks, tested languages/viewports/browsers, accessibility baseline, service health, and known limitations to the exact immutable build
**And** missing or failing evidence produces a blocking status rather than a waiver hidden in notes.

**Given** company stakeholders execute the same journey without developer intervention
**When** the review concludes
**Then** the decision record captures pass/fail, observations, prioritized follow-up, reviewer identities, date, and evidence links
**And** approval states only that the thin Epic 1 preview is ready for feedback; it does not claim feature-complete Gate 1 or authorize customer/real data.

**Given** the preview is approved
**When** later epics begin
**Then** the automated journey remains a blocking regression test and stakeholder feedback may create new user stories without rewriting approved historical evidence
**And** the Epic 10 Gate 1 and Epic 11 Gate 2 decisions remain separate.

Traceability: Gate 1 early-feedback milestone, AD-11, AD-12, AD-16, UX-DR23, UX-DR24, UX-DR25.

## Superseded Planning Note: Interim Story 1.35 — Present the Core Journey and Capture Stakeholder Feedback

> First renumbered to Story 1.36 by the stakeholder-presentation amendment, then to Story 1.38 when dedicated editor stories were approved, and finally to active Story 1.39 when module separation was added. The interim criteria are retained below as planning history.

As a product team,
I want to present the deployed core journey to company stakeholders,
So that we can validate its direction and capture actionable feedback.

**Acceptance Criteria:**

**Given** a synthetic-only UAT build with a passing Story 1.33 deployed journey
**When** the stakeholder session occurs
**Then** the public UI demonstrates registration, verification, sign-in, Workflow creation and publication, Process start, Task completion, and the completed timeline without database, private API, authentication, or authorization bypasses
**And** the walkthrough uses safe synthetic data only.

**Given** the stakeholder session is complete
**When** its result is recorded
**Then** the record identifies the tested build, date, participants, observations, and prioritized follow-up items without credentials, tokens, Process Data, private links, or other secrets
**And** it states whether the thin slice is suitable for continued stakeholder feedback and identifies any blocking defect or follow-up owner.

**Given** the Epic 1 decision is recorded
**When** later delivery work begins
**Then** the record states that Epic 1 does not certify feature-complete Gate 1, public-beta or production readiness, real-data use, or WCAG conformance
**And** no new E2E suite, browser matrix, evidence schema, validator, CI gate, or product implementation is required unless the walkthrough reveals a blocking defect.

Traceability: Gate 1 early-feedback milestone, AD-11, AD-12, AD-16, UX-DR23, UX-DR24, UX-DR25.

## Story 1.34: Establish the Stakeholder-Ready Frontend System

As a product team,
I want one enforceable visual system applied to the public and onboarding experience,
So that Moviqo looks coherent, modern, and trustworthy before stakeholders enter the core journey.

**Acceptance Criteria:**

**Given** the candidate Moviqo palette and representative real UI states
**When** the Design System page is reviewed at desktop and mobile sizes
**Then** landing navigation, authentication and registration forms, buttons, cards, alerts, badges, timeline rows, and the compact UAT indicator demonstrate normal, hover, focus, disabled, success, warning, and error states
**And** the palette is adjusted and locked only after human visual approval while required contrast pairs remain automated.

**Given** the approved visual direction
**When** the frontend foundation is implemented
**Then** pinned Tailwind CSS theme variables expose the approved tokens and source-owned domain-free shared primitives provide page shell, header, container, card, button, form field, input, select, password/checkbox field, form section, action bar, alert, error summary, badge, and Form Grid behavior
**And** pages do not invent raw control styling, dynamic Tailwind fragments, a second general form-state system, domain-aware renderers in `shared/ui`, or frontend business authority. Traceability: AD-9, AD-16, UX-DR1 through UX-DR6, UX-DR12, UX-DR16, UX-DR18, UX-DR19.

**Given** the public landing, registration, verification, sign-in, and password-recovery surfaces
**When** they are redesigned with the approved components
**Then** the landing has a modern header, clear value-focused hero, credible product visual, disciplined sections, truthful fictional examples, CTA hierarchy, and complete beta/legal/support footer while public onboarding exposes only public navigation
**And** Forms use aligned content widths and readable sections, the UAT indicator remains clear but compact, and all Spanish/English copy is reviewed with correct Spanish spelling and accents. Traceability: FR461 through FR495, FR546 through FR552, UX-DR13, UX-DR14, UX-DR20, UX-DR22, UX-DR23.

**Given** registration is rejected with field or form-level Problem Details
**When** the response is presented
**Then** a localized error summary receives focus, names and links to actionable fields, and reveals/focuses the first invalid control while associated inline errors remain visible
**And** non-field errors receive an actionable explanation, correctable values are preserved, corrected field errors clear, duplicate submission remains disabled, and the correlation ID is secondary support detail.

## Story 1.35: Separate the Application Modules and Establish Authoring Navigation

As an authenticated Moviqo user,
I want each major authoring and runtime responsibility in a clear, reload-safe module,
So that I can find my work and move between Workflow, Form, and Process activities without searching through one long page.

**Acceptance Criteria:**

**Given** the current manual pathname router and combined authenticated surfaces
**When** the application shell is refactored
**Then** React Router provides nested public/authenticated layouts, route parameters, role-appropriate navigation, active state, not-found handling, and reload-safe canonical routes
**And** Dashboard, My Tasks, My Processes, Start Process, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail are independent modules rather than stacked page regions.

**Given** a Designer creates or opens a Workflow
**When** the server accepts creation or the catalog item is selected
**Then** navigation opens `/workflows/:workflowId/design` and the route loads the tenant-authorized draft through the existing catalog/detail contracts
**And** creation never appends the entire editor below its Form or depends on the creation page's in-memory response to survive reload.

**Given** a Designer wants to configure a Task Form
**When** Design Form is selected from a Task or a Workflow/Task is selected at `/forms`
**Then** both paths open `/workflows/:workflowId/tasks/:taskElementId/form` with visible Workflow/Task context and safe back navigation
**And** missing, stale, forbidden, or non-Task route identities produce localized recoverable states without exposing another tenant's resources.

**Given** server catalogs/read models and mutable editor documents
**When** frontend state is implemented
**Then** TanStack Query owns keyed server state and deliberate invalidation while focused route-level reducers own unsaved Workflow/Form edits, selection, explicit Save Draft, revisions, and conflicts
**And** global Context is limited to stable services such as session, language, query client, and theme. Traceability: AD-7, AD-9, UX-DR14, UX-DR20, UX-DR21.

**Given** the new module structure
**When** verification runs
**Then** route/component tests cover deep links, reloads, redirects, role navigation, loading/empty/error states, Workflow-to-Form transitions, and Start/Task/Process separation
**And** Story 1.33 remains the deployed journey regression without creating another deployed E2E program.

## Story 1.36: Refactor the Workflow Editor and Adopt React Flow

As a Workflow Designer,
I want a dedicated visual Workflow Editor backed by the existing reliable draft model,
So that every action appears immediately on a comprehensible canvas without the canvas becoming the source of workflow truth.

**Acceptance Criteria:**

**Given** the current monolithic Workflow Editor
**When** it is opened at its canonical route
**Then** a focused controller hook owns the existing reducer/API orchestration and the workspace separates element palette, React Flow canvas, accessible outline, selected-element properties, assignment/starter configuration, publication checklist, persistent save status, and Validate/Publish action bar
**And** Form editing is reached through the selected Task's Design Form action rather than embedded as another long section.

**Given** the revisioned Moviqo Workflow document
**When** the visual canvas renders and receives pointer or keyboard interaction
**Then** pinned `@xyflow/react` owns canvas-only node/edge presentation, selection, position, pan, zoom, and connection gestures through typed adapters
**And** the Moviqo Workflow document/reducer remains the single persisted and semantic source of truth for editing, assignment, validation, explicit save, conflicts, idempotency, and publication. Traceability: FR176 through FR185, AD-5, AD-7, AD-9.

**Given** the Epic 1 palette
**When** Start, Task, or End is added by drag-to-canvas, click/double-click, or keyboard action, or a sequence Transition is connected
**Then** the new element/connection appears locally without scrolling, the element is revealed and selected, its properties are available, and assistive technology receives meaningful feedback
**And** Start/End cardinality and connection constraints are enforced through the Moviqo reducer rather than hidden React Flow state.

**Given** Epic 1 implements only Start, Task, End, and sequence Transitions
**When** the extensible node registry is delivered
**Then** it can accept future node/edge adapters without redesigning the workspace
**And** Conditional Routing, branches, and loops are not shown as functional until Epic 4 supplies their domain/runtime contracts.

**Given** a user cannot or does not drag on the canvas
**When** the minimum Workflow is authored
**Then** explicit add/connect controls and an accessible outline complete the same Start-Task-End path with visible focus and non-color-only state
**And** focused component tests cover canvas adaptation, all Add methods, keyboard alternatives, selection/focus, explicit save, conflicts, validation targeting, Task-to-Form navigation, and publication without adding another deployed E2E program.

**Given** the Designer has incomplete but structurally coherent Workflow work
**When** they choose **Save draft** or `Ctrl/Cmd+S`
**Then** one immutable revision-aware snapshot is submitted and no timer, change event, drag, blur, or navigation sends a background save or retry
**And** malformed, dangling, unknown, unauthorized, or stale content is rejected without losing local work.

**Given** a saved Workflow draft
**When** the Designer validates or publishes it
**Then** validation reports publication readiness for that saved revision, publication is enabled only for the same unchanged validated revision, and later local edits require another explicit save and validation
**And** leaving with unsaved changes offers **Save**, **Discard**, or **Stay** rather than saving implicitly.

## Story 1.37: Establish the Dedicated Schema-Driven Form Designer

As a Workflow Designer and Task participant,
I want a dedicated visual Form Designer and runtime rendering to use the same typed definitions,
So that the Form is easy to compose and remains identical in meaning when someone completes the Task.

**Acceptance Criteria:**

**Given** a selected Task at its canonical Form route
**When** the Form Designer loads
**Then** it displays Workflow/Task context, Fields and Layout palettes, a constrained twelve-column Form canvas, selected-item properties, runtime-accurate preview, validation summary, and persistent save status
**And** `/forms` can select an authorized Workflow and Task before navigating to the same route without creating a detached global Form document.

**Given** Epic 1 Form items
**When** the typed registries are implemented
**Then** Short Text defines Process Field configuration/defaults and design/runtime rendering, while Section, Heading, Instruction Text, and Divider define non-data structural rendering
**And** future Epic 3 fields, calculations, rules, and conditional layout behavior extend these discriminated contracts without replacing stable IDs, bindings, revisions, or backend authority. Traceability: FR48, FR108 through FR113, FR168 through FR185, FR194, AD-4, AD-5, AD-7, AD-9.

**Given** a Designer adds, reorders, or resizes a Form item
**When** pointer, click/double-click, or keyboard interaction occurs
**Then** a pinned stable dnd-kit package set may own gesture feedback while the Form reducer owns item order, approved full/half/third/quarter spans, selection, revisions, and save behavior
**And** explicit Add and Move controls provide equivalent operations without drag.

**Given** the Form contains incomplete but structurally coherent design work
**When** the Designer chooses **Save draft** or `Ctrl/Cmd+S`
**Then** one revision-aware snapshot is submitted on demand and the interface shows unsaved, saving, saved, failed, or conflicted state only from that explicit command
**And** item changes, drag events, blur, timers, route changes, and failed requests never trigger background save or automatic retry; dirty navigation offers **Save**, **Discard**, or **Stay**.

**Given** a Task participant opens the operational Form
**When** controls render or validation fails
**Then** `TaskFormRenderer` in `features/task-form` composes domain-free shared controls through the same renderers used by Designer preview, with matching labels, help, width, required/disabled state, structural content, and validation
**And** error summary/focus recovery, task revisions, Save draft, Complete task, idempotency, authorization, and backend validation remain authoritative without React Hook Form, Formik, Form.io, SurveyJS Creator, JSON Forms, or RJSF.

**Given** the dedicated Designer and runtime renderer
**When** verification runs
**Then** component/contract tests cover route loading, registry resolution, Short Text and structural items, spans/reflow, dnd-kit and explicit alternatives, preview/runtime parity, focus/error recovery, save conflicts, and unknown-item fail-safe behavior
**And** Story 1.33 remains the deployed journey regression without another E2E program.

## Story 1.38: Polish the Authenticated Stakeholder Journey

As a company stakeholder,
I want the authenticated thin journey to use the approved visual system and separated modules,
So that I can evaluate Moviqo's product value without unfinished interface quality or confusing navigation distracting from the workflow.

**Acceptance Criteria:**

**Given** Dashboard, My Tasks, My Processes, Start Process, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail/timeline
**When** the Epic 1 journey is integrated and polished
**Then** every module composes the Story 1.34 primitives and Stories 1.35-1.37 navigation/editors with consistent containers, spacing, typography, cards, statuses, breadcrumbs, empty states, and action bars
**And** each region has one dominant action, aligned secondary actions, role-appropriate navigation, and no browser-default or missing page-level control style. Traceability: UX-DR3 through UX-DR24, AD-9.

**Given** the exact redesigned build
**When** desktop/mobile operational screenshots, supported desktop authoring screenshots, and the existing Story 1.33 regression journey are reviewed
**Then** the approved palette, alignment, hierarchy, responsive behavior, reviewed bilingual copy, immediate editor feedback, module transitions, and authoring-to-runtime continuity pass without creating another deployed E2E suite, browser matrix, or release-evidence framework
**And** presentation or navigation defects block Story 1.39 until corrected.

## Story 1.39: Present the Core Journey and Capture Stakeholder Feedback

As a product team,
I want to present the polished deployed core journey to company stakeholders,
So that we can validate its direction and capture actionable feedback.

**Acceptance Criteria:**

**Given** Stories 1.34 through 1.38 are complete and a synthetic-only UAT build has a passing Story 1.33 deployed journey
**When** the stakeholder session occurs
**Then** the public UI demonstrates landing, registration, verification, sign-in, Workflow catalog/creation, React Flow Workflow design, Task-linked Form design, publication, separate Start Process catalog, Task completion, and completed Process timeline without database, private API, authentication, or authorization bypasses
**And** the walkthrough uses safe synthetic data and the visually approved component system.

**Given** the stakeholder session is complete
**When** its result is recorded
**Then** the record identifies the tested build, date, participants, observations, and prioritized follow-up items without credentials, tokens, Process Data, private links, or other secrets
**And** it states whether the thin slice is suitable for continued stakeholder feedback and identifies any blocking defect or follow-up owner.

**Given** the Epic 1 decision is recorded
**When** later delivery work begins
**Then** the record states that Epic 1 does not certify feature-complete Gate 1, public-beta or production readiness, real-data use, or WCAG conformance
**And** comprehensive compatibility, accessibility, operability, and Gate 1 certification remain owned by Stories 10.7 through 10.9.

Traceability: Gate 1 early-feedback milestone, AD-9, AD-11, AD-12, AD-16, UX-DR12, UX-DR13, UX-DR23, UX-DR24, UX-DR25.
