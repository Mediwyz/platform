// MediWyz Service Worker
// In development, use network-only to avoid stale cache issues
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'
const CACHE_NAME = 'mediwyz-v1'
const STATIC_CACHE = 'mediwyz-static-v1'
const API_CACHE = 'mediwyz-api-v1'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// Install event — pre-cache static assets
self.addEventListener('install', (event) => {
  if (IS_DEV) {
    // In dev, skip caching entirely
    self.skipWaiting()
    return
  }
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.log('Precache partial failure (non-critical):', err)
      })
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // In dev, delete ALL caches. In prod, keep current versions.
          if (IS_DEV || ![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip WebSocket and Socket.IO requests
  if (url.pathname.startsWith('/socket.io')) return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // In development: always go to network, never cache
  if (IS_DEV) return

  // --- Production caching below ---

    // Stale-while-revalidate for slow-changing config endpoints.
  // Serve cache immediately so pages feel instant; refresh in background.
  const SWR_PATTERNS = [
    /^\/api\/roles(\?|$)/,
    /^\/api\/regions(\?|$)/,
    /^\/api\/cms\/testimonials(\?|$)/,
    /^\/api\/subscriptions(\?|$)/,
  ]
  if (SWR_PATTERNS.some(p => p.test(url.pathname + url.search))) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        }).catch(() => null)
        return cached || networkFetch || new Response(
          JSON.stringify({ success: false, message: 'Offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Don't cache auth endpoints
    if (url.pathname.startsWith('/api/auth/')) return

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ success: false, message: 'Offline' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          })
        })
    )
    return
  }

  // Static assets: cache-first with network fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // HTML pages: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/')
        })
      })
  )
})

// Push notification event — display when app is in background / closed
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'MediWyz', body: event.data.text() } }

  const title = data.title || 'MediWyz'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'mediwyz-notification',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click — focus/open the app at the notification's URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
