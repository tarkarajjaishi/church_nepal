'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ChurchBillingData = {
  id: string;
  name: string;
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
  status: 'active' | 'past_due' | 'paused' | 'canceled';
  nextInvoiceDate?: string;
  nextInvoiceAmount?: number;
};

const mockChurchBillingData: ChurchBillingData = {
  id: 'church-123',
  name: 'Example Church',
  plan: {
    id: 'pro',
    name: 'Pro Plan',
    price: 49,
    features: ['Unlimited members', 'Advanced analytics', 'Priority support'],
  },
  status: 'active',
  nextInvoiceDate: '2024-08-01',
  nextInvoiceAmount: 49,
};

export default function ChurchBillingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [churchData, setChurchData] = useState<ChurchBillingData>(mockChurchBillingData);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handlePauseSubscription = () => {
    setChurchData(prev => ({ ...prev, status: 'paused' }));
    toast.success('Subscription paused');
  };

  const handleResumeSubscription = () => {
    setChurchData(prev => ({ ...prev, status: 'active' }));
    toast.success('Subscription resumed');
  };

  const handleCancelSubscription = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setChurchData(prev => ({ ...prev, status: 'canceled' }));
    toast.success('Subscription canceled');
    setIsCancelDialogOpen(false);
    setCancelReason('');
  };

  const handlePlanChange = (newPlanId: string) => {
    // Optimistic update
    const newPlan = mockChurchBillingData.plan; // In real app, fetch from API
    setChurchData(prev => ({
      ...prev,
      plan: newPlan,
    }));
    toast.success(`Plan changed to ${newPlan.name}`, {
      description: 'Proration will be applied to the next invoice.',
    });
  };

  const getStatusBadgeVariant = () => {
    switch (churchData.status) {
      case 'active': return 'bg-[var(--good-soft)] text-[var(--good)] border-[var(--good)]';
      case 'past_due': return 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]';
      case 'paused': return 'bg-[var(--muted)] text-[var(--text)] border-[var(--border)]';
      case 'canceled': return 'bg-[var(--max)] text-white border-[var(--max)]';
      default: return 'bg-[var(--muted)] text-[var(--text)] border-[var(--border)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-strong)]">{churchData.name}</h2>
            <p className="text-[var(--muted)]">Billing Information</p>
          </div>
          <Badge className={getStatusBadgeVariant()}>
            {churchData.status.charAt(0).toUpperCase() + churchData.status.slice(1)}
          </Badge>
        </div>
      </Card>

      {/* Current Plan Card */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-medium text-[var(--text-strong)] mb-4">Current Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Plan Name</p>
            <p className="font-medium text-[var(--text-strong)]">{churchData.plan.name}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Price</p>
            <p className="font-medium text-[var(--text-strong)]">${churchData.plan.price}/month</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {churchData.plan.features.map((feature, idx) => (
            <li key={idx} className="text-sm text-[var(--text)] list-disc pl-5">• {feature}</li>
          ))}
        </ul>
      </Card>

      {/* Next Invoice Card */}
      {churchData.nextInvoiceDate && (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-medium text-[var(--text-strong)] mb-4">Next Invoice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">Due Date</p>
              <p className="font-medium text-[var(--text-strong)]">{churchData.nextInvoiceDate}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Amount</p>
              <p className="font-medium text-[var(--text-strong)]">${churchData.nextInvoiceAmount?.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions Card */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-medium text-[var(--text-strong)] mb-4">Manage Subscription</h3>

        {/* Change Plan Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-strong)] mb-2">
            Change Plan
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {['Basic', 'Pro', 'Enterprise'].map((planName) => (
              <Button
                key={planName}
                variant="outline"
                size="sm"
                className={`border border-[var(--border)] ${
                  churchData.plan.name === planName ? 'bg-[var(--accent-soft)]' : ''
                }`}
                onClick={() => handlePlanChange(planName.toLowerCase())}
              >
                {planName}
              </Button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Proration will be applied to adjust for the remaining billing period.
          </p>
        </div>

        {/* Pause/Resume Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-strong)] mb-2">
            Pause or Resume Subscription
          </label>
          <div className="flex gap-2">
            {churchData.status !== 'paused' ? (
              <Button
                variant="outline"
                className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                onClick={handlePauseSubscription}
              >
                Pause Subscription
              </Button>
            ) : (
              <Button
                variant="default"
                className="bg-[var(--accent)] hover:bg-[var(--accent-2)]"
                onClick={handleResumeSubscription}
              >
                Resume Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Cancel Section */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-strong)] mb-2">
            Cancel Subscription
          </label>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancel Subscription
          </Button>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      {isCancelDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md">
            <h3 className="font-semibold text-[var(--text-strong)] mb-2">Confirm Cancellation</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              Are you sure you want to cancel this subscription? This action cannot be undone.
            </p>
            <Input
              placeholder="Reason for cancellation (required)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setCancelReason('');
                }}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
              >
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
