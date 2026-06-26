import { useCallback } from "react";

import { fetchWinLossDistribution } from "@/api/analytics.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function useWinLossDistribution() {
  const { activeWorkspace, analyticsVersion } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchWinLossDistribution(workspaceId),
    [workspaceId]
  );

  return useAsyncQuery(queryFn, [workspaceId, analyticsVersion], { enabled: !!workspaceId });
}
