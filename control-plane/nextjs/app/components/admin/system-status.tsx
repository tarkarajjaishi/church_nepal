'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/components/hooks/use-analytics';
import { Activity, Database, Server, HardDrive } from 'lucide-react';

export default function SystemStatus() {
  const { data: analyticsData, isLoading, error } = useAnalytics();

  // Determine if the API is operational based on the analytics hook
  const apiOperational = !isLoading && !error && !!analyticsData;

  const services = [
    {
      id: 'control-api',
      name: 'Control API',
      operational: apiOperational,
      icon: Activity,
    },
    {
      id: 'database',
      name: 'PostgreSQL',
      operational: true,
      icon: Database,
    },
    {
      id: 'provisioning',
      name: 'Church Provisioning',
      operational: true,
      icon: Server,
    },
    {
      id: 'storage',
      name: 'Storage',
      operational: true,
      icon: HardDrive,
    },
  ];

  const allOperational = services.every(service => service.operational);

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-[var(--text-strong)] font-medium">System Status</h3>
        <p className={`text-sm ${allOperational ? 'text-[var(--good)]' : 'text-[var(--danger)]'}`}>
          {allOperational ? 'All systems operational' : 'Some systems experiencing issues'}
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const IconComponent = service.icon;
          return (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-[var(--text)]">{service.name}</span>
              </div>
              <Badge 
                variant={service.operational ? 'default' : 'destructive'} 
                className={service.operational ? 'bg-[var(--good)]' : ''}
              >
                <span className="flex items-center gap-1">
                  <span 
                    className={`inline-block w-2 h-2 rounded-full ${service.operational ? 'bg-white' : 'bg-white'}`} 
                    style={{ backgroundColor: service.operational ? 'var(--good)' : 'var(--danger)' }}
                  ></span>
                  {service.operational ? 'Operational' : 'Issue'}
                </span>
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
