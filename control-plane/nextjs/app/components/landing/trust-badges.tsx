'use client';

import { Badge } from '@/components/ui/badge';

const TrustBadges = () => {
  const badges = [
    {
      id: 'ssl',
      label: 'SSL Secured',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-shield-check"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'backups',
      label: 'Daily Backups',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-cloud-download"
        >
          <path d="M12 13v8" />
          <path d="m8 17 4 4 4-4" />
          <path d="M4.57 16.57A8 8 0 0 1 8 2.5" />
          <path d="M19.43 16.57A8 8 0 0 0 16 2.5" />
        </svg>
      ),
    },
    {
      id: 'uptime',
      label: '99.9% Uptime',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-activity"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      id: 'gdpr',
      label: 'GDPR-friendly',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-shield"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
      ),
    },
    {
      id: 'payments',
      label: 'Nepal Payments',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-credit-card"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map((badge) => (
        <Badge
          key={badge.id}
          variant="secondary"
          className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--border-soft)] hover:bg-[var(--panel-3)] transition-colors"
        >
          <span className="inline-flex" aria-hidden="true">
            {badge.icon}
          </span>
          <span>{badge.label}</span>
        </Badge>
      ))}
    </div>
  );
};

export default TrustBadges;
