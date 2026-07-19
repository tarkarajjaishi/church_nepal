'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, Building2, Globe, Search, Loader2 } from 'lucide-react'
import { Loading, ErrorState } from '@/components/LoadingStates'
import { useSettings, useUpsertSetting } from '@/lib/hooks'

interface SiteSettings {
  churchName: string
  churchAddress: string
  churchPhone: string
  churchEmail: string
  churchHours: string
  churchTagline: string
  facebook: string
  instagram: string
  youtube: string
  twitter: string
  websiteUrl: string
  metaTitle: string
  metaDescription: string
  siteUrl: string
}

const defaults: SiteSettings = {
  churchName: '', churchAddress: '', churchPhone: '', churchEmail: '',
  churchHours: '', churchTagline: '', facebook: '', instagram: '',
  youtube: '', twitter: '', websiteUrl: '', metaTitle: '',
  metaDescription: '', siteUrl: '',
}

// Map between camelCase frontend keys and snake_case backend setting keys
const keyMap: Record<keyof SiteSettings, string> = {
  churchName: 'church_name',
  churchAddress: 'church_address',
  churchPhone: 'church_phone',
  churchEmail: 'church_email',
  churchHours: 'church_hours',
  churchTagline: 'church_tagline',
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  twitter: 'twitter',
  websiteUrl: 'website_url',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  siteUrl: 'site_url',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { data: settingsData = [], refetch } = useSettings()
  const upsertSetting = useUpsertSetting()

  const loadSettings = () => {
    setLoading(true)
    setLoadError(false)
    try {
      const mapped = { ...defaults }
      for (const pair of settingsData as { key: string; value: string }[]) {
        const camelKey = Object.entries(keyMap).find(([, v]) => v === pair.key)?.[0] as keyof SiteSettings | undefined
        if (camelKey) {
          mapped[camelKey] = pair.value ?? ''
        }
      }
      setSettings(mapped)
      setLoading(false)
    } catch {
      setLoadError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [settingsData])

  const update = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // Save each setting individually via PUT /settings/{key}
      const entries = Object.entries(settings) as [keyof SiteSettings, string][]
      await Promise.all(
        entries.map(([camelKey, value]) => {
          const backendKey = keyMap[camelKey]
          return upsertSetting.mutateAsync({ key: backendKey, value: value ?? '' })
        })
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading message="Loading settings…" />
  }

  if (loadError) {
    return <ErrorState message="Failed to load site settings" onRetry={loadSettings} />
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Site Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <CheckCircle className="size-4" /> Settings saved successfully
        </div>
      )}

      {/* Church Info */}
      <Section icon={Building2} title="Church Information">
        <Field label="Church Name" value={settings.churchName ?? ''} onChange={v => update('churchName', v)} />
        <Field label="Tagline" value={settings.churchTagline ?? ''} onChange={v => update('churchTagline', v)} />
        <Field label="Address" value={settings.churchAddress ?? ''} onChange={v => update('churchAddress', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={settings.churchPhone ?? ''} onChange={v => update('churchPhone', v)} />
          <Field label="Email" value={settings.churchEmail ?? ''} onChange={v => update('churchEmail', v)} />
        </div>
        <Field label="Service Hours" value={settings.churchHours ?? ''} onChange={v => update('churchHours', v)} placeholder="e.g. Sun 9:00 AM, Wed 6:00 PM" />
      </Section>

      {/* Social Links */}
      <Section icon={Globe} title="Social Links">
        <Field label="Facebook URL" value={settings.facebook ?? ''} onChange={v => update('facebook', v)} placeholder="https://facebook.com/..." />
        <Field label="Instagram URL" value={settings.instagram ?? ''} onChange={v => update('instagram', v)} placeholder="https://instagram.com/..." />
        <Field label="YouTube URL" value={settings.youtube ?? ''} onChange={v => update('youtube', v)} placeholder="https://youtube.com/..." />
        <Field label="Twitter URL" value={settings.twitter ?? ''} onChange={v => update('twitter', v)} placeholder="https://twitter.com/..." />
        <Field label="Website URL" value={settings.websiteUrl ?? ''} onChange={v => update('websiteUrl', v)} placeholder="https://..." />
      </Section>

      {/* SEO */}
      <Section icon={Search} title="SEO & Meta">
        <Field label="Site URL" value={settings.siteUrl ?? ''} onChange={v => update('siteUrl', v)} placeholder="https://churchnepal.com" />
        <Field label="Meta Title" value={settings.metaTitle ?? ''} onChange={v => update('metaTitle', v)} placeholder="Grace Nepal Church - Home" />
        <Textarea label="Meta Description" value={settings.metaDescription ?? ''} onChange={v => update('metaDescription', v)} placeholder="A brief description for search engines (150-160 chars recommended)" />
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="size-8 rounded-lg bg-[#0b3c5d] flex items-center justify-center text-white">
          <Icon className="size-4" />
        </div>
        <h2 className="font-semibold text-[#0b3c5d]">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent text-sm"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent text-sm resize-none"
      />
    </div>
  )
}
