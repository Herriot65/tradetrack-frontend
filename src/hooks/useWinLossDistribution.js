import { fetchWinLossDistribution } from "@/api/analytics.api";
import { useAsyncQuery } from "./useAsyncQuery";

export function useWinLossDistribution() {
  return useAsyncQuery(fetchWinLossDistribution, []);
}
