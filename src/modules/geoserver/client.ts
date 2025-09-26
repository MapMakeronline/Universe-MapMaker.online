/**
 * GeoServer Client Module
 * Handles communication with GeoServer WMS, WFS, and MVT services
 */

import axios, { type AxiosInstance } from "axios"
import { parseString } from "xml2js"
import type { FeatureCollection } from "geojson"

export interface GeoServerConfig {
  baseUrl: string
  workspace?: string
  username?: string
  password?: string
  timeout?: number
  maxRetries?: number
}

export interface WmsUrlParams {
  base: string
  layer: string
  format?: string
  transparent?: boolean
  srs?: string
  version?: string
  styles?: string
  cql_filter?: string
  width?: number
  height?: number
}

export interface WfsParams {
  base: string
  typeName: string
  srs?: string
  outputFormat?: string
  maxFeatures?: number
  startIndex?: number
  bbox?: string
  cql_filter?: string
  version?: string
}

export interface GeoServerCapabilities {
  title: string
  abstract: string
  layers: Array<{
    name: string
    title: string
    abstract: string
    bbox: number[]
    srs: string[]
  }>
}

/**
 * Create configured axios instance for GeoServer communication
 */
export function createGeoServerClient(config: GeoServerConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout || 30000,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Add authentication if provided
  if (config.username && config.password) {
    client.defaults.auth = {
      username: config.username,
      password: config.password,
    }
  }

  // Add retry interceptor
  const maxRetries = config.maxRetries || 3
  let retryCount = 0

  client.interceptors.response.use(
    (response) => {
      retryCount = 0
      return response
    },
    async (error) => {
      if (retryCount < maxRetries && error.code === "ECONNABORTED") {
        retryCount++
        console.log(`[GeoServer] Retrying request (${retryCount}/${maxRetries})`)
        return client.request(error.config)
      }
      retryCount = 0
      return Promise.reject(error)
    },
  )

  return client
}

/**
 * Generate WMS GetMap URL with parameters
 * @param params WMS URL parameters
 * @returns Complete WMS URL for tile requests
 */
export function getWmsUrl(params: WmsUrlParams): string {
  const urlParams = new URLSearchParams({
    service: "WMS",
    version: params.version || "1.1.1",
    request: "GetMap",
    layers: params.layer,
    format: params.format || "image/png",
    transparent: String(params.transparent !== false),
    srs: params.srs || "EPSG:3857",
    width: String(params.width || 256),
    height: String(params.height || 256),
    bbox: "{bbox-epsg-3857}", // Mapbox GL JS will replace this
  })

  // Add optional parameters
  if (params.styles) {
    urlParams.set("styles", params.styles)
  }
  if (params.cql_filter) {
    urlParams.set("cql_filter", params.cql_filter)
  }

  return `${params.base}/wms?${urlParams.toString()}`
}

/**
 * Fetch features from WFS service as GeoJSON
 * @param params WFS request parameters
 * @returns Promise<FeatureCollection> GeoJSON feature collection
 */
export async function wfsGetFeatures(params: WfsParams): Promise<FeatureCollection> {
  const client = createGeoServerClient({ baseUrl: params.base })

  const requestParams = new URLSearchParams({
    service: "WFS",
    version: params.version || "1.0.0",
    request: "GetFeature",
    typeName: params.typeName,
    outputFormat: params.outputFormat || "application/json",
    srsName: params.srs || "EPSG:4326",
  })

  // Add optional parameters
  if (params.maxFeatures) {
    requestParams.set("maxFeatures", String(params.maxFeatures))
  }
  if (params.startIndex) {
    requestParams.set("startIndex", String(params.startIndex))
  }
  if (params.bbox) {
    requestParams.set("bbox", params.bbox)
  }
  if (params.cql_filter) {
    requestParams.set("cql_filter", params.cql_filter)
  }

  try {
    const response = await client.get(`/wfs?${requestParams.toString()}`)

    // Validate GeoJSON response
    if (response.data && response.data.type === "FeatureCollection") {
      console.log(`[GeoServer] Fetched ${response.data.features?.length || 0} features from ${params.typeName}`)
      return response.data as FeatureCollection
    } else {
      throw new Error("Invalid GeoJSON response from WFS service")
    }
  } catch (error) {
    console.error(`[GeoServer] WFS request failed for ${params.typeName}:`, error)
    throw new Error(`Failed to fetch features from ${params.typeName}: ${error}`)
  }
}

/**
 * Fetch features from WFS service as GML (fallback for servers without GeoJSON support)
 * @param params WFS request parameters
 * @returns Promise<string> Raw GML XML response
 */
export async function wfsGetFeaturesGml(params: WfsParams): Promise<string> {
  const client = createGeoServerClient({ baseUrl: params.base })

  const requestParams = new URLSearchParams({
    service: "WFS",
    version: params.version || "1.0.0",
    request: "GetFeature",
    typeName: params.typeName,
    outputFormat: "GML2", // Force GML output
    srsName: params.srs || "EPSG:4326",
  })

  // Add optional parameters
  if (params.maxFeatures) {
    requestParams.set("maxFeatures", String(params.maxFeatures))
  }
  if (params.startIndex) {
    requestParams.set("startIndex", String(params.startIndex))
  }
  if (params.bbox) {
    requestParams.set("bbox", params.bbox)
  }
  if (params.cql_filter) {
    requestParams.set("cql_filter", params.cql_filter)
  }

  try {
    const response = await client.get(`/wfs?${requestParams.toString()}`, {
      headers: { Accept: "application/xml, text/xml" },
    })

    if (typeof response.data === "string") {
      console.log(`[GeoServer] Fetched GML data from ${params.typeName}`)
      return response.data
    } else {
      throw new Error("Invalid GML response from WFS service")
    }
  } catch (error) {
    console.error(`[GeoServer] WFS GML request failed for ${params.typeName}:`, error)
    throw new Error(`Failed to fetch GML from ${params.typeName}: ${error}`)
  }
}

/**
 * Parse GML XML to simple GeoJSON (MVP implementation)
 * @param gmlXml GML XML string
 * @returns Promise<FeatureCollection> Parsed GeoJSON
 */
export async function parseGml(gmlXml: string): Promise<FeatureCollection> {
  return new Promise((resolve, reject) => {
    parseString(gmlXml, { explicitArray: false, ignoreAttrs: false }, (err, result) => {
      if (err) {
        console.error("[GeoServer] GML parsing error:", err)
        reject(new Error(`Failed to parse GML: ${err.message}`))
        return
      }

      try {
        // Basic GML to GeoJSON conversion (MVP)
        // This is a simplified parser - production should use a proper GML parser
        const featureCollection: FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        }

        // Navigate GML structure (varies by GeoServer version)
        const featureMembers =
          result?.["wfs:FeatureCollection"]?.["gml:featureMember"] ||
          result?.["FeatureCollection"]?.["featureMember"] ||
          []

        const members = Array.isArray(featureMembers) ? featureMembers : [featureMembers]

        members.forEach((member: any) => {
          if (!member) return

          // Extract feature data (simplified)
          const featureKeys = Object.keys(member).filter((key) => !key.startsWith("gml:"))

          featureKeys.forEach((featureKey) => {
            const featureData = member[featureKey]
            if (!featureData) return

            // Extract geometry (basic point support)
            let geometry = null
            if (featureData["gml:Point"]) {
              const coords = featureData["gml:Point"]["gml:coordinates"]
              if (coords) {
                const [x, y] = coords.split(",").map(Number)
                geometry = {
                  type: "Point",
                  coordinates: [x, y],
                }
              }
            }

            // Extract properties
            const properties: any = {}
            Object.keys(featureData).forEach((key) => {
              if (!key.startsWith("gml:") && typeof featureData[key] === "string") {
                properties[key] = featureData[key]
              }
            })

            if (geometry) {
              featureCollection.features.push({
                type: "Feature",
                geometry,
                properties,
              })
            }
          })
        })

        console.log(`[GeoServer] Parsed ${featureCollection.features.length} features from GML`)
        resolve(featureCollection)
      } catch (parseError) {
        console.error("[GeoServer] GML to GeoJSON conversion error:", parseError)
        reject(new Error(`Failed to convert GML to GeoJSON: ${parseError}`))
      }
    })
  })
}

/**
 * Get WMS capabilities from GeoServer
 * @param baseUrl GeoServer base URL
 * @returns Promise<GeoServerCapabilities> Parsed capabilities
 */
export async function getWmsCapabilities(baseUrl: string): Promise<GeoServerCapabilities> {
  const client = createGeoServerClient({ baseUrl })

  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetCapabilities",
  })

  try {
    const response = await client.get(`/wms?${params.toString()}`)

    return new Promise((resolve, reject) => {
      parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse WMS capabilities: ${err.message}`))
          return
        }

        try {
          const capability = result.WMT_MS_Capabilities || result.WMS_Capabilities
          const service = capability.Service
          const layers = capability.Capability.Layer.Layer || []

          const capabilities: GeoServerCapabilities = {
            title: service.Title || "GeoServer",
            abstract: service.Abstract || "",
            layers: Array.isArray(layers)
              ? layers.map((layer: any) => ({
                  name: layer.Name,
                  title: layer.Title || layer.Name,
                  abstract: layer.Abstract || "",
                  bbox: layer.LatLonBoundingBox
                    ? [
                        Number.parseFloat(layer.LatLonBoundingBox.$.minx),
                        Number.parseFloat(layer.LatLonBoundingBox.$.miny),
                        Number.parseFloat(layer.LatLonBoundingBox.$.maxx),
                        Number.parseFloat(layer.LatLonBoundingBox.$.maxy),
                      ]
                    : [],
                  srs: Array.isArray(layer.SRS) ? layer.SRS : [layer.SRS || "EPSG:4326"],
                }))
              : [],
          }

          console.log(`[GeoServer] Retrieved capabilities for ${capabilities.layers.length} layers`)
          resolve(capabilities)
        } catch (parseError) {
          reject(new Error(`Failed to parse capabilities XML: ${parseError}`))
        }
      })
    })
  } catch (error) {
    console.error("[GeoServer] Failed to get WMS capabilities:", error)
    throw new Error(`Failed to get WMS capabilities: ${error}`)
  }
}

/**
 * Test GeoServer connection
 * @param config GeoServer configuration
 * @returns Promise<boolean> Connection status
 */
export async function testGeoServerConnection(config: GeoServerConfig): Promise<boolean> {
  try {
    const client = createGeoServerClient(config)
    const response = await client.get("/wms?service=WMS&version=1.1.1&request=GetCapabilities")

    console.log("[GeoServer] Connection test successful")
    return response.status === 200
  } catch (error) {
    console.error("[GeoServer] Connection test failed:", error)
    return false
  }
}
