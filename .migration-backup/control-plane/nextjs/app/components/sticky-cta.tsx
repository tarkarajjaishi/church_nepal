'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      // Show after scrolling 600px
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm text-[var(--text)] font-medium truncate">
            Interested in seeing how our platform works? Book a personalized demo today!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
          >
            Dismiss
          </Button>
          <Link href="/contact">
            <Button size="sm" className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
              Book a Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
