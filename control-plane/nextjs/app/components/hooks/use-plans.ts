"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Plan } from "@/types";

// Static fallback plan data matching i18n-hook structure
const staticFallbackPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_annual: 0,
    max_members: 10,
    max_storage_mb: 100,
    max_emails: 500,
    max_churches: 1,
    features: {
      "own_subdomain": true,
      "isolated_database": true,
      "private_storage": true,
      "headless_cms": true,
      "instant_admin": true,
      "beautiful_themes": true,
    },
  },
  {
    id: "standard",
    name: "Standard",
    price_monthly: 2499,
    price_annual: 29988,
    max_members: 100,
    max_storage_mb: 1000,
    max_emails: 5000,
    max_churches: 10,
    features: {
      "own_subdomain": true,
      "isolated_database": true,
      "private_storage": true,
      "headless_cms": true,
      "instant_admin": true,
      "beautiful_themes": true,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price_monthly: 14999,
    price_annual: 179988,
    max_members: 1000,
    max_storage_mb: 10000,
    max_emails: 50000,
    max_churches: 999,
    features: {
      "own_subdomain": true,
      "isolated_database": true,
      "private_storage": true,
      "headless_cms": true,
      "instant_admin": true,
      "beautiful_themes": true,
    },
  },
];

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Plan[]>("/plans");
        return response.data;
      } catch (error) {
        // Fallback to static data if API is not available
        return staticFallbackPlans;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ["plans", id],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Plan>(`/plans/${id}`);
        return response.data;
      } catch (error) {
        // Find plan in static fallback data
        const plan = staticFallbackPlans.find(p => p.id === id);
        if (!plan) {
          throw new Error("Plan not found");
        }
        return plan;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      price_monthly: number;
      price_annual: number;
      max_members: number;
      max_storage_mb: number;
      max_emails: number;
      max_churches: number;
      features?: Record<string, unknown>;
    }) => {
      const response = await apiClient.post<Plan>("/plans", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Plan> }) => {
      const response = await apiClient.put<Plan>(`/plans/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", id] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/plans/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}