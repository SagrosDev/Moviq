import {
  createApiClient,
  createQueryKey,
  normalizeApiProblem,
  queryRegistry,
  readApiProblem,
  type NormalizedApiProblem,
  type QuerySnapshot
} from "../../../shared/api";

export type MyWorkStartWorkflow = {
  workflowId: string;
  title: string;
  description: string;
  availability: string;
  versionNumber: number;
};

export type StartWorkflowAccepted = {
  processId: string;
  taskId: string;
  workflow: {
    workflowId: string;
    title: string;
    versionNumber: number;
  };
  destinationRoute: string;
};

export type MyWorkTask = {
  taskId: string;
  title: string;
  workflowName: string;
  status: string;
  processId: string;
  activatedAt: string;
  openTaskRoute: string;
};

export type MyWorkContributionSummary = {
  kind: string;
  label: string;
};

export type MyWorkProcess = {
  processId: string;
  processNumber: string;
  workflowName: string;
  workflowVersionNumber: number;
  involvement: string;
  currentStep: string;
  systemStatus: string;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
  viewRoute: string;
  contributionSummary: MyWorkContributionSummary;
};

export type ProcessDetailHeader = {
  processId: string;
  processNumber: string;
  workflowName: string;
  workflowVersionNumber: number;
  systemStatus: string;
  currentStep: string;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
  contributionSummary: MyWorkContributionSummary;
};

export type ProcessTimelineEvent = {
  eventKind: string;
  label: string;
  actorDisplay: string;
  occurredAt: string;
  taskPosition: string;
};

export type ProcessDetailDocument = {
  header: ProcessDetailHeader;
  timeline: ProcessTimelineEvent[];
};

export type MyWorkCollection<TItem> = {
  items: TItem[];
  limit: number;
  hasMore: boolean;
};

export type MyProcessesQuery = {
  page: number;
  search: string;
};

export type MyWorkDashboard = {
  startWorkflows: MyWorkCollection<MyWorkStartWorkflow>;
  myTasks: MyWorkCollection<MyWorkTask>;
  myProcesses: MyWorkCollection<MyWorkProcess>;
};

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

export const createMyWorkQueryKey = (query: MyProcessesQuery) =>
  createQueryKey("my-work", `dashboard:${query.page}:${query.search.trim().toLowerCase()}`);

export const defaultMyProcessesQuery: MyProcessesQuery = {
  page: 1,
  search: ""
};

export const myWorkQueryKey = createMyWorkQueryKey(defaultMyProcessesQuery);

const myWorkClient = createApiClient({ baseUrl: "/api/v1" });

const buildMyWorkDashboardPath = (query: MyProcessesQuery) => {
  const params = new URLSearchParams();
  if (query.page > 1) {
    params.set("myProcessesPage", String(query.page));
  }
  if (query.search.trim()) {
    params.set("myProcessesSearch", query.search.trim());
  }
  const serialized = params.toString();
  return serialized ? `/api/v1/my-work/?${serialized}` : "/api/v1/my-work/";
};

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
  const response = await (
    myWorkClient as {
      GET(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
    }
  ).GET(buildMyWorkDashboardPath(query), {});
  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as unknown as MyWorkDashboard
  };
};

export const readProcessDetailDocument = async (
  processId: string
): Promise<ProcessDetailResult> => {
  const response = await (
    myWorkClient as {
      GET(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
    }
  ).GET(`/api/v1/my-work/processes/${processId}/`, {});
  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as unknown as ProcessDetailDocument
  };
};

export const loadMyWorkDashboard = async (
  query: MyProcessesQuery = defaultMyProcessesQuery,
  force = false
) => {
  const queryKey = createMyWorkQueryKey(query);
  const current = queryRegistry.getSnapshot<MyWorkDashboard, NormalizedApiProblem>(queryKey);
  if (!force && current.status === "loading") return current;

  queryRegistry.setSnapshot(queryKey, { status: "loading" });
  const result = await readMyWorkDashboard(query);

  if (result.ok) {
    const snapshot: QuerySnapshot<MyWorkDashboard> = {
      status: "success",
      data: result.data,
      updatedAt: Date.now()
    };
    queryRegistry.setSnapshot(queryKey, snapshot);
    return snapshot;
  }

  const snapshot: QuerySnapshot<MyWorkDashboard, NormalizedApiProblem> = {
    status: "error",
    error: result.error,
    updatedAt: Date.now()
  };
  queryRegistry.setSnapshot(queryKey, snapshot);
  return snapshot;
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
    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    queryRegistry.invalidate(myWorkQueryKey, "workflow-started");
    return {
      ok: true,
      data: response.data as StartWorkflowAccepted
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const createWorkflowStartIdempotencyKey = (workflowId: string) =>
  `workflow-start-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
