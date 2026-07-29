'use client';

import { CreditCard, MessageCircle, Image, Database, Globe, Zap } from 'lucide-react';

const IntegrationsSection = () => {
  const integrations = [
    {
      icon: CreditCard,
      title: 'eSewa',
      description: 'Integrated payment gateway for seamless donations.',
    },
    {
      icon: CreditCard,
      title: 'Khalti',
      description: 'Popular local payment solution for Nepal.',
    },
    {
      icon: MessageCircle,
      title: 'Email/Newsletter',
      description: 'Automated communication tools for members.',
    },
    {
      icon: Image,
      title: 'Media Storage',
      description: 'Cloud storage for images and documents.',
    },
    {
      icon: Database,
      title: 'PostgreSQL',
      description: 'Robust database for data integrity.',
    },
    {
      icon: Globe,
      title: 'Custom Domain (Pro)',
      description: 'Personalize your church website URL.',
    },
  ];

  return (
    <section id="integrations" className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">CONNECTED ECOSYSTEM</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)]">Payments & Integrations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex flex-col group p-6 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md min-h-[160px]"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-4 rounded-lg bg-[var(--accent-soft)]">
                  <IconComponent className="w-6 h-6 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">{item.title}</h3>
                <p className="text-[var(--muted)] flex-grow">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--muted)] flex items-center justify-center gap-1">
            <Zap className="w-4 h-4" aria-hidden="true" />
            More integrations coming soon...
          </p>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
