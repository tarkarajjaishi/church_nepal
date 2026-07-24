'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Notification = {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New member application',
    description: 'John Doe has applied for membership.',
    type: 'info',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    read: false,
    actionUrl: '/admin/members'
  },
  {
    id: '2',
    title: 'Payment received',
    description: 'Jane Smith donated NPR 5,000.',
    type: 'success',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/admin/donations'
  },
  {
    id: '3',
    title: 'Event reminder',
    description: 'Sunday service starts in 1 hour.',
    type: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/admin/events'
  }
];

const getTypeColor = (type: string) => {
  switch(type) {
    case 'success': return 'bg-[var(--good-soft)]';
    case 'warning': return 'bg-[var(--gold-soft)]';
    case 'error': return 'bg-red-500/20';
    default: return 'bg-[var(--accent-soft)]';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  useEffect(() => {
    // Initialize with mock data
    setNotifications(mockNotifications);
    
    // Simulate polling for new notifications
    const interval = setInterval(() => {
      // In a real app, fetch new notifications from the API
      console.log("Polling for new notifications...");
      
      // Example of adding a new notification
      // setNotifications(prev => [
      //   {
      //     id: `new-${Date.now()}`,
      //     title: 'New notification',
      //     description: 'This is a new notification',
      //     type: 'info',
      //     timestamp: new Date(),
      //     read: false,
      //     actionUrl: '#'
      //   },
      //   ...prev
      // ]);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleDropdown = () => {
    if (!isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    setIsOpen(!isOpen);
  };
  
  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
  };
  
  const handleDismiss = (id: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== id)
    );
  };
  
  const handleView = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    // Mark as read when viewed
    handleMarkAsRead(notification.id);
    setIsOpen(false);
  };
  
  // Get only the most recent 5 notifications for the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="relative"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M13.5 15.5a1.5 1.5 0 1 0-3 0"/>
        </svg>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-[var(--muted)] hover:text-[var(--text)]"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length > 0 ? (
              <ul>
                {recentNotifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-4 border-b border-[var(--border-soft)] last:border-0 ${!notification.read ? 'bg-[var(--accent-soft)]' : ''}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-3">
                        <Badge className={`${getTypeColor(notification.type)} text-[var(--text)]`}>
                          {notification.type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{notification.title}</h4>
                          {notification.description && (
                            <p className="text-sm text-[var(--muted)] truncate mt-1">
                              {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-[var(--muted)] mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        {!notification.read ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                            aria-label="Mark as read"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                              <polyline points="17 21 17 13 7 13 7 21"/>
                              <polyline points="7 3 7 8 15 8"/>
                            </svg>
                          </Button>
                        ) : null}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDismiss(notification.id)}
                          className="h-6 w-6 p-0"
                          aria-label="Dismiss"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(notification)}
                      >
                        View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <p className="text-[var(--muted)]">No notifications</p>
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-[var(--border)]">
            <Button 
              variant="ghost" 
              className="w-full justify-center"
              onClick={() => {
                window.location.href = '/admin/notifications';
                setIsOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
