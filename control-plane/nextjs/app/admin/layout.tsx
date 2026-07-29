"use client";

import { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile view
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Close sidebar when resizing from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[var(--panel)] border-r border-[var(--border)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-10 w-64 bg-[var(--panel)] border-r border-[var(--border)]">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="p-2 rounded-md text-[var(--text)] hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Link href="/admin" className="text-lg font-semibold text-[var(--text)]">
              Dashboard
            </Link>
            
            <div className="flex space-x-3">
              <button className="p-2 rounded-md text-[var(--text)] hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]">
                <span className="sr-only">Search</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-md text-[var(--text)] hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]">
                <span className="sr-only">Notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between w-full px-6 py-3">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[var(--muted)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-[var(--border-soft)] rounded-md leading-5 bg-[var(--panel)] placeholder-[var(--muted)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] sm:text-sm"
                />
              </div>
            </div>
            <div className="ml-4 flex items-center space-x-4">
              <button className="p-1 rounded-full text-[var(--text)] hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-10 pt-2 px-4 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
