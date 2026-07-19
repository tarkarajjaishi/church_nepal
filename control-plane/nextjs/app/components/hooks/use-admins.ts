"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ControlAdmin } from "@/types";

// Control Admin hooks
export function useControlAdmins() {
  return useQuery({
    queryKey: ["control-admins"],
    queryFn: async () => {
      const response = await apiClient.get<ControlAdmin[]>("/control-admins");
      return response.data;
    },
    staleTime: 60000,
  });
}

export function useControlAdmin(id: string) {
  return useQuery({
    queryKey: ["control-admins", id],
    queryFn: async () => {
      const response = await apiClient.get<ControlAdmin>(`/control-admins/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useCreateControlAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; name: string; role?: string }) => {
      const response = await apiClient.post<ControlAdmin>("/control-admins", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control-admins"] });
    },
  });
}

export function useUpdateControlAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ControlAdmin> }) => {
      const response = await apiClient.put<ControlAdmin>(`/control-admins/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["control-admins"] });
      queryClient.invalidateQueries({ queryKey: ["control-admins", id] });
    },
  });
}

export function useDeleteControlAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/control-admins/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control-admins"] });
    },
  });
}