import api from "./axios";
import { USE_MOCK, mockFetchHubTrades, mockFetchCareerData } from "@/mocks/mockData";

const EMPTY_CAREER = { yearSummaries: [], heatmap: {}, years: [] };

// years: number[] — empty array means all available years
// Fetches ALL trades by paginating through the backend's paginated responses.
export const fetchHubTrades = async (workspaceId, { years = [] } = {}) => {
  if (USE_MOCK) return mockFetchHubTrades(workspaceId, { years });

  const params = { ordering: "entry_datetime", page_size: 200 };
  if (years.length > 0) params.year__in = years.join(",");

  const { data: firstPage } = await api.get(`/journals/${workspaceId}/trades/`, { params });
  const allResults = [...(firstPage.results ?? [])];
  const totalCount = firstPage.count ?? allResults.length;

  if (totalCount > allResults.length && allResults.length > 0) {
    const totalPages = Math.ceil(totalCount / allResults.length);
    const settled = await Promise.allSettled(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        api.get(`/journals/${workspaceId}/trades/`, { params: { ...params, page: i + 2 } })
      )
    );
    settled.forEach((r) => {
      if (r.status === "fulfilled") allResults.push(...(r.value.data.results ?? []));
    });
  }

  return allResults;
};

export const fetchCareerData = async (workspaceId) => {
  if (USE_MOCK) return mockFetchCareerData(workspaceId);
  const { data } = await api.get(`/journals/${workspaceId}/analytics/career/`);
  if (data.has_data === false || !data.years?.length) return EMPTY_CAREER;
  return data;
};

export const fetchPerformanceByDay = async (workspaceId, tz = "UTC") => {
  if (USE_MOCK) return [];
  const { data } = await api.get(`/journals/${workspaceId}/analytics/performance-by-day/`, { params: { tz } });
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const fetchPerformanceByHour = async (workspaceId, tz = "UTC") => {
  if (USE_MOCK) return [];
  const { data } = await api.get(`/journals/${workspaceId}/analytics/performance-by-hour/`, { params: { tz } });
  return Array.isArray(data) ? data : (data.results ?? []);
};
