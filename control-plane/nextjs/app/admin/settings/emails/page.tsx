import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Email templates"
      subtitle="What the platform sends, and how it reads"
      dependsOn="A template store plus the SMTP settings the church app already uses"
      planned={[
        "Edit the welcome, invoice and suspension emails",
        "Preview with real substitution values",
        "Per-church branding on platform email",
        "Delivery and bounce log",
      ]}
    />
  );
}
