import type { Map } from "mapbox-gl"
import type { LayerConfig, SourceConfig, MapEventHandlers } from "./types"

/**
 * Map Runtime Manager
 * Handles map lifecycle, layers, sources, and events
 * Does not store map instance in Redux (as per requirements)
 */
export class MapRuntime {
  private map: Map
  private eventHandlers: MapEventHandlers = {}
  private loadedSources = new Set<string>()
  private loadedLayers = new Set<string>()

  constructor(map: Map) {
    this.map = map
    this.setupBaseEventListeners()
  }

  /**
   * Setup base event listeners for map lifecycle
   */
  private setupBaseEventListeners(): void {
    this.map.on("load", () => {
      console.log("[MapRuntime] Map loaded successfully")
      this.eventHandlers.onLoad?.()
    })

    this.map.on("error", (error) => {
      console.error("[MapRuntime] Map error:", error)
      this.eventHandlers.onError?.(error.error)
    })

    this.map.on("click", (event) => {
      this.eventHandlers.onClick?.(event)
    })

    this.map.on("move", (event) => {
      this.eventHandlers.onMove?.(event)
    })

    this.map.on("zoom", (event) => {
      this.eventHandlers.onZoom?.(event)
    })
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: MapEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  /**
   * Add source to map
   */
  addSource(config: SourceConfig): boolean {
    try {
      if (this.loadedSources.has(config.id)) {
        console.warn(`[MapRuntime] Source ${config.id} already exists`)
        return false
      }

      const sourceData: any = {
        type: config.type,
        ...config,
      }

      // Remove id from source data
      delete sourceData.id

      this.map.addSource(config.id, sourceData)
      this.loadedSources.add(config.id)

      console.log(`[MapRuntime] Added source: ${config.id}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to add source ${config.id}:`, error)
      return false
    }
  }

  /**
   * Remove source from map
   */
  removeSource(sourceId: string): boolean {
    try {
      if (!this.loadedSources.has(sourceId)) {
        console.warn(`[MapRuntime] Source ${sourceId} does not exist`)
        return false
      }

      // Remove all layers using this source first
      const layers = this.map.getStyle().layers || []
      layers.forEach((layer) => {
        if (layer.source === sourceId) {
          this.removeLayer(layer.id)
        }
      })

      this.map.removeSource(sourceId)
      this.loadedSources.delete(sourceId)

      console.log(`[MapRuntime] Removed source: ${sourceId}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to remove source ${sourceId}:`, error)
      return false
    }
  }

  /**
   * Add layer to map
   */
  addLayer(config: LayerConfig, beforeId?: string): boolean {
    try {
      if (this.loadedLayers.has(config.id)) {
        console.warn(`[MapRuntime] Layer ${config.id} already exists`)
        return false
      }

      const layerData: any = {
        id: config.id,
        type: config.type,
        source: config.source,
        "source-layer": config["source-layer"],
        layout: config.layout || {},
        paint: config.paint || {},
        filter: config.filter,
        minzoom: config.minzoom,
        maxzoom: config.maxzoom,
      }

      // Clean undefined values
      Object.keys(layerData).forEach((key) => {
        if (layerData[key] === undefined) {
          delete layerData[key]
        }
      })

      this.map.addLayer(layerData, beforeId)
      this.loadedLayers.add(config.id)

      console.log(`[MapRuntime] Added layer: ${config.id}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to add layer ${config.id}:`, error)
      return false
    }
  }

  /**
   * Remove layer from map
   */
  removeLayer(layerId: string): boolean {
    try {
      if (!this.loadedLayers.has(layerId)) {
        console.warn(`[MapRuntime] Layer ${layerId} does not exist`)
        return false
      }

      this.map.removeLayer(layerId)
      this.loadedLayers.delete(layerId)

      console.log(`[MapRuntime] Removed layer: ${layerId}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to remove layer ${layerId}:`, error)
      return false
    }
  }

  /**
   * Update layer paint properties
   */
  updateLayerPaint(layerId: string, paint: any): boolean {
    try {
      if (!this.loadedLayers.has(layerId)) {
        console.warn(`[MapRuntime] Layer ${layerId} does not exist`)
        return false
      }

      Object.keys(paint).forEach((property) => {
        this.map.setPaintProperty(layerId, property, paint[property])
      })

      console.log(`[MapRuntime] Updated paint for layer: ${layerId}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to update paint for layer ${layerId}:`, error)
      return false
    }
  }

  /**
   * Update layer layout properties
   */
  updateLayerLayout(layerId: string, layout: any): boolean {
    try {
      if (!this.loadedLayers.has(layerId)) {
        console.warn(`[MapRuntime] Layer ${layerId} does not exist`)
        return false
      }

      Object.keys(layout).forEach((property) => {
        this.map.setLayoutProperty(layerId, property, layout[property])
      })

      console.log(`[MapRuntime] Updated layout for layer: ${layerId}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to update layout for layer ${layerId}:`, error)
      return false
    }
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layerId: string, visible: boolean): boolean {
    try {
      if (!this.loadedLayers.has(layerId)) {
        console.warn(`[MapRuntime] Layer ${layerId} does not exist`)
        return false
      }

      this.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
      console.log(`[MapRuntime] Set layer ${layerId} visibility: ${visible}`)
      return true
    } catch (error) {
      console.error(`[MapRuntime] Failed to set visibility for layer ${layerId}:`, error)
      return false
    }
  }

  /**
   * Fit map to bounds
   */
  fitBounds(bounds: [[number, number], [number, number]], options?: any): void {
    try {
      this.map.fitBounds(bounds, {
        padding: 20,
        maxZoom: 16,
        ...options,
      })
    } catch (error) {
      console.error("[MapRuntime] Failed to fit bounds:", error)
    }
  }

  /**
   * Fly to location
   */
  flyTo(center: [number, number], zoom?: number, options?: any): void {
    try {
      this.map.flyTo({
        center,
        zoom: zoom || this.map.getZoom(),
        speed: 1.2,
        curve: 1.42,
        ...options,
      })
    } catch (error) {
      console.error("[MapRuntime] Failed to fly to location:", error)
    }
  }

  /**
   * Get current map state
   */
  getMapState() {
    return {
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      bounds: this.map.getBounds(),
    }
  }

  /**
   * Query rendered features
   */
  queryRenderedFeatures(point?: [number, number], options?: any) {
    try {
      return this.map.queryRenderedFeatures(point, options)
    } catch (error) {
      console.error("[MapRuntime] Failed to query features:", error)
      return []
    }
  }

  /**
   * Get loaded sources
   */
  getLoadedSources(): string[] {
    return Array.from(this.loadedSources)
  }

  /**
   * Get loaded layers
   */
  getLoadedLayers(): string[] {
    return Array.from(this.loadedLayers)
  }

  /**
   * Cleanup runtime
   */
  destroy(): void {
    try {
      // Remove all custom layers and sources
      this.loadedLayers.forEach((layerId) => {
        this.removeLayer(layerId)
      })

      this.loadedSources.forEach((sourceId) => {
        this.removeSource(sourceId)
      })

      // Clear sets
      this.loadedLayers.clear()
      this.loadedSources.clear()

      console.log("[MapRuntime] Runtime destroyed")
    } catch (error) {
      console.error("[MapRuntime] Error during cleanup:", error)
    }
  }
}
