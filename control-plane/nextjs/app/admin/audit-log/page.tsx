"use client";

import { useState } from "react";
import { useAuditLog, fetchAllAuditLog } from "@/components/hooks/use-audit-log";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components";
import { Activity } from "lucide-react";

const PAGE_SIZE = 10;

const ALL_ACTORS = [
  "owner@churchnepal.com",
  "admin@churchnepal.com",
];

const ALL_ACTIONS = [
  "Create",
  "Update",
  "Delete",
  "Login",
  "Billing",
];

const actionBadgeVariant: Record<string, "success" | "accent" | "destructive" | "outline" | "warning"> = {
  Create: "success",
  Update: "accent",
  Delete: "destructive",
  Login: "outline",
  Billing: "warning",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useAuditLog({
    actor: actorFilter === "all" ? undefined : actorFilter,
    action: actionFilter === "all" ? undefined : actionFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    page: currentPage,
    per_page: PAGE_SIZE,
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const currentDataPage = data?.page || 1;

  const actors = [...new Set(entries.map((e) => e.actor))];
  const actions = [...new Set(entries.map((e) => e.action))];
  const types = [...new Set(entries.map((e) => e.type).filter(Boolean))] as string[];

  const filteredEntries = search.trim()
    ? entries.filter(
        (entry) =>
          entry.actor.toLowerCase().includes(search.toLowerCase()) ||
          entry.action.toLowerCase().includes(search.toLowerCase()) ||
          entry.target.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const resetPage = () => setCurrentPage(1);

  const handleExportCsv = async () => {
    const allEntries = await fetchAllAuditLog({
      actor: actorFilter,
      action: actionFilter,
      type: typeFilter,
    });

    const rows = [
      ["Timestamp", "Actor", "Action", "Target", "IP Address"],
      ...allEntries.map((e) => [e.timestamp, e.actor, e.action, e.target, e.ip]),
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Audit Log</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Every administrative action, recorded.
        </p>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search actor, action, or target..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                resetPage();
              }}
              className="flex h-10 w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text"
            >
              <option value="all">All Actors</option>
              {ALL_ACTORS.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
              {actors
                .filter((a) => !ALL_ACTORS.includes(a))
                .map((actor) => (
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
                resetPage();
              }}
              className="flex h-10 w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text"
            >
              <option value="all">All Actions</option>
              {ALL_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
              {actions
                .filter((a) => !ALL_ACTIONS.includes(a))
                .map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                resetPage();
              }}
              className="flex h-10 w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text"
            >
              <option value="all">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        {isLoading ? (
          <LoadingState message="Loading audit log..." />
        ) : error ? (
          <EmptyState
            icon="search"
            title="Failed to load audit log"
            description={
              error instanceof Error
                ? error.message
                : "An unknown error occurred."
            }
          />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-12 w-12 text-muted" />}
            title="No audit entries"
            description="No records match your current filters. Try adjusting your search."
          />
        ) : (
          <>
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
                  {filteredEntries.map((entry) => (
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
                        <Badge variant={actionBadgeVariant[entry.action] || "outline"}>
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

            <div className="md:hidden space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-[var(--border)] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">
                      {entry.timestamp}
                    </span>
                    <Badge variant={actionBadgeVariant[entry.action] || "outline"}>
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

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--muted)]">
                Page {currentDataPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
