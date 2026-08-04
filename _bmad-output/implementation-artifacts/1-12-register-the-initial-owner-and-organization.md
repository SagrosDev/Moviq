---
baseline_commit: 5dbd4dd
status: done
---

# Story 1.12: Register the Initial Owner and Organization

Status: done

## Story

As a prospective Owner,
I want to register myself and a new Organization,
so that I can begin the verified first-workflow journey.

## Acceptance Criteria

1. **Given** no account uses the normalized email and active-Organization capacity is available
   **When** the visitor submits personal name, Organization name, email, accepted password, required beta terms/privacy acceptance, language, and required regional defaults
   **Then** one pending account, pending Organization, and Owner Membership are created atomically with UUIDv7 identifiers
   **And** the response exposes no protected Organization data before verification.

2. **Given** required registration data, consent, password, email uniqueness, or capacity is invalid
   **When** registration is submitted
   **Then** the server returns field-specific safe Problem Details, creates no account/Organization/Membership, and preserves non-secret valid form entries for correction
   **And** equivalent existing-email cases do not disclose account existence.

3. **Given** registration commits successfully
   **When** the outbox worker processes the verification message
   **Then** a Spanish- or English-localized email is sent according to the registrant's selected language and contains a single-use verification link
   **And** delivery retry does not create another Organization or account.

## Tasks / Subtasks

- [x] Add the pending-registration backend model seam under `organizations` and keep the whole command atomic (AC: 1, 2, 3)
  - [x] Introduce explicit pending registration state for the initial Organization, account, and Owner Membership instead of overloading the current always-active defaults.
  - [x] Persist the onboarding fields required by FR491-FR494: display name, organization name, normalized unique email, selected language, regional format, timezone, currency, accepted document versions, and acceptance timestamp.
  - [x] Create any new supporting entities needed for verification issuance and one-time consumption in Story 1.13 without blocking this story on activation logic.
- [x] Implement one application command for self-registration that composes existing identity and password seams (AC: 1, 2)
  - [x] Reuse the single-Organization identity boundary from Story 1.9 so registration never creates a second account or Membership for an existing normalized email.
  - [x] Reuse the password-policy seam from Story 1.11 so registration does not embed a second password implementation.
  - [x] Use one outer transaction to create pending records, acceptance evidence, audit/idempotency rows, and verification-email outbox work together.
- [x] Add a safe public registration API contract and route (AC: 1, 2)
  - [x] Add a public `/api/v1` onboarding endpoint for initial Owner registration and document it in the generated OpenAPI schema.
  - [x] Return RFC 9457 Problem Details with stable field-level codes for invalid consent, invalid password, invalid regional selections, capacity full, and non-disclosing duplicate-email cases.
  - [x] Ensure success responses disclose only the minimum post-submit state needed to continue to verification.
- [x] Extend the landing/SPA with a registration surface that preserves non-secret valid entries and follows the bilingual UX baseline (AC: 1, 2)
  - [x] Add a dedicated registration page or feature slice reached from the public landing CTA instead of turning the home page into a one-off form.
  - [x] Default the preferred language to Spanish, suggest timezone/region/currency from the browser where available, and allow explicit review/change before submit.
  - [x] Preserve valid non-secret values after validation failures while clearing password inputs and never storing or echoing secrets client-side.
- [x] Capture required beta-document acceptance and prohibited-data acknowledgment explicitly (AC: 1, 2)
  - [x] Show the beta terms, privacy notice, and prohibited-data acknowledgment as explicit required actions before registration can submit.
  - [x] Persist accepted document versions and timestamp in a way later lifecycle and audit stories can reference without duplicating raw document bodies.
- [x] Queue and deliver the verification email through the existing PostgreSQL outbox flow (AC: 3)
  - [x] Enqueue a localized verification message payload in the same transaction as registration success.
  - [x] Use a single-use, time-bounded verification link payload that Story 1.13 can consume safely.
  - [x] Verify retries only resend or retry delivery; they must not create duplicate Organizations, users, Memberships, or acceptance evidence.
- [x] Prove the journey with focused backend, contract, frontend, and outbox tests before Story 1.13 builds on it (AC: 1, 2, 3)
  - [x] Add unit and integration tests for atomic creation, duplicate-email non-disclosure, invalid-consent rollback, capacity-full rollback, and persistence of pending state.
  - [x] Add contract tests for the public registration success and Problem Details failure shapes.
  - [x] Add frontend unit/component coverage for bilingual labels, Spanish defaulting, browser-derived regional suggestions, field preservation on failure, and password clearing.
  - [x] Add outbox tests showing one successful registration creates one verification work item and delivery retries do not create duplicate business records.

## Dev Notes

### Story intent

- The user requested `12.2`, which maps to PRD section `12.2 Organization registration and initial ownership`. In the sprint ledger, the corresponding implementation story is `1-12-register-the-initial-owner-and-organization`, and this artifact is created for that tracked story key.
- Story 1.12 is the first real public onboarding slice after the platform-spine work. It must establish pending registration safely and minimally so Story 1.13 can activate the same records rather than reconstruct them.

### Epic and cross-story context

- Epic 1 is the thin end-to-end path from landing to a completed first workflow. Story 1.12 is the public entry point into that journey.
- Story 1.9 already enforced one account and one Membership per Organization in MVP. Registration must preserve that exact boundary and avoid existence disclosure when the email is already used.
- Story 1.10 already established the transactional command, idempotency, audit, and outbox pattern. Registration must use that pattern instead of splitting business creation and email dispatch into separate HTTP-driven operations.
- Story 1.11 already established the accepted password-policy seam and shared frontend password input. Registration must consume those existing seams directly.
- Story 1.13 depends on this story persisting enough pending state to verify and activate later. Do not shortcut by creating already-active Organizations or by coupling activation into registration.

### Previous story intelligence

- Story 1.11 documented that, as of Tuesday, August 4, 2026, the repo still had no registration, sign-in, reset, or activation flow. That remains true in the current codebase.
- Story 1.11 also established a reusable `password_policy` application seam and shared `PasswordField` component. Reuse them; do not create registration-specific password validation or duplicate localized helper copy.
- The recent implementation-artifact pattern emphasizes concrete guardrails, exact file seams, and explicit verification commands. Keep this story incremental and test-led rather than broadening it into full session login or activation.

### Git intelligence

- Recent commits are `5dbd4dd` (merge of Story 1.11), `a3c1bda` (Story 1.11 implementation), `ee7b982` (merge of Story 1.10), `1b147ea` (Story 1.10 implementation), and `f7c4f64` (merge of Story 1.9).
- The implementation trend is backend-first with generated contract updates, explicit tests, and small UI surfaces that respect the architecture spine. Story 1.12 should follow that pattern.

### Existing repo state to preserve

- [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py) currently gives `Organization` only `slug`, `display_name`, and `is_active`, and `Membership` only `role` and `is_active`. Registration will need richer onboarding state, but the current Organization-scoped identity ownership must remain intact.
- [Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py) already protects normalized-email uniqueness across Organizations. Extend or compose this seam rather than bypassing it in a serializer or view.
- [Moviqo.Back/src/moviqo/modules/organizations/application/password_policy.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/password_policy.py) already validates passwords and provides localized violations. Registration must call it through the established helper path.
- [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py) and [Moviqo.Back/src/moviqo/modules/messaging/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/models.py) already provide PostgreSQL-backed outbox enqueue, lease, retry, and dead-letter behavior. Reuse that delivery seam for verification mail.
- [Moviqo.Back/src/moviqo/urls.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/urls.py) currently exposes only health, schema, system ping, and one protected membership endpoint. Registration will introduce the first public onboarding endpoint under `/api/v1`.
- [Moviqo.Front/src/app/ui/App.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/app/ui/App.tsx) currently switches only between `/` and `/design-system`. The onboarding route must fit this minimal routing approach or replace it intentionally without violating `app -> pages -> features -> entities -> shared`.
- [Moviqo.Front/src/pages/home/ui/HomePage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/home/ui/HomePage.tsx) is still the bilingual landing foundation. Preserve its public-landing role and route the registration CTA into a dedicated onboarding surface.
- [Moviqo.Front/src/shared/localization/messages.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/localization/messages.ts) already owns Moviqo text in Spanish and English with Spanish fallback. All registration labels, consent copy, and safe errors belong there or its established adjacent localization seam.
- [Moviqo.Front/src/shared/ui/PasswordField.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/ui/PasswordField.tsx) already satisfies the shared reveal-toggle contract and should be reused inside registration rather than reimplemented.

### Architecture guardrails the implementation must follow

- AD-2: derive and preserve Organization ownership correctly from the first write. The registration flow is public, but its persisted rows still become tenant-owned records and must be created with the same Organization integrity conventions as later protected operations.
- AD-3: create pending user, pending Organization, pending Owner Membership, terms-acceptance evidence, audit, and verification outbox in one transaction. If any part fails, nothing persists.
- AD-7: the server owns identity, authorization, and safe RFC 9457 errors. The frontend can help with UX and local suggestions, but it cannot decide uniqueness, capacity, activation, or credential validity.
- AD-9: keep the registration surface feature-sliced. Do not bury onboarding logic directly inside `pages` or component-local business rules.
- AD-10: verification email delivery must go through the existing PostgreSQL outbox worker and its retry semantics, not synchronous request-time delivery.
- AD-11: preserve the Gate 1 synthetic-only boundary. Successful registration in this workspace still produces a Pending Organization that cannot expose protected data before verification and later gate checks.
- AD-16: implement through red -> green -> refactor. Registration must ship with focused failing tests first for atomic rollback, duplicate-email non-disclosure, consent requirements, capacity-full behavior, and outbox emission.

### Current code behavior this story changes

- There is no registration API, no onboarding models beyond the basic Organization/Membership/User triad, and no acceptance-record persistence seam yet.
- There is no public email-verification issuance path yet, but the outbox infrastructure already exists and is the intended delivery mechanism.
- The frontend has no registration route, no onboarding form state, no regional selector UX, and no consent controls yet.

### What must be preserved

- The single-Organization identity boundary and safe duplicate-email behavior from Story 1.9.
- The password policy, localized password violations, and shared password UI from Story 1.11.
- Safe Problem Details and correlation-ID behavior from the existing API contract tests.
- Arrow-function frontend implementation style under `Moviqo.Front/src/**/*.{ts,tsx}`.
- The public landing experience as a non-authenticated surface that does not leak protected Organization data.

### Likely files and seams to touch

- Backend URLs and API surface:
  - [Moviqo.Back/src/moviqo/urls.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/urls.py)
  - Add one public registration view/serializer under `Moviqo.Back/src/moviqo/modules/organizations/application/`
- Backend organizations module:
  - [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/password_policy.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/password_policy.py)
  - New onboarding command/service, serializers, and migrations under the same module ownership.
- Backend messaging seam:
  - [Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py)
  - [Moviqo.Back/src/moviqo/modules/messaging/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/messaging/models.py)
- Frontend application shell and onboarding slices:
  - [Moviqo.Front/src/app/ui/App.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/app/ui/App.tsx)
  - [Moviqo.Front/src/pages/home/ui/HomePage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/home/ui/HomePage.tsx)
  - [Moviqo.Front/src/shared/localization/messages.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/localization/messages.ts)
  - [Moviqo.Front/src/shared/ui/PasswordField.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/ui/PasswordField.tsx)
  - New onboarding page/feature files under `pages/` and `features/` as appropriate.
- Tests:
  - Existing contract and problem-details tests under `Moviqo.Back/tests/contract/`
  - Existing organizations and atomic-command tests under `Moviqo.Back/tests/unit/` and `Moviqo.Back/tests/integration/`
  - Frontend tests under `Moviqo.Front/tests/unit/` and `Moviqo.Front/tests/e2e/`

### Likely implementation shape

- Add explicit pending onboarding data rather than treating `is_active=False` alone as the full business state. Story 1.13 needs enough durable information to verify and activate correctly.
- Introduce one registration command/service that validates:
  - normalized email uniqueness through the identity boundary
  - password through the password policy
  - required consent/document versions
  - supported language/region/timezone/currency values
  - current active-Organization capacity
- Persist accepted document-version evidence as structured metadata or a dedicated acceptance record, not raw legal-document content copies.
- Generate one single-use verification payload at registration time using Django-approved signing/token facilities and store only the minimum server-side linkage needed for later verification and invalidation.
- Enqueue one localized verification email via the messaging outbox. The payload should include safe subject/body/template inputs and no protected Organization data beyond what the recipient already supplied.
- Keep the frontend registration flow public, bilingual, and corrective:
  - prefill Spanish as default
  - derive browser suggestions for timezone/region/currency when possible
  - allow explicit edits before submit
  - preserve non-secret valid inputs on failure
  - clear password values after failed submit

### What must not be broken

- Existing protected membership endpoint and tenant-context behavior.
- Existing outbox lease/retry/dead-letter semantics.
- Existing password-policy localization and shared password-field accessibility.
- Existing landing-page bilingual behavior and language persistence.
- The invariant that no protected Organization data is exposed before verification.

### Testing requirements

- Required backend verification commands:
  - `uv run ruff check src tests`
  - `uv run pytest`
  - `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
  - `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
  - `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`
  - `uv run pytest tests/integration --ds=moviqo.settings.integration`
  - `uv run python src/manage.py health_start`
- Required frontend verification commands:
  - `npm run test`
  - `npm run build`
- Required story-specific evidence:
  - Failing tests first for successful atomic creation of pending account, pending Organization, pending Owner Membership, acceptance evidence, and exactly one verification outbox message.
  - Failing tests first for duplicate normalized email returning the same safe outward contract as other blocked registrations without disclosing existence.
  - Failing tests first for invalid password, missing consent, unsupported regional values, and capacity-full conditions rolling back all business rows.
  - Contract tests proving safe field-level Problem Details and a minimal success response.
  - Frontend tests proving Spanish defaulting, editable regional suggestions, preserved non-secret values on validation failure, and password clearing after failure.
  - Outbox tests proving delivery retry does not create duplicate registration business state.

### Latest technical notes

- The local architecture spine still pins Django `5.2.15` LTS, but Django's release notes on Tuesday, August 4, 2026 already list `5.2.16` as available. Do not upgrade the stack inside this story; build against the repo-approved `5.2.15` contract unless the team explicitly chooses a dependency update story later.
- Django 5.2 documentation for email recommends `EmailMessage` and reusable backend connections for advanced or repeated email sending. Moviqo already wraps delivery through its outbox worker, so registration should produce message payloads for that worker rather than adding direct request-time mail calls.
- Django's signing documentation for `TimestampSigner` and signed payload helpers supports timestamp-bounded verification tokens with server-side signature validation. That is aligned with Story 1.12 preparing a single-use verification link for Story 1.13 without inventing custom crypto.
- OWASP's authentication guidance still aligns with the password policy already adopted in Story 1.11: long passphrases, blocklists, and no arbitrary composition rules. Registration should inherit that seam, not reinterpret it.

### Project Structure Notes

- Keep backend onboarding ownership under `moviqo.modules.organizations`. Do not move public registration into `building_blocks`.
- Keep legal-copy localization and password helper copy in the existing frontend localization seam.
- There is still no `project-context.md` file in this repository, so this story is grounded in the current PRD, UX, architecture, implementation artifacts, current repo state, and official Django references only.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.12]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Sections 10.4, 12.1, 12.2, 12.4]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR371, FR372, FR475, FR476, FR491, FR492, FR493, FR494, FR495, FR507, FR510]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2, AD-3, AD-7, AD-9, AD-10, AD-11, AD-16]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`, Brand & Style, Components]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Information Architecture, Voice and Tone, Accessibility Floor, Flow 1]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/identity_boundary.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/password_policy.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/messaging/models.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/pages/home/ui/HomePage.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `Moviqo.Front/src/shared/ui/PasswordField.tsx`]
- [Source: `https://docs.djangoproject.com/en/5.2/topics/email/`, accessed 2026-08-04]
- [Source: `https://docs.djangoproject.com/en/dev/topics/signing/`, accessed 2026-08-04]
- [Source: `https://docs.djangoproject.com/en/5.2/releases/`, accessed 2026-08-04]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from the Epic 1 artifact, PRD section `12.2`, local architecture spine, UX artifacts, Story 1.11 implementation artifact, current organizations/messaging/frontend seams, sprint status, and current official Django references.
- Story request `12.2` was resolved to tracked story `1-12-register-the-initial-owner-and-organization`.
- Git story branch preflight completed on `story/1-12-register-the-initial-owner-and-organization` with existing local changes preserved.
- Verification on Tuesday, August 4, 2026 passed for `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, `npm run generate:api-client`, `npm run test:unit`, `node tests/architecture/frontend-boundaries.test.mjs`, `.\node_modules\.bin\tsc.cmd --noEmit`, and `.\node_modules\.bin\vite.cmd build`.
- The repo wrapper commands `npm run test` and `npm run build` were blocked on Tuesday, August 4, 2026 because the workspace currently has Node `26.6.0` while `tests/build/check-node-version.mjs` requires `26.5.1`.

### Completion Notes List

- Implemented pending registration state across `Organization`, `Membership`, and `MoviqoUser`, plus consent and verification support records for Story 1.13 follow-on activation.
- Added a public `/api/v1/organizations/registrations/` endpoint, safe registration command, localized verification outbox payload, generated OpenAPI contract, and frontend registration route reached from the landing CTA.
- Added backend contract/unit coverage for atomic creation, consent rollback, capacity rollback, duplicate-email non-disclosure, and outbox retry stability, plus frontend registration model coverage for Spanish defaults, browser suggestions, preserved non-secret values, and password clearing.
- Full backend validation passed on Tuesday, August 4, 2026; frontend code validation passed through direct architecture, type, unit, API-client generation, and Vite build commands, while the repo wrapper scripts remain blocked by the local Node `26.6.0` versus pinned `26.5.1` mismatch.

### File List

- `_bmad-output/implementation-artifacts/1-12-register-the-initial-owner-and-organization.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0007_membership_registration_state_and_more.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0008_initialregistrationcommandresult_and_consent_flags.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_registration_contract.py`
- `Moviqo.Back/tests/integration/test_tenant_isolation.py`
- `Moviqo.Back/tests/unit/test_initial_registration.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/styles.css`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/registration/index.ts`
- `Moviqo.Front/src/features/registration/model/registrationForm.ts`
- `Moviqo.Front/src/features/registration/model/submitRegistration.ts`
- `Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx`
- `Moviqo.Front/src/pages/home/ui/HomePage.tsx`
- `Moviqo.Front/src/pages/registration/index.ts`
- `Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/registration-model.test.cts`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-04: Implemented Story 1.12 pending registration backend, public API, verification outbox payload, registration frontend route, and supporting tests; backend validation passed and frontend direct validation passed, with `npm run test` and `npm run build` blocked only by the local Node `26.6.0` versus pinned `26.5.1` version gate.
- 2026-08-04: Applied code-review fixes for explicit consent capture, public-registration idempotency replay, stable registration validation responses, slug-collision retry handling, pending-capacity reservation, and inline frontend correction messages; focused registration backend tests and frontend unit/type checks passed, while `npm run typecheck` remained blocked by the same pinned Node `26.5.1` wrapper check against local Node `26.6.0`.

### Review Findings

- [x] [Review][Patch] Terms and privacy acceptance are not explicitly captured [Moviqo.Back/src/moviqo/modules/organizations/application/views.py:75]
- [x] [Review][Patch] Successful registration retries do not replay the original result and the fallback public idempotency key is unsafe [Moviqo.Back/src/moviqo/modules/organizations/application/views.py:127]
- [x] [Review][Patch] Generic serializer validation bypasses the story's stable registration Problem Details contract [Moviqo.Back/src/moviqo/modules/organizations/application/views.py:109]
- [x] [Review][Patch] Concurrent registrations can fail with an unhandled slug-collision `IntegrityError` [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py:105]
- [x] [Review][Patch] The registration form hides field-specific correction messages for several invalid inputs [Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx:101]
- [x] [Review][Patch] Active-capacity checks do not reserve slots for pending registrations near the limit [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py:94]
