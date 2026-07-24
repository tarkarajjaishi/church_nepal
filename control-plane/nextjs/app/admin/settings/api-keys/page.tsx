'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define types matching the backend structure
type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  usage_24h: number;
  sparkline_data?: number[]; // Optional for demo purposes
};

const mockApiKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'Webhook Handler',
    key_prefix: 'wh_abc',
    scopes: ['webhooks:read', 'webhooks:write'],
    created_at: '2024-01-15T10:00:00Z',
    last_used_at: '2024-01-20T14:30:00Z',
    usage_24h: 120,
    sparkline_data: [10, 20, 15, 30, 25, 40, 35, 50]
  },
  {
    id: 'key_2',
    name: 'Analytics Sync',
    key_prefix: 'an_def',
    scopes: ['analytics:read', 'reports:read'],
    created_at: '2024-02-10T09:15:00Z',
    last_used_at: '2024-01-20T11:45:00Z',
    usage_24h: 45,
    sparkline_data: [5, 10, 8, 12, 15, 20, 18, 22]
  }
];

const allScopes = [
  'churches:read', 'churches:write',
  'members:read', 'members:write',
  'events:read', 'events:write',
  'donations:read', 'donations:write',
  'webhooks:read', 'webhooks:write',
  'analytics:read', 'reports:read'
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    // In a real app, fetch from API
    setTimeout(() => {
      setKeys(mockApiKeys);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    // In a real app, call API to create key
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key_prefix: `sk_${Math.random().toString(36).substring(2, 5)}`,
      scopes: [...selectedScopes],
      created_at: new Date().toISOString(),
      last_used_at: null,
      usage_24h: 0,
      sparkline_data: [0]
    };

    setKeys([newKey, ...keys]);
    setNewSecretKey(`sk_${Math.random().toString(36)}${Math.random().toString(36)}`);
    setNewKeyName('');
    setSelectedScopes([]);
  };

  const handleRotateKey = (keyId: string) => {
    // In a real app, call API to rotate key
    toast.success('API Key rotated successfully');
  };

  const handleRevokeKey = (keyId: string) => {
    // In a real app, call API to revoke key
    setKeys(keys.filter(key => key.id !== keyId));
    setRevokingKeyId(null);
    toast.success('API Key revoked');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key copied to clipboard');
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  // Sparkline component for visualizing usage
  const Sparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) return <div className="w-20 h-6 bg-[var(--panel-2)] rounded"></div>;

    const max = Math.max(...data);
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * 80;
      const y = 20 - (value / (max || 1)) * 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          points={points}
          transform="translate(0,2)"
        />
      </svg>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">API Keys</h1>
        <p className="text-[var(--muted)] mt-2">
          Manage API keys for accessing the Church Nepal platform programmatically.
        </p>
      </div>

      {/* Create Key Section */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Create New API Key</h2>
            <p className="text-[var(--muted)] text-sm mt-1">
              Generate a new key for programmatic access
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Create Key</Button>
        </div>
      </Card>

      {/* API Keys List */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Active API Keys</h2>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-[var(--panel-2)] rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[var(--border-soft)] rounded"></div>
                  <div className="h-3 w-48 bg-[var(--border-soft)] rounded"></div>
                </div>
                <div className="h-8 w-20 bg-[var(--border-soft)] rounded"></div>
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted)]">No API keys created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map(key => (
              <div 
                key={key.id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-[var(--border-soft)] rounded-lg hover:bg-[var(--panel-2)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-[var(--text)] truncate">{key.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-mono">
                      {key.key_prefix}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {key.scopes.map(scope => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-sm text-[var(--muted)] flex flex-wrap gap-x-4 gap-y-1">
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    <span>Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</span>
                    <span>Requests (24h): {key.usage_24h}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 md:mt-0">
                  <Sparkline data={key.sparkline_data || []} />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyKey(`${key.key_prefix}_...`)}
                    >
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRotateKey(key.id)}
                    >
                      Rotate
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setRevokingKeyId(key.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
            {newSecretKey ? (
              <>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">API Key Created!</h3>
                <p className="text-[var(--muted)] mb-4">
                  Please save this key securely. It will not be shown again.
                </p>
                <div className="relative">
                  <Input 
                    value={newSecretKey} 
                    readOnly 
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => handleCopyKey(newSecretKey)}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewSecretKey(null);
                      setShowCreateModal(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Create New API Key</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Key Name
                  </label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Webhook Service"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Scopes
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-[var(--border-soft)] rounded-lg">
                    {allScopes.map(scope => (
                      <label key={scope} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--panel-2)] rounded">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        <span className="text-sm text-[var(--text)]">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName('');
                      setSelectedScopes([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || selectedScopes.length === 0}
                  >
                    Create Key
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokingKeyId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text)]">Confirm Revoke</h3>
            <p className="text-[var(--muted)] mt-2">
              Are you sure you want to revoke this API key? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setRevokingKeyId(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleRevokeKey(revokingKeyId)}
              >
                Revoke Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
