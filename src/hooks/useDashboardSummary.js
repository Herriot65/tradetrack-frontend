import { useCallback } from "react";

import { fetchDashboardSummary } from "@/api/dashboard.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function useDashboardSummary() {
  const { activeWorkspace, analyticsVersion } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchDashboardSummary(workspaceId),
    [workspaceId]
  );

  return useAsyncQuery(queryFn, [workspaceId, analyticsVersion], { enabled: !!workspaceId });
}
