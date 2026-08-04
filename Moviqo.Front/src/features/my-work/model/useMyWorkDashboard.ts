import { useCallback, useEffect, useState } from "react";
import { queryRegistry, type QuerySnapshot } from "../../../shared/api";
import { loadMyWorkDashboard, myWorkQueryKey, type MyWorkDashboard } from "./myWork";

export const useMyWorkDashboard = (enabled = true) => {
  const [snapshot, setSnapshot] = useState<QuerySnapshot<MyWorkDashboard>>(() =>
    queryRegistry.getSnapshot(myWorkQueryKey)
  );

  const load = useCallback(async (force = false) => {
    await loadMyWorkDashboard(force);
  }, []);

  useEffect(() => {
    const unsubscribe = queryRegistry.subscribe(myWorkQueryKey, () => {
      setSnapshot(queryRegistry.getSnapshot(myWorkQueryKey));
    });

    if (enabled && queryRegistry.getSnapshot(myWorkQueryKey).status === "idle") {
      void load();
    }

    return unsubscribe;
  }, [enabled, load]);

  return {
    snapshot,
    retry: () => load(true)
  };
};
