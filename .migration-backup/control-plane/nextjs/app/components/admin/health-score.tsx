'use client';

import { useState } from 'react';
import { InfoIcon } from 'lucide-react';

// Define types
type HealthScoreProps = {
  lastLogin?: string | null;
  lastContentUpdate?: string | null;
  givingActivity?: number | null;
  paymentStatus?: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | null;
};

// Helper function to calculate days since date
const daysSince = (dateStr: string | null | undefined): number => {
  if (!dateStr) return Infinity;
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to determine if a metric is stale
const isStale = (days: number, threshold: number): boolean => {
  return days > threshold;
};

export const HealthScore = ({
  lastLogin,
  lastContentUpdate,
  givingActivity,
  paymentStatus
}: HealthScoreProps) => {
  // Calculate metrics
  const daysSinceLogin = daysSince(lastLogin);
  const daysSinceUpdate = daysSince(lastContentUpdate);

  // Calculate score components (each contributes up to 25 points)
  let loginScore = 25;
  if (isStale(daysSinceLogin, 30)) {
    loginScore = 0;
  } else if (isStale(daysSinceLogin, 14)) {
    loginScore = 10;
  }

  let updateScore = 25;
  if (isStale(daysSinceUpdate, 60)) {
    updateScore = 0;
  } else if (isStale(daysSinceUpdate, 30)) {
    updateScore = 10;
  }

  let givingScore = 25;
  if (givingActivity === null || givingActivity === undefined || givingActivity === 0) {
    givingScore = 0;
  } else if (givingActivity < 50) {
    givingScore = 10;
  } else if (givingActivity < 100) {
    givingScore = 15;
  }

  let paymentScore = 25;
  if (paymentStatus === 'canceled' || paymentStatus === 'past_due') {
    paymentScore = 0;
  } else if (paymentStatus === 'unpaid') {
    paymentScore = 10;
  }

  // Total score
  const totalScore = Math.min(100, Math.max(0, loginScore + updateScore + givingScore + paymentScore));

  // Determine badge style based on score
  let badgeClass = '';
  if (totalScore >= 70) {
    badgeClass = 'bg-[var(--good-soft)] text-[var(--good)] border border-[var(--good)]';
  } else if (totalScore >= 40) {
    badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]';
  } else {
    badgeClass = 'bg-[var(--max)] text-white border border-[var(--max)]';
  }

  // Tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {totalScore}
      </span>
      <button
        className="ml-1 text-[var(--muted)] hover:text-[var(--text)] focus:outline-none"
        onClick={() => setTooltipVisible(!tooltipVisible)}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        aria-label="Health score details"
      >
        <InfoIcon size={14} />
      </button>
      
      {tooltipVisible && (
        <div 
          className="absolute z-10 w-64 p-3 mt-1 text-xs text-[var(--text)] bg-[var(--panel)] border border-[var(--border)] rounded-md shadow-lg"
          role="tooltip"
        >
          <p className="font-semibold mb-1">Health Score Breakdown</p>
          <ul className="space-y-1">
            <li>Login Activity: {loginScore}/25 ({daysSinceLogin <= 14 ? 'Good' : daysSinceLogin <= 30 ? 'Fair' : 'Needs Attention'})</li>
            <li>Content Updates: {updateScore}/25 ({daysSinceUpdate <= 30 ? 'Active' : daysSinceUpdate <= 60 ? 'Moderate' : 'Inactive'})</li>
            <li>Giving Activity: {givingScore}/25 (${givingActivity !== null ? givingActivity : 'None'})</li>
            <li>Payment Status: {paymentScore}/25 ({paymentStatus || 'Unknown'})</li>
          </ul>
        </div>
      )}
    </div>
  );
};
