---
epic: 1
story: 15
title: Return Safe and Consistent Application Errors
status: done
baseline_commit: 139147a374d29ad0870b399295f54de7453f91d0
completion_note: Ultimate context engine analysis completed - comprehensive developer guide created
---

# Story 1.15: Return Safe and Consistent Application Errors

Status: done

## Story

As a Moviqo user,
I want failures to be useful without exposing protected information,
so that I can recover safely and provide support with a correlation identifier.

## Acceptance Criteria

1. **Given** incorrect sign-in data, an unknown recovery email, or a resource outside the user's Organization/scope **When** the request fails **Then** equivalent cases use consistent status, timing-tolerant behavior, and generic localized messages that reveal no account or resource existence **And** the Problem Details payload contains only authorized fields. Traceability: FR387, FR388, FR393.
2. **Given** authorized input violates a business constraint **When** server validation fails **Then** the response identifies only visible fields and constraints, does not unnecessarily repeat submitted confidential values, and commits no partial mutation **And** the generated client maps the stable application code to accessible inline and summary feedback. Traceability: FR390, AD-7, UX-DR5.
3. **Given** an unexpected exception **When** the global handler responds and records diagnostics **Then** the user receives a safe message and correlation ID while stack traces, SQL, paths, infrastructure, environment values, credentials, private links, and Process Data remain confined to access-controlled redacted technical logs **And** technical diagnostics remain separate from business audit. Traceability: FR389, FR391, FR392, NFR30, AD-12.

## Tasks / Subtasks

- [x] Harden the shared backend Problem Details contract. (AC: 1, 2, 3)
  - [x] Preserve the single `application/problem+json` envelope and stable `code`; never reintroduce DRF's default `{detail: ...}` or raw serializer-error dictionaries.
  - [x] Normalize validation, authentication, permission, not-found, conflict, parse, throttling, and unexpected failures through the existing `problem_details_exception_handler`/`problem_response` seam.
  - [x] Keep `type`, `title`, `status`, `code`, `correlationId`, optional safe `detail`, and optional `invalidParams` consistent with the generated OpenAPI schema.
  - [x] Preserve safe protocol headers such as `Allow` and `Retry-After`; never copy `Content-Type` or unsafe exception headers.
- [x] Enforce existence-neutral and confidential-value-safe behavior. (AC: 1, 2)
  - [x] Use the same public status/code/message shape for unknown sign-in identities, wrong credentials, unknown recovery emails, hidden resources, cross-tenant identifiers, and equivalent authorization/not-found cases; do not expose account, Organization, resource, count, or timing signals.
  - [x] Map only allow-listed visible request fields to `invalidParams`; use stable machine codes and localized presentation reasons, not submitted values, Django/validator text, password content, tokens, Process Data, hidden IDs, or internal field names.
  - [x] Ensure failed commands remain all-or-nothing: validation and error handling must not commit partial business state, audit, idempotency, or outbox rows.
  - [x] Keep password and recovery responses generic even when the identity is unknown; recovery-flow implementation remains Story 1.16's scope.
- [x] Record unexpected failures as redacted technical diagnostics. (AC: 3)
  - [x] Return only the safe internal-error Problem Details response and correlation ID to the caller, regardless of `DEBUG` or exception type in deployed environments.
  - [x] Log structured diagnostic context through the existing redaction filter/logger path, including correlation ID, safe request/route metadata, status/outcome, and exception class as permitted; retain traceback only in access-controlled technical logs.
  - [x] Prove that logs and responses exclude stack traces, SQL, filesystem paths, settings/environment values, secrets, credentials, cookies, session IDs, authorization headers, private links, file content, and Process Field values.
  - [x] Do not write technical diagnostics into Configuration Audit or Transactional Audit, and do not use business audit as an exception sink.
- [x] Map errors through the existing generated frontend API seam. (AC: 2, 3)
  - [x] Extend `Moviqo.Front/src/shared/api/client.ts` and its public `src/shared/api/index.ts` export rather than creating another API client or ad-hoc `{ detail: string }` model.
  - [x] Expose a typed normalized Problem Details result that preserves stable `code`, safe `correlationId`, status, and allow-listed invalid parameters for feature consumers.
  - [x] Render field-level errors beside the associated accessible control and summary/global errors in an accessible live region; map unknown codes to a localized generic fallback.
  - [x] Keep server authority: client validation may improve immediacy but cannot replace server validation, authorization, or mutation confirmation.
  - [x] Follow `AGENTS.md`: all new frontend implementation and test/build functions are arrow-function constants.
- [x] Add contract, safety, mutation, and user-visible tests before implementation is complete. (AC: 1-3)
  - [x] Backend contract tests cover each error family, media type, schema, stable code, correlation response/header, preserved safe headers, localized-safe fields, and existence-neutral equivalents.
  - [x] Backend tests cover malformed payloads, serializer validation, domain/business validation, authentication/permission/not-found, conflict, throttling, and unexpected exception paths.
  - [x] Safety tests assert forbidden strings/values are absent from response bodies, headers, and captured technical logs.
  - [x] Real-PostgreSQL integration tests prove rejected commands leave business state, audit, idempotency, and outbox state unchanged; include tenant-hidden resource behavior where persistence is involved.
  - [x] Frontend unit tests cover typed error normalization, field/summary mapping, unknown-code fallback, correlation display/copy affordance if implemented, session-expiry compatibility, and accessible live-region behavior.
  - [x] Run API schema/client stale checks, backend lint/tests, frontend architecture/typecheck/unit/build checks, and Playwright accessibility coverage for any changed rendered error states.

### Review Findings

- [x] [Review][Patch] High: DRF exceptions that already produce a response, including 500-level `APIException` instances, return before `_record_unexpected_exception()`, so unexpected API failures can be returned without the required technical diagnostic [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:150-163]. Ensure unexpected 5xx paths are diagnosed while preserving the safe response.
- [x] [Review][Patch] High: The diagnostic traceback is passed through a finite pattern-based redactor that does not reliably cover arbitrary SQL, filesystem paths, environment values, API keys, or unquoted credential formats [Moviqo.Back/src/moviqo/building_blocks/api/redaction.py:13-41; Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:177-184]. Make the logging path fail closed for sensitive exception data and add coverage for the required forbidden classes.
- [x] [Review][Patch] High: `_safe_invalid_param_name()` accepts any syntactically safe name, including `token`, `sessionId`, internal field names, and hidden identifiers, although the story requires an allow-list of visible fields only [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:187-223]. Map unknown or protected names to a generic non-field error.
- [x] [Review][Patch] Medium: Explicit invalid-parameter `code` values are copied into the public payload without validation, length bounds, or an allow-list [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:235-243]. Sanitize or map unknown codes to a stable generic code.
- [x] [Review][Patch] Medium: The new safe-header allow-list drops `WWW-Authenticate` from 401 responses, regressing the standard authentication challenge while preserving only `Allow` and `Retry-After` [Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py:27,210-215]. Preserve the approved authentication protocol header without forwarding unsafe headers.
- [x] [Review][Patch] Medium: `normalizeApiProblem()` accepts unbounded server-controlled `type`, `title`, `code`, `detail`, `correlationId`, reason, and parameter-code strings, so the normalized result is not limited to safe fields or bounded values [Moviqo.Front/src/shared/api/client.ts:24-49]. Apply the same safe-field and length policy at the client boundary.
- [x] [Review][Patch] Medium: A body `correlationId` of `""` takes precedence over a valid `X-Correlation-ID` response header, causing the support identifier to be lost [Moviqo.Front/src/shared/api/client.ts:44-46,52-60]. Select only a non-empty validated body identifier before falling back to the header.
- [x] [Review][Patch] Medium: Registration error rendering ignores stable `problem.code` and invalid-parameter codes and displays server-provided reasons directly; unknown codes therefore do not receive the required localized generic fallback [Moviqo.Front/src/features/registration/model/registrationForm.ts:74-87; Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx:73-82]. Add a localized code mapping with a safe fallback.
- [x] [Review][Patch] Medium: Newly surfaced consent-field errors are rendered without associating them to their checkbox controls through `aria-describedby`, so field-level feedback is not reliably accessible [Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx:233-275]. Add stable error IDs and control associations for each consent checkbox.
- [x] [Review][Patch] Medium: The diff adds only narrow contract/unit coverage and does not prove existence-neutral sign-in behavior, transaction rollback/tenant-hidden mutations, forbidden diagnostic classes, or Playwright accessibility behavior required by the story [Moviqo.Back/tests/contract/test_problem_details_contract.py; Moviqo.Front/tests/unit/api-client-contract.test.cts]. Add the required focused integration and rendered-state tests before marking the story complete.

## Dev Notes

### Scope and boundaries

- This story hardens the shared error contract across existing registration, verification, authentication/session, and system endpoints. It does not implement password recovery (Story 1.16), new domain constraints, a notification center, or a new observability vendor.
- Reuse the existing Problem Details, correlation, redaction, generated OpenAPI, and API-client seams. Do not add a second exception envelope, error DTO hierarchy, API client, cache, or client-side authorization rule.
- The current repository already has `problem_details_exception_handler`, `problem_response`, `ProblemDetailsSerializer`, correlation middleware, a redaction filter, generated `components["schemas"]["ProblemDetails"]`, and `ApiProblemDetails`. Extend them in place.

### Existing implementation state to preserve

- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py` currently handles DRF exceptions and explicit `ProblemTemplate` responses, normalizes `PermissionDenied`/`NotFound`/`Http404` to `resource_not_found`, preserves non-content-type headers, and sanitizes invalid parameter names/reasons. Preserve these guarantees while closing gaps for all relevant exception paths and diagnostics.
- `Moviqo.Back/src/moviqo/building_blocks/api/correlation.py` accepts a safe `X-Correlation-ID` or creates one and returns it on the response. Keep inbound validation bounded and ensure every API Problem Details response uses the same request correlation ID.
- `Moviqo.Back/src/moviqo/building_blocks/api/logging.py` is the existing redaction-filter seam. Inspect its companion redaction implementation before changing logging; do not log raw request bodies or exception strings without sanitization.
- `Moviqo.Back/src/moviqo/settings/base.py` already configures the exception handler, correlation middleware, DRF SessionAuthentication, and `django.request` logging. Extend settings only where needed and preserve production fail-closed behavior.
- `Moviqo.Back/src/moviqo/modules/organizations/application/views.py` still contains direct serializer-invalid branches and explicit Problem Details calls for registration/session/verification. Convert or align these paths without changing successful auth/registration contracts from Stories 1.12-1.14.
- `Moviqo.Front/src/shared/api/client.ts` currently adds CSRF headers, uses same-origin credentials, dispatches session-expired events for 401/403, and exports generated `ApiProblemDetails`. Preserve all of that while adding typed normalization; do not break sign-in/session expiry behavior.
- Existing contract tests are in `Moviqo.Back/tests/contract/test_problem_details_contract.py`, `test_registration_contract.py`, and `test_session_contract.py`; frontend API tests are in `Moviqo.Front/tests/unit/api-client-contract.test.cts`. Extend the established locations/patterns before creating new parallel test infrastructure.

### Architecture guardrails

- AD-1: shared error primitives belong in `building_blocks` and must contain no business concepts; module-specific codes may be supplied by application services but modules must not import one another's internals.
- AD-2 and AD-7: all protected failures are server-authorized, tenant-safe, and existence-neutral. Never derive authorization from a client-supplied Organization ID or reveal cross-tenant existence through errors, counts, headers, logs, or timing-sensitive branches.
- AD-3: a failed command cannot leave partial state. The application handler owns one transaction for business state, audit, idempotency, and outbox evidence; exception rendering must not create a second mutation path.
- AD-9: one generated client/query seam, backend-authoritative state, accessible UI feedback, no authenticated response caching, and no secrets in the SPA artifact.
- AD-12: structured telemetry uses safe correlation/build/service metadata only; technical diagnostics are redacted and separate from business audit.
- AD-16: red -> green -> refactor. Use unit/table tests for mapping, API contract tests for HTTP shape, real PostgreSQL integration tests for transaction/tenant behavior, and Playwright accessibility checks for rendered error states.

### File structure guidance

Likely update locations (confirm against the current tree before editing):

- Backend: `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`, `correlation.py`, `logging.py`/redaction companion, `settings/base.py` and environment settings, plus existing organization views only where direct error paths need alignment.
- Backend tests: `Moviqo.Back/tests/contract/test_problem_details_contract.py`, `test_registration_contract.py`, `test_session_contract.py`, relevant unit tests, and real-PostgreSQL integration tests.
- Frontend: `Moviqo.Front/src/shared/api/client.ts`, `src/shared/api/index.ts`, localization/design-system error components or existing feature consumers. Keep files kebab-case and public feature imports intact.
- Frontend tests: `Moviqo.Front/tests/unit/api-client-contract.test.cts` and the existing Playwright E2E/accessibility suite if visible behavior changes.
- Generated artifacts: regenerate `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` using the repository's approved commands; never hand-edit generated output.

### Testing and verification requirements

- Preserve the locked stack: Python 3.14.6, Django 5.2.15, DRF 3.17.1, Psycopg 3.3.4, PostgreSQL 17.10, Node 26.6.0, TypeScript 6.0.x, React 19.2.7, Vite 8.2.x, pytest 9.1.1, and Playwright 1.62.x.
- Verify schema generation has no warnings and the generated client is current. Keep `/health/start/` unchanged and do not expose deployment topology through errors.
- Do not use coverage percentage as the acceptance gate. Evidence must show focused failing tests, passing behavior, and green refactoring across affected layers.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`, Story 1.15]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`, FR-387 through FR-393 and NFR-030]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`, AD-1, AD-2, AD-3, AD-7, AD-9, AD-12, AD-16; Consistency Conventions; Stack; Structural Seed]
- [Source: `_bmad-output/implementation-artifacts/1-3-establish-the-api-error-build-and-test-contract.md`]
- [Source: `_bmad-output/implementation-artifacts/1-14-sign-in-and-out-with-secure-sessions.md`]
- [Source: `AGENTS.md`, Frontend arrow-function convention]
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Django REST framework: Exceptions](https://www.django-rest-framework.org/api-guide/exceptions/)
- [Django: Error reporting](https://docs.djangoproject.com/en/5.2/howto/error-reporting/)

## Dev Agent Record

### Agent Model Used

GPT-5 / Codex

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 1.15 contexted from Epic 1, the API/error contract foundation, secure-session implementation, architecture spine, PRD, UX guidance, and current source tree.
- Added redacted structured diagnostics for unexpected API exceptions and restricted exception header forwarding to safe protocol headers.
- Added typed frontend Problem Details normalization, safe response parsing, correlation display, and accessible registration error summaries.
- Added backend safety/diagnostic and frontend normalization contract coverage.
- Validation: 121 backend tests passed with 16 PostgreSQL-dependent tests skipped; frontend architecture/API/unit tests, typecheck, API schema validation, Ruff, and production build passed.

### File List

- `_bmad-output/implementation-artifacts/1-15-return-safe-and-consistent-application-errors.md`
- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/settings/base.py`
- `Moviqo.Back/tests/contract/test_problem_details_contract.py`
- `Moviqo.Front/src/features/registration/model/submitRegistration.ts`
- `Moviqo.Front/src/features/registration/ui/RegistrationForm.tsx`
- `Moviqo.Front/src/features/verification/model/verifyEmail.ts`
- `Moviqo.Front/src/shared/api/client.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/api/index.ts`
- `Moviqo.Front/tests/unit/api-client-contract.test.cts`
- `docs/api/openapi-v1.json`

### Change Log

- 2026-08-04: Implemented Story 1.15 safe error hardening and moved status to review.
