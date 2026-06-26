import { useCallback } from "react";

import { fetchEquityCurve } from "@/api/analytics.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function useEquityCurve(period = "weekly") {
  const { activeWorkspace, analyticsVersion } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchEquityCurve(workspaceId, period),
    [workspaceId, period]
  );

  return useAsyncQuery(queryFn, [workspaceId, period, analyticsVersion], { enabled: !!workspaceId });
}
