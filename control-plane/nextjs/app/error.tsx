'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <section className="py-20 md:py-28 flex items-center justify-center">
      <div className="mx-auto max-w-[var(--max)] px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-4">
          Something went wrong
        </h1>
        <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-soft)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}
