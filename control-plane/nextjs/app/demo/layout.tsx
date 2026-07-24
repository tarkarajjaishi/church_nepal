"use client";

import { ReactNode } from 'react';

export default function DemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Dismissible demo banner */}
      <div className="bg-[var(--accent-soft)] text-[var(--text-strong)] py-2 px-4 flex justify-between items-center">
        <span>You're in a live demo -- Sign up to go live</span>
        <button 
          aria-label="Close demo banner"
          className="text-[var(--text-strong)] hover:text-white focus:outline-none"
          onClick={() => document.getElementById('demo-banner')?.remove()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="flex">
        {children}
      </div>
    </div>
  );
}
