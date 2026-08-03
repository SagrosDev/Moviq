import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDraftState,
  draftReducer,
  type DraftRevision
} from "../../src/shared/drafts/model/revisionDraftReducer";

const revisionOne = "rev-1" as DraftRevision;
const revisionTwo = "rev-2" as DraftRevision;

test("draft updates preserve explicit server revision tokens", () => {
  const state = createDraftState({ title: "Initial" }, revisionOne);

  const updated = draftReducer(state, {
    type: "server-accepted-update",
    value: { title: "Accepted" },
    expectedRevision: revisionOne,
    nextRevision: revisionTwo
  });

  assert.deepEqual(updated, {
    value: { title: "Accepted" },
    revision: revisionTwo,
    conflict: false
  });
});

test("draft updates reject stale revision tokens instead of overwriting state", () => {
  const state = createDraftState({ title: "Current" }, revisionTwo);

  const updated = draftReducer(state, {
    type: "server-accepted-update",
    value: { title: "Stale write" },
    expectedRevision: revisionOne,
    nextRevision: "rev-3" as DraftRevision
  });

  assert.deepEqual(updated, {
    value: { title: "Current" },
    revision: revisionTwo,
    conflict: true
  });
});
