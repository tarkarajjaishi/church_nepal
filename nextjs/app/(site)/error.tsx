'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/language';

/**
 * Error boundary for the public site.
 *
 * Without this, a render error on any of the ~80 public pages fell through to
 * Next's built-in 500 page — unbranded, English-only, and with no way to
 * recover except editing the URL. This keeps the site's chrome and offers a
 * retry, and unlike the old fallback it speaks Nepali when the visitor does.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();

  useEffect(() => {
    // Surface it for whatever is collecting client errors; the digest is what
    // correlates this with the server log entry.
    console.error('Site render error:', error);
  }, [error]);

  return (
    <section className="min-h-[70vh] grid place-items-center px-4 py-16">
      <div className="text-center max-w-md" role="alert">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <h1
          className="text-church-blue"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.75rem' }}
        >
          {t('error_title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('error_body')}</p>

        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/70 font-mono">
            {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} size="lg">
            <RotateCcw className="size-4" /> {t('try_again')}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home className="size-4" /> {t('back_home')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
