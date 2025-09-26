export interface GeoServerConfig {
  baseUrl: string
  workspace?: string
  username?: string
  password?: string
  timeout?: number
}

export interface WMSCapabilities {
  version: string
  service: {
    name: string
    title: string
    abstract?: string
  }
  layers: WMSLayer[]
  formats: string[]
  crs: string[]
}

export interface WMSLayer {
  name: string
  title: string
  abstract?: string
  keywords?: string[]
  crs: string[]
  bbox: {
    minx: number
    miny: number
    maxx: number
    maxy: number
    crs: string
  }
  styles: WMSStyle[]
  queryable: boolean
  opaque: boolean
  dimensions?: WMSDimension[]
}

export interface WMSStyle {
  name: string
  title: string
  abstract?: string
  legendUrl?: string
}

export interface WMSDimension {
  name: string
  units: string
  unitSymbol?: string
  default?: string
  multipleValues: boolean
  nearestValue: boolean
  current: boolean
  values: string[]
}

export interface WFSCapabilities {
  version: string
  service: {
    name: string
    title: string
    abstract?: string
  }
  featureTypes: WFSFeatureType[]
  operations: string[]
}

export interface WFSFeatureType {
  name: string
  title: string
  abstract?: string
  keywords?: string[]
  defaultCRS: string
  otherCRS: string[]
  bbox: {
    minx: number
    miny: number
    maxx: number
    maxy: number
    crs: string
  }
  outputFormats: string[]
}

export interface MVTTilesetInfo {
  name: string
  description?: string
  version: string
  attribution?: string
  scheme: "xyz" | "tms"
  tiles: string[]
  minzoom: number
  maxzoom: number
  bounds: [number, number, number, number]
  center: [number, number, number]
  vector_layers: MVTVectorLayer[]
}

export interface MVTVectorLayer {
  id: string
  description?: string
  minzoom: number
  maxzoom: number
  fields: Record<string, string>
}

export interface GeoServerError extends Error {
  code?: string
  status?: number
  service?: "WMS" | "WFS" | "MVT"
}

export interface LayerSource {
  id: string
  type: "wms" | "wfs" | "mvt"
  config: WMSSourceConfig | WFSSourceConfig | MVTSourceConfig
}

export interface WMSSourceConfig {
  url: string
  layers: string
  styles?: string
  format?: string
  transparent?: boolean
  version?: string
  crs?: string
  tileSize?: number
}

export interface WFSSourceConfig {
  url: string
  typeName: string
  version?: string
  outputFormat?: string
  maxFeatures?: number
  crs?: string
}

export interface MVTSourceConfig {
  url: string
  minzoom?: number
  maxzoom?: number
  scheme?: "xyz" | "tms"
}
