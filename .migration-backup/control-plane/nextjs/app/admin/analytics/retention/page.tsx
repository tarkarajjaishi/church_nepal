'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Mock data for demonstration
const generateMockRetentionData = () => {
  const plans = ['Basic', 'Standard', 'Premium'];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  return plans.map(plan => ({
    plan,
    cohorts: months.map(month => {
      // Simulate decreasing retention over time
      const baseRetention = 100 - (month * 8);
      const variation = Math.random() * 10 - 5;
      const retention = Math.max(0, baseRetention + variation);
      
      return {
        month,
        retention: parseFloat(retention.toFixed(1)),
        activeUsers: Math.floor(Math.random() * 500) + 50
      };
    })
  }));
};

const generateLTVData = () => {
  return [
    { plan: 'Basic', avgLifetimeMonths: 18.2, avgLTV: 245.50 },
    { plan: 'Standard', avgLifetimeMonths: 24.7, avgLTV: 512.30 },
    { plan: 'Premium', avgLifetimeMonths: 36.5, avgLTV: 1280.75 }
  ];
};

export default function RetentionAnalyticsPage() {
  const [dateRange, setDateRange] = useState('last-90-days');
  const retentionData = generateMockRetentionData();
  const ltvData = generateLTVData();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Cohort Retention & LTV</h1>
        <p className="text-[var(--muted)]">Analyze customer retention patterns and lifetime value metrics</p>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Date Range</label>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[var(--panel)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
          >
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* LTV Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {ltvData.map((item, index) => (
          <Card key={index} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="secondary">{item.plan}</Badge>
              <span className="text-xs text-[var(--muted)]">Monthly</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-[var(--muted)]">Avg. Lifetime</p>
                <p className="text-xl font-semibold text-[var(--text)]">{item.avgLifetimeMonths} mo</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Avg. LTV</p>
                <p className="text-xl font-semibold text-[var(--text)]">${item.avgLTV.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Retention Heatmap */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Cohort Retention Heatmap</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 text-[var(--text)]">Plan</th>
                {[...Array(12)].map((_, i) => (
                  <th key={i} className="p-2 text-center text-xs text-[var(--muted)]">{i + 1}M</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retentionData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 font-medium text-[var(--text)]">{row.plan}</td>
                  {row.cohorts.map((cohort, colIndex) => {
                    // Determine background intensity based on retention percentage
                    const intensity = Math.floor((cohort.retention / 100) * 255);
                    const bgColor = `rgba(34, 197, 94, ${intensity / 255})`; // green scale
                    
                    return (
                      <td key={colIndex} className="p-2 text-center align-top">
                        <div 
                          className="w-10 h-10 flex items-center justify-center text-xs rounded"
                          style={{ backgroundColor: bgColor }}
                        >
                          <span className="text-white font-medium">{cohort.retention}%</span>
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1">
                          {cohort.activeUsers}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Retention Curve Chart */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Retention Curve by Plan</h2>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-[var(--muted)]">
            <svg width="400" height="200" viewBox="0 0 400 200" className="mx-auto">
              {/* Axes */}
              <line x1="50" y1="180" x2="380" y2="180" stroke="var(--border)" strokeWidth="1" />
              <line x1="50" y1="20" x2="50" y2="180" stroke="var(--border)" strokeWidth="1" />
              
              {/* Labels */}
              <text x="200" y="195" textAnchor="middle" fill="var(--text)" fontSize="12">Months</text>
              <text x="15" y="100" textAnchor="middle" fill="var(--text)" fontSize="12" transform="rotate(-90, 15, 100)">Retention %</text>
              
              {/* Sample curves for each plan */}
              {/* Basic Plan */}
              <path d="M50,180 C100,160 150,140 200,120 C250,100 300,80 350,60" stroke="#3b82f6" strokeWidth="2" fill="none" />
              <circle cx="50" cy="180" r="3" fill="#3b82f6" />
              <circle cx="100" cy="160" r="3" fill="#3b82f6" />
              <circle cx="150" cy="140" r="3" fill="#3b82f6" />
              <circle cx="200" cy="120" r="3" fill="#3b82f6" />
              <circle cx="250" cy="100" r="3" fill="#3b82f6" />
              <circle cx="300" cy="80" r="3" fill="#3b82f6" />
              <circle cx="350" cy="60" r="3" fill="#3b82f6" />
              
              {/* Standard Plan */}
              <path d="M50,170 C100,150 150,130 200,110 C250,90 300,70 350,50" stroke="#10b981" strokeWidth="2" fill="none" />
              <circle cx="50" cy="170" r="3" fill="#10b981" />
              <circle cx="100" cy="150" r="3" fill="#10b981" />
              <circle cx="150" cy="130" r="3" fill="#10b981" />
              <circle cx="200" cy="110" r="3" fill="#10b981" />
              <circle cx="250" cy="90" r="3" fill="#10b981" />
              <circle cx="300" cy="70" r="3" fill="#10b981" />
              <circle cx="350" cy="50" r="3" fill="#10b981" />
              
              {/* Premium Plan */}
              <path d="M50,160 C100,140 150,120 200,100 C250,80 300,60 350,40" stroke="#8b5cf6" strokeWidth="2" fill="none" />
              <circle cx="50" cy="160" r="3" fill="#8b5cf6" />
              <circle cx="100" cy="140" r="3" fill="#8b5cf6" />
              <circle cx="150" cy="120" r="3" fill="#8b5cf6" />
              <circle cx="200" cy="100" r="3" fill="#8b5cf6" />
              <circle cx="250" cy="80" r="3" fill="#8b5cf6" />
              <circle cx="300" cy="60" r="3" fill="#8b5cf6" />
              <circle cx="350" cy="40" r="3" fill="#8b5cf6" />
            </svg>
            
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                <span className="text-sm">Basic</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></div>
                <span className="text-sm">Standard</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6] mr-2"></div>
                <span className="text-sm">Premium</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
