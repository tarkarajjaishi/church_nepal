"use client";

import { Card, CardContent } from "@/components/ui/card";

const FunnelWidget = () => {
  // Sample data for the funnel
  const funnelData = [
    { stage: 'Visitors', count: 12500, percentage: 100 },
    { stage: 'Signups', count: 3125, percentage: 25 },
    { stage: 'Active', count: 1875, percentage: 60 },
    { stage: 'Paid', count: 656, percentage: 35 },
  ];

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0 pt-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-strong)]">Growth Funnel</h3>
          <p className="text-sm text-[var(--muted)]">Track users through key stages</p>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-6">
          {funnelData.map((item, index) => (
            <div key={item.stage} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[var(--text-strong)]">{item.stage}</span>
                <span className="font-semibold text-[var(--text-strong)]">{item.count.toLocaleString()}</span>
              </div>
              
              {/* Bar representing the funnel width */}
              <div className="w-full bg-[var(--panel-2)] rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-[var(--accent)] h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ease-out"
                  style={{ width: `${item.percentage}%` }}
                >
                  {/* Percentage label inside the bar for the first item */}
                  {index === 0 && (
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {item.percentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion rate from previous stage */}
              {index > 0 && (
                <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                  <span>Conversion: {(funnelData[index - 1].percentage * item.percentage / 100).toFixed(1)}% of previous</span>
                  <span>{(item.count / funnelData[0].count * 100).toFixed(1)}% of visitors</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-soft)]">
          <div className="text-center">
            <p className="text-sm text-[var(--muted)]">Total Visitors</p>
            <p className="text-xl font-bold text-[var(--text-strong)]">{funnelData[0].count.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--muted)]">Final Conversion</p>
            <p className="text-xl font-bold text-[var(--good)]">{(funnelData[funnelData.length - 1].count / funnelData[0].count * 100).toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FunnelWidget;
