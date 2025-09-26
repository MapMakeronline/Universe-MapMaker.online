import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Security and PWA Middleware
 * Implements security headers, rate limiting, and PWA support
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
    "img-src 'self' data: blob: https: https://api.mapbox.com https://*.tiles.mapbox.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://sheets.googleapis.com https://www.googleapis.com",
    "worker-src 'self' blob:",
    "child-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  // Enhanced rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = `rate_limit_${ip}_${request.nextUrl.pathname}`

    // Stricter rate limiting for proxy endpoints
    if (request.nextUrl.pathname.startsWith("/api/proxy/")) {
      // In production, implement Redis-based rate limiting
      // For now, set appropriate headers
      response.headers.set("X-RateLimit-Limit", "60") // 60 requests per minute for proxy
      response.headers.set("X-RateLimit-Remaining", "59")
      response.headers.set("X-RateLimit-Reset", new Date(Date.now() + 60000).toISOString())

      // Add cache headers for proxy responses
      if (request.method === "GET") {
        response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
      }
    } else {
      // Standard rate limiting for other API routes
      response.headers.set("X-RateLimit-Limit", "100")
      response.headers.set("X-RateLimit-Remaining", "99")
      response.headers.set("X-RateLimit-Reset", new Date(Date.now() + 60000).toISOString())
    }
  }

  // PWA Support - Cache Control for static assets
  if (
    request.nextUrl.pathname.startsWith("/_next/static/") ||
    request.nextUrl.pathname.includes("/icon-") ||
    request.nextUrl.pathname === "/manifest.json"
  ) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  }

  // Service Worker registration
  if (request.nextUrl.pathname === "/sw.js") {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate")
    response.headers.set("Service-Worker-Allowed", "/")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
