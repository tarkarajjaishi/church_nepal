'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Define types for our feature flag system
type TargetType = 'all' | 'plan' | 'rollout' | 'church';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  target: TargetType;
  targetValue?: string | number; // Plan ID, Church ID, or rollout percentage
}

const initialFlags: FeatureFlag[] = [
  {
    id: 'new_ui',
    name: 'New User Interface',
    description: 'Enable the redesigned dashboard interface.',
    enabled: true,
    target: 'all',
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Access to enhanced reporting and analytics tools.',
    enabled: false,
    target: 'plan',
    targetValue: 'premium',
  },
  {
    id: 'beta_features',
    name: 'Beta Features',
    description: 'Early access to experimental features.',
    enabled: false,
    target: 'rollout',
    targetValue: 10,
  },
  {
    id: 'custom_domains',
    name: 'Custom Domains',
    description: 'Allow custom domain setup for church websites.',
    enabled: true,
    target: 'plan',
    targetValue: 'pro',
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlags = flags.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id: string) => {
    setFlags(prev =>
      prev.map(flag => 
        flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
      )
    );
    toast.success('Flag updated');
  };

  const handleTargetChange = (id: string, target: TargetType, value?: string | number) => {
    setFlags(prev =>
      prev.map(flag => 
        flag.id === id ? { ...flag, target, targetValue: value } : flag
      )
    );
    toast.info('Target updated');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Feature Flags</h1>
        <p className="text-[var(--muted)] mt-2">
          Configure feature availability for different plans and churches
        </p>
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <Input
          placeholder="Search features..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-[var(--border)]">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left text-[var(--muted)] font-medium">Feature</th>
              <th className="py-3 px-4 text-left text-[var(--muted)] font-medium">Description</th>
              <th className="py-3 px-4 text-left text-[var(--muted)] font-medium">Status</th>
              <th className="py-3 px-4 text-left text-[var(--muted)] font-medium">Target</th>
              <th className="py-3 px-4 text-right text-[var(--muted)] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {filteredFlags.map((flag) => (
              <tr key={flag.id} className="hover:bg-[var(--panel-2)] transition-colors">
                <td className="py-3 px-4 font-medium text-[var(--text-strong)]">{flag.name}</td>
                <td className="py-3 px-4 text-[var(--text)]">{flag.description}</td>
                <td className="py-3 px-4">
                  <Badge variant={flag.enabled ? "default" : "secondary"}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={flag.target}
                    onChange={(e) => handleTargetChange(flag.id, e.target.value as TargetType)}
                    className="bg-[var(--panel-2)] border border-[var(--border)] rounded-md px-2 py-1 text-sm"
                  >
                    <option value="all">All Churches</option>
                    <option value="plan">Specific Plan</option>
                    <option value="rollout">Rollout Percentage</option>
                    <option value="church">Specific Church</option>
                  </select>
                  
                  {(flag.target === 'plan' || flag.target === 'church') && (
                    <input
                      type="text"
                      placeholder="Plan/Church ID"
                      value={flag.targetValue?.toString() || ''}
                      onChange={(e) => handleTargetChange(flag.id, flag.target, e.target.value)}
                      className="mt-1 w-full bg-[var(--panel-2)] border border-[var(--border)] rounded-md px-2 py-1 text-sm"
                    />
                  )}
                  
                  {flag.target === 'rollout' && (
                    <div className="flex items-center mt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={flag.targetValue as number || 0}
                        onChange={(e) => handleTargetChange(flag.id, flag.target, parseInt(e.target.value))}
                        className="w-20 bg-[var(--panel-2)] border border-[var(--border)] rounded-md px-2 py-1 text-sm"
                      />
                      <span className="ml-2 text-sm text-[var(--muted)]">%</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    onClick={() => handleToggle(flag.id)}
                    variant={flag.enabled ? "outline" : "default"}
                    size="sm"
                  >
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
