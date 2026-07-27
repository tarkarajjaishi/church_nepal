'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip = ({ content, children, side = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipRef.current?.parentElement) {
        document.body.removeChild(tooltipRef.current.parentElement);
      }
    };
  }, []);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !isVisible) return { top: 0, left: 0 };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate width of tooltip
    const tooltipHeight = 40; // Approximate height of tooltip
    const gap = 8;
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipHeight - gap;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeight / 2);
        left = triggerRect.right + gap;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeight / 2);
        left = triggerRect.left - tooltipWidth - gap;
        break;
    }

    // Constrain to viewport
    left = Math.max(gap, Math.min(left, window.innerWidth - tooltipWidth - gap));
    top = Math.max(gap, Math.min(top, window.innerHeight - tooltipHeight - gap));

    return { top, left };
  };

  const { top, left } = calculatePosition();

  const tooltipElement = isVisible ? (
    <div
      ref={tooltipRef}
      style={{ top: `${top}px`, left: `${left}px`, position: 'fixed', zIndex: 9999 }}
      className="px-3 py-2 bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-md shadow-lg text-sm text-[var(--text)] max-w-xs"
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? "tooltip" : undefined}
      >
        {children}
      </div>
      {typeof window !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
};

export default Tooltip;
