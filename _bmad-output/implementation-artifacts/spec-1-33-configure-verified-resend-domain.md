---
title: 'Configure Story 1.33 email delivery with the verified Resend domain'
type: 'bugfix'
created: '2026-08-08'
status: 'done'
baseline_commit: 'ed1114e91b535b638a980579289420dc22292b5a'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/1-33-automate-the-first-workflow-e2e-journey.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.33 cannot pass its deployed journey because UAT sends through Resend's restricted `onboarding@resend.dev` address. Moviqo now owns `mymoviqo.com`, and Resend has verified the sending subdomain `updates.mymoviqo.com`.

**Approach:** Make the sender an explicit runtime contract set to `Moviqo <notifications@updates.mymoviqo.com>`, use it for every Resend delivery, and retain the synthetic-only recipient redirect so the generated `.test` journey address reaches the controlled UAT mailbox. Reconcile repository deployment guidance with the Cloud Run job and Scheduler that are actually deployed.

## Boundaries & Constraints

**Always:** Keep Resend as the provider; keep API keys and the controlled test recipient in Secret Manager; preserve real recipient addresses outside the reserved synthetic journey domain; configure non-secret sender identity through environment configuration; preserve the GitHub-to-Cloud-Run deployment and exact-build journey gate.

**Ask First:** Any change to DNS, the verified domain, the public UAT origin, real-user recipient routing, or provisioned Google Cloud identities/jobs beyond updating their existing configuration.

**Never:** Commit an API key or mailbox address; use `onboarding@resend.dev`, Gmail/SMTP, or `moviqo.local` as a Resend sender; bypass outbox delivery evidence; remove or weaken the deployed journey.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Synthetic UAT registration | Recipient ends in `@synthetic.moviqo.test` | Send from verified Moviqo sender to secret-backed UAT recipient | Fail closed if sender or recipient is missing/invalid |
| Real email delivery | Recipient is not reserved synthetic address | Send from verified Moviqo sender to the original recipient | Never redirect to the UAT mailbox |
| Invalid sender configuration | Missing or malformed sender | Do not call Resend | Emit a stable non-sensitive delivery reason |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py` — builds Resend requests and applies synthetic UAT routing.
- `Moviqo.Back/src/moviqo/settings/base.py` and `uat_contract.py` — expose and validate runtime messaging configuration.
- `Moviqo.Back/tests/unit/test_resend_delivery.py` and `test_uat_contract.py` — verify sender, recipient routing, and fail-closed behavior.
- `Moviqo.Infrastructure/modules/*.json`, `environments/uat/uat-environment.json`, and `operations/validate_uat.py` — declare and statically validate UAT runtime configuration.
- `Moviqo.Infrastructure/README.md`, `AGENTS.md`, and Story 1.33 — durable operator context and release evidence.

## Tasks & Acceptance

**Execution:**
- [x] Add and validate `MOVIQO_RESEND_FROM_EMAIL`; replace provider-boundary sender values with the configured verified sender.
- [x] Preserve synthetic recipient redirection and test synthetic, real-recipient, and invalid-configuration paths.
- [x] Update UAT service/job contracts with the verified sender and the actual existing service account; adapt static validation without inventing resources.
- [x] Record the domain, sender, Cloudflare/Resend ownership boundary, secret policy, outbox Scheduler, and exact-build release sequence.
- [x] Update Story 1.33 evidence without marking it done before live UAT passes.

**Acceptance Criteria:**
- Given valid UAT configuration, when the outbox job handles a registration email, then Resend receives the verified sender and the controlled UAT recipient while the stored payload remains unchanged.
- Given a non-synthetic recipient, when email is delivered, then Resend receives the verified sender and the original recipient.
- Given missing or invalid sender configuration, when delivery is attempted, then delivery fails closed with no secret or email body logged.
- Given the repository validation and backend test suites, when run locally, then they pass and prove the declared UAT contract.

## Spec Change Log

## Verification

**Commands:**
- `uv run pytest Moviqo.Back/tests/unit/test_resend_delivery.py Moviqo.Back/tests/unit/test_uat_contract.py` — focused backend behavior passes.
- `python Moviqo.Infrastructure/operations/validate_uat.py` — UAT deployment contract passes.
- `git diff --check` — changed files contain no whitespace errors.

**Manual checks:**
- After merge, confirm the exact commit is Ready at 100% traffic, update the existing outbox job to that image/configuration, verify a Scheduler-triggered execution exits 0, and rerun `deployed-journey` against that exact build.

**Results:**
- Backend lint passed; full backend suite passed (`239 passed`, `51 skipped`).
- Focused sender/UAT/production contracts passed (`31 passed`).
- Static UAT infrastructure validation and `git diff --check` passed.

## Suggested Review Order

**Delivery boundary**

- Override every Resend envelope with the verified sender while preserving real recipients.
  [`__init__.py:342`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L342)

- Fail closed for missing, malformed, or mixed synthetic recipient configuration.
  [`__init__.py:368`](../../Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py#L368)

**Runtime contract**

- Require the exact verified sender in synthetic-only UAT.
  [`uat_contract.py:35`](../../Moviqo.Back/src/moviqo/settings/uat_contract.py#L35)

- Declare the actual job identity, sender, and managed-secret bindings.
  [`cloud-run-job.json:1`](../../Moviqo.Infrastructure/modules/cloud-run-job.json#L1)

- Reject incomplete or inconsistent service and job configuration.
  [`validate_uat.py:207`](../../Moviqo.Infrastructure/operations/validate_uat.py#L207)

**Evidence and operations**

- Prove synthetic routing, real recipients, invalid senders, and mixed-recipient rejection.
  [`test_resend_delivery.py:22`](../../Moviqo.Back/tests/unit/test_resend_delivery.py#L22)

- Preserve the verified-domain and release decisions for future repository agents.
  [`AGENTS.md:18`](../../AGENTS.md#L18)

- Document Cloudflare, Resend, Scheduler, secrets, and real UAT delivery behavior.
  [`README.md:51`](../../Moviqo.Infrastructure/README.md#L51)
