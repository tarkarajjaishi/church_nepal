'use client'

import { useEffect, useRef } from 'react'

const DEDUP_WINDOW_MS = 5000
const REPORTER_TAG = '__error_reporter__'

let alreadyMounted = false

export function ErrorReporter() {
  const seenRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (alreadyMounted) return
    alreadyMounted = true

    const recent = seenRef.current

    function isOwnError(e: Event | ErrorEvent | PromiseRejectionEvent): boolean {
      const msg = e instanceof ErrorEvent ? e.message : e instanceof PromiseRejectionEvent ? String(e.reason?.message || e.reason) : ''
      if (msg.includes(REPORTER_TAG)) return true
      const stack = e instanceof ErrorEvent ? e.error?.stack : e instanceof PromiseRejectionEvent ? e.reason?.stack : ''
      if (stack?.includes('ErrorReporter') || stack?.includes('client-errors')) return true
      return false
    }

    function dedup(msg: string): boolean {
      const now = Date.now()
      const prev = recent.get(msg)
      if (prev && now - prev < DEDUP_WINDOW_MS) return true
      recent.set(msg, now)
      // prune old entries
      if (recent.size > 100) {
        for (const [k, t] of recent) {
          if (now - t > DEDUP_WINDOW_MS) recent.delete(k)
        }
      }
      return false
    }

    function report(message: string, stack: string, source: string) {
      if (isOwnError({ message } as any)) return
      if (dedup(message)) return
      const body = { message, stack, url: window.location.href, source, ts: new Date().toISOString() }
      fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {})
    }

    function onError(e: ErrorEvent) {
      report(
        e.message || String(e),
        e.error?.stack || '',
        e.filename || '',
      )
    }

    function onUnhandledRejection(e: PromiseRejectionEvent) {
      const reason = e.reason
      const msg = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack || '' : ''
      report(msg, stack, '')
    }

    const origConsoleError = console.error
    console.error = (...args: any[]) => {
      origConsoleError.apply(console, args)
      const msg = args.map(a => (a instanceof Error ? a.message : String(a))).join(' ')
      const stack = args.find((a): a is Error => a instanceof Error)?.stack || ''
      report(msg, stack, 'console.error')
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      console.error = origConsoleError
      alreadyMounted = false
    }
  }, [])

  return null
}
