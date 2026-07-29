'use client'

import { useState, useEffect } from 'react'
import { Search, Users, X, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/portal/api'

interface DirectoryMember {
  id: string
  firstName: string
  lastName: string
  photo?: string
  memberStatus: string
}

export default function PortalDirectoryPage() {
  const [members, setMembers] = useState<DirectoryMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [contacting, setContacting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fetchMembers = async (query?: string) => {
    setLoading(true)
    try {
      const res = await api.get('/portal/directory', { params: { search: query } })
      setMembers(res.data)
    } catch (err) {
      console.error('Failed to load directory', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMembers(search)
  }

  const openContact = (id: string) => {
    setContacting(id)
    setMessage('')
    setSent(false)
  }

  const closeContact = () => {
    setContacting(null)
    setMessage('')
    setSent(false)
  }

  const sendMessage = async () => {
    if (!contacting || !message.trim()) return
    setSending(true)
    try {
      await api.post('/portal/directory/contact', {
        person_id: contacting,
        message: message.trim(),
      })
      setSent(true)
      setTimeout(closeContact, 2000)
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setSending(false)
    }
  }

  const contactMember = members.find((m) => m.id === contacting)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-church-blue">Member Directory</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent"
          />
        </div>
        <Button type="submit" variant="default">
          Search
        </Button>
      </form>

      {members.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="size-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No members found in the directory.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((member) => (
            <Card key={member.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-[#0b3c5d] flex items-center justify-center text-white text-lg font-semibold shrink-0">
                    {member.photo ? (
<img
  src={member.photo}
  alt={`${member.firstName} ${member.lastName}`}
  className="size-12 rounded-full object-cover"
/>
                    ) : (
                      `${member.firstName[0]}${member.lastName[0]}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-church-blue truncate">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.memberStatus}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={() => openContact(member.id)}
                    className="w-full"
                  >
                    <Send className="size-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {contacting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="dialog-title" className="text-lg font-semibold text-church-blue">
                  Contact {contactMember?.firstName} {contactMember?.lastName}
                </h2>
                <button
                  onClick={closeContact}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
              {sent ? (
                <p className="text-sm text-green-600">Your message has been sent!</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send a message through the church app. Contact details are private.
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                    aria-label="Message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={closeContact}>
                      Cancel
                    </Button>
                    <Button onClick={sendMessage} disabled={sending || !message.trim()}>
                      {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
