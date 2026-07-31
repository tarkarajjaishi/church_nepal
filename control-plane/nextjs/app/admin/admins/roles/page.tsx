import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Roles"
      subtitle="What each control-plane role may do"
      dependsOn="A permission catalogue for the control plane; today the roles are admin and super_admin only"
      planned={[
        "A named role with a set of permissions",
        "Assign a role to an admin",
        "See which admins hold a permission",
        "Refuse the last owner being demoted",
      ]}
    />
  );
}
