"use client";

import { Card, CardContent } from "@/components/ui/card";

// Helper to generate sample MRR data over 12 months
const generateMrrData = () => {
  const now = new Date();
  const data = [];
  let baseValue = 12000;
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Add some variation to make it look realistic
    const value = baseValue + Math.floor(Math.random() * 2000) - 800;
    baseValue = value > 0 ? value : baseValue;
    data.push({
      date: date.toISOString().split('T')[0],
      mrr: Math.max(0, value)
    });
  }
  return data;
};

const RevenueWidget = () => {
  const data = generateMrrData();
  const currentMrr = data[data.length - 1].mrr;
  const previousMrr = data.length > 1 ? data[data.length - 2].mrr : 0;
  const changePercent = previousMrr !== 0 ? ((currentMrr - previousMrr) / previousMrr) * 100 : 0;

  // Prepare SVG points for the chart
  const maxValue = Math.max(...data.map(d => d.mrr));
  const padding = 20;
  const width = 300;
  const height = 100;
  const xStep = (width - 2 * padding) / (data.length - 1);
  
  let pathD = `M ${padding} ${height - padding}`;
  data.forEach((d, i) => {
    const x = padding + i * xStep;
    const y = height - padding - (d.mrr / maxValue) * (height - 2 * padding);
    pathD += ` L ${x} ${y}`;
  });
  pathD += ` L ${padding + (data.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-[var(--muted)]">Monthly Recurring Revenue</h3>
              <p className="text-2xl font-bold text-[var(--text-strong)]">${currentMrr.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              {changePercent >= 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
              )}
              <span className={`text-sm font-medium ${changePercent >= 0 ? 'text-[var(--good)]' : 'text-red-500'}`}>
                {Math.abs(changePercent).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="relative h-24 w-full">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
              {/* Area fill */}
              <path d={pathD} fill="url(#gradient)" />
              
              {/* Line stroke */}
              <path 
                d={pathD.replace(' Z', '')} 
                fill="none" 
                stroke="var(--accent)" 
                strokeWidth="2"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="flex justify-between text-xs text-[var(--muted)]">
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
            <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueWidget;
