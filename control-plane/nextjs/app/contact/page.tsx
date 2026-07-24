"use client";

import { useI18n } from '@/components/i18n-hook';
import PublicLayout from '../public-layout';

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-6">
              {t('contactTitle')}
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto">
              {t('contactSubtitle')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto bg-[var(--panel)] border border-[var(--border)] rounded-xl p-8">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-[var(--text)] mb-2">
                  {t('name')}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)]"
                  placeholder={t('name')}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-[var(--text)] mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)]"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-[var(--text)] mb-2">
                  {t('message')}
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)]"
                  placeholder={t('message')}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)] transition-colors font-medium"
              >
                {t('send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
