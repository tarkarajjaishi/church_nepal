'use client';

import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check consent status after mount to prevent SSR issues
    const consentStatus = localStorage.getItem('cn_cookie_consent');
    if (!consentStatus) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cn_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cn_cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4"
      aria-label="Cookie consent banner"
    >
      <div 
        className="relative w-full max-w-[var(--max)] overflow-hidden rounded-xl bg-[var(--panel)] p-6 shadow-lg md:p-8"
        style={{ transform: showBanner ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s ease-in-out' }}
      >
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex-shrink-0 text-[var(--accent)]">
            <Shield size={24} aria-hidden="true" />
          </div>
          <p className="flex-1 text-center text-sm text-[var(--text)] md:text-left">
            We use cookies to enhance your experience.{' '}
            <a 
              href="/" 
              className="font-medium underline underline-offset-4 hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
              aria-label="Learn more about our privacy practices"
            >
              Learn more
            </a>
          </p>
          <div className="mt-4 flex gap-3 md:mt-0">
            <button
              onClick={handleDecline}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
