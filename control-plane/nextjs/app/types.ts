export interface Church {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  admin_email: string;
  status: string;
  plan?: string | null;
  custom_domain?: string | null;
  last_active_at?: string | null;
  storage_bytes?: number | null;
  notes?: string | null;
  created_at?: string;
  member_count?: number;
  giving_total?: number;
}

export type ChurchStatus = "active" | "suspended" | "archived" | "provisioning";
export type ChurchPlan = "Free" | "Standard" | "Pro";
export type AdminRole = "owner" | "admin" | "editor" | "viewer";

export interface ControlAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at?: string;
  last_login_at?: string | null;
}

export interface ChurchAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  last_login_at?: string | null;
  created_at?: string;
}

export interface NewChurch {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  url: string;
  admin_email: string;
  admin_password: string;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  max_members: number;
  max_storage_mb: number;
  max_emails: number;
  max_churches: number;
  features: Record<string, boolean | number | string>;
  created_at?: string;
}

export interface BillingInfo {
  id: string;
  church_id: string;
  church_name: string;
  plan: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  mrr: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  church_id: string;
  church_name?: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  period_start: string;
  period_end: string;
  due_date: string;
  paid_at?: string | null;
  created_at?: string;
}

export interface Analytics {
  total_churches: number;
  active_churches: number;
  suspended_churches: number;
  mrr: number;
  churches_this_month: number;
  churches_by_plan: Array<{ plan: string; count: number }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  type?: string;
}

export interface PaginatedAuditLog {
  data: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
