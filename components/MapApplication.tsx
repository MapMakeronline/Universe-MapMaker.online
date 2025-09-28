"use client"

import { useState, useRef } from "react"
import { Box, Container, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LayersIcon from "@mui/icons-material/Layers"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

// Dynamic import with no SSR - using WORKING simple component
const Map = dynamic(() => import("@/components/SimpleLeafletMap"), {
  ssr: false,
  loading: () => (
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
        width: 60,
        height: 60,
        border: "4px solid #4CAF50",
        borderTop: "4px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }} />
      <Typography variant="h6" sx={{ color: "#4CAF50" }}>
        🗺️ Ładowanie OpenStreetMap...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Inicjalizacja Leaflet i warstw mapowych
      </Typography>
    </Box>
  )
})

// Map layers configuration
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
    name: "📊 Warstwy danych",
    visible: true,
    type: "group",
    children: [
      {
        id: "parcels",
        name: "Działki ewidencyjne",
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
        name: "Drogi krajowe",
        visible: true,
        type: "line",
        layerIds: ["roads-layer"],
      },
      {
        id: "points-of-interest",
        name: "Punkty POI",
        visible: false,
        type: "point",
        layerIds: ["poi-layer"],
      },
    ],
  },
]

export default function MapApplication() {
  const router = useRouter()
  const [isLayerTreeVisible, setIsLayerTreeVisible] = useState(true)
  const [layersState, setLayersState] = useState(mapLayers)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const handleMapLoad = (map: any) => {
    mapRef.current = map
    setMapLoaded(true)
    console.log("🗺️ Leaflet OpenStreetMap loaded successfully!")
  }

  const handleLayerVisibilityToggle = (node: LayerNode, visible: boolean) => {
    console.log(`🔄 Toggling layer "${node.name}" to ${visible ? "visible" : "hidden"}`)

    // Toggle actual map layers if they exist
    if (node.layerIds && mapRef.current) {
      node.layerIds.forEach(layerId => {
        try {
          // Use the exposed toggle function
          if ((mapRef.current as any).toggleLayerVisibility) {
            (mapRef.current as any).toggleLayerVisibility(layerId, visible)
          } else {
            // Fallback to direct method
            const visibility = visible ? "visible" : "none"
            mapRef.current!.setLayoutProperty(layerId, "visibility", visibility)
          }
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

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
          zIndex: 1100
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
                Profesjonalna aplikacja mapowa • {mapLoaded ? "✅ Mapa załadowana" : "🔄 Ładowanie..."}
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
      <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* ISOLATED LayerTree Sidebar */}
        {isLayerTreeVisible && (
          <Box
            sx={{
              position: "fixed",
              top: 80, // Header height
              left: 0,
              width: 380,
              height: "calc(100vh - 80px)",
              bgcolor: "background.paper",
              borderRight: 1,
              borderColor: "divider",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
              zIndex: 1050 // Above map but below header
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

        {/* Map Container with margin for LayerTree */}
        <Box sx={{
          height: "100%",
          marginLeft: isLayerTreeVisible ? "380px" : 0,
          transition: "margin-left 0.3s ease-in-out",
          position: "relative"
        }}>
          <Map
            onMapLoad={handleMapLoad}
            onLayerToggle={(layerId, visible) => {
              console.log(`🔄 Map layer ${layerId} toggled to ${visible}`)
            }}
          />

          {/* Map Controls Panel */}
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              right: 20,
              zIndex: 1000,
            }}
          >
            <Paper sx={{ p: 2, opacity: 0.95, bgcolor: "background.paper" }}>
              <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
                🌍 OpenStreetMap + Leaflet
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

          {/* Layer Tree Toggle for Mobile */}
          {!isLayerTreeVisible && (
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: 20,
                zIndex: 1000,
              }}
            >
              <IconButton
                onClick={() => setIsLayerTreeVisible(true)}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  "&:hover": { bgcolor: "background.paper" }
                }}
              >
                <LayersIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}