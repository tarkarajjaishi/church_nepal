import type { Metadata } from "next";
import PublicLayout from "../public-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — ChurchNepal",
  description:
    "How ChurchNepal collects, uses, isolates, and protects data for every church on the platform.",
};

const sections = [
  {
    h: "1. Information We Collect",
    p: "We collect the information a church admin provides when creating and managing a site — church name, contact details, admin login credentials, and the content published to the church website (text, images, events, sermons, giving records). We also collect basic technical data such as IP address, browser type, and usage logs to keep the service secure and reliable.",
  },
  {
    h: "2. How We Use Information",
    p: "Information is used solely to provision and operate each church's website, authenticate admins, process online giving, send transactional notifications, and improve the platform. We do not sell personal data, and we never use one church's data to serve another.",
  },
  {
    h: "3. Data Isolation Between Churches",
    p: "ChurchNepal is multi-tenant by design. Each church runs on its own database, its own storage folder, and its own subdomain. Members, giving, and content are fully separated with zero data crossover between congregations.",
  },
  {
    h: "4. Payments",
    p: "Online giving is processed through eSewa and Khalti. Card and wallet details are handled by those providers under their own security standards — ChurchNepal never stores full payment credentials on its servers.",
  },
  {
    h: "5. Cookies",
    p: "We use essential cookies for authentication and session management, and a preference cookie to remember your language and theme. Non-essential cookies are only set with your consent.",
  },
  {
    h: "6. Data Security",
    p: "Passwords are hashed with bcrypt, access is protected by JWT-based authentication, and administrative actions are recorded in an audit log. Automated backups are configured per tenant.",
  },
  {
    h: "7. Your Rights",
    p: "Church admins may access, correct, export, or request deletion of their church's data at any time from the admin dashboard or by contacting us. Requests are actioned within a reasonable period.",
  },
  {
    h: "8. Contact",
    p: "Questions about this policy can be sent to privacy@churchnepal.com.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="lp-section" style={{ maxWidth: 820 }}>
        <h1 className="lp-h2" style={{ textAlign: "left" }}>
          Privacy Policy
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
