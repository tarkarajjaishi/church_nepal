import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="py-20 md:py-28 flex items-center justify-center">
      <div className="mx-auto max-w-[var(--max)] px-6 text-center">
        <div className="mb-8 text-[10rem] md:text-[14rem] font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-4">
          Page Not Found
        </h1>
        <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link href="/" passHref>
          <button className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-soft)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]">
            Go Back Home
          </button>
        </Link>
      </div>
    </section>
  );
}
