import { fetchDashboardSummary } from "@/api/dashboard.api";
import { useAsyncQuery } from "./useAsyncQuery";

export function useDashboardSummary() {
  return useAsyncQuery(fetchDashboardSummary, []);
}
