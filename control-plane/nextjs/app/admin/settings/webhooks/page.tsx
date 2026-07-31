import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Webhooks"
      subtitle="Outbound events to other systems"
      dependsOn="An event bus with delivery attempts and signatures; the Stripe inbound webhook already exists"
      planned={[
        "Subscribe an endpoint to church.created, church.suspended, invoice.paid",
        "Signed payloads so a receiver can verify origin",
        "Delivery log with response codes and retries",
        "Replay a failed delivery",
      ]}
    />
  );
}
