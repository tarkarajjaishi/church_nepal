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

interface CookiePreferencesProps {
  onConsentChange?: (consent: ConsentState) => void;
}

const CookiePreferences = ({ onConsentChange }: CookiePreferencesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Load initial preferences from storage
  useEffect(() => {
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as ConsentState;
        setConsent(parsed);
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  // Handle acceptance of selected categories
  const handleAccept = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(consent));
    setIsOpen(false);
    
    // Notify parent component of consent change
    if (onConsentChange) {
      onConsentChange(consent);
    }
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
    setIsOpen(false);
    
    if (onConsentChange) {
      onConsentChange(updatedConsent);
    }
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
    setIsOpen(false);
    
    if (onConsentChange) {
      onConsentChange(updatedConsent);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[var(--muted)] hover:text-[var(--text)] text-sm underline"
      >
        Manage preferences
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <Card className="relative bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-[var(--text)]">Cookie Preferences</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-[var(--muted)]">
                Customize your cookie settings. Necessary cookies are always enabled for core functionality.
              </p>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-soft)]">
                  <div>
                    <p className="font-medium text-[var(--text)]">Necessary</p>
                    <p className="text-xs text-[var(--muted)]">Essential for basic site functions</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-[var(--accent-soft)] text-[var(--accent)]">Required</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text)]">Analytics</p>
                    <p className="text-xs text-[var(--muted)]">Help us improve our services</p>
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
                    <p className="text-xs text-[var(--muted)]">Personalize your experience</p>
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
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRejectAll}
                  className="flex-1"
                >
                  Reject Non-Essential
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
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default CookiePreferences;
