"use client";

import { useState } from "react";
import { usePlans, useAnalytics } from "@/components/hooks";
import { LoadingState, EmptyState } from "@/components";
import { Badge } from "@/components/ui/badge";
import EditPlanModal from "@/components/admin/edit-plan-modal";
import InvoicesTable from "@/components/admin/invoices-table";
import { Plan } from "@/types";

interface AnalyticsData {
  mrr?: number;
  active_churches?: number;
  total_giving?: number;
}

export default function BillingPage() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (plansLoading || analyticsLoading) {
    return <LoadingState message="Loading billing data..." />;
  }

  const handleEditClick = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const closeModal = () => {
    setSelectedPlan(null);
  };

  // Show revenue summary since there's no revenue_trend in Analytics
  return (
    <div className="space-y-6">
      {/* Plans Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Subscription Plans</h3>
        {plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="card border-2 border-[var(--border)]">
                <h4 className="text-xl font-bold text-[var(--text-strong)] mb-2">{plan.name}</h4>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Rs. {plan.price_monthly.toLocaleString()}/month
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--good)]">•</span> Up to {plan.max_members} members
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--good)]">•</span> {plan.max_storage_mb}MB storage
                  </li>
                </ul>
                <button 
                  className="w-full btn-primary"
                  onClick={() => handleEditClick(plan)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="billing"
            title="No plans configured"
            description="Plans will be loaded from the backend."
          />
        )}
      </div>

      {/* Revenue Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">
          Revenue Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">MRR</p>
            <p className="text-xl font-bold text-[var(--text-strong)]">
              Rs. {analytics?.mrr?.toLocaleString() || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Active Churches</p>
            <p className="text-xl font-bold text-[var(--text-strong)]">
              {analytics?.active_churches || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Total Giving</p>
            <p className="text-xl font-bold text-[var(--text-strong)]">
              Rs. {analytics?.total_giving?.toLocaleString() || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Invoices</h3>
        <InvoicesTable />
      </div>

      {/* Edit Plan Modal */}
      {selectedPlan && (
        <EditPlanModal plan={selectedPlan} onClose={closeModal} />
      )}
    </div>
  );
}
