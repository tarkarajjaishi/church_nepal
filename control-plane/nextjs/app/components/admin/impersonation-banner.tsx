'use client';

import { useEffect, useState } from 'react';

// Function to check if we're currently impersonating
function isImpersonating(): boolean {
  // Check for a flag in localStorage or session storage that indicates impersonation
  // For example, when impersonation starts, we could store a key like `impersonating_${churchId}`
  // Here we'll look for any key starting with 'impersonating_'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('impersonating_')) {
      return true;
    }
  }
  return false;
}

export default function ImpersonationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isImpersonating());
  }, []);

  const handleExit = () => {
    // Clear the impersonation state
    // Remove all keys related to impersonation
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('impersonating_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--accent)] text-white py-2 px-4 flex justify-between items-center shadow-md">
      <span>You are impersonating a church</span>
      <button
        onClick={handleExit}
        className="text-sm underline hover:no-underline focus:outline-none"
      >
        Exit
      </button>
    </div>
  );
}
