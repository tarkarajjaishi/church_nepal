'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BulkToolbarProps {
  count: number;
  onSuspend: () => void;
  onReactivate: () => void;
  onExport: () => void;
  onClear: () => void;
}

export default function BulkToolbar({ 
  count, 
  onSuspend, 
  onReactivate, 
  onExport, 
  onClear 
}: BulkToolbarProps) {
  if (count === 0) return null;

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3 shadow-lg flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--text)]">
        {count} selected
      </span>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSuspend}
          className="text-xs"
        >
          Suspend
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReactivate}
          className="text-xs"
        >
          Reactivate
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onExport}
          className="text-xs"
        >
          Export
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onClear}
          className="text-xs"
        >
          Clear
        </Button>
      </div>
    </Card>
  );
}
