"use client";

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ open, onClose, onApply }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // Sample data for filters
  const plans = [
    { id: 'free', label: 'Free' },
    { id: 'basic', label: 'Basic' },
    { id: 'pro', label: 'Pro' },
    { id: 'enterprise', label: 'Enterprise' },
  ];

  const statuses = [
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'trial', label: 'Trial' },
  ];

  // State for filters
  const [selectedPlans, setSelectedPlans] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [storageRange, setStorageRange] = React.useState({ min: '', max: '' });

  const handlePlanChange = (planId: string) => {
    setSelectedPlans(prev =>
      prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]
    );
  };

  const handleStatusChange = (statusId: string) => {
    setSelectedStatuses(prev =>
      prev.includes(statusId) ? prev.filter(id => id !== statusId) : [...prev, statusId]
    );
  };

  const handleApply = () => {
    const filters = {
      plans: selectedPlans,
      statuses: selectedStatuses,
      dateRange,
      storageRange,
    };
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setSelectedPlans([]);
    setSelectedStatuses([]);
    setDateRange({ start: '', end: '' });
    setStorageRange({ min: '', max: '' });
    onApply({
      plans: [],
      statuses: [],
      dateRange: { start: '', end: '' },
      storageRange: { min: '', max: '' },
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-[var(--panel)] shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">Filters</h2>
            <button 
              onClick={onClose}
              className="text-[var(--text)] hover:text-[var(--text-strong)] focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[var(--text-strong)] mb-3">Plan</h3>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <Button
                      key={plan.id}
                      variant="outline"
                      size="sm"
                      className={`${
                        selectedPlans.includes(plan.id)
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-transparent border-[var(--border)] text-[var(--text)]'
                      }`}
                      onClick={() => handlePlanChange(plan.id)}
                    >
                      {plan.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[var(--text-strong)] mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.map((status) => (
                    <Button
                      key={status.id}
                      variant="outline"
                      size="sm"
                      className={`${
                        selectedStatuses.includes(status.id)
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-transparent border-[var(--border)] text-[var(--text)]'
                      }`}
                      onClick={() => handleStatusChange(status.id)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[var(--text-strong)] mb-3">Created Date Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--text)] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text)] mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[var(--text-strong)] mb-3">Storage (GB)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--text)] mb-1">Min</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={storageRange.min}
                      onChange={(e) => setStorageRange({...storageRange, min: e.target.value})}
                      className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text)] mb-1">Max</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={storageRange.max}
                      onChange={(e) => setStorageRange({...storageRange, max: e.target.value})}
                      className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Footer */}
          <div className="p-5 border-t border-[var(--border)] flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
            >
              Reset
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
