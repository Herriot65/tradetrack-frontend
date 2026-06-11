import { useCallback } from "react";

import { fetchEquityCurve } from "@/api/analytics.api";
import { useAsyncQuery } from "./useAsyncQuery";

export function useEquityCurve(period = "weekly") {
  const queryFn = useCallback(() => fetchEquityCurve(period), [period]);
  return useAsyncQuery(queryFn, [period]);
}
