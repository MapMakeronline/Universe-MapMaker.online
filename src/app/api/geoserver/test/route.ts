import { NextResponse } from "next/server"
import { GeoServerLayerManager } from "@/lib/geoserver/layer-manager"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

/**
 * GET /api/geoserver/test
 * Test GeoServer connection and services
 */
export async function GET() {
  try {
    const layerManager = new GeoServerLayerManager({
      baseUrl: process.env.GEOSERVER_URL!,
      workspace: process.env.GEOSERVER_WORKSPACE,
      username: process.env.GEOSERVER_USERNAME,
      password: process.env.GEOSERVER_PASSWORD,
    })

    console.log("[API] Testing GeoServer connections...")

    const connections = await layerManager.testConnections()
    const availableLayers = await layerManager.getAvailableLayers()

    const allConnected = connections.wms && connections.wfs && connections.mvt
    const totalLayers = availableLayers.wms.length + availableLayers.wfs.length + availableLayers.mvt.length

    return NextResponse.json({
      success: allConnected,
      message: allConnected ? "All GeoServer services connected successfully" : "Some GeoServer services failed",
      connections,
      layers: availableLayers,
      summary: {
        totalLayers,
        wmsLayers: availableLayers.wms.length,
        wfsLayers: availableLayers.wfs.length,
        mvtLayers: availableLayers.mvt.length,
      },
      config: {
        baseUrl: process.env.GEOSERVER_URL,
        workspace: process.env.GEOSERVER_WORKSPACE,
        hasAuth: !!(process.env.GEOSERVER_USERNAME && process.env.GEOSERVER_PASSWORD),
      },
    })
  } catch (error) {
    console.error("[API] GeoServer test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "GeoServer connection test failed",
      },
      { status: 500 },
    )
  }
}
