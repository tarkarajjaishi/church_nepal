'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself.
 *
 * This replaces the entire document, so it must render its own <html>/<body>
 * and cannot use the language provider, theme, fonts or any UI component —
 * they all live inside the layout that just failed. Hence the inline styles and
 * English-only copy: anything else risks throwing inside the error handler.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#0b3c5d',
          color: '#ffffff',
        }}
      >
        <main style={{ textAlign: 'center', maxWidth: '28rem' }} role="alert">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.85, lineHeight: 1.6 }}>
            The page failed to load. Please try again — if it keeps happening,
            please let the church office know.
          </p>
          {error.digest && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace' }}>
              {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#0b3c5d',
              background: '#d4a017',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}
