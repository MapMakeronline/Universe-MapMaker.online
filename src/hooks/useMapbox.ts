"use client"

import { useRef, useCallback, useEffect } from "react"
import type { MapRuntime } from "@/lib/mapbox/runtime"
import type { LayerConfig, SourceConfig } from "@/lib/mapbox/types"

/**
 * Custom hook for managing Mapbox map runtime
 * Provides methods for layer and source management
 */
export function useMapbox() {
  const runtimeRef = useRef<MapRuntime | null>(null)

  const setRuntime = useCallback((runtime: MapRuntime) => {
    runtimeRef.current = runtime
  }, [])

  const addSource = useCallback((config: SourceConfig) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.addSource(config)
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.removeSource(sourceId)
  }, [])

  const addLayer = useCallback((config: LayerConfig, beforeId?: string) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.addLayer(config, beforeId)
  }, [])

  const removeLayer = useCallback((layerId: string) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.removeLayer(layerId)
  }, [])

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.setLayerVisibility(layerId, visible)
  }, [])

  const updateLayerPaint = useCallback((layerId: string, paint: any) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.updateLayerPaint(layerId, paint)
  }, [])

  const updateLayerLayout = useCallback((layerId: string, layout: any) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return false
    }
    return runtimeRef.current.updateLayerLayout(layerId, layout)
  }, [])

  const fitBounds = useCallback((bounds: [[number, number], [number, number]], options?: any) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return
    }
    runtimeRef.current.fitBounds(bounds, options)
  }, [])

  const flyTo = useCallback((center: [number, number], zoom?: number, options?: any) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return
    }
    runtimeRef.current.flyTo(center, zoom, options)
  }, [])

  const getMapState = useCallback(() => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return null
    }
    return runtimeRef.current.getMapState()
  }, [])

  const queryRenderedFeatures = useCallback((point?: [number, number], options?: any) => {
    if (!runtimeRef.current) {
      console.warn("[useMapbox] Runtime not initialized")
      return []
    }
    return runtimeRef.current.queryRenderedFeatures(point, options)
  }, [])

  const getLoadedSources = useCallback(() => {
    if (!runtimeRef.current) {
      return []
    }
    return runtimeRef.current.getLoadedSources()
  }, [])

  const getLoadedLayers = useCallback(() => {
    if (!runtimeRef.current) {
      return []
    }
    return runtimeRef.current.getLoadedLayers()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (runtimeRef.current) {
        runtimeRef.current.destroy()
        runtimeRef.current = null
      }
    }
  }, [])

  return {
    setRuntime,
    addSource,
    removeSource,
    addLayer,
    removeLayer,
    setLayerVisibility,
    updateLayerPaint,
    updateLayerLayout,
    fitBounds,
    flyTo,
    getMapState,
    queryRenderedFeatures,
    getLoadedSources,
    getLoadedLayers,
    runtime: runtimeRef.current,
  }
}
