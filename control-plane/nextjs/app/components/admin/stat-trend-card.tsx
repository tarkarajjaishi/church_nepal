"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatTrendCardProps {
  label: string;
  value: string;
  delta: number; // percentage change, e.g., 5.2 for +5.2% or -3.1 for -3.1%
  series: number[]; // array of numbers representing the trend data points
}

// Helper to normalize the series for SVG path drawing
const normalizeSeries = (data: number[]): number[] => {
  if (data.length < 2) return data;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero if all values are the same
  return data.map(d => ((d - min) / range));
};

const StatTrendCard: React.FC<StatTrendCardProps> = ({ label, value, delta, series }) => {
  const normalizedData = normalizeSeries(series);

  // Sparkline SVG dimensions
  const width = 100;
  const height = 30;
  const padding = 5;

  // Calculate points for the sparkline path
  let pathData = "";
  if (normalizedData.length > 0) {
    const stepX = (width - 2 * padding) / (normalizedData.length - 1);
    pathData = `M ${padding},${height - padding - normalizedData[0] * (height - 2 * padding)}`;
    for (let i = 1; i < normalizedData.length; i++) {
      const x = padding + i * stepX;
      const y = height - padding - normalizedData[i] * (height - 2 * padding);
      pathData += ` L ${x},${y}`;
    }
  }

  // Determine delta color and icon
  const deltaColor = delta >= 0 ? 'text-[var(--good)]' : 'text-[var(--accent-soft)]';
  const deltaIcon = delta >= 0 ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col">
          <span className="text-sm text-[var(--muted)] mb-1">{label}</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-strong)]">{value}</span>
            <span className={`flex items-center text-sm font-medium ${deltaColor}`}>
              {deltaIcon}
              {Math.abs(delta)}%
            </span>
          </div>
          <div className="mt-3 h-8 flex items-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              <path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--accent)]"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatTrendCard;
