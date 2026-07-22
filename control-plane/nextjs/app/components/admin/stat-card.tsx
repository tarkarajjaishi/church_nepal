"use client";

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  accent?: boolean;
}

export default function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  accent = false 
}: StatCardProps) {
  return (
    <div className={`card ${accent ? 'bg-[var(--accent-soft)]' : 'bg-[var(--panel)]'} border border-[var(--border)] rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--text-strong)] mt-1">{value}</p>
        </div>
        {icon && (
          <div className="bg-[var(--accent-soft)] text-[var(--accent)] rounded-lg p-2 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div className="mt-3">
          <Badge 
            variant="outline"
            className={`${trend.value >= 0 ? 'text-[var(--good)] border-[var(--good)]' : 'text-[var(--danger)] border-[var(--danger)]'}`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend.value)}%
            {trend.label && <span className="ml-1">{trend.label}</span>}
          </Badge>
        </div>
      )}
    </div>
  );
}
