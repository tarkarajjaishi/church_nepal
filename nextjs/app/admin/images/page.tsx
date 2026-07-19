'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadFile } from '@/lib/admin/api'
import { Upload, Save, Image as ImageIcon, Trash2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loading, ErrorState } from '@/components/LoadingStates'
import { useSettings, useUpsertSetting } from '@/lib/hooks'

const imageSlots = [
  { key: 'site_hero_image', label: 'Hero Section Background', description: 'Main background image on the homepage hero', group: 'Homepage' },
  { key: 'site_pastor_image', label: 'Pastor Section Image', description: 'Photo shown in the pastor section', group: 'Homepage' },
  { key: 'site_prayer_image', label: 'Prayer Section Background', description: 'Background for the prayer call-to-action', group: 'Homepage' },
  { key: 'site_about_hero', label: 'About Page Hero', description: 'Hero image for the About page', group: 'Pages' },
  { key: 'site_visit_hero', label: 'Visit Page Hero', description: 'Hero image for the Visit page', group: 'Pages' },
  { key: 'site_give_hero', label: 'Give Page Hero', description: 'Hero image for the Giving page', group: 'Pages' },
  { key: 'site_sermons_hero', label: 'Sermons Page Hero', description: 'Hero image for the Sermons page', group: 'Pages' },
  { key: 'site_events_hero', label: 'Events Page Hero', description: 'Hero image for the Events page', group: 'Pages' },
  { key: 'site_gallery_hero', label: 'Gallery Page Hero', description: 'Hero image for the Gallery page', group: 'Pages' },
  { key: 'site_ministries_hero', label: 'Ministries Page Hero', description: 'Hero image for the Ministries page', group: 'Pages' },
  { key: 'site_groups_hero', label: 'Groups Page Hero', description: 'Hero image for the Groups page', group: 'Pages' },
  { key: 'site_contact_hero', label: 'Contact Page Hero', description: 'Hero image for the Contact page', group: 'Pages' },
  { key: 'site_volunteer_hero', label: 'Volunteer Page Hero', description: 'Hero image for the Volunteer page', group: 'Pages' },
  { key: 'site_404_image', label: '404 Page Background', description: 'Background image for the not-found page', group: 'Pages' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

export default function ImageManagerPage() {
  const qc = useQueryClient()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const { data: settings = [], isLoading, isError, refetch } = useSettings()
  const updateSetting = useUpsertSetting()
  const settingsMap = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value])) as Record<string, string>

  const handleUpload = async (key: string, file: File) => {
    setUploadingKey(key)
    try {
      const result = await uploadFile(file)
      updateSetting.mutate({ key, value: result.url }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Image saved') }, onError: () => toast.error('Failed to save') })
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploadingKey(null)
    }
  }

  const handleClear = (key: string) => {
    updateSetting.mutate({ key, value: '' }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Image saved') }, onError: () => toast.error('Failed to save') })
  }

  const getImageSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  const grouped = imageSlots.reduce((acc, slot) => {
    if (!acc[slot.group]) acc[slot.group] = []
    acc[slot.group].push(slot)
    return acc
  }, {} as Record<string, typeof imageSlots>)

  if (isLoading) return <Loading message="Loading images…" />
  if (isError) return <ErrorState message="Failed to load site images" onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" /> Site Image Manager
          </CardTitle>
          <CardDescription>
            Control all images shown on the public site. Upload your own images or paste a URL. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(grouped).map(([group, slots]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-lg">{group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map(slot => {
                const currentUrl = settingsMap[slot.key] || ''
                return (
                  <div key={slot.key} className="space-y-3">
                    <Label className="text-sm font-medium">{slot.label}</Label>
                    <p className="text-xs text-muted-foreground">{slot.description}</p>

                    {/* Preview */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                      {currentUrl ? (
                        <>
                          <img src={getImageSrc(currentUrl)} alt={slot.label} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <button onClick={() => handleClear(slot.key)}
                            className="absolute top-2 right-2 size-7 bg-destructive/90 text-white rounded-full flex items-center justify-center hover:bg-destructive">
                            <Trash2 className="size-3.5" />
                          </button>
                          <a href={getImageSrc(currentUrl)} target="_blank" rel="noopener noreferrer"
                            className="absolute top-2 left-2 size-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">
                            <Eye className="size-3.5" />
                          </a>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="size-8 mb-1 opacity-30" />
                          <span className="text-xs">No image set</span>
                        </div>
                      )}
                    </div>

                    {/* Upload + URL input */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(slot.key, f); e.target.value = '' }} />
                          <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploadingKey === slot.key}
                            onClick={e => { (e.currentTarget.previousElementSibling as HTMLInputElement)?.click() }}>
                            {uploadingKey === slot.key ? (
                              <span className="animate-spin size-4 border-2 border-gray-300 border-t-church-blue rounded-full mr-1" />
                            ) : <Upload className="size-4 mr-1" />}
                            {uploadingKey === slot.key ? 'Uploading...' : 'Upload'}
                          </Button>
                        </label>
                      </div>
                      <Input
                        value={currentUrl}
                        onChange={e => updateSetting.mutate({ key: slot.key, value: e.target.value })}
                        placeholder="Or paste image URL..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
