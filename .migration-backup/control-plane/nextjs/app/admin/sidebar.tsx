"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Churches', href: '/admin/churches' },
    { name: 'Admins', href: '/admin/admins' },
    { name: 'Billing', href: '/admin/billing' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Audit Log', href: '/admin/audit-log' },
    { name: 'Blog', href: '/admin/blog' },
    { name: 'Broadcasts', href: '/admin/broadcasts' },
    { name: 'Settings', href: '/admin/settings' },
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
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text)] hover:bg-[var(--panel-2)]'
                }`}
              >
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
              <span className="text-[var(--accent)] font-medium">A</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-[var(--text)]">Admin User</p>
            <p className="text-xs text-[var(--muted)]">admin@churchnepal.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
