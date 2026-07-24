'use client';

import { useState, useEffect } from 'react';

const A11yToolbar = () => {
  const [fontSize, setFontSize] = useState<number>(1);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('a11y-font-size');
    if (savedFontSize) {
      setFontSize(parseFloat(savedFontSize));
    }

    const savedHighContrast = localStorage.getItem('a11y-high-contrast');
    if (savedHighContrast) {
      setHighContrast(savedHighContrast === 'true');
    }

    const savedReduceMotion = localStorage.getItem('a11y-reduce-motion');
    if (savedReduceMotion) {
      setReduceMotion(savedReduceMotion === 'true');
    }
  }, []);

  // Apply settings to document.documentElement
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize * 16}px`;
    localStorage.setItem('a11y-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('a11y-high-contrast');
    } else {
      document.documentElement.classList.remove('a11y-high-contrast');
    }
    localStorage.setItem('a11y-high-contrast', highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('a11y-reduce-motion');
    } else {
      document.documentElement.classList.remove('a11y-reduce-motion');
    }
    localStorage.setItem('a11y-reduce-motion', reduceMotion.toString());
  }, [reduceMotion]);

  const increaseFontSize = () => {
    if (fontSize < 1.5) {
      setFontSize(prev => Math.min(1.5, prev + 0.1));
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 0.8) {
      setFontSize(prev => Math.max(0.8, prev - 0.1));
    }
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const toggleReduceMotion = () => {
    setReduceMotion(!reduceMotion);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
      <button
        onClick={decreaseFontSize}
        aria-label="Decrease font size"
        className="p-2 rounded-md hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12H4"/>
        </svg>
      </button>
      
      <span className="text-[var(--text)] text-sm px-1">{Math.round(fontSize * 100)}%</span>
      
      <button
        onClick={increaseFontSize}
        aria-label="Increase font size"
        className="p-2 rounded-md hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      
      <button
        onClick={toggleHighContrast}
        aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
        className={`p-2 rounded-md hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${highContrast ? 'text-[var(--accent)]' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 18a6 6 0 0 0 0-12v12z"/>
        </svg>
      </button>
      
      <button
        onClick={toggleReduceMotion}
        aria-label={reduceMotion ? "Disable reduce motion" : "Enable reduce motion"}
        className={`p-2 rounded-md hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${reduceMotion ? 'text-[var(--accent)]' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20"/>
          <path d="M5 8l-3 4 3 4"/>
          <path d="M19 8l3 4-3 4"/>
        </svg>
      </button>
    </div>
  );
};

export default A11yToolbar;
