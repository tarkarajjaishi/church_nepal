"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Analytics, Church } from "@/types";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const response = await apiClient.get<Analytics>("/analytics/overview");
      return response.data;
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useChurchStats(slug?: string) {
  return useQuery({
    queryKey: ["church-stats", slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await apiClient.get<{
        members: number;
        giving: number;
        events: number;
        sermons: number;
        groups: number;
      }>(`/churches/${slug}/stats`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 30000,
  });
}

export function useGrowthAnalytics(range = "30d") {
  return useQuery({
    queryKey: ["analytics", "growth", range],
    queryFn: async () => {
      const response = await apiClient.get<Array<{
        period: string;
        churches_created: number;
        churches_churned: number;
        net_growth: number;
      }>>(`/analytics/growth?range=${encodeURIComponent(range)}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopChurches() {
  return useQuery({
    queryKey: ["analytics", "top-churches"],
    queryFn: async () => {
      const response = await apiClient.get<Church[]>("/analytics/top-churches");
      return response.data;
    },
    staleTime: 60000,
  });
}
