/**
 * GeoServer Integration with MapRuntime
 * Helper functions to connect GeoServer services with Mapbox GL JS
 */

import type { Map as MapboxMap } from "mapbox-gl"
import { addWmsLayer, addGeoJson } from "../mapRuntime"
import { getWmsUrl, wfsGetFeatures, wfsGetFeaturesGml, parseGml } from "./client"

export interface GeoServerWmsLayerConfig {
  id: string
  geoserverUrl: string
  workspace: string
  layerName: string
  format?: string
  transparent?: boolean
  styles?: string
  cql_filter?: string
  beforeId?: string
}

export interface GeoServerWfsLayerConfig {
  id: string
  geoserverUrl: string
  workspace: string
  typeName: string
  maxFeatures?: number
  cql_filter?: string
  paint?: any
  layout?: any
  beforeId?: string
}

/**
 * Add WMS layer from GeoServer to Mapbox map
 * @param map Mapbox map instance
 * @param config GeoServer WMS layer configuration
 */
export function addWmsLayerFromGeoServer(map: MapboxMap, config: GeoServerWmsLayerConfig): void {
  try {
    const wmsUrl = getWmsUrl({
      base: config.geoserverUrl,
      layer: `${config.workspace}:${config.layerName}`,
      format: config.format || "image/png",
      transparent: config.transparent !== false,
      styles: config.styles,
      cql_filter: config.cql_filter,
      srs: "EPSG:3857",
    })

    addWmsLayer(map, {
      id: config.id,
      wmsUrl: config.geoserverUrl,
      params: {
        layers: `${config.workspace}:${config.layerName}`,
        format: config.format || "image/png",
        transparent: config.transparent !== false,
        styles: config.styles || "",
        cql_filter: config.cql_filter || "",
      },
      beforeId: config.beforeId,
    })

    console.log(`[GeoServer Integration] Added WMS layer: ${config.id}`)
  } catch (error) {
    console.error(`[GeoServer Integration] Failed to add WMS layer ${config.id}:`, error)
    throw error
  }
}

/**
 * Add WFS layer from GeoServer to Mapbox map as GeoJSON
 * @param map Mapbox map instance
 * @param config GeoServer WFS layer configuration
 */
export async function addWfsLayerFromGeoServer(map: MapboxMap, config: GeoServerWfsLayerConfig): Promise<void> {
  try {
    // Try GeoJSON format first
    let geojsonData

    try {
      geojsonData = await wfsGetFeatures({
        base: config.geoserverUrl,
        typeName: `${config.workspace}:${config.typeName}`,
        outputFormat: "application/json",
        maxFeatures: config.maxFeatures,
        cql_filter: config.cql_filter,
        srs: "EPSG:4326",
      })
    } catch (geojsonError) {
      console.log(`[GeoServer Integration] GeoJSON failed, trying GML for ${config.id}`)

      // Fallback to GML if GeoJSON not supported
      const gmlData = await wfsGetFeaturesGml({
        base: config.geoserverUrl,
        typeName: `${config.workspace}:${config.typeName}`,
        maxFeatures: config.maxFeatures,
        cql_filter: config.cql_filter,
        srs: "EPSG:4326",
      })

      geojsonData = await parseGml(gmlData)
    }

    // Add to map as GeoJSON layer
    addGeoJson(map, {
      id: config.id,
      data: geojsonData,
      paint: config.paint || {
        "fill-color": "#627BC1",
        "fill-opacity": 0.8,
        "fill-outline-color": "#ffffff",
      },
      layout: config.layout || {
        visibility: "visible",
      },
      beforeId: config.beforeId,
    })

    console.log(`[GeoServer Integration] Added WFS layer: ${config.id} with ${geojsonData.features.length} features`)
  } catch (error) {
    console.error(`[GeoServer Integration] Failed to add WFS layer ${config.id}:`, error)
    throw error
  }
}
