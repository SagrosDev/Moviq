import {
  createApiClient,
  createQueryKey,
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
};

export type MyWorkTask = {
  taskId: string;
  title: string;
  workflowName: string;
  status: string;
  assignee: string;
  currentStep: string;
};

export type MyWorkProcess = {
  processId: string;
  workflowName: string;
  involvement: string;
  currentStep: string;
  instanceState: string;
  systemStatus: string;
  startedAt: string;
  lastActivityAt: string;
};

export type MyWorkCollection<TItem> = {
  items: TItem[];
  limit: number;
  hasMore: boolean;
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

export const myWorkQueryKey = createQueryKey("my-work", "dashboard");

const myWorkClient = createApiClient({ baseUrl: "/api/v1" });

export const readMyWorkDashboard = async (): Promise<MyWorkDashboardResult> => {
  const response = await (
    myWorkClient as {
      GET(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
    }
  ).GET("/api/v1/my-work/", {});
  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as unknown as MyWorkDashboard
  };
};

export const loadMyWorkDashboard = async (force = false) => {
  const current = queryRegistry.getSnapshot<MyWorkDashboard, NormalizedApiProblem>(myWorkQueryKey);
  if (!force && current.status === "loading") return current;

  queryRegistry.setSnapshot(myWorkQueryKey, { status: "loading" });
  const result = await readMyWorkDashboard();

  if (result.ok) {
    const snapshot: QuerySnapshot<MyWorkDashboard> = {
      status: "success",
      data: result.data,
      updatedAt: Date.now()
    };
    queryRegistry.setSnapshot(myWorkQueryKey, snapshot);
    return snapshot;
  }

  const snapshot: QuerySnapshot<MyWorkDashboard, NormalizedApiProblem> = {
    status: "error",
    error: result.error,
    updatedAt: Date.now()
  };
  queryRegistry.setSnapshot(myWorkQueryKey, snapshot);
  return snapshot;
};
