"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

interface Testimonial {
  quote: string;
  name: string;
  church: string;
  avatar?: string;
}

const stats: Stat[] = [
  { value: 1247, suffix: "+", label: "Churches launched" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 3, suffix: " min", label: "Minutes to launch" },
  { value: 12, suffix: "+", label: "Countries served" },
];

const testimonials: Testimonial[] = [
  {
    quote: "ChurchNepal has transformed how we manage our online presence. The instant provisioning and clean admin interface make it so easy for our team to keep our website updated.",
    name: "Pastor Raj Kumar",
    church: "Grace Community Church, Kathmandu",
  },
  {
    quote: "Finally, a platform that understands the unique needs of churches. The data isolation gives us peace of mind, and the themes look beautiful out of the box.",
    name: "Sarah Thompson",
    church: "Mountain View Fellowship, Pokhara",
  },
  {
    quote: "We went from no website to a fully functional, professional site in under 5 minutes. The support team has been incredibly helpful every step of the way.",
    name: "Deacon Amit Sharma",
    church: "Hope Church Nepal, Lalitpur",
  },
];

// Count-up animation hook
function useCountUp(targetValue: number, isActive: boolean, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * targetValue);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, isActive, duration]);

  return count;
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="lp-section">
      {/* Stats Row */}
      <div className="max-w-[var(--max)] mx-auto mb-[var(--space-16)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const count = useCountUp(stat.value, isVisible);
            const displayValue = stat.value === 99.9
              ? (count / 10).toFixed(1)
              : count.toString();

            return (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[var(--text-strong)] mb-2">
                  {displayValue}
                  {stat.suffix}
                </div>
                <div className="text-sm text-[var(--muted)] font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testimonials Row */}
      <div className="max-w-[var(--max)] mx-auto">
        <div className="text-center mb-[var(--space-10)]">
          <h2 className="lp-h2">Trusted by churches worldwide</h2>
          <p className="lp-sub2">
            Hear what church leaders are saying about ChurchNepal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="elevated" className="flex flex-col h-full">
              <div className="flex-1">
                <svg
                  className="w-8 h-8 text-[var(--accent)] mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.002c0-1.003-.021-1.654-.06-2.203-.04-.527-.12-1.076-.24-1.645-.12-.569-.28-1.12-.48-1.66a8.016 8.016 0 00-1.54-2.31c-.34-.45-.73-.78-1.16-1.01a4.003 4.003 0 00-2.5-.31c-.45 0-.88.06-1.29.18-.41.12-.78.28-1.11.48-.33.2-.62.44-.87.72-.25.28-.45.58-.6.9-.15.32-.25.65-.3 1-.05.35-.07.7-.07 1.05v.35c0 .25.01.48.04.7.03.22.07.43.12.63.05.2.1.39.16.57.06.18.13.35.2.51.08.16.17.3.26.43.09.13.2.25.32.35.12.1.26.18.4.24.14.06.3.1.45.13.15.03.28.07.41.1.45l.02.04c.03.02.05.04.08.05.03.01.06.02.09.03.03.01.06.02.09.03.03.01.07.02.11.03.04.01.08.02.12.03.04.01.08.02.12.03.04.01.08.02.12.03.04.01.08.02.12.03l.02.01c.04.01.08.03.12.04.04.01.08.03.12.04.04.01.08.03.12.04l.02.01z" />
                </svg>
                <p className="text-[var(--text)] mb-6 leading-relaxed">
                  {testimonial.quote}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>
                    {testimonial.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[var(--text-strong)] text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-[var(--muted)] text-xs">
                    {testimonial.church}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}