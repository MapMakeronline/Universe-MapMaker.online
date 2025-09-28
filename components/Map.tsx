"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

// Dynamic map initialization
const initializeMapWithLayers = async (container: HTMLDivElement) => {
  try {
    // Check token
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    console.log("🔑 Map token check:", token ? "✅ Available" : "❌ Missing")

    if (!token) {
      throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required")
    }

    // Dynamic import
    const mapboxgl = await import("mapbox-gl")
    await import("mapbox-gl/dist/mapbox-gl.css")

    console.log("📦 Mapbox GL version:", mapboxgl.default.version)

    // Set token
    mapboxgl.default.accessToken = token

    // Create map
    const map = new mapboxgl.default.Map({
      container: container,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [19.0, 52.0], // Poland center
      zoom: 6
    })

    console.log("🗺️ Map created, waiting for load...")

    return { map, mapboxgl: mapboxgl.default }
  } catch (error) {
    console.error("❌ Map initialization failed:", error)
    throw error
  }
}

export interface MapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function Map({ onMapLoad, onLayerToggle }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    console.log("🚀 Initializing map with layers...")

    initializeMapWithLayers(mapContainer.current)
      .then(({ map, mapboxgl }) => {
        console.log("✅ Map instance created")

        // Wait for map to load
        map.on("load", () => {
          console.log("🎯 Map loaded, adding sample layers...")
          addSampleLayers(map, mapboxgl)
          setIsLoading(false)
          onMapLoad?.(map)
        })

        // Error handling
        map.on("error", (e: any) => {
          console.error("❌ Map error:", e.error)
          setError(`Map error: ${e.error?.message || "Unknown error"}`)
          setIsLoading(false)
        })

        setMapInstance(map)
      })
      .catch((err) => {
        console.error("💥 Failed to initialize map:", err)
        setError(err.message)
        setIsLoading(false)
      })

    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up map")
        mapInstance.remove()
      }
    }
  }, [])

  const addSampleLayers = (map: any, mapboxgl: any) => {
    try {
      console.log("🔧 Adding navigation controls...")

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right")

      // Add scale control
      map.addControl(new mapboxgl.ScaleControl(), "bottom-left")

      console.log("🗂️ Adding sample layers...")

      // Add sample point layer (POI)
    // Add sample point layer
    mapInstance.addSource("poi-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [21.0122, 52.2297] // Warsaw
            },
            properties: {
              name: "Warszawa"
            }
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [19.9445, 50.0647] // Krakow
            },
            properties: {
              name: "Kraków"
            }
          }
        ]
      }
    })

    mapInstance.addLayer({
      id: "poi-layer",
      type: "circle",
      source: "poi-source",
      paint: {
        "circle-radius": 8,
        "circle-color": "#4CAF50",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2
      }
    })

    // Add sample line layer (roads)
    mapInstance.addSource("roads-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [21.0122, 52.2297], // Warsaw
                [19.9445, 50.0647], // Krakow
                [17.0385, 51.1079]  // Wroclaw
              ]
            },
            properties: {
              name: "Main Route"
            }
          }
        ]
      }
    })

    mapInstance.addLayer({
      id: "roads-layer",
      type: "line",
      source: "roads-source",
      paint: {
        "line-color": "#2196F3",
        "line-width": 4
      }
    })

    // Add sample polygon layer (parcels)
    mapInstance.addSource("parcels-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [21.0, 52.2],
                [21.05, 52.2],
                [21.05, 52.25],
                [21.0, 52.25],
                [21.0, 52.2]
              ]]
            },
            properties: {
              name: "Sample Parcel"
            }
          }
        ]
      }
    })

    mapInstance.addLayer({
      id: "parcels-layer",
      type: "fill",
      source: "parcels-source",
      paint: {
        "fill-color": "#FF9800",
        "fill-opacity": 0.6,
        "fill-outline-color": "#E65100"
      }
    })

    // Add building layer (initially hidden)
    mapInstance.addSource("buildings-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [21.01, 52.23],
                [21.015, 52.23],
                [21.015, 52.235],
                [21.01, 52.235],
                [21.01, 52.23]
              ]]
            },
            properties: {
              name: "Sample Building"
            }
          }
        ]
      }
    })

    mapInstance.addLayer({
      id: "buildings-layer",
      type: "fill",
      source: "buildings-source",
      paint: {
        "fill-color": "#9C27B0",
        "fill-opacity": 0.7,
        "fill-outline-color": "#4A148C"
      },
      layout: {
        visibility: "none" // Initially hidden
      }
    })

    // Add base map style layers (placeholder layers for switching styles)
    // These will be handled by switching the entire map style
    // Streets layer - this is the default style, so it's always visible
    // We create placeholder layers for UI control only

    // For satellite and terrain, we'll switch the entire map style
    // but we need placeholder layers for the LayerTree to reference

    // Set initial visibility for layers
    mapInstance.setLayoutProperty("buildings-layer", "visibility", "none")
    mapInstance.setLayoutProperty("poi-layer", "visibility", "none")
  }

  // Method to toggle layer visibility
  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map.current) return

    // Handle base map styles separately
    if (layerId === "streets-layer") {
      if (visible) {
        map.current.setStyle("mapbox://styles/mapbox/streets-v12")
        // Re-add data layers after style change
        map.current.once("styledata", () => {
          addSampleLayers(map.current!)
        })
      }
      onLayerToggle?.(layerId, visible)
      return
    }

    if (layerId === "satellite-layer") {
      if (visible) {
        map.current.setStyle("mapbox://styles/mapbox/satellite-v9")
        // Re-add data layers after style change
        map.current.once("styledata", () => {
          addSampleLayers(map.current!)
        })
      }
      onLayerToggle?.(layerId, visible)
      return
    }

    if (layerId === "terrain-layer") {
      if (visible) {
        map.current.setStyle("mapbox://styles/mapbox/outdoors-v12")
        // Re-add data layers after style change
        map.current.once("styledata", () => {
          addSampleLayers(map.current!)
        })
      }
      onLayerToggle?.(layerId, visible)
      return
    }

    // Handle regular data layers
    try {
      const visibility = visible ? "visible" : "none"
      map.current.setLayoutProperty(layerId, "visibility", visibility)
      onLayerToggle?.(layerId, visible)
    } catch (error) {
      console.warn(`Could not toggle layer ${layerId}:`, error)
    }
  }

  // Expose the toggle method via ref
  useEffect(() => {
    if (map.current && onLayerToggle) {
      // Store the toggle function on the map instance for external access
      ;(map.current as any).toggleLayerVisibility = toggleLayerVisibility
    }
  }, [onLayerToggle])

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        position: "relative"
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}
        >
          Ładowanie mapy...
        </div>
      )}
    </div>
  )
}