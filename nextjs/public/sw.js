// Bumped whenever the caching rules change: `activate` deletes every cache
// whose name is not this one, so the name is the only eviction mechanism there
// is. Leaving it fixed meant a stale entry could outlive the code that made it.
const CACHE = 'grace-church-v2'
const APP_SHELL = ['/', '/offline.html']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {})
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/')) return

  // Never a GET we should replay from cache.
  if (event.request.method !== 'GET') return

  // The admin is not an offline surface. Someone editing the giving records
  // must not be served yesterday's JavaScript, and in development webpack
  // reuses chunk filenames — so a cache-first rule pins a stale bundle and the
  // page keeps rendering code that no longer exists on disk. That cost hours
  // of chasing a fix that was already applied.
  if (url.pathname.startsWith('/admin')) return
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            return (
              cached ||
              caches
                .match('/offline.html')
                .then((offline) => offline || new Response('Offline', { status: 503 }))
            )
          })
        )
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        return cached || fetchPromise
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { /* ignore */ }

  const title = payload.title || 'Grace Nepal Church'
  const options = {
    body: payload.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && 'focus' in client) return client.focus()
      }
      if ('openWindow' in self.clients) return self.clients.openWindow(targetUrl)
    })
  )
})
