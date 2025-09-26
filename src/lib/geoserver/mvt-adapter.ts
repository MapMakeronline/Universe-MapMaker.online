import type { GeoServerConfig, MVTTilesetInfo, MVTSourceConfig, GeoServerError } from "./types"

/**
 * GeoServer MVT (Mapbox Vector Tiles) Adapter
 * Handles MVT service interactions and vector tile configuration
 */
export class MVTAdapter {
  private config: GeoServerConfig

  constructor(config: GeoServerConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    }
  }

  /**
   * Get MVT tileset information
   */
  async getTilesetInfo(layerName: string): Promise<MVTTilesetInfo> {
    try {
      const workspace = this.config.workspace ? `${this.config.workspace}:` : ""
      const fullLayerName = `${workspace}${layerName}`
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/gwc/service/tms/1.0.0/${fullLayerName}@EPSG%3A3857@pbf/{z}/{x}/{-y}.pbf`

      console.log(`[MVTAdapter] Getting tileset info for: ${fullLayerName}`)

      // For MVT, we typically construct the tileset info based on known parameters
      // In a real implementation, you might query GeoWebCache or GeoServer REST API
      const tilesetInfo: MVTTilesetInfo = {
        name: fullLayerName,
        description: `Vector tiles for ${layerName}`,
        version: "1.0.0",
        scheme: "xyz",
        tiles: [url],
        minzoom: 0,
        maxzoom: 18,
        bounds: [-180, -85.0511, 180, 85.0511], // Web Mercator bounds
        center: [0, 0, 2],
        vector_layers: [
          {
            id: layerName,
            description: `Vector layer for ${layerName}`,
            minzoom: 0,
            maxzoom: 18,
            fields: {}, // Would be populated from actual layer schema
          },
        ],
      }

      console.log(`[MVTAdapter] Generated tileset info for ${layerName}`)
      return tilesetInfo
    } catch (error) {
      const mvtError = error as GeoServerError
      mvtError.service = "MVT"
      console.error(`[MVTAdapter] Failed to get tileset info for ${layerName}:`, mvtError)
      throw mvtError
    }
  }

  /**
   * Generate MVT source configuration for Mapbox
   */
  generateMapboxSource(layerName: string, options: Partial<MVTSourceConfig> = {}): MVTSourceConfig {
    const workspace = this.config.workspace ? `${this.config.workspace}:` : ""
    const fullLayerName = `${workspace}${layerName}`

    // GeoServer MVT URL pattern through GeoWebCache
    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const tileUrl = `${baseUrl}/gwc/service/tms/1.0.0/${fullLayerName}@EPSG%3A3857@pbf/{z}/{x}/{-y}.pbf`

    return {
      url: tileUrl,
      minzoom: options.minzoom || 0,
      maxzoom: options.maxzoom || 18,
      scheme: options.scheme || "xyz",
      ...options,
    }
  }

  /**
   * Generate tile URL template with authentication
   */
  generateTileUrl(layerName: string, options: Partial<MVTSourceConfig> = {}): string {
    const sourceConfig = this.generateMapboxSource(layerName, options)
    let url = sourceConfig.url

    // Add authentication parameters if needed
    if (this.config.username && this.config.password) {
      const authParams = new URLSearchParams({
        username: this.config.username,
        password: this.config.password,
      })
      url += `?${authParams.toString()}`
    }

    return url
  }

  /**
   * Get layer schema information
   */
  async getLayerSchema(layerName: string): Promise<Record<string, string>> {
    try {
      const workspace = this.config.workspace ? `${this.config.workspace}:` : ""
      const fullLayerName = `${workspace}${layerName}`

      // In a real implementation, you would query the GeoServer REST API
      // for layer schema information
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/rest/layers/${fullLayerName}.json`

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      if (!response.ok) {
        console.warn(`[MVTAdapter] Could not get schema for ${layerName}: ${response.status}`)
        return {}
      }

      const layerInfo = await response.json()

      // Extract field information from layer metadata
      // This is a simplified approach - actual implementation would vary
      const schema: Record<string, string> = {}

      // Mock schema for demo purposes
      schema.id = "string"
      schema.name = "string"
      schema.type = "string"
      schema.area = "number"

      console.log(`[MVTAdapter] Retrieved schema for ${layerName}`)
      return schema
    } catch (error) {
      console.error(`[MVTAdapter] Failed to get schema for ${layerName}:`, error)
      return {}
    }
  }

  /**
   * Test MVT tile availability
   */
  async testTileAvailability(layerName: string, z = 0, x = 0, y = 0): Promise<boolean> {
    try {
      const sourceConfig = this.generateMapboxSource(layerName)
      const tileUrl = sourceConfig.url
        .replace("{z}", z.toString())
        .replace("{x}", x.toString())
        .replace("{-y}", (-y).toString())
        .replace("{y}", y.toString())

      const response = await fetch(tileUrl, {
        method: "HEAD",
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      const isAvailable = response.ok
      console.log(`[MVTAdapter] Tile availability for ${layerName} at ${z}/${x}/${y}: ${isAvailable}`)
      return isAvailable
    } catch (error) {
      console.error(`[MVTAdapter] Failed to test tile availability for ${layerName}:`, error)
      return false
    }
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (this.config.username && this.config.password) {
      const auth = btoa(`${this.config.username}:${this.config.password}`)
      headers.Authorization = `Basic ${auth}`
    }

    return headers
  }

  /**
   * Test MVT connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test by trying to access GeoWebCache capabilities
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/gwc/service/wmts?REQUEST=GetCapabilities`
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      })

      return response.ok
    } catch {
      return false
    }
  }
}
