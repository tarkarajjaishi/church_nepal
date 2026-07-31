import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Coupons"
      subtitle="Discounts and trials"
      dependsOn="Stripe coupons, which needs a Stripe key configured"
      planned={[
        "Percentage and fixed-amount coupons",
        "Redemption limits and expiry",
        "Apply a coupon to one church",
        "Redemption history",
      ]}
    />
  );
}
