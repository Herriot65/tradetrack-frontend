import { useCallback } from "react";

import { fetchTrades } from "@/api/trades.api";
import { useAsyncQuery } from "./useAsyncQuery";

export function useTrades({ page = 1, search = "", asset = "", setup = "" } = {}) {
  const queryFn = useCallback(
    () =>
      fetchTrades({
        page,
        ...(search ? { search } : {}),
        ...(asset ? { asset } : {}),
        ...(setup ? { setup } : {}),
        ordering: "-entry_datetime",
      }),
    [page, search, asset, setup]
  );

  return useAsyncQuery(queryFn, [page, search, asset, setup]);
}
