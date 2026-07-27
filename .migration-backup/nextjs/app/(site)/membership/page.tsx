'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/PageHero'
import { useContentBlock } from '@/lib/hooks'
import { CheckCircle, Users, Heart, Church } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

export default function MembershipPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const hero = useContentBlock('member_hero')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/member-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName || '',
          lastName: form.lastName || '',
          email: form.email || '',
          phone: form.phone || '',
          address: form.address || '',
          city: form.city || '',
          gender: form.gender || '',
          maritalStatus: form.maritalStatus || '',
          baptismStatus: form.baptismStatus || '',
          churchBackground: form.churchBackground || '',
          howFound: form.howFound || '',
          interestAreas: form.interestAreas || '',
          testimony: form.testimony || '',
        }),
      })
      if (res.ok) setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <PageHero title="Become a Member" subtitle="Join Our Church Family" image="" />
        <div className="py-20">
          <div className="mx-auto max-w-lg text-center px-4">
            <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="size-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>Application Submitted!</h2>
            <p className="mt-3 text-muted-foreground">Thank you for your interest in joining Grace Nepal Church. Our team will review your application and get back to you within a few days.</p>
            <Button onClick={() => { setSubmitted(false); setForm({}) }} className="mt-6 bg-church-blue hover:bg-church-blue/90">
              Submit Another Application
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHero title={hero?.title || 'Become a Member'} subtitle={hero?.subtitle || 'Join Our Church Family'} image={hero?.image || ''} />

      {/* Benefits Section */}
      <section className="py-16 bg-section">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Community', desc: 'Connect with a loving family of believers who support and encourage one another.' },
              { icon: Heart, title: 'Spiritual Growth', desc: 'Access discipleship classes, small groups, and mentoring to deepen your faith.' },
              { icon: Church, title: 'Serve', desc: 'Use your gifts to serve in ministries that impact lives and communities.' },
            ].map((b, i) => (
              <div key={i} className="text-center">
                <div className="size-14 rounded-2xl bg-church-blue/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="size-7 text-church-blue" />
                </div>
                <h3 className="text-lg font-semibold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>Membership Application</h2>
            <p className="mt-2 text-muted-foreground">Fill out the form below to apply for membership</p>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+977 ..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender || ''} onValueChange={v => setForm({ ...form, gender: v })}>
                      <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={form.maritalStatus || ''} onValueChange={v => setForm({ ...form, maritalStatus: v })}>
                      <SelectTrigger id="maritalStatus"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baptismStatus">Baptism Status</Label>
                    <Select value={form.baptismStatus || ''} onValueChange={v => setForm({ ...form, baptismStatus: v })}>
                      <SelectTrigger id="baptismStatus"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_baptized">Not Baptized</SelectItem>
                        <SelectItem value="baptized">Baptized</SelectItem>
                        <SelectItem value="planning">Planning to be Baptized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howFound">How did you find us?</Label>
                  <Input id="howFound" value={form.howFound || ''} onChange={e => setForm({ ...form, howFound: e.target.value })} placeholder="e.g. Friend, Social Media, Walk-in" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestAreas">Areas of Interest</Label>
                  <Input id="interestAreas" value={form.interestAreas || ''} onChange={e => setForm({ ...form, interestAreas: e.target.value })} placeholder="e.g. Worship, Youth, Children's Ministry" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="churchBackground">Church Background</Label>
                  <Textarea id="churchBackground" value={form.churchBackground || ''} onChange={e => setForm({ ...form, churchBackground: e.target.value })} rows={3} placeholder="Tell us about your faith journey and church background" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testimony">Testimony</Label>
                  <Textarea id="testimony" value={form.testimony || ''} onChange={e => setForm({ ...form, testimony: e.target.value })} rows={3} placeholder="Share your personal testimony (optional)" />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-church-blue hover:bg-church-blue/90 py-6 text-base">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
