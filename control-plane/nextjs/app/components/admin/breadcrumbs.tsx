"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  // Remove /admin prefix and split the remaining path
  const segments = pathname.replace('/admin', '').split('/').filter(segment => segment !== '');

  // Define a mapping for readable titles
  const segmentTitles: Record<string, string> = {
    'churches': 'Churches',
    'analytics': 'Analytics',
    'billing': 'Billing',
    'invoices': 'Invoices',
    'plans': 'Plans',
    'admins': 'Admins',
    'settings': 'Settings',
  };

  // Build the breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    // Check if it's a numeric ID
    const isId = /^\d+$/.test(segment);
    const title = isId ? segment : (segmentTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));
    // Construct the href up to this point
    const href = `/admin/${segments.slice(0, index + 1).join('/')}`;

    return {
      title,
      href,
      isLast: index === segments.length - 1,
    };
  });

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 mb-6">
      {/* Home link */}
      <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
        Admin
      </Link>
      <ChevronRight className="w-4 h-4 text-[var(--muted)]" />

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.isLast ? (
            <span className="text-[var(--text)] font-medium">{item.title}</span>
          ) : (
            <Link
              href={item.href}
              className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              {item.title}
            </Link>
          )}
          {!item.isLast && <ChevronRight className="w-4 h-4 text-[var(--muted)] mx-2" />}
        </div>
      ))}
    </nav>
  );
}
