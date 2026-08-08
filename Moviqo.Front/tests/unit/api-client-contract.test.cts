import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createApiClient,
  normalizeApiProblem,
  type ApiProblemDetails
} from "../../src/shared/api";
import { normalizeAppPath } from "../../src/app/ui/App";
import type { components, operations } from "../../src/shared/api/generated/schema";
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

test("workflow creation contract requires a name body field and idempotency header", () => {
  const request: components["schemas"]["WorkflowCreateRequest"] = { name: "Workflow intake" };
  const header: operations["workflow_design_workflow_create"]["parameters"]["header"] = {
    "Idempotency-Key": "workflow-create-1"
  };

  assert.equal(request.name, "Workflow intake");
  assert.equal(header["Idempotency-Key"], "workflow-create-1");
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

test("API client bootstraps CSRF from the token endpoint before unsafe requests", async () => {
  const requests: Request[] = [];
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "" },
    configurable: true
  });

  try {
    const client = createApiClient({
      baseUrl: "https://moviqo.test/api/v1",
      fetch: async (request) => {
        requests.push(request);
        const path = new URL(request.url).pathname;
        if (path === "/api/v1/auth/csrf/") {
          return new Response(JSON.stringify({ csrfToken: "session-token-123" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          });
        }

        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
          status: 200
        });
      }
    });

    await (client as {
      POST(path: string, init?: object): Promise<{ response: Response }>;
    }).POST("/api/v1/auth/sign-out/");

    assert.equal(requests[0]?.url, "https://moviqo.test/api/v1/auth/csrf/");
    assert.equal(requests[1]?.headers.get("X-CSRFToken"), "session-token-123");
  } finally {
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true
    });
  }
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

test("app route normalization accepts a trailing slash for workflow creation", () => {
  assert.equal(normalizeAppPath("/my-work/workflows/new/"), "/my-work/workflows/new");
  assert.equal(normalizeAppPath("/"), "/");
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
