'use client';

import React from 'react';

interface QuotaGaugeProps {
  used: number; // in MB
  limit: number; // in MB
  className?: string;
}

const QuotaGauge: React.FC<QuotaGaugeProps> = ({ used, limit, className = '' }) => {
  const percentage = Math.min(100, Math.max(0, (used / limit) * 100));
  
  let barColor = 'var(--accent)';
  if (percentage >= 90) {
    barColor = 'var(--good)';
  } else if (percentage >= 75) {
    barColor = 'var(--accent-2)';
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-32 h-2.5 bg-[var(--panel-2)] rounded-full overflow-hidden mr-3">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        ></div>
      </div>
      <span className="text-sm text-[var(--text)] whitespace-nowrap">
        {(used / 1024).toFixed(2)}GB / {(limit / 1024).toFixed(2)}GB
      </span>
    </div>
  );
};

export default QuotaGauge;
