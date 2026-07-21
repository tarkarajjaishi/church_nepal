"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ComparisonFeature {
  feature: string;
  free: boolean | string;
  standard: boolean | string;
  pro: boolean | string;
}

// Feature comparison data
const comparisonFeatures: ComparisonFeature[] = [
  { feature: "Own subdomain (yourchurch.churchnepal.com)", free: true, standard: true, pro: true },
  { feature: "Isolated PostgreSQL database", free: true, standard: true, pro: true },
  { feature: "Private media storage", free: "100 MB", standard: "1 GB", pro: "10 GB" },
  { feature: "Headless CMS for content", free: true, standard: true, pro: true },
  { feature: "Instant admin login", free: true, standard: true, pro: true },
  { feature: "Beautiful themes", free: true, standard: true, pro: true },
  { feature: "Members included", free: "10", standard: "100", pro: "1,000" },
  { feature: "Email sends/month", free: "500", standard: "5,000", pro: "50,000" },
  { feature: "Churches included", free: "1", standard: "10", pro: "Unlimited" },
  { feature: "Custom domain support", free: false, standard: true, pro: true },
  { feature: "Priority support", free: false, standard: true, pro: true },
  { feature: "Advanced customization", free: false, standard: false, pro: true },
  { feature: "API access", free: false, standard: false, pro: true },
  { feature: "White labeling", free: false, standard: false, pro: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="flex justify-center">
        <svg className="w-6 h-6 text-[var(--good)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="flex justify-center">
        <svg className="w-5 h-5 text-[var(--muted-2)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  // String value (like limits)
  return (
    <span className="text-center font-medium text-[var(--text-strong)]">
      {value}
    </span>
  );
}

export default function FeatureComparisonTable() {
  return (
    <section className="section-wrapper-lg">
      <div className="max-w-[var(--max)] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-[var(--space-10)]">
          <h2 className="pricing-title">Compare all plans</h2>
          <p className="pricing-subtitle">
            A detailed breakdown of features across all pricing tiers
          </p>
        </div>

        {/* Desktop Table - Hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--panel)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-[var(--border)]">
                  <TableHead className="w-1/3 font-semibold text-[var(--text-strong)]">
                    Features
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <div className="text-center">
                      <span className="text-lg text-[var(--text-strong)]">Free</span>
                      <div className="text-sm text-[var(--muted)] font-normal mt-1">
                        For small ministries
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <div className="text-center">
                      <span className="text-lg text-[var(--accent)]">Standard</span>
                      <div className="text-sm text-[var(--muted)] font-normal mt-1">
                        For growing churches
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <div className="text-center">
                      <span className="text-lg text-[var(--text-strong)]">Pro</span>
                      <div className="text-sm text-[var(--muted)] font-normal mt-1">
                        For large congregations
                      </div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonFeatures.map((item, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-[var(--panel-2)]/30" : ""}>
                    <TableCell className="font-medium text-[var(--text)]">
                      {item.feature}
                    </TableCell>
                    <TableCell className="text-center">
                      <FeatureCell value={item.free} />
                    </TableCell>
                    <TableCell className="text-center">
                      <FeatureCell value={item.standard} />
                    </TableCell>
                    <TableCell className="text-center">
                      <FeatureCell value={item.pro} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards - Shown on mobile, hidden on md+ */}
        <div className="md:hidden space-y-6">
          {comparisonFeatures.map((item, index) => (
            <div key={index} className="border border-[var(--border)] rounded-lg bg-[var(--panel)] p-4">
              <div className="font-medium text-[var(--text-strong)] mb-3">
                {item.feature}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2">
                  <div className="text-[var(--muted)] mb-1">Free</div>
                  <FeatureCell value={item.free} />
                </div>
                <div className="p-2">
                  <div className="text-[var(--accent)] mb-1">Standard</div>
                  <FeatureCell value={item.standard} />
                </div>
                <div className="p-2">
                  <div className="text-[var(--muted)] mb-1">Pro</div>
                  <FeatureCell value={item.pro} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}