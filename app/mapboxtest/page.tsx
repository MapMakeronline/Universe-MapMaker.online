"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography, Paper, IconButton, Container } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LayersIcon from "@mui/icons-material/Layers"
import { useRouter } from "next/navigation"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

// Map layers configuration (same as MapApplication)
const mapLayers: LayerNode[] = [
  {
    id: "base-layers",
    name: "🗺️ Mapy bazowe",
    visible: true,
    type: "group",
    children: [
      {
        id: "streets",
        name: "Ulice",
        visible: true,
        type: "raster",
        layerIds: ["streets-layer"],
      },
      {
        id: "satellite",
        name: "Satelita",
        visible: false,
        type: "raster",
        layerIds: ["satellite-layer"],
      }
    ],
  },
  {
    id: "data-layers",
    name: "📊 Warstwy danych",
    visible: true,
    type: "group",
    children: [
      {
        id: "poi",
        name: "Punkty POI",
        visible: false,
        type: "point",
        layerIds: ["poi-layer"],
      }
    ],
  },
]

export default function MapboxTestPage() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Rozpoczynanie testu...")
  const [isLayerTreeVisible, setIsLayerTreeVisible] = useState(true)
  const [layersState, setLayersState] = useState(mapLayers)
  const [mapLoaded, setMapLoaded] = useState(false)

  const handleLayerVisibilityToggle = (node: LayerNode, visible: boolean) => {
    console.log(`🔄 Toggling layer "${node.name}" to ${visible ? "visible" : "hidden"}`)

    // Toggle actual map layers if they exist
    if (node.layerIds && mapRef.current) {
      node.layerIds.forEach(layerId => {
        try {
          const visibility = visible ? "visible" : "none"
          mapRef.current.setLayoutProperty(layerId, "visibility", visibility)
          console.log(`✅ Toggled layer ${layerId} to ${visible ? "visible" : "hidden"}`)
        } catch (error) {
          console.warn(`⚠️ Could not toggle layer ${layerId}:`, error)
        }
      })
    }

    // Update local state
    const updateLayerVisibility = (layers: LayerNode[]): LayerNode[] => {
      return layers.map(layer => {
        if (layer.id === node.id) {
          return { ...layer, visible }
        }
        if (layer.children) {
          return { ...layer, children: updateLayerVisibility(layer.children) }
        }
        return layer
      })
    }

    setLayersState(updateLayerVisibility(layersState))
  }

  useEffect(() => {
    if (!mapContainer.current) return

    const initializeMapbox = async () => {
      try {
        setStatus("🔍 Sprawdzanie tokena...")
        console.log("🔍 Starting Mapbox GL JS test...")

        // Check token first
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        console.log("🔑 Token check:")
        console.log("  - Exists:", !!token)
        console.log("  - Length:", token?.length || 0)
        console.log("  - First 20 chars:", token?.substring(0, 20))

        if (!token) {
          throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing")
        }

        setStatus("📦 Importowanie Mapbox GL JS...")
        console.log("📦 Importing Mapbox GL JS...")

        // Dynamic import
        const mapboxgl = await import("mapbox-gl")

        console.log("✅ Mapbox GL imported:")
        console.log("  - Version:", mapboxgl.default.version)
        console.log("  - Supported:", mapboxgl.default.supported())

        if (!mapboxgl.default.supported()) {
          throw new Error("Browser does not support Mapbox GL JS")
        }

        setStatus("🗝️ Ustawianie tokena...")

        // Set access token
        mapboxgl.default.accessToken = token

        setStatus("🗺️ Tworzenie mapy...")
        console.log("🗺️ Creating map...")

        // Create map with minimal configuration
        const map = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [19.0, 52.0], // Poland
          zoom: 6,
          attributionControl: true
        })

        // Handle map events
        map.on('load', () => {
          console.log("🎯 Mapbox map loaded successfully!")
          setStatus("✅ Mapa Mapbox załadowana!")
          setIsLoading(false)
          setMapLoaded(true)
          mapRef.current = map

          // Add a simple marker
          new mapboxgl.default.Marker()
            .setLngLat([21.0122, 52.2297])
            .setPopup(new mapboxgl.default.Popup().setHTML('<h3>🏆 Warszawa</h3><p>Mapbox GL działa!</p>'))
            .addTo(map)
        })

        map.on('error', (e: any) => {
          console.error("❌ Mapbox error:", e)
          setError(`Błąd mapy: ${e.error?.message || e.message}`)
          setIsLoading(false)
        })

        // Add navigation controls
        map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

      } catch (err: any) {
        console.error("💥 Mapbox initialization failed:", err)
        setError(`Błąd inicjalizacji: ${err.message}`)
        setIsLoading(false)
      }
    }

    initializeMapbox()

    // No timeout - let Mapbox work
  }, [])

  if (error) {
    return (
      <Box sx={{ height: "100vh", width: "100vw", position: "relative" }}>
        <Box sx={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1000
        }}>
          <Paper sx={{ p: 2, bgcolor: "#ffebee" }}>
            <Typography variant="h6" color="error" sx={{ mb: 1 }}>
              ❌ Błąd Mapbox GL JS
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sprawdź console przeglądarki dla szczegółów
            </Typography>
          </Paper>
        </Box>
        <div
          ref={mapContainer}
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#f5f5f5"
          }}
        />
      </Box>
    )
  }

  return (
    <Box sx={{ height: "100vh", position: "relative" }}>
      {/* Map Container - BASE LAYER: Full screen, lowest z-index */}
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          zIndex: 1 // Base layer
        }}
      />

      {/* Header - OVERLAY: Above map */}
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
          zIndex: 1100, // Above map
          bgcolor: "rgba(255, 255, 255, 0.95)", // Semi-transparent
          backdropFilter: "blur(8px)" // Glass effect
        }}
      >
        <Container maxWidth={false}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => router.push("/")}
              sx={{
                background: "rgba(25, 118, 210, 0.1)",
                "&:hover": { background: "rgba(25, 118, 210, 0.2)" }
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" component="h1" fontWeight="bold">
                🧪 Mapbox GL JS Test + LayerTree
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Test integracji • {mapLoaded ? "✅ Mapa załadowana" : isLoading ? `🔄 ${status}` : "❌ Błąd"}
              </Typography>
            </Box>

            <IconButton
              onClick={() => setIsLayerTreeVisible(!isLayerTreeVisible)}
              sx={{
                background: isLayerTreeVisible ? "rgba(25, 118, 210, 0.1)" : "rgba(0,0,0,0.05)",
                "&:hover": { background: "rgba(25, 118, 210, 0.2)" }
              }}
            >
              <LayersIcon />
            </IconButton>
          </Box>
        </Container>
      </Paper>

      {/* LayerTree - OVERLAY: Above map and header */}
      {isLayerTreeVisible && (
        <Box
          sx={{
            position: "absolute",
            top: 80, // Below header
            left: 0,
            width: 300,
            height: "calc(100vh - 80px)",
            bgcolor: "rgba(255, 255, 255, 0.95)", // Semi-transparent
            backdropFilter: "blur(8px)", // Glass effect
            borderRight: 1,
            borderColor: "divider",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
            zIndex: 1200 // Above everything
          }}
        >
          <LayerTree
            data={layersState}
            isVisible={isLayerTreeVisible}
            onTogglePanel={() => setIsLayerTreeVisible(!isLayerTreeVisible)}
            onToggleVisibility={handleLayerVisibilityToggle}
          />
        </Box>
      )}

      {/* Loading Spinner - OVERLAY: Center of screen */}
      {isLoading && (
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1300,
          textAlign: "center"
        }}>
          <Box sx={{
            width: 60,
            height: 60,
            border: "4px solid #1976d2",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" }
            },
            mb: 2
          }} />
          <Typography variant="body1" color="primary">
            {status}
          </Typography>
        </Box>
      )}

      {/* Status Panel - OVERLAY: Bottom right */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          zIndex: 1300,
        }}
      >
        <Paper sx={{ p: 2, opacity: 0.95, bgcolor: "background.paper" }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
            🌍 Mapbox GL JS Direct
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            📍 Centrum: Polska (52.0°N, 19.0°E)
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            🎯 Status: {mapLoaded ? "Aktywna" : "Ładowanie..."}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            📋 Warstwy: {layersState.reduce((count, group) => count + (group.children?.length || 0), 0)}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}