'use client';

import { Lock, Database, FolderLock, ShieldCheck, Server, Key } from 'lucide-react';

const SecuritySection = () => {
  const features = [
    {
      icon: Database,
      title: 'Dedicated PostgreSQL Database',
      description: 'Each church has its own isolated database instance'
    },
    {
      icon: FolderLock,
      title: 'Separate Storage Folders',
      description: 'Files and assets stored separately per organization'
    },
    {
      icon: ShieldCheck,
      title: 'JWT-Secured Admin Access',
      description: 'Secure authentication for administrative functions'
    },
    {
      icon: Server,
      title: 'Per-Request Tenant Resolution',
      description: 'Automatic identification and routing of requests'
    },
    {
      icon: Key,
      title: 'Automated Backups Ready',
      description: 'Scheduled backups configured for each tenant'
    },
    {
      icon: Lock,
      title: 'Zero Data Crossover',
      description: 'Strict separation prevents any data sharing between tenants'
    }
  ];

  return (
    <section id="security" className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
            Security & Privacy
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-3">
            Enterprise-Grade Protection
          </h2>
          <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
            Our multi-tenant architecture ensures complete data isolation between churches. 
            Each organization operates within its own secure environment with dedicated resources 
            and strict access controls.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="bg-[var(--panel)] p-6 rounded-xl border border-[var(--border)] shadow-lg flex flex-col"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-[var(--accent-soft)] p-2 rounded-lg">
                    <IconComponent className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-strong)] mb-1">{feature.title}</h3>
                    <p className="text-[var(--muted)] text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
