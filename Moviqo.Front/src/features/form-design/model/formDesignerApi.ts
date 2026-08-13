import {
  createApiClient,
  normalizeApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type { components } from "../../../shared/api/generated/schema";
import type { WorkflowCreationAccepted } from "../../workflow-design";
import type { FormDesignerSaveCommand } from "./formDesigner";

export type FormAuthoringLease = components["schemas"]["FormAuthoringLeaseResponse"];

export type FormAuthoringLeaseAction = "acquire" | "heartbeat" | "takeover" | "release";

type ApiResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: NormalizedApiProblem };

const formDesignerClient = createApiClient({ baseUrl: "/api/v1" });

export const updateFormAuthoringLease = async (
  workflowId: string,
  taskElementId: string,
  action: FormAuthoringLeaseAction,
  leaseToken?: string | null
): Promise<ApiResult<FormAuthoringLease>> => {
  try {
    const response = await formDesignerClient.POST(
      "/api/v1/workflow-design/workflows/{workflow_id}/tasks/{task_element_id}/form-authoring-lease/",
      {
        params: { path: { workflow_id: workflowId, task_element_id: taskElementId } },
        body: {
          action,
          ...(leaseToken ? { leaseToken } : {})
        }
      }
    );
    if (!response.response.ok || !response.data) {
      return {
        ok: false,
        error: normalizeApiProblem(response.error, response.response.status)
      };
    }
    return { ok: true, data: response.data as FormAuthoringLease };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const saveFormDesignerDraft = async (
  command: FormDesignerSaveCommand,
  taskElementId: string,
  leaseToken: string
): Promise<ApiResult<WorkflowCreationAccepted>> => {
  try {
    const response = await formDesignerClient.PUT(
      "/api/v1/workflow-design/workflows/{workflow_id}/tasks/{task_element_id}/form-draft/",
      {
        params: {
          path: {
            workflow_id: command.draft.workflowId,
            task_element_id: taskElementId
          },
          header: { "Idempotency-Key": command.requestKey }
        },
        body: {
          expectedRevision: command.expectedRevision,
          draft: command.draft,
          leaseToken
        }
      }
    );
    if (!response.response.ok || !response.data) {
      return {
        ok: false,
        error: normalizeApiProblem(response.error, response.response.status)
      };
    }
    return { ok: true, data: response.data as WorkflowCreationAccepted };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};
