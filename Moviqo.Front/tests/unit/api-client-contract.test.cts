import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createApiClient,
  normalizeApiProblem,
  type ApiProblemDetails
} from "../../src/shared/api";
import { fieldErrorMapFromProblem } from "../../src/features/registration/model/registrationForm";

test("API problem details type preserves stable error fields", () => {
  const problem: ApiProblemDetails = {
    type: "https://api.moviqo.local/problems/validation-failed",
    title: "Validation failed",
    status: 400,
    code: "validation_failed",
    correlationId: "safe-correlation-123",
    invalidParams: [{ name: "fail", reason: "Unsupported diagnostic value." }]
  };

  assert.equal(problem.code, "validation_failed");
  assert.equal(problem.invalidParams?.[0]?.name, "fail");
});

test("API client seam is created from generated OpenAPI paths", () => {
  const client = createApiClient({ baseUrl: "/api/v1" });

  assert.equal(typeof client.GET, "function");
});

test("API client does not double-prefix versioned generated paths", async () => {
  const requestedUrls: string[] = [];
  const client = createApiClient({
    baseUrl: "https://moviqo.test/api/v1",
    fetch: async (request) => {
      requestedUrls.push(request.url);
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }
  });

  await client.GET("/api/v1/system/ping/");

  assert.equal(requestedUrls[0], "https://moviqo.test/api/v1/system/ping/");
});

test("API problem normalization keeps safe fields and supplies generic fallbacks", () => {
  const problem = normalizeApiProblem({
    code: "validation_failed",
    status: 400,
    invalidParams: [
      { name: "email", reason: "Enter a valid email address.", code: "invalid_email" },
      { name: "password/secret", reason: "should not be a field" }
    ]
  });

  assert.equal(problem.code, "validation_failed");
  assert.deepEqual(problem.invalidParams, [
    { name: "email", reason: "Enter a valid email address.", code: "invalid_email" },
    { name: "nonFieldErrors", reason: "should not be a field" }
  ]);
  assert.equal(normalizeApiProblem(undefined).code, "api_error");
});

test("API problem normalization bounds untrusted values and prefers a valid header correlation", () => {
  const problem = normalizeApiProblem(
    {
      type: "https://evil.example/problem",
      title: "x".repeat(500),
      status: 999,
      code: "secret/code",
      correlationId: "",
      detail: "line 1\nline 2",
      invalidParams: [{ name: "email", reason: "x".repeat(500), code: "bad/code" }]
    },
    400,
    "safe-correlation-123"
  );

  assert.equal(problem.status, 400);
  assert.equal(problem.type, "https://api.moviqo.local/problems/api-error");
  assert.equal(problem.code, "api_error");
  assert.equal(problem.correlationId, "safe-correlation-123");
  assert.deepEqual(problem.invalidParams, [{ name: "email", reason: "Invalid value." }]);
  assert.equal(problem.detail, undefined);
});

test("registration error mapping localizes known codes and hides unknown server reasons", () => {
  const translate = (key: string) => ({
    "validation.email": "Localized email",
    "validation.generic": "Localized generic",
    "validation.required": "Localized required"
  }[key] ?? key);

  assert.deepEqual(
    fieldErrorMapFromProblem({
      type: "https://api.moviqo.local/problems/validation-failed",
      title: "Validation failed",
      status: 400,
      code: "validation_failed",
      correlationId: "safe-correlation-123",
      invalidParams: [
        { name: "email", reason: "unsafe server text", code: "invalid_email" },
        { name: "ownerName", reason: "unsafe server text", code: "unknown_code" }
      ]
    }, translate),
    { email: ["Localized email"], ownerName: ["Localized generic"] }
  );
});
