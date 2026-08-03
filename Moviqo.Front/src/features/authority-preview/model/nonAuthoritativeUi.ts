import type {
  AccessDecision,
  CalculationResult,
  CompletionAttempt,
  RouteDecision
} from "../../../entities/server-decisions";

export const formatAccessDecision = (decision: AccessDecision): string => {
  if (decision.allowed) {
    return decision.resourceLabel;
  }

  return decision.safeMessage;
};

export const formatRouteDecision = (decision: RouteDecision): string => {
  if (decision.status === "accepted") {
    return `Next step: ${decision.nextTaskLabel}`;
  }

  return decision.safeMessage;
};

export const formatCalculationResult = (result: CalculationResult): string => {
  if (result.status === "calculated") {
    return result.displayValue;
  }

  return result.safeMessage;
};

export const formatCompletionAttempt = (attempt: CompletionAttempt): string => {
  if (attempt.status === "completed") {
    return "Task completed by server.";
  }

  return attempt.safeMessage;
};
