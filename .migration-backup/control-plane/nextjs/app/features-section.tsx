"use client";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M5.64 5.64l1.99 1.99" />
        <path d="M16.36 16.36l1.99 1.99" />
      </svg>
    ),
    title: "Own Subdomain",
    description: "Each church lives at yourchurch.churchnepal.com — clean, brandable, and instantly available the moment it's created.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="12" rx="8" ry="5" />
        <path d="M5 12v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4" />
        <rect x="9" y="8" width="6" height="4" rx="1" />
      </svg>
    ),
    title: "Isolated Database",
    description: "A dedicated PostgreSQL database per church. Members, giving, and content stay fully separate with zero data crossover.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
      </svg>
    ),
    title: "Private Storage",
    description: "A separate media folder per church. Photos, uploads, and documents never mix between congregations.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    title: "Headless CMS",
    description: "Every section — text, images, lists — is editable from the admin panel. No code, no developers needed.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 7h3a5 5 0 0 1 0 10h-3" />
        <path d="M9 17H6a5 5 0 0 1 0-10h3" />
        <path d="M12 2v20" />
      </svg>
    ),
    title: "Instant Admin Login",
    description: "An admin account is auto-generated for each church the moment it's created — ready to customize immediately.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
        <path d="M1 12h2" />
        <path d="M21 12h2" />
        <path d="M4.22 19.78l1.42-1.42" />
        <path d="M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    title: "Beautiful Themes",
    description: "Each church gets a polished, modern website that looks great on every device out of the box.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="lp-section">
      <h2 className="lp-h2">Everything each church needs, isolated by design</h2>
      <p className="lp-sub2">Data never crosses between churches. Provision in one click.</p>
      <div className="lp-grid">
        {features.map((feature, index) => (
          <div key={index} className="lp-feature">
            <span className="lp-feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}