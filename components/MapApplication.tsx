"use client"

import { useState, useRef } from "react"
import { Box, Container, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LayersIcon from "@mui/icons-material/Layers"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

// Dynamic import with no SSR - using Mapbox GL JS only
const Map = dynamic(() => import("./MapboxMap"), {
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
        border: "4px solid #1976d2",
        borderTop: "4px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }} />
      <Typography variant="h6" sx={{ color: "#1976d2" }}>
        🗺️ Ładowanie Mapbox GL JS...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Inicjalizacja mapy profesjonalnej
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
    <Box sx={{ height: "100vh", position: "relative" }}>
      {/* Map Container - BASE LAYER: Full screen, lowest z-index */}
      <Box sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1 // Base layer
      }}>
        <Map
          onMapLoad={handleMapLoad}
          onLayerToggle={(layerId, visible) => {
            console.log(`🔄 Map layer ${layerId} toggled to ${visible}`)
          }}
        />
      </Box>

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
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            <IconButton
              onClick={() => router.push("/")}
              sx={{
                background: "rgba(25, 118, 210, 0.1)",
                "&:hover": { background: "rgba(25, 118, 210, 0.2)" },
                // Responsive size via sx instead of size prop
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                component="h1"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.5rem" },
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                🗺️ Universe MapMaker
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {mapLoaded ? "✅ Mapbox GL JS" : "🔄 Ładowanie..."}
              </Typography>
            </Box>

            <IconButton
              onClick={() => setIsLayerTreeVisible(!isLayerTreeVisible)}
              sx={{
                background: isLayerTreeVisible ? "rgba(25, 118, 210, 0.1)" : "rgba(0,0,0,0.05)",
                "&:hover": { background: "rgba(25, 118, 210, 0.2)" },
                // Responsive size via sx instead of size prop
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 }
              }}
            >
              <LayersIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </IconButton>
          </Box>
        </Container>
      </Paper>

      {/* LayerTree - OVERLAY: Above map and header */}
      {isLayerTreeVisible && (
        <Box
          sx={{
            position: "absolute",
            top: { xs: 60, sm: 80 }, // Smaller header on mobile
            left: 0,
            width: { xs: "100vw", sm: 350, md: 300 }, // Full width on mobile
            height: { xs: "calc(100vh - 60px)", sm: "calc(100vh - 80px)" },
            bgcolor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            borderRight: { xs: 0, sm: 1 },
            borderColor: "divider",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            boxShadow: {
              xs: "0 2px 16px rgba(0,0,0,0.2)",
              sm: "2px 0 8px rgba(0,0,0,0.15)"
            },
            zIndex: 1200,
            // Mobile slide-in animation
            transform: { xs: "translateX(0)", sm: "none" },
            transition: "transform 0.3s ease-in-out"
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

      {/* Map Controls Panel - OVERLAY: Above map */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 10, sm: 20 },
          right: { xs: 10, sm: 20 },
          zIndex: 1300,
          display: { xs: mapLoaded ? "block" : "none", sm: "block" }, // Hide on mobile when loading
        }}
      >
        <Paper sx={{
          p: { xs: 1.5, sm: 2 },
          opacity: 0.95,
          bgcolor: "background.paper",
          borderRadius: 2,
          minWidth: { xs: 160, sm: 200 }
        }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: "bold",
              fontSize: { xs: "0.65rem", sm: "0.75rem" }
            }}
          >
            🌍 Mapbox GL JS
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: "0.75rem"
            }}
          >
            📍 Polska (52.0°N, 19.0°E)
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: { xs: "0.65rem", sm: "0.75rem" }
            }}
          >
            🎯 {mapLoaded ? "✅ Aktywna" : "🔄 Ładowanie..."}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: { xs: "0.65rem", sm: "0.75rem" }
            }}
          >
            📋 {layersState.reduce((count, group) => count + (group.children?.length || 0), 0)} warstw
          </Typography>
        </Paper>
      </Box>

      {/* Layer Tree Toggle for Mobile - OVERLAY: Above map */}
      {!isLayerTreeVisible && (
        <Box
          sx={{
            position: "absolute",
            top: { xs: 70, sm: 100 }, // Adjusted for mobile header
            left: { xs: 10, sm: 20 },
            zIndex: 1300,
          }}
        >
          <IconButton
            onClick={() => setIsLayerTreeVisible(true)}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.9)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 1)",
                transform: "scale(1.05)"
              },
              transition: "all 0.2s ease-in-out",
              // Responsive size via sx
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              // Pulsing animation for mobile
              animation: { xs: "pulse 2s infinite", sm: "none" },
              "@keyframes pulse": {
                "0%": { boxShadow: "0 2px 12px rgba(25, 118, 210, 0.3)" },
                "50%": { boxShadow: "0 2px 20px rgba(25, 118, 210, 0.6)" },
                "100%": { boxShadow: "0 2px 12px rgba(25, 118, 210, 0.3)" }
              }
            }}
          >
            <LayersIcon
              sx={{
                color: "#1976d2",
                fontSize: { xs: 16, sm: 20 }
              }}
            />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}