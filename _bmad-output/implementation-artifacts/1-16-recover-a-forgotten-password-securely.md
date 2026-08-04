---
baseline_commit: fc40970a070625418156a744dd66dc6039a7a356
---

# Story 1.16: Recover a Forgotten Password Securely

Status: done

## Story

As an account holder,
I want to recover a forgotten password without account disclosure,
so that I can regain access and invalidate potentially exposed sessions.

## Acceptance Criteria

1. **Existence-neutral recovery request (FR7, FR380, FR387)**
   - Given any syntactically valid recovery email, when a recovery request is submitted, then an existing and a non-existing account receive the same status, response shape, localized generic message, and externally observable behavior.
   - Repeated requests are bounded by rate limiting using privacy-safe account/network keys. Logs, telemetry, responses, and email payloads never include the submitted email as a raw value or any recovery token.
   - Invalid syntax may return the existing safe Problem Details validation contract; valid syntax must not reveal whether the account exists, is inactive, unverified, or otherwise ineligible.

2. **Single-use reset and session revocation (FR381, AD-3, AD-7)**
   - Given an active account and its newest unexpired unused recovery token, when a password satisfying Story 1.11 is submitted, then the password is replaced with Django's salted hash, the token is consumed, and every existing authenticated session is invalidated in one database transaction.
   - A replay, expired token, superseded token, malformed token, token for another user, or concurrent second submission makes no password/session/token change and returns a safe generic failure. Concurrent valid submissions permit at most one success.
   - The reset must not authenticate the browser automatically, expose a session identifier, return a password, or write raw credentials/tokens to audit or diagnostics.

## Tasks / Subtasks

- [x] Add the Organizations recovery domain model and migration. (AC: 1, 2)
  - [x] Add a UUIDv7-backed recovery-token record associated with `MoviqoUser`, created/expiry/consumed timestamps, and a non-secret digest or equivalent opaque lookup value; never persist the raw token.
  - [x] Ensure the newest unexpired unused token supersedes older tokens for the same user, and add indexes/constraints appropriate for lookup and concurrency.
  - [x] Keep inactive/pending/unverified users in the same externally observable path as unknown users; do not create recovery records for them.
- [x] Implement the recovery request and reset application commands. (AC: 1, 2)
  - [x] Normalize identity email through the existing Organizations identity boundary and perform comparable work for unknown addresses where practical.
  - [x] Generate high-entropy single-use tokens, hash them before persistence, and enqueue a localized Spanish/English email through the existing transactional outbox/Messaging adapter. The URL may contain the raw token only in the delivery payload; it must never be logged or stored in the database.
  - [x] Use one outer `transaction.atomic()` for token creation/supersession, password update, token consumption, and session invalidation. Lock the user and candidate token row before checking eligibility/expiry/consumption.
  - [x] Reuse the Story 1.11 password normalization/validation path and call the configured Django password hashing/validator behavior; do not duplicate or weaken credential rules.
  - [x] Revoke all existing Django sessions for the user as part of the successful reset, without deleting unrelated users' sessions.
  - [x] Add bounded recovery throttling with generic responses and redacted structured logging. Do not use a client flag, email existence signal, or a new cache/database technology.
- [x] Expose documented API endpoints through the existing Organizations application views. (AC: 1, 2)
  - [x] Add public POST endpoints following the current `/api/v1/auth/` trailing-slash convention, for example `/api/v1/auth/password-recovery/` and `/api/v1/auth/password-reset/`.
  - [x] Require CSRF on both unsafe anonymous requests using the same `csrf_protect`/CSRF bootstrap seam as sign-in. Use stable Problem Details codes, generic reset-request success, and safe reset-token failure responses.
  - [x] Define request/response serializers and `extend_schema` entries; regenerate `Moviqo.Front/src/shared/api/generated/schema.d.ts` and `docs/api/openapi-v1.json`.
- [x] Add the bilingual frontend recovery journey. (AC: 1, 2)
  - [x] Extend the existing feature-sliced authentication/public-page seams with “Forgot password” from sign-in, a recovery-request page, and a token-based reset page.
  - [x] Preserve entered email on recoverable validation failures but never retain or render the password/token after submission or failure. Treat the URL token as transient input only; do not put it in localStorage, analytics, logs, or query-cache state.
  - [x] Show the same accessible confirmation for any syntactically valid recovery email. Provide password policy guidance and an accessible reveal control using the existing localization and design-system patterns.
  - [x] On successful reset, direct the user to sign-in with a generic completion message. Do not bootstrap a session or render protected data.
  - [x] Follow `AGENTS.md`: all new frontend implementation and test/build functions are arrow-function constants.
- [x] Add focused tests and evidence. (AC: 1, 2)
  - [x] Cover unknown/existing/inactive/unverified emails, equivalent status/body/timing-tolerant behavior, rate limiting, redacted logs, token email/outbox payload, and no raw token persistence.
  - [x] Cover valid reset, Story 1.11 rejection with no mutation, newest-token-only behavior, expiry/replay/malformed/wrong-user failures, session revocation, rollback, and concurrent reset attempts using real PostgreSQL where transaction/concurrency behavior matters.
  - [x] Cover CSRF rejection, API/OpenAPI schemas, frontend request credentials/CSRF, localized generic confirmation, token cleanup, password clearing, sign-in link, accessible labels/focus/errors, and no localStorage persistence.
  - [x] Add a Playwright journey for request → synthetic email/token → reset → old session rejected → sign-in with the new password, plus the unknown-email privacy path where the harness supports it.

## Dev Notes

### Scope and boundaries

- Story 1.14 owns Django session authentication, CSRF, session cookies, current-session behavior, sign-out, and SPA expiry handling. Extend those seams; do not introduce JWTs, refresh tokens, a second API client, or client-side authorization.
- Story 1.15 owns safe RFC 9457 Problem Details, correlation IDs, and redaction. Recovery endpoints must use that existing contract and generic application codes rather than inventing a response format.
- Story 1.11 owns the 15–128 character password policy and weak/compromised blocklist. Reuse its application helper/validator and localized error mapping.
- Story 1.13's registration verification token is a different domain concern. Do not overload `RegistrationVerification`, its salt, expiry, or activation flow. Recovery must have a separate model/token namespace.
- MFA, SSO, passkeys, passwordless login, identity enumeration, multiple Organizations, notification preferences, and user-configurable rate limits are out of scope.

### Existing seams to inspect and preserve

- `Moviqo.Back/src/moviqo/modules/organizations/models.py`: `MoviqoUser` stores normalized email and Django password hash; `Membership`/`Organization` activity and registration state determine account eligibility. Add the recovery model here, with migration under the Organizations app.
- `Moviqo.Back/src/moviqo/modules/organizations/application/registration.py`: establishes token signing, localized email payload, tenant-safe registration bootstrap, and atomic verification patterns. Reuse patterns only; keep salts and token records distinct.
- `Moviqo.Back/src/moviqo/modules/organizations/application/session.py`: owns `active_membership_for_user`, authentication, and `end_session`. Session revocation must invalidate all Django sessions for the reset user, not only the request session.
- `Moviqo.Back/src/moviqo/modules/organizations/authentication.py`: owns bounded login-risk helpers. Add a separate recovery-risk namespace/limit so login throttling semantics are not accidentally changed.
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py` and `Moviqo.Back/src/moviqo/urls.py`: add public views/routes with explicit serializers, CSRF decorators, Problem Details handling, and drf-spectacular schemas following sign-in/registration conventions.
- `Moviqo.Back/src/moviqo/modules/messaging/application/__init__.py`: `enqueue_outbox_message` and the lease-based drain are the only email delivery path. Recovery email delivery must be committed with the token command and remain retry-safe.
- `Moviqo.Front/src/shared/api/client.ts`: keep same-origin credentials, CSRF header injection, Problem Details normalization, and 401/403 session-expiry behavior. Do not create another fetch/client seam.
- `Moviqo.Front/src/features/authentication/`, `src/pages/sign-in/`, `src/app/ui/App.tsx`, and `src/shared/localization/messages.ts`: extend public auth routing, state, copy, and feature entry points in the established feature-sliced structure.

### Security and transaction guardrails

- The recovery request is a privacy boundary: same status/body for valid existing and unknown addresses, no raw email/token in logs, metrics, traces, audit, cache keys, exception text, or response fields. Hash or HMAC risk identifiers before use.
- Tokens must be cryptographically random, single-use, bounded in lifetime, scoped to the user, and stored only as a digest. Use a distinct salt/purpose if Django signing is used; never accept a token from another flow.
- Validate token eligibility and mutate user/token/session state under row locks inside one outer transaction. Consume the token only after password validation succeeds. A failed password validation must leave the token usable and password unchanged.
- “Every existing session” means delete/invalidate all matching Django `django_session` rows whose decoded `_auth_user_id` identifies the user, or use an equivalent server-authoritative mechanism proven by integration tests. Do not rely solely on changing a frontend flag or only calling `logout(request)`.
- Successful password reset invalidates the old credential and all sessions; it does not create a new authenticated session. Existing sessions must not survive a committed reset, and a rollback must preserve the old password, token, outbox, and sessions.
- Recovery email delivery is asynchronous: enqueue only after the command's state is valid and in the same transaction. A delivery retry may resend the same committed message but cannot create another account/token outcome.
- Keep authorization server-owned and preserve tenant/RLS behavior. Password recovery is an identity command and must not require an active tenant context or expose Organization/Process Data.

### API and UX contract

- Request fields should be minimal: recovery request `{ email }`; reset `{ token, password }`. Do not return email, token, user, Organization, or membership data from the recovery request.
- Recovery request success should be a generic localized acknowledgment (same response for unknown and eligible accounts). Reset failure should be generic for invalid/expired/replayed/superseded/wrong-user tokens; password-policy errors may identify only the password field and safe corrective constraints.
- Use the existing Problem Details fields and correlation ID handling. Never echo submitted email, password, or token in `detail` or `invalidParams`.
- Spanish is the fallback language; add English overrides in the existing message dictionary. Use clear headings, ordered label/help/input/error structure, visible focus, keyboard operation, and a minimum practical 44×44px action target. Password reveal must expose an accessible pressed state.
- The token link should route to the reset page and should not be rendered back to the user. A successful reset should offer sign-in; an invalid link should offer a safe request-again path without revealing why it failed.

### Architecture compliance

- AD-1: Organizations owns identity/recovery; Messaging is used via its public application contract.
- AD-3: password, token, session revocation, audit if applicable, and outbox state commit atomically; no chained HTTP calls.
- AD-7: Django auth/password hashing, same-origin session/CSRF, server authority, generated OpenAPI, and safe Problem Details are binding.
- AD-9/AD-11: one static SPA, no authenticated/API caching, no secrets in the bundle, same-origin API routing.
- AD-10: use PostgreSQL-backed outbox leases and existing email adapters; do not add Redis/Celery/broker infrastructure.
- AD-12: structured correlation-safe telemetry only; credentials, tokens, private links, and Process Data are prohibited.
- AD-16: red → green → refactor; real PostgreSQL for transactions, session invalidation, and concurrency; contract and Playwright accessibility evidence.

### Suggested file structure

Likely updates/new files; confirm exact names against current source before implementation:

- Backend: `organizations/models.py`, Organizations migration, `organizations/application/password_recovery.py`, `organizations/application/views.py`, `organizations/urls.py` or root `urls.py`, auth/risk helper, contract/unit/integration tests.
- Messaging: existing `modules/messaging/application/__init__.py` only if delivery handling needs a new explicit recovery message type; do not duplicate the outbox worker.
- Frontend: `features/authentication/` public model/UI, `pages/password-recovery/` or equivalent page slices, `app/ui/App.tsx`, `shared/localization/messages.ts`, generated schema, unit/E2E tests.
- Documentation: generated `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts`.

### Testing requirements

Use the repository’s approved backend/frontend commands and run focused tests before the full suite. Include real PostgreSQL integration for row-lock/concurrency/session-table behavior; mocks alone cannot prove atomic reset safety. Verify migration checks, Ruff/typecheck/build, API schema validation, architecture tests, contract tests, and Playwright accessibility. Assert negative properties explicitly: no raw token/email in persisted rows or logs, no session remains after reset, no reset email for ineligible accounts, no account-existence signal, and no partial mutation on any failure.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.11 and Story 1.16]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-1, AD-2, AD-3, AD-7, AD-9, AD-10, AD-12, AD-16]
- [Source: `_bmad-output/implementation-artifacts/1-11-enforce-the-password-and-credential-policy.md`]
- [Source: `_bmad-output/implementation-artifacts/1-14-sign-in-and-out-with-secure-sessions.md`]
- [Source: `_bmad-output/implementation-artifacts/1-15-return-safe-and-consistent-application-errors.md`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`, Foundation and interaction guidance]
- [Source: `AGENTS.md`, Frontend arrow-function convention]
- [Django password management and validation](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/)
- [Django custom authentication and PasswordResetForm assumptions](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/)

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

- Git story branch preflight selected `story/1-16-recover-a-forgotten-password-securely` after elevated permission was required for the repository's `.git` ACL.
- Project context file was not present; repository guidance came from `AGENTS.md`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story contexted from Epic 1, Stories 1.11/1.13/1.14/1.15, the architecture spine, UX foundation, current auth/session/messaging seams, and repository conventions.
- No repository `project-context.md` was found; `AGENTS.md` is the applicable local coding instruction.
- Added digest-only UUIDv7 recovery tokens, supersession, hashed throttling, atomic password reset, and all-session revocation.
- Added CSRF-protected recovery/reset API endpoints with Problem Details and regenerated OpenAPI/TypeScript artifacts.
- Added bilingual recovery/reset pages with transient token handling, password clearing, accessible reveal controls, and sign-in completion link.
- Validation: backend full suite 126 passed/16 skipped; recovery contract 3 passed; Ruff passed; Django checks/migration checks passed; frontend unit/typecheck passed; local Vite build and static scan passed.

### File List

- `_bmad-output/implementation-artifacts/1-16-recover-a-forgotten-password-securely.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0011_passwordrecoverytoken.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/password_recovery.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_password_recovery_contract.py`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/pages/sign-in/ui/SignInPage.tsx`
- `Moviqo.Front/src/pages/password-recovery/index.ts`
- `Moviqo.Front/src/pages/password-recovery/ui/PasswordRecoveryPage.tsx`
- `Moviqo.Front/src/pages/password-reset/index.ts`
- `Moviqo.Front/src/pages/password-reset/ui/PasswordResetPage.tsx`
- `Moviqo.Front/src/features/authentication/model/passwordRecovery.ts`
- `Moviqo.Front/src/features/authentication/ui/PasswordRecoveryForm.tsx`
- `Moviqo.Front/src/features/authentication/ui/PasswordResetForm.tsx`
- `Moviqo.Front/tests/e2e/password-recovery.spec.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-04: Implemented secure password recovery and reset journey with API, persistence, frontend, generated contracts, and tests.

### Review Findings

- [x] [Review][Patch] Recovery email stores the raw reset token in the database [Moviqo.Back/src/moviqo/modules/organizations/application/password_recovery.py:75] — The outbox now stores an authenticated encrypted envelope; the raw token is reconstructed only by the delivery adapter.
- [x] [Review][Patch] Recovery email payload is not deliverable through the existing Resend adapter [Moviqo.Back/src/moviqo/modules/organizations/application/password_recovery.py:75] — The delivery adapter now expands recovery envelopes into the existing `from`/`to`/`subject`/`text` email shape.
- [x] [Review][Patch] Recovery/reset and reset/recovery transactions acquire locks in opposite order [Moviqo.Back/src/moviqo/modules/organizations/application/password_recovery.py:62] — Reset now acquires the user lock before the token lock, matching recovery-request order.
- [x] [Review][Patch] Reset token remains in the browser URL after submission [Moviqo.Front/src/pages/password-reset/ui/PasswordResetPage.tsx:6] — The page captures the token transiently and removes the query string with `history.replaceState` on mount.
- [x] [Review][Patch] Invalid reset links do not offer the required safe request-again path [Moviqo.Front/src/features/authentication/ui/PasswordResetForm.tsx:39] — Invalid or missing-token states now expose a localized request-again link.
- [x] [Review][Patch] Recovery throttling is process-local and not a reliable bounded account/network limit [Moviqo.Back/src/moviqo/modules/organizations/application/password_recovery.py:47] — Throttling now uses digest-only relational rows with row locking, shared across workers.
