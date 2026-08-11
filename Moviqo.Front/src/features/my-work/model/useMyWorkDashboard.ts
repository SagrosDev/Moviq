import { useCallback, useEffect, useState } from "react";
import {
  queryRegistry,
  type NormalizedApiProblem,
  type QuerySnapshot
} from "../../../shared/api";
import {
  createMyWorkQueryKey,
  loadMyWorkDashboard,
  type MyProcessesQuery,
  type MyWorkDashboard
} from "./myWork";

export const useMyWorkDashboard = (
  query: MyProcessesQuery,
  enabled = true
) => {
  const queryKey = createMyWorkQueryKey(query);
  const [snapshot, setSnapshot] = useState<
    QuerySnapshot<MyWorkDashboard, NormalizedApiProblem>
  >(() =>
    queryRegistry.getSnapshot(queryKey)
  );

  const load = useCallback(async (force = false) => {
    await loadMyWorkDashboard(query, force);
  }, [query]);

  useEffect(() => {
    setSnapshot(queryRegistry.getSnapshot(queryKey));
    const unsubscribe = queryRegistry.subscribe(queryKey, () => {
      setSnapshot(queryRegistry.getSnapshot(queryKey));
    });

    if (enabled && queryRegistry.getSnapshot(queryKey).status === "idle") {
      void load();
    }

    return unsubscribe;
  }, [enabled, load, queryKey]);

  return {
    snapshot,
    retry: () => load(true)
  };
};
