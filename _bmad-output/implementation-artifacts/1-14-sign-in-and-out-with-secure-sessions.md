---
epic: 1
story: 14
title: Sign In and Out with Secure Sessions
status: done
baseline_commit: 3b6ebd7
completion_note: Ultimate context engine analysis completed - comprehensive developer guide created
---

# Story 1.14: Sign In and Out with Secure Sessions

Status: done

## Story

As an active verified user,
I want secure session-based authentication,
so that I can enter Moviqo and terminate access reliably.

## Acceptance Criteria

1. **Given** an active verified user and correct password **When** sign-in succeeds **Then** Django creates a same-origin `Secure`, `HttpOnly`, appropriately `SameSite` session cookie, rotates the session identifier, and returns the user's active Membership context. Unsafe requests without valid CSRF protection are rejected. Traceability: FR383, FR403, AD-7.
2. **Given** repeated incorrect credentials from an account/network risk context **When** the throttle threshold is reached **Then** further attempts receive generic bounded throttling behavior without revealing whether the email exists. Successful authentication does not expose password or session contents in audit or telemetry. Traceability: FR380, FR387, FR392, FR393.
3. **Given** a signed-in user **When** the user signs out, the session expires, or it is revoked **Then** the server invalidates the session and later protected requests using it fail authentication. The SPA clears session-derived state and returns to authentication without rendering protected response data. Traceability: FR384, FR386.
4. **Given** a user is deactivated in a committed administration transaction **When** any existing session next calls a protected endpoint **Then** the server denies it because both user and Membership activity are checked on every request. Enforcement requires no WebSocket or persistent real-time channel. Traceability: FR382, FR383, FR384, FR385.

## Tasks / Subtasks

- [x] Implement the server-owned sign-in command and session endpoints. (AC: 1, 2)
  - [x] Accept normalized email and password through a documented `/api/v1` endpoint; use Django's configured custom `MoviqoUser` authentication backend and `django.contrib.auth.login`, not a home-grown token, JWT, or password comparison.
  - [x] Permit sign-in only when the user is active, email-verified, and has exactly one active Membership whose Organization is active; pending, deactivated, ambiguous, or cross-Organization states must fail safely.
  - [x] Rotate the session identifier on successful authentication and return only safe session state: authenticated user display identity, preferred language, and active Membership/Organization/role identifiers needed by the SPA. Never return password, raw session key, verification token, or Process Data.
  - [x] Add a session endpoint for current authenticated context and a POST sign-out endpoint that calls Django logout/session invalidation and is CSRF-protected.
  - [x] Add explicit DRF `SessionAuthentication` and authenticated permission behavior for protected API views; do not rely on redirects or browser-only authorization.
- [x] Enforce secure browser-session and CSRF configuration. (AC: 1, 3)
  - [x] Configure the session cookie as same-origin, `HttpOnly`, `Secure` in secure environments, and an explicit safe `SameSite` value; configure session expiry/flush behavior without exposing session contents.
  - [x] Keep `CsrfViewMiddleware` active. Ensure login and logout are protected even though anonymous DRF requests otherwise do not require CSRF, and expose/read a CSRF token through the same-origin SPA flow without making the CSRF cookie `HttpOnly`.
  - [x] Preserve existing production fail-closed validation for allowed hosts, HTTPS proxy handling, `CSRF_TRUSTED_ORIGINS`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE`; do not weaken it for local convenience.
- [x] Add bounded, existence-neutral failed-login throttling and safe telemetry. (AC: 2)
  - [x] Track only the minimum risk keys needed for account/network throttling; use a bounded response and generic localized failure for unknown email, wrong password, unverified, and throttled cases.
  - [x] Do not log credentials, session IDs, cookies, tokens, exact email-existence outcomes, or timing-distinguishing details. Keep correlation IDs and safe outcome categories only.
  - [x] Use the repository's existing API Problem Details handler and stable application codes; leave broader error-family hardening for Story 1.15.
- [x] Enforce active identity on every protected request. (AC: 3, 4)
  - [x] Extend the existing protected permission/tenant-resolution seam so each request re-checks `MoviqoUser.is_active`, verified-email state, active Membership, pending/active registration state, and active Organization before applying tenant context.
  - [x] Ensure a deactivated user or Membership cannot continue through a stale session; return the same safe authentication/verification response without protected-resource existence leakage.
  - [x] Keep the one-Membership/one-Organization boundary and PostgreSQL tenant context/RLS behavior intact. No WebSocket, persistent channel, or client-side authorization shortcut is in scope.
- [x] Add the authenticated frontend slice and route behavior. (AC: 1, 3, 4)
  - [x] Add a bilingual sign-in page/feature reachable from the verification success next step and landing navigation; preserve Spanish-first fallback and Designer-authored content rules.
  - [x] Add session bootstrap/current-context handling and sign-out handling in the app/provider layer. Send same-origin credentials and CSRF headers for unsafe requests; do not persist session IDs or protected response data in localStorage.
  - [x] On 401/403 authentication expiry, revocation, or deactivation, clear query/session-derived state, stop rendering protected data, and route to sign-in with an accessible generic message. Do not infer success from a client flag.
  - [x] Follow `AGENTS.md`: all new frontend implementation and test/build functions are arrow-function constants; use existing feature-sliced public entry points.
- [x] Update generated API artifacts and verification evidence. (AC: 1–4)
  - [x] Document all auth/session endpoints in drf-spectacular, regenerate `Moviqo.Front/src/shared/api/generated/schema.d.ts`, and keep generated-client checks green.
  - [x] Add focused backend unit/contract/integration tests and frontend unit/E2E accessibility tests before implementation is considered complete.

## Dev Notes

### Scope and cross-story boundaries

- Story 1.13 is complete and owns registration verification/activation. Reuse its active `MoviqoUser`, `Organization`, `Membership`, and verification state; do not add another identity, activation, or token store. Its successful response already returns `nextStep: "sign_in"`.
- Story 1.15 will broaden safe Problem Details behavior. This story must use the current problem-details contract and stable generic auth codes, without inventing an incompatible response format.
- Story 1.11 owns the password policy. Use Django's password hashing/checking and configured validator; do not duplicate or relax the policy.
- Story 1.9 owns the single-Organization identity boundary. A user with zero or multiple memberships must not receive an active tenant context.
- Scope excludes MFA, SSO, passkeys, social/passwordless login, public/anonymous initiation, refresh tokens, JWTs, WebSockets, and a configurable notification center.

### Existing implementation seams to preserve

- `Moviqo.Back/src/moviqo/settings/base.py`: already installs `django.contrib.sessions`, `SessionMiddleware`, `CsrfViewMiddleware`, and `AuthenticationMiddleware`; it currently lacks the explicit DRF default authentication configuration needed by protected API views.
- `Moviqo.Back/src/moviqo/settings/production.py` and `settings/security.py`: already enforce production HTTPS, trusted origins, secure session/CSRF cookies, and fail-closed host validation. Extend settings without weakening these checks.
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`: `MoviqoUser` is the custom `AUTH_USER_MODEL`; `Membership` has active/registration state and a unique user constraint. Email normalization is owned by `MoviqoUser.save()`/`MoviqoUserManager`.
- `Moviqo.Back/src/moviqo/modules/organizations/application/tenant_access.py`: `resolve_tenant_context()` currently queries the one active Membership. Add the user/Organization activity and verified-email guard at this seam rather than bypassing it in each endpoint.
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/runtime.py`: `require_authenticated_user()` currently checks Django authentication and `is_active`; keep tenant bootstrap, `SET LOCAL`, runtime-role, and RLS behavior unchanged while adding the identity-state checks at the appropriate application boundary.
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py`: existing `AuthenticatedRequestPermission` only checks `is_authenticated`; protected membership detail uses `tenant_bootstrap_context`, `resolve_tenant_context`, and `apply_tenant_context`. Update this path and add auth views with explicit schemas.
- `Moviqo.Back/src/moviqo/urls.py`: current routes include registration, verification, and protected membership detail under `/api/v1`; add sign-in/current-session/sign-out routes following this naming and trailing-slash convention.
- `Moviqo.Front/src/shared/api/client.ts`: uses `openapi-fetch` and `/api/v1` normalization. Extend the existing client/fetch seam for same-origin credentials and CSRF; do not create a second API client.
- `Moviqo.Front/src/app/ui/App.tsx` and `src/app/providers`: current routing/provider composition is intentionally small. Add authentication routing/state through the existing spine rather than introducing a router or parallel global store without architectural need.
- `Moviqo.Front/src/shared/localization/messages.ts`: owns Spanish/English resources and Spanish fallback. Add all Moviqo-owned auth/session copy there.

### Architecture guardrails

- AD-7 is binding: Django authentication, verified email/password accounts, same-origin `Secure`/`HttpOnly`/`SameSite` session cookies, CSRF on unsafe requests, server-side Membership authorization, generated OpenAPI client, and safe RFC 9457 errors.
- AD-2 is binding: derive one immutable tenant context from the active Membership; missing/mismatched context is denied by default. Every protected request must re-check current user and Membership activity because an existing session can outlive deactivation.
- AD-3 applies to state changes: sign-out/session revocation and any audit/idempotency evidence must be atomic where applicable. Do not chain independent API calls to establish auth state.
- AD-9 applies to the SPA: one static artifact, backend-authoritative state, no server secrets in the bundle, and no authenticated/API response caching.
- AD-12 applies to diagnostics: structured correlation IDs and redacted safe outcomes only; never emit passwords, session IDs, cookies, tokens, Process Data, or protected response payloads.
- AD-16 requires pragmatic red-green-refactor evidence using focused tests, real PostgreSQL integration where transaction/session behavior matters, contract tests, architecture checks, and Playwright accessibility journeys.

### Required behavior details

- Login failures for unknown email, wrong password, unverified account, inactive user/Membership, and throttled attempts must be generic and existence-neutral. Avoid response fields that distinguish which condition occurred.
- Password verification should still perform a bounded comparable operation for unknown identities where practical; do not return early with an email-existence signal.
- Login and logout are unsafe state-changing operations and must be covered by CSRF validation, including anonymous login. `SessionAuthentication` alone does not protect anonymous login requests.
- Session expiration/revocation is server-authoritative. A stale frontend state, cached current-user response, or manually supplied client role cannot preserve access.
- The current authenticated-context response may contain only the minimum safe identity/tenant metadata required for navigation. It must not contain password hashes, session values, verification tokens, consent details, or Process Data.
- Do not add a persistent client token. Browser session cookies are sent same-origin with `credentials: "same-origin"`; CSRF is supplied via the repository's same-origin cookie/header pattern.

### Testing requirements

- Backend unit tests: valid active verified login, wrong password, unknown email, pending/unverified user, inactive user, inactive Membership/Organization, malformed payload, generic error mapping, session rotation, logout invalidation, and throttle threshold/bounded response.
- Backend contract tests: documented login/current-session/logout endpoints, response schemas, cookie flags, CSRF rejection for missing/invalid token on unsafe requests, and no sensitive fields or existence signals in responses/log fixtures.
- PostgreSQL integration tests: login establishes a usable Django session; logout and expiry reject later protected calls; a committed user/Membership deactivation rejects an already-created session; tenant context and RLS remain enforced.
- Frontend unit tests: credential/CSRF request behavior, safe session-context reducer, sign-out clearing, expiry handling, localized generic failures, and no session persistence in localStorage.
- Playwright journey: active verified user signs in, reaches the authenticated shell, signs out, cannot revisit protected data with the prior browser session, and sees accessible Spanish/English validation and focus treatment. Include a deactivation/revocation response path if the test harness can seed it.
- Run the repository's approved backend and frontend checks; do not replace behavior evidence with a coverage percentage. Regenerate the OpenAPI client before frontend type-check/build.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.14]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-2, AD-7, AD-9, AD-12, AD-16]
- [Source: `_bmad-output/specs/spec-Moviqo/SPEC.md`, Constraints and Non-goals]
- [Source: `_bmad-output/specs/spec-Moviqo/requirements-map.md`, CAP-1, CAP-2, CAP-12, CAP-13]
- [Source: `_bmad-output/implementation-artifacts/1-13-verify-email-and-activate-the-organization.md`, Existing implementation seams and next-step contract]
- [Source: `AGENTS.md`, Frontend arrow-function convention]
- [Django REST framework SessionAuthentication and CSRF](https://www.django-rest-framework.org/api-guide/authentication/)
- [Django REST framework AJAX and CSRF guidance](https://www.django-rest-framework.org/topics/ajax-csrf-cors/)

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

- Story branch: `story/1-14-sign-in-and-out-with-secure-sessions`

### Completion Notes List

- Story context analysis completed for Epic 1, Story 1.14.
- Existing Story 1.13 activation and repository auth/session seams were inspected and incorporated.
- No `project-context.md` file was present in the repository.
- Implemented Django email authentication, CSRF-protected session commands, bounded generic login failures, active tenant checks, bilingual sign-in UI, and generated API contracts.
- Validation: backend `ruff` and `pytest` (118 passed, 16 skipped); frontend typecheck, unit tests, and architecture tests passed.

### Review Findings

- [x] [Review][Patch] Sign-in submits without first loading a CSRF cookie [Moviqo.Front/src/pages/sign-in/ui/SignInPage.tsx:10] — fixed by loading CSRF before the sign-in request.
- [x] [Review][Patch] Session bootstrap and protected-route enforcement are not wired into the app [Moviqo.Front/src/app/ui/App.tsx:9] — fixed with the session provider and expiry redirect handling.
- [x] [Review][Patch] Sign-out is implemented only as an unused API helper [Moviqo.Front/src/features/authentication/model/session.ts:23] — fixed with the authenticated landing control and provider action.
- [x] [Review][Patch] Authentication expiry and deactivation responses are not handled globally [Moviqo.Front/src/shared/api/client.ts:17] — fixed by dispatching the session-expired event on 401/403 responses.
- [x] [Review][Patch] Landing navigation does not expose the sign-in route [Moviqo.Front/src/pages/home/ui/HomePage.tsx:10] — fixed by adding the sign-in action.
- [x] [Review][Patch] Session cookie SameSite policy is not explicitly configured [Moviqo.Back/src/moviqo/settings/base.py:86] — fixed with explicit HttpOnly and Lax SameSite settings.
- [x] [Review][Patch] Login throttling is vulnerable to concurrent-attempt lost updates [Moviqo.Back/src/moviqo/modules/organizations/authentication.py:36] — fixed with atomic cache add/increment operations.

### File List

- `_bmad-output/implementation-artifacts/1-14-sign-in-and-out-with-secure-sessions.md`
- `Moviqo.Back/src/moviqo/modules/organizations/authentication.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/session.py`
- `Moviqo.Back/tests/contract/test_session_contract.py`
- `Moviqo.Front/src/features/authentication/`
- `Moviqo.Front/src/pages/sign-in/`
- `Moviqo.Front/src/app/ui/App.tsx`
- `Moviqo.Front/src/shared/api/client.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/features/verification/ui/VerificationStatusPanel.tsx`
- `docs/api/openapi-v1.json`
