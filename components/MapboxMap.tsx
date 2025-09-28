"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

export interface MapboxMapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function MapboxMap({ onMapLoad, onLayerToggle }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Inicjalizacja...")

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    const initializeMapbox = async () => {
      try {
        setStatus("🔍 Sprawdzanie tokena Mapbox...")
        console.log("🗺️ Starting Mapbox GL JS initialization...")

        // Check token
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        console.log("🔑 Token check:")
        console.log("  - Exists:", !!token)
        console.log("  - Length:", token?.length || 0)
        console.log("  - Valid format:", token?.startsWith('pk.'))

        if (!token || !token.startsWith('pk.')) {
          throw new Error("Missing or invalid Mapbox token")
        }

        setStatus("📦 Ładowanie Mapbox GL JS...")

        // Dynamic import
        const mapboxgl = await import("mapbox-gl")

        console.log("✅ Mapbox GL imported:")
        console.log("  - Version:", mapboxgl.default.version)
        console.log("  - Supported:", mapboxgl.default.supported())

        if (!mapboxgl.default.supported()) {
          throw new Error("Browser doesn't support Mapbox GL")
        }

        setStatus("🗝️ Łączenie z Mapbox...")

        // Set access token
        mapboxgl.default.accessToken = token

        setStatus("🗺️ Tworzenie mapy Mapbox...")

        // Create map
        const map = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [19.0, 52.0], // Poland
          zoom: 6,
          attributionControl: true
        })

        // Success handler
        map.on('load', () => {
          console.log("🎯 Mapbox map loaded successfully!")
          setStatus("✅ Mapbox gotowy!")
          setIsLoading(false)

          // Add sample layers
          addMapboxLayers(map, mapboxgl.default)

          // Create wrapper
          const mapWrapper = createMapboxWrapper(map, mapboxgl.default)
          setMapInstance(mapWrapper)
          onMapLoad?.(mapWrapper)
        })

        // Error handler
        map.on('error', (e: any) => {
          console.error("❌ Mapbox error:", e)
          setError(`Mapbox error: ${e.error?.message || e.message}`)
          setIsLoading(false)
        })

        // Add controls
        map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

      } catch (err: any) {
        console.error("💥 Mapbox failed:", err)
        setError(`Mapbox initialization failed: ${err.message}`)
        setIsLoading(false)
      }
    }

    initializeMapbox()

    return () => {
      if (mapInstance && mapInstance.remove) {
        console.log("🧹 Cleaning up map")
        mapInstance.remove()
      }
    }
  }, [])

  const addMapboxLayers = (map: any, mapboxgl: any) => {
    // Add sample GeoJSON source and layers for Mapbox
    map.addSource('sample-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [21.0122, 52.2297] },
            properties: { name: 'Warszawa' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [19.9445, 50.0647] },
            properties: { name: 'Kraków' }
          }
        ]
      }
    })

    map.addLayer({
      id: 'poi-layer',
      type: 'circle',
      source: 'sample-points',
      paint: {
        'circle-radius': 8,
        'circle-color': '#4CAF50',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2
      },
      layout: { visibility: 'none' }
    })
  }


  const createMapboxWrapper = (map: any, mapboxgl: any) => ({
    ...map,
    toggleLayerVisibility: (layerId: string, visible: boolean) => {
      console.log(`🔄 Toggle Mapbox layer ${layerId}: ${visible}`)
      try {
        const visibility = visible ? 'visible' : 'none'
        map.setLayoutProperty(layerId, 'visibility', visibility)
      } catch (error) {
        console.warn(`Could not toggle Mapbox layer ${layerId}:`, error)
      }
    }
  })


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
          ❌ Błąd mapy
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
        gap: 2,
        p: 3
      }}>
        <Box sx={{
          width: 60,
          height: 60,
          border: "5px solid #1976d2",
          borderTop: "5px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" }
          }
        }} />
        <Typography variant="h6" sx={{
          color: "#1976d2",
          fontWeight: "bold"
        }}>
          🗺️ Mapbox GL JS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
          {status}
        </Typography>
      </Box>
    )
  }

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        position: "relative"
      }}
    />
  )
}