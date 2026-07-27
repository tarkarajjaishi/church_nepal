'use client';

import { useState, useRef, useEffect } from 'react';
import { changelogData, getUnreadCount, type ChangelogEntry } from '@/lib/changelog-data';

const WhatsNew = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnreadCount(getUnreadCount());
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = () => {
    // In a real implementation, we would update the entries in state and persist
    setUnreadCount(0);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      markAsRead();
    }
  };

  const getTypeColor = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'new':
        return 'bg-[var(--good-soft)] text-[var(--good)]';
      case 'improved':
        return 'bg-[var(--accent-soft)] text-[var(--accent)]';
      case 'fixed':
        return 'bg-[var(--panel-3)] text-[var(--text)]';
      default:
        return 'bg-[var(--panel-3)] text-[var(--text)]';
    }
  };

  const getTypeLabel = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'new': return 'New';
      case 'improved': return 'Improved';
      case 'fixed': return 'Fixed';
      default: return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-[var(--panel-2)] transition-colors"
        aria-label="What's new"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-[var(--text)]"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-[var(--border-soft)]">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text)]">What's New</h3>
              <a 
                href="/changelog" 
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-2)]"
              >
                View All
              </a>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {changelogData.slice(0, 5).map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 border-b border-[var(--border-soft)] last:border-b-0 hover:bg-[var(--panel-2)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                      {getTypeLabel(entry.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--text)]">{entry.title}</h4>
                    <p className="text-sm text-[var(--muted)] mt-1">{entry.description}</p>
                    <p className="text-xs text-[var(--muted)] mt-2">{entry.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsNew;

