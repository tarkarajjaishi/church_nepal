'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Define the notification preference types
type NotificationType = 'new_church' | 'payment_failed' | 'storage_limit' | 'new_admin';
type ChannelType = 'email' | 'in_app';

interface NotificationPreference {
  email: boolean;
  in_app: boolean;
}

const initialPreferences: Record<NotificationType, NotificationPreference> = {
  new_church: { email: true, in_app: true },
  payment_failed: { email: true, in_app: true },
  storage_limit: { email: false, in_app: true },
  new_admin: { email: true, in_app: false },
};

// Helper function to get display label for notification type
const getNotificationLabel = (type: NotificationType): string => {
  switch (type) {
    case 'new_church': return 'New Church Created';
    case 'payment_failed': return 'Payment Failed';
    case 'storage_limit': return 'Storage Limit Reached';
    case 'new_admin': return 'New Admin Added';
    default: return '';
  }
};

// Toggle Switch Component
const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default function NotificationPrefs() {
  const [preferences, setPreferences] = useState<Record<NotificationType, NotificationPreference>>(initialPreferences);

  const handleToggle = (type: NotificationType, channel: ChannelType) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would make an API call
    console.log('Saving preferences:', preferences);
    toast.success('Notification preferences saved successfully!');
  };

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0 mt-4">
        <div className="space-y-4">
          {Object.entries(preferences).map(([type, channels]) => (
            <div 
              key={type} 
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-[var(--border-soft)] last:border-0"
            >
              <div className="flex-1">
                <h3 className="font-medium text-[var(--text-strong)]">{getNotificationLabel(type as NotificationType)}</h3>
              </div>
              
              <div className="flex space-x-6">
                {/* Email Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[var(--muted)]">Email</span>
                  <ToggleSwitch 
                    checked={channels.email} 
                    onChange={() => handleToggle(type as NotificationType, 'email')} 
                  />
                </div>
                
                {/* In-App Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[var(--muted)]">In-app</span>
                  <ToggleSwitch 
                    checked={channels.in_app} 
                    onChange={() => handleToggle(type as NotificationType, 'in_app')} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave}
            className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
          >
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
