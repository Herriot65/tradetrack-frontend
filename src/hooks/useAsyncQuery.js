import { clearQueryCache } from "../lib/queryCache.js";
import { useCallback, useEffect, useState } from "react";

function getErrorMessage(err) {
  const responseData = err.response?.data;
  if (responseData && typeof responseData === "object") {
    const firstError = Object.values(responseData).flat().find(Boolean);
    if (firstError) return String(firstError);
  }
  return responseData?.detail || responseData?.message || err.message || "Something went wrong";
}

export function useAsyncQuery(
  fetchFn,
  deps = [],
  { enabled = true, keepPreviousData = false } = {},
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    clearQueryCache();
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear externally fetched state when the query is disabled.
      if (!keepPreviousData) setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          if (!keepPreviousData) setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // fetchFn identity is controlled by caller hooks via their own useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, enabled]);

  return { data, loading, error, refetch };
}
