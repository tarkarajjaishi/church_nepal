'use client';

import { 
  Lock,
  Database,
  CreditCard, 
  IndianRupee, 
  Ship, 
  Globe, 
  Wind,
  FileText,
  Code,
  Server
} from 'lucide-react';
import React from 'react';

const LogoMarquee = () => {
  const techItems = [
    { name: 'Next.js', icon: Code },
    { name: 'Rust', icon: Server },
    { name: 'PostgreSQL', icon: Database },
    { name: 'eSewa', icon: CreditCard },
    { name: 'Khalti', icon: IndianRupee },
    { name: 'Docker', icon: Ship },
    { name: 'Caddy', icon: Globe },
    { name: 'Tailwind', icon: Wind },
    { name: 'JWT Auth', icon: Lock },
    { name: 'OpenAPI', icon: FileText }
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="relative overflow-hidden whitespace-nowrap">
          {/* Fade mask for smooth edge transition */}
          <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex w-max items-center gap-x-6 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
            {techItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] flex-shrink-0"
                >
                  <IconComponent size={18} className="text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text)]">{item.name}</span>
                </div>
              );
            })}
            
            {/* Duplicate items for seamless looping */}
            {techItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={`duplicate-${index}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] flex-shrink-0"
                >
                  <IconComponent size={18} className="text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text)]">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;
