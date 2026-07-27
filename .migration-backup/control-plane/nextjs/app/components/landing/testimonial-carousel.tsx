'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define the type for a testimonial
type Testimonial = {
  quote: string;
  name: string;
  role: string;
  church: string;
};

const testimonials: Testimonial[] = [
  {
    quote: "This platform has transformed how we engage our congregation. Attendance and giving have increased significantly since implementation.",
    name: "Pastor Michael",
    role: "Senior Pastor",
    church: "Grace Community Church"
  },
  {
    quote: "The administrative tools have saved us countless hours. We can now focus on ministry instead of paperwork.",
    name: "Sarah Johnson",
    role: "Minister of Administration",
    church: "New Hope Fellowship"
  },
  {
    quote: "Our members love the mobile app and online giving options. Communication with our flock has never been easier.",
    name: "Rev. David Chen",
    role: "Lead Pastor",
    church: "Faith Bridge Ministries"
  },
  {
    quote: "The reporting features give us insights we never had before. Data-driven decisions have improved our outreach programs.",
    name: "Maria Rodriguez",
    role: "Church Administrator",
    church: "Light & Life Assembly"
  },
  {
    quote: "From events to small groups, everything is streamlined. Our volunteers are more engaged than ever.",
    name: "Dr. James Wilson",
    role: "Executive Pastor",
    church: "Redeemed Hearts Church"
  }
];

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to move to next slide
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  }, []);

  // Function to move to previous slide
  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Function to go to specific index
  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrev]);

  // Set up auto-rotation
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(goToNext, 6000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, goToNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <section 
      id="testimonials"
      className="py-20 md:py-28"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Testimonials from church leaders"
    >
      <div className="mx-auto max-w-[var(--max)] px-6">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
          Loved by church leaders
        </p>
        
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)]">
          What Our Users Say
        </h2>
        
        <div className="relative max-w-3xl mx-auto mt-12">
          {/* Testimonial Card */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-[var(--panel)] p-8 shadow-lg transition-opacity duration-500 ease-in-out"
            key={currentIndex}
          >
            <div className="flex flex-col items-center text-center">
              <svg 
                className="w-12 h-12 text-[var(--accent)] mb-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              <blockquote className="text-lg md:text-xl text-[var(--text)] mb-6 italic">
                "{testimonials[currentIndex].quote}"
              </blockquote>
              
              <div>
                <p className="font-medium text-[var(--text-strong)]">{testimonials[currentIndex].name}</p>
                <p className="text-sm text-[var(--muted)]">{testimonials[currentIndex].role}, {testimonials[currentIndex].church}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[var(--panel-2)] border border-[var(--border)] shadow-md hover:bg-[var(--panel-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text)]" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[var(--panel-2)] border border-[var(--border)] shadow-md hover:bg-[var(--panel-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-[var(--text)]" />
          </button>
          
          {/* Dot Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentIndex === idx 
                    ? 'bg-[var(--accent)]' 
                    : 'bg-[var(--muted)] hover:bg-[var(--text)]'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
