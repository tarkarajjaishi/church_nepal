"use client";

import { useChurch, useSuspendChurch, useReactivateChurch, useUpdateChurch, useDeleteChurch, useImpersonateChurch } from "./use-churches";
import { usePlans } from "./use-plans";
import { useInvoicesForChurch } from "./use-billing";

export function useChurchDetail(id: string) {
  const { data: church, isLoading, error } = useChurch(id);
  const { data: plans } = usePlans();
  const { data: invoices, isLoading: isLoadingInvoices, error: errorInvoices } = useInvoicesForChurch(id);
  const suspendChurch = useSuspendChurch();
  const reactivateChurch = useReactivateChurch();
  const updateChurch = useUpdateChurch();
  const deleteChurch = useDeleteChurch();
  const impersonateChurch = useImpersonateChurch();

  return {
    church,
    isLoading,
    error,
    plans,
    invoices,
    isLoadingInvoices,
    errorInvoices,
    suspendChurch,
    reactivateChurch,
    updateChurch,
    deleteChurch,
    impersonateChurch,
  };
}