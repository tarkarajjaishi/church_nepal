'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock data types
type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt: string;
};

type DeliveryLog = {
  id: string;
  endpointId: string;
  statusCode: number;
  timestamp: string;
  payloadPreview: string;
  status: 'success' | 'failed' | 'pending';
};

const mockEndpoints: WebhookEndpoint[] = [
  {
    id: 'wh_1',
    url: 'https://example.com/webhook',
    events: ['donation.created', 'event.created'],
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'wh_2',
    url: 'https://another-site.com/hook',
    events: ['member.joined'],
    status: 'inactive',
    createdAt: '2024-02-20T14:30:00Z'
  }
];

const mockDeliveries: DeliveryLog[] = [
  {
    id: 'dlv_1',
    endpointId: 'wh_1',
    statusCode: 200,
    timestamp: '2024-03-01T12:00:00Z',
    payloadPreview: '{"type": "donation.created", "id": "d_1"}',
    status: 'success'
  },
  {
    id: 'dlv_2',
    endpointId: 'wh_1',
    statusCode: 404,
    timestamp: '2024-03-01T12:05:00Z',
    payloadPreview: '{"type": "event.created", "id": "e_1"}',
    status: 'failed'
  }
];

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(mockEndpoints);
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>(mockDeliveries);
  const [newEndpoint, setNewEndpoint] = useState({
    url: '',
    events: [] as string[],
    status: 'active' as const
  });
  const [isAdding, setIsAdding] = useState(false);

  // Toggle endpoint status
  const toggleStatus = (id: string) => {
    setEndpoints(prev => prev.map(ep => 
      ep.id === id ? { ...ep, status: ep.status === 'active' ? 'inactive' : 'active' } : ep
    ));
  };

  // Retry delivery
  const handleRetry = (deliveryId: string) => {
    alert(`Retrying delivery ${deliveryId}...`);
    // In real app, trigger retry via API call
    setDeliveries(prev => prev.map(d => 
      d.id === deliveryId ? { ...d, status: 'pending' } : d
    ));
  };

  // Test send
  const handleTestSend = () => {
    alert('Sending test webhook...');
    // In real app, trigger test send via API call
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Add Endpoint'}
        </Button>
      </div>

      {/* Add New Endpoint Form */}
      {isAdding && (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Create New Endpoint</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                type="url"
                value={newEndpoint.url}
                onChange={(e) => setNewEndpoint({...newEndpoint, url: e.target.value})}
                placeholder="https://your-app.com/webhook"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Events</label>
              <div className="space-y-2">
                {['donation.created', 'event.created', 'member.joined'].map(event => (
                  <label key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newEndpoint.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewEndpoint({...newEndpoint, events: [...newEndpoint.events, event]});
                        } else {
                          setNewEndpoint({...newEndpoint, events: newEndpoint.events.filter(ev => ev !== event)});
                        }
                      }}
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  if (newEndpoint.url) {
                    const newEp: WebhookEndpoint = {
                      id: `wh_${Date.now()}`,
                      url: newEndpoint.url,
                      events: newEndpoint.events,
                      status: newEndpoint.status,
                      createdAt: new Date().toISOString()
                    };
                    setEndpoints([...endpoints, newEp]);
                    setNewEndpoint({ url: '', events: [], status: 'active' });
                    setIsAdding(false);
                  }
                }}
              >
                Save Endpoint
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Endpoints List */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">URL</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Events</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {endpoints.map(endpoint => (
                <tr key={endpoint.id}>
                  <td className="py-3 px-4">{endpoint.url}</td>
                  <td className="py-3 px-4">
                    {endpoint.events.map(e => (
                      <Badge key={e} variant="secondary" className="mr-1">{e}</Badge>
                    ))}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={endpoint.status === 'active' ? 'default' : 'outline'}>
                      {endpoint.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(endpoint.id)}>
                        {endpoint.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delivery Logs */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Delivery Logs</h2>
          <Button onClick={handleTestSend}>Send Test Webhook</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Status Code</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Payload Preview</th>
                <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {deliveries.map(delivery => (
                <tr key={delivery.id}>
                  <td className="py-3 px-4 text-sm">{new Date(delivery.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <Badge variant={delivery.statusCode >= 200 && delivery.statusCode < 300 ? 'default' : 'destructive'}>
                      {delivery.statusCode}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono max-w-xs truncate">{delivery.payloadPreview}</td>
                  <td className="py-3 px-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={delivery.status !== 'failed'}
                      onClick={() => handleRetry(delivery.id)}
                    >
                      Retry
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
