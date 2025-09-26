"use client"

import { useEffect } from "react"
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals"
import * as Sentry from "@sentry/nextjs"

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and sends them to Sentry
 */
export function WebVitals() {
  useEffect(() => {
    // Track Core Web Vitals
    getCLS((metric) => {
      Sentry.addBreadcrumb({
        category: "web-vital",
        message: `CLS: ${metric.value}`,
        level: "info",
        data: metric,
      })

      // Send to Sentry as custom metric
      Sentry.setMeasurement("cls", metric.value, "ratio")
    })

    getFID((metric) => {
      Sentry.addBreadcrumb({
        category: "web-vital",
        message: `FID: ${metric.value}ms`,
        level: "info",
        data: metric,
      })

      Sentry.setMeasurement("fid", metric.value, "millisecond")
    })

    getFCP((metric) => {
      Sentry.addBreadcrumb({
        category: "web-vital",
        message: `FCP: ${metric.value}ms`,
        level: "info",
        data: metric,
      })

      Sentry.setMeasurement("fcp", metric.value, "millisecond")
    })

    getLCP((metric) => {
      Sentry.addBreadcrumb({
        category: "web-vital",
        message: `LCP: ${metric.value}ms`,
        level: "info",
        data: metric,
      })

      Sentry.setMeasurement("lcp", metric.value, "millisecond")
    })

    getTTFB((metric) => {
      Sentry.addBreadcrumb({
        category: "web-vital",
        message: `TTFB: ${metric.value}ms`,
        level: "info",
        data: metric,
      })

      Sentry.setMeasurement("ttfb", metric.value, "millisecond")
    })
  }, [])

  return null
}
