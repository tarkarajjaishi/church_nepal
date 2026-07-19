"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Analytics, Church } from "@/types";

// Analytics hooks
export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await apiClient.get<Analytics>("/analytics");
      return response.data;
    },
    staleTime: 60000,
    refetchInterval: 60000, // Auto-refresh every minute
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

export function useGrowthAnalytics() {
  return useQuery({
    queryKey: ["analytics", "growth"],
    queryFn: async () => {
      const response = await apiClient.get<Array<{
        month: string;
        churches_created: number;
        churches_churned: number;
        net_growth: number;
      }>>("/analytics/growth");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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