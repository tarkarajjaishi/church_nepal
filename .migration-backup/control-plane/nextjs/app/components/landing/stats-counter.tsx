"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export default function StatsCounter() {
  const [stats] = useState<Stat[]>([
    { value: 500, suffix: "+", label: "Churches" },
    { value: 1000000, suffix: "+", label: "Members" },
    { value: 99.9, suffix: "%", label: "Uptime" },
    { value: 24, suffix: "/7", label: "Support" },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  }, [isVisible]);

  return (
    <div ref={containerRef} className="py-12 bg-[var(--panel-2)]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  stat: Stat;
  isVisible: boolean;
}

function StatCard({ stat, isVisible }: StatCardProps) {
  const { value, suffix, label } = stat;
  const displayValueRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible || !displayValueRef.current) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 2000; // Animation duration in ms
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth acceleration/deceleration
      const easeInOutCubic = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentValue = easeInOutCubic * value;
      let formattedValue: string;

      if (label === "Members") {
        formattedValue = Math.floor(currentValue).toLocaleString();
      } else {
        formattedValue = currentValue.toFixed(label === "Uptime" ? 1 : 0);
      }

      if (displayValueRef.current) {
        displayValueRef.current.textContent = formattedValue + (suffix || "");
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, value, suffix, label]);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span
        ref={displayValueRef}
        className="text-4xl md:text-5xl font-bold text-[var(--text-strong)]"
      >
        {isVisible ? "0" : `0${suffix || ""}`}
      </span>
      <p className="mt-2 text-base md:text-lg text-[var(--muted)]">{label}</p>
    </div>
  );
}
