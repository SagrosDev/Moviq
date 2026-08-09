# Epic 1 Context: Validate the Core Moviqo Journey End to End

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Provide a deployed internal, synthetic-only environment in which company stakeholders can complete the thin Moviqo journey: register and verify an Owner, authenticate, create and publish a minimal workflow, start and complete its task, and inspect the completed process. The journey supplies exact-build release evidence while preserving tenant isolation, secure public contracts, accessibility, bilingual behavior, and safe diagnostics.

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
- Story 1.27: Autosave and Resolve Shared-Draft Conflicts
- Story 1.28: Publish an Immutable Workflow Version
- Story 1.29: Start a Process from the Authorized Catalog
- Story 1.30: Open an Assigned Task and Save Progress
- Story 1.31: Complete the Task and Reach End
- Story 1.32: Track the Completed Process and Timeline
- Story 1.33: Automate the First-Workflow E2E Journey
- Story 1.34: Qualify the Stakeholder Preview Experience
- Story 1.35: Approve the Stakeholder E2E Preview

## Requirements & Constraints

- The deployed journey must use a clean synthetic identity, persistent PostgreSQL state, the real UAT email outbox path, and public browser/API contracts. It must not bypass registration, verification, authentication, authorization, publication, task completion, or persistence.
- Email verification must activate the eligible account, Organization, and Owner Membership through the server-authoritative flow before sign-in. The UI must present the localized success or safe recovery state returned by that flow.
- Release evidence must identify the immutable build, environment, duration, and safe Organization/Process references without exposing passwords, tokens, Process Data, private links, or cross-tenant information.
- Any actionable journey, accessibility, tenant-isolation, or required-service failure blocks promotion. Assertions must describe user-visible outcomes and remain valid in Spanish and English.
- The internal environment remains explicitly `synthetic-only`; ambiguous environment classification fails closed and does not authorize real customer data.

## Technical Decisions

- The UAT path is Firebase Hosting to a Cloud Run Django API, Supabase PostgreSQL, Resend, and the minimal Cloud Run outbox/email job. API, authenticated, and session-specific responses must not be CDN-cached.
- Playwright covers the critical landing-to-completed-process journey with automated accessibility checks. Persistence, RLS, transaction, and concurrency behavior remains covered by real-PostgreSQL integration tests.
- Frontend state is non-authoritative: success is asserted only after the corresponding server response succeeds. Test navigation must exercise the same public route semantics as a user opening an email link.
- System-owned UI and email text supports Spanish and English with Spanish fallback. Tests should assert the semantic outcome across supported languages instead of coupling to an unrelated locale-specific introductory string.

## UX & Interaction Patterns

Moviqo is Spanish-first with English selectable. User-visible status, errors, headings, labels, focus behavior, and actions must be accessible and localized. Email verification should transition from loading to an explicit verified state or a safe invalid-link recovery state; automation should wait for and assert that final state.

## Cross-Story Dependencies

Story 1.33 composes the behavior delivered by Stories 1.5 and 1.12-1.32. Its verification step directly depends on registration, the leased outbox worker, activation, bilingual UI behavior, and the tenant-isolation boundary. Story 1.34 qualifies the resulting journey across languages, layouts, and accessibility; Story 1.35 consumes the exact-build evidence for stakeholder approval.
