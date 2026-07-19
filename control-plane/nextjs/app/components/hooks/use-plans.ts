"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Plan } from "@/types";

// Plans hooks
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const response = await apiClient.get<Plan[]>("/plans");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ["plans", id],
    queryFn: async () => {
      const response = await apiClient.get<Plan>(`/plans/${id}`);
      return response.data;
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