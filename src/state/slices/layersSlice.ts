import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { createSelector } from "reselect"
import type { RootState } from "../store"

export interface Layer {
  id: string
  name: string
  visible: boolean
  z: number
  type: "geojson" | "wms" | "mvt" | "raster"
  source?: {
    url?: string
    data?: any
    tiles?: string[]
    params?: Record<string, any>
  }
  style?: {
    paint?: Record<string, any>
    layout?: Record<string, any>
  }
  metadata?: {
    description?: string
    attribution?: string
    bounds?: [number, number, number, number]
    minzoom?: number
    maxzoom?: number
  }
}

export interface LayerGroup {
  id: string
  name: string
  expanded: boolean
  layers: string[] // Layer IDs
}

export interface LayersState {
  layers: Layer[]
  groups: LayerGroup[]
  selectedLayerId: string | null
  draggedLayerId: string | null
}

const initialState: LayersState = {
  layers: [
    {
      id: "parcels-demo",
      name: "Działki (Demo)",
      visible: true,
      z: 1,
      type: "geojson",
      source: {
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { id: 1, name: "Działka 1", area: 1200 },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [21.0, 52.2],
                    [21.01, 52.2],
                    [21.01, 52.21],
                    [21.0, 52.21],
                    [21.0, 52.2],
                  ],
                ],
              },
            },
          ],
        },
      },
      style: {
        paint: {
          "fill-color": "#1976d2",
          "fill-opacity": 0.3,
          "fill-outline-color": "#1976d2",
        },
      },
    },
  ],
  groups: [
    {
      id: "base-layers",
      name: "Warstwy bazowe",
      expanded: true,
      layers: [],
    },
    {
      id: "data-layers",
      name: "Warstwy danych",
      expanded: true,
      layers: ["parcels-demo"],
    },
  ],
  selectedLayerId: null,
  draggedLayerId: null,
}

export const layersSlice = createSlice({
  name: "layers",
  initialState,
  reducers: {
    setLayers: (state, action: PayloadAction<Layer[]>) => {
      state.layers = action.payload
    },
    addLayer: (state, action: PayloadAction<Layer>) => {
      state.layers.push(action.payload)
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      state.layers = state.layers.filter((layer) => layer.id !== action.payload)
      // Remove from groups
      state.groups.forEach((group) => {
        group.layers = group.layers.filter((layerId) => layerId !== action.payload)
      })
    },
    updateLayer: (state, action: PayloadAction<{ id: string; updates: Partial<Layer> }>) => {
      const { id, updates } = action.payload
      const layerIndex = state.layers.findIndex((layer) => layer.id === id)
      if (layerIndex !== -1) {
        state.layers[layerIndex] = { ...state.layers[layerIndex], ...updates }
      }
    },
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((l) => l.id === action.payload)
      if (layer) {
        layer.visible = !layer.visible
      }
    },
    setLayerVisibility: (state, action: PayloadAction<{ id: string; visible: boolean }>) => {
      const layer = state.layers.find((l) => l.id === action.payload.id)
      if (layer) {
        layer.visible = action.payload.visible
      }
    },
    reorderLayers: (
      state,
      action: PayloadAction<{ draggedId: string; targetId: string; position: "above" | "below" }>,
    ) => {
      const { draggedId, targetId, position } = action.payload
      const draggedIndex = state.layers.findIndex((l) => l.id === draggedId)
      const targetIndex = state.layers.findIndex((l) => l.id === targetId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedLayer] = state.layers.splice(draggedIndex, 1)
        const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
        const insertIndex = position === "above" ? newTargetIndex : newTargetIndex + 1
        state.layers.splice(insertIndex, 0, draggedLayer)

        // Update z-index based on array position
        state.layers.forEach((layer, index) => {
          layer.z = index
        })
      }
    },
    setSelectedLayer: (state, action: PayloadAction<string | null>) => {
      state.selectedLayerId = action.payload
    },
    setDraggedLayer: (state, action: PayloadAction<string | null>) => {
      state.draggedLayerId = action.payload
    },
    addGroup: (state, action: PayloadAction<LayerGroup>) => {
      state.groups.push(action.payload)
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((group) => group.id !== action.payload)
    },
    toggleGroupExpanded: (state, action: PayloadAction<string>) => {
      const group = state.groups.find((g) => g.id === action.payload)
      if (group) {
        group.expanded = !group.expanded
      }
    },
    addLayerToGroup: (state, action: PayloadAction<{ groupId: string; layerId: string }>) => {
      const group = state.groups.find((g) => g.id === action.payload.groupId)
      if (group && !group.layers.includes(action.payload.layerId)) {
        group.layers.push(action.payload.layerId)
      }
    },
    removeLayerFromGroup: (state, action: PayloadAction<{ groupId: string; layerId: string }>) => {
      const group = state.groups.find((g) => g.id === action.payload.groupId)
      if (group) {
        group.layers = group.layers.filter((id) => id !== action.payload.layerId)
      }
    },
  },
})

export const {
  setLayers,
  addLayer,
  removeLayer,
  updateLayer,
  toggleLayerVisibility,
  setLayerVisibility,
  reorderLayers,
  setSelectedLayer,
  setDraggedLayer,
  addGroup,
  removeGroup,
  toggleGroupExpanded,
  addLayerToGroup,
  removeLayerFromGroup,
} = layersSlice.actions

// Memoized selectors
export const selectLayers = (state: RootState) => state.layers.layers
export const selectGroups = (state: RootState) => state.layers.groups
export const selectSelectedLayerId = (state: RootState) => state.layers.selectedLayerId
export const selectDraggedLayerId = (state: RootState) => state.layers.draggedLayerId

export const selectVisibleLayers = createSelector(selectLayers, (layers) => layers.filter((layer) => layer.visible))

export const selectSortedLayers = createSelector(selectLayers, (layers) => [...layers].sort((a, b) => a.z - b.z))

export const selectLayerById = createSelector(
  [selectLayers, (state: RootState, layerId: string) => layerId],
  (layers, layerId) => layers.find((layer) => layer.id === layerId),
)

export const selectSelectedLayer = createSelector([selectLayers, selectSelectedLayerId], (layers, selectedId) =>
  selectedId ? layers.find((layer) => layer.id === selectedId) : null,
)

export const selectLayersByGroup = createSelector([selectLayers, selectGroups], (layers, groups) => {
  // Create a plain object lookup instead of Map for serialization compatibility
  const layerLookup: Record<string, Layer> = {}
  layers.forEach((layer) => {
    layerLookup[layer.id] = layer
  })

  return groups.map((group) => ({
    ...group,
    layers: group.layers.map((layerId) => layerLookup[layerId]).filter(Boolean) as Layer[],
  }))
})
