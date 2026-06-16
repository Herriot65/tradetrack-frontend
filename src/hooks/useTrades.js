import { useCallback } from "react";

import { fetchTrades } from "@/api/trades.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function useTrades({ page = 1, search = "", asset = "", setup = "" } = {}) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () =>
      fetchTrades(workspaceId, {
        page,
        ...(search ? { search } : {}),
        ...(asset ? { asset } : {}),
        ...(setup ? { setup } : {}),
        ordering: "-entry_datetime",
      }),
    [workspaceId, page, search, asset, setup]
  );

  return useAsyncQuery(queryFn, [workspaceId, page, search, asset, setup], {
    enabled: !!workspaceId,
  });
}
