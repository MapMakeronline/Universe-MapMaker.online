"use client"

import { useState, useRef } from "react"
import { Box, Container, Typography, Paper } from "@mui/material"
import { MapContainer } from "@/components/map"
import { LayersPanel } from "@/components/panels/LayersPanel"
import { ParcelsPanel } from "@/components/panels/ParcelsPanel"
import { MeasurementPanel } from "@/components/panels/MeasurementPanel"
import { Toolbar } from "@/components/ui/Toolbar"
import { useAppSelector } from "@/state/hooks"
import LayerTree from "@/components/layer-tree/LayerTree"
import Map from "@/components/Map"
import type { LayerNode } from "@/types/layers"
import type mapboxgl from "mapbox-gl"
// import { selectActivePanel } from "@/state/slices/uiSlice"

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

export default function HomePage() {
  // const activePanel = useAppSelector(selectActivePanel)
  const activePanel = null
  const [isLayerTreeVisible, setIsLayerTreeVisible] = useState(true)
  const [layersState, setLayersState] = useState(mapLayers)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const handleMapLoad = (map: mapboxgl.Map) => {
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

  /*const renderActivePanel = () => {
    switch (activePanel) {
      case "layers":
        return <LayersPanel />
      case "parcels":
        return <ParcelsPanel />
      case "measurement":
        return <MeasurementPanel />
      default:
        return null
    }
  }*/

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
          <Typography variant="h5" component="h1" fontWeight="bold">
            Universe MapMaker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Profesjonalne narzędzie do tworzenia i analizy map
          </Typography>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LayerTree Panel */}
        {isLayerTreeVisible && (
          <Box
            sx={{
              width: 320,
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "auto",
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
        <Box sx={{ flex: 1, position: "relative" }}>
          <Map
            onMapLoad={handleMapLoad}
            onLayerToggle={(layerId, visible) => {
              console.log(`Map layer ${layerId} toggled to ${visible}`)
            }}
          />

          {/* Floating Toolbar */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
            }}
          >
            <Paper sx={{ p: 1 }}>
              <button onClick={() => setIsLayerTreeVisible(!isLayerTreeVisible)}>
                {isLayerTreeVisible ? "Ukryj" : "Pokaż"} warstwy
              </button>
            </Paper>
          </Box>
        </Box>

        {/* Side Panel */}
        {activePanel && (
          <Box
            sx={{
              width: 400,
              borderLeft: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/*{renderActivePanel()}*/}
          </Box>
        )}
      </Box>
    </Box>
  )
}