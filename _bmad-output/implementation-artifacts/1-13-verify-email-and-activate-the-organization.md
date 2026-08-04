---
baseline_commit: 7b85a4f
status: done
---

# Story 1.13: Verify Email and Activate the Organization

Status: done

## Story

As a registered Owner,
I want to verify my email securely,
so that my Organization becomes operational only after account control is proven.

## Acceptance Criteria

1. **Given** a pending initial Owner with the newest unexpired unused verification token
   **When** the matching email link is opened
   **Then** the account email is marked verified and the pending Organization and Owner Membership become active in one transaction
   **And** the activation audit records actor, Organization, time, and outcome without storing the token.

2. **Given** an expired, already-used, superseded, malformed, or email-mismatched token
   **When** verification is attempted
   **Then** no activation state changes, a safe localized recovery action is shown, and the response does not reveal unrelated account data
   **And** concurrent attempts can activate the account at most once.

3. **Given** an unverified account
   **When** it attempts authentication or protected Organization access
   **Then** the server denies access and returns the same safe verification-required behavior regardless of protected resource identifier
   **And** no Process Data can be accepted before activation.

## Tasks / Subtasks

- [x] Add one backend activation command that consumes the registration verification token exactly once and atomically activates the pending Owner, Organization, and Membership state. (AC: 1, 2)
  - [x] Reuse the existing `RegistrationVerification` record created in Story 1.12 instead of inventing a parallel activation store.
  - [x] Reject malformed, expired, consumed, or superseded tokens before any activation write occurs.
  - [x] Mark the verification record consumed and preserve single-activation semantics under concurrent requests.
- [x] Expose a safe public verification endpoint under `/api/v1` with RFC 9457 responses and no existence leakage. (AC: 1, 2)
  - [x] Accept the verification token from the link target and map failure modes to stable localized recovery responses.
  - [x] Return only minimal post-verification state needed for the SPA to guide the user toward sign-in; do not start a session in this story.
- [x] Enforce verification-required behavior across protected access seams. (AC: 3)
  - [x] Ensure pending users cannot authenticate into protected endpoints once Story 1.14 introduces sessions.
  - [x] Ensure current protected membership and tenant-context resolution paths fail safely if a pending user is somehow presented as authenticated during tests or future code changes.
- [x] Add the verification/activation surface in the SPA and route the registration email link into it. (AC: 1, 2)
  - [x] Add a public `/verify-email` page that handles loading, success, expired/invalid outcomes, and next-step guidance in Spanish and English.
  - [x] Preserve the landing-to-registration-to-verification continuity required by the PRD and UX flow.
- [x] Prove activation behavior with focused unit, integration, contract, and frontend tests before Story 1.14 builds sign-in on top of it. (AC: 1, 2, 3)
  - [x] Add concurrency evidence showing only one activation succeeds.
  - [x] Add negative-path evidence showing expired, reused, superseded, malformed, and mismatched tokens never activate any pending rows.
  - [x] Add frontend coverage for localized status messaging and safe recovery CTA rendering.

## Dev Notes

### Story intent

- Story 1.13 finishes the deferred half of Story 1.12. Registration already creates pending rows and sends a signed single-use link; this story must consume that link and activate the same records, not rebuild or duplicate onboarding state.
- Activation is the final public step before secure session sign-in in Story 1.14. Keep the slice narrow: verify and activate now, authenticate later.

### Epic and cross-story context

- Epic 1 is the first end-to-end path from public landing through a completed workflow. Story 1.13 is the gate between public onboarding and protected use.
- Story 1.12 already persists pending `Organization`, `MoviqoUser`, `Membership`, consent evidence, and `RegistrationVerification`, and it already emits a verification URL to `/verify-email?token=...`.
- Story 1.14 is the first secure-session story. Do not quietly add login/session creation here; return enough state for the frontend to direct the user to sign-in once that route exists.
- Story 1.15 will harden generic safe application errors. Story 1.13 should still use the existing Problem Details contract and avoid introducing custom unsafe error shapes that 1.15 would have to undo.

### Relevant product requirements

- FR-403 through FR-406 require verified-email authentication only, mandatory email verification before protected access, time-limited and single-use verification links, and initial Owner verification before the Organization becomes operational.
- FR-494 requires self-registered Organizations to remain Pending until verification.
- FR-495 requires successful verification to activate the eligible Organization and account and grant the first user Owner access, including inherited Administrator, Designer, and Member capabilities.
- FR-507 through FR-512 mean activation must still respect environment and capacity gates. Story 1.12 reserved pending capacity already; Story 1.13 must not activate past configured active limits or create partially active state.

### Previous story intelligence

- Story 1.12 already selected Django signing with `TimestampSigner` semantics and stores the `RegistrationVerification.id` in the outbound link. Activation should validate against that existing token shape instead of migrating to a second token format mid-journey.
- Story 1.12 deliberately created `registration_state` on `Organization` and `Membership`, plus `is_active=False` rows, so activation can be a state transition rather than a second create flow.
- Story 1.12 also already established public `/api/v1/organizations/registrations/`, bilingual registration UI, and verification-link email payload generation. Preserve those seams and extend them incrementally.

### Git intelligence

- Recent commits are `7b85a4f` (merge of Story 1.12), `1b2cb44` (fix API client checks), `009c9e5` (fix unit test execution), `2129ed3` (Story 1.12 implementation), and `5dbd4dd` (merge of Story 1.11).
- The recent pattern is: backend seam first, generated contract updates, focused tests, then minimal frontend route work. Follow that pattern rather than starting with large UI restructuring.

### Architecture guardrails the implementation must follow

- AD-3: verification/activation is one command and one transaction. Token consumption, account activation, Membership activation, Organization activation, audit, and any outbox follow-up must commit together or not at all.
- AD-7: the server owns verification, activation eligibility, and safe error behavior. The SPA may render progress and recovery guidance, but it must not treat a token as valid until the server confirms activation.
- AD-9: keep the verification page feature-sliced. Add a dedicated public page/feature instead of embedding one-off activation logic directly in `app` or `shared`.
- AD-10: do not send or resend mail synchronously in the request path. If this story adds resend support, it must still use the PostgreSQL outbox seam; otherwise leave resend for a later story.
- AD-11: respect the environment gate. In Gate 1 synthetic-only environments, eligible verified Organizations may activate; customer-facing production rules remain fail-closed until later gate stories.
- AD-16: implement through red -> green -> refactor. Start with failing tests for single successful activation, replay protection, expiry, supersession, mismatched token, and denied protected access.

### Current repo state to preserve

- [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py) already holds the activation state seams:
  - `MoviqoUser.is_active` stays `False` after registration.
  - `Organization.registration_state` and `Membership.registration_state` already support `pending` and `active`.
  - `RegistrationVerification` already tracks `expires_at` and `consumed_at`.
- [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/registration.py) currently:
  - generates the verification token with `signing.TimestampSigner(salt=VERIFICATION_SALT).sign(str(verification.id))`
  - builds the `/verify-email?token=...` link
  - reserves pending capacity before activation.
- [Moviqo.Back/src/moviqo/modules/organizations/application/views.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/views.py) currently exposes only registration and one protected membership detail API. There is no verification endpoint yet.
- [Moviqo.Back/src/moviqo/urls.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/urls.py) currently routes `/api/v1/organizations/registrations/` but not verification.
- [Moviqo.Front/src/app/ui/App.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/app/ui/App.tsx) currently routes `/`, `/design-system`, and `/register`. There is no `/verify-email` page yet.
- [Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx) and [Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx) already communicate pending-verification success. Preserve that continuity instead of redirecting users into an unrelated flow.
- [Moviqo.Front/src/shared/localization/messages.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/localization/messages.ts) owns bilingual copy and Spanish fallback. All new verification labels, status text, and recovery guidance belong there.

### Current behavior this story changes

- Registration successfully creates pending rows and emits a verification email, but the workspace currently has no activation endpoint, no verification UI route, and no sign-in or verification-required enforcement path yet.
- Protected access currently depends on authentication plus tenant resolution, but there is no explicit pending-user guard documented in the API seams yet.

### What must be preserved

- The single-Organization identity boundary from Story 1.9. Verification must activate only the Organization already bound to the pending account; it must not allow token use against another email or Organization.
- The password policy and registration data already accepted in Story 1.12. Verification must not ask the initial Owner to re-enter password or re-accept the already stored terms for this story.
- The no-protected-data-before-verification invariant from FR-404, FR-406, and FR-474.
- Safe Problem Details behavior with no token echo, no unrelated account disclosure, and no protected Organization data in success or failure responses.
- Frontend arrow-function style in `Moviqo.Front/src/**/*.{ts,tsx}`.

### Likely files and seams to touch

- Backend activation and API surface:
  - [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/registration.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/views.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/views.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py)
  - [Moviqo.Back/src/moviqo/urls.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/urls.py)
- Backend state and authorization seams:
  - [Moviqo.Back/src/moviqo/modules/organizations/models.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/models.py)
  - [Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py](C:/Endava/EndevLocal/Moviqo/Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py)
  - Any auth helper introduced for Story 1.14 must later reuse the pending-user enforcement created here rather than re-implementing it.
- Frontend public verification surface:
  - [Moviqo.Front/src/app/ui/App.tsx](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/app/ui/App.tsx)
  - New page files under `Moviqo.Front/src/pages/verification/`
  - New feature files under `Moviqo.Front/src/features/verification/`
  - [Moviqo.Front/src/shared/localization/messages.ts](C:/Endava/EndevLocal/Moviqo/Moviqo.Front/src/shared/localization/messages.ts)
- Tests and generated artifacts:
  - `Moviqo.Back/tests/unit/`
  - `Moviqo.Back/tests/contract/`
  - `Moviqo.Back/tests/integration/`
  - `Moviqo.Front/tests/unit/`
  - `docs/api/openapi-v1.json`

### Recommended implementation shape

- Add one backend service such as `verify_initial_registration(...)` in the organizations application seam.
- Parse and validate the token with the same Django signing namespace already used by Story 1.12. Use `unsign(..., max_age=...)` or an equivalent timestamp validation path so the cryptographic timestamp and the persisted `expires_at` agree; if both checks exist, enforce the stricter effective expiration.
- Lock the targeted `RegistrationVerification` row and related pending user, Membership, and Organization rows inside one transaction.
- Enforce “newest unexpired unused verification token” by rejecting older outstanding verification records for the same user if a newer one exists. If no resend flow exists yet, document and test the current single-token assumption explicitly so later resend work has a guardrail.
- Activate by:
  - setting `RegistrationVerification.consumed_at`
  - setting `MoviqoUser.is_active=True`
  - setting `Organization.is_active=True`
  - setting `Organization.registration_state=active`
  - setting `Membership.is_active=True`
  - setting `Membership.registration_state=active`
- Record activation audit without storing the raw token.
- Return a minimal response such as activated status, language, and safe next-step guidance. Do not create a Django session or protected dashboard response in this story.
- Add one public verification page that:
  - reads `token` from the query string
  - calls the verification endpoint once on load
  - renders localized loading, success, expired/invalid, and retry/sign-in-next-step states
  - never logs or persists the raw token client-side beyond the page request lifecycle.

### Verification-required enforcement guidance

- Even though session sign-in is Story 1.14, this story should establish the reusable backend predicate for “only active verified user and active Membership may proceed.”
- At minimum, guard current protected membership detail and tenant resolution seams against pending rows during tests. The goal is to prevent future sign-in work from accidentally authenticating a pending account into protected endpoints.
- If introducing a shared helper, place it in the organizations application seam so Story 1.14 can compose it for login and protected request authorization.

### What must not be broken

- Existing registration flow and its idempotent success replay behavior.
- Existing verification email payload shape and the public link contract unless there is a deliberate coordinated contract update.
- Existing pending-capacity reservation logic from Story 1.12.
- Existing problem-details, audit, and outbox infrastructure patterns.

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
  - Failing tests first for successful activation of the pending Owner, Organization, and Membership from a valid token.
  - Failing tests first for expired, malformed, already-consumed, and superseded tokens leaving all pending rows unchanged.
  - A concurrency integration test proving two simultaneous verification attempts produce at most one activation and one consumed token state.
  - Contract tests proving safe Problem Details for invalid verification attempts and minimal success payload for valid activation.
  - Tests proving pending users cannot pass protected access checks once the verification-required guard is introduced.
  - Frontend tests proving localized loading, success, and recovery states on `/verify-email`.

### Latest technical notes

- Django 5.2 signing documentation currently recommends `TimestampSigner` when the application needs signed values that are valid only within a bounded lifetime, and `unsign(..., max_age=...)` or the object-signing variants for expiry-aware validation. That matches the verification-link use case already started in Story 1.12. [Source: https://docs.djangoproject.com/en/5.2/topics/signing/]
- Django 5.2 authentication documentation keeps activation and session login as separate responsibilities. For this story, that supports verifying and activating the account without also creating the authenticated session that Story 1.14 will own. This is an inference from the docs and the local architecture boundary. [Source: https://docs.djangoproject.com/en/5.2/topics/auth/default/]
- Django 5.2 still documents server-side email handling independently from request-time authentication. Because Moviqo already uses its PostgreSQL outbox for email, verification should continue consuming the existing mail contract rather than introducing direct synchronous email logic here. [Source: https://docs.djangoproject.com/en/5.2/topics/email/]

### Project Structure Notes

- There is still no `project-context.md` file in this repository, so this story is grounded in the current epic, PRD, architecture spine, UX artifacts, Story 1.12 artifact, current code seams, and official Django documentation.
- Keep all new frontend implementation functions as arrow-function constants to match the repo rule in `AGENTS.md`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.13]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, Sections 10.4, 11.3, 12.2, 12.4]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-403, FR-404, FR-405, FR-406, FR-474, FR-476, FR-494, FR-495, FR-507, FR-510]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-3, AD-7, AD-9, AD-10, AD-11, AD-16]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Information Architecture, Flow 1, Accessibility Floor]
- [Source: `_bmad-output/implementation-artifacts/1-12-register-the-initial-owner-and-organization.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Front/src/app/ui/App.tsx`]
- [Source: `Moviqo.Front/src/pages/registration/ui/RegistrationPage.tsx`]
- [Source: `Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `https://docs.djangoproject.com/en/5.2/topics/signing/`, accessed 2026-08-04]
- [Source: `https://docs.djangoproject.com/en/5.2/topics/auth/default/`, accessed 2026-08-04]
- [Source: `https://docs.djangoproject.com/en/5.2/topics/email/`, accessed 2026-08-04]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Story context created on 2026-08-04 from Epic 1, PRD sections 10.4/12.2/12.4, the architecture spine, UX flow artifacts, Story 1.12 implementation artifact, current registration/organizations/frontend seams, sprint status, recent git history, and current official Django documentation.
- Story request `1.13` resolved directly to tracked key `1-13-verify-email-and-activate-the-organization`.
- No `project-context.md` file exists in the repo at story-creation time.
- Git story-branch preflight completed on branch `story/1-13-verify-email-and-activate-the-organization`.

### Completion Notes List

- Implemented `verify_initial_registration(...)` to validate signed verification tokens, reject malformed or unsafe activation attempts, consume the newest eligible verification exactly once, activate the pending user/organization/membership atomically, and append a token-free activation audit record.
- Added `/api/v1/organizations/registrations/verify-email/` with minimal success payloads and stable `verification_link_invalid` problem details, and tightened protected membership access so pending registration state fails closed without leaking tenant data.
- Added the public `/verify-email` frontend route, feature-sliced verification model and status panel, bilingual verification and recovery copy, and tests for token parsing, localized UI states, safe problem details, and PostgreSQL concurrency.
- Validation completed with `uv run ruff check src tests`, `uv run pytest`, `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`, `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`, `uv run python src/manage.py migrate --settings=moviqo.settings.integration --noinput`, `uv run pytest tests/integration --ds=moviqo.settings.integration`, `uv run python src/manage.py health_start`, `npm run test`, and `npm run build`.

### File List

- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_organization_tenant_contract.py`
- `Moviqo.Back/tests/contract/test_registration_contract.py`
- `Moviqo.Back/tests/integration/test_email_verification_integration.py`
- `Moviqo.Back/tests/unit/test_initial_registration.py`
- `Moviqo.Front/package.json`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/features/verification/index.ts`
- `Moviqo.Front/src/features/verification/model/verifyEmail.ts`
- `Moviqo.Front/src/features/verification/ui/VerificationStatusPanel.tsx`
- `Moviqo.Front/src/pages/verification/index.ts`
- `Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/build/check-node-version.mjs`
- `Moviqo.Front/tests/unit/verification-flow.test.cts`
- `docs/api/openapi-v1.json`
- `_bmad-output/implementation-artifacts/1-13-verify-email-and-activate-the-organization.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-04: Implemented Story 1.13 verification activation flow across backend, frontend, tests, and OpenAPI artifacts; advanced story status to `review`.

### Review Findings

- [x] [Review][Patch] Add a narrowly scoped PostgreSQL RLS bootstrap for public registration and verification — after token validation, use a transaction-local `registration_verification_id` setting for the matching verification lookup, then set the resolved organization tenant context before activation; during registration, set tenant context immediately after creating the organization. Do not bypass RLS globally. [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py:274-283]
- [x] [Review][Patch] Prevent activation from exceeding the configured organization capacity — `verify_initial_registration` activates the pending organization without rechecking `MOVIQO_ACTIVE_ORGANIZATION_CAPACITY` inside the activation transaction, so a later activation can exceed the current limit after registration reserved capacity. [Moviqo.Back/src/moviqo/modules/organizations/application/registration.py:274-340]
- [x] [Review][Patch] Make the single-use verification request safe under React StrictMode — the page POSTs the token from an effect while the app is rendered under `StrictMode`; development remounting can submit the token twice, and the replay response can replace a successful view with the invalid-link state. [Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx:30-59]
- [x] [Review][Patch] Preserve the registration language on the verification result — the API returns `language`, but the page stores only `email`, so success and recovery guidance can render in the browser-selected language instead of the language chosen during registration. [Moviqo.Front/src/pages/verification/ui/VerificationPage.tsx:39-48]
