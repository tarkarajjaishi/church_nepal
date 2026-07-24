'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ANNOUNCEMENT_KEY = 'dismissed-announcement';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has dismissed the announcement before
    const hasDismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!hasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="relative w-full py-2 px-4 text-center"
      style={{ 
        backgroundColor: 'var(--accent)',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--accent-contrast)' }}>
        {' '}New features available!{' '}
        <Link 
          href="/changelog" 
          className="underline hover:no-underline"
          style={{ color: 'var(--accent-contrast)' }}
        >
          Learn more
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        aria-label="Close announcement"
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
          className="text-current"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
