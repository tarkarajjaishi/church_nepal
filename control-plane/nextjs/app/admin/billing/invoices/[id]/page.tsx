'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Mock data - replace with real API calls
const mockInvoice = {
  id: 'inv_12345',
  number: 'INV-2026-001',
  status: 'paid', // paid, unpaid, refunded, partially_refunded
  issueDate: '2026-07-15',
  dueDate: '2026-08-15',
  currency: 'USD',
  total: 29900, // in cents
  subtotal: 29900,
  tax: 0,
  discount: 0,
  description: 'Monthly subscription',
  customerName: 'Grace Community Church',
  customerId: 'ch_abc123',
  items: [
    {
      id: 'item_1',
      name: 'Standard Plan',
      description: 'Basic features for small churches',
      quantity: 1,
      unitAmount: 29900,
    },
  ],
  paymentMethod: 'Visa ending in 4242',
  transactionId: 'txn_xyz789',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refundAmount, setRefundAmount] = useState('');
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  useEffect(() => {
    // Simulate fetching invoice data
    setTimeout(() => {
      setInvoice(mockInvoice);
      setLoading(false);
    }, 500);
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[var(--panel-2)] rounded w-1/4"></div>
            <div className="h-4 bg-[var(--panel-2)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--panel-2)] rounded w-full"></div>
            <div className="h-4 bg-[var(--panel-2)] rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <h1 className="text-xl font-semibold">Invoice Not Found</h1>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleResend = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invoice resent successfully');
    } catch (error) {
      toast.error('Failed to resend invoice');
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Refund of $${parseFloat(refundAmount).toFixed(2)} processed`);
      setShowRefundDialog(false);
      setRefundAmount('');
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-[var(--muted)]">
        <button 
          onClick={() => router.push('/admin/billing')}
          className="hover:text-[var(--text)] transition-colors"
        >
          Billing
        </button>
        <span>/</span>
        <button 
          onClick={() => router.push('/admin/billing/invoices')}
          className="hover:text-[var(--text)] transition-colors"
        >
          Invoices
        </button>
        <span>/</span>
        <span>{invoice.number}</span>
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Invoice #{invoice.number}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge 
                variant={invoice.status === 'paid' ? 'default' : 
                         invoice.status === 'refunded' ? 'secondary' : 
                         'outline'}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              <span className="text-[var(--muted)]">
                Issued: {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleResend}>
              Resend
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowRefundDialog(true)}
            >
              Refund
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="font-semibold mb-2">Bill To</h2>
            <p className="text-[var(--text)]">{invoice.customerName}</p>
            <p className="text-[var(--muted)]">ID: {invoice.customerId}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Payment Method</h2>
            <p className="text-[var(--text)]">{invoice.paymentMethod}</p>
            <p className="text-[var(--muted)]">Transaction ID: {invoice.transactionId}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-soft)]">
                <th className="text-left py-2 text-[var(--muted)]">Item</th>
                <th className="text-right py-2 text-[var(--muted)]">Quantity</th>
                <th className="text-right py-2 text-[var(--muted)]">Unit Price</th>
                <th className="text-right py-2 text-[var(--muted)]">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any) => (
                <tr key={item.id} className="border-b border-[var(--border-soft)]">
                  <td className="py-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-[var(--muted)]">{item.description}</div>
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitAmount)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitAmount * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Tax:</span>
                <span>+{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[var(--border-soft)] font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Refund Dialog */}
      {showRefundDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Process Refund</h2>
            <p className="text-[var(--muted)] mb-4">
              Enter the amount to refund for invoice {invoice.number}
            </p>
            
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={formatCurrency(invoice.total).replace(/[^0-9.]/g, '')}
              placeholder="Enter refund amount"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRefundDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRefundSubmit}
              >
                Process Refund
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
