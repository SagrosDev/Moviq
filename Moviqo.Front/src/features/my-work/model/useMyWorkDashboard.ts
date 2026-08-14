import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  moviqoQueryKeys,
  type NormalizedApiProblem,
  type QuerySnapshot
} from "../../../shared/api";
import {
  readMyWorkDashboard,
  type MyProcessesQuery,
  type MyWorkDashboard
} from "./myWork";

export const useMyWorkDashboard = (
  query: MyProcessesQuery,
  organizationId: string,
  enabled = true
) => {
  const result = useQuery({
    enabled: enabled && Boolean(organizationId),
    queryKey: moviqoQueryKeys.myWork(
      organizationId,
      query.myTasksPage,
      query.taskSearch,
      query.startWorkflowsPage,
      query.page,
      query.search
    ),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await readMyWorkDashboard(query);
      if (!response.ok) {
        throw response.error;
      }
      return response.data;
    }
  });

  const snapshot: QuerySnapshot<MyWorkDashboard, NormalizedApiProblem> = result.isPending
    ? { status: "loading" }
    : result.isError
      ? {
          status: "error",
          error: result.error as unknown as NormalizedApiProblem,
          updatedAt: Date.now()
        }
      : {
          status: "success",
          data: result.data,
          updatedAt: result.dataUpdatedAt
        };

  return {
    isRefreshing: result.isFetching && !result.isPending,
    snapshot,
    retry: () => result.refetch()
  };
};
