"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react';

// Define types
type Feature = {
  id: string;
  name: string;
};

type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[]; // IDs of enabled features
};

const PlanEditor = () => {
  // Initial features list
  const initialFeatures: Feature[] = [
    { id: 'unlimited-members', name: 'Unlimited Members' },
    { id: 'events-calendar', name: 'Events Calendar' },
    { id: 'donations', name: 'Online Donations' },
    { id: 'groups', name: 'Small Groups' },
    { id: 'media-gallery', name: 'Media Gallery' },
    { id: 'sermons', name: 'Sermon Uploads' },
    { id: 'custom-domain', name: 'Custom Domain' },
    { id: 'analytics', name: 'Advanced Analytics' },
    { id: 'crm', name: 'Member CRM' },
    { id: 'bulk-email', name: 'Bulk Email Campaigns' },
  ];

  // Initial plans data
  const initialPlans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      features: ['unlimited-members', 'events-calendar', 'donations'],
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'Best for growing churches',
      monthlyPrice: 29,
      features: initialFeatures.map(f => f.id), // All features for demo
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For larger organizations',
      monthlyPrice: 79,
      features: initialFeatures.map(f => f.id), // All features for demo
    },
  ];

  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [newPlanName, setNewPlanName] = useState<string>('');

  const handlePriceChange = (planId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, monthlyPrice: numValue } : plan
    ));
  };

  const toggleFeature = (planId: string, featureId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      
      const hasFeature = plan.features.includes(featureId);
      const updatedFeatures = hasFeature
        ? plan.features.filter(id => id !== featureId)
        : [...plan.features, featureId];

      return { ...plan, features: updatedFeatures };
    }));
  };

  const addNewPlan = () => {
    if (!newPlanName.trim()) return;

    const newPlan: Plan = {
      id: `custom-${Date.now()}`,
      name: newPlanName.trim(),
      description: 'Custom plan',
      monthlyPrice: 0,
      features: [],
    };

    setPlans(prev => [...prev, newPlan]);
    setNewPlanName('');
  };

  const saveChanges = () => {
    // In a real app, this would call an API
    console.log('Saving plans:', plans);
    alert('Plans updated successfully!');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Plans</h2>
        <Button onClick={saveChanges}>
          Save Changes
        </Button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col"
          >
            <CardContent className="p-5 flex-grow flex flex-col">
              <div className="mb-4">
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => {}}
                  className="w-full bg-transparent border-b border-[var(--border-soft)] pb-1 mb-1 focus:outline-none focus:border-[var(--accent)]"
                  readOnly
                />
                <p className="text-sm text-[var(--muted)]">{plan.description}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plan.monthlyPrice}
                  onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                  className="w-full p-2 bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="space-y-2">
                  {initialFeatures.map((feature) => (
                    <li key={`${plan.id}-${feature.id}`} className="flex items-center justify-between">
                      <span className="text-sm">{feature.name}</span>
                      <button
                        onClick={() => toggleFeature(plan.id, feature.id)}
                        className={`p-1 rounded-full ${plan.features.includes(feature.id) ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
                      >
                        {plan.features.includes(feature.id) ? (
                          <CheckIcon size={16} />
                        ) : (
                          <XIcon size={16} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Plan Card */}
        <Card className="bg-[var(--panel-2)] border border-dashed border-[var(--border-soft)] rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-[var(--panel-3)] transition-colors">
          <CardContent className="p-0 flex flex-col items-center justify-center text-center">
            <PlusIcon className="w-8 h-8 mb-2 text-[var(--accent)]" />
            <h3 className="font-medium mb-1">Add New Plan</h3>
            <p className="text-xs text-[var(--muted)] mb-3">Create a custom pricing tier</p>
            
            <div className="w-full max-w-xs space-y-2">
              <input
                type="text"
                placeholder="Plan name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full p-2 bg-[var(--panel)] border border-[var(--border-soft)] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={addNewPlan}
                disabled={!newPlanName.trim()}
                className="w-full"
              >
                Create Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <div className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-xl p-4">
        <h3 className="font-medium mb-2">Summary</h3>
        <p className="text-sm text-[var(--muted)]">
          You have {plans.length} active plans. Changes will apply immediately.
        </p>
      </div>
    </div>
  );
};

export default PlanEditor;
