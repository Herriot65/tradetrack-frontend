import { fetchPnlBySetup } from "@/api/analytics.api";
import { useAsyncQuery } from "./useAsyncQuery";

export function usePnlBySetup() {
  return useAsyncQuery(fetchPnlBySetup, []);
}
