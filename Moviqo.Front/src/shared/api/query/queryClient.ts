import { QueryClient } from "@tanstack/react-query";

type StatusError = {
  status?: number;
};

export type QuerySnapshot<TData = unknown, TError = unknown> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData; updatedAt: number }
  | { status: "error"; error: TError; updatedAt: number };

const nonRetryableStatuses = new Set([400, 401, 403, 404, 409, 422]);

export const shouldRetryServerQuery = (
  failureCount: number,
  error: unknown
) => {
  const status = typeof error === "object" && error !== null
    ? (error as StatusError).status
    : undefined;

  if (status !== undefined && nonRetryableStatuses.has(status)) {
    return false;
  }

  return failureCount < 2;
};

export const createMoviqoQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: shouldRetryServerQuery,
      staleTime: 30 * 1000
    },
    mutations: {
      retry: false
    }
  }
});

const organizationKey = (organizationId: string) => [
  "organization",
  organizationId
] as const;

export const moviqoQueryKeys = {
  organization: organizationKey,
  myWork: (
    organizationId: string,
    myTasksPage: number,
    startWorkflowsPage: number,
    myProcessesPage: number,
    search: string
  ) => [
    ...organizationKey(organizationId),
    "my-work",
    {
      myProcessesPage,
      myTasksPage,
      search: search.trim().toLowerCase(),
      startWorkflowsPage
    }
  ] as const,
  processDetail: (organizationId: string, processId: string) => [
    ...organizationKey(organizationId),
    "processes",
    processId
  ] as const,
  taskForm: (organizationId: string, taskId: string) => [
    ...organizationKey(organizationId),
    "tasks",
    taskId,
    "form"
  ] as const,
  workflowCatalog: (organizationId: string) => [
    ...organizationKey(organizationId),
    "workflows",
    "catalog"
  ] as const,
  workflowDraft: (organizationId: string, workflowId: string) => [
    ...organizationKey(organizationId),
    "workflows",
    workflowId,
    "draft"
  ] as const
};

export const clearServerState = (queryClient: QueryClient) => {
  queryClient.clear();
};
