"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

export interface LeafletMapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function LeafletMap({ onMapLoad, onLayerToggle }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    const initializeLeafletMap = async () => {
      try {
        console.log("🗺️ Initializing Leaflet map...")

        // Import Leaflet
        const L = await import("leaflet")
        await import("leaflet/dist/leaflet.css")

        console.log("✅ Leaflet imported, version:", L.default.version)

        // Fix for default markers
        delete (L.default.Icon.Default.prototype as any)._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create Leaflet map
        const map = L.default.map(mapContainer.current!, {
          center: [52.0, 19.0], // Poland
          zoom: 6,
          zoomControl: true,
          attributionControl: true
        })

        // Add OpenStreetMap tiles
        const osmLayer = L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add sample layers
        addSampleLayers(map, L.default)

        console.log("🎯 Leaflet map loaded successfully!")

        // Immediately update state - no loading delay
        setIsLoading(false)
        setMapInstance(map)

        // Create compatibility wrapper
        const mapWrapper = {
          ...map,
          toggleLayerVisibility: (layerId: string, visible: boolean) => {
            console.log(`🔄 Toggle layer ${layerId}: ${visible}`)
            const sampleLayers = (map as any)._sampleLayers
            if (sampleLayers && sampleLayers[layerId]) {
              const layer = sampleLayers[layerId]
              if (Array.isArray(layer)) {
                // Handle array of markers (POI)
                layer.forEach(marker => {
                  if (visible) {
                    marker.addTo(map)
                  } else {
                    map.removeLayer(marker)
                  }
                })
              } else if (layer) {
                // Handle single layer
                if (visible) {
                  layer.addTo(map)
                } else {
                  map.removeLayer(layer)
                }
              }
            }
          },
          setLayoutProperty: (layerId: string, property: string, value: any) => {
            console.log(`🎨 Set property ${property} = ${value} on layer ${layerId}`)
            // Basic implementation for Mapbox compatibility
          },
          addSource: () => {},
          addLayer: () => {}
        }

        onMapLoad?.(mapWrapper)

      } catch (err: any) {
        console.error("💥 Failed to initialize Leaflet map:", err)
        setError(`Failed to load map: ${err.message}`)
        setIsLoading(false)
      }
    }

    // Start immediately without delay
    initializeLeafletMap()

    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up Leaflet map")
        mapInstance.remove()
      }
    }
  }, [])

  const addSampleLayers = (map: any, L: any) => {
    try {
      console.log("🗂️ Adding sample layers to Leaflet map...")

      // Add sample markers (POI)
      const warszawaMarker = L.marker([52.2297, 21.0122])
        .bindPopup('Warszawa - Stolica Polski')

      const krakowMarker = L.marker([50.0647, 19.9445])
        .bindPopup('Kraków - Miasto Królów')

      // Add sample polygon (parcel)
      const sampleParcel = L.polygon([
        [52.2, 21.0],
        [52.25, 21.0],
        [52.25, 21.05],
        [52.2, 21.05]
      ], {
        color: '#FF9800',
        fillColor: '#FF9800',
        fillOpacity: 0.6
      }).bindPopup('Przykładowa działka ewidencyjna')

      // Add sample polyline (road)
      const sampleRoad = L.polyline([
        [52.2297, 21.0122],
        [50.0647, 19.9445],
        [51.1079, 17.0385]
      ], {
        color: '#2196F3',
        weight: 4
      }).bindPopup('Przykładowa droga krajowa')

      // Store references for layer control
      ;(map as any)._sampleLayers = {
        'poi-layer': [warszawaMarker, krakowMarker],
        'parcels-layer': sampleParcel,
        'roads-layer': sampleRoad,
        'buildings-layer': null
      }

      // Add visible layers by default
      sampleParcel.addTo(map)
      sampleRoad.addTo(map)

      console.log("✅ Sample layers added successfully")

    } catch (err) {
      console.error("❌ Error adding layers:", err)
    }
  }

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
          border: "5px solid #4CAF50",
          borderTop: "5px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" }
          }
        }} />
        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", color: "#4CAF50" }}>
          🗺️ Ładowanie OpenStreetMap...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
          Inicjalizacja Leaflet • Pobieranie kafelków OpenStreetMap • Dodawanie warstw
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