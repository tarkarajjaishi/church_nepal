'use client'

/**
 * Offering Management client API + shared formatting.
 *
 * Amounts cross the wire as integer minor units (paisa). They are formatted
 * for display only at the edge — never parsed back into a float and re-sent,
 * which is how rounding drift gets into a ledger.
 */

import api from '@/lib/api'

// --- money ------------------------------------------------------------------

/** Format minor units as currency. `compact` gives 12.5L / 1.2Cr for KPI tiles. */
export function money(
  minor: number | null | undefined,
  opts: { currency?: string; compact?: boolean } = {}
): string {
  const { currency = 'Rs', compact = false } = opts
  const v = (minor ?? 0) / 100
  if (compact) {
    if (Math.abs(v) >= 1e7) return `${currency} ${(v / 1e7).toFixed(2)}Cr`
    if (Math.abs(v) >= 1e5) return `${currency} ${(v / 1e5).toFixed(2)}L`
    if (Math.abs(v) >= 1e3) return `${currency} ${(v / 1e3).toFixed(1)}K`
  }
  return `${currency} ${v.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/** Parse a typed rupee amount into minor units. Returns null when unusable. */
export function toMinor(input: string): number | null {
  const cleaned = input.replace(/[, ]/g, '').trim()
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  // Round rather than truncate: 12.005 typed by a user means 12.01, and
  // Math.round on the scaled value avoids float representation surprises.
  return Math.round(parseFloat(cleaned) * 100)
}

// --- types ------------------------------------------------------------------

export interface OfferingCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  defaultFundId: string | null
  isActive: boolean
  sortOrder: number
}

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  branch: string
  swiftCode: string
  currency: string
  openingBalance: number
  currentBalance: number
  isActive: boolean
  notes: string
}

export interface OfferingRow {
  id: string
  receiptNo: string | null
  serviceDate: string
  serviceTime: string | null
  serviceName: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  fundId: string | null
  fundName: string | null
  donorPersonId: string | null
  donorName: string
  isAnonymous: boolean
  giverType: string
  totalAmount: number
  currency: string
  paymentMethod: string
  referenceNo: string
  status: OfferingStatus
  enteredBy: string
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
}

export type OfferingStatus = 'draft' | 'submitted' | 'counted' | 'approved' | 'rejected'

export interface OfferingPage {
  data: OfferingRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
  filteredTotal: number
}

export interface TrendPoint {
  label: string
  amount: number
  count: number
}
export interface Breakdown extends TrendPoint {
  color: string | null
}

export interface OfferingDashboard {
  today: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  totalDonations: number
  onlineGiving: number
  cashGiving: number
  pendingDeposits: number
  pendingDepositCount: number
  pendingApprovalCount: number
  activeCampaigns: number
  totalDonors: number
  currency: string
  monthlyTrend: TrendPoint[]
  dailyTrend: TrendPoint[]
  byCategory: Breakdown[]
  byPaymentMethod: Breakdown[]
  weeklyComparison: TrendPoint[]
}

export interface CashCount {
  id: string
  offeringId: string | null
  countDate: string
  serviceName: string
  counterOne: string
  counterTwo: string
  supervisor: string
  expectedTotal: number
  countedTotal: number
  variance: number
  varianceReason: string
  status: string
  isLocked: boolean
  approvedBy: string | null
  approvedAt: string | null
  notes: string
}

export interface CashCountLine {
  id: string
  denomination: number
  label: string
  quantity: number
  subtotal: number
  countedBy: string
}

export interface FundAllocationRule {
  id: string
  categoryId: string
  fundId: string
  fundName: string | null
  percentageBps: number
  sortOrder: number
}

export interface Fund {
  id: string
  name: string
  description?: string
  fundType?: string
  isActive?: boolean
}

export interface Deposit {
  id: string
  depositDate: string
  bankAccountId: string | null
  referenceNo: string
  amount: number
  slipUrl: string
  depositedBy: string
  verifiedBy: string | null
  verifiedAt: string | null
  status: 'pending' | 'deposited' | 'verified' | 'rejected' | 'cancelled'
  notes: string
}

// --- filters ----------------------------------------------------------------

export interface OfferingFilters {
  fromDate?: string
  toDate?: string
  categoryId?: string
  fundId?: string
  serviceName?: string
  paymentMethod?: string
  status?: string
  donor?: string
  minAmount?: string
  maxAmount?: string
  search?: string
  page?: number
  perPage?: number
  sort?: string
  dir?: 'asc' | 'desc'
}

/**
 * The API speaks snake_case; lib/api.ts camelCases responses on the way back
 * but does not transform requests, so query keys are converted here.
 */
function toQuery(f: OfferingFilters): string {
  const map: Record<string, unknown> = {
    from_date: f.fromDate,
    to_date: f.toDate,
    category_id: f.categoryId,
    fund_id: f.fundId,
    service_name: f.serviceName,
    payment_method: f.paymentMethod,
    status: f.status,
    donor: f.donor,
    min_amount: f.minAmount ? toMinor(f.minAmount) : undefined,
    max_amount: f.maxAmount ? toMinor(f.maxAmount) : undefined,
    search: f.search,
    page: f.page,
    per_page: f.perPage,
    sort: f.sort,
    dir: f.dir,
  }
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  return q.toString()
}

// --- calls ------------------------------------------------------------------

const BASE = '/offering-management'

export const offeringsApi = {
  dashboard: async (): Promise<OfferingDashboard> =>
    (await api.get(`${BASE}/dashboard`)).data,

  list: async (f: OfferingFilters): Promise<OfferingPage> =>
    (await api.get(`${BASE}/offerings?${toQuery(f)}`)).data,

  create: async (body: Record<string, unknown>) =>
    (await api.post(`${BASE}/offerings/create`, body)).data,

  approve: async (id: string) =>
    (await api.post(`${BASE}/offerings/${id}/approve`, {})).data,

  reject: async (id: string, reason: string) =>
    (await api.post(`${BASE}/offerings/${id}/reject`, { reason })).data,

  bulkApprove: async (ids: string[]) =>
    (await api.post(`${BASE}/offerings/bulk-approve`, { ids })).data,

  categories: async (): Promise<OfferingCategory[]> =>
    (await api.get('/offering-categories')).data,

  createCategory: async (body: Record<string, unknown>) =>
    (await api.post('/offering-categories', body)).data,

  updateCategory: async (id: string, body: Record<string, unknown>) =>
    (await api.put(`/offering-categories/${id}`, body)).data,

  deleteCategory: async (id: string) =>
    (await api.delete(`/offering-categories/${id}`)).data,

  allocations: async (categoryId: string): Promise<FundAllocationRule[]> =>
    (await api.get(`/offering-categories/${categoryId}/allocations`)).data,

  setAllocations: async (categoryId: string, rules: { fundId: string; percentageBps: number }[]) =>
    (
      await api.put(`/offering-categories/${categoryId}/allocations`, {
        rules: rules.map((r) => ({ fund_id: r.fundId, percentage_bps: r.percentageBps })),
      })
    ).data,

  bankAccounts: async (): Promise<BankAccount[]> => (await api.get('/bank-accounts')).data,

  createBankAccount: async (body: Record<string, unknown>) =>
    (await api.post('/bank-accounts', body)).data,

  cashCounts: async (): Promise<CashCount[]> => (await api.get('/cash-counts')).data,

  cashCount: async (id: string) => (await api.get(`/cash-counts/${id}`)).data,

  saveCashCount: async (body: Record<string, unknown>) =>
    (await api.post('/cash-counts', body)).data,

  approveCashCount: async (id: string) =>
    (await api.post(`/cash-counts/${id}/approve`, {})).data,

  deposits: async (): Promise<Deposit[]> => (await api.get('/deposits')).data,

  createDeposit: async (body: Record<string, unknown>) =>
    (await api.post('/deposits', body)).data,

  verifyDeposit: async (id: string) => (await api.post(`/deposits/${id}/verify`, {})).data,

  setDepositStatus: async (id: string, status: string, reason?: string) =>
    (await api.post(`/deposits/${id}/status/${status}`, { reason })).data,

  funds: async (): Promise<Fund[]> => (await api.get('/funds')).data,
}

// --- display helpers --------------------------------------------------------

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'qr', label: 'QR Payment' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'connectips', label: 'ConnectIPS' },
  { value: 'fonepay', label: 'FonePay' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
] as const

export const methodLabel = (v: string) =>
  PAYMENT_METHODS.find((m) => m.value === v)?.label ??
  v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Status chip classes. Deliberately uses the palette families that
 * globals.css remaps under .dark, so chips invert with the theme instead of
 * staying pale on a dark page.
 */
export const STATUS_STYLES: Record<OfferingStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  counted: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

export const STATUS_LABELS: Record<OfferingStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  counted: 'Counted',
  approved: 'Approved',
  rejected: 'Rejected',
}

/** Nepali rupee denominations, largest first. 0 is the mixed-coins line. */
export const DENOMINATIONS: { minor: number; label: string; kind: 'note' | 'coin' }[] = [
  { minor: 100000, label: '1000', kind: 'note' },
  { minor: 50000, label: '500', kind: 'note' },
  { minor: 10000, label: '100', kind: 'note' },
  { minor: 5000, label: '50', kind: 'note' },
  { minor: 2500, label: '25', kind: 'note' },
  { minor: 2000, label: '20', kind: 'note' },
  { minor: 1000, label: '10', kind: 'note' },
  { minor: 500, label: '5', kind: 'coin' },
  { minor: 200, label: '2', kind: 'coin' },
  { minor: 100, label: '1', kind: 'coin' },
]
