import { redirect } from '@/lib/navigation'

// Bare /admin has no page of its own — send it to the dashboard, which the
// admin AuthGuard bounces to /admin/login when the visitor isn't signed in.
export default function AdminIndexPage(): null {
  redirect("/admin/dashboard"); return null
}
