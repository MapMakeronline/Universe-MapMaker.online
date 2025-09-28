"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

export interface ProductionMapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function ProductionMap({ onMapLoad, onLayerToggle }: ProductionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Inicjalizacja mapy...")
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    const initializeMap = async () => {
      try {
        // Try Mapbox first in production
        await initializeMapbox()
      } catch (mapboxError) {
        console.warn("🔄 Mapbox failed, falling back to OpenStreetMap:", mapboxError)
        setStatus("🔄 Przełączanie na OpenStreetMap...")
        await initializeLeaflet()
      }
    }

    const initializeMapbox = async () => {
      setStatus("🔍 Sprawdzanie tokena Mapbox...")
      console.log("🗺️ Attempting Mapbox GL JS initialization...")

      // Check token
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      console.log("🔑 Token check:")
      console.log("  - Exists:", !!token)
      console.log("  - Length:", token?.length || 0)
      console.log("  - Valid format:", token?.startsWith('pk.'))

      if (!token || !token.startsWith('pk.')) {
        throw new Error("Missing or invalid Mapbox token - falling back to OpenStreetMap")
      }

      setStatus("📦 Ładowanie Mapbox GL JS...")

      // Dynamic import with timeout
      const mapboxgl = await Promise.race([
        import("mapbox-gl"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Mapbox import timeout")), 10000)
        )
      ]) as any

      console.log("✅ Mapbox GL imported:")
      console.log("  - Version:", mapboxgl.default.version)
      console.log("  - Supported:", mapboxgl.default.supported())

      if (!mapboxgl.default.supported()) {
        throw new Error("Browser doesn't support Mapbox GL - using fallback")
      }

      setStatus("🗝️ Łączenie z Mapbox...")
      mapboxgl.default.accessToken = token

      setStatus("🗺️ Tworzenie mapy Mapbox...")

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [19.0, 52.0], // Poland
        zoom: 6,
        attributionControl: true
      })

      // Set timeout for map load
      const loadTimeout = setTimeout(() => {
        throw new Error("Mapbox load timeout - using fallback")
      }, 15000)

      map.on('load', () => {
        clearTimeout(loadTimeout)
        console.log("🎯 Mapbox map loaded successfully!")
        setStatus("✅ Mapbox GL JS aktywny")
        setIsLoading(false)
        setUsingFallback(false)

        // Add sample layers
        addMapboxLayers(map, mapboxgl.default)

        const mapWrapper = createMapboxWrapper(map, mapboxgl.default)
        setMapInstance(mapWrapper)
        onMapLoad?.(mapWrapper)
      })

      map.on('error', (e: any) => {
        clearTimeout(loadTimeout)
        console.error("❌ Mapbox error:", e)
        throw new Error(`Mapbox error: ${e.error?.message || e.message}`)
      })

      map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')
    }

    const initializeLeaflet = async () => {
      try {
        setStatus("📦 Ładowanie OpenStreetMap...")
        setUsingFallback(true)

        // Dynamic import Leaflet
        const L = await import("leaflet")
        await import("leaflet/dist/leaflet.css")

        console.log("✅ Leaflet imported successfully")
        setStatus("🗺️ Tworzenie mapy OpenStreetMap...")

        // Create Leaflet map
        const map = L.default.map(mapContainer.current!, {
          center: [52.0, 19.0], // Poland
          zoom: 6,
          zoomControl: true
        })

        // Add OpenStreetMap tiles
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add sample markers
        const warszawa = L.default.marker([52.2297, 21.0122])
          .addTo(map)
          .bindPopup('<b>🏆 Warszawa</b><br>OpenStreetMap działa!')

        const krakow = L.default.marker([50.0647, 19.9445])
          .addTo(map)
          .bindPopup('<b>🏰 Kraków</b><br>Fallback aktywny!')

        console.log("🎯 OpenStreetMap loaded successfully!")
        setStatus("✅ OpenStreetMap aktywny (fallback)")
        setIsLoading(false)

        const mapWrapper = createLeafletWrapper(map, L.default)
        setMapInstance(mapWrapper)
        onMapLoad?.(mapWrapper)

      } catch (leafletError) {
        console.error("💥 OpenStreetMap fallback failed:", leafletError)
        setError(`Wszystkie mapy niedostępne: ${leafletError}`)
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (mapInstance && mapInstance.remove) {
        console.log("🧹 Cleaning up map")
        mapInstance.remove()
      }
    }
  }, [])

  const addMapboxLayers = (map: any, mapboxgl: any) => {
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
    },
    mapType: 'mapbox'
  })

  const createLeafletWrapper = (map: any, L: any) => ({
    ...map,
    toggleLayerVisibility: (layerId: string, visible: boolean) => {
      console.log(`🔄 Toggle Leaflet layer ${layerId}: ${visible}`)
      // Leaflet layer management would go here
    },
    mapType: 'leaflet'
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
          {usingFallback ? "🗺️ OpenStreetMap" : "🗺️ Mapbox GL JS"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
          {status}
        </Typography>
        {usingFallback && (
          <Typography variant="caption" sx={{ color: "#ff9800", fontWeight: "bold" }}>
            ⚠️ Używamy fallback OpenStreetMap
          </Typography>
        )}
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