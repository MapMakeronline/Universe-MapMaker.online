import { type NextRequest, NextResponse } from "next/server"
import { GeoServerLayerManager } from "@/lib/geoserver/layer-manager"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

const layerManager = new GeoServerLayerManager({
  baseUrl: process.env.GEOSERVER_URL!,
  workspace: process.env.GEOSERVER_WORKSPACE,
  username: process.env.GEOSERVER_USERNAME,
  password: process.env.GEOSERVER_PASSWORD,
})

/**
 * GET /api/geoserver/layers
 * Get available layers from GeoServer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get("service") as "wms" | "wfs" | "mvt" | null

    console.log(`[API] Getting GeoServer layers for service: ${service || "all"}`)

    const availableLayers = await layerManager.getAvailableLayers()

    if (service) {
      return NextResponse.json({
        success: true,
        service,
        layers: availableLayers[service] || [],
        total: availableLayers[service]?.length || 0,
      })
    }

    return NextResponse.json({
      success: true,
      layers: availableLayers,
      total: {
        wms: availableLayers.wms.length,
        wfs: availableLayers.wfs.length,
        mvt: availableLayers.mvt.length,
      },
    })
  } catch (error) {
    console.error("[API] Failed to get GeoServer layers:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve layers",
      },
      { status: 500 },
    )
  }
}
