'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DateRange {
  from: Date;
  to: Date;
  preset: string | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const today = new Date();
  const [fromDate, setFromDate] = useState<string>(() => {
    return value?.from ? formatDate(value.from) : formatDate(subtractDays(today, 7));
  });
  const [toDate, setToDate] = useState<string>(() => {
    return value?.to ? formatDate(value.to) : formatDate(today);
  });
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    return value?.preset || null;
  });

  // Sync internal state when value prop changes
  useEffect(() => {
    if (value) {
      setFromDate(formatDate(value.from));
      setToDate(formatDate(value.to));
      setActivePreset(value.preset || null);
    }
  }, [value]);

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let from = new Date(now);

    switch (preset) {
      case '7d':
        from = subtractDays(now, 7);
        break;
      case '30d':
        from = subtractDays(now, 30);
        break;
      case '90d':
        from = subtractDays(now, 90);
        break;
      case '12m':
        from = subtractMonths(now, 12);
        break;
      default:
        // For 'Custom', just update the active preset without changing dates
        break;
    }

    if (preset !== 'Custom') {
      setFromDate(formatDate(from));
      setToDate(formatDate(now));
    }
    
    setActivePreset(preset);
    onChange({
      from: preset === 'Custom' ? parseDate(fromDate) : from,
      to: preset === 'Custom' ? parseDate(toDate) : now,
      preset: preset,
    });
  };

  const handleDateChange = () => {
    const newFrom = parseDate(fromDate);
    const newTo = parseDate(toDate);
    
    // Update the preset to Custom if user manually changed dates
    if (!activePreset || activePreset === 'Custom' || 
       (newFrom.getTime() !== parseDate(getDefaultDateForPreset(activePreset)).getTime()) || 
       (newTo.getTime() !== today.getTime())) {
      setActivePreset('Custom');
    }
    
    onChange({
      from: newFrom,
      to: newTo,
      preset: activePreset === 'Custom' ? 'Custom' : activePreset,
    });
  };

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {['7d', '30d', '90d', '12m', 'Custom'].map((preset) => (
            <Badge
              key={preset}
              variant="outline"
              onClick={() => handlePresetClick(preset)}
              className={`cursor-pointer ${
                activePreset === preset
                  ? 'bg-[var(--accent)] text-[var(--max)] border-[var(--accent)]'
                  : 'bg-transparent text-[var(--text)] border-[var(--border-soft)] hover:bg-[var(--panel-2)]'
              }`}
            >
              {preset}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col w-full sm:w-auto">
            <label htmlFor="from-date" className="text-sm text-[var(--muted)] mb-1">
              From
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                // Trigger change after state update
                setTimeout(handleDateChange, 0);
              }}
              className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="hidden sm:block text-[var(--muted)]">to</div>

          <div className="flex flex-col w-full sm:w-auto">
            <label htmlFor="to-date" className="text-sm text-[var(--muted)] mb-1">
              To
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                // Trigger change after state update
                setTimeout(handleDateChange, 0);
              }}
              className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Set to local midnight to avoid timezone issues
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDefaultDateForPreset(preset: string): string {
  const today = new Date();
  let from = new Date(today);

  switch (preset) {
    case '7d':
      from = subtractDays(today, 7);
      break;
    case '30d':
      from = subtractDays(today, 30);
      break;
    case '90d':
      from = subtractDays(today, 90);
      break;
    case '12m':
      from = subtractMonths(today, 12);
      break;
    default:
      return formatDate(today);
  }

  return formatDate(from);
}

export default DateRangePicker;
