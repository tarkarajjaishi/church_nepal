'use client';

import { useState, useEffect, useCallback } from 'react';

const SOCIAL_PROOF_EVENTS = [
  'Grace Chapel just launched their site',
  'New church in Pokhara',
  'Hope Fellowship just joined',
  'Faith Church in Kathmandu',
  'Light & Life just went live',
  'New member in Lalitpur',
  'Victory Church just signed up',
  'Community Church in Biratnagar',
];

export default function SocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const nextEvent = useCallback(() => {
    if (!isPaused) {
      setCurrentIndex((prev) => (prev + 1) % SOCIAL_PROOF_EVENTS.length);
    }
  }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(nextEvent, 20000); // 20 seconds
    return () => clearInterval(interval);
  }, [nextEvent]);

  const dismissToast = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 max-w-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text)] truncate">
            {SOCIAL_PROOF_EVENTS[currentIndex]}
          </p>
        </div>
        <button 
          onClick={dismissToast}
          className="text-[var(--muted)] hover:text-[var(--text)] focus:outline-none"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
