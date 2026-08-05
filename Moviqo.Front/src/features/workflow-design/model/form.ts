import {
  createApiClient,
  readApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type {
  WorkflowCreationAccepted,
  WorkflowCreationFormState
} from "./types";

type WorkflowCreationAction =
  | { type: "name-changed"; name: string }
  | { type: "submit-requested" }
  | { type: "server-accepted" }
  | { type: "server-rejected"; errorCode: string };

const workflowDesignClient = createApiClient({ baseUrl: "/api/v1" });

export const initialWorkflowCreationFormState: WorkflowCreationFormState = {
  name: "",
  status: "editing",
  errorCode: null
};

export const reduceWorkflowCreationForm = (
  state: WorkflowCreationFormState,
  action: WorkflowCreationAction
): WorkflowCreationFormState => {
  if (action.type === "name-changed") {
    return {
      name: action.name,
      status: "editing",
      errorCode: null
    };
  }

  if (action.type === "submit-requested") {
    return {
      ...state,
      status: "submitting",
      errorCode: null
    };
  }

  if (action.type === "server-accepted") {
    return {
      ...state,
      status: "success",
      errorCode: null
    };
  }

  return {
    ...state,
    status: "error",
    errorCode: action.errorCode
  };
};

export const createWorkflow = async (
  name: string,
  idempotencyKey: string
): Promise<
  | { ok: true; data: WorkflowCreationAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  const response = await (
    workflowDesignClient as {
      POST(
        path: string,
        init?: object
      ): Promise<{ data?: unknown; response: Response }>;
    }
  ).POST("/api/v1/workflow-design/workflows/", {
    body: { name },
    headers: { "Idempotency-Key": idempotencyKey }
  });

  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as WorkflowCreationAccepted
  };
};
