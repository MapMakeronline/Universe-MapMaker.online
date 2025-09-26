const CACHE_NAME = "universe-mapmaker-v1"
const STATIC_CACHE_URLS = ["/", "/manifest.json", "/icon-192x192.jpg", "/icon-512x512.jpg"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests (except Mapbox)
  if (url.origin !== self.location.origin && !url.hostname.includes("mapbox.com")) {
    return
  }

  if (url.pathname.startsWith("/api/")) {
    // Network first for API requests - never cache API responses
    event.respondWith(networkFirstNoCache(request))
  } else if (url.pathname.includes("mapbox") || url.pathname.includes("tiles")) {
    // Cache first for map tiles (with expiration)
    event.respondWith(cacheFirst(request, 86400000)) // 24 hours
  } else if (url.pathname.startsWith("/_next/static/")) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request))
  } else {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function networkFirstNoCache(request) {
  try {
    const networkResponse = await fetch(request)
    // Don't cache API responses - always fetch fresh
    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed for API request:", request.url)
    // Return offline response for API requests
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    // Return offline page or error response
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" })
  }
}

// Cache first strategy
async function cacheFirst(request, maxAge = null) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    // Check if cache is expired (if maxAge is specified)
    if (maxAge) {
      const cachedDate = new Date(cachedResponse.headers.get("date"))
      const now = new Date()
      if (now.getTime() - cachedDate.getTime() > maxAge) {
        console.log("[SW] Cache expired, fetching fresh:", request.url)
        return fetchAndCache(request)
      }
    }
    return cachedResponse
  }

  return fetchAndCache(request)
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)

  // Fetch fresh version in background
  const fetchPromise = fetchAndCache(request)

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }

  // Otherwise wait for network
  return fetchPromise
}

// Helper function to fetch and cache
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error("[SW] Fetch failed:", request.url, error)
    throw error
  }
}

// Handle background sync (for offline actions)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync offline actions when connection is restored
  console.log("[SW] Performing background sync")
}

// Handle push notifications (if needed in future)
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event)
  // Implement push notification handling
})
