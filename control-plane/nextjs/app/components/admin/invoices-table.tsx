"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingState } from "../loading-state";
import { EmptyState } from "../empty-state";
import { Calendar, CreditCard } from "lucide-react";

interface Invoice {
  id: string;
  church_id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  created_at: string;
}

export default function InvoicesTable() {
  const {
    data: invoices,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiClient.get<Invoice[]>("/invoices"),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !invoices) {
    return (
      <EmptyState
        title="Failed to Load Invoices"
        description="An error occurred while loading the invoices. Please try again later."
      />
    );
  }

  if (!invoices.data || invoices.data.length === 0) {
    return (
      <EmptyState
        title="No Invoices Found"
        description="There are currently no invoices to display."
      />
    );
  }

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await apiClient.post(`/invoices/${invoiceId}/pay`, {});
      toast.success("Invoice marked as paid successfully!");
      refetch();
    } catch (error) {
      console.error(`Error paying invoice ${invoiceId}:`, error);
      toast.error("Failed to mark invoice as paid.");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border)]">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Church ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {invoices.data.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text)]">
                {invoice.church_id}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text)]">
                Rs. {invoice.amount.toLocaleString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge
                  variant={
                    invoice.status === "paid"
                      ? "default"
                      : invoice.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)] flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(invoice.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                {invoice.status !== "paid" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePayInvoice(invoice.id)}
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
