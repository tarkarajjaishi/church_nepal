"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const Breadcrumbs = () => {
  const pathname = usePathname();
  // Remove leading slash and split the remaining path
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  // Build breadcrumbs array with label and href
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Create the href up to this point
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    // Format the label - capitalize and replace hyphens/underscores
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ');

    return { label, href };
  });

  return (
    <nav className="flex items-center gap-2">
      {/* Home link */}
      <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-2)] transition-colors">
        Home
      </Link>
      <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0" aria-hidden="true" />
      
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div key={index} className="flex items-center">
            {isLast ? (
              <span className="text-[var(--muted)]">{crumb.label}</span>
            ) : (
              <>
                <Link 
                  href={crumb.href}
                  className="text-[var(--accent)] hover:text-[var(--accent-2)] transition-colors truncate max-w-xs"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0 mx-2" aria-hidden="true" />
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
