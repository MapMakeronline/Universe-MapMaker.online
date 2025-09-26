import type { Map, LngLatBoundsLike } from "mapbox-gl"

export interface MapConfig {
  container: string | HTMLElement
  style: string
  center: [number, number]
  zoom: number
  bearing?: number
  pitch?: number
  bounds?: LngLatBoundsLike
  maxBounds?: LngLatBoundsLike
  minZoom?: number
  maxZoom?: number
  accessToken: string
}

export interface MapInstance {
  map: Map
  isLoaded: boolean
  error: string | null
}

export interface MapEventHandlers {
  onLoad?: () => void
  onError?: (error: Error) => void
  onClick?: (event: any) => void
  onMove?: (event: any) => void
  onZoom?: (event: any) => void
}

export interface LayerConfig {
  id: string
  type: "fill" | "line" | "symbol" | "circle" | "raster" | "background"
  source: string | any
  layout?: any
  paint?: any
  filter?: any[]
  minzoom?: number
  maxzoom?: number
}

export interface SourceConfig {
  id: string
  type: "vector" | "raster" | "geojson" | "image" | "video"
  data?: any
  url?: string
  tiles?: string[]
  bounds?: number[]
  scheme?: "xyz" | "tms"
  tileSize?: number
}

export interface MapboxError extends Error {
  code?: string
  status?: number
}
