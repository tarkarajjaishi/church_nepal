'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          
          setIsVisible(scrollY > 400);
          setScrollProgress(totalHeight > 0 ? Math.min((scrollY / totalHeight) * 100, 100) : 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Circle properties
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="
            fixed 
            bottom-8 
            right-8 
            z-50
            flex 
            items-center 
            justify-center
            w-14 
            h-14
            rounded-full
            bg-[var(--accent)]
            text-white
            shadow-lg
            hover:bg-[var(--accent)/90]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--accent)]
            focus:ring-offset-2
            transition-opacity
            duration-300
            ease-in-out
            opacity-100
            group
          "
        >
          {/* Progress ring SVG */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 80 80"
          >
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-20 text-white"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-white transition-all duration-300 ease-out"
            />
          </svg>
          
          {/* Arrow icon */}
          <span className="relative z-10">
            <ArrowUp size={20} />
          </span>
        </button>
      )}
    </>
  );
};

export default BackToTop;
