'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Server, HardDrive, Globe, Mail, LayoutDashboard } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

/**
 * Whether the platform is actually up, according to the platform.
 *
 * This used to hardcode `operational: true` for PostgreSQL, Church Provisioning
 * and Storage — three green ticks for three things nobody had asked about — and
 * infer the fourth from whether an unrelated analytics query had resolved. So an
 * expired session painted "Control API — Issue" and turned the whole panel red
 * while the API was perfectly healthy, and the database could have been on fire
 * without this panel noticing.
 *
 * /status answers this properly and is public, because a status panel nobody can
 * reach during an outage is no use. It is the same source /admin/status reads,
 * so the two cannot disagree.
 */

interface Component {
  name: string;
  status: string;
}
interface Status {
  status: string;
  updated_at: string;
  components: Component[];
}

// Matched loosely: the server owns the list, and a name it adds tomorrow should
// still render — with a neutral icon rather than not at all.
const ICONS: [RegExp, typeof Activity][] = [
  [/api/i, Activity],
  [/database|postgres/i, Database],
  [/provision/i, Server],
  [/storage|media/i, HardDrive],
  [/site|website|marketing/i, Globe],
  [/email/i, Mail],
  [/dashboard|admin/i, LayoutDashboard],
];

const iconFor = (name: string) => ICONS.find(([re]) => re.test(name))?.[1] ?? Activity;

export default function SystemStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['status'],
    queryFn: async () => (await apiClient.get<Status>('/status')).data,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-[var(--text-strong)] font-medium mb-1">System Status</h3>
        <p className="text-sm text-[var(--muted)]">Checking…</p>
      </Card>
    );
  }

  // "Could not be checked" is not the same as "something is wrong", and saying
  // the second when you mean the first is how a status panel loses its meaning.
  if (isError || !data) {
    return (
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-[var(--text-strong)] font-medium mb-1">System Status</h3>
        <p className="text-sm text-[var(--muted)]">
          Could not be checked just now — this says nothing about whether the
          platform is up.
        </p>
      </Card>
    );
  }

  const healthy = data.components.filter((c) => c.status === 'operational').length;
  const allOperational = healthy === data.components.length;

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-[var(--text-strong)] font-medium">System Status</h3>
        <p className={`text-sm ${allOperational ? 'text-[var(--good)]' : 'text-[var(--danger)]'}`}>
          {allOperational
            ? 'All systems operational'
            : `${data.components.length - healthy} of ${data.components.length} reporting problems`}
        </p>
      </div>

      <div className="space-y-3">
        {data.components.map((c) => {
          const Icon = iconFor(c.name);
          const ok = c.status === 'operational';
          return (
            <div key={c.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[var(--muted)]" aria-hidden />
                <span className="text-[var(--text)]">{c.name}</span>
              </div>
              <Badge
                variant={ok ? 'default' : 'destructive'}
                className={ok ? 'bg-[var(--good)] text-[var(--good-contrast)]' : ''}
              >
                {c.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
