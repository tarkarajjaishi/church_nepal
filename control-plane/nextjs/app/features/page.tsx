"use client";

import { useI18n } from '@/components/i18n-hook';
import PublicLayout from '../public-layout';

export default function FeaturesPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-6">
              {t('featuresTitle')}
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{t('feature1')}</h3>
              <p className="text-[var(--muted)]">{t('feature1Desc')}</p>
            </div>

            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{t('feature2')}</h3>
              <p className="text-[var(--muted)]">{t('feature2Desc')}</p>
            </div>

            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{t('feature3')}</h3>
              <p className="text-[var(--muted)]">{t('feature3Desc')}</p>
            </div>

            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{t('feature4')}</h3>
              <p className="text-[var(--muted)]">{t('feature4Desc')}</p>
            </div>

            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Secure Donations</h3>
              <p className="text-[var(--muted)]">Accept donations with industry-leading security</p>
            </div>

            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Reporting</h3>
              <p className="text-[var(--muted)]">Comprehensive reports to track your church growth</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
