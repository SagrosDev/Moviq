---
id: SPEC-Moviqo
companions:
  - requirements-map.md
  - runtime-alignment.md
  - ../../planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md
  - ../../planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md
  - ../../planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Moviqo

## Why

Moviqo realizes an opportunity for Spanish- and English-speaking SMEs without automation teams: replace processes coordinated through spreadsheets, email, messaging, printed documents, and manual follow-up with understandable, executable Workflows. Non-technical users must reach useful automation without BPMN or software development while retaining security, traceability, reliability, and affordable beta adoption.

## Capabilities

- **CAP-1 — Public acquisition and onboarding**
  - **intent:** Visitors can understand the bilingual beta offer, register, verify identity, create one Organization, and activate its initial Owner.
  - **success:** A visitor completes the deployed landing-to-verified-Owner journey with accurate beta, privacy, support, and prohibited-data disclosures.

- **CAP-2 — Organization identity and administration**
  - **intent:** Owners and Administrators can manage one-Organization accounts, hierarchical access, users, Teams, regional settings, ownership continuity, and safe deactivation.
  - **success:** Every administration action is authorized and audited, historical identity is preserved, and deactivation cannot orphan open work or remove the final active Owner.

- **CAP-3 — Workflow catalog and lifecycle**
  - **intent:** Designers can create, discover, duplicate, archive, reactivate, version, compare, and restore Organization Workflows.
  - **success:** Catalog actions preserve unique active names, immutable publications, runtime history, attribution, and publication readiness.

- **CAP-4 — Visual Workflow and Form design**
  - **intent:** Non-technical Designers can configure valid Workflow graphs, responsive Task Forms, reusable Process Fields, assignments, starters, and presentation without BPMN or code.
  - **success:** A representative Workflow can be published, while invalid drafts remain safely editable and provide actionable links to every blocking issue.

- **CAP-5 — Deterministic rules and calculations**
  - **intent:** Designers can author typed visual conditions, calculations, validation, conditional Form behavior, and ordered routing.
  - **success:** Preview and execution produce the same authoritative result, every branch has safe fallback behavior, and incompatible or circular dependencies cannot be published.

- **CAP-6 — Process and Task execution**
  - **intent:** Authorized Members can start Processes, claim or open Tasks, save valid progress, complete Tasks, follow routes and loops, and reach End while preserving Process Data.
  - **success:** Each action produces one all-or-nothing, exactly versioned result with no partial completion, duplicate next work, or mutation of completed history.

- **CAP-7 — Assignment and operational recovery**
  - **intent:** Work can resolve to Members, Teams, initiators, or User References, and administrators can recover invalid assignments.
  - **success:** Team claims are exclusive, access moves correctly on reassignment, blocked work appears in Needs Attention, and every assignment transition is audited.

- **CAP-8 — Authorized work views and timelines**
  - **intent:** Users can find startable Processes, actionable Tasks, authorized Process progress, and their own contributions while administrators can inspect operational views.
  - **success:** Searchable, filterable, responsive views return only records and details authorized for the current user and Organization.

- **CAP-9 — Private files and portable exports**
  - **intent:** Authorized users can upload, inspect, preview, download, remove, and audit attachments, and Owners can request portable Organization exports.
  - **success:** Files remain private and state-gated, removal revokes application access, and export access is Owner-only, audited, and expires within 24 hours.

- **CAP-10 — Notifications and delivery tracking**
  - **intent:** Designers can opt into assignment and Transition email, and Organizations can opt into operational-problem email.
  - **success:** Delivery is localized, safe, tracked, idempotent, and retried independently without reversing the business event that triggered it.

- **CAP-11 — Audit, retention, and Organization lifecycle**
  - **intent:** Authorized users can inspect appropriate immutable history while Owners can export, close, recover, or proceed through the disclosed inactivity lifecycle.
  - **success:** Retention and deletion are governed and auditable, deleted workspaces cannot be restored after expiry, and only approved isolated historical evidence survives temporarily.

- **CAP-12 — Bilingual, regional, responsive, and accessible experience**
  - **intent:** Users can operate Moviqo in Spanish or English with Organization-consistent business formatting across supported devices and assistive interaction methods.
  - **success:** Critical flows preserve meaning, authorization, keyboard operation, visible focus, accessible validation, screen-reader state announcements, and 200% text enlargement.

- **CAP-13 — Tenant-safe and recoverable operation**
  - **intent:** Moviqo can protect Organization boundaries, identity, sessions, storage, diagnostics, availability, and recoverable data through evidence-gated operation.
  - **success:** No confirmed cross-Organization exposure occurs, applicable security gates pass, and covered data can be restored within the approved 24-hour RPO/RTO.

- **CAP-14 — End-to-end beta delivery**
  - **intent:** Company testers can exercise the complete deployed product with persistent synthetic data before production safeguards authorize real customer data.
  - **success:** Gate 1 completes landing-to-finished-Process journeys without developer intervention, and Gate 2 cannot promote until all real-data safeguards pass.

## Constraints

- The finalized PRD is product authority; the adopted UX and architecture companions bind implementation detail, and superseded Brief or PADR decisions cannot return.
- One account belongs to exactly one Organization. Member, Designer, Administrator, and Owner are hierarchical, and missing or mismatched Organization context is denied by default.
- Published versions, completed Task occurrences, selected routes, and semantic audit history are immutable; each protected operation uses one exact compatible definition.
- State-changing commands are idempotent and all-or-nothing across business state, audit, idempotency outcome, and outbox evidence.
- Rules, calculations, validation, and routing use one typed deterministic visual language; arbitrary scripts, raw expressions, and client-authoritative business semantics are prohibited.
- Process Data, files, exports, notifications, jobs, queries, and audit remain server-authorized and Organization-scoped.
- Moviqo-owned content is Spanish-first with English support; Designer content remains verbatim and shared business values use Organization regional settings.
- Operational flows are responsive; authoring targets at least 1280×720; applicable WCAG 2.2 Level A/AA criteria form the accessibility baseline.
- Normal Claim, Save, Complete, and configuration operations target two-second p95; application views target three-second usability under the approved beta profile.
- Internal E2E is company-only and synthetic-only. Real customer data is forbidden until live inspection, independent backup/restore evidence, lifecycle enforcement, security/isolation gates, and accessibility evidence pass.
- The finalized architecture companion binds the Python/Django modular monolith, React SPA, PostgreSQL, deployment topology, data boundaries, and integration seams.
- Project-authored Node.js runtime declarations, guards, and delivery artifacts use Node.js 26.7.0 so local verification, CI expectations, and written implementation guidance agree on one approved runtime.
- Delivery follows pragmatic TDD with real PostgreSQL, tenant-isolation, contract, architecture, and Playwright evidence; applicable failures block promotion.
- Free-tier allowances are operating ceilings, not product guarantees; capacity is monitored at 60/80/90%, with paid upgrade before users are impaired.

## Non-goals

- BPMN compatibility, parallel routing, subprocesses, timers, reminders, SLAs, arbitrary scripts, customer-defined background automation, and external API integrations.
- AI, advanced analytics, process intelligence, real-time collaborative editing, microservices, brokers, and distributed caches.
- Anonymous/public Process initiation, external participants, multi-Organization identities, MFA, SSO, passkeys, and social or passwordless sign-in.
- Round-robin or workload assignment, automatic reassignment, multiple Task outcome buttons, WhatsApp, SMS, push notifications, and a configurable notification center.
- Native mobile applications, narrow-screen Workflow authoring, formal uptime commitments, permanent free pricing, and automatic charges.

## Success signal

- Gate 1: company testers independently traverse the deployed landing page, isolated Organization onboarding, Workflow design/publication, Process execution, assignments, rules, files, routing, loops, versions, notifications, End, and persisted history using synthetic data.
- Public beta: at least 5 Organizations participate, 20 distinct Workflows publish, 100 Processes complete, 2 of the first 5 Organizations remain active on day 30, one non-technical Owner publishes within 60 minutes, one Organization completes end to end without developer intervention, and one records willingness to consider a paid plan.
- Trust: no confirmed cross-Organization exposure occurs, no covered customer-data loss remains unrecovered beyond the 24-hour objectives, and every applicable Gate 2 control has retained evidence.

## Assumptions

- Definitions to align means project-authored version declarations and generated project artifacts under source control, not third-party dependency engine metadata embedded inside installed-package records unless regeneration updates those records naturally.
