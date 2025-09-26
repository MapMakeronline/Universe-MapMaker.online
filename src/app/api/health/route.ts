import { NextResponse } from "next/server"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

/**
 * GET /api/health
 * Health check endpoint for Cloud Run
 */
export async function GET() {
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: "not_implemented", // Would check Google Sheets connection
        geoserver: "not_implemented", // Would check GeoServer connection
        redis: "not_implemented", // Would check Redis if used
      },
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error("[Health] Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 },
    )
  }
}

/**
 * HEAD /api/health
 * Simple health check for load balancers
 */
export async function HEAD() {
  return new Response(null, { status: 200 })
}
