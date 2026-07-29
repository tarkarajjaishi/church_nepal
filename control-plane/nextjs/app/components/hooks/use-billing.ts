"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { BillingInfo, Invoice } from "@/types";

// Billing hooks
export function useBilling() {
  return useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      const response = await apiClient.get<BillingInfo[]>("/billing");
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useBillingForChurch(churchId: string) {
  return useQuery({
    queryKey: ["billing", churchId],
    queryFn: async () => {
      const response = await apiClient.get<BillingInfo>(`/billing/${churchId}`);
      return response.data;
    },
    enabled: !!churchId,
    staleTime: 30000,
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await apiClient.get<Invoice[]>("/invoices");
      return response.data;
    },
    staleTime: 60000,
  });
}

export function useInvoicesForChurch(churchId: string) {
  return useQuery({
    queryKey: ["invoices", churchId],
    queryFn: async () => {
      const response = await apiClient.get<Invoice[]>(`/invoices?church_id=${churchId}`);
      return response.data;
    },
    enabled: !!churchId,
    staleTime: 60000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      church_id: string;
      amount: number;
      period_start: string;
      period_end: string;
      due_date: string;
    }) => {
      const response = await apiClient.post<Invoice>("/invoices", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<Invoice>(`/invoices/${id}/pay`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}