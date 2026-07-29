'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

// Define the Coupon type
type Coupon = {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxRedemptions: number | null;
  expiresAt: string | null; // ISO string
  isActive: boolean;
};

type CouponModalProps = {
  coupon: Coupon | null;
  onSave: (coupon: Omit<Coupon, 'id' | 'currentRedemptions'> & { id?: string }) => void;
  onClose: () => void;
};

export function CouponModal({ coupon, onSave, onClose }: CouponModalProps) {
  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'currentRedemptions'>>({
    code: '',
    type: 'percentage',
    value: 0,
    maxRedemptions: null,
    expiresAt: null,
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxRedemptions: coupon.maxRedemptions,
        expiresAt: coupon.expiresAt,
        isActive: coupon.isActive,
      });
    } else {
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        maxRedemptions: null,
        expiresAt: null,
        isActive: true,
      });
    }
  }, [coupon]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxRedemptions' || name === 'value' 
        ? value === '' ? null : Number(value) 
        : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      expiresAt: value || null
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Use only letters, numbers, hyphens, and underscores';
    }
    
    if (formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    } else if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }
    
    if (formData.maxRedemptions !== null && formData.maxRedemptions <= 0) {
      newErrors.maxRedemptions = 'Max redemptions must be greater than 0';
    }
    
    if (formData.expiresAt && new Date(formData.expiresAt) < new Date()) {
      newErrors.expiresAt = 'Expiration date cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        id: coupon?.id
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl w-full max-w-md">
        <div className="p-5 border-b border-[var(--border-soft)] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Coupon Code *
            </label>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. WELCOME10"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.type === 'percentage' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('percentage')}
                className={`${
                  formData.type === 'percentage' 
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white' 
                    : 'border-[var(--border)]'
                }`}
              >
                Percentage
              </Button>
              <Button
                type="button"
                variant={formData.type === 'fixed' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('fixed')}
                className={`${
                  formData.type === 'fixed' 
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white' 
                    : 'border-[var(--border)]'
                }`}
              >
                Fixed Amount
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Discount Value *
            </label>
            <div className="relative">
              <Input
                name="value"
                type="number"
                min="0"
                step="any"
                value={formData.value ?? ''}
                onChange={handleChange}
                className={`pl-10 ${errors.value ? 'border-red-500' : ''}`}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[var(--muted)] text-sm">
                  {formData.type === 'percentage' ? '%' : 'Rs.'}
                </span>
              </div>
            </div>
            {errors.value && <p className="mt-1 text-xs text-red-500">{errors.value}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Max Redemptions (optional)
            </label>
            <Input
              name="maxRedemptions"
              type="number"
              min="1"
              value={formData.maxRedemptions ?? ''}
              onChange={handleChange}
              placeholder="Leave blank for unlimited"
              className={errors.maxRedemptions ? 'border-red-500' : ''}
            />
            {errors.maxRedemptions && <p className="mt-1 text-xs text-red-500">{errors.maxRedemptions}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Expiration Date (optional)
            </label>
            <Input
              type="date"
              value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
              onChange={handleExpiryChange}
              className={errors.expiresAt ? 'border-red-500' : ''}
            />
            {errors.expiresAt && <p className="mt-1 text-xs text-red-500">{errors.expiresAt}</p>}
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {coupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
