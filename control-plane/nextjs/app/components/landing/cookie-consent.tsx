'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Define cookie category types
type CookieCategory = 'necessary' | 'analytics' | 'marketing';
type ConsentState = {
  [key in CookieCategory]: boolean;
};

const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Check if banner should be shown
  useEffect(() => {
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!storedPreferences) {
      setShowBanner(true);
    }
  }, []);

  // Handle acceptance of selected categories
  const handleAccept = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(consent));
    setShowBanner(false);
  };

  // Handle accepting all categories
  const handleAcceptAll = () => {
    const updatedConsent: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setConsent(updatedConsent);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedConsent));
    setShowBanner(false);
  };

  // Handle rejecting non-necessary categories
  const handleRejectAll = () => {
    const updatedConsent: ConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setConsent(updatedConsent);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedConsent));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:right-6">
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-lg">
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--text)]">Cookie Preferences</h3>
          <p className="text-sm text-[var(--muted)]">
            We use cookies to enhance your experience, analyze traffic, and personalize content. 
            Necessary cookies are always enabled for basic functionality.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">Necessary</p>
                <p className="text-xs text-[var(--muted)]">Always active</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[var(--accent-soft)] text-[var(--accent)]">Required</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">Analytics</p>
                <p className="text-xs text-[var(--muted)]">Track usage patterns</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[var(--border-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">Marketing</p>
                <p className="text-xs text-[var(--muted)]">Personalized ads</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[var(--border-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRejectAll}
              className="flex-1"
            >
              Reject All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAcceptAll}
              className="flex-1"
            >
              Accept All
            </Button>
            <Button 
              size="sm" 
              onClick={handleAccept}
              className="flex-1"
            >
              Confirm Choices
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
