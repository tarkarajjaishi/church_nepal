/**
 * Help Desk shell.
 *
 * The module's own pages now live nested under Help Desk in the admin sidebar,
 * so this no longer paints a second column beside it: two menus side by side
 * cost 224px of table width and made you read both to find one page.
 */
export default function HelpdeskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
