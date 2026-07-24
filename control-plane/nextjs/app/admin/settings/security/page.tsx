'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// Mock data for active sessions
const mockSessions = [
  { id: 'sess_1', device: 'Chrome on Windows', ip: '192.168.1.10', lastSeen: '2023-07-24T10:00:00Z' },
  { id: 'sess_2', device: 'Safari on iPhone', ip: '104.28.234.12', lastSeen: '2023-07-23T15:30:00Z' },
  { id: 'sess_3', device: 'Firefox on Linux', ip: '203.0.113.5', lastSeen: '2023-07-22T09:15:00Z' },
];

export default function SecuritySettingsPage() {
  const [enforce2fa, setEnforce2fa] = useState(false);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireComplexity, setRequireComplexity] = useState(false);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(90);
  const [sessions, setSessions] = useState(mockSessions);

  const handleSave = () => {
    // In a real app, this would call an API endpoint
    console.log({
      enforce2fa,
      passwordMinLength,
      requireComplexity,
      passwordExpiryDays,
    });
    toast.success('Security settings saved');
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter(session => session.id !== id));
    toast.info('Session revoked');
  };

  const handleRevokeAllSessions = () => {
    if (confirm('Are you sure you want to revoke all other sessions?')) {
      // Keep only the current session, for demo purposes we'll clear all
      setSessions([]);
      toast.success('All sessions revoked');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security Settings</h1>

      {/* Enforce 2FA Policy */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
        <div className="flex items-center justify-between">
          <div>
            <p>Enforce 2FA for all users</p>
            <p className="text-sm text-[var(--muted)]">Users will be required to set up 2FA during their next login.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enforce2fa}
              onChange={(e) => setEnforce2fa(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--border-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
          </label>
        </div>
      </div>

      {/* Password Policy */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Password Policy</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Length</label>
            <input
              type="number"
              min="6"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(Number(e.target.value))}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireComplexity"
              checked={requireComplexity}
              onChange={(e) => setRequireComplexity(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="requireComplexity">Require complexity (uppercase, lowercase, number, symbol)</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password Expiry (days)</label>
            <input
              type="number"
              min="0"
              value={passwordExpiryDays}
              onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
            />
            <p className="text-xs text-[var(--muted)] mt-1">Set to 0 to disable expiry</p>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <button
            onClick={handleRevokeAllSessions}
            className="text-sm px-3 py-1 bg-[var(--accent-soft)] hover:bg-[var(--accent)] text-[var(--text)] rounded"
          >
            Revoke All Other Sessions
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Device</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">IP Address</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Last Seen</th>
                <th className="py-2 px-4 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">{session.device}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">{session.ip}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">
                    {new Date(session.lastSeen).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-[var(--good)] hover:text-[var(--good-soft)]"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <p className="text-center py-4 text-[var(--muted)]">No active sessions</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-[var(--text)] rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
