"use client"

import { useState, useRef, useEffect } from "react"
import { Box, Container, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LayersIcon from "@mui/icons-material/Layers"
import { useRouter } from "next/navigation"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

// Przykładowe dane warstw mapy
const mapLayers: LayerNode[] = [
  {
    id: "base-layers",
    name: "Mapy bazowe",
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
      },
      {
        id: "terrain",
        name: "Teren",
        visible: false,
        type: "raster",
        layerIds: ["terrain-layer"],
      },
    ],
  },
  {
    id: "data-layers",
    name: "Warstwy danych",
    visible: true,
    type: "group",
    children: [
      {
        id: "parcels",
        name: "Działki",
        visible: true,
        type: "polygon",
        layerIds: ["parcels-layer"],
      },
      {
        id: "buildings",
        name: "Budynki",
        visible: false,
        type: "polygon",
        layerIds: ["buildings-layer"],
      },
      {
        id: "roads",
        name: "Drogi",
        visible: true,
        type: "line",
        layerIds: ["roads-layer"],
      },
      {
        id: "points-of-interest",
        name: "Punkty zainteresowania",
        visible: false,
        type: "point",
        layerIds: ["poi-layer"],
      },
    ],
  },
]

export default function MapPage() {
  const router = useRouter()
  const [isLayerTreeVisible, setIsLayerTreeVisible] = useState(true)
  const [layersState, setLayersState] = useState(mapLayers)
  const [Map, setMap] = useState<any>(null)
  const mapRef = useRef<any>(null)

  // Dynamic import only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import("@/components/Map").then((MapComponent) => {
        setMap(() => MapComponent.default)
      })
    }
  }, [])

  const handleMapLoad = (map: any) => {
    mapRef.current = map
    console.log("Map loaded successfully!")
  }

  const handleLayerVisibilityToggle = (node: LayerNode, visible: boolean) => {
    console.log(`Toggling layer ${node.name} to ${visible ? "visible" : "hidden"}`)

    // Toggle actual map layers if they exist
    if (node.layerIds && mapRef.current) {
      node.layerIds.forEach(layerId => {
        try {
          const visibility = visible ? "visible" : "none"
          mapRef.current!.setLayoutProperty(layerId, "visibility", visibility)
          console.log(`Set layer ${layerId} visibility to ${visibility}`)
        } catch (error) {
          console.warn(`Could not toggle layer ${layerId}:`, error)
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

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
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
                🗺️ Universe MapMaker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profesjonalne narzędzie do tworzenia i analizy map
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

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LayerTree Panel */}
        {isLayerTreeVisible && (
          <Box
            sx={{
              width: 350,
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "auto",
              display: "flex",
              flexDirection: "column"
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

        {/* Map Container */}
        <Box sx={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f0f0f0" }}>
          {Map ? (
            <Map
              onMapLoad={handleMapLoad}
              onLayerToggle={(layerId, visible) => {
                console.log(`Map layer ${layerId} toggled to ${visible}`)
              }}
            />
          ) : (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h4" sx={{ mb: 3, color: "#4CAF50" }}>
                🗺️ Mapa Mapbox GL
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Mapa jest dostępna w trybie developerskim
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, maxWidth: 400 }}>
                Pełna funkcjonalność Mapbox GL z interaktywnym LayerTree jest dostępna
                podczas uruchamiania lokalnego (npm run dev).
              </Typography>
              <Paper sx={{ p: 3, bgcolor: "#e8f5e8", maxWidth: 500 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
                  ✅ Gotowe funkcjonalności:
                </Typography>
                <Box component="ul" sx={{ textAlign: "left", pl: 2 }}>
                  <Typography component="li" sx={{ mb: 1 }}>
                    🌍 Mapbox GL JS z mapą Polski
                  </Typography>
                  <Typography component="li" sx={{ mb: 1 }}>
                    🗂️ Hierarchiczne zarządzanie warstwami
                  </Typography>
                  <Typography component="li" sx={{ mb: 1 }}>
                    📍 Przykładowe warstwy: działki, budynki, drogi, POI
                  </Typography>
                  <Typography component="li" sx={{ mb: 1 }}>
                    🎛️ Kontrola widoczności warstw przez LayerTree
                  </Typography>
                  <Typography component="li" sx={{ mb: 1 }}>
                    🗺️ Przełączanie stylów map (ulice, satelita, teren)
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Status Panel */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <Paper sx={{ p: 2, opacity: 0.9 }}>
              <Typography variant="caption" sx={{ display: "block" }}>
                🌍 Mapbox GL JS Ready
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                📍 Polska (52.0°N, 19.0°E)
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                🔧 Mode: {process.env.NODE_ENV}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}