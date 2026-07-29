'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MrrMovement {
  month: string;
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnMrr: number;
  endingMrr: number;
}

const generateSampleData = (): MrrMovement => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Generate sample data
  const startingMrr = Math.floor(Math.random() * 50000) + 30000; // 30k-80k
  const newMrr = Math.floor(Math.random() * 10000) + 5000; // 5k-15k
  const expansionMrr = Math.floor(Math.random() * 8000) + 2000; // 2k-10k
  const contractionMrr = Math.floor(Math.random() * 5000) + 1000; // 1k-6k
  const churnMrr = Math.floor(Math.random() * 7000) + 1000; // 1k-8k
  const endingMrr = startingMrr + newMrr + expansionMrr - contractionMrr - churnMrr;

  return {
    month: months[Math.floor(Math.random() * 12)],
    startingMrr,
    newMrr,
    expansionMrr,
    contractionMrr,
    churnMrr,
    endingMrr
  };
};

export default function MrrWaterfall() {
  const [data] = useState<MrrMovement>(generateSampleData());
  const [selectedMonth, setSelectedMonth] = useState(data.month);

  // Calculate total change
  const totalChange = data.newMrr + data.expansionMrr - data.contractionMrr - data.churnMrr;
  const endingMrrCalculated = data.startingMrr + totalChange;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate percentages for visualization
  const maxBarValue = Math.max(
    Math.abs(data.startingMrr),
    Math.abs(data.newMrr),
    Math.abs(data.expansionMrr),
    Math.abs(data.contractionMrr),
    Math.abs(data.churnMrr),
    Math.abs(endingMrrCalculated)
  );

  const barHeight = 200; // Max height for bars
  const startingBarHeight = (Math.abs(data.startingMrr) / maxBarValue) * barHeight;
  const newBarHeight = (Math.abs(data.newMrr) / maxBarValue) * barHeight;
  const expansionBarHeight = (Math.abs(data.expansionMrr) / maxBarValue) * barHeight;
  const contractionBarHeight = (Math.abs(data.contractionMrr) / maxBarValue) * barHeight;
  const churnBarHeight = (Math.abs(data.churnMrr) / maxBarValue) * barHeight;
  const endingBarHeight = (Math.abs(endingMrrCalculated) / maxBarValue) * barHeight;

  // Months for dropdown
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">MRR Movement Waterfall</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm text-[var(--muted)]">Month:</label>
          <select 
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[var(--panel-2)] border border-[var(--border)] rounded-md px-3 py-1 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--panel-2)] rounded-lg p-3 text-center">
          <p className="text-xs text-[var(--muted)]">New MRR</p>
          <p className="font-medium text-[var(--good)]">{formatCurrency(data.newMrr)}</p>
        </div>
        <div className="bg-[var(--panel-2)] rounded-lg p-3 text-center">
          <p className="text-xs text-[var(--muted)]">Expansion</p>
          <p className="font-medium text-[var(--good)]">{formatCurrency(data.expansionMrr)}</p>
        </div>
        <div className="bg-[var(--panel-2)] rounded-lg p-3 text-center">
          <p className="text-xs text-[var(--muted)]">Contraction</p>
          <p className="font-medium text-[var(--accent-soft)]">{formatCurrency(data.contractionMrr)}</p>
        </div>
        <div className="bg-[var(--panel-2)] rounded-lg p-3 text-center">
          <p className="text-xs text-[var(--muted)]">Churn</p>
          <p className="font-medium text-[var(--accent-soft)]">{formatCurrency(data.churnMrr)}</p>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="flex flex-col items-center">
        <div className="w-full overflow-x-auto pb-4">
          <svg width="100%" height="300" viewBox={`0 0 ${600} 300`} className="min-w-[500px]">
            {/* Starting MRR */}
            <g transform="translate(50, 100)">
              <rect x="0" y={barHeight - startingBarHeight} width="60" height={startingBarHeight} fill="var(--accent)" />
              <text x="30" y={barHeight - startingBarHeight - 10} textAnchor="middle" fill="var(--text)" fontSize="12">
                {formatCurrency(data.startingMrr)}
              </text>
              <text x="30" y={barHeight + 20} textAnchor="middle" fill="var(--muted)" fontSize="12">Starting</text>
            </g>

            {/* New MRR */}
            <g transform="translate(130, 100)">
              <rect x="0" y={barHeight - newBarHeight} width="60" height={newBarHeight} fill="var(--good)" />
              <text x="30" y={barHeight - newBarHeight - 10} textAnchor="middle" fill="var(--text)" fontSize="12">
                +{formatCurrency(data.newMrr)}
              </text>
              <text x="30" y={barHeight + 20} textAnchor="middle" fill="var(--muted)" fontSize="12">New</text>
            </g>

            {/* Expansion MRR */}
            <g transform="translate(210, 100)">
              <rect x="0" y={barHeight - expansionBarHeight} width="60" height={expansionBarHeight} fill="var(--good)" />
              <text x="30" y={barHeight - expansionBarHeight - 10} textAnchor="middle" fill="var(--text)" fontSize="12">
                +{formatCurrency(data.expansionMrr)}
              </text>
              <text x="30" y={barHeight + 20} textAnchor="middle" fill="var(--muted)" fontSize="12">Expansion</text>
            </g>

            {/* Contraction MRR */}
            <g transform="translate(290, 100)">
              <rect x="0" y="100" width="60" height={contractionBarHeight} fill="var(--accent-soft)" />
              <text x="30" y="90" textAnchor="middle" fill="var(--text)" fontSize="12">
                -{formatCurrency(data.contractionMrr)}
              </text>
              <text x="30" y="170" textAnchor="middle" fill="var(--muted)" fontSize="12">Contraction</text>
            </g>

            {/* Churn MRR */}
            <g transform="translate(370, 100)">
              <rect x="0" y="100" width="60" height={churnBarHeight} fill="var(--accent-soft)" />
              <text x="30" y="90" textAnchor="middle" fill="var(--text)" fontSize="12">
                -{formatCurrency(data.churnMrr)}
              </text>
              <text x="30" y="170" textAnchor="middle" fill="var(--muted)" fontSize="12">Churn</text>
            </g>

            {/* Ending MRR */}
            <g transform="translate(450, 100)">
              <rect x="0" y={barHeight - endingBarHeight} width="60" height={endingBarHeight} fill="var(--accent-2)" />
              <text x="30" y={barHeight - endingBarHeight - 10} textAnchor="middle" fill="var(--text)" fontSize="12">
                {formatCurrency(endingMrrCalculated)}
              </text>
              <text x="30" y={barHeight + 20} textAnchor="middle" fill="var(--muted)" fontSize="12">Ending</text>
            </g>

            {/* Connection lines */}
            <line x1="110" y1={100 + barHeight - startingBarHeight} x2="130" y2={100 + barHeight - (startingBarHeight + newBarHeight)} stroke="var(--border-soft)" strokeWidth="1" />
            <line x1="190" y1={100 + barHeight - (startingBarHeight + newBarHeight)} x2="210" y2={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight)} stroke="var(--border-soft)" strokeWidth="1" />
            <line x1="270" y1={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight)} x2="290" y2={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight) + contractionBarHeight} stroke="var(--border-soft)" strokeWidth="1" />
            <line x1="350" y1={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight) + contractionBarHeight} x2="370" y2={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight) + contractionBarHeight + churnBarHeight} stroke="var(--border-soft)" strokeWidth="1" />
            <line x1="430" y1={100 + barHeight - (startingBarHeight + newBarHeight + expansionBarHeight) + contractionBarHeight + churnBarHeight} x2="450" y2={100 + barHeight - endingBarHeight} stroke="var(--border-soft)" strokeWidth="1" />

            {/* Total Change Line */}
            <line x1="50" y1={100 + barHeight - startingBarHeight} x2="510" y2={100 + barHeight - endingBarHeight} stroke={totalChange >= 0 ? "var(--good)" : "var(--accent-soft)"} strokeWidth="2" strokeDasharray="4" />
          </svg>
        </div>

        <div className="mt-4 text-sm text-[var(--muted)] text-center">
          <p>Starting MRR: {formatCurrency(data.startingMrr)} + New: {formatCurrency(data.newMrr)} + Expansion: {formatCurrency(data.expansionMrr)} - Contraction: {formatCurrency(data.contractionMrr)} - Churn: {formatCurrency(data.churnMrr)} = Ending MRR: {formatCurrency(endingMrrCalculated)}</p>
          <p className={`${totalChange >= 0 ? 'text-[var(--good)]' : 'text-[var(--accent-soft)]'}`}>
            Total Change: {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
          </p>
        </div>
      </div>
    </Card>
  );
}
