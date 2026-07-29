'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64url = base64.replace(/-/g, '+').replace(/_/g, '/') + padding
  const raw = atob(base64url)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function PushOptIn() {
  const [open, setOpen] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    const dismissed = localStorage.getItem('push_opt_in_dismissed')
    const alreadySubscribed = localStorage.getItem('push_subscribed')

    if (alreadySubscribed && Notification.permission === 'granted') {
      return
    }

    if (!dismissed && Notification.permission === 'default') {
      const timeout = setTimeout(() => setOpen(true), 5000)
      return () => clearTimeout(timeout)
    }
  }, [])

  const subscribe = useCallback(async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notifications are blocked. Enable them in browser settings.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      if (!VAPID_PUBLIC_KEY) {
        toast.error('Push notifications are not configured on this device.')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      localStorage.setItem('push_subscribed', 'true')
      toast.success('You\'ll now receive notices and event updates.')
      setOpen(false)
    } catch (err) {
      console.error('Push subscription failed', err)
      toast.error('Failed to enable notifications.')
    } finally {
      setSubscribing(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem('push_opt_in_dismissed', '1')
    setOpen(false)
  }, [])

  if (!open) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50">
      <div className="rounded-xl border border-border bg-background shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 flex size-10 items-center justify-center rounded-lg bg-church-blue text-white">
            <Bell className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              Receive notices & events
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Get push notifications for new services, camps, and important updates.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="size-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={subscribe} disabled={subscribing}>
            {subscribing ? 'Enabling…' : 'Enable notifications'}
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
