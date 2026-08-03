import type {
  AccessDecision,
  CalculationResult,
  CompletionAttempt,
  RouteDecision
} from "./serverDecisionTypes";

export const deniedAccessFixture: AccessDecision = {
  allowed: false,
  safeMessage: "You do not have access to this work item."
};

export const rejectedRouteFixture: RouteDecision = {
  status: "rejected",
  safeMessage: "The server could not choose the next step."
};

export const rejectedCalculationFixture: CalculationResult = {
  status: "rejected",
  safeMessage: "The server could not calculate this value."
};

export const rejectedCompletionFixture: CompletionAttempt = {
  status: "rejected",
  safeMessage: "The task was not completed. Try again after refreshing the work item."
};
