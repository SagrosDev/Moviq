import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAccessDecision,
  formatCalculationResult,
  formatCompletionAttempt,
  formatRouteDecision
} from "../../src/features/authority-preview/model/nonAuthoritativeUi";
import {
  deniedAccessFixture,
  rejectedCalculationFixture,
  rejectedCompletionFixture,
  rejectedRouteFixture
} from "../../src/entities/server-decisions";

test("access denial renders the safe server response", () => {
  assert.equal(
    formatAccessDecision(deniedAccessFixture),
    "You do not have access to this work item."
  );
});

test("route selection remains a rendered server result", () => {
  assert.equal(
    formatRouteDecision(rejectedRouteFixture),
    "The server could not choose the next step."
  );
});

test("calculation output remains a rendered server result", () => {
  assert.equal(
    formatCalculationResult(rejectedCalculationFixture),
    "The server could not calculate this value."
  );
});

test("task completion remains a rendered server result", () => {
  assert.equal(
    formatCompletionAttempt(rejectedCompletionFixture),
    "The task was not completed. Try again after refreshing the work item."
  );
});
