import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",

  // Error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException

      // Skip network errors that are expected
      if (error?.message?.includes("NetworkError") || error?.message?.includes("fetch")) {
        return null
      }

      // Skip Mapbox GL errors that are non-critical
      if (error?.message?.includes("mapbox-gl") && error?.message?.includes("WebGL")) {
        return null
      }
    }

    return event
  },

  // Additional configuration for PWA
  integrations: [
    new Sentry.BrowserTracing({
      // Track navigation performance
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      // Mask sensitive data
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
})
