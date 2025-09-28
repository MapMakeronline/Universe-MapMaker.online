"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

export interface FixedMapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function FixedMap({ onMapLoad, onLayerToggle }: FixedMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    const initializeMap = async () => {
      try {
        console.log("🚀 Starting map initialization...")

        // Check token
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        console.log("🔑 Token check:", token ? "✅ Available" : "❌ Missing")

        if (!token) {
          throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required")
        }

        // Dynamic import Mapbox GL
        console.log("📦 Importing Mapbox GL...")
        const mapboxgl = await import("mapbox-gl")
        await import("mapbox-gl/dist/mapbox-gl.css")

        console.log("✅ Mapbox GL imported, version:", mapboxgl.default.version)

        // Set token
        mapboxgl.default.accessToken = token

        // Create map
        console.log("🗺️ Creating map instance...")
        const map = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [19.0, 52.0], // Poland
          zoom: 6
        })

        // Add controls
        map.addControl(new mapboxgl.default.NavigationControl(), "top-right")
        map.addControl(new mapboxgl.default.ScaleControl(), "bottom-left")

        // Wait for load
        map.on("load", () => {
          console.log("🎯 Map loaded successfully!")

          // Add sample data
          addSampleLayers(map)

          setIsLoading(false)
          setMapInstance(map)
          onMapLoad?.(map)
        })

        // Error handling
        map.on("error", (e: any) => {
          console.error("❌ Map error:", e.error)
          setError(`Map error: ${e.error?.message || "Unknown error"}`)
          setIsLoading(false)
        })

      } catch (err: any) {
        console.error("💥 Failed to initialize map:", err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up map")
        mapInstance.remove()
      }
    }
  }, [])

  const addSampleLayers = (map: any) => {
    try {
      console.log("🗂️ Adding sample layers...")

      // Add POI points
      map.addSource("poi-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [21.0122, 52.2297] },
              properties: { name: "Warszawa" }
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [19.9445, 50.0647] },
              properties: { name: "Kraków" }
            }
          ]
        }
      })

      map.addLayer({
        id: "poi-layer",
        type: "circle",
        source: "poi-source",
        paint: {
          "circle-radius": 8,
          "circle-color": "#4CAF50",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2
        },
        layout: { visibility: "none" } // Initially hidden
      })

      // Add roads
      map.addSource("roads-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [[21.0122, 52.2297], [19.9445, 50.0647], [17.0385, 51.1079]]
            },
            properties: { name: "Main Route" }
          }]
        }
      })

      map.addLayer({
        id: "roads-layer",
        type: "line",
        source: "roads-source",
        paint: {
          "line-color": "#2196F3",
          "line-width": 4
        }
      })

      // Add parcels
      map.addSource("parcels-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[21.0, 52.2], [21.05, 52.2], [21.05, 52.25], [21.0, 52.25], [21.0, 52.2]]]
            },
            properties: { name: "Sample Parcel" }
          }]
        }
      })

      map.addLayer({
        id: "parcels-layer",
        type: "fill",
        source: "parcels-source",
        paint: {
          "fill-color": "#FF9800",
          "fill-opacity": 0.6,
          "fill-outline-color": "#E65100"
        }
      })

      // Add buildings
      map.addSource("buildings-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[21.01, 52.23], [21.015, 52.23], [21.015, 52.235], [21.01, 52.235], [21.01, 52.23]]]
            },
            properties: { name: "Sample Building" }
          }]
        }
      })

      map.addLayer({
        id: "buildings-layer",
        type: "fill",
        source: "buildings-source",
        paint: {
          "fill-color": "#9C27B0",
          "fill-opacity": 0.7,
          "fill-outline-color": "#4A148C"
        },
        layout: { visibility: "none" } // Initially hidden
      })

      console.log("✅ Sample layers added successfully")

    } catch (err) {
      console.error("❌ Error adding layers:", err)
    }
  }

  // Expose toggle function
  useEffect(() => {
    if (mapInstance && onLayerToggle) {
      (mapInstance as any).toggleLayerVisibility = (layerId: string, visible: boolean) => {
        try {
          const visibility = visible ? "visible" : "none"
          mapInstance.setLayoutProperty(layerId, "visibility", visibility)
          console.log(`🔄 Layer ${layerId} set to ${visibility}`)
        } catch (error) {
          console.warn(`⚠️ Could not toggle layer ${layerId}:`, error)
        }
      }
    }
  }, [mapInstance, onLayerToggle])

  if (error) {
    return (
      <Box sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#ffebee",
        flexDirection: "column",
        p: 3
      }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          ❌ Błąd mapy Mapbox
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", mb: 2 }}>
          {error}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sprawdź console przeglądarki dla szczegółów
        </Typography>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        flexDirection: "column",
        gap: 2
      }}>
        <Box sx={{
          width: 50,
          height: 50,
          border: "4px solid #1976d2",
          borderTop: "4px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" }
          }
        }} />
        <Typography variant="body1" color="primary">
          🗺️ Ładowanie mapy...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%"
        }}
      />
    </Box>
  )
}