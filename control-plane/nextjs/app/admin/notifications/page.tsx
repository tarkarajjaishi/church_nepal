"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/components/hooks";
import { Notification } from "@/types";

type NotificationType = "church" | "billing" | "system" | "admin";

const filters: { label: string; value: "all" | "unread" | NotificationType }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Churches", value: "church" },
  { label: "Billing", value: "billing" },
  { label: "System", value: "system" },
];

function getIcon(type: NotificationType) {
  switch (type) {
    case "church":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4 4h1m-1 4h1" />
        </svg>
      );
    case "billing":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case "system":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "admin":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
  }
}

function typeColor(type: NotificationType) {
  switch (type) {
    case "church":
      return "text-[var(--accent)] bg-[var(--accent-soft)]";
    case "billing":
      return "text-[var(--good)] bg-[var(--good-soft)]";
    case "system":
      return "text-[var(--gold)] bg-[var(--gold-soft)]";
    case "admin":
      return "text-[var(--text)] bg-[var(--panel)]";
  }
}

export default function NotificationsPage() {
  const { data } = useNotifications();
  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const [filter, setFilter] = useState<"all" | "unread" | NotificationType>("all");
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const handleRowClick = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-strong)]">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)]"
              }`}
            >
              {f.label}
              {f.value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted)] text-sm">No notifications to show.</p>
            <p className="text-[var(--muted)] text-xs mt-1">
              {filter === "unread"
                ? "All notifications have been read."
                : "Try selecting a different filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleRowClick(n.id)}
                disabled={markRead.isPending}
                className={`w-full flex items-start gap-4 p-4 rounded-lg text-left transition-colors hover:bg-[var(--panel)] ${
                  !n.read ? "bg-[var(--panel)]" : "opacity-70"
                } ${markRead.isPending ? "opacity-60" : ""}`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typeColor(
                    n.type as NotificationType
                  )}`}
                >
                  {getIcon(n.type as NotificationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-strong)] truncate">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent)]" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-0.5 line-clamp-1">
                    {n.description}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-[var(--muted)] mt-1">
                  {n.timestamp}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
