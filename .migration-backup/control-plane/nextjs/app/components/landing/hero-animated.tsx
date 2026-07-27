'use client';

import { useEffect, useRef, useState } from 'react';

const HeroAnimated = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const getPrefersReducedMotion = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  };

  const prefersReducedMotion = getPrefersReducedMotion();

  const getTextAnim = (delay: number) => ({
    opacity: isVisible || prefersReducedMotion ? 1 : 0,
    transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
    transition: prefersReducedMotion ? 'none' : `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`
  });

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div 
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        {/* Text Content */}
        <div className="flex flex-col justify-center z-10">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ ...getTextAnim(0), color: 'var(--text)' }}
          >
            Manage Your Church Operations with Ease
          </h1>
          
          <p 
            className="text-lg md:text-xl mb-8 max-w-2xl"
            style={{ ...getTextAnim(0.1), color: 'var(--muted)' }}
          >
            Streamline attendance tracking, donations, events, and member management with our all-in-one platform designed specifically for churches in Nepal.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4"
            style={getTextAnim(0.2)}
          >
            <button 
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--accent)',
                color: 'var(--max)',
              }}
            >
              Start Free Trial
            </button>
            <button 
              className="px-6 py-3 rounded-lg font-medium border transition-all duration-200"
              style={{ 
                borderColor: 'var(--border)',
                backgroundColor: 'var(--panel)',
                color: 'var(--text)',
              }}
            >
              Schedule Demo
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative">
          <div 
            className="w-full max-w-lg mx-auto"
            style={{
              transform: prefersReducedMotion || isVisible ? 'scale(1)' : 'scale(0.8)',
              opacity: prefersReducedMotion || isVisible ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'opacity 0.5s ease-out, transform 0.5s ease-out'
            }}
          >
            <DashboardMockup />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardMockup = () => {
  return (
    <div 
      className="relative w-full h-auto overflow-hidden rounded-2xl shadow-2xl"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--panel), var(--panel-2))',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header bar */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ 
          borderBottomColor: 'var(--border)',
          backgroundColor: 'var(--panel-2)',
        }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: 'var(--good)' }} 
          ></div>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: 'var(--accent-soft)' }} 
          ></div>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: 'var(--gold-soft)' }} 
          ></div>
        </div>
        <div 
          className="text-sm font-medium truncate"
          style={{ color: 'var(--text)' }}
        >
          Church Admin Dashboard
        </div>
        <div className="w-8"></div>
      </div>

      {/* Main dashboard content */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Stats Cards */}
          {[1, 2, 3].map((item) => (
            <div 
              key={item}
              className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5"
            >
              <div className="flex items-center">
                <div 
                  className="rounded-lg p-3 mr-4"
                  style={{ backgroundColor: item === 1 ? 'var(--accent-soft)' : item === 2 ? 'var(--good-soft)' : 'var(--gold-soft)' }}
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ 
                      color: item === 1 ? 'var(--accent)' : item === 2 ? 'var(--good)' : 'var(--gold-soft)' 
                    }}
                  >
                    {item === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                    {item === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {item === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  </svg>
                </div>
                <div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text)' }}
                  >
                    {item === 1 ? '1,248' : item === 2 ? 'Rs. 45,672' : '24 Events'}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    {item === 1 ? 'Members' : item === 2 ? 'Donations' : 'This Month'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div 
          className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 
              className="font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Attendance Overview
            </h3>
            <div 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: 'var(--accent-soft)', 
                color: 'var(--accent)' 
              }}
            >
              Last 30 days
            </div>
          </div>
          <div className="h-48 flex items-end space-x-1">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i}
                className="flex-1 flex flex-col items-center"
              >
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${Math.floor(Math.random() * 60) + 20}%`,
                    backgroundColor: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--good)' : 'var(--gold-soft)',
                    opacity: 0.8,
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5"
        >
          <h3 
            className="font-semibold mb-4"
            style={{ color: 'var(--text)' }}
          >
            Recent Activities
          </h3>
          <ul className="space-y-3">
            {[
              { action: 'New donation received', amount: 'Rs. 5,000', time: '2 hours ago' },
              { action: 'Member joined', name: 'Sam Poudel', time: '4 hours ago' },
              { action: 'Event created', event: 'Annual Fundraiser', time: '1 day ago' },
            ].map((activity, index) => (
              <li 
                key={index}
                className="flex justify-between items-center pb-3 border-b"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div>
                  <div 
                    className="font-medium text-sm"
                    style={{ color: 'var(--text)' }}
                  >
                    {activity.action}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    {Object.values(activity)[1]} • {activity.time}
                  </div>
                </div>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                ></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HeroAnimated;
