'use client'

import api from '@/lib/api'

/**
 * Church Library client API.
 *
 * `availableCopies` is computed by the server on every read from the copies
 * that have no open loan — it is never a stored counter, so do not cache it
 * or derive it locally from a stale list.
 *
 * Money (`dailyFee`, `feeAssessed`, …) is i64 paisa. Use `money()` to display.
 *
 * The axios interceptor camelCases every response key but leaves requests
 * alone, so request bodies below stay snake_case.
 */

export interface LibraryCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  sortOrder: number
  isActive: boolean
  bookCount: number
}

export interface Author {
  id: string
  name: string
  bio: string
  photo: string
  bookCount: number
}

export type MaterialKind = 'book' | 'ebook' | 'audio' | 'video' | 'periodical'

export interface BookRow {
  id: string
  title: string
  subtitle: string
  isbn: string
  publisher: string
  edition: string
  language: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  description: string
  keywords: string
  pages: number | null
  publicationYear: number | null
  coverUrl: string
  materialKind: MaterialKind
  digitalUrl: string
  isActive: boolean
  authors: string[]
  totalCopies: number
  availableCopies: number
  onLoan: number
  outOfCirculation: number
  holdsWaiting: number
  updatedAt: string
}

export interface BookPage {
  data: BookRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface BookCopy {
  id: string
  bookId: string
  copyCode: string
  shelf: string
  location: string
  condition: string
  acquiredOn: string | null
  purchaseCost: number
  status: 'in_circulation' | 'damaged' | 'lost' | 'withdrawn'
  notes: string
  borrower: string | null
  dueOn: string | null
}

export interface Loan {
  id: string
  copyId: string
  copyCode: string
  bookId: string
  bookTitle: string
  personId: string | null
  borrowerName: string
  borrowerContact: string
  borrowedOn: string
  dueOn: string
  returnedOn: string | null
  renewals: number
  conditionOut: string
  conditionIn: string | null
  feeAssessed: number
  feePaid: number
  notes: string
  daysOverdue: number
  /** What the fee would be if returned today. Never stored. */
  feeAccruing: number
}

export interface Hold {
  id: string
  bookId: string
  bookTitle: string
  personId: string | null
  requesterName: string
  requesterContact: string
  status: 'waiting' | 'ready' | 'fulfilled' | 'cancelled' | 'expired'
  notifiedOn: string | null
  notes: string
  createdAt: string
  queuePosition: number
}

export interface LibrarySettings {
  loanDays: number
  maxRenewals: number
  renewalDays: number
  dailyFee: number
  maxFee: number
  maxLoansPerPerson: number
  holdDays: number
}

export interface BookDetail {
  book: BookRow
  copies: BookCopy[]
  loans: Loan[]
  holds: Hold[]
}

export interface Borrower {
  personId: string | null
  name: string
  contact: string
  openLoans: number
  totalLoans: number
  overdue: number
  feesOutstanding: number
  lastBorrowed: string | null
}

export interface TitleCount {
  label: string
  color: string | null
  count: number
}

export interface LibraryDashboard {
  totalTitles: number
  totalCopies: number
  onLoan: number
  available: number
  overdue: number
  digitalTitles: number
  activeBorrowers: number
  holdsWaiting: number
  feesOutstanding: number
  loansThisMonth: number
  byCategory: TitleCount[]
  mostBorrowed: TitleCount[]
  overdueLoans: Loan[]
  dueSoon: Loan[]
}

export interface BookFilters {
  search?: string
  category_id?: string
  material_kind?: string
  language?: string
  availability?: 'available' | 'on_loan' | 'digital'
  page?: number
  per_page?: number
  sort?: string
  dir?: 'asc' | 'desc'
}

const clean = (o: object) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

export const libraryApi = {
  dashboard: () => api.get<LibraryDashboard>('/library/dashboard').then((r) => r.data),
  categories: () => api.get<LibraryCategory[]>('/library/categories').then((r) => r.data),
  authors: () => api.get<Author[]>('/library/authors').then((r) => r.data),

  settings: () => api.get<LibrarySettings>('/library/settings').then((r) => r.data),
  updateSettings: (body: Partial<Record<string, number>>) =>
    api.put('/library/settings', body).then((r) => r.data),

  books: (f: BookFilters = {}) =>
    api.get<BookPage>('/library/books', { params: clean(f) }).then((r) => r.data),
  book: (id: string) => api.get<BookDetail>(`/library/books/${id}`).then((r) => r.data),
  createBook: (body: Record<string, unknown>) =>
    api.post('/library/books', body).then((r) => r.data),
  addCopies: (id: string, body: Record<string, unknown>) =>
    api.post(`/library/books/${id}/copies`, body).then((r) => r.data),
  updateCopy: (id: string, body: Record<string, unknown>) =>
    api.put(`/library/copies/${id}`, body).then((r) => r.data),

  loans: (p: { status?: string; borrower?: string } = {}) =>
    api.get<Loan[]>('/library/loans', { params: clean(p) }).then((r) => r.data),
  borrow: (body: Record<string, unknown>) =>
    api.post('/library/loans', body).then((r) => r.data),
  returnLoan: (id: string, body: Record<string, unknown> = {}) =>
    api.post(`/library/loans/${id}/return`, body).then((r) => r.data),
  renew: (id: string) => api.post(`/library/loans/${id}/renew`).then((r) => r.data),

  holds: () => api.get<Hold[]>('/library/holds').then((r) => r.data),
  placeHold: (bookId: string, body: Record<string, unknown>) =>
    api.post(`/library/books/${bookId}/hold`, body).then((r) => r.data),
  cancelHold: (id: string) => api.delete(`/library/holds/${id}`).then((r) => r.data),

  borrowers: () => api.get<Borrower[]>('/library/borrowers').then((r) => r.data),
}

/** Human label for a copy's shelf state. */
export function copyState(c: BookCopy): { label: string; tone: 'ok' | 'out' | 'bad' } {
  if (c.status !== 'in_circulation') return { label: c.status.replace('_', ' '), tone: 'bad' }
  if (c.borrower) return { label: 'On loan', tone: 'out' }
  return { label: 'On shelf', tone: 'ok' }
}
