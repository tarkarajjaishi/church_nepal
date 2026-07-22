'use client';

import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section id="get-started" className="py-20 md:py-28 w-full">
      {/* Gradient background with subtle pattern overlay */}
      <div 
        className="relative w-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        }}
      >
        {/* Dotted/grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle, var(--accent-soft) 1px, transparent 1px),
              radial-gradient(circle, var(--accent-soft) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px'
          }}
        />
        
        <div className="relative mx-auto max-w-[var(--max)] px-6 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Give every church its own website
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Empower churches with modern, easy-to-use tools for their digital presence.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold text-[var(--accent)] shadow-sm transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--accent)]"
            >
              Get Started
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--accent)]"
            >
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
