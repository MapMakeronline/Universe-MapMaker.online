import type { GeoServerConfig, WMSCapabilities, WMSLayer, WMSSourceConfig, GeoServerError } from "./types"

/**
 * GeoServer WMS Adapter
 * Handles WMS service interactions and capabilities parsing
 */
export class WMSAdapter {
  private config: GeoServerConfig

  constructor(config: GeoServerConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    }
  }

  /**
   * Get WMS capabilities
   */
  async getCapabilities(): Promise<WMSCapabilities> {
    try {
      const url = this.buildCapabilitiesUrl()
      console.log(`[WMSAdapter] Fetching capabilities from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      if (!response.ok) {
        throw new Error(`WMS capabilities request failed: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()
      const capabilities = this.parseCapabilities(xmlText)

      console.log(`[WMSAdapter] Retrieved ${capabilities.layers.length} layers`)
      return capabilities
    } catch (error) {
      const wmsError = error as GeoServerError
      wmsError.service = "WMS"
      console.error("[WMSAdapter] Failed to get capabilities:", wmsError)
      throw wmsError
    }
  }

  /**
   * Get layer information
   */
  async getLayerInfo(layerName: string): Promise<WMSLayer | null> {
    try {
      const capabilities = await this.getCapabilities()
      const layer = capabilities.layers.find((l) => l.name === layerName)

      if (!layer) {
        console.warn(`[WMSAdapter] Layer not found: ${layerName}`)
        return null
      }

      return layer
    } catch (error) {
      console.error(`[WMSAdapter] Failed to get layer info for ${layerName}:`, error)
      return null
    }
  }

  /**
   * Generate WMS source configuration for Mapbox
   */
  generateMapboxSource(layerName: string, options: Partial<WMSSourceConfig> = {}): WMSSourceConfig {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const workspace = this.config.workspace ? `${this.config.workspace}:` : ""

    return {
      url: `${baseUrl}/wms`,
      layers: `${workspace}${layerName}`,
      styles: options.styles || "",
      format: options.format || "image/png",
      transparent: options.transparent !== false,
      version: options.version || "1.3.0",
      crs: options.crs || "EPSG:3857",
      tileSize: options.tileSize || 256,
      ...options,
    }
  }

  /**
   * Generate WMS tile URL template
   */
  generateTileUrl(layerName: string, options: Partial<WMSSourceConfig> = {}): string {
    const sourceConfig = this.generateMapboxSource(layerName, options)
    const params = new URLSearchParams({
      service: "WMS",
      version: sourceConfig.version!,
      request: "GetMap",
      layers: sourceConfig.layers,
      styles: sourceConfig.styles!,
      format: sourceConfig.format!,
      transparent: sourceConfig.transparent!.toString(),
      crs: sourceConfig.crs!,
      width: sourceConfig.tileSize!.toString(),
      height: sourceConfig.tileSize!.toString(),
      bbox: "{bbox-epsg-3857}",
    })

    return `${sourceConfig.url}?${params.toString()}`
  }

  /**
   * Get feature info at point
   */
  async getFeatureInfo(
    layerName: string,
    bbox: [number, number, number, number],
    width: number,
    height: number,
    x: number,
    y: number,
    options: Partial<WMSSourceConfig> = {},
  ): Promise<any> {
    try {
      const sourceConfig = this.generateMapboxSource(layerName, options)
      const params = new URLSearchParams({
        service: "WMS",
        version: sourceConfig.version!,
        request: "GetFeatureInfo",
        layers: sourceConfig.layers,
        query_layers: sourceConfig.layers,
        styles: sourceConfig.styles!,
        format: sourceConfig.format!,
        info_format: "application/json",
        crs: sourceConfig.crs!,
        width: width.toString(),
        height: height.toString(),
        bbox: bbox.join(","),
        x: x.toString(),
        y: y.toString(),
      })

      const url = `${sourceConfig.url}?${params.toString()}`
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      if (!response.ok) {
        throw new Error(`GetFeatureInfo request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[WMSAdapter] Retrieved feature info for ${layerName}`)
      return data
    } catch (error) {
      console.error(`[WMSAdapter] Failed to get feature info for ${layerName}:`, error)
      return null
    }
  }

  /**
   * Build capabilities URL
   */
  private buildCapabilitiesUrl(): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const params = new URLSearchParams({
      service: "WMS",
      version: "1.3.0",
      request: "GetCapabilities",
    })

    return `${baseUrl}/wms?${params.toString()}`
  }

  /**
   * Parse WMS capabilities XML
   */
  private parseCapabilities(xmlText: string): WMSCapabilities {
    // This is a simplified parser - in production, you'd use a proper XML parser
    // For now, we'll create a mock response with common structure
    const capabilities: WMSCapabilities = {
      version: "1.3.0",
      service: {
        name: "WMS",
        title: "GeoServer WMS",
        abstract: "A compliant implementation of WMS",
      },
      layers: [],
      formats: ["image/png", "image/jpeg", "image/gif"],
      crs: ["EPSG:4326", "EPSG:3857", "EPSG:2180"],
    }

    // In a real implementation, you would parse the XML here
    // For demo purposes, we'll add some sample layers
    if (xmlText.includes("Layer")) {
      capabilities.layers.push({
        name: "sample_layer",
        title: "Sample Layer",
        abstract: "Sample layer from GeoServer",
        crs: ["EPSG:4326", "EPSG:3857"],
        bbox: {
          minx: -180,
          miny: -90,
          maxx: 180,
          maxy: 90,
          crs: "EPSG:4326",
        },
        styles: [
          {
            name: "default",
            title: "Default Style",
          },
        ],
        queryable: true,
        opaque: false,
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
    }

    if (this.config.username && this.config.password) {
      const auth = btoa(`${this.config.username}:${this.config.password}`)
      headers.Authorization = `Basic ${auth}`
    }

    return headers
  }

  /**
   * Test WMS connection
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
