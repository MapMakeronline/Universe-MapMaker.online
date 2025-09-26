import type { GeoServerConfig, WFSCapabilities, WFSFeatureType, WFSSourceConfig, GeoServerError } from "./types"
import type { FeatureCollection } from "geojson"

/**
 * GeoServer WFS Adapter
 * Handles WFS service interactions and feature data retrieval
 */
export class WFSAdapter {
  private config: GeoServerConfig

  constructor(config: GeoServerConfig) {
    this.config = {
      timeout: 15000,
      ...config,
    }
  }

  /**
   * Get WFS capabilities
   */
  async getCapabilities(): Promise<WFSCapabilities> {
    try {
      const url = this.buildCapabilitiesUrl()
      console.log(`[WFSAdapter] Fetching capabilities from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      if (!response.ok) {
        throw new Error(`WFS capabilities request failed: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()
      const capabilities = this.parseCapabilities(xmlText)

      console.log(`[WFSAdapter] Retrieved ${capabilities.featureTypes.length} feature types`)
      return capabilities
    } catch (error) {
      const wfsError = error as GeoServerError
      wfsError.service = "WFS"
      console.error("[WFSAdapter] Failed to get capabilities:", wfsError)
      throw wfsError
    }
  }

  /**
   * Get features from WFS
   */
  async getFeatures(
    typeName: string,
    options: {
      maxFeatures?: number
      bbox?: [number, number, number, number]
      crs?: string
      outputFormat?: string
      propertyName?: string[]
      filter?: string
    } = {},
  ): Promise<FeatureCollection> {
    try {
      const workspace = this.config.workspace ? `${this.config.workspace}:` : ""
      const fullTypeName = `${workspace}${typeName}`

      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeName: fullTypeName,
        outputFormat: options.outputFormat || "application/json",
        srsName: options.crs || "EPSG:4326",
      })

      if (options.maxFeatures) {
        params.set("count", options.maxFeatures.toString())
      }

      if (options.bbox) {
        params.set("bbox", `${options.bbox.join(",")},${options.crs || "EPSG:4326"}`)
      }

      if (options.propertyName && options.propertyName.length > 0) {
        params.set("propertyName", options.propertyName.join(","))
      }

      if (options.filter) {
        params.set("filter", options.filter)
      }

      const url = `${this.config.baseUrl.replace(/\/$/, "")}/wfs?${params.toString()}`
      console.log(`[WFSAdapter] Fetching features from: ${url}`)

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      if (!response.ok) {
        throw new Error(`WFS GetFeature request failed: ${response.status} ${response.statusText}`)
      }

      const geojson = await response.json()
      console.log(`[WFSAdapter] Retrieved ${geojson.features?.length || 0} features for ${typeName}`)

      return geojson
    } catch (error) {
      const wfsError = error as GeoServerError
      wfsError.service = "WFS"
      console.error(`[WFSAdapter] Failed to get features for ${typeName}:`, wfsError)
      throw wfsError
    }
  }

  /**
   * Get feature type information
   */
  async getFeatureType(typeName: string): Promise<WFSFeatureType | null> {
    try {
      const capabilities = await this.getCapabilities()
      const featureType = capabilities.featureTypes.find((ft) => ft.name.endsWith(typeName))

      if (!featureType) {
        console.warn(`[WFSAdapter] Feature type not found: ${typeName}`)
        return null
      }

      return featureType
    } catch (error) {
      console.error(`[WFSAdapter] Failed to get feature type info for ${typeName}:`, error)
      return null
    }
  }

  /**
   * Generate WFS source configuration for Mapbox
   */
  generateMapboxSource(typeName: string, options: Partial<WFSSourceConfig> = {}): WFSSourceConfig {
    const workspace = this.config.workspace ? `${this.config.workspace}:` : ""

    return {
      url: `${this.config.baseUrl.replace(/\/$/, "")}/wfs`,
      typeName: `${workspace}${typeName}`,
      version: options.version || "2.0.0",
      outputFormat: options.outputFormat || "application/json",
      maxFeatures: options.maxFeatures || 1000,
      crs: options.crs || "EPSG:4326",
      ...options,
    }
  }

  /**
   * Get features as GeoJSON for Mapbox
   */
  async getFeaturesForMapbox(
    typeName: string,
    options: {
      maxFeatures?: number
      bbox?: [number, number, number, number]
      filter?: string
    } = {},
  ): Promise<FeatureCollection> {
    return this.getFeatures(typeName, {
      ...options,
      outputFormat: "application/json",
      crs: "EPSG:4326",
    })
  }

  /**
   * Build capabilities URL
   */
  private buildCapabilitiesUrl(): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const params = new URLSearchParams({
      service: "WFS",
      version: "2.0.0",
      request: "GetCapabilities",
    })

    return `${baseUrl}/wfs?${params.toString()}`
  }

  /**
   * Parse WFS capabilities XML
   */
  private parseCapabilities(xmlText: string): WFSCapabilities {
    // Simplified parser - in production, use proper XML parsing
    const capabilities: WFSCapabilities = {
      version: "2.0.0",
      service: {
        name: "WFS",
        title: "GeoServer WFS",
        abstract: "A compliant implementation of WFS",
      },
      featureTypes: [],
      operations: ["GetCapabilities", "DescribeFeatureType", "GetFeature"],
    }

    // In a real implementation, you would parse the XML here
    // For demo purposes, we'll add some sample feature types
    if (xmlText.includes("FeatureType")) {
      capabilities.featureTypes.push({
        name: "sample_features",
        title: "Sample Features",
        abstract: "Sample feature type from GeoServer",
        defaultCRS: "EPSG:4326",
        otherCRS: ["EPSG:3857", "EPSG:2180"],
        bbox: {
          minx: -180,
          miny: -90,
          maxx: 180,
          maxy: 90,
          crs: "EPSG:4326",
        },
        outputFormats: ["application/json", "application/gml+xml"],
      })
    }

    return capabilities
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/xml",
      Accept: "application/json, application/xml",
    }

    if (this.config.username && this.config.password) {
      const auth = btoa(`${this.config.username}:${this.config.password}`)
      headers.Authorization = `Basic ${auth}`
    }

    return headers
  }

  /**
   * Test WFS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCapabilities()
      return true
    } catch {
      return false
    }
  }
}
