import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Minimal configuration for edge runtime
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",
})
