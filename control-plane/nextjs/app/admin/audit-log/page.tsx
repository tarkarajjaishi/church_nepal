"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "Create" | "Update" | "Delete" | "Login" | "Billing";
  target: string;
  ip: string;
}

const ALL_ACTORS = [
  "owner@churchnepal.com",
  "admin@churchnepal.com",
];

const ALL_ACTIONS: AuditEntry["action"][] = [
  "Create",
  "Update",
  "Delete",
  "Login",
  "Billing",
];

const auditData: AuditEntry[] = [
  {
    id: "1",
    timestamp: "2026-07-23 09:12:45",
    actor: "owner@churchnepal.com",
    action: "Create",
    target: "Church: Grace Chapel",
    ip: "192.168.1.10",
  },
  {
    id: "2",
    timestamp: "2026-07-23 09:43:22",
    actor: "admin@churchnepal.com",
    action: "Update",
    target: "Church: Grace Chapel",
    ip: "192.168.1.12",
  },
  {
    id: "3",
    timestamp: "2026-07-23 10:15:10",
    actor: "owner@churchnepal.com",
    action: "Delete",
    target: "Church: Old Bethlehem",
    ip: "192.168.1.10",
  },
  {
    id: "4",
    timestamp: "2026-07-23 10:35:33",
    actor: "admin@churchnepal.com",
    action: "Login",
    target: "Admin Panel",
    ip: "192.168.1.14",
  },
  {
    id: "5",
    timestamp: "2026-07-23 11:02:01",
    actor: "owner@churchnepal.com",
    action: "Billing",
    target: "Plan: Pro",
    ip: "192.168.1.10",
  },
  {
    id: "6",
    timestamp: "2026-07-23 11:45:44",
    actor: "admin@churchnepal.com",
    action: "Create",
    target: "Church: Hope Community",
    ip: "192.168.1.16",
  },
  {
    id: "7",
    timestamp: "2026-07-23 12:10:15",
    actor: "owner@churchnepal.com",
    action: "Update",
    target: "Church: Hope Community",
    ip: "192.168.1.10",
  },
  {
    id: "8",
    timestamp: "2026-07-23 12:38:28",
    actor: "admin@churchnepal.com",
    action: "Login",
    target: "Admin Panel",
    ip: "192.168.1.12",
  },
  {
    id: "9",
    timestamp: "2026-07-23 13:05:56",
    actor: "owner@churchnepal.com",
    action: "Billing",
    target: "Church: Grace Chapel",
    ip: "192.168.1.10",
  },
  {
    id: "10",
    timestamp: "2026-07-23 13:40:09",
    actor: "admin@churchnepal.com",
    action: "Create",
    target: "Church: Faith Assembly",
    ip: "192.168.1.18",
  },
  {
    id: "11",
    timestamp: "2026-07-23 14:05:40",
    actor: "owner@churchnepal.com",
    action: "Delete",
    target: "Church: Faith Assembly",
    ip: "192.168.1.10",
  },
  {
    id: "12",
    timestamp: "2026-07-23 14:32:17",
    actor: "admin@churchnepal.com",
    action: "Update",
    target: "Church: Grace Chapel",
    ip: "192.168.1.12",
  },
];

const actionBadgeVariant: Record<AuditEntry["action"], "success" | "accent" | "destructive" | "outline" | "warning"> = {
  Create: "success",
  Update: "accent",
  Delete: "destructive",
  Login: "outline",
  Billing: "warning",
};

const PAGE_SIZE = 5;

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return auditData.filter((entry) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        entry.actor.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term) ||
        entry.target.toLowerCase().includes(term);

      const matchesActor = actorFilter === "all" || entry.actor === actorFilter;
      const matchesAction = actionFilter === "all" || entry.action === actionFilter;

      return matchesSearch && matchesActor && matchesAction;
    });
  }, [search, actorFilter, actionFilter]);

  const visibleEntries = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const handleExportCsv = () => {
    const rows = [
      ["Timestamp", "Actor", "Action", "Target", "IP Address"],
      ...filtered.map((e) => [e.timestamp, e.actor, e.action, e.target, e.ip]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Audit Log</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Every administrative action, recorded.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search actor, action, or target..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="flex h-10 w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text"
            >
              <option value="all">All Actors</option>
              {ALL_ACTORS.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="flex h-10 w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text"
            >
              <option value="all">All Actions</option>
              {ALL_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No audit entries"
            description="No records match your current filters. Try adjusting your search."
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wide pb-3 pr-4">
                      Timestamp
                    </th>
                    <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wide pb-3 pr-4">
                      Actor
                    </th>
                    <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wide pb-3 pr-4">
                      Action
                    </th>
                    <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wide pb-3 pr-4">
                      Target
                    </th>
                    <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wide pb-3">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[var(--border)] last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-sm text-[var(--text)] whitespace-nowrap">
                        {entry.timestamp}
                      </td>
                      <td className="py-3 pr-4 text-sm text-[var(--text)]">
                        {entry.actor}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={actionBadgeVariant[entry.action]}>
                          {entry.action}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[var(--text)]">
                        {entry.target}
                      </td>
                      <td className="py-3 text-sm text-[var(--muted)] font-mono">
                        {entry.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {visibleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-[var(--border)] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">
                      {entry.timestamp}
                    </span>
                    <Badge variant={actionBadgeVariant[entry.action]}>
                      {entry.action}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text-strong)]">
                      {entry.actor}
                    </p>
                    <p className="text-sm text-[var(--text)]">{entry.target}</p>
                    <p className="text-xs text-[var(--muted)] font-mono">
                      {entry.ip}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
