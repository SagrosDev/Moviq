---
title: "Moviqo Product Brief"
status: source-context-superseded-by-prd
created: 2026-07-30
updated: 2026-08-01
source_of_truth: "../../prds/prd-Moviqo-2026-07-30/prd.md"
---

# Product Brief: Moviqo

## Artifact Status and Decision Authority

This Product Brief records the product hypothesis and analysis that led to the Moviqo PRD. It is retained as strategic context, but it is no longer the implementation source of truth. The authoritative approved product decisions are the current PRD and its append-only decision log:

- `../../prds/prd-Moviqo-2026-07-30/prd.md`
- `../../prds/prd-Moviqo-2026-07-30/.memlog.md`

Where this Brief, its earlier decision log, or the original PADR differs from the PRD, the PRD prevails. UX, architecture, implementation, and test artifacts must not reintroduce an earlier decision merely because it remains in the historical source material.

## Executive Summary

Moviqo is a bilingual, multi-tenant SaaS platform that lets small and medium-sized businesses turn manual operational processes into executable workflows. A non-technical user should be able to start from a process idea, configure forms, tasks, conditional routing, assignments, attachments, and notifications, then publish the workflow for real use in approximately 30–60 minutes.

The initial customer hypothesis is an SME that coordinates work through spreadsheets, email, and printed paper, without the budget or infrastructure to build custom software. Moviqo aims to provide an affordable, simple path from process idea to execution, while preserving security, reliability, traceability, and room for future process intelligence.

Delivery uses two gates. Gate 1 deploys the feature-complete MVP to a controlled internal-beta/UAT environment for stakeholders and company manual testers using persistent synthetic data and multiple isolated test Organizations. Gate 2 hardens and verifies that same product for the customer-facing public beta, after which participating customers may enter permitted real business data. No formal uptime SLA is offered during the beta, but the approved tenant-isolation, security, private-file, audit, backup-restoration, and operational checks remain mandatory customer-release gates.

## The Problem

SMEs often manage recurring requests, approvals, and operational handoffs through disconnected spreadsheets, email threads, messaging tools, and paper. This creates unclear ownership, manual follow-up, slow decisions, missing evidence, and limited visibility into current or historical work.

Existing BPM and automation products may require specialist knowledge, significant configuration, or infrastructure and licensing budgets that are difficult for smaller organizations to justify.

## The Solution

Moviqo provides a visual workflow designer and runtime for creating, publishing, executing, and monitoring operational processes.

The minimum workflow model supports:

- Organizations, single-Organization user accounts, users, teams, and hierarchical access levels
- Visual process design with Start, Task, Conditional Routing, Transition, and End elements
- Tasks with configurable forms, calculations, and structured data capture
- Assignment to a specific Member, Team, Workflow initiator, or Member selected through a User Reference Process Field
- One primary Task-completion action, with business choices captured as Process Data and routing selected through unconditional Transitions or visual Conditional Routing
- Attachments stored outside the operational database
- Task inboxes, process tracking, and audit history
- Workflow drafts and immutable published versions
- Designer-defined instance states optionally applied by Transitions
- Optional assignment and Transition email notifications; assignment email is disabled by default for both Member and Team assignment

Example: a commercial employee submits a purchase request, the purchasing manager reviews it, and the commercial employee receives the configured outcome.

## What Makes This Different

Moviqo’s primary differentiation is the simplicity of moving from an operational idea to a working process without technical staff. The product should be approachable to an SME administrator or process designer, while still providing tenant isolation, permissions, traceability, and reliable execution.

Security and reliability are trust requirements, not assumed competitive moats. The product must make them concrete through secure multi-tenant access, role-based permissions, private document handling, auditability, and safe workflow history. Detailed controls belong in system design and architecture.

## Who This Serves

**Primary customer hypothesis:** SMEs, initially in Spanish- and English-speaking markets, that rely on manual coordination and lack dedicated automation teams.

**Buyer:** likely the company owner or operations manager.

**Builder:** an administrator or process designer who configures users, teams, forms, tasks, states, and workflows.

**Participant:** employees who initiate requests, complete tasks, make decisions, or review work.

This segment and buyer remain hypotheses; no initial pilot company or industry has been selected yet.

## Success Criteria

- At least five distinct Organizations use Moviqo during the public beta; operating capacity remains twenty Active Organizations.
- Participating Organizations publish at least twenty distinct Workflow definitions in total; additional versions of the same Workflow do not increase this count.
- Participating Organizations complete at least one hundred Processes by successfully reaching an End element; cancelled, failed, and running Processes do not count.
- At least two of the initial five Organizations remain active during their thirtieth day after activation. Qualification requires a Member to sign in and perform a meaningful authenticated product action; background activity does not qualify.
- A first-time non-technical Owner publishes a simple valid Workflow within sixty minutes, with thirty minutes as the target. Measurement starts at `Create Workflow` and ends at successful publication.
- At least one Organization creates, publishes, starts, executes, and completes a Workflow without developer intervention during the measured flow.
- At least one participating Organization records that it would consider continuing under an affordable paid plan; payment is not required during the free beta.
- The beta has no confirmed cross-Organization exposure and no customer-data loss that remains unrecovered beyond the approved recovery objectives.

## Scope

### MVP includes

The MVP includes the bilingual public landing page; registration and secure account flows; one Account per Organization; hierarchical Member, Designer, Administrator, and Owner capabilities; users and Teams; authorized Workflow starters; Start, Task, Conditional Routing, Transition, and End elements; Task Forms, Process Fields, calculations, validations, reusable Organization Choice Lists, assignments, drafts, publication, versions, restoration, inactive elements, live compatible updates, execution, dashboards, timelines, audits, attachments, exports, Organization lifecycle and beta limits, and optional email notifications.

Publishing a change creates an immutable, auditable workflow revision. Active process instances remain at their current execution point and use the newest published revision for all routing from that point forward; they do not automatically restart, replay completed work, or migrate backward. New tasks and changes to future tasks, transitions, conditions, and paths therefore apply to active instances when execution next reaches them.

If a new field or validation is introduced in a previously completed task, Moviqo does not reopen that task automatically. The designer may add a condition at the current or a future task that detects the missing value and routes execution back to the previous task. Backward transitions and loops are allowed, and the designer is responsible for defining that corrective path.

An element with an open task instance cannot be deactivated or deleted. A task definition may be physically deleted only when it has never been published and all draft references and transitions have been removed. A published but never-executed task may be removed entirely from the current workflow, but it remains inside its immutable historical version. If historical task instances exist, the definition cannot be deleted; it may instead be retired from the current workflow. Retired task definitions remain available in an Inactive Elements section and are hidden from the active canvas. Previously executed transitions remain in audit history even when the latest workflow follows a different path.

The designer may reactivate a retired task. Reactivation restores the same task definition and stable identity to the active canvas; the designer decides its visual position and reconnects it to the current workflow. Moviqo can display draft validation findings while work is saved, but a draft may retain validation errors so incomplete work is not lost. The workflow cannot be published until every blocking graph, Form, assignment, rule, calculation, reference, and dependency error is resolved.

All published workflow versions are preserved as immutable historical definitions. Restoring an older version does not move the current-version pointer backward or erase later versions. Instead, Moviqo creates a new draft copied from the selected historical version; after validation, publishing that draft creates the next sequential version and records the source version, designer, timestamp, and restoration reason. The designer can compare the restored draft with the current version before publishing.

Restoration follows the same active-instance rules as any other workflow change. It cannot remove an open task, rewrite completed history, or delete data introduced by later versions. Later elements with history are retired rather than deleted. Once published, active instances use the restored version from their current execution point.

To preserve traceability across live workflow revisions, every task creation, task completion, form submission, conditional-routing evaluation, and executed transition records the organization, process instance, workflow version, stable element identifier, user, timestamp, and resulting action or path. Restoration and reassignment events additionally record their reason and source.

Field identifiers and data types are immutable after creation. Removing a field from a form does not delete previously captured values. A field cannot be retired while calculations, conditions, assignments, or other active definitions reference it; the designer must show every dependency and require those references to be removed first.

Before publishing, Moviqo validates that all references resolve, active tasks still exist, and configured assignments target active users or teams. A workflow requires exactly one active Start element, exactly one active End element, and at least one active Task. Every active element must be reachable from Start, every reachable task must have a route that can eventually reach End, and no active path may terminate in a dead end. Each Conditional Routing element must have configured conditions and a default path that select exactly one outgoing route. Cycles are allowed. Drafts with validation errors may be saved, but invalid revisions cannot be published.

If a user or team becomes inactive after publication or task assignment, affected open tasks require manual reassignment by an organization administrator. Moviqo must surface those tasks as needing attention and record reassignment in the audit history. Automatic periodic detection and reassignment may be considered later.

Process-field definitions are isolated per workflow and reusable across its tasks. Each process instance stores its own field values, isolated by organization. Forms may create a new process field, reuse an existing process field, or contain display-only information.

Spanish is the default product language. Users may select English as their interface language. System-generated interface text and email notifications use the user's selected language, falling back to Spanish. Designer-authored workflow names, task labels, field labels, instructions, states, and action labels remain in the language entered by the designer; automatic translation and per-label bilingual authoring are deferred.

### Explicitly deferred

Full BPMN, parallel routing, subprocesses, timers, reminders and SLAs, customer-defined general-purpose asynchronous automation, external API integrations, master-data capabilities beyond the approved reusable Organization Choice Lists, advanced analytics, process intelligence, AI, round-robin or workload-based assignment, automatic reassignment services, enterprise SSO, MFA, native mobile applications, WhatsApp notifications, and formal uptime commitments. Required platform background operations for email, retries, exports, malware inspection, backups, monitoring, and Organization lifecycle are not deferred; their implementation mechanism is decided in architecture.

### Beta infrastructure boundary

Gate 1 may use suitable managed development or free-tier infrastructure for its controlled internal-beta/UAT deployment. Free tiers do not relax Moviqo's server-enforced tenant isolation even for synthetic data. Gate 2 requires production-suitable configuration and successful tenant-isolation, private-file, audit, authentication, monitoring, backup-restoration, dependency, secret, and threat-review release gates before customer activation.

The customer-facing beta must create an automated database and private-attachment backup at least once every twenty-four hours. Backups are encrypted and stored outside the primary production project or equivalent provider failure boundary, retain at least seven daily and four weekly recovery points, and target a twenty-four-hour recovery point and recovery time. A complete restoration test must succeed before the first customer, quarterly during beta, and after a material storage or recovery change. The beta terms disclose availability and recovery limitations.

### Beta data responsibility

Process designers decide which fields and attachments their workflows collect and are responsible for having a lawful purpose, appropriate authorization, and any required consent. Moviqo remains responsible for reasonable platform safeguards and tenant isolation.

During beta, designers must not use workflow forms to collect account passwords, authentication secrets, payment-card data, government identification numbers, health data, or other regulated/highly sensitive data. The form designer will display an information box explaining these responsibilities and restrictions. Formal beta terms require legal review before customer onboarding.

## Business Model Hypothesis

Moviqo will begin with a free beta to capture early customers and validate value. The intended commercial model is Organization-based pricing. The initial beta supports no more than twenty Active Organizations and, per Organization unless an audited exception applies, ten Pending or Active users, ten non-archived published Workflow definitions, two hundred Process starts and five hundred system emails per activation-anniversary cycle, and one hundred megabytes of active attachments. Paid pricing and later plan thresholds remain open and should be informed by customer value and willingness to pay rather than infrastructure cost alone. Pricing may later be standardized in USD for Spanish- and English-speaking markets.

## Vision

Moviqo evolves into an accessible operational process platform for SMEs: a trusted place to design, execute, monitor, and improve business processes. Over time it can support more complex process capabilities, analytics, process intelligence, recommendations, and AI while retaining the core promise of understandable, fast, and affordable automation.

## Open Questions and Risks

- Which SME industry and first process will provide the strongest validation signal?
- Which off-site storage destination will hold encrypted database and attachment backups?
- What evidence beyond one stated willingness to pay will justify moving from free beta to paid organization plans?
- Can the 30–60 minute first-workflow promise be demonstrated with usability testing?
