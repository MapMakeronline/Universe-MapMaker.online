"use client"

/**
 * Service Worker Registration and Management
 * Handles PWA service worker lifecycle
 */
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null

  /**
   * Register service worker
   */
  async register(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.warn("[PWA] Service workers not supported")
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("[PWA] Service worker registered:", this.registration.scope)

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] New service worker available")
              this.notifyUpdate()
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error("[PWA] Service worker registration failed:", error)
      return false
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const result = await this.registration.unregister()
      console.log("[PWA] Service worker unregistered:", result)
      return result
    } catch (error) {
      console.error("[PWA] Service worker unregistration failed:", error)
      return false
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      return
    }

    try {
      await this.registration.update()
      console.log("[PWA] Service worker update check completed")
    } catch (error) {
      console.error("[PWA] Service worker update failed:", error)
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return
    }

    this.registration.waiting.postMessage({ type: "SKIP_WAITING" })
    console.log("[PWA] Skipping waiting, activating new service worker")
  }

  /**
   * Notify about available update
   */
  private notifyUpdate(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(
      new CustomEvent("sw-update-available", {
        detail: { registration: this.registration },
      }),
    )
  }

  /**
   * Get registration status
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }

  /**
   * Check if service worker is supported
   */
  static isSupported(): boolean {
    return "serviceWorker" in navigator
  }
}

// Global service worker manager instance
export const swManager = new ServiceWorkerManager()

/**
 * Initialize PWA features
 */
export async function initializePWA(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  try {
    // Register service worker
    const registered = await swManager.register()
    if (registered) {
      console.log("[PWA] PWA features initialized successfully")
    }

    // Handle service worker messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("[PWA] Message from service worker:", event.data)
    })

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] Service worker controller changed")
      window.location.reload()
    })
  } catch (error) {
    console.error("[PWA] PWA initialization failed:", error)
  }
}
