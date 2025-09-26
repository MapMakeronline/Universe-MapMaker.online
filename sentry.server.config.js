import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",

  // Server-specific configuration
  integrations: [new Sentry.Integrations.Http({ tracing: true })],

  // Error filtering for server
  beforeSend(event, hint) {
    // Filter out expected server errors
    if (event.exception) {
      const error = hint.originalException

      // Skip expected API errors
      if (error?.message?.includes("ECONNREFUSED") || error?.message?.includes("timeout")) {
        return null
      }
    }

    return event
  },
})
