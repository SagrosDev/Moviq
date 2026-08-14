import {
  createApiClient,
  normalizeApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type { components } from "../../../shared/api/generated/schema";

export type MyWorkStartWorkflow = components["schemas"]["StartWorkflowSummary"];
export type StartWorkflowAccepted = components["schemas"]["StartProcessAccepted"];
export type MyWorkTask = components["schemas"]["MyTaskSummary"];
export type MyWorkProcess = components["schemas"]["MyProcessSummary"];
export type ProcessDetailDocument = components["schemas"]["ProcessDetail"];
export type MyWorkCollection<TItem> = {
  items: TItem[];
  limit: number;
  hasMore: boolean;
  page: number;
  totalItems: number;
  totalPages: number;
};

export type MyProcessesQuery = {
  myTasksPage: number;
  taskSearch: string;
  page: number;
  search: string;
  startWorkflowsPage: number;
};

export type MyWorkDashboard = components["schemas"]["MyWorkDashboard"];

export type MyWorkRegion = "myTasks" | "startWorkflows" | "myProcesses";
export type MyWorkDashboardResult =
  | { ok: true; data: MyWorkDashboard }
  | { ok: false; error: NormalizedApiProblem };
export type StartWorkflowResult =
  | { ok: true; data: StartWorkflowAccepted }
  | { ok: false; error: NormalizedApiProblem };
export type ProcessDetailResult =
  | { ok: true; data: ProcessDetailDocument }
  | { ok: false; error: NormalizedApiProblem };

export const defaultMyProcessesQuery: MyProcessesQuery = {
  myTasksPage: 1,
  taskSearch: "",
  page: 1,
  search: "",
  startWorkflowsPage: 1
};

const myWorkClient = createApiClient({ baseUrl: "/api/v1" });

const normalizeClientProblem = (error: unknown, response: Response) => normalizeApiProblem(
  error,
  response.status,
  response.headers.get("X-Correlation-ID") ?? ""
);

export const buildMyWorkDashboardQuery = (query: MyProcessesQuery) => ({
  myProcessesPage: query.page > 1 ? query.page : undefined,
  myProcessesSearch: query.search.trim() || undefined,
  myTasksPage: query.myTasksPage > 1 ? query.myTasksPage : undefined,
  myTasksSearch: query.taskSearch.trim() || undefined,
  startWorkflowsPage: query.startWorkflowsPage > 1
    ? query.startWorkflowsPage
    : undefined
});

export const formatDateTimeInTimeZone = (
  value: string | null,
  timeZone: string
) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(date);
};

export const readMyWorkDashboard = async (
  query: MyProcessesQuery = defaultMyProcessesQuery
): Promise<MyWorkDashboardResult> => {
  try {
    const response = await myWorkClient.GET("/api/v1/my-work/", {
      params: { query: buildMyWorkDashboardQuery(query) }
    });
    if (!response.response.ok || !response.data) {
      return {
        ok: false,
        error: normalizeClientProblem(response.error, response.response)
      };
    }

    return {
      ok: true,
      data: response.data
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const readProcessDetailDocument = async (
  processId: string
): Promise<ProcessDetailResult> => {
  try {
    const response = await myWorkClient.GET("/api/v1/my-work/processes/{process_id}/", {
      params: { path: { process_id: processId } }
    });
    if (!response.response.ok || !response.data) {
      return {
        ok: false,
        error: normalizeClientProblem(response.error, response.response)
      };
    }

    return {
      ok: true,
      data: response.data
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const startWorkflow = async (
  workflowId: string,
  idempotencyKey: string
): Promise<StartWorkflowResult> => {
  try {
    const response = await myWorkClient.POST("/api/v1/my-work/start-workflows/{workflow_id}/start/", {
      params: {
        header: {
          "Idempotency-Key": idempotencyKey
        },
        path: {
          workflow_id: workflowId
        }
      }
    });
    if (!response.response.ok || !response.data) {
      return {
        ok: false,
        error: normalizeClientProblem(response.error, response.response)
      };
    }

    return {
      ok: true,
      data: response.data
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const createWorkflowStartIdempotencyKey = (workflowId: string) =>
  `workflow-start-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
