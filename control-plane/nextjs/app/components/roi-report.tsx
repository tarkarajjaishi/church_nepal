'use client';

import { useEffect } from 'react';

// This component is designed to be rendered only when printing
const RoiReport = () => {
  useEffect(() => {
    // Automatically trigger print when component mounts
    window.print();
  }, []);

  // Hide this element on screen, show only when printing
  return (
    <div className="hidden print:block w-full max-w-4xl mx-auto p-8">
      <style jsx>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1cm; }
        }
      `}</style>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Church Nepal ROI Report</h1>
        <p className="text-[var(--muted)]">Generated on {new Date().toLocaleDateString()}</p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">Executive Summary</h2>
        <p className="text-[var(--text)] mb-4">
          Based on your inputs, our analysis estimates the potential savings your church could achieve
          by switching to our all-in-one management platform.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="border border-[var(--border)] rounded-lg p-4 text-center">
            <h3 className="font-semibold text-[var(--text)]">Staff Time Saved</h3>
            <p className="text-2xl font-bold text-[var(--accent)] mt-2">~10 hrs/wk</p>
            <p className="text-sm text-[var(--muted)] mt-1">Equivalent to $1,200+/yr</p>
          </div>
          
          <div className="border border-[var(--border)] rounded-lg p-4 text-center">
            <h3 className="font-semibold text-[var(--text)]">Software Cost Savings</h3>
            <p className="text-2xl font-bold text-[var(--accent)] mt-2">$800/yr</p>
            <p className="text-sm text-[var(--muted)] mt-1">Consolidating multiple tools</p>
          </div>
          
          <div className="border border-[var(--border)] rounded-lg p-4 text-center">
            <h3 className="font-semibold text-[var(--text)]">Total Annual Savings</h3>
            <p className="text-3xl font-bold text-[var(--good)] mt-2">$2,000+</p>
            <p className="text-sm text-[var(--muted)] mt-1">Based on your inputs</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">Detailed Breakdown</h2>
        <ul className="list-disc pl-5 space-y-2 text-[var(--text)]">
          <li>Automated donation tracking reduces manual data entry by 5+ hours per week</li>
          <li>Integrated event management eliminates need for separate calendar and RSVP tools</li>
          <li>Unified member database prevents duplicate data across multiple platforms</li>
          <li>Centralized communication tools reduce admin overhead significantly</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">Next Steps</h2>
        <p className="text-[var(--text)] mb-4">
          Ready to realize these savings? Contact us to schedule a personalized demo of our platform
          tailored to your church's specific needs.
        </p>
        <div className="bg-[var(--panel-2)] p-4 rounded-lg">
          <h3 className="font-semibold text-[var(--text)]">Contact Information</h3>
          <p className="text-[var(--muted)] mt-2">Email: info@churchnepal.com</p>
          <p className="text-[var(--muted)]">Phone: +977-000-000-000</p>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-[var(--border)] text-center text-[var(--muted)] text-sm">
        <p>© {new Date().getFullYear()} Church Nepal. All rights reserved.</p>
        <p>This report is generated based on estimated inputs and actual savings may vary.</p>
      </footer>
    </div>
  );
};

export default RoiReport;
