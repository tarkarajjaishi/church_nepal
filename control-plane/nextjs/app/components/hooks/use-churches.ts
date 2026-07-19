"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Church, NewChurch } from "@/types";

// Church hooks
export function useChurches() {
  return useQuery({
    queryKey: ["churches"],
    queryFn: async () => {
      const response = await apiClient.get<Church[]>("/churches");
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useChurch(id: string) {
  return useQuery({
    queryKey: ["churches", id],
    queryFn: async () => {
      const response = await apiClient.get<Church>(`/churches/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useCreateChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<NewChurch>("/churches", { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}

export function useDeleteChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/churches/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}

export function useUpdateChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Church> }) => {
      const response = await apiClient.put<Church>(`/churches/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
      queryClient.invalidateQueries({ queryKey: ["churches", id] });
    },
  });
}

// Seed dummy churches
export function useSeedDummyChurches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/seed/dummy");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}