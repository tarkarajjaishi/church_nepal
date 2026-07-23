"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  type?: string;
}

export interface PaginatedAuditLog {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function mapAuditLogItem(item: {
  id: string;
  created_at: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
}): AuditLogEntry {
  let target = `${item.entity_type}: ${item.entity_id}`;
  if (item.details?.name) {
    target = item.details.name;
  } else if (item.details?.description) {
    target = item.details.description;
  }
  return {
    id: item.id,
    timestamp: formatTimestamp(item.created_at),
    actor: item.user_email,
    action: item.action,
    target,
    ip: item.details?.ip || "-",
    type: item.entity_type,
  };
}

interface AuditLogQueryParams {
  actor?: string;
  action?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export function useAuditLog(params?: AuditLogQueryParams) {
  return useQuery({
    queryKey: ["audit-log", params],
    queryFn: async (): Promise<PaginatedAuditLog> => {
      const qs = new URLSearchParams();
      if (params?.actor && params.actor !== "all") {
        qs.set("user_email", params.actor);
      }
      if (params?.action && params.action !== "all") {
        qs.set("action", params.action);
      }
      if (params?.type && params.type !== "all") {
        qs.set("entity_type", params.type);
      }
      if (params?.page) {
        qs.set("page", String(params.page));
      }
      if (params?.per_page) {
        qs.set("per_page", String(params.per_page));
      }

      const response = await apiClient.get<{
        data: any[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(`/audit-log?${qs.toString()}`);

      const paginated = response.data;
      return {
        entries: paginated.data.map(mapAuditLogItem),
        total: paginated.total,
        page: paginated.page,
        per_page: paginated.per_page,
        total_pages: paginated.total_pages,
      };
    },
    staleTime: 30000,
  });
}

export async function fetchAllAuditLog(params?: Omit<AuditLogQueryParams, "page" | "per_page">): Promise<AuditLogEntry[]> {
  const allEntries: AuditLogEntry[] = [];
  let page = 1;
  let totalPages = 1;
  let hasMore = true;

  while (hasMore) {
    const qs = new URLSearchParams();
    if (params?.actor && params.actor !== "all") {
      qs.set("user_email", params.actor);
    }
    if (params?.action && params.action !== "all") {
      qs.set("action", params.action);
    }
    if (params?.type && params.type !== "all") {
      qs.set("entity_type", params.type);
    }
    qs.set("page", String(page));
    qs.set("per_page", "200");

    const response = await apiClient.get<{
      data: any[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    }>(`/audit-log?${qs.toString()}`);

    const paginated = response.data;
    const mapped = paginated.data.map(mapAuditLogItem);
    allEntries.push(...mapped);

    totalPages = paginated.total_pages;
    hasMore = page < totalPages;
    page++;
  }

  return allEntries;
}
