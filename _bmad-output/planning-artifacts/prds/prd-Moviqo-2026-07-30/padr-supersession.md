---
title: "Moviqo PADR Supersession and PRD Alignment"
status: active
created: 2026-08-01
updated: 2026-08-01
source_of_truth: "prd.md"
original_source: "C:\\New folder\\Moviqo_PADR.pdf"
---

# Moviqo PADR Supersession and PRD Alignment

## Purpose and authority

The July 2026 `Moviqo_PADR.pdf` was the original product and architecture input used to begin analysis. It is intentionally preserved unchanged as historical source material. It is no longer Moviqo's product source of truth.

The authoritative product specification is:

- `prd.md`
- `.memlog.md`

Where the PADR, Product Brief, their earlier logs, or an architecture hypothesis conflicts with the PRD, the PRD and its latest approved memlog decision prevail. UX, architecture, implementation, and test work must use the PRD. This addendum exists so an obsolete PADR statement is not mistaken for a current requirement.

The PRD intentionally defers detailed implementation mechanisms to architecture. A technology named in the PADR remains a candidate or historical baseline unless the architecture artifact confirms it while satisfying the PRD.

## Superseded PADR decisions

| PADR source | Earlier PADR position | Current PRD decision |
|---|---|---|
| Document Purpose | PADR described itself as the single source of truth. | The PRD and its append-only memlog are the product source of truth. The PADR is historical input. |
| 4.1 and ADR-001 | One person may belong to multiple Organizations through Memberships and switch workspace context. | One Account belongs to exactly one Organization in the MVP. Access to another Organization requires a separate account with a different email. No Organization switcher or cross-Organization account view exists. Organization remains the tenant-isolation unit. |
| 4.2, ADR-003, and ADR-005 | Formal roles were Owner, Administrator, Designer, and Auditor; one Membership could receive cumulative multiple roles. | Access levels are hierarchical: Member → Designer → Administrator → Owner. Each higher level inherits the lower capabilities. Auditor is deferred, and the MVP does not configure cumulative independent role combinations. Every level can participate in Tasks through inherited Member capability. |
| 4.1 and ADR-006 | Administrators could manually create, edit, activate, deactivate, or remove users; invitations were optional. | Owner or Administrator creates a Pending user. A time-limited email activation flow is required, and the user creates their own password. Administrators never know user passwords. Physical deletion is allowed only without historical relationships; otherwise the user is deactivated after open direct Tasks are reassigned. |
| 4.3 and ADR-004 | No global Approver, Reviewer, or Requester process roles. | Retained. Business meaning comes from Workflow configuration, Process Data, Task assignment, and Designer-authored labels. Workflow start permission is separately configured through Authorized Starters, with Owner and Administrator operational override. |
| 4.4 and ADR-011/012 | Specific user, Team, initiator, and previous User Reference assignment were supported, with a rigid earlier-source-Task validation. | The four assignment methods remain. User Reference assignment resolves the current Process Field value when the Task activates and validates current same-Organization eligibility. Invalid or inactive results create `Needs Reassignment` for manual Owner/Administrator resolution. The PRD does not require a simple graph-order assumption because loops and live versions exist. |
| 4.5 | Form, Approval, Decision, and Notification appeared as Workflow nodes. | MVP graph elements are exactly Start, Task, Conditional Routing, Transition, and End. Every active Task owns one Task Form. Approvals or other decisions are captured as Process Data; Conditional Routing selects a path. Notification is a Task or Transition property, not a graph element. |
| 4.6 and ADR-010 | Each active Process stayed on its original immutable version; later changes affected only new Processes. | Published versions remain immutable historical definitions, but an active Process stays at its current execution point and uses the newest published definition from that point forward. Completed Task occurrences and historical paths are never replayed or rewritten. Open-Form assignment and definition revisions are checked on Save Draft and Complete Task, with deterministic serialization against publication. |
| ADR-010 restoration implication | Returning to an old version implied selecting that version as current. | Restoring an old version creates a new shared draft. Publishing it creates the next sequential immutable version and records the source version, reason, Designer, and comparison. It never erases later versions or rewrites completed history. |
| 5.1 business events | Example domain events included fixed approval semantics such as `ApprovalRejected`. | Audit records neutral Workflow, Process, Task, assignment, Process Data, route, state, version, actor, and time facts. Moviqo does not impose fixed approval/rejection states; Designers define Workflow-specific Instance States. |
| ADR-018 and 7.2 | Redis, workers, and schedulers were outside MVP because asynchronous work was assumed unnecessary. | Customer-defined general-purpose asynchronous automation remains deferred, but MVP platform operations require reliable email delivery and retries, export generation and expiration, malware inspection, backups, monitoring, and Organization inactivity/dormancy processing. Architecture selects the smallest reliable background-processing and scheduling mechanism. |
| Sections 5, 7, and Appendix A | React, React Flow, Tailwind, Django, DRF, django-allauth, PostgreSQL, Supabase, Render, Docker Compose, and a monorepo were accepted implementation selections. | These are historical architecture candidates, not PRD requirements. Architecture may retain or replace them, but must satisfy all approved functional, isolation, concurrency, security, backup, cost, deployment-gate, and non-functional requirements. |
| 7.3 Environments | Local and one MVP Production environment were planned; Staging was optional later. | Gate 1 deploys a feature-complete internal-beta/UAT environment for authorized stakeholders and company manual testers, using persistent synthetic data and multiple isolated test Organizations. Gate 2 verifies and hardens the same product for deployment or promotion to a separate customer-facing public-beta environment with permitted real business data. |
| Identity and security baseline | Authentication details and production release evidence were largely left to architecture. | MVP includes verified email, strong passwords, secure password recovery, throttling, session expiration/revocation, deactivation enforcement, safe errors/logs, server authorization, and private files. MFA, SSO, and passkeys are deferred. Tenant isolation is implemented in Gate 1 and must pass the comprehensive automated release suite in Gate 2. |
| Notifications pending | Notification behavior was left open and a Notification node appeared in notation. | Assignment email is an optional Task property disabled by default for individual and Team assignment. Transition email is optional. Delivery failure never reverses completed business work. WhatsApp, SMS, push, reminders, and SLAs are deferred. |
| Form Builder pending | Field catalog and Form behavior were undecided. | The PRD defines text, numeric, currency, date, date-time, Yes/No, Single Choice, Multiple Choice, User Reference, File Attachment, Data Table, and Calculated fields; responsive layout; Instruction Text and Display Value; visual rules; cross-field validation; and publication validation. |
| Master/reference data pending | Reusable data was not defined. | Reusable Organization Choice Lists are included and may be referenced by Workflows in the same Organization. General master-data functionality remains deferred. |
| Publishing, archiving, and cloning pending | Exact Workflow lifecycle rules were left for later. | The PRD defines one shared draft per Workflow, edit-lease concurrency, publication validation, immutable sequential versions, restoration through a new draft and version, Draft Only/Published/Published with Draft/Archived catalog states, deletion only for never-published definitions without runtime history, archive/reactivation behavior, and definition-only duplication with new stable identities and no runtime-data copy. |
| Dashboard pending | Requests, pending Tasks, and participation were only high-level. | The PRD defines My Tasks and My Processes tabs, Start a Process, administrative Needs Attention and All Processes views, authorized timelines, and exact access boundaries, filters, search, sorting, and representative columns. |
| No landing-page decision | Public acquisition experience was not in scope. | Gate 1 includes a responsive bilingual landing page with clearly labeled fictional examples, `Start Free Beta`, and `Sign In` links into the controlled application environment. The same product journey is prepared for customer acquisition after Gate 2. |
| No beta capacity/lifecycle decision | Organization capacity, quotas, dormancy, and cleanup were not defined. | Initial customer beta capacity is twenty Active Organizations. Per Organization defaults are ten Pending or Active users, ten non-archived published Workflows, two hundred Process starts and five hundred emails per activation-anniversary cycle, and one hundred MB active attachments. Approved warning, dormancy, recovery, deletion, and Historical Organization Register rules apply. |
| Minimal infrastructure baseline | Production recovery behavior was not defined. | Customer beta requires daily database and attachment backups to an encrypted separate failure boundary, seven daily and four weekly recovery points, twenty-four-hour RPO/RTO targets, an initial successful restore before onboarding, quarterly restore testing, and failure alerts. |
| Data responsibility | Process-data restrictions were not explicit. | Designers are responsible for lawful configured data collection, while Moviqo remains responsible for platform safeguards and tenant isolation. Passwords/secrets, payment-card data, government identifiers, health data, and other highly sensitive or regulated data are prohibited during beta and disclosed in the Designer and beta terms. |
| Localization and currency | International behavior was not defined. | Spanish is the default and fallback for application-owned content; users may choose English. Designer-authored content is not translated. Regional format, timezone, and default currency belong to the Organization, with controlled per-Currency-field exceptions and no foreign-exchange conversion. |
| MVP metrics pending | Product-validation metrics were left for later. | Public-beta success is measured through five participating Organizations, twenty distinct published Workflows, one hundred Processes completed at End, two of the initial five Organizations active on their thirtieth day, first publication within sixty minutes with thirty as the target, at least one independent end-to-end Organization, at least one recorded willingness to consider payment, and no confirmed isolation exposure or data loss unrecovered beyond approved objectives. |

## PADR decisions retained at product level

The following PADR principles remain consistent with the PRD unless architecture refines their implementation:

- Moviqo is a multi-tenant SaaS and Organization is the isolation unit.
- The first registered user becomes the operational Owner and inherits design, administration, and process-participation capabilities.
- Moviqo uses a simplified Workflow model rather than full BPMN 2.0 in the MVP.
- Global business roles such as Approver or Reviewer are not platform entities.
- Files are private binary objects referenced by metadata rather than stored directly as relational Process Field values.
- Critical authorization, validation, Workflow execution, data-access, and audit rules are enforced by the server rather than trusted to the browser.
- Relevant business history is recorded from the beginning to support traceability and future process intelligence without requiring full event sourcing in the MVP.

## Downstream usage rule

Before creating UX, architecture, epics, stories, schemas, tests, or implementation plans, use `prd.md` and `.memlog.md`. Consult the PADR only for historical rationale or candidate technology context, and apply this addendum whenever the PADR is referenced.
