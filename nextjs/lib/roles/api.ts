'use client'

import api from '@/lib/api'

/**
 * Roles and permissions client API.
 *
 * Everything here decides what the UI *offers*. None of it decides what the
 * server *allows* — every permission is checked again on the route, and a
 * hidden button is a courtesy, never a control. Treat `useAccess()` as
 * cosmetics with teeth elsewhere.
 */

export interface PermissionInfo {
  code: string
  module: string
  label: string
  description: string
  sortOrder: number
  /** False when the database lists a permission the server does not check. */
  enforced: boolean
}

export interface Role {
  id: string
  slug: string
  name: string
  description: string
  isSystem: boolean
  isSuperuser: boolean
  sortOrder: number
  permissions: string[]
  userCount: number
}

export interface UserWithRoles {
  id: string
  email: string
  name: string
  role: string
  roleSlugs: string[]
  roleNames: string[]
  permissions: string[]
}

export interface MyAccess {
  userId: string
  email: string
  role: string
  permissions: string[]
  roles: string[]
  /** A hand-minted token with no user row; the signed claim governs. */
  unmanaged: boolean
}

export const rolesApi = {
  catalogue: () => api.get<PermissionInfo[]>('/permissions').then((r) => r.data),
  roles: () => api.get<Role[]>('/roles').then((r) => r.data),
  createRole: (body: Record<string, unknown>) => api.post('/roles', body).then((r) => r.data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`).then((r) => r.data),
  setPermissions: (id: string, permissions: string[]) =>
    api.put(`/roles/${id}/permissions`, { permissions }).then((r) => r.data),

  users: () => api.get<UserWithRoles[]>('/role-assignments').then((r) => r.data),
  setUserRoles: (userId: string, roleIds: string[]) =>
    api.put(`/role-assignments/${userId}`, { role_ids: roleIds }).then((r) => r.data),

  myAccess: () => api.get<MyAccess>('/auth/access').then((r) => r.data),
}

export const SYSTEM_ADMIN = 'system.admin'

/**
 * Mirrors `allows()` in src/permissions.rs: unrestricted access satisfies
 * everything, and managing a module implies being able to see it.
 *
 * Kept deliberately small and identical to the server's rule. If the two ever
 * disagree the server wins and the user sees a button that 403s — annoying,
 * but the safe direction.
 */
export function allows(held: string[], needed: string): boolean {
  if (held.includes(SYSTEM_ADMIN) || held.includes(needed)) return true
  if (needed === 'people.view') return held.includes('people.manage')
  if (needed === 'giving.view') return held.includes('giving.manage')
  return false
}

/** Human summary of what a role can reach, for a table cell. */
export function describe(role: Role): string {
  if (role.permissions.includes(SYSTEM_ADMIN)) return 'Everything'
  if (role.permissions.length === 0) return 'Nothing'
  return `${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'}`
}
