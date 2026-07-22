'use client';

import React from 'react';

interface BarChartProps {
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
  valueFormatter?: (value: number) => string;
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  className = '', 
  valueFormatter = (v) => v.toString() 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 ${className}`}>
        <p className="text-[var(--muted)]">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value), 0);
  
  // Avoid division by zero if all values are zero
  const safeMaxValue = maxValue === 0 ? 1 : maxValue;

  return (
    <div className={`bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 ${className}`}>
      <ul className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / safeMaxValue) * 100;
          
          return (
            <li key={index} className="flex items-center gap-3">
              <span className="w-1/3 text-[var(--text)] truncate">{item.label}</span>
              
              <div className="relative flex-1 h-6 min-w-0">
                {/* Background track */}
                <div 
                  className="absolute inset-0 bg-[var(--muted)]/20 rounded-full"
                  aria-hidden="true"
                />
                
                {/* Progress bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  role="progressbar"
                />
              </div>
              
              <span className="w-16 text-right text-[var(--text)] font-medium">
                {valueFormatter(item.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BarChart;
