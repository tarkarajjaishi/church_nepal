/**
 * Navigation shim — replaces next/navigation with wouter equivalents.
 * Imported automatically because all `from 'next/navigation'` were rewritten
 * to `from '@/lib/navigation'` during migration.
 */
import {
  useLocation,
  useParams as wouterUseParams,
} from 'wouter';

/** Mirrors Next.js useRouter surface used in this codebase. */
export function useRouter() {
  const [, setLocation] = useLocation();
  return {
    push: (href: string) => setLocation(href),
    replace: (href: string) => setLocation(href, { replace: true }),
    back: () => window.history.back(),
    prefetch: () => {},
    refresh: () => window.location.reload(),
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  };
}

/** Mirrors Next.js usePathname. */
export function usePathname() {
  const [location] = useLocation();
  return location;
}

/** Mirrors Next.js useSearchParams. */
export function useSearchParams() {
  return new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
}

/** Mirrors Next.js useParams — returns wouter dynamic segment params. */
export function useParams<T extends Record<string, string>>(): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return wouterUseParams() as unknown as T;
}

/**
 * Mirrors Next.js redirect.
 * In Vite/SPA context we navigate instead of throwing.
 * Components calling this in a render should call it from an effect instead.
 */
export function redirect(href: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = href;
  }
}
