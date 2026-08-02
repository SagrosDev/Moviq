# Moviqo Requirements Map

This companion preserves traceability without duplicating the detailed requirements. The PRD is authoritative for product behavior; `DESIGN.md` and `EXPERIENCE.md` bind presentation and interaction; `ARCHITECTURE-SPINE.md` binds implementation invariants.

| Capability | Primary PRD coverage | UX / architecture coverage | Primary validation signal |
| --- | --- | --- | --- |
| CAP-1 | Sections 10.4, 11, 12.2 | EXPERIENCE: Public landing, registration, first-workflow flow | Landing → registration → verification → active initial Owner |
| CAP-2 | Sections 1, 3.2, 12.1–12.3, 13 | EXPERIENCE: Organization administration; Architecture AD-2, AD-7, AD-14 | Role/tenant tests; final-Owner and deactivation safeguards |
| CAP-3 | Sections 5.4–5.6, 14 | EXPERIENCE: Workflow catalog and Designer; Architecture AD-4, AD-5 | Immutable version, archive/reactivate, duplicate, restore tests |
| CAP-4 | Sections 4.1–4.9, 4.12–4.15, 5.2–5.5, 17 | DESIGN components; EXPERIENCE Designer patterns; Architecture AD-4, AD-5, AD-9 | Representative valid publication and actionable invalid-draft checks |
| CAP-5 | Sections 4.10–4.11, 4.14, 5.2–5.3 | EXPERIENCE rule guidance; Architecture AD-4, AD-6 | Golden interpreter fixtures and invalid-dependency publication tests |
| CAP-6 | Sections 5.1, 5.6–5.8, 6.1–6.2, 16 | EXPERIENCE Assigned-work flow; Architecture AD-3, AD-5, AD-6 | Transaction, idempotency, concurrency, route, loop, and End tests |
| CAP-7 | Sections 2, 3, 6.1, 6.3–6.4 | EXPERIENCE Task card/assignment/Needs Attention; Architecture AD-2, AD-3 | Exclusive claim and authorized reassignment tests |
| CAP-8 | Sections 1.2, 6.3–6.4, 8.2 | EXPERIENCE Dashboard, My Tasks, My Processes, timeline; Architecture AD-2, AD-9 | Authorized query and cross-tenant visibility tests |
| CAP-9 | Sections 4.8, 9, 10.5 | EXPERIENCE Form/file states; Architecture AD-2, AD-8, AD-10, AD-13 | File-state, capability-expiry, revocation, export, and recovery tests |
| CAP-10 | Section 7 | EXPERIENCE assignment and state patterns; Architecture AD-3, AD-10 | Outbox/idempotency, localization, suppression, and retry tests |
| CAP-11 | Sections 8, 9, 12.6–12.7 | EXPERIENCE timeline/recovery surfaces; Architecture AD-3, AD-13, AD-14 | Immutable audit, lifecycle deadline, deletion, and restore evidence |
| CAP-12 | Sections 4.13, 11.3, 13; NFR-009–017 | DESIGN tokens/components; EXPERIENCE accessibility/responsive floor; Architecture AD-9, AD-16 | Bilingual, regional, responsive, automated accessibility, keyboard, and screen-reader evidence |
| CAP-13 | Sections 10 and 15.1, 15.4–15.5 | Architecture AD-2, AD-7–AD-8, AD-11–AD-14, AD-16 | Isolation/security suites, safe telemetry, alerts, and restore evidence |
| CAP-14 | Sections 18–19 | EXPERIENCE key flows; Architecture Environment Gates and AD-11–AD-13, AD-16 | Gate 1 deployed E2E plus Gate 2 retained release evidence |

## Adopted companion precedence

1. The latest approved PRD decision controls product behavior and scope.
2. UX companions control interaction, responsive behavior, accessibility treatment, visual language, and customer-facing terminology when consistent with the PRD.
3. The architecture spine controls system structure, stack, data ownership, transactions, security mechanics, deployment, and test seams when consistent with the PRD.
4. This map provides navigation only; it does not weaken or replace any detailed requirement.

## Gate boundary

- **Gate 1 / Internal E2E:** complete deployed MVP business functionality, persistent synthetic data, harmless synthetic files, and company testers only.
- **Gate 2 / Real-data public beta:** the same product plus live malware inspection, independent daily backups, successful restore evidence, lifecycle automation, production security and isolation evidence, and accessibility evidence.
- Missing Gate 2 evidence prohibits customer onboarding and real-business-data entry; it does not prevent continued synthetic E2E testing.

