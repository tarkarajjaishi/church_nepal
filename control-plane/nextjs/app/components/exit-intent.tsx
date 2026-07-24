'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ExitIntent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hasDismissedRef = useRef(false);

  // Check if dismissed in this session
  useEffect(() => {
    const dismissed = localStorage.getItem('exitIntentDismissed');
    if (dismissed === 'true') {
      hasDismissedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasDismissedRef.current) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if leaving from the top of the screen (likely tab closing, back button, etc.)
      if (e.clientY <= 0 && !isOpen) {
        setIsOpen(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Re-enable if user comes back without dismissing
      if (e.clientY > 20 && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    hasDismissedRef.current = true;
    localStorage.setItem('exitIntentDismissed', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Email submitted');
    handleDismiss(); // Close after submission
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-strong)]">Wait! Don't Go Yet</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDismiss}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
        
        <p className="mb-4 text-[var(--text)]">
          Before you go, grab our free guide to help grow your church online!
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            required 
            className="w-full"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Get Free Guide</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDismiss}
            >
              No Thanks
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExitIntent;
