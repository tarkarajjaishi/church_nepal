'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Trash2, Check, X } from 'lucide-react'
import { useUsers } from '@/lib/hooks'
import { SkeletonLoader, ErrorState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { User } from '@/lib/types'

function RoleSelect({ user, onChangeRole }: { user: User; onChangeRole: (role: string) => void }) {
  const roles = ['viewer', 'editor', 'admin']
  return (
    <select
      value={user.role ?? 'viewer'}
      onChange={(e) => onChangeRole(e.target.value)}
      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </option>
      ))}
    </select>
  )
}

function UsersTable({ users }: { users: User[] }) {
  const [sortBy, setSortBy] = useState<'email' | 'name' | 'role'>('email')

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'email':
        return a.email.localeCompare(b.email)
      case 'name':
        return (a.name || '').localeCompare(b.name || '')
      case 'role':
        return a.role.localeCompare(b.role)
    }
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => setSortBy('email')}>
                Email {sortBy === 'email' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => setSortBy('name')}>
                Name {sortBy === 'name' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => setSortBy('role')}>
                Role {sortBy === 'role' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.map((user: User) => (
              <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                <td className="px-6 py-4 text-gray-700">{user.name || '—'}</td>
                <td className="px-6 py-4">
                  <RoleSelect user={user} onChangeRole={(role) => console.log(`Change ${user.email} to ${role}`)} />
                </td>
                <td className="px-6 py-4">
                  {user.verified ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                      <X className="w-4 h-4" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {!user.verified && (
                      <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition">
                        Resend
                      </button>
                    )}
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedUsers.length === 0 && <div className="px-6 py-12 text-center text-gray-600">No users found</div>}
    </div>
  )
}

function UsersPageContent() {
  const { data: users, loading, error } = useUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage team members and their access roles</p>
      </div>

      {!loading && users && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{users.filter((u: User) => u.role === 'admin').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Verified</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{users.filter((u: User) => u.verified).length}</p>
          </div>
        </div>
      )}

      {loading ? <SkeletonLoader count={5} height="h-20" /> : error ? <ErrorState message={(error as any)?.detail || 'Failed to load users'} /> : users ? <UsersTable users={users} /> : null}
    </div>
  )
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ErrorBoundary>
        <UsersPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
