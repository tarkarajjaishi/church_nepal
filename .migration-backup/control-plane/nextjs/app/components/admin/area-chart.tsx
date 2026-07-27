"use client";

import React from 'react';

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({ 
  data, 
  height = 200, 
  className = '' 
}) => {
  if (data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} 
             preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y={height/2} textAnchor="middle" fill="var(--muted)" fontSize="12">
            No data available
          </text>
        </svg>
      </div>
    );
  }

  // Calculate dimensions
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = 100 - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Find min/max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1; // Avoid division by zero if all values are the same

  // Generate path points
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    // Invert Y since SVG origin is top-left
    const y = paddingY + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, label: d.label };
  });

  // Generate area path
  let areaPath = `M ${paddingX} ${paddingY + chartHeight}`; // Start at bottom left
  points.forEach(point => {
    areaPath += ` L ${point.x} ${point.y}`;
  });
  areaPath += ` L ${points[points.length - 1].x} ${paddingY + chartHeight}`; // Close at bottom right
  areaPath += ` Z`; // Close path

  // Generate line path
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  return (
    <div className={`w-full ${className}`}>
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line 
          x1={paddingX} 
          y1={paddingY + chartHeight} 
          x2={100 - paddingX} 
          y2={paddingY + chartHeight} 
          stroke="var(--border)" 
          strokeWidth="0.2"
        />

        {/* Area */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="0.5" />

        {/* Data points */}
        {points.map((point, index) => (
          <circle 
            key={index}
            cx={point.x}
            cy={point.y}
            r="0.8"
            fill="var(--accent)"
          />
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - 2}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="2"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default AreaChart;
