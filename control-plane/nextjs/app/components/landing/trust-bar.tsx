'use client';

import { Database, ShieldCheck, Zap, CreditCard, Globe } from 'lucide-react';

const TrustBar = () => {
  const stats = [
    { icon: Database, label: 'Isolated DB per church' },
    { icon: ShieldCheck, label: '99.9% uptime target' },
    { icon: Zap, label: 'Provision in < 60s' },
    { icon: CreditCard, label: 'eSewa + Khalti built-in' },
    { icon: Globe, label: 'EN / नेपाली' },
  ];

  return (
    <section id="trust" className="py-3 bg-[var(--panel-2)]">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)] whitespace-nowrap">
            Trusted by churches across Nepal
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full"
              >
                <stat.icon size={16} className="text-[var(--accent)]" />
                <span className="text-xs font-medium text-[var(--text)]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
