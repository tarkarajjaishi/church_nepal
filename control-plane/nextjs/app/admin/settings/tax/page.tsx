import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Tax"
      subtitle="VAT and receipt requirements per region"
      dependsOn="A tax table and the invoice fields Nepal requires on a receipt"
      planned={[
        "VAT registration number on invoices",
        "Per-region rates and exemptions",
        "Tax summary for a period, per church",
        "Export for the accountant",
      ]}
    />
  );
}
