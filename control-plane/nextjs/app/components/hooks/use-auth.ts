"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, setAuthToken, getAuthToken } from "@/lib/api-client";

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post<{ token: string; email: string }>("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("control_token", data.token);
      }
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiClient.get<{ id: string; email: string }>("/auth/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getAuthToken(),
    retry: false,
  });
}
