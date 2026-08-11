# Epic 1 Context: Validate the Core Moviqo Journey End to End

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Provide a deployed internal, synthetic-only environment in which company stakeholders can confidently evaluate a polished thin Moviqo journey: understand the landing page, register and verify an Owner, authenticate, create and publish a minimal workflow, start and complete its task, and inspect the completed process. The journey supplies exact-build release evidence and a stakeholder-approved visual system while preserving tenant isolation, secure public contracts, accessibility, bilingual behavior, and safe diagnostics.

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
- Story 1.22: Design a Basic Start-Task-End Graph
- Story 1.23: Create and Bind the First Short Text Process Field
- Story 1.24: Compose and Run the Minimal Task Form
- Story 1.25: Validate the Minimal Workflow for Publication
- Story 1.26: Configure Workflow Starters and Task Assignment
- Story 1.27: Save Explicitly and Resolve Shared-Draft Conflicts (autosave behavior superseded on 2026-08-10)
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

- The deployed journey must use a clean synthetic identity, persistent PostgreSQL state, the real UAT email outbox path, and public browser/API contracts. It must not bypass registration, verification, authentication, authorization, publication, task completion, or persistence.
- Email verification must activate the eligible account, Organization, and Owner Membership through the server-authoritative flow before sign-in. The UI must present the localized success or safe recovery state returned by that flow.
- Release evidence must identify the immutable build, environment, duration, and safe Organization/Process references without exposing passwords, tokens, Process Data, private links, or cross-tenant information.
- Any actionable journey, accessibility, tenant-isolation, or required-service failure blocks promotion. Assertions must describe user-visible outcomes and remain valid in Spanish and English.
- The internal environment remains explicitly `synthetic-only`; ambiguous environment classification fails closed and does not authorize real customer data.
- Tailwind theme variables and source-owned shared UI primitives enforce the approved visual system. Native accessible controls remain inside those primitives; pages do not invent raw control styling or a second form-state authority.
- The candidate palette is not locked until the Design System page and representative desktop/mobile screenshots receive human visual approval. Correct Spanish spelling/accents and reviewed English are required before the stakeholder walkthrough.
- React Flow is the Workflow canvas interaction/presentation adapter only. The revisioned Moviqo workflow document/reducer remains the semantic and persisted source of truth, and the Start-Task-End path retains keyboard-accessible non-drag operations.
- React Router provides canonical, reload-safe modules for the Dashboard, My Tasks, My Processes, Start Process catalog, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail. Workflow creation navigates to the dedicated Designer instead of appending it below the creation Form.
- TanStack Query owns server catalogs and read models; focused route-level reducers own unsaved Workflow/Form edits, explicit Save Draft, conflicts, and selection. Editor documents never live in global Context.
- Workflow and Form Designers do not autosave. **Save draft** persists incomplete but structurally coherent work with optimistic revision protection; explicit validation determines publication readiness, and **Publish** operates only on the matching saved, validated revision. Navigation warns before abandoning dirty changes and offers Save/Discard/Stay recovery without browser-local persistence becoming authoritative.
- Generic Form controls/Grid remain in `shared/ui`; the typed field registry and runtime `TaskFormRenderer` live in `features/task-form`; the route-level Form Designer lives in `features/form-design`. Designer preview reuses runtime renderers, a pinned dnd-kit package set supplements explicit non-drag operations, and no general form-builder library owns Moviqo state.
- Failed Form submission must present a localized error summary, reveal/focus the first invalid field, preserve correctable values, handle non-field errors visibly, and keep correlation IDs secondary to recovery guidance.

## Technical Decisions

- The UAT path is Firebase Hosting to a Cloud Run Django API, Supabase PostgreSQL, Resend, and the minimal Cloud Run outbox/email job. API, authenticated, and session-specific responses must not be CDN-cached.
- Playwright covers the critical landing-to-completed-process journey with automated accessibility checks. Persistence, RLS, transaction, and concurrency behavior remains covered by real-PostgreSQL integration tests.
- Frontend state is non-authoritative: success is asserted only after the corresponding server response succeeds. Test navigation must exercise the same public route semantics as a user opening an email link.
- System-owned UI and email text supports Spanish and English with Spanish fallback. Tests should assert the semantic outcome across supported languages instead of coupling to an unrelated locale-specific introductory string.
- Tailwind CSS 4.3.3 and `@tailwindcss/vite` 4.3.3 expose the approved tokens. Pinned `@xyflow/react` 12.11.2 supplies the Workflow canvas through a typed adapter. React Router and TanStack Query versions are pinned after the Story 1.35 compatibility check; a stable dnd-kit package set is pinned in Story 1.37. Static forms use shared controls with focused local state; dynamic authoring/runtime Forms use feature-owned registries/reducers and server-authoritative contracts.

## UX & Interaction Patterns

Moviqo is Spanish-first with English selectable. User-visible status, errors, headings, labels, focus behavior, and actions must be accessible and localized. Email verification should transition from loading to an explicit verified state or a safe invalid-link recovery state; automation should wait for and assert that final state.

## Cross-Story Dependencies

Story 1.33 remains completed historical verification for Stories 1.5 and 1.12-1.32 and is not a prerequisite or testing obligation for the new frontend stories. Story 1.34 establishes the shared visual system and public/onboarding surfaces; Story 1.35 separates application modules and supplies route/query foundations; Story 1.36 refactors the Workflow Editor and adopts React Flow; Story 1.37 establishes the dedicated design/runtime Form architecture with dnd-kit interaction; Story 1.38 integrates and polishes the authenticated thin journey; Story 1.39 consumes those presentation outcomes and a documented manual acceptance walkthrough for stakeholder review. Comprehensive compatibility, responsive, localization, accessibility, failure, and Gate 1 certification evidence remains owned by Stories 10.7-10.9.
