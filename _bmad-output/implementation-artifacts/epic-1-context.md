# Epic 1 Context: Validate the Core Moviqo Journey End to End

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver a polished, persistent, synthetic-only internal environment where company stakeholders can evaluate Moviqo's core promise end to end: understand the product, register and verify an Owner and Organization, sign in, create and publish a minimal Workflow and Task Form, start a Process, complete its Task, inspect the result, and record actionable feedback. The journey must exercise real public contracts and backend-authoritative behavior while preserving tenant isolation, security, traceability, bilingual accessibility, and an explicit boundary against real customer data.

## Stories

- Story 1.1: Establish the Backend Modular Spine
- Story 1.2: Establish the Frontend Application Spine
- Story 1.3: Establish the API, Error, Build, and Test Contract
- Story 1.4: Establish the Accessible Bilingual Design Foundation
- Story 1.5: Deploy the Synthetic-Data Internal Environment
- Story 1.6: Establish Tenant-Owned Relational Data
- Story 1.7: Enforce the Tenant-Isolation Release Gate
- Story 1.8: Enforce Environment and Data-Protection Boundaries
- Story 1.9: Enforce the Single-Organization Identity Boundary
- Story 1.10: Establish Atomic Commands and Leased Background Jobs
- Story 1.11: Enforce the Password and Credential Policy
- Story 1.12: Register the Initial Owner and Organization
- Story 1.13: Verify Email and Activate the Organization
- Story 1.14: Sign In and Out with Secure Sessions
- Story 1.15: Return Safe and Consistent Application Errors
- Story 1.16: Recover a Forgotten Password Securely
- Story 1.17: Publish Truthful Bilingual Landing Content
- Story 1.18: Connect Landing Conversion to Registration and Sign-In
- Story 1.19: Deliver an Accessible, Measurable Landing Experience
- Story 1.20: Provide the Authenticated My Work Shell
- Story 1.21: Create a Workflow and Shared Draft
- Story 1.22: Design a Basic Start–Task–End Graph
- Story 1.23: Create and Bind the First Short Text Process Field
- Story 1.24: Compose and Run the Minimal Task Form
- Story 1.25: Validate the Minimal Workflow for Publication
- Story 1.26: Configure Workflow Starters and Task Assignment
- Story 1.27: Save Explicitly and Resolve Shared-Draft Conflicts
- Story 1.28: Publish an Immutable Workflow Version
- Story 1.29: Start a Process from the Authorized Catalog
- Story 1.30: Open an Assigned Task and Save Progress
- Story 1.31: Complete the Task and Reach End
- Story 1.32: Track the Completed Process and Timeline
- Story 1.33: Automate the First-Workflow E2E Journey
- Story 1.34: Establish the Stakeholder-Ready Frontend System
- Story 1.35: Separate the Application Modules and Establish Authoring Navigation
- Story 1.36: Refactor the Workflow Editor and Adopt React Flow
- Story 1.37: Establish the Dedicated Schema-Driven Form Designer
- Story 1.38: Polish the Authenticated Stakeholder Journey
- Story 1.39: Present the Core Journey and Capture Stakeholder Feedback

## Requirements & Constraints

- Exercise persistent PostgreSQL and the public registration, verification, session, authorization, publication, Process, Task, timeline, and email/outbox paths; no database, private-API, or test-only bypass may stand in for user behavior.
- One normalized email belongs to one Organization. Verification activates the initial Owner; accepted passwords are 15–128 characters, securely hashed, and excluded from responses and diagnostics.
- Every protected row and operation is Organization-owned. Application authorization and forced PostgreSQL row-level security fail closed without leaking foreign existence, identifiers, or counts.
- Commands atomically persist business state, audit, idempotency results, and outbox messages. Retries cannot duplicate outcomes, and external delivery occurs after commit through leased PostgreSQL work.
- The minimal Workflow has one Start, at least one Task, one End, valid sequence Transitions, starters, assignment, and a Task Form using a stable Short Text Process Field. Invalid drafts may be saved; only the matching saved and validated revision may publish immutably.
- Task completion validates and persists before routing. The UI reports success only after server confirmation, and the authorized timeline preserves execution evidence.
- UAT must be explicitly `synthetic-only`; ambiguous classification blocks startup. Its stakeholder result is early direction evidence, not real-data, public-beta, production, Gate 1, or WCAG certification.
- Moviqo copy is Spanish-first with reviewed English and Spanish fallback. Require responsive operational reflow, keyboard access, visible focus, semantic/non-color status, 200% text, reduced motion, practical 44px targets, and actionable localized validation; narrow screens need not support full authoring.

## Technical Decisions

- Use a Django modular monolith whose modules collaborate only through public application contracts. OpenAPI generates the `/api/v1` frontend client; errors are safe RFC 9457 Problem Details with stable codes and correlation IDs.
- The React dependency flow is `app → pages → features → entities → shared`. React Router owns canonical modules, TanStack Query owns server state, and focused reducers own unsaved editor documents, revisions, selection, and explicit saves.
- Editors never autosave. React Flow and dnd-kit own gestures only; Moviqo reducers remain authoritative. Form Designer preview and runtime share typed renderers, and every drag operation has a keyboard/non-drag alternative.
- Tailwind theme variables and source-owned `shared/ui` primitives implement the approved system; domain renderers stay feature-owned and no competing form model is introduced.
- UAT uses immutable SPA/backend artifacts through Firebase Hosting, Cloud Run, Supabase PostgreSQL, private GCS, Resend, and the minimal outbox job. Do not cache API/authenticated responses or expose secrets and Process Data in artifacts or telemetry.
- Verify with domain, architecture, generated-contract, real-PostgreSQL isolation/transaction/concurrency, and exact-deployment Playwright accessibility tests.

## UX & Interaction Patterns

Use dedicated, reload-safe modules for each catalog, editor, Task, and Process surface. Keep My Work focused on task/process discovery while Start Process remains a distinct primary module. Keep one primary action per region, preserve recoverable input, and present linked plain-language error summaries with associated field errors. Separate Workflow palette/canvas/outline/properties/actions; use a twelve-column Form grid with one-column operational reflow. Apply the approved tokens, shared components, bilingual copy, and compact synthetic-only indicator throughout.

## Cross-Story Dependencies

Foundations precede the user journey; registration/activation precede authentication; draft, graph, Form, validation, assignment, and revision-safe save precede publication; publication precedes runtime and E2E proof. Stories 1.34–1.37 establish the visual system, modules, and editors; 1.38 integrates them; 1.39 requires that exact build and its manual acceptance. Stories 10.7–10.9 own comprehensive compatibility, accessibility, operability, and final Gate 1 certification.
