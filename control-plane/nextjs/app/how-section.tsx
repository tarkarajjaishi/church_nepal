"use client";

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Name the church",
    description: "Type the church name in the dashboard and hit create.",
  },
  {
    number: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="21" x2="22" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "We provision everything",
    description: "A subdomain, a database, a storage folder, and an admin login — automatically.",
  },
  {
    number: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 8 10.01" />
      </svg>
    ),
    title: "The church takes over",
    description: "They edit their own site from the admin. You oversee every church from one place.",
  },
];

export default function HowSection() {
  return (
    <section id="how" className="lp-section lp-how relative">
      {/* Section Header */}
      <div className="text-center mb-[var(--space-16)]">
        <h2 className="lp-h2">From name to live site in three steps</h2>
        <p className="lp-sub2">
          Launch a fully-isolated church website in three simple steps
        </p>
      </div>

      {/* Steps Container */}
      <div className="lp-steps relative">
        {steps.map((step) => (
          <div key={step.number} className="lp-step flex flex-col items-center text-center">
            {/* Step Number Badge */}
            <div className="lp-step-n" aria-label={`Step ${step.number}`}>
              {step.number}
            </div>

            {/* Step Icon */}
            <span className="lp-step-icon" aria-hidden="true">
              {step.icon}
            </span>

            {/* Step Content */}
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}

        {/* Connecting Line - visible on desktop */}
        <div className="hidden md:block absolute top-19 left-0 right-0" aria-hidden="true">
          <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
            <line x1="15" y1="10" x2="85" y2="10" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15" cy="10" r="3" fill="var(--accent)" />
            <circle cx="50" cy="10" r="3" fill="var(--accent)" />
            <circle cx="85" cy="10" r="3" fill="var(--accent)" />
          </svg>
        </div>
      </div>
    </section>
  );
}
