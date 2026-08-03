export type AccessDecision =
  | {
      allowed: true;
      resourceLabel: string;
    }
  | {
      allowed: false;
      safeMessage: string;
    };

export type RouteDecision =
  | {
      status: "accepted";
      nextTaskLabel: string;
    }
  | {
      status: "rejected";
      safeMessage: string;
    };

export type CalculationResult =
  | {
      status: "calculated";
      displayValue: string;
    }
  | {
      status: "rejected";
      safeMessage: string;
    };

export type CompletionAttempt =
  | {
      status: "completed";
      completedAt: string;
    }
  | {
      status: "rejected";
      safeMessage: string;
    };
