/**
 * Map Runtime Module - Pure TypeScript functions for Mapbox GL JS operations
 * No React dependencies - can be used in any context
 */

import type { Map as MapboxMap, GeoJSONSource, LngLatBoundsLike } from "mapbox-gl"
import type { FeatureCollection, Feature } from "geojson"

export interface MapOptions {
  container: HTMLDivElement
  style?: string
  center?: [number, number]
  zoom?: number
  pitch?: number
  bearing?: number
  accessToken: string
}

export interface GeoJsonLayerConfig {
  id: string
  data: FeatureCollection | Feature | string
  paint?: any
  layout?: any
  beforeId?: string
}

export interface VectorTileLayerConfig {
  id: string
  tiles: string[]
  sourceLayer: string
  promoteId?: string
  paint?: any
  layout?: any
  beforeId?: string
}

export interface WmsLayerConfig {
  id: string
  wmsUrl: string
  params: {
    layers: string
    format?: string
    transparent?: boolean
    version?: string
    [key: string]: any
  }
  beforeId?: string
}

export interface ViewportConfig {
  lng: number
  lat: number
  zoom: number
  pitch?: number
  bearing?: number
  duration?: number
}

/**
 * Initialize Mapbox map instance
 * @param options Map configuration options
 * @returns Promise<MapboxMap> Initialized map instance
 */
export async function initMap(options: MapOptions): Promise<MapboxMap> {
  const mapboxgl = await import("mapbox-gl")

  // Set access token
  mapboxgl.default.accessToken = options.accessToken

  const map = new mapboxgl.default.Map({
    container: options.container,
    style: options.style || "mapbox://styles/mapbox/streets-v12",
    center: options.center || [19.9449799, 50.0646501],
    zoom: options.zoom || 10,
    pitch: options.pitch || 0,
    bearing: options.bearing || 0,
    antialias: true,
    maxZoom: 20,
    minZoom: 1,
  })

  return new Promise((resolve, reject) => {
    map.on("load", () => resolve(map))
    map.on("error", (error) => reject(error.error))
  })
}

/**
 * Add GeoJSON layer to map
 * @param map Mapbox map instance
 * @param config GeoJSON layer configuration
 */
export function addGeoJson(map: MapboxMap, config: GeoJsonLayerConfig): void {
  const sourceId = `${config.id}-source`

  // Ensure source exists
  ensureSource(map, sourceId, {
    type: "geojson",
    data: config.data,
  })

  // Ensure layer exists
  ensureLayer(
    map,
    {
      id: config.id,
      type: "fill", // Default type, can be overridden in layout
      source: sourceId,
      layout: config.layout || {},
      paint: config.paint || {
        "fill-color": "#088",
        "fill-opacity": 0.8,
      },
    },
    config.beforeId,
  )

  console.log(`[mapRuntime] Added GeoJSON layer: ${config.id}`)
}

/**
 * Set layer visibility
 * @param map Mapbox map instance
 * @param layerId Layer ID
 * @param visible Visibility state
 */
export function setLayerVisibility(map: MapboxMap, layerId: string, visible: boolean): void {
  try {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
      console.log(`[mapRuntime] Set layer ${layerId} visibility: ${visible}`)
    } else {
      console.warn(`[mapRuntime] Layer ${layerId} not found`)
    }
  } catch (error) {
    console.error(`[mapRuntime] Failed to set visibility for layer ${layerId}:`, error)
  }
}

/**
 * Set layer order (z-index)
 * @param map Mapbox map instance
 * @param layerId Layer ID
 * @param beforeId ID of layer to place this layer before (higher z-index)
 */
export function setLayerOrder(map: MapboxMap, layerId: string, beforeId?: string): void {
  try {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId, beforeId)
      console.log(`[mapRuntime] Moved layer ${layerId} before ${beforeId || "top"}`)
    } else {
      console.warn(`[mapRuntime] Layer ${layerId} not found`)
    }
  } catch (error) {
    console.error(`[mapRuntime] Failed to reorder layer ${layerId}:`, error)
  }
}

/**
 * Fly to location with animation
 * @param map Mapbox map instance
 * @param config Viewport configuration
 */
export function flyTo(map: MapboxMap, config: ViewportConfig): void {
  try {
    map.flyTo({
      center: [config.lng, config.lat],
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      duration: config.duration || 1000,
      essential: true,
    })
    console.log(`[mapRuntime] Flying to: ${config.lng}, ${config.lat}`)
  } catch (error) {
    console.error("[mapRuntime] Failed to fly to location:", error)
  }
}

/**
 * Add Vector Tile layer (for GeoServer MVT)
 * @param map Mapbox map instance
 * @param config Vector tile layer configuration
 */
export function addVectorTileLayer(map: MapboxMap, config: VectorTileLayerConfig): void {
  const sourceId = `${config.id}-source`

  // Ensure vector source exists
  ensureSource(map, sourceId, {
    type: "vector",
    tiles: config.tiles,
    promoteId: config.promoteId,
  })

  // Ensure layer exists
  ensureLayer(
    map,
    {
      id: config.id,
      type: "fill", // Default type
      source: sourceId,
      "source-layer": config.sourceLayer,
      layout: config.layout || {},
      paint: config.paint || {
        "fill-color": "#088",
        "fill-opacity": 0.8,
      },
    },
    config.beforeId,
  )

  console.log(`[mapRuntime] Added vector tile layer: ${config.id}`)
}

/**
 * Add WMS raster layer
 * @param map Mapbox map instance
 * @param config WMS layer configuration
 */
export function addWmsLayer(map: MapboxMap, config: WmsLayerConfig): void {
  const sourceId = `${config.id}-source`

  // Build WMS URL with parameters
  const params = new URLSearchParams({
    service: "WMS",
    version: config.params.version || "1.1.1",
    request: "GetMap",
    format: config.params.format || "image/png",
    transparent: String(config.params.transparent !== false),
    layers: config.params.layers,
    width: "256",
    height: "256",
    srs: "EPSG:3857",
    ...config.params,
  })

  const tileUrl = `${config.wmsUrl}?${params.toString()}&bbox={bbox-epsg-3857}`

  // Ensure raster source exists
  ensureSource(map, sourceId, {
    type: "raster",
    tiles: [tileUrl],
    tileSize: 256,
  })

  // Ensure layer exists
  ensureLayer(
    map,
    {
      id: config.id,
      type: "raster",
      source: sourceId,
      paint: {
        "raster-opacity": 1,
      },
    },
    config.beforeId,
  )

  console.log(`[mapRuntime] Added WMS layer: ${config.id}`)
}

/**
 * Helper: Ensure source exists on map
 * @param map Mapbox map instance
 * @param sourceId Source ID
 * @param sourceConfig Source configuration
 */
export function ensureSource(map: MapboxMap, sourceId: string, sourceConfig: any): void {
  try {
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, sourceConfig)
      console.log(`[mapRuntime] Added source: ${sourceId}`)
    } else {
      // Update existing source if it's GeoJSON
      if (sourceConfig.type === "geojson") {
        const source = map.getSource(sourceId) as GeoJSONSource
        source.setData(sourceConfig.data)
        console.log(`[mapRuntime] Updated GeoJSON source: ${sourceId}`)
      }
    }
  } catch (error) {
    console.error(`[mapRuntime] Failed to ensure source ${sourceId}:`, error)
  }
}

/**
 * Helper: Ensure layer exists on map
 * @param map Mapbox map instance
 * @param layerConfig Layer configuration
 * @param beforeId ID of layer to place this layer before
 */
export function ensureLayer(map: MapboxMap, layerConfig: any, beforeId?: string): void {
  try {
    if (!map.getLayer(layerConfig.id)) {
      map.addLayer(layerConfig, beforeId)
      console.log(`[mapRuntime] Added layer: ${layerConfig.id}`)
    } else {
      // Update existing layer properties
      if (layerConfig.paint) {
        Object.keys(layerConfig.paint).forEach((property) => {
          map.setPaintProperty(layerConfig.id, property, layerConfig.paint[property])
        })
      }
      if (layerConfig.layout) {
        Object.keys(layerConfig.layout).forEach((property) => {
          map.setLayoutProperty(layerConfig.id, property, layerConfig.layout[property])
        })
      }
      console.log(`[mapRuntime] Updated layer: ${layerConfig.id}`)
    }
  } catch (error) {
    console.error(`[mapRuntime] Failed to ensure layer ${layerConfig.id}:`, error)
  }
}

/**
 * Remove layer and its source from map
 * @param map Mapbox map instance
 * @param layerId Layer ID
 */
export function removeLayer(map: MapboxMap, layerId: string): void {
  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
      console.log(`[mapRuntime] Removed layer: ${layerId}`)
    }

    const sourceId = `${layerId}-source`
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
      console.log(`[mapRuntime] Removed source: ${sourceId}`)
    }
  } catch (error) {
    console.error(`[mapRuntime] Failed to remove layer ${layerId}:`, error)
  }
}

/**
 * Fit map to bounds
 * @param map Mapbox map instance
 * @param bounds Bounds to fit
 * @param options Fit bounds options
 */
export function fitBounds(map: MapboxMap, bounds: LngLatBoundsLike, options?: any): void {
  try {
    map.fitBounds(bounds, {
      padding: 20,
      maxZoom: 16,
      duration: 1000,
      ...options,
    })
    console.log("[mapRuntime] Fitted bounds")
  } catch (error) {
    console.error("[mapRuntime] Failed to fit bounds:", error)
  }
}
