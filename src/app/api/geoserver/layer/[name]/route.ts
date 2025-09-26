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
 * GET /api/geoserver/layer/[name]
 * Get layer information and create Mapbox source/layer configuration
 */
export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const layerName = params.name
    const service = (searchParams.get("service") as "wms" | "wfs" | "mvt") || "wms"
    const createMapboxConfig = searchParams.get("mapbox") === "true"

    console.log(`[API] Getting layer info for: ${layerName} (${service})`)

    // Get layer information
    const layerInfo = await layerManager.getLayerInfo(layerName, service)

    if (!layerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: `Layer ${layerName} not found for service ${service}`,
        },
        { status: 404 },
      )
    }

    const response: any = {
      success: true,
      layer: layerInfo,
      service,
    }

    // Create Mapbox configuration if requested
    if (createMapboxConfig) {
      try {
        const sourceConfig = await layerManager.createMapboxSource(layerName, service)
        const layerConfig = layerManager.createMapboxLayer(layerName, sourceConfig.id, service)

        response.mapbox = {
          source: sourceConfig,
          layer: layerConfig,
        }
      } catch (error) {
        console.warn(`[API] Failed to create Mapbox config for ${layerName}:`, error)
        response.mapboxError = error instanceof Error ? error.message : "Failed to create Mapbox configuration"
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error(`[API] Failed to get layer info for ${params.name}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve layer information",
      },
      { status: 500 },
    )
  }
}
