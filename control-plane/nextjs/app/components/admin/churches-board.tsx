'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Church {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: 'provisioning' | 'active' | 'past-due' | 'suspended';
}

const initialChurches: Church[] = [
  { id: '1', name: 'Grace Community Church', subdomain: 'gracechurch', plan: 'Pro', status: 'provisioning' },
  { id: '2', name: 'Mount Zion Fellowship', subdomain: 'mountzion', plan: 'Basic', status: 'active' },
  { id: '3', name: 'New Life Assembly', subdomain: 'newlife', plan: 'Plus', status: 'active' },
  { id: '4', name: 'Faith Baptist Church', subdomain: 'faithbaptist', plan: 'Basic', status: 'past-due' },
  { id: '5', name: 'Cornerstone Ministries', subdomain: 'cornerstone', plan: 'Pro', status: 'suspended' },
  { id: '6', name: 'Redeemed Christian Church', subdomain: 'redeemed', plan: 'Plus', status: 'active' },
  { id: '7', name: 'Bethel Church', subdomain: 'bethel', plan: 'Basic', status: 'provisioning' },
  { id: '8', name: 'Calvary Chapel', subdomain: 'calvary', plan: 'Plus', status: 'past-due' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'provisioning': return 'bg-[var(--accent-soft)] text-[var(--accent)]';
    case 'active': return 'bg-[var(--good-soft)] text-[var(--good)]';
    case 'past-due': return 'bg-[var(--gold-soft)] text-[var(--text-strong)]';
    case 'suspended': return 'bg-[var(--muted)] text-[var(--text)]';
    default: return 'bg-[var(--muted)] text-[var(--text)]';
  }
};

const ChurchesBoard = () => {
  const [churches] = useState<Church[]>(initialChurches);

  const columns = [
    { key: 'provisioning', title: 'Provisioning', count: churches.filter(c => c.status === 'provisioning').length },
    { key: 'active', title: 'Active', count: churches.filter(c => c.status === 'active').length },
    { key: 'past-due', title: 'Past Due', count: churches.filter(c => c.status === 'past-due').length },
    { key: 'suspended', title: 'Suspended', count: churches.filter(c => c.status === 'suspended').length },
  ];

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div 
              key={column.key} 
              className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg"
            >
              <div className="px-4 py-3 border-b border-[var(--border-soft)]">
                <h3 className="font-semibold text-[var(--text-strong)]">{column.title}</h3>
                <span className="text-sm text-[var(--muted)]">({column.count})</span>
              </div>
              <div className="p-2 min-h-[400px]">
                {churches
                  .filter(church => church.status === column.key)
                  .map((church) => (
                    <Link href={`/admin/churches/${church.id}`} key={church.id}>
                      <div className="mb-3 p-3 bg-[var(--panel)] border border-[var(--border-soft)] rounded-md hover:bg-[var(--panel-3)] transition-colors cursor-pointer">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-[var(--text-strong)] truncate max-w-[180px]">{church.name}</h4>
                          <Badge className={`${getStatusColor(church.status)} text-xs`}>
                            {church.status.charAt(0).toUpperCase() + church.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1 truncate max-w-[180px]">{church.subdomain}.churchnepal.com</p>
                        <Badge variant="secondary" className="mt-2 text-xs bg-[var(--accent-2)] text-[var(--accent)]">
                          {church.plan}
                        </Badge>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChurchesBoard;
