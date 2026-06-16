import { useCallback } from "react";

import { fetchCareerData } from "@/api/hub.api";
import { useWorkspace } from "@/workspaces/useWorkspace";

import { useAsyncQuery } from "./useAsyncQuery";

export function useCareerData() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchCareerData(workspaceId),
    [workspaceId]
  );

  return useAsyncQuery(queryFn, [workspaceId], { enabled: !!workspaceId });
}
