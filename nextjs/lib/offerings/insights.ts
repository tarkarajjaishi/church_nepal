'use client'

import api from '@/lib/api'

/**
 * Donors, fund balances, analytics and receipts.
 *
 * Every figure is derived by the server on read. Nothing here may be cached
 * past the response it arrived in — a donor's lifetime total changes the
 * moment an offering is approved.
 *
 * The axios interceptor camelCases responses but leaves requests alone, so
 * request bodies stay snake_case.
 */

export interface DonorRow {
  donorKey: string
  name: string
  personId: string | null
  email: string
  phone: string
  /** Tied to a person record rather than to a typed name. */
  isLinked: boolean
  totalGiven: number
  giftCount: number
  largestGift: number
  averageGift: number
  firstGiftOn: string | null
  lastGiftOn: string | null
  daysSinceLast: number | null
}

export interface DonorPage {
  data: DonorRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
  anonymousTotal: number
  anonymousCount: number
}

export interface DonorGift {
  id: string
  receiptNo: string
  serviceDate: string
  serviceName: string
  categoryName: string | null
  fundName: string | null
  paymentMethod: string
  totalAmount: number
  status: string
}

export interface LabelAmount { label: string; amount: number; count: number }

export interface DonorDetail {
  donor: DonorRow
  gifts: DonorGift[]
  byFund: LabelAmount[]
  byYear: LabelAmount[]
}

export interface FundBalance {
  id: string
  name: string
  fundType: string
  description: string
  isActive: boolean
  allocated: number
  offeringCount: number
  thisMonth: number
  thisYear: number
  lastMovementOn: string | null
  sharePercent: number
}

export interface FundBalances {
  funds: FundBalance[]
  totalAllocated: number
  /** Counted giving that reached no fund. Should be zero. */
  unallocated: number
  movement: { month: string; fundName: string; amount: number }[]
}

export interface MonthPoint { month: string; amount: number; gifts: number; donors: number }

export interface Analytics {
  months: MonthPoint[]
  byMethod: LabelAmount[]
  byCategory: LabelAmount[]
  byGiverType: LabelAmount[]
  byWeekday: LabelAmount[]
  yearToDate: number
  sameSpanLastYear: number
  growthPercent: number | null
  averageGift: number
  medianGift: number
  returningDonors: number
  newDonors: number
  lapsedDonors: number
  topDonorSharePercent: number
}

export interface ReceiptRow {
  id: string
  receiptNo: string
  serviceDate: string
  serviceName: string
  donorName: string
  donorEmail: string
  isAnonymous: boolean
  categoryName: string | null
  fundName: string | null
  paymentMethod: string
  referenceNo: string
  totalAmount: number
  status: string
  issued: boolean
  sentAt: string | null
  sentTo: string
}

export interface ReceiptPage {
  data: ReceiptRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
  issuedCount: number
  unissuedCount: number
  sentCount: number
  totalAmount: number
}


export interface StandingOrder {
  id: string
  donorName: string
  donorContact: string
  memberId: string | null
  amount: number
  interval: string
  gateway: string
  fundId: string | null
  fundName: string | null
  nextChargeAt: string | null
  active: boolean
  pausedAt: string | null
  cancelledAt: string | null
  startedOn: string
  chargeCount: number
  lastChargedAt: string | null
  notes: string
  /** Negative means overdue. */
  daysUntilDue: number | null
  /** What this order is worth in a year, so rhythms can be compared. */
  annualised: number
}

export interface RecurringPage {
  data: StandingOrder[]
  activeCount: number
  pausedCount: number
  cancelledCount: number
  overdueCount: number
  annualisedTotal: number
  monthlyEquivalent: number
}

const clean = (o: object) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

export const insightsApi = {
  donors: (p: Record<string, unknown> = {}) =>
    api.get<DonorPage>('/offering-management/donors', { params: clean(p) }).then((r) => r.data),
  donor: (key: string) =>
    api.get<DonorDetail>(`/offering-management/donors/${encodeURIComponent(key)}`).then((r) => r.data),

  fundBalances: () =>
    api.get<FundBalances>('/offering-management/fund-balances').then((r) => r.data),

  analytics: () => api.get<Analytics>('/offering-management/analytics').then((r) => r.data),

  receipts: (p: Record<string, unknown> = {}) =>
    api.get<ReceiptPage>('/offering-management/receipts', { params: clean(p) }).then((r) => r.data),
  issue: (id: string) =>
    api.post<{ receiptNo: string; issued: boolean }>(`/offering-management/receipts/${id}/issue`)
      .then((r) => r.data),
  issueBulk: (ids: string[]) =>
    api.post<{ issued: number; requested: number; skipped: number }>(
      '/offering-management/receipts/issue', { ids }).then((r) => r.data),
  send: (id: string, email?: string) =>
    api.post<{ sentTo: string }>(`/offering-management/receipts/${id}/send`, { email })
      .then((r) => r.data),

  recurring: (view = '') =>
    api.get<RecurringPage>('/offering-management/recurring', { params: clean({ view }) })
      .then((r) => r.data),
  createRecurring: (body: Record<string, unknown>) =>
    api.post('/offering-management/recurring', body).then((r) => r.data),
  recurringAction: (id: string, action: 'pause' | 'resume' | 'cancel') =>
    api.post(`/offering-management/recurring/${id}/${action}`).then((r) => r.data),
  collectRecurring: (id: string) =>
    api.post(`/offering-management/recurring/${id}/collect`).then((r) => r.data),
}

/** Where the browser should go to print a receipt. */
export function receiptPdfUrl(origin: string, id: string): string {
  return `${origin}/api/offering-management/receipts/${id}/pdf`
}
