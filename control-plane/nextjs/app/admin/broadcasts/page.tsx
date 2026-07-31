import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Broadcasts"
      subtitle="Message every church admin at once"
      dependsOn="A send job over control_admins and church admin emails, plus the email templates above"
      planned={[
        "Compose to all churches, or a plan, or a status",
        "Preview the recipient list before sending",
        "Scheduled send",
        "Open and click tracking",
      ]}
    />
  );
}
