'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/portal/api'
import { User, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react'

interface MemberProfile {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  memberStatus: string
  notes?: string
  joinedDate?: string
}

export default function PortalProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/portal/me')
        const data = res.data
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddress(data.address || '')
        setCity(data.city || '')
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleProfileUpdate = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/portal/me', { name, phone, email, address, city })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to update profile', err)
    } finally {
      setSaving(false)
    }
  }

  /**
   * The value actually in a field.
   *
   * A password manager fills the current-password box straight into the DOM
   * without firing an event React can hear, so these state variables can be
   * empty while the box visibly contains a password. These inputs are not
   * inside a <form>, so there is no FormData to read.
   */
  const liveValue = (id: string, fallback: string) => {
    if (typeof document === 'undefined') return fallback
    const el = document.getElementById(id) as HTMLInputElement | null
    return el?.value || fallback
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    const current = liveValue('portal-current-password', currentPassword)
    const next = liveValue('portal-new-password', newPassword)
    const confirm = liveValue('portal-confirm-password', confirmPassword)

    // Said out loud rather than by grey-ing out the button, which gave no
    // reason and, when the fields were autofilled, no way to proceed at all.
    if (!current || !next) {
      setPasswordError('Enter your current password and a new one')
      return
    }
    if (next !== confirm) {
      setPasswordError('New passwords do not match')
      return
    }
    if (next.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      await api.post('/auth/change-password', {
        current_password: current,
        new_password: next,
      })
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-church-blue">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-full bg-[#0b3c5d] flex items-center justify-center text-white">
            <User className="size-6" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{profile?.name || user?.name}</div>
            <div className="text-sm text-gray-500">{profile?.email || user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">Status: {profile?.memberStatus || 'Member'}</div>
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
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="size-5 text-[#0b3c5d]" />
          <h2 className="font-semibold text-[#0b3c5d]">Change Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="portal-current-password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              id="portal-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="portal-new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="portal-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="portal-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              id="portal-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Disabled only while the request is in flight. Gating on
                !currentPassword read React state, which a password manager
                bypasses — the button greyed itself out over filled boxes.
                Missing fields are reported by handlePasswordChange instead. */}
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword}
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
