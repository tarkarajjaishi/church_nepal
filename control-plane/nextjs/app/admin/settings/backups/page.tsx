'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Define types for our backup data
type BackupType = 'full' | 'database' | 'media';
type BackupStatus = 'completed' | 'failed' | 'in_progress';

interface Backup {
  id: string;
  date: Date;
  size: number; // Size in bytes
  type: BackupType;
  status: BackupStatus;
  path: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreConfirmation, setRestoreConfirmation] = useState<{ backupId: string; churchName: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load sample data
  useEffect(() => {
    const sampleBackups: Backup[] = [
      {
        id: 'backup-1',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        size: 104857600, // 100MB
        type: 'full',
        status: 'completed',
        path: '/backups/full-2026-07-23.zip'
      },
      {
        id: 'backup-2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        size: 52428800, // 50MB
        type: 'database',
        status: 'completed',
        path: '/backups/database-2026-07-22.sql.gz'
      },
      {
        id: 'backup-3',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        size: 209715200, // 200MB
        type: 'full',
        status: 'completed',
        path: '/backups/full-2026-07-17.zip'
      },
      {
        id: 'backup-4',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        size: 104857600, // 100MB
        type: 'full',
        status: 'failed',
        path: '/backups/failed-2026-07-10.zip'
      },
      {
        id: 'backup-5',
        date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        size: 0,
        type: 'full',
        status: 'in_progress',
        path: '/backups/current-in-progress.zip'
      }
    ];
    
    setBackups(sampleBackups);
    setLoading(false);
  }, []);

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle triggering a new backup
  const handleTriggerBackup = () => {
    setToast({ message: 'New backup triggered successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle downloading a backup
  const handleDownload = (path: string) => {
    // Simulate download
    setToast({ message: `Downloading backup: ${path}`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Start the restore process
  const handleStartRestore = (backupId: string) => {
    setRestoreConfirmation({ backupId, churchName: '' });
  };

  // Confirm and execute restore
  const handleConfirmRestore = () => {
    if (!restoreConfirmation) return;
    
    // In a real app, this would call the API
    setToast({ 
      message: `Restore started for backup ${restoreConfirmation.backupId}`, 
      type: 'success' 
    });
    setTimeout(() => setToast(null), 3000);
    
    setRestoreConfirmation(null);
  };

  // Close restore confirmation modal
  const handleCloseRestoreModal = () => {
    setRestoreConfirmation(null);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: BackupStatus }) => {
    let variant = '';
    let text = '';
    
    switch(status) {
      case 'completed':
        variant = 'bg-[var(--good-soft)] text-[var(--good)] border-[var(--good)]';
        text = 'Completed';
        break;
      case 'failed':
        variant = 'bg-[var(--max)] text-white border-[var(--max)]';
        text = 'Failed';
        break;
      case 'in_progress':
        variant = 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]';
        text = 'In Progress';
        break;
      default:
        variant = 'bg-[var(--muted)] text-[var(--text)] border-[var(--border)]';
        text = 'Unknown';
    }
    
    return (
      <Badge className={`border ${variant}`}>
        {text}
      </Badge>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: BackupType }) => {
    let variant = '';
    let text = '';
    
    switch(type) {
      case 'full':
        variant = 'bg-[var(--panel-2)] text-[var(--text)] border-[var(--border-soft)]';
        text = 'Full';
        break;
      case 'database':
        variant = 'bg-[var(--gold-soft)] text-[var(--text)] border-[var(--border-soft)]';
        text = 'Database';
        break;
      case 'media':
        variant = 'bg-[var(--accent-soft)] text-[var(--text)] border-[var(--border-soft)]';
        text = 'Media';
        break;
      default:
        variant = 'bg-[var(--muted)] text-white border-[var(--muted)]';
        text = 'Unknown';
    }
    
    return (
      <Badge className={`border ${variant}`}>
        {text}
      </Badge>
    );
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Backup & Restore Console</h1>
            <p className="text-[var(--muted)] mt-1">Manage platform and tenant backups</p>
          </div>
          <Button onClick={handleTriggerBackup} className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
            Trigger Backup Now
          </Button>
        </div>
      </Card>

      {/* Schedule Configuration Card */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="text-lg font-medium text-[var(--text)] mb-4">Schedule Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Frequency</label>
            <select className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Retention Days</label>
            <Input 
              type="number" 
              defaultValue="30" 
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Storage Location</label>
            <select className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option>Local Server</option>
              <option>S3 Bucket</option>
              <option>Cloud Storage</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Backups List */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-medium text-[var(--text)] mb-4">Backup History</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-soft)]">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Size</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">{formatDate(backup.date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-[var(--text)]">{formatBytes(backup.size)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm">
                      <TypeBadge type={backup.type} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm">
                      <StatusBadge status={backup.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[var(--accent)] hover:text-[var(--accent-2)]"
                          onClick={() => handleDownload(backup.path)}
                        >
                          Download
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[var(--max)] hover:text-red-400 disabled:opacity-50"
                          disabled={backup.status !== 'completed'}
                          onClick={() => handleStartRestore(backup.id)}
                        >
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Restore Confirmation Modal */}
      {restoreConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">Confirm Restore</h3>
            <p className="text-[var(--muted)] mb-4">
              Are you sure you want to restore from backup? This will overwrite the current data.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Please type the church name to confirm:
              </label>
              <Input
                type="text"
                value={restoreConfirmation.churchName}
                onChange={(e) => 
                  setRestoreConfirmation({
                    ...restoreConfirmation,
                    churchName: e.target.value
                  })
                }
                placeholder="Enter church name"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCloseRestoreModal}
                className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRestore}
                disabled={restoreConfirmation.churchName.trim().length === 0}
                className="bg-[var(--max)] hover:bg-red-700 text-white"
              >
                Confirm Restore
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
          toast.type === 'success' 
            ? 'bg-[var(--good)] text-white' 
            : 'bg-[var(--max)] text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
