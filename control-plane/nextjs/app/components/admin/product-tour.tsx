'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Step {
  selector: string;
  title: string;
  description: string;
}

const ProductTour = () => {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Define steps for different pages
  const getSteps = (): Step[] => {
    if (pathname === '/admin') {
      return [
        {
          selector: '#dashboard-card',
          title: 'Welcome to Dashboard',
          description: 'This is your central hub for monitoring system health and activity.'
        },
        {
          selector: '#sidebar-churches-link',
          title: 'Manage Churches',
          description: 'View, create, and manage all church instances from here.'
        },
        {
          selector: '#sidebar-billing-link',
          title: 'Billing Overview',
          description: 'Track subscriptions, invoices, and financial metrics.'
        }
      ];
    } else if (pathname.startsWith('/admin/churches')) {
      return [
        {
          selector: '#churches-list',
          title: 'Churches List',
          description: 'All active church instances are listed here.'
        },
        {
          selector: '#create-church-button',
          title: 'Add New Church',
          description: 'Click to provision a new church website.'
        }
      ];
    } else if (pathname.startsWith('/admin/billing')) {
      return [
        {
          selector: '#billing-summary',
          title: 'Billing Summary',
          description: 'Current revenue and subscription status.'
        },
        {
          selector: '#invoices-table',
          title: 'Invoice Management',
          description: 'View and manage all billing records.'
        }
      ];
    } else if (pathname.startsWith('/admin/settings')) {
      return [
        {
          selector: '#settings-nav',
          title: 'System Settings',
          description: 'Configure global settings and preferences.'
        }
      ];
    }
    return [];
  };

  const steps = getSteps();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenTour && steps.length > 0) {
      setTimeout(() => {
        setShowTour(true);
        setCurrentStep(0);
      }, 1000); // Delay to ensure DOM is ready
    }
  }, [pathname, steps.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        endTour();
      }
    };

    if (showTour) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTour]);

  const goToNext = () => {
    if (currentStep !== null && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const goToPrev = () => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    endTour();
  };

  const endTour = () => {
    setShowTour(false);
    setCurrentStep(null);
    localStorage.setItem('hasSeenAdminTour', 'true');
  };

  const replayTour = () => {
    setCurrentStep(0);
    setShowTour(true);
  };

  if (!showTour || currentStep === null || steps.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-[1000]">
        <button
          onClick={replayTour}
          className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-2)] transition-colors"
        >
          Show Tour
        </button>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const element = document.querySelector(currentStepData.selector) as HTMLElement;

  if (!element) {
    // If element doesn't exist, move to next step or end
    setTimeout(goToNext, 100);
    return null;
  }

  // Calculate position for tooltip relative to element
  const rect = element.getBoundingClientRect();
  const tooltipTop = rect.bottom + window.scrollY + 10;
  const tooltipLeft = rect.left + window.scrollX + (rect.width / 2);

  return (
    <>
      {/* Spotlight overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/70 z-[999]"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${rect.left}px 100%, 
            ${rect.left}px ${rect.top}px, 
            ${rect.right}px ${rect.top}px,
            ${rect.right}px ${rect.bottom}px,
            ${rect.left}px ${rect.bottom}px,
            ${rect.left}px 100%,
            100% 100%,
            100% 0%
          )`
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[1000] bg-[var(--panel-2)] border border-[var(--border)] rounded-lg shadow-lg p-4 w-80 max-w-[calc(100vw-2rem)]"
        style={{
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-[var(--text-strong)]">{currentStepData.title}</h3>
          <button 
            onClick={skipTour}
            className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-[var(--text)] text-sm mb-4">{currentStepData.description}</p>
        
        <div className="flex justify-between items-center">
          <button
            onClick={goToPrev}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              currentStep === 0 
                ? 'text-[var(--muted)] cursor-not-allowed' 
                : 'text-[var(--accent)] hover:bg-[var(--accent-soft)]'
            }`}
          >
            Back
          </button>
          
          <div className="flex gap-2">
            <span className="text-xs text-[var(--muted)]">
              {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={currentStep === steps.length - 1 ? endTour : goToNext}
              className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-2)] transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductTour;
