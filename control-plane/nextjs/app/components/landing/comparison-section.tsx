'use client';

import { Check, X, Minus } from 'lucide-react';

export default function ComparisonSection() {
  // CSS variables already adapt to light/dark, so no theme hook is needed.
  const accentColors = {
    good: 'var(--good)', // Green for checks
    danger: 'var(--danger)', // Red for X
    muted: 'var(--muted)', // Muted for dashes
  };

  const features = [
    { label: 'Own Subdomain', churchNepal: true, diy: false },
    { label: 'Isolated Database', churchNepal: true, diy: false },
    { label: 'Separate Storage', churchNepal: true, diy: false },
    { label: 'Instant Admin Panel', churchNepal: true, diy: false },
    { label: 'Payments (eSewa/Khalti)', churchNepal: true, diy: 'limited' },
    { label: 'Ongoing Maintenance', churchNepal: true, diy: false },
    { label: 'Time to Launch', churchNepal: true, diy: false },
    { label: 'Predictable Cost', churchNepal: true, diy: false },
  ];

  return (
    <section id="compare" className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
          Compare Solutions
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-16 text-center">
          ChurchNepal vs Building It Yourself
        </h2>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 text-[var(--text-strong)]">Feature</th>
                <th className="text-center py-4 px-6 bg-[var(--accent-soft)] rounded-tl-2xl">
                  <span className="font-medium text-[var(--text-strong)]">ChurchNepal</span>
                </th>
                <th className="text-center py-4 px-6 bg-[var(--panel-2)] rounded-tr-2xl">
                  <span className="font-medium text-[var(--text-strong)]">DIY / Web Agency</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-[var(--panel)] ${index % 2 === 0 ? 'bg-[var(--panel)]' : ''}`}
                >
                  <td className="py-4 px-6 text-[var(--text)]">{feature.label}</td>
                  <td className="py-4 px-6 text-center">
                    {feature.churchNepal === true ? (
                      <Check size={24} style={{ color: accentColors.good }} className="inline mx-auto" />
                    ) : null}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {feature.diy === true ? (
                      <Check size={24} style={{ color: accentColors.good }} className="inline mx-auto" />
                    ) : feature.diy === false ? (
                      <X size={24} style={{ color: accentColors.danger }} className="inline mx-auto" />
                    ) : feature.diy === 'limited' ? (
                      <Minus size={24} style={{ color: accentColors.muted }} className="inline mx-auto" />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack */}
        <div className="md:hidden space-y-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-[var(--panel)] p-6 rounded-2xl shadow-lg">
              <h3 className="text-[var(--text-strong)] font-medium mb-6">{feature.label}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    {feature.churchNepal === true ? (
                      <Check size={20} style={{ color: accentColors.good }} />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">ChurchNepal</p>
                    <p className="text-[var(--text)]">
                      {feature.churchNepal === true ? 'Included' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    {feature.diy === true ? (
                      <Check size={20} style={{ color: accentColors.good }} />
                    ) : feature.diy === false ? (
                      <X size={20} style={{ color: accentColors.danger }} />
                    ) : feature.diy === 'limited' ? (
                      <Minus size={20} style={{ color: accentColors.muted }} />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">DIY / Web Agency</p>
                    <p className="text-[var(--text)]">
                      {feature.diy === true ? 'Included' :
                       feature.diy === false ? 'Not Included' :
                       feature.diy === 'limited' ? 'Limited' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
