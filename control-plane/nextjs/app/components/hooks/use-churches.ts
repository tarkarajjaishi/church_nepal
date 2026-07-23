"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Church, NewChurch } from "@/types";
import { toast } from "sonner";

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
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["churches"] });
      const previous = queryClient.getQueryData<Church[]>(["churches"]);

      const optimisticChurch: Church = {
        id: `temp-${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        subdomain: "",
        admin_email: "",
        status: "active",
        plan: "Free",
        custom_domain: null,
        last_active_at: null,
        storage_bytes: null,
        notes: null,
        created_at: new Date().toISOString(),
        member_count: 0,
        giving_total: 0,
      };

      queryClient.setQueryData<Church[]>(["churches"], (old = []) => [optimisticChurch, ...old]);

      return { previous };
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["churches"], context.previous);
      }
      toast.error("Failed to create church", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      toast.success("Church created successfully");
    },
    onSettled: () => {
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["churches"] });
      const previous = queryClient.getQueryData<Church[]>(["churches"]);
      queryClient.setQueryData<Church[]>(["churches"], (old = []) => old.filter(c => c.id !== id));

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["churches"], context.previous);
      }
      toast.error("Failed to delete church", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      toast.success("Church deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}

export function useSuspendChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/churches/${id}/suspend`);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["churches"] });
      const previous = queryClient.getQueryData<Church[]>(["churches"]);
      queryClient.setQueryData<Church[]>(["churches"], (old = []) =>
        old.map(c => (c.id === id ? { ...c, status: "suspended" } : c))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["churches"], context.previous);
      }
      toast.error("Failed to suspend church", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      toast.success("Church suspended successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}

export function useReactivateChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/churches/${id}/reactivate`);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["churches"] });
      const previous = queryClient.getQueryData<Church[]>(["churches"]);
      queryClient.setQueryData<Church[]>(["churches"], (old = []) =>
        old.map(c => (c.id === id ? { ...c, status: "active" } : c))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["churches"], context.previous);
      }
      toast.error("Failed to reactivate church", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      toast.success("Church reactivated successfully");
    },
    onSettled: () => {
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["churches"] });
      const previous = queryClient.getQueryData<Church[]>(["churches"]);
      queryClient.setQueryData<Church[]>(["churches"], (old = []) =>
        old.map(c => (c.id === id ? { ...c, ...data } : c))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["churches"], context.previous);
      }
      toast.error("Failed to update church", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      toast.success("Church updated successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
    },
  });
}

export function useSeedDummyChurches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/seed/dummy");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["churches"] });
      toast.success("Demo churches seeded successfully");
    },
    onError: (err) => {
      toast.error("Failed to seed demo churches", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    },
  });
}

export function useImpersonateChurch() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ church_admin_url: string }>(`/churches/${id}/impersonate`);
      if (!response.data.church_admin_url) {
        throw new Error("Impersonation URL not returned from server");
      }
      return response.data.church_admin_url;
    },
    onError: (err) => {
      toast.error("Failed to impersonate church", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    },
  });
}
