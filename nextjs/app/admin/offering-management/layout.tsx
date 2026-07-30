/**
 * Offering Management shell.
 *
 * The module's own pages now live nested under Offering Management in the admin sidebar,
 * so this no longer paints a second column beside it: two menus side by side
 * cost 224px of table width and made you read both to find one page.
 */
export default function OfferingManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
