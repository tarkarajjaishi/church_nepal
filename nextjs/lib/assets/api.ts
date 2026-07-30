'use client'

import api from '@/lib/api'

/**
 * Asset Management client API.
 *
 * `currentValue` and `accumulatedDepreciation` are computed by the server on
 * every read rather than stored, so they are always current. Do not cache them
 * anywhere that outlives a request.
 */

export interface AssetCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  defaultUsefulLifeYears: number
  isReservable: boolean
  sortOrder: number
  isActive: boolean
  assetCount: number
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  website: string
  notes: string
  isActive: boolean
  assetCount: number
}

export type AssetStatus =
  | 'available' | 'assigned' | 'reserved' | 'maintenance'
  | 'repair' | 'disposed' | 'lost' | 'retired'

export interface AssetRow {
  id: string
  assetCode: string
  name: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  serialNumber: string
  manufacturer: string
  model: string
  purchaseDate: string | null
  purchaseCost: number
  salvageValue: number
  depreciationMethod: string
  usefulLifeYears: number
  supplierId: string | null
  supplierName: string | null
  warrantyExpires: string | null
  building: string
  room: string
  department: string
  condition: string
  status: AssetStatus
  photo: string
  isReservable: boolean
  notes: string
  assignedTo: string | null
  updatedAt: string
  currentValue: number
  accumulatedDepreciation: number
  warrantyStatus: 'none' | 'active' | 'expiring' | 'expired' | string
}

export interface AssetPage {
  data: AssetRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
  filteredCost: number
  filteredCurrentValue: number
}

export interface AssetAssignment {
  id: string
  assetId: string
  assetName: string | null
  assetCode: string | null
  personId: string | null
  assignedTo: string
  department: string
  assignedAt: string
  dueBack: string | null
  returnedAt: string | null
  conditionOut: string
  conditionIn: string | null
  notes: string
}

export interface AssetReservation {
  id: string
  assetId: string
  assetName: string | null
  assetCode: string | null
  requestedBy: string
  personId: string | null
  purpose: string
  startsOn: string
  endsOn: string
  status: string
  approvedBy: string | null
  approvedAt: string | null
  rejectReason: string
  notes: string
  createdAt: string
}

export interface Maintenance {
  id: string
  assetId: string
  assetName: string | null
  assetCode: string | null
  maintenanceKind: string
  title: string
  description: string
  scheduledFor: string | null
  performedOn: string | null
  nextDue: string | null
  technician: string
  supplierId: string | null
  supplierName: string | null
  cost: number
  status: string
  conditionAfter: string | null
  notes: string
}

export interface AssetDetail {
  asset: AssetRow
  assignments: AssetAssignment[]
  reservations: AssetReservation[]
  maintenance: Maintenance[]
  maintenanceCostTotal: number
}

export interface AssetDashboard {
  totalAssets: number
  totalCost: number
  totalCurrentValue: number
  totalDepreciation: number
  available: number
  assigned: number
  inMaintenance: number
  overdueReturns: number
  maintenanceDue: number
  warrantyExpiring: number
  pendingReservations: number
  maintenanceSpendYear: number
  byCategory: { label: string; color: string | null; count: number; cost: number }[]
  byStatus: { label: string; count: number }[]
  upcomingMaintenance: Maintenance[]
  expiringWarranties: AssetRow[]
}

export interface AssetFilters {
  search?: string
  categoryId?: string
  status?: string
  condition?: string
  building?: string
  supplierId?: string
  reservable?: boolean
  warranty?: string
  page?: number
  perPage?: number
  sort?: string
  dir?: 'asc' | 'desc'
}

/** The API speaks snake_case on the way in; responses are camelCased by lib/api.ts. */
function toQuery(f: AssetFilters): string {
  const map: Record<string, unknown> = {
    search: f.search,
    category_id: f.categoryId,
    status: f.status,
    condition: f.condition,
    building: f.building,
    supplier_id: f.supplierId,
    reservable: f.reservable,
    warranty: f.warranty,
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

export const assetsApi = {
  dashboard: async (): Promise<AssetDashboard> => (await api.get('/assets/dashboard')).data,

  categories: async (): Promise<AssetCategory[]> => (await api.get('/asset-categories')).data,

  createCategory: async (b: Record<string, unknown>) => (await api.post('/asset-categories', b)).data,

  suppliers: async (): Promise<Supplier[]> => (await api.get('/suppliers')).data,

  createSupplier: async (b: Record<string, unknown>) => (await api.post('/suppliers', b)).data,

  list: async (f: AssetFilters): Promise<AssetPage> =>
    (await api.get(`/assets?${toQuery(f)}`)).data,

  get: async (id: string): Promise<AssetDetail> => (await api.get(`/assets/${id}`)).data,

  create: async (b: Record<string, unknown>) => (await api.post('/assets', b)).data,

  update: async (id: string, b: Record<string, unknown>) => (await api.put(`/assets/${id}`, b)).data,

  dispose: async (id: string, status: string, reason?: string) =>
    (await api.post(`/assets/${id}/dispose/${status}`, { reason })).data,

  assign: async (id: string, b: Record<string, unknown>) =>
    (await api.post(`/assets/${id}/assign`, b)).data,

  assignments: async (): Promise<AssetAssignment[]> => (await api.get('/asset-assignments')).data,

  returnAssignment: async (id: string, b: Record<string, unknown>) =>
    (await api.post(`/asset-assignments/${id}/return`, b)).data,

  reserve: async (id: string, b: Record<string, unknown>) =>
    (await api.post(`/assets/${id}/reserve`, b)).data,

  reservations: async (): Promise<AssetReservation[]> => (await api.get('/asset-reservations')).data,

  decideReservation: async (id: string, decision: string, reason?: string) =>
    (await api.post(`/asset-reservations/${id}/${decision}`, { reason })).data,

  maintenance: async (): Promise<Maintenance[]> => (await api.get('/asset-maintenance')).data,

  createMaintenance: async (assetId: string, b: Record<string, unknown>) =>
    (await api.post(`/assets/${assetId}/maintenance`, b)).data,

  completeMaintenance: async (id: string, b: Record<string, unknown>) =>
    (await api.post(`/asset-maintenance/${id}/complete`, b)).data,
}

export const ASSET_STATUSES: AssetStatus[] = [
  'available', 'assigned', 'reserved', 'maintenance', 'repair', 'disposed', 'lost', 'retired',
]

export const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'broken']

export const DEPRECIATION_METHODS = [
  { value: 'straight_line', label: 'Straight line' },
  { value: 'declining_balance', label: 'Declining balance' },
  { value: 'none', label: 'Does not depreciate' },
]

export const MAINTENANCE_KINDS = [
  'preventive', 'corrective', 'inspection', 'cleaning', 'calibration', 'replacement', 'repair',
]

export const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-100 text-green-800 border-green-200',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  reserved: 'bg-amber-100 text-amber-800 border-amber-200',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
  repair: 'bg-red-100 text-red-800 border-red-200',
  disposed: 'bg-gray-100 text-gray-700 border-gray-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
  retired: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const CONDITION_STYLE: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-green-100 text-green-800 border-green-200',
  fair: 'bg-amber-100 text-amber-800 border-amber-200',
  poor: 'bg-red-100 text-red-800 border-red-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

export const WARRANTY_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  expiring: 'bg-amber-100 text-amber-800 border-amber-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  none: 'bg-muted text-muted-foreground border-border',
}

export const RESERVATION_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  collected: 'bg-blue-100 text-blue-800 border-blue-200',
  returned: 'bg-muted text-muted-foreground border-border',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}
