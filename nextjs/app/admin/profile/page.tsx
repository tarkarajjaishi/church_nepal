'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/admin/auth'
import { User, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react'

const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API || 'http://localhost:8000'

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleProfileUpdate = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const token = localStorage.getItem('py_token')
      await fetch(`${PYTHON_API}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to update profile', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('py_token')
      const res = await fetch(`${PYTHON_API}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ old_password: currentPassword, new_password: newPassword })
      })
      if (!res.ok) {
        const data = await res.json()
        setPasswordError(data.detail || 'Failed to change password')
        return
      }
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      setPasswordError('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[#0b3c5d]">My Profile</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-full bg-[#0b3c5d] flex items-center justify-center text-white">
            <User className="size-6" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">Role: {user?.role || 'user'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e] transition-colors disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="size-4" /> Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="size-5 text-[#0b3c5d]" />
          <h2 className="font-semibold text-[#0b3c5d]">Change Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword || !currentPassword || !newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e] transition-colors disabled:opacity-50"
            >
              <Lock className="size-4" />
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
            {passwordSaved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="size-4" /> Password changed
              </span>
            )}
            {passwordError && (
              <span className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="size-4" /> {passwordError}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
