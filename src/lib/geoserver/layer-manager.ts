import { WMSAdapter } from "./wms-adapter"
import { WFSAdapter } from "./wfs-adapter"
import { MVTAdapter } from "./mvt-adapter"
import type { GeoServerConfig } from "./types"
import type { SourceConfig, LayerConfig } from "@/lib/mapbox/types"

/**
 * GeoServer Layer Manager
 * Orchestrates different GeoServer adapters and manages layer configurations
 */
export class GeoServerLayerManager {
  private wmsAdapter: WMSAdapter
  private wfsAdapter: WFSAdapter
  private mvtAdapter: MVTAdapter
  private config: GeoServerConfig

  constructor(config: GeoServerConfig) {
    this.config = config
    this.wmsAdapter = new WMSAdapter(config)
    this.wfsAdapter = new WFSAdapter(config)
    this.mvtAdapter = new MVTAdapter(config)
  }

  /**
   * Get available layers from all services
   */
  async getAvailableLayers(): Promise<{
    wms: string[]
    wfs: string[]
    mvt: string[]
  }> {
    try {
      const [wmsCapabilities, wfsCapabilities] = await Promise.allSettled([
        this.wmsAdapter.getCapabilities(),
        this.wfsAdapter.getCapabilities(),
      ])

      const wmsLayers = wmsCapabilities.status === "fulfilled" ? wmsCapabilities.value.layers.map((l) => l.name) : []

      const wfsLayers =
        wfsCapabilities.status === "fulfilled" ? wfsCapabilities.value.featureTypes.map((ft) => ft.name) : []

      // For MVT, we assume the same layers as WMS are available as vector tiles
      const mvtLayers = wmsLayers

      console.log(
        `[LayerManager] Available layers - WMS: ${wmsLayers.length}, WFS: ${wfsLayers.length}, MVT: ${mvtLayers.length}`,
      )

      return {
        wms: wmsLayers,
        wfs: wfsLayers,
        mvt: mvtLayers,
      }
    } catch (error) {
      console.error("[LayerManager] Failed to get available layers:", error)
      return { wms: [], wfs: [], mvt: [] }
    }
  }

  /**
   * Create Mapbox source configuration for a layer
   */
  async createMapboxSource(layerName: string, type: "wms" | "wfs" | "mvt", options: any = {}): Promise<SourceConfig> {
    try {
      switch (type) {
        case "wms": {
          const wmsConfig = this.wmsAdapter.generateMapboxSource(layerName, options)
          return {
            id: `${layerName}-wms`,
            type: "raster",
            tiles: [this.wmsAdapter.generateTileUrl(layerName, options)],
            tileSize: wmsConfig.tileSize || 256,
          }
        }

        case "wfs": {
          const geojson = await this.wfsAdapter.getFeaturesForMapbox(layerName, options)
          return {
            id: `${layerName}-wfs`,
            type: "geojson",
            data: geojson,
          }
        }

        case "mvt": {
          const mvtConfig = this.mvtAdapter.generateMapboxSource(layerName, options)
          return {
            id: `${layerName}-mvt`,
            type: "vector",
            tiles: [mvtConfig.url],
            minzoom: mvtConfig.minzoom,
            maxzoom: mvtConfig.maxzoom,
          }
        }

        default:
          throw new Error(`Unsupported layer type: ${type}`)
      }
    } catch (error) {
      console.error(`[LayerManager] Failed to create Mapbox source for ${layerName}:`, error)
      throw error
    }
  }

  /**
   * Create Mapbox layer configuration
   */
  createMapboxLayer(
    layerName: string,
    sourceId: string,
    type: "wms" | "wfs" | "mvt",
    options: {
      layerType?: "fill" | "line" | "symbol" | "circle" | "raster"
      paint?: any
      layout?: any
      filter?: any[]
    } = {},
  ): LayerConfig {
    const layerId = `${layerName}-${type}`

    // Determine layer type based on source type
    let layerType: LayerConfig["type"] = "raster"
    if (type === "wfs" || type === "mvt") {
      layerType = options.layerType || "fill"
    }

    const layerConfig: LayerConfig = {
      id: layerId,
      type: layerType,
      source: sourceId,
      layout: {
        visibility: "visible",
        ...options.layout,
      },
      paint: this.getDefaultPaint(layerType, options.paint),
      filter: options.filter,
    }

    // Add source-layer for MVT
    if (type === "mvt") {
      layerConfig["source-layer"] = layerName
    }

    return layerConfig
  }

  /**
   * Get layer information
   */
  async getLayerInfo(layerName: string, type: "wms" | "wfs" | "mvt") {
    try {
      switch (type) {
        case "wms":
          return await this.wmsAdapter.getLayerInfo(layerName)
        case "wfs":
          return await this.wfsAdapter.getFeatureType(layerName)
        case "mvt":
          return await this.mvtAdapter.getTilesetInfo(layerName)
        default:
          return null
      }
    } catch (error) {
      console.error(`[LayerManager] Failed to get layer info for ${layerName}:`, error)
      return null
    }
  }

  /**
   * Test connection to all services
   */
  async testConnections(): Promise<{
    wms: boolean
    wfs: boolean
    mvt: boolean
  }> {
    try {
      const [wmsTest, wfsTest, mvtTest] = await Promise.allSettled([
        this.wmsAdapter.testConnection(),
        this.wfsAdapter.testConnection(),
        this.mvtAdapter.testConnection(),
      ])

      const results = {
        wms: wmsTest.status === "fulfilled" && wmsTest.value,
        wfs: wfsTest.status === "fulfilled" && wfsTest.value,
        mvt: mvtTest.status === "fulfilled" && mvtTest.value,
      }

      console.log("[LayerManager] Connection test results:", results)
      return results
    } catch (error) {
      console.error("[LayerManager] Failed to test connections:", error)
      return { wms: false, wfs: false, mvt: false }
    }
  }

  /**
   * Get feature info for WMS layers
   */
  async getFeatureInfo(
    layerName: string,
    bbox: [number, number, number, number],
    width: number,
    height: number,
    x: number,
    y: number,
  ) {
    return this.wmsAdapter.getFeatureInfo(layerName, bbox, width, height, x, y)
  }

  /**
   * Get features for WFS layers
   */
  async getFeatures(layerName: string, options: any = {}) {
    return this.wfsAdapter.getFeatures(layerName, options)
  }

  /**
   * Get default paint properties for layer types
   */
  private getDefaultPaint(layerType: LayerConfig["type"], customPaint: any = {}): any {
    const defaultPaints = {
      fill: {
        "fill-color": "#3388ff",
        "fill-opacity": 0.6,
        "fill-outline-color": "#ffffff",
      },
      line: {
        "line-color": "#3388ff",
        "line-width": 2,
        "line-opacity": 0.8,
      },
      circle: {
        "circle-color": "#3388ff",
        "circle-radius": 5,
        "circle-opacity": 0.8,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
      symbol: {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
      raster: {
        "raster-opacity": 1,
      },
    }

    return {
      ...defaultPaints[layerType],
      ...customPaint,
    }
  }

  /**
   * Get adapters for direct access
   */
  getAdapters() {
    return {
      wms: this.wmsAdapter,
      wfs: this.wfsAdapter,
      mvt: this.mvtAdapter,
    }
  }
}
