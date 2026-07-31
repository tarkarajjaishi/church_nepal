import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Security"
      subtitle="Sessions, password policy and audit"
      dependsOn="Session and audit tables exist; this needs the policy layer over them"
      planned={[
        "Force sign-out of every session for an admin",
        "Password policy and rotation",
        "IP allowlist for the control plane",
        "Require 2FA for every admin",
        "Recent sign-ins with location and device",
      ]}
    />
  );
}
