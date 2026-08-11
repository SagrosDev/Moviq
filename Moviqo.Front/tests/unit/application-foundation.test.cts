import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearServerState,
  createMoviqoQueryClient,
  moviqoQueryKeys,
  shouldRetryServerQuery
} from "../../src/shared/api";

test("server query keys include organization and resource identity", () => {
  assert.deepEqual(moviqoQueryKeys.workflowCatalog("organization-1"), [
    "organization",
    "organization-1",
    "workflows",
    "catalog"
  ]);
  assert.deepEqual(moviqoQueryKeys.workflowDraft("organization-1", "workflow-1"), [
    "organization",
    "organization-1",
    "workflows",
    "workflow-1",
    "draft"
  ]);
});

test("authorization and validation failures are never retried automatically", () => {
  for (const status of [400, 401, 403, 404, 409, 422]) {
    assert.equal(shouldRetryServerQuery(0, { status }), false);
  }

  assert.equal(shouldRetryServerQuery(0, { status: 503 }), true);
  assert.equal(shouldRetryServerQuery(2, { status: 503 }), false);
});

test("session boundaries clear all server-owned query state", () => {
  const client = createMoviqoQueryClient();
  const key = moviqoQueryKeys.workflowCatalog("organization-1");

  client.setQueryData(key, { items: [{ workflowId: "workflow-1" }] });
  assert.ok(client.getQueryData(key));

  clearServerState(client);

  assert.equal(client.getQueryData(key), undefined);
});
