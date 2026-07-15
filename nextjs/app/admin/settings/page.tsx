'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, Building2, Globe, Search, Loader2 } from 'lucide-react'

const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API || 'http://localhost:8000'

interface SiteSettings {
  church_name: string
  church_address: string
  church_phone: string
  church_email: string
  church_hours: string
  church_tagline: string
  facebook: string
  instagram: string
  youtube: string
  twitter: string
  website_url: string
  meta_title: string
  meta_description: string
  site_url: string
}

const defaults: SiteSettings = {
  church_name: '', church_address: '', church_phone: '', church_email: '',
  church_hours: '', church_tagline: '', facebook: '', instagram: '',
  youtube: '', twitter: '', website_url: '', meta_title: '',
  meta_description: '', site_url: '',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${PYTHON_API}/site-settings`)
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const update = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const token = localStorage.getItem('py_token')
      const res = await fetch(`${PYTHON_API}/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 text-[#0b3c5d] animate-spin" />
      </div>
    )
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
        <Field label="Church Name" value={settings.church_name} onChange={v => update('church_name', v)} />
        <Field label="Tagline" value={settings.church_tagline} onChange={v => update('church_tagline', v)} />
        <Field label="Address" value={settings.church_address} onChange={v => update('church_address', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={settings.church_phone} onChange={v => update('church_phone', v)} />
          <Field label="Email" value={settings.church_email} onChange={v => update('church_email', v)} />
        </div>
        <Field label="Service Hours" value={settings.church_hours} onChange={v => update('church_hours', v)} placeholder="e.g. Sun 9:00 AM, Wed 6:00 PM" />
      </Section>

      {/* Social Links */}
      <Section icon={Globe} title="Social Links">
        <Field label="Facebook URL" value={settings.facebook} onChange={v => update('facebook', v)} placeholder="https://facebook.com/..." />
        <Field label="Instagram URL" value={settings.instagram} onChange={v => update('instagram', v)} placeholder="https://instagram.com/..." />
        <Field label="YouTube URL" value={settings.youtube} onChange={v => update('youtube', v)} placeholder="https://youtube.com/..." />
        <Field label="Twitter URL" value={settings.twitter} onChange={v => update('twitter', v)} placeholder="https://twitter.com/..." />
        <Field label="Website URL" value={settings.website_url} onChange={v => update('website_url', v)} placeholder="https://..." />
      </Section>

      {/* SEO */}
      <Section icon={Search} title="SEO & Meta">
        <Field label="Site URL" value={settings.site_url} onChange={v => update('site_url', v)} placeholder="https://churchnepal.com" />
        <Field label="Meta Title" value={settings.meta_title} onChange={v => update('meta_title', v)} placeholder="Grace Nepal Church - Home" />
        <Textarea label="Meta Description" value={settings.meta_description} onChange={v => update('meta_description', v)} placeholder="A brief description for search engines (150-160 chars recommended)" />
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
        value={value}
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
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent text-sm resize-none"
      />
    </div>
  )
}
