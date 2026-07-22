'use client';

import { useChurches } from '@/components/hooks/use-churches';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { LoadingState } from '@/components/loading-state';
import { EmptyState } from '@/components/empty-state';
import { Church } from '@/types';

const ActivityFeed = () => {
  const { data: churches, isLoading, error } = useChurches();

  if (isLoading) return <LoadingState />;
  if (error) return <div className="text-[var(--danger)]">Failed to load activity</div>;

  // Sort churches by created_at in descending order (newest first)
  const sortedChurches = [...(churches || [])].sort((a: Church, b: Church) => 
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );

  // Limit to up to 8 most recent activities
  const recentActivities = sortedChurches.slice(0, 8);

  // Helper function to calculate relative time without external libraries
  const getRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'recently';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (!recentActivities.length) {
    return <EmptyState title="No Recent Activity" description="When churches are provisioned, they will appear here." />;
  }

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {recentActivities.map((church: Church, index: number) => (
          <div key={church.id} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <div className="z-10">
                <Building2 className="w-5 h-5 text-[var(--accent)]" />
              </div>
              
              {/* Connector line */}
              {index !== recentActivities.length - 1 && (
                <div 
                  className="absolute top-full left-1/2 w-0.5 h-full bg-[var(--border)]" 
                  style={{ height: 'calc(100% + 1rem)' }}
                />
              )}
            </div>
            
            <div className="flex-1 pb-4">
              <p className="text-[var(--text)]">
                <span className="font-medium">{church.name}</span> was provisioned
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs bg-[var(--accent-soft)] text-[var(--accent)]">
                  {getRelativeTime(church.created_at)}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ActivityFeed;
