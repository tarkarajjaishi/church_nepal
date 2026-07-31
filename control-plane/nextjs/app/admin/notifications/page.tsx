"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  kind: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await apiClient.get<{ notifications: Notification[]; unread_count: number }>(
        "/notifications",
      )).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const readOne = useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });
  const readAll = useMutation({
    mutationFn: () => apiClient.post("/notifications/read-all"),
    onSuccess: invalidate,
  });

  const items = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">Notifications</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {isLoading ? "Loading…" : `${data?.unread_count ?? 0} unread of ${items.length}`}
          </p>
        </div>
        {!!data?.unread_count && (
          <Button variant="outline" className="gap-2" onClick={() => readAll.mutate()}>
            <CheckCheck size={16} aria-hidden /> Mark all read
          </Button>
        )}
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !items.length ? (
          <div className="p-10 text-center">
            <Bell className="size-6 mx-auto mb-2 text-[var(--muted)]" aria-hidden />
            <p className="text-sm text-[var(--muted)]">Nothing to report.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((n) => (
              <li
                key={n.id}
                className={`p-4 flex items-start gap-3 ${n.read_at ? "opacity-60" : ""}`}
              >
                <span
                  className={`mt-1.5 size-2 rounded-full shrink-0 ${
                    n.read_at ? "bg-[var(--border)]" : "bg-sky-400"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-[var(--muted)] mt-0.5">{n.body}</p>}
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {n.created_at.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                {!n.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Mark "${n.title}" as read`}
                    onClick={() => readOne.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
