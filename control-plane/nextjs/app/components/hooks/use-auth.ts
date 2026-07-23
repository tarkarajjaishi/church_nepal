"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, setAuthToken, getAuthToken } from "@/lib/api-client";

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; code?: string }) => {
      const response = await apiClient.post<{ token?: string; refresh_token?: string; email?: string; twofa_required?: boolean }>(
        "/auth/login",
        credentials,
        { _skipAuthRefresh: true }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setAuthToken(data.token || null, data.refresh_token || null);
      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("control_token", data.token);
        }
        if (data.refresh_token) {
          localStorage.setItem("control_refresh_token", data.refresh_token);
        }
      }
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiClient.get<{ id: string; email: string; twofa_enabled?: boolean }>("/auth/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!getAuthToken(),
    retry: false,
  });
}
