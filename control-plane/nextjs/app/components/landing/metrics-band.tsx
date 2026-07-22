'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Clock, Globe, Shield } from 'lucide-react';

export type MetricProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ReactNode;
  hideCounter?: boolean;
};

const MetricCard = ({ value, suffix, prefix, label, icon, hideCounter }: MetricProps) => {
  const [displayValue, setDisplayValue] = useState(hideCounter ? value : 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideCounter) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000; // ms
          const startTime = performance.now();

          const updateCount = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(progress * value);

            if (progress < 1) {
              setDisplayValue(currentValue);
              requestAnimationFrame(updateCount);
            } else {
              setDisplayValue(value); // Ensure final value is reached
            }
          };

          requestAnimationFrame(updateCount);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [value, hideCounter]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center p-6 text-center"
      aria-label={`${label}: ${prefix || ''}${displayValue}${suffix || ''}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <p className="text-3xl font-bold text-[var(--text-strong)] sm:text-4xl">
        {prefix && !hideCounter && `${prefix}`}
        {prefix && hideCounter && `${prefix} `}
        {displayValue}
        {suffix || ''}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">{label}</p>
    </div>
  );
};

const MetricsBand = () => {
  const metrics: MetricProps[] = [
    {
      value: 120,
      suffix: '+',
      label: 'Churches Launched',
      icon: <Users size={24} />,
    },
    {
      value: 99.9,
      suffix: '%',
      label: 'Uptime',
      icon: <Shield size={24} />,
    },
    {
      value: 1,
      label: 'Minutes to Launch',
      prefix: '< ',
      icon: <Clock size={24} />,
      hideCounter: true,
    },
    {
      value: 8,
      suffix: '+',
      label: 'Countries',
      icon: <Globe size={24} />,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--panel-2)] border-y border-[var(--border)]">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsBand;
