"use client"

import { useState } from "react"
import { Box, Container, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useRouter } from "next/navigation"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

// Rozszerzone dane demonstracyjne dla LayerTree
const demoLayers: LayerNode[] = [
  {
    id: "base-maps",
    name: "🗺️ Mapy bazowe",
    visible: true,
    type: "group",
    children: [
      {
        id: "osm",
        name: "OpenStreetMap",
        visible: true,
        type: "raster"
      },
      {
        id: "satellite",
        name: "Zdjęcia satelitarne",
        visible: false,
        type: "raster"
      },
      {
        id: "terrain",
        name: "Mapa topograficzna",
        visible: false,
        type: "raster"
      }
    ]
  },
  {
    id: "gis-data",
    name: "📊 Dane GIS",
    visible: true,
    type: "group",
    children: [
      {
        id: "administrative",
        name: "Jednostki administracyjne",
        visible: true,
        type: "group",
        children: [
          {
            id: "provinces",
            name: "Województwa",
            visible: true,
            type: "polygon"
          },
          {
            id: "counties",
            name: "Powiaty",
            visible: false,
            type: "polygon"
          },
          {
            id: "municipalities",
            name: "Gminy",
            visible: false,
            type: "polygon"
          }
        ]
      },
      {
        id: "infrastructure",
        name: "Infrastruktura",
        visible: false,
        type: "group",
        children: [
          {
            id: "roads",
            name: "Drogi krajowe",
            visible: true,
            type: "line"
          },
          {
            id: "railways",
            name: "Linie kolejowe",
            visible: false,
            type: "line"
          },
          {
            id: "airports",
            name: "Lotniska",
            visible: true,
            type: "point"
          }
        ]
      }
    ]
  },
  {
    id: "environmental",
    name: "🌍 Dane środowiskowe",
    visible: false,
    type: "group",
    children: [
      {
        id: "water",
        name: "Wody powierzchniowe",
        visible: true,
        type: "polygon"
      },
      {
        id: "forests",
        name: "Obszary leśne",
        visible: true,
        type: "polygon"
      },
      {
        id: "protected",
        name: "Obszary chronione",
        visible: false,
        type: "polygon"
      }
    ]
  },
  {
    id: "business",
    name: "💼 Dane biznesowe",
    visible: false,
    type: "group",
    children: [
      {
        id: "parcels",
        name: "Działki ewidencyjne",
        visible: false,
        type: "polygon"
      },
      {
        id: "buildings",
        name: "Budynki",
        visible: false,
        type: "polygon"
      },
      {
        id: "poi",
        name: "Punkty POI",
        visible: false,
        type: "point"
      }
    ]
  }
]

export default function LayerTreePage() {
  const router = useRouter()
  const [layersState, setLayersState] = useState(demoLayers)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  const handleLayerVisibilityToggle = (node: LayerNode, visible: boolean) => {
    console.log(`Toggling layer ${node.name} to ${visible ? "visible" : "hidden"}`)
    setSelectedLayer(node.id)

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

            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                🌳 LayerTree Demo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Demonstracja hierarchicznej struktury warstw mapowych
              </Typography>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LayerTree Panel */}
        <Box
          sx={{
            width: 400,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "auto",
          }}
        >
          <LayerTree
            data={layersState}
            isVisible={true}
            onToggleVisibility={handleLayerVisibilityToggle}
          />
        </Box>

        {/* Info Panel */}
        <Box sx={{ flex: 1, p: 3, bgcolor: "#f8f9fa" }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            📋 Funkcjonalności LayerTree
          </Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              ✅ Zaimplementowane funkcje:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" sx={{ mb: 1 }}>
                🗂️ Hierarchiczna struktura warstw z grupowaniem
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                ☑️ Checkboxy do kontroli widoczności warstw
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                🔽 Rozwijane/zwijane grupy warstw
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                🎨 Ikony odpowiednie do typu warstwy (punkt, linia, poligon)
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                🖱️ Hover effects i responsywny design
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                📱 Material-UI styling i theming
              </Typography>
            </Box>
          </Paper>

          {selectedLayer && (
            <Paper sx={{ p: 3, bgcolor: "#e3f2fd" }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
                🎯 Ostatnio zmieniona warstwa:
              </Typography>
              <Typography variant="body2">
                ID: <code>{selectedLayer}</code>
              </Typography>
            </Paper>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              💡 Kliknij na checkboxy aby przetestować funkcjonalność przełączania widoczności warstw.
              W pełnej aplikacji z mapą, te kontrolki będą wpływać na rzeczywiste warstwy Mapbox GL.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}