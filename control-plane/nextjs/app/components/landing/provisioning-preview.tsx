'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor } from 'lucide-react';

const ProvisioningPreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Define provisioning steps
  const steps = [
    { text: 'Creating subdomain: gracechurch.churchnepal.com...' },
    { text: 'Creating database: gracechurch...' },
    { text: 'Running migrations...' },
    { text: 'Setting up storage: /storage/gracechurch...' },
    { text: 'Seeding admin account...' },
    { text: 'Church is now LIVE! ✅' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // State for reduced motion preference, defaulting to false for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Client-side only: check for reduced motion preference
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      // If reduced motion is preferred, show all steps at once
      setCurrentStepIndex(steps.length);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isVisible, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (!isVisible || currentStepIndex >= steps.length) return;

    if (currentStepIndex === -1) {
      // Start the process after a brief delay
      const timer = setTimeout(() => setCurrentStepIndex(0), 500);
      return () => clearTimeout(timer);
    }

    if (!isTyping && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      let index = 0;
      setIsTyping(true);

      const typeInterval = setInterval(() => {
        if (index <= step.text.length) {
          setDisplayedText(step.text.slice(0, index));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          // Move to next step after a pause
          setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
            setDisplayedText('');
          }, 800);
        }
      }, 30); // Typing speed

      return () => clearInterval(typeInterval);
    }
  }, [isVisible, currentStepIndex, isTyping, steps, prefersReducedMotion]);

  // For reduced motion, display all steps as completed
  const renderStepsForReducedMotion = () => {
    if (!prefersReducedMotion) return null;
    
    return steps.map((step, index) => (
      <div key={index} className="mb-1 flex items-start">
        <span className="mr-2 text-[var(--good)]">✓</span>
        <span className="text-[var(--text)]">{step.text}</span>
      </div>
    ));
  };

  return (
    <section id="demo" className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
              Live Demo
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)]">
              Watch a Church Get Provisioned
            </h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl">
              See how quickly we can set up a fully functional digital presence for a new church. 
              From domain setup to database initialization and seeding, everything happens automatically.
            </p>
          </div>

          {/* Right Side Terminal */}
          <div ref={containerRef} className="relative w-full min-w-0">
            <div className="bg-[var(--panel-3)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center px-4 py-3 bg-[var(--panel-2)] border-b border-[var(--border)]">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--gold)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--good)]"></div>
                </div>
                <div className="ml-4 text-xs text-[var(--muted)] flex items-center">
                  <Monitor className="w-4 h-4 mr-2" />
                  Provisioning Console
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-4 font-mono text-sm overflow-x-auto max-w-full">
                {/* Initial Prompt */}
                <div className="mb-2 whitespace-nowrap">
                  <span className="text-[var(--accent)]">$</span> provision-church --name=gracechurch
                </div>

                {/* Steps */}
                {prefersReducedMotion ? (
                  renderStepsForReducedMotion()
                ) : (
                  steps.map((step, index) => {
                    // Current step being typed
                    if (index === currentStepIndex && isTyping) {
                      return (
                        <div key={index} className="mb-1 flex items-start whitespace-nowrap">
                          <span className="mr-2 text-[var(--muted)]">•</span>
                          <span className="text-[var(--text)]">{displayedText}</span>
                          <span className="ml-1 inline-block w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
                        </div>
                      );
                    }
                    // Completed steps
                    if (index < currentStepIndex) {
                      return (
                        <div key={index} className="mb-1 flex items-start whitespace-nowrap">
                          <span className="mr-2 text-[var(--good)]">✓</span>
                          <span className="text-[var(--text)]">{step.text}</span>
                        </div>
                      );
                    }
                    // Future steps (not yet started)
                    if (index > currentStepIndex && currentStepIndex !== -1) {
                      return (
                        <div key={index} className="mb-1 flex items-start opacity-50 whitespace-nowrap">
                          <span className="mr-2 text-[var(--muted)]">○</span>
                          <span className="text-[var(--text)]">{step.text}</span>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
                
                {/* Final state when all done */}
                {!prefersReducedMotion && currentStepIndex >= steps.length && (
                  <div className="mt-2 text-[var(--good)]">Process completed successfully.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProvisioningPreview;
