"use client";

import { useI18n } from '@/components/i18n-hook';
import PublicLayout from '../public-layout';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-6">
              {t('aboutTitle')}
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto">
              {t('aboutSubtitle')}
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-[var(--panel)] border border-[var(--border)] rounded-xl p-8">
            <p className="text-lg text-[var(--text)] leading-relaxed mb-6">
              {t('aboutContent')}
            </p>
            
            <p className="text-lg text-[var(--text)] leading-relaxed">
              Our mission is to provide churches in Nepal with modern tools to connect with their communities, manage their operations efficiently, and spread their message effectively. We understand the unique needs of churches in Nepal and have designed our platform accordingly.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
