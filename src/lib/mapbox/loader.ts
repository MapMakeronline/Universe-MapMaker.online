import type { MapConfig, MapInstance, MapboxError } from "./types"

let mapboxgl: typeof import("mapbox-gl") | null = null
let loadingPromise: Promise<typeof import("mapbox-gl")> | null = null

/**
 * Dynamically loads Mapbox GL JS library
 * Implements singleton pattern to avoid multiple loads
 */
export async function loadMapbox(): Promise<typeof import("mapbox-gl")> {
  if (mapboxgl) {
    return mapboxgl
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = import("mapbox-gl").then((module) => {
    mapboxgl = module
    return module
  })

  return loadingPromise
}

/**
 * Creates a new Mapbox map instance with error handling
 */
export async function createMapInstance(config: MapConfig): Promise<MapInstance> {
  try {
    const mapboxgl = await loadMapbox()

    // Set access token
    mapboxgl.accessToken = config.accessToken

    // Create map instance
    const map = new mapboxgl.Map({
      container: config.container,
      style: config.style,
      center: config.center,
      zoom: config.zoom,
      bearing: config.bearing || 0,
      pitch: config.pitch || 0,
      bounds: config.bounds,
      maxBounds: config.maxBounds,
      minZoom: config.minZoom || 0,
      maxZoom: config.maxZoom || 24,
      attributionControl: true,
      logoPosition: "bottom-left",
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
      antialias: true,
      refreshExpiredTiles: true,
      maxTileCacheSize: null,
      localIdeographFontFamily: false,
      transformRequest: (url, resourceType) => {
        // Add custom headers or modify requests if needed
        return { url }
      },
    })

    return {
      map,
      isLoaded: false,
      error: null,
    }
  } catch (error) {
    const mapboxError = error as MapboxError
    console.error("[MapboxLoader] Failed to create map instance:", mapboxError)

    return {
      map: null as any,
      isLoaded: false,
      error: mapboxError.message || "Failed to initialize map",
    }
  }
}

/**
 * Checks if Mapbox GL JS is supported in current browser
 */
export async function isMapboxSupported(): Promise<boolean> {
  try {
    const mapboxgl = await loadMapbox()
    return mapboxgl.supported()
  } catch {
    return false
  }
}

/**
 * Gets Mapbox GL JS version
 */
export async function getMapboxVersion(): Promise<string> {
  try {
    const mapboxgl = await loadMapbox()
    return mapboxgl.version
  } catch {
    return "unknown"
  }
}
