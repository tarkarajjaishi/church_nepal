'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CouponModal } from '@/components/admin/coupon-modal';
import { toast } from 'sonner';

const TrashIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.342.052.682.107 1.022.166m0 0l1.588 4.915M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PencilIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21h-4.125A2.25 2.25 0 019.375 18.75v-2.25c0-1.621 1.344-2.948 2.958-2.958l.555-.586m-7.5-2.25L13.5 4.875m0 0l1.5 1.5M12 7.5h3m-3 4.5H9" />
  </svg>
);

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// Define the Coupon type
type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  expiresAt: string | null; // ISO string
  isActive: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Load coupons from backend
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        // Simulating API call - replace with real endpoint when available
        const response = await fetch('/api/admin/coupons');
        if (!response.ok) throw new Error('Failed to fetch coupons');
        const data = await response.json();
        setCoupons(data);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        toast.error('Failed to load coupons');
        // Mock data for now
        setCoupons([
          {
            id: '1',
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            maxRedemptions: 100,
            currentRedemptions: 23,
            expiresAt: '2025-12-31T23:59:59Z',
            isActive: true,
          },
          {
            id: '2',
            code: 'FALL20FIXED',
            type: 'fixed',
            value: 50,
            maxRedemptions: 50,
            currentRedemptions: 30,
            expiresAt: '2024-11-30T23:59:59Z',
            isActive: true,
          },
          {
            id: '3',
            code: 'EXPIRED50',
            type: 'percentage',
            value: 50,
            maxRedemptions: 10,
            currentRedemptions: 10,
            expiresAt: '2023-12-31T23:59:59Z',
            isActive: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleSaveCoupon = async (couponData: Omit<Coupon, 'id' | 'currentRedemptions'> & { id?: string }) => {
    try {
      let updatedCoupons;
      if (couponData.id) {
        // Update existing coupon
        const response = await fetch(`/api/admin/coupons/${couponData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(couponData),
        });
        if (!response.ok) throw new Error('Failed to update coupon');

        updatedCoupons = coupons.map(c => c.id === couponData.id ? { ...c, ...couponData as Coupon } : c);
        toast.success('Coupon updated successfully');
      } else {
        // Create new coupon
        const response = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(couponData),
        });
        if (!response.ok) throw new Error('Failed to create coupon');

        const newCoupon = { 
          ...couponData, 
          id: `new-${Date.now()}`, 
          currentRedemptions: 0 
        } as Coupon;
        updatedCoupons = [...coupons, newCoupon];
        toast.success('Coupon created successfully');
      }

      setCoupons(updatedCoupons);
      setShowModal(false);
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(`Failed to ${couponData.id ? 'update' : 'create'} coupon`);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // In a real app, we would make an API call to toggle the status
      const updatedCoupons = coupons.map(coupon =>
        coupon.id === id ? { ...coupon, isActive: !currentStatus } : coupon
      );
      setCoupons(updatedCoupons);
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast.error('Failed to update coupon status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      // In a real app, we would make an API call to delete the coupon
      const updatedCoupons = coupons.filter(coupon => coupon.id !== id);
      setCoupons(updatedCoupons);
      toast.success('Coupon deleted successfully');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setShowModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="animate-pulse h-8 w-48 bg-[var(--panel-2)] rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border-soft)]">
                <div className="h-4 bg-[var(--panel-2)] rounded w-1/4"></div>
                <div className="h-4 bg-[var(--panel-2)] rounded w-1/6"></div>
                <div className="h-4 bg-[var(--panel-2)] rounded w-1/6"></div>
                <div className="h-4 bg-[var(--panel-2)] rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Coupons & Discounts</h1>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-soft)]">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Value</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Max Redemptions</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Expires</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Uses</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[var(--text)]">{coupon.code}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)] capitalize">{coupon.type}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">
                    {coupon.maxRedemptions ? coupon.maxRedemptions : 'Unlimited'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">
                    {formatDate(coupon.expiresAt)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">
                    {coupon.currentRedemptions}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      coupon.isActive 
                        ? 'bg-[var(--good-soft)] text-[var(--good)]' 
                        : 'bg-[var(--panel-2)] text-[var(--muted)]'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(coupon)}
                        className="text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                        className={coupon.isActive ? 'text-[var(--muted)] hover:bg-[var(--panel-2)]' : 'text-[var(--accent)] hover:bg-[var(--accent-soft)]'}
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            No coupons found. Create your first coupon to get started.
          </div>
        )}
      </Card>

      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          onSave={handleSaveCoupon}
          onClose={() => {
            setShowModal(false);
            setEditingCoupon(null);
          }}
        />
      )}
    </div>
  );
}
