'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, Monitor, X } from 'lucide-react';

const links = [
  { href: '/docs', label: 'Docs', icon: BookOpen },
  { href: '/contact', label: 'Contact us', icon: MessageSquare },
  { href: '/status', label: 'Status', icon: Monitor },
  { href: '/blog', label: 'Read the blog', icon: BookOpen },
];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <Card
          className="mb-4 w-80 max-w-[calc(100vw-2rem)]"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">How can we help?</CardTitle>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close support panel"
              className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <X size={18} />
            </button>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {links.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-6 py-2.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
              >
                <Icon size={16} className="text-[var(--accent)]" aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </CardContent>
          <CardFooter className="pt-4">
            <p className="text-xs text-[var(--muted)]">
              Avg. reply time: under 2 hours
            </p>
          </CardFooter>
        </Card>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close support' : 'Open support'}
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[var(--accent)]
          text-white
          shadow-lg
          transition-transform
          hover:bg-[var(--accent)/90]
          focus:outline-none
          focus:ring-2
          focus:ring-[var(--accent)]
          focus:ring-offset-2
          focus:ring-offset-[var(--bg)]
        "
      >
        {open ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
