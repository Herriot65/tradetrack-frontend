import { useCallback } from "react";

import { fetchTrades } from "@/api/trades.api";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { useAsyncQuery } from "./useAsyncQuery";

export function useTrades({ page = 1, search = "", asset = "", setup = "", status = "", ordering = "-entry_datetime,-id", journalId } = {}) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = journalId ?? activeWorkspace?.id;

  const queryFn = useCallback(
    () =>
      fetchTrades(workspaceId, {
        page,
        ...(search ? { search } : {}),
        ...(asset ? { asset } : {}),
        ...(setup ? { setup } : {}),
        ...(status ? { status } : {}),
        ordering,
      }),
    [workspaceId, page, search, asset, setup, status, ordering]
  );

  return useAsyncQuery(queryFn, [workspaceId, page, search, asset, setup, status, ordering], {
    enabled: !!workspaceId,
    keepPreviousData: true,
  });
}
