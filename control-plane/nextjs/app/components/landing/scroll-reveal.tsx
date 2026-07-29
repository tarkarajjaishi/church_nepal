'use client';

import { useEffect, useRef, useState } from 'react';

// Detect when an element scrolls into view (once). Honors reduced-motion.
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  options?: IntersectionObserverInit
) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options]);

  return isInView;
}

type RevealProps = {
  children: React.ReactNode;
  delay?: number; // ms
  className?: string;
};

// Fade + rise in when scrolled into view — CSS transitions only (no library).
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
