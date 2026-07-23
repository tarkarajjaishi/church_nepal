"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Notification } from "@/types";
import { toast } from "sonner";

interface NotificationsApiResponse {
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    body: string | null;
    church_id: string | null;
    read: boolean;
    created_at: string;
  }>;
  unread_count: number;
}

function mapNotification(raw: NotificationsApiResponse["notifications"][0]): Notification {
  return {
    id: String(raw.id),
    type: raw.type,
    title: raw.title,
    description: raw.body || "",
    timestamp: raw.created_at,
    read: raw.read,
  };
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await apiClient.get<NotificationsApiResponse>("/notifications");
      const notifs = response.data.notifications.map(mapNotification);
      return {
        notifications: notifs,
        unreadCount: response.data.unread_count,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/notifications/${id}/read`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<{ notifications: Notification[]; unreadCount: number }>(["notifications"]);

      queryClient.setQueryData<{ notifications: Notification[]; unreadCount: number }>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      toast.error("Failed to mark notification as read", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/notifications/read-all");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<{ notifications: Notification[]; unreadCount: number }>(["notifications"]);

      queryClient.setQueryData<{ notifications: Notification[]; unreadCount: number }>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      });

      return { previous };
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      toast.error("Failed to mark all notifications as read", {
        description: _err instanceof Error ? _err.message : "An error occurred",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}
