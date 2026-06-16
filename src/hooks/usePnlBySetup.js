import { useCallback } from "react";

import { fetchPnlBySetup } from "@/api/analytics.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function usePnlBySetup() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchPnlBySetup(workspaceId),
    [workspaceId]
  );

  return useAsyncQuery(queryFn, [workspaceId], { enabled: !!workspaceId });
}
