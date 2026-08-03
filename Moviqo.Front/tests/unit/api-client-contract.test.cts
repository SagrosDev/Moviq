import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiClient, type ApiProblemDetails } from "../../src/shared/api";

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
