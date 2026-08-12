import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createApiClient,
  isSessionExpiryProblem,
  normalizeApiProblem,
  type ApiProblemDetails
} from "../../src/shared/api";
import {
  readCsrfToken,
  rememberCsrfToken
} from "../../src/shared/api/csrf";
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

test("API client keeps authorization denial distinct from session expiry", () => {
  assert.equal(isSessionExpiryProblem(401, "api_error"), true);
  assert.equal(isSessionExpiryProblem(403, "authentication_failed"), true);
  assert.equal(isSessionExpiryProblem(403, "not_authenticated"), true);
  assert.equal(isSessionExpiryProblem(403, "permission_denied"), false);
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

test("API client keeps a relative deployment prefix for CSRF bootstrap", async () => {
  const requestedUrls: string[] = [];
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "" },
    configurable: true
  });
  rememberCsrfToken("");

  try {
    const client = createApiClient({
      baseUrl: "https://moviqo.test/moviqo/api/v1",
      fetch: async (request) => {
        requestedUrls.push(request.url);
        if (request.url.endsWith("/auth/csrf/")) {
          return new Response(JSON.stringify({ csrfToken: "prefixed-token" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
    });

    await (client as {
      POST(path: string, init?: object): Promise<{ response: Response }>;
    }).POST("/api/v1/auth/sign-out/");

    assert.equal(requestedUrls[0], "https://moviqo.test/moviqo/api/v1/auth/csrf/");
  } finally {
    rememberCsrfToken("");
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true
    });
  }
});

test("CSRF reads a rotated cookie before the cached bootstrap token", () => {
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "csrftoken=rotated-session-token" },
    configurable: true
  });
  rememberCsrfToken("stale-bootstrap-token");

  try {
    assert.equal(readCsrfToken(), "rotated-session-token");
  } finally {
    rememberCsrfToken("");
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true
    });
  }
});

test("API client refreshes a session-backed CSRF token once after rotation", async () => {
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "" },
    configurable: true
  });
  rememberCsrfToken("stale-session-token");
  const unsafeTokens: Array<string | null> = [];

  try {
    const client = createApiClient({
      baseUrl: "https://moviqo.test/api/v1",
      fetch: async (request) => {
        if (request.url.endsWith("/auth/csrf/")) {
          return new Response(JSON.stringify({ csrfToken: "rotated-session-token" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          });
        }
        unsafeTokens.push(request.headers.get("X-CSRFToken"));
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
          status: unsafeTokens.length === 1 ? 403 : 200
        });
      }
    });

    const result = await (client as {
      POST(path: string, init?: object): Promise<{ response: Response }>;
    }).POST("/api/v1/auth/sign-out/");

    assert.equal(result.response.status, 200);
    assert.deepEqual(unsafeTokens, ["stale-session-token", "rotated-session-token"]);
  } finally {
    rememberCsrfToken("");
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
