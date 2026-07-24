'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, Plus, Trash2, Edit2 } from 'lucide-react'
import { Loading } from '@/components/LoadingStates'
import { useSettings, useUpsertSetting } from '@/lib/hooks'
import { useContactInfoRecords, useCreateContactInfo, useUpdateContactInfo } from '@/lib/hooks'
import { useServiceTimes, useCreateServiceTime, useUpdateServiceTime, useDeleteServiceTime, useToggleServiceTime } from '@/lib/hooks'
import { useContentBlockByKey, useUpdateContentBlock } from '@/lib/hooks'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ChurchProfile {
  churchName: string
  churchTagline: string
}

interface ContactInfoForm {
  id?: string
  address: string
  phone: string
  email: string
  hours: string
  mapUrl: string
}

interface SocialLinks {
  facebook: string
  instagram: string
  youtube: string
  twitter: string
  websiteUrl: string
}

interface SeoMeta {
  siteUrl: string
  metaTitle: string
  metaDescription: string
}

interface ServiceTimeForm {
  id?: string
  name: string
  nameNe: string
  day: string
  time: string
  icon: string
  sortOrder: number
  enabled: boolean
}

const churchProfileDefaults: ChurchProfile = { churchName: '', churchTagline: '' }
const contactInfoDefaults: ContactInfoForm = { address: '', phone: '', email: '', hours: '', mapUrl: '' }
const socialLinksDefaults: SocialLinks = { facebook: '', instagram: '', youtube: '', twitter: '', websiteUrl: '' }
const seoMetaDefaults: SeoMeta = { siteUrl: '', metaTitle: '', metaDescription: '' }
const serviceTimeDefaults: ServiceTimeForm = { name: '', nameNe: '', day: '', time: '', icon: '', sortOrder: 0, enabled: true }

function ChurchProfileTab({
  data,
  onChange,
  saving,
  onSave,
}: {
  data: ChurchProfile
  onChange: (field: keyof ChurchProfile, value: string) => void
  saving: boolean
  onSave: () => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="churchName">Church Name *</Label>
          <Input
            id="churchName"
            value={data.churchName}
            onChange={(e) => onChange('churchName', e.target.value)}
            disabled={saving}
            placeholder="Grace Nepal Church"
          />
        </div>
        <div>
          <Label htmlFor="churchTagline">Tagline *</Label>
          <Input
            id="churchTagline"
            value={data.churchTagline}
            onChange={(e) => onChange('churchTagline', e.target.value)}
            disabled={saving}
            placeholder="Faith • Hope • Love"
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Church Profile
      </Button>
    </div>
  )
}

function ContactInfoTab({
  data,
  onChange,
  saving,
  onSave,
}: {
  data: ContactInfoForm | null
  onChange: (field: keyof ContactInfoForm, value: string) => void
  saving: boolean
  onSave: () => Promise<void>
}) {
  const [localData, setLocalData] = useState<ContactInfoForm>(data ?? contactInfoDefaults)

  useEffect(() => {
    setLocalData(data ?? contactInfoDefaults)
  }, [data])

  const handleChange = (field: keyof ContactInfoForm, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }))
    onChange(field, value)
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No contact information found. Fill the form below to create one.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={localData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={saving}
              placeholder="123 Church Street, Kathmandu, Nepal"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={localData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={saving}
              placeholder="+977-1-XXXXXXX"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={localData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={saving}
              placeholder="info@churchnepal.org"
            />
          </div>
          <div>
            <Label htmlFor="hours">Office Hours</Label>
            <Input
              id="hours"
              value={localData.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              disabled={saving}
              placeholder="Mon–Fri: 9 AM – 5 PM"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="mapUrl">Map URL</Label>
            <Input
              id="mapUrl"
              value={localData.mapUrl}
              onChange={(e) => handleChange('mapUrl', e.target.value)}
              disabled={saving}
              placeholder="https://www.openstreetmap.org/export/embed.html?..."
            />
          </div>
        </div>
        <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Create Contact Info
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={localData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={saving}
            placeholder="123 Church Street, Kathmandu, Nepal"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={localData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={saving}
            placeholder="+977-1-XXXXXXX"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={localData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={saving}
            placeholder="info@churchnepal.org"
          />
        </div>
        <div>
          <Label htmlFor="hours">Office Hours</Label>
          <Input
            id="hours"
            value={localData.hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            disabled={saving}
            placeholder="Mon–Fri: 9 AM – 5 PM"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="mapUrl">Map URL</Label>
          <Input
            id="mapUrl"
            value={localData.mapUrl}
            onChange={(e) => handleChange('mapUrl', e.target.value)}
            disabled={saving}
            placeholder="https://www.openstreetmap.org/export/embed.html?..."
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Contact Info
      </Button>
    </div>
  )
}

function SocialLinksTab({
  data,
  onChange,
  saving,
  onSave,
}: {
  data: SocialLinks
  onChange: (field: keyof SocialLinks, value: string) => void
  saving: boolean
  onSave: () => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="facebook">Facebook URL</Label>
          <Input
            id="facebook"
            value={data.facebook}
            onChange={(e) => onChange('facebook', e.target.value)}
            disabled={saving}
            placeholder="https://facebook.com/yourchurch"
          />
        </div>
        <div>
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            value={data.instagram}
            onChange={(e) => onChange('instagram', e.target.value)}
            disabled={saving}
            placeholder="https://instagram.com/yourchurch"
          />
        </div>
        <div>
          <Label htmlFor="youtube">YouTube URL</Label>
          <Input
            id="youtube"
            value={data.youtube}
            onChange={(e) => onChange('youtube', e.target.value)}
            disabled={saving}
            placeholder="https://youtube.com/@yourchurch"
          />
        </div>
        <div>
          <Label htmlFor="twitter">Twitter/X URL</Label>
          <Input
            id="twitter"
            value={data.twitter}
            onChange={(e) => onChange('twitter', e.target.value)}
            disabled={saving}
            placeholder="https://twitter.com/yourchurch"
          />
        </div>
        <div>
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            value={data.websiteUrl}
            onChange={(e) => onChange('websiteUrl', e.target.value)}
            disabled={saving}
            placeholder="https://yourchurch.org"
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Social Links
      </Button>
    </div>
  )
}

function SeoMetaTab({
  data,
  onChange,
  saving,
  onSave,
}: {
  data: SeoMeta
  onChange: (field: keyof SeoMeta, value: string) => void
  saving: boolean
  onSave: () => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="siteUrl">Site URL *</Label>
          <Input
            id="siteUrl"
            type="url"
            value={data.siteUrl}
            onChange={(e) => onChange('siteUrl', e.target.value)}
            disabled={saving}
            placeholder="https://churchnepal.org"
          />
        </div>
        <div>
          <Label htmlFor="metaTitle">Meta Title *</Label>
          <Input
            id="metaTitle"
            value={data.metaTitle}
            onChange={(e) => onChange('metaTitle', e.target.value)}
            disabled={saving}
            placeholder="Grace Nepal Church — Faith, Hope & Love"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="metaDescription">Meta Description *</Label>
          <Textarea
            id="metaDescription"
            value={data.metaDescription}
            onChange={(e) => onChange('metaDescription', e.target.value)}
            disabled={saving}
            placeholder="A brief description for search engines (150–160 characters recommended)"
            rows={4}
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save SEO & Meta
      </Button>
    </div>
  )
}

function ServiceTimesTab() {
  const { data: serviceTimes = [], isLoading: loading, refetch: refetchServiceTimes } = useServiceTimes()
  const createMut = useCreateServiceTime()
  const updateMut = useUpdateServiceTime()
  const deleteMut = useDeleteServiceTime()
  const toggleMut = useToggleServiceTime()

  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceTimeForm>(serviceTimeDefaults)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = useCallback((serviceTime: any) => {
    setEditId(serviceTime.id)
    setForm({
      id: serviceTime.id,
      name: serviceTime.name ?? '',
      nameNe: serviceTime.nameNe ?? '',
      day: serviceTime.day ?? '',
      time: serviceTime.time ?? '',
      icon: serviceTime.icon ?? '',
      sortOrder: serviceTime.sortOrder ?? 0,
      enabled: serviceTime.enabled ?? false,
    })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Service time deleted')
      refetchServiceTimes()
    } catch {
      toast.error('Failed to delete service time')
    } finally {
      setDeletingId(null)
    }
  }, [deleteMut, refetchServiceTimes])

  const handleToggle = useCallback(async (id: string) => {
    try {
      await toggleMut.mutateAsync(id)
      toast.success('Status updated')
      refetchServiceTimes()
    } catch {
      toast.error('Failed to toggle status')
    }
  }, [toggleMut, refetchServiceTimes])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await updateMut.mutateAsync({
          id: editId,
          data: {
            name: form.name,
            nameNe: form.nameNe,
            day: form.day,
            time: form.time,
            icon: form.icon,
            sortOrder: form.sortOrder,
          },
        })
        toast.success('Service time updated')
      } else {
        await createMut.mutateAsync({
          name: form.name,
          nameNe: form.nameNe,
          day: form.day,
          time: form.time,
          icon: form.icon,
          sortOrder: form.sortOrder,
        })
        toast.success('Service time added')
      }
      setEditId(null)
      setForm(serviceTimeDefaults)
      refetchServiceTimes()
    } catch {
      toast.error('Failed to save service time')
    }
  }, [editId, form, createMut, updateMut, refetchServiceTimes])

  const handleCancel = useCallback(() => {
    setEditId(null)
    setForm(serviceTimeDefaults)
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading service times…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Service Times</h2>
        <Button variant="outline" onClick={handleCancel}>
          <Plus className="mr-2 h-4 w-4" /> Add Service Time
        </Button>
      </div>

      {serviceTimes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No service times added yet.</p>
      ) : (
        <div className="space-y-4">
          {serviceTimes.map((st: any) => (
            <div key={st.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{st.name}</h3>
                  <p className="text-sm text-muted-foreground">{st.day} • {st.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={st.enabled ?? false}
                    onCheckedChange={() => handleToggle(st.id)}
                    disabled={deletingId === st.id}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(st)}
                    disabled={deletingId === st.id}
                    aria-label="Edit service time"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(st.id)}
                    disabled={deletingId === st.id}
                    aria-label="Delete service time"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {editId === st.id && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`name-${st.id}`}>Name (EN) *</Label>
                      <Input
                        id={`name-${st.id}`}
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`nameNe-${st.id}`}>Name (NE) *</Label>
                      <Input
                        id={`nameNe-${st.id}`}
                        value={form.nameNe}
                        onChange={(e) => setForm((prev) => ({ ...prev, nameNe: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`day-${st.id}`}>Day *</Label>
                      <Input
                        id={`day-${st.id}`}
                        value={form.day}
                        onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
                        required
                        placeholder="Sunday, Daily, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`time-${st.id}`}>Time *</Label>
                      <Input
                        id={`time-${st.id}`}
                        value={form.time}
                        onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                        required
                        placeholder="10:00 AM"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`icon-${st.id}`}>Icon</Label>
                      <Input
                        id={`icon-${st.id}`}
                        value={form.icon}
                        onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                        placeholder="e.g. Church, Calendar, Users"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sortOrder-${st.id}`}>Sort Order</Label>
                      <Input
                        id={`sortOrder-${st.id}`}
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMut.isPending || updateMut.isPending}
                      className="ml-2"
                    >
                      {editId ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { data: settingsData = [], refetch: refetchSettings } = useSettings()
  const upsertSetting = useUpsertSetting()

  const { data: contactInfoData, refetch: refetchContactInfo } = useContactInfoRecords()
  const createContactInfo = useCreateContactInfo()
  const updateContactInfo = useUpdateContactInfo()

  const { data: siteBrand } = useContentBlockByKey('site_brand')
  const { data: socialBlock } = useContentBlockByKey('social_links')
  const updateContentBlock = useUpdateContentBlock()

  const [churchProfile, setChurchProfile] = useState<ChurchProfile>(churchProfileDefaults)
  const [churchProfileLoading, setChurchProfileLoading] = useState(true)
  const [churchProfileSaving, setChurchProfileSaving] = useState(false)

  const [contactInfo, setContactInfo] = useState<ContactInfoForm | null>(null)
  const [contactInfoLoading, setContactInfoLoading] = useState(true)
  const [contactInfoSaving, setContactInfoSaving] = useState(false)

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(socialLinksDefaults)
  const [seoMeta, setSeoMeta] = useState<SeoMeta>(seoMetaDefaults)
  const [socialLinksLoading, setSocialLinksLoading] = useState(true)
  const [seoMetaLoading, setSeoMetaLoading] = useState(true)
  const [socialLinksSaving, setSocialLinksSaving] = useState(false)
  const [seoMetaSaving, setSeoMetaSaving] = useState(false)

  useEffect(() => {
    const loadChurchProfile = async () => {
      setChurchProfileLoading(true)
      try {
        const mapped = { ...churchProfileDefaults }
        for (const pair of settingsData as { key: string; value: string }[]) {
          if (pair.key === 'church_name') mapped.churchName = pair.value ?? ''
          else if (pair.key === 'church_tagline') mapped.churchTagline = pair.value ?? ''
        }
        // Fallback to content block if settings are empty
        if (!mapped.churchName && siteBrand?.title) mapped.churchName = siteBrand.title
        if (!mapped.churchTagline && siteBrand?.subtitle) mapped.churchTagline = siteBrand.subtitle ?? ''
        setChurchProfile(mapped)
      } catch (err) {
        console.error('Failed to load church profile', err)
      } finally {
        setChurchProfileLoading(false)
      }
    }

    const loadSocialLinks = async () => {
      setSocialLinksLoading(true)
      try {
        const mapped = { ...socialLinksDefaults }
        for (const pair of settingsData as { key: string; value: string }[]) {
          if (pair.key === 'facebook') mapped.facebook = pair.value ?? ''
          else if (pair.key === 'instagram') mapped.instagram = pair.value ?? ''
          else if (pair.key === 'youtube') mapped.youtube = pair.value ?? ''
          else if (pair.key === 'twitter') mapped.twitter = pair.value ?? ''
          else if (pair.key === 'website_url') mapped.websiteUrl = pair.value ?? ''
        }
        // Fallback to content block if settings are empty
        const socialItems = (socialBlock?.items as any[]) || []
        if (!mapped.facebook) mapped.facebook = socialItems.find((s) => s.icon === 'Facebook')?.url ?? ''
        if (!mapped.instagram) mapped.instagram = socialItems.find((s) => s.icon === 'Instagram')?.url ?? ''
        if (!mapped.youtube) mapped.youtube = socialItems.find((s) => s.icon === 'Youtube')?.url ?? ''
        if (!mapped.twitter) mapped.twitter = socialItems.find((s) => s.icon === 'Twitter')?.url ?? ''
        if (!mapped.websiteUrl) mapped.websiteUrl = socialItems.find((s) => s.icon === 'Globe' || s.icon === 'Link')?.url ?? ''
        setSocialLinks(mapped)
      } catch (err) {
        console.error('Failed to load social links', err)
      } finally {
        setSocialLinksLoading(false)
      }
    }

    const loadSeoMeta = async () => {
      setSeoMetaLoading(true)
      try {
        const mapped = { ...seoMetaDefaults }
        for (const pair of settingsData as { key: string; value: string }[]) {
          if (pair.key === 'site_url') mapped.siteUrl = pair.value ?? ''
          else if (pair.key === 'meta_title') mapped.metaTitle = pair.value ?? ''
          else if (pair.key === 'meta_description') mapped.metaDescription = pair.value ?? ''
        }
        setSeoMeta(mapped)
      } catch (err) {
        console.error('Failed to load SEO/meta', err)
      } finally {
        setSeoMetaLoading(false)
      }
    }

    loadChurchProfile()
    loadSocialLinks()
    loadSeoMeta()
  }, [settingsData, siteBrand, socialBlock])

  useEffect(() => {
    setContactInfoLoading(true)
    try {
      if (contactInfoData && contactInfoData.length > 0) {
        const ci = contactInfoData[0]
        setContactInfo({
          id: ci.id,
          address: ci.address ?? '',
          phone: ci.phone ?? '',
          email: ci.email ?? '',
          hours: ci.hours ?? '',
          mapUrl: ci.mapUrl ?? '',
        })
      } else {
        setContactInfo(null)
      }
    } finally {
      setContactInfoLoading(false)
    }
  }, [contactInfoData])

  const handleSaveChurchProfile = async () => {
    setChurchProfileSaving(true)
    try {
      const updates = [
        { key: 'church_name', value: churchProfile.churchName },
        { key: 'church_tagline', value: churchProfile.churchTagline },
      ]
      await Promise.all(updates.map(({ key, value }) => upsertSetting.mutateAsync({ key, value: value ?? '' })))

      // Also update content block for public site
      if (siteBrand?.id) {
        await updateContentBlock.mutateAsync({
          id: siteBrand.id,
          data: { title: churchProfile.churchName, subtitle: churchProfile.churchTagline },
        })
      }

      toast.success('Church profile saved')
    } catch {
      toast.error('Failed to save church profile')
    } finally {
      setChurchProfileSaving(false)
    }
  }

  const handleSaveContactInfo = async () => {
    setContactInfoSaving(true)
    try {
      if (contactInfo?.id) {
        await updateContactInfo.mutateAsync({ id: contactInfo.id, ...contactInfo })
        toast.success('Contact info saved')
      } else {
        await createContactInfo.mutateAsync({
          address: contactInfo?.address ?? '',
          phone: contactInfo?.phone ?? '',
          email: contactInfo?.email ?? '',
          hours: contactInfo?.hours ?? '',
          map_url: contactInfo?.mapUrl ?? '',
        })
        toast.success('Contact info created')
        refetchContactInfo()
      }
    } catch {
      toast.error('Failed to save contact info')
    } finally {
      setContactInfoSaving(false)
    }
  }

  const handleSaveSocialLinks = async () => {
    setSocialLinksSaving(true)
    try {
      const updates = [
        { key: 'facebook', value: socialLinks.facebook },
        { key: 'instagram', value: socialLinks.instagram },
        { key: 'youtube', value: socialLinks.youtube },
        { key: 'twitter', value: socialLinks.twitter },
        { key: 'website_url', value: socialLinks.websiteUrl },
      ]
      await Promise.all(updates.map(({ key, value }) => upsertSetting.mutateAsync({ key, value: value ?? '' })))

      // Also update content block for public site
      if (socialBlock?.id) {
        const socialItems = [
          { label: 'Facebook', url: socialLinks.facebook, icon: 'Facebook' },
          { label: 'Instagram', url: socialLinks.instagram, icon: 'Instagram' },
          { label: 'YouTube', url: socialLinks.youtube, icon: 'Youtube' },
          { label: 'Twitter', url: socialLinks.twitter, icon: 'Twitter' },
          { label: 'Website', url: socialLinks.websiteUrl, icon: 'Globe' },
        ].filter((s) => s.url)
        await updateContentBlock.mutateAsync({
          id: socialBlock.id,
          data: { items: socialItems },
        })
      }

      toast.success('Social links saved')
    } catch {
      toast.error('Failed to save social links')
    } finally {
      setSocialLinksSaving(false)
    }
  }

  const handleSaveSeoMeta = async () => {
    setSeoMetaSaving(true)
    try {
      const updates = [
        { key: 'site_url', value: seoMeta.siteUrl },
        { key: 'meta_title', value: seoMeta.metaTitle },
        { key: 'meta_description', value: seoMeta.metaDescription },
      ]
      await Promise.all(updates.map(({ key, value }) => upsertSetting.mutateAsync({ key, value: value ?? '' })))
      toast.success('SEO & Meta saved')
    } catch {
      toast.error('Failed to save SEO & Meta')
    } finally {
      setSeoMetaSaving(false)
    }
  }

  const handleSaveAll = async () => {
    await Promise.all([
      handleSaveChurchProfile(),
      handleSaveContactInfo(),
      handleSaveSocialLinks(),
      handleSaveSeoMeta(),
    ])
    toast.success('All settings saved')
  }

  if (churchProfileLoading || contactInfoLoading || socialLinksLoading || seoMetaLoading) {
    return <Loading message="Loading settings…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Church Settings</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveAll} variant="outline">
            <Save className="mr-2 h-4 w-4" /> Save All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="church-profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="church-profile">Church Profile</TabsTrigger>
          <TabsTrigger value="service-times">Service Times</TabsTrigger>
          <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
          <TabsTrigger value="social-links">Social Links</TabsTrigger>
          <TabsTrigger value="seo-meta">SEO & Meta</TabsTrigger>
        </TabsList>

        <TabsContent value="church-profile">
          <ChurchProfileTab
            data={churchProfile}
            onChange={(field, value) => setChurchProfile((prev) => ({ ...prev, [field]: value }))}
            saving={churchProfileSaving}
            onSave={handleSaveChurchProfile}
          />
        </TabsContent>

        <TabsContent value="service-times">
          <ServiceTimesTab />
        </TabsContent>

        <TabsContent value="contact-info">
          <ContactInfoTab
            data={contactInfo}
            onChange={(field, value) => setContactInfo((prev) => ({ ...(prev ?? contactInfoDefaults), [field]: value }))}
            saving={contactInfoSaving}
            onSave={handleSaveContactInfo}
          />
        </TabsContent>

        <TabsContent value="social-links">
          <SocialLinksTab
            data={socialLinks}
            onChange={(field, value) => setSocialLinks((prev) => ({ ...prev, [field]: value }))}
            saving={socialLinksSaving}
            onSave={handleSaveSocialLinks}
          />
        </TabsContent>

        <TabsContent value="seo-meta">
          <SeoMetaTab
            data={seoMeta}
            onChange={(field, value) => setSeoMeta((prev) => ({ ...prev, [field]: value }))}
            saving={seoMetaSaving}
            onSave={handleSaveSeoMeta}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}