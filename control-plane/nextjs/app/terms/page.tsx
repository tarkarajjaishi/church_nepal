import type { Metadata } from "next";
import PublicLayout from "../public-layout";

export const metadata: Metadata = {
  title: "Terms of Service — ChurchNepal",
  description:
    "The terms that govern use of the ChurchNepal multi-tenant church website platform.",
};

const sections = [
  {
    h: "1. Acceptance of Terms",
    p: "By creating a church site or otherwise using ChurchNepal, you agree to these Terms of Service. If you are agreeing on behalf of a church or organization, you confirm you are authorized to do so.",
  },
  {
    h: "2. The Service",
    p: "ChurchNepal provisions and hosts an isolated website for each church — a subdomain, a dedicated database, private storage, and an admin dashboard. Features and pricing tiers may change as the platform evolves.",
  },
  {
    h: "3. Accounts",
    p: "Each church receives an auto-generated admin account. You are responsible for keeping login credentials confidential and for all activity under your account. Notify us immediately of any unauthorized access.",
  },
  {
    h: "4. Acceptable Use",
    p: "You agree not to use the platform for unlawful content, to infringe intellectual property, to disrupt the service, or to attempt to access another church's isolated data. We may suspend accounts that violate these terms.",
  },
  {
    h: "5. Payment & Billing",
    p: "Paid plans are billed on the cycle shown at checkout. Online giving processed via eSewa and Khalti is subject to those providers' terms. Fees are exclusive of applicable taxes where required.",
  },
  {
    h: "6. Content Ownership",
    p: "Each church retains ownership of the content it publishes. You grant ChurchNepal the limited rights needed to host and display that content as part of operating the service.",
  },
  {
    h: "7. Termination",
    p: "You may stop using the service at any time. We may suspend or terminate access for breach of these terms. On termination you may request an export of your church's data before it is removed.",
  },
  {
    h: "8. Disclaimers & Liability",
    p: "The service is provided “as is” without warranties of any kind. To the extent permitted by law, ChurchNepal is not liable for indirect or consequential damages arising from use of the platform.",
  },
  {
    h: "9. Governing Law",
    p: "These terms are governed by the laws of Nepal. Disputes will be handled by the competent courts of Nepal.",
  },
  {
    h: "10. Contact",
    p: "Questions about these terms can be sent to legal@churchnepal.com.",
  },
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="lp-section" style={{ maxWidth: 820 }}>
        <h1 className="lp-h2" style={{ textAlign: "left" }}>
          Terms of Service
        </h1>
        <p className="text-[var(--muted)]" style={{ marginTop: "0.75rem" }}>
          Last updated: 24 July 2026
        </p>

        <div style={{ marginTop: "2rem", display: "grid", gap: "1.75rem" }}>
          {sections.map((s) => (
            <section key={s.h}>
              <h2
                className="text-[var(--text-strong)]"
                style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}
              >
                {s.h}
              </h2>
              <p className="text-[var(--muted)]" style={{ lineHeight: 1.7 }}>
                {s.p}
              </p>
            </section>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
