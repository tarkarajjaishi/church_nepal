"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface SidebarProps {
  onClose?: () => void;
}

interface CurrentAdmin {
  email: string;
  role: string;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  // Identity was previously hardcoded to "Admin User / admin@churchnepal.com",
  // which showed the wrong person to every real operator.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setAdmin({ email: res.data.email, role: res.data.role });
      })
      .catch(() => {
        /* not signed in yet, or token still loading — leave placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sub-pages are listed, not hidden. Reports, flags, webhooks and the rest
  // existed as routes but appeared nowhere in this menu, so the only way to
  // reach them was to already know the URL.
  const navigation = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Churches', href: '/admin/churches' },
    {
      name: 'Admins', href: '/admin/admins',
      children: [{ name: 'Roles', href: '/admin/admins/roles' }],
    },
    {
      name: 'Billing', href: '/admin/billing',
      children: [{ name: 'Coupons', href: '/admin/billing/coupons' }],
    },
    {
      name: 'Analytics', href: '/admin/analytics',
      children: [{ name: 'Retention', href: '/admin/analytics/retention' }],
    },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Audit Log', href: '/admin/audit-log' },
    { name: 'Blog', href: '/admin/blog' },
    { name: 'Broadcasts', href: '/admin/broadcasts' },
    {
      name: 'Settings', href: '/admin/settings',
      children: [
        { name: 'Feature flags', href: '/admin/settings/flags' },
        { name: 'Email templates', href: '/admin/settings/emails' },
        { name: 'Webhooks', href: '/admin/settings/webhooks' },
        { name: 'Storage', href: '/admin/settings/storage' },
        { name: 'Backups', href: '/admin/settings/backups' },
        { name: 'Security', href: '/admin/settings/security' },
        { name: 'Tax', href: '/admin/settings/tax' },
        { name: 'API keys', href: '/admin/settings/api-keys' },
      ],
    },
    { name: 'Notifications', href: '/admin/notifications' },
    { name: 'Status', href: '/admin/status' },
    { name: 'Ops', href: '/admin/ops' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo section */}
      <div className="flex items-center px-4 py-5 border-b border-[var(--border)]">
        <Link href="/admin" className="text-xl font-bold text-[var(--text)]">
          Church Nepal
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-auto p-2 rounded-md text-[var(--text)] hover:bg-[var(--panel)] lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            // A section's own pages show only while you are inside it, so the
            // menu does not become forty links deep on the dashboard.
            const inside = pathname.startsWith(item.href) && item.href !== '/admin';
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--text)] hover:bg-[var(--panel-2)]'
                  }`}
                >
                  <span>{item.name}</span>
                </Link>

                {inside && item.children && (
                  <ul className="mt-0.5 mb-1 ml-4 pl-3 border-l border-[var(--border)] space-y-0.5">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={onClose}
                          aria-current={pathname === c.href ? 'page' : undefined}
                          className={`block px-3 py-2 text-[13px] rounded-md transition-colors ${
                            pathname === c.href
                              ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                              : 'text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
              <span className="text-[var(--accent)] font-medium">
                {(admin?.email ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] capitalize">
              {admin ? admin.role.replace('_', ' ') : 'Signed in'}
            </p>
            <p className="text-xs text-[var(--muted)] truncate" title={admin?.email}>
              {admin?.email ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
