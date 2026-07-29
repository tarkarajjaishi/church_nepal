'use client';

import { notFound } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getComparisonData } from '@/lib/compare-data';
import PublicLayout from '@/public-layout';

export default function ComparePage() {
  const params = useParams();
  const competitor = params.competitor as string;

  if (!['wix', 'squarespace', 'wordpress', 'weebly'].includes(competitor)) {
    notFound();
  }

  const data = getComparisonData(competitor);

  return (
    <PublicLayout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Churchnepal vs {data.name}</h1>
            <p className="text-lg text-[var(--muted)] max-w-3xl mx-auto">
              A detailed feature-by-feature comparison showing why churches choose Churchnepal over {data.name}
            </p>
          </header>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-16">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-[var(--panel-2)] border-b border-[var(--border)]">Feature</th>
                  <th className="p-4 text-center bg-[var(--panel-2)] border-b border-[var(--border)]">{data.name}</th>
                  <th className="p-4 text-center bg-[var(--panel-2)] border-b border-[var(--border)]">Churchnepal</th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((feature, index) => (
                  <tr key={index} className="border-b border-[var(--border-soft)] hover:bg-[var(--panel-3)]">
                    <td className="p-4 font-medium">{feature.name}</td>
                    <td className="p-4 text-center">
                      {feature.competitor === true ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--good-soft)] text-[var(--good)]">
                          ✓
                        </span>
                      ) : feature.competitor === false ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                          ✗
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">{feature.competitor || 'N/A'}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {feature.churchnepal === true ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--good-soft)] text-[var(--good)]">
                          ✓
                        </span>
                      ) : feature.churchnepal === false ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                          ✗
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">{feature.churchnepal || 'N/A'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Why Churches Pick Us Section */}
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-12">
            <h2 className="text-2xl font-bold mb-6">Why Churches Choose Churchnepal Over {data.name}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Tailored for Churches</h3>
                <p className="text-[var(--muted)]">
                  Our platform is built specifically for churches with features like member management, 
                  donation tracking, event planning, and prayer request systems out-of-the-box.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Better Value</h3>
                <p className="text-[var(--muted)]">
                  We offer competitive pricing with transparent costs and no hidden fees, designed to fit 
                  church budgets while providing essential tools for growth.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Dedicated Support</h3>
                <p className="text-[var(--muted)]">
                  Our team understands the unique needs of churches and provides specialized support 
                  to help you succeed with your online presence.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Easy Management</h3>
                <p className="text-[var(--muted)]">
                  Intuitive admin panel designed for non-technical users, allowing church staff to 
                  easily manage content, events, and communications.
                </p>
              </div>
            </div>
          </div>

          {/* Verdict Section */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Our Verdict</h2>
            <p className="text-lg text-[var(--muted)] mb-6">
              {data.verdict}
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="/signup" 
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)] transition-colors"
              >
                Start Free Trial
              </a>
              <a 
                href="/demo" 
                className="px-6 py-3 border border-[var(--border)] rounded-lg hover:bg-[var(--panel-2)] transition-colors"
              >
                Request Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
