'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, FileText, Eye, GripVertical, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  options?: string[]
}

const fieldTypeOptions = ['text', 'email', 'textarea', 'select', 'checkbox', 'date', 'number', 'phone']

export default function FormsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [viewSubmissions, setViewSubmissions] = useState<any>(null)
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldOptions, setNewFieldOptions] = useState('')

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => api.get('/forms').then(r => r.data),
  })

  const { data: submissions = [] } = useQuery({
    queryKey: ['forms-submissions', viewSubmissions?.id],
    queryFn: () => api.get(`/forms/${viewSubmissions.id}/submissions`).then(r => r.data),
    enabled: !!viewSubmissions,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/forms', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forms'] }); resetForm(); toast.success('Form created') },
    onError: () => toast.error('Failed to create form'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/forms/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forms'] }); resetForm(); toast.success('Form updated') },
    onError: () => toast.error('Failed to update form'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/forms/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forms'] }); setConfirmDelete(null); toast.success('Form deleted') },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setFormTitle('')
    setFormDescription('')
    setFields([])
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldRequired(false)
    setNewFieldOptions('')
  }

  const addField = () => {
    if (!newFieldLabel.trim()) return
    const field: FormField = {
      id: crypto.randomUUID(),
      type: newFieldType,
      label: newFieldLabel.trim(),
      required: newFieldRequired,
    }
    if (newFieldType === 'select' && newFieldOptions.trim()) {
      field.options = newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
    }
    setFields([...fields, field])
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldRequired(false)
    setNewFieldOptions('')
  }

  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id))

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (form: any) => {
    setEditing(form)
    setFormTitle(form.title || '')
    setFormDescription(form.description || '')
    setFields(form.fields || [])
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { title: formTitle, description: formDescription, fields }
    if (editing) updateMut.mutate({ id: editing.id, data })
    else createMut.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Forms</h1>
        <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
          <Plus className="size-4 mr-1" /> New Form
        </Button>
      </div>

      {/* Forms List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="md:col-span-2 lg:col-span-3"><Loading /></div>
        ) : forms.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3"><EmptyState icon={<FileText className="size-10" />} title="No forms yet" description="Create a form to start collecting submissions." /></div>
        ) : forms.map((f: any) => (
          <Card key={f.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-church-blue" />
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{f.fields?.length ?? 0} fields · {(f.submissionCount ?? 0)} submissions</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setViewSubmissions(f)} title="View submissions">
                    <Eye className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(f)} title="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(f.id)} title="Delete">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Form</DialogTitle>
            <DialogDescription>{editing ? 'Update the form fields.' : 'Design your form with custom fields.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. New Member Registration" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description of this form" rows={2} />
            </div>

            {/* Existing Fields */}
            {fields.length > 0 && (
              <div className="space-y-2">
                <Label>Form Fields</Label>
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">{field.label}</span>
                      <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                      {field.required && <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">Required</Badge>}
                      <button type="button" onClick={() => removeField(field.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Field Builder */}
            <div className="border border-dashed rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Add Field</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Label *</Label>
                  <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="Field label" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={newFieldType} onValueChange={setNewFieldType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fieldTypeOptions.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newFieldType === 'select' && (
                <div className="space-y-1">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
                  <Label className="text-xs">Required</Label>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addField} disabled={!newFieldLabel.trim()}>
                  <Plus className="size-3 mr-1" /> Add Field
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending || !formTitle.trim()} className="bg-church-blue hover:bg-church-blue/90">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Form'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={!!viewSubmissions} onOpenChange={(open) => { if (!open) setViewSubmissions(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions: {viewSubmissions?.title}</DialogTitle>
            <DialogDescription>{submissions.length} total submissions</DialogDescription>
          </DialogHeader>
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">#</th>
                    <th className="p-2">Submitted</th>
                    {viewSubmissions?.fields?.map((f: any) => (
                      <th key={f.id} className="p-2">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s: any, i: number) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                      {viewSubmissions?.fields?.map((f: any) => (
                        <td key={f.id} className="p-2 text-sm">{s.data?.[f.id] ?? '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubmissions(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete form?</DialogTitle>
            <DialogDescription>This will permanently remove the form and all its submissions.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
