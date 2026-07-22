'use client';

import { useEffect, useState } from 'react';

const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate how much of the page has been scrolled (0 to 1)
      const scrolled = Math.min(scrollY / (documentHeight - windowHeight), 1);
      setScrollProgress(scrolled * 100);
    };

    // Use passive listener for performance
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Initial calculation
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[3px] z-[100] pointer-events-none"
      style={{
        background: `linear-gradient(to right, var(--accent), var(--accent-2))`,
        width: `${scrollProgress}%`,
        opacity: scrollProgress > 0 ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    />
  );
};

export default ScrollProgress;
