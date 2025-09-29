/**
 * Layers Redux Slice with RTK Query
 * Manages layer tree state, visibility, and synchronization
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { LayersState, LayerNode, LayerUpdateRequest, LayerReorderRequest } from './types'

const initialState: LayersState = {
  tree: [],
  expandedNodes: ['base-layers', 'data-layers'],
  selectedNodes: [],
  searchQuery: '',
  isLoading: false,
  error: null,
  sidebarOpen: true,
  settingsPanel: {
    isOpen: false,
    layerId: null
  },
  attributesPanel: {
    isOpen: false,
    layerId: null
  },
  projectProperties: {
    isOpen: false
  }
}

const layersSlice = createSlice({
  name: 'layers',
  initialState,
  reducers: {
    // Tree operations
    setLayerTree: (state, action: PayloadAction<LayerNode[]>) => {
      state.tree = action.payload
      state.isLoading = false
      state.error = null
    },

    // Search functionality
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    // Node expansion
    setExpandedNodes: (state, action: PayloadAction<string[]>) => {
      state.expandedNodes = action.payload
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('layerTree_expanded', JSON.stringify(action.payload))
      }
    },

    toggleNodeExpansion: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload
      const isExpanded = state.expandedNodes.includes(nodeId)

      if (isExpanded) {
        state.expandedNodes = state.expandedNodes.filter(id => id !== nodeId)
      } else {
        state.expandedNodes.push(nodeId)
      }

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('layerTree_expanded', JSON.stringify(state.expandedNodes))
      }
    },

    // Node selection
    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload
    },

    toggleNodeSelection: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload
      const isSelected = state.selectedNodes.includes(nodeId)

      if (isSelected) {
        state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId)
      } else {
        state.selectedNodes.push(nodeId)
      }
    },

    // Layer visibility (optimistic update)
    toggleLayerVisibility: (state, action: PayloadAction<{ id: string; visible: boolean }>) => {
      const { id, visible } = action.payload

      const updateNodeVisibility = (nodes: LayerNode[]): LayerNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, visible }
          }
          if (node.children) {
            return { ...node, children: updateNodeVisibility(node.children) }
          }
          return node
        })
      }

      state.tree = updateNodeVisibility(state.tree)
    },

    // Layer opacity (optimistic update)
    updateLayerOpacity: (state, action: PayloadAction<{ id: string; opacity: number }>) => {
      const { id, opacity } = action.payload

      const updateNodeOpacity = (nodes: LayerNode[]): LayerNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, opacity }
          }
          if (node.children) {
            return { ...node, children: updateNodeOpacity(node.children) }
          }
          return node
        })
      }

      state.tree = updateNodeOpacity(state.tree)
    },

    // Layer name update (optimistic update)
    updateLayerName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const { id, name } = action.payload

      const updateNodeName = (nodes: LayerNode[]): LayerNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, name }
          }
          if (node.children) {
            return { ...node, children: updateNodeName(node.children) }
          }
          return node
        })
      }

      state.tree = updateNodeName(state.tree)
    },

    // Layer reordering (optimistic update)
    reorderLayers: (state, action: PayloadAction<LayerReorderRequest>) => {
      const { parentId, orderedIds } = action.payload

      const reorderNodes = (nodes: LayerNode[]): LayerNode[] => {
        return nodes.map(node => {
          if (node.id === parentId && node.children) {
            // Reorder children based on orderedIds
            const reorderedChildren = orderedIds
              .map(id => node.children?.find(child => child.id === id))
              .filter(Boolean) as LayerNode[]

            return { ...node, children: reorderedChildren }
          }
          if (node.children) {
            return { ...node, children: reorderNodes(node.children) }
          }
          return node
        })
      }

      if (parentId === null) {
        // Reorder root level
        state.tree = orderedIds
          .map(id => state.tree.find(node => node.id === id))
          .filter(Boolean) as LayerNode[]
      } else {
        state.tree = reorderNodes(state.tree)
      }
    },

    // Panel management
    openSettingsPanel: (state, action: PayloadAction<string>) => {
      state.settingsPanel = {
        isOpen: true,
        layerId: action.payload
      }
    },

    closeSettingsPanel: (state) => {
      state.settingsPanel = {
        isOpen: false,
        layerId: null
      }
    },

    openAttributesPanel: (state, action: PayloadAction<string>) => {
      state.attributesPanel = {
        isOpen: true,
        layerId: action.payload
      }
    },

    closeAttributesPanel: (state) => {
      state.attributesPanel = {
        isOpen: false,
        layerId: null
      }
    },

    toggleProjectProperties: (state) => {
      state.projectProperties.isOpen = !state.projectProperties.isOpen
    },

    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('layerSidebar_open', JSON.stringify(state.sidebarOpen))
      }
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('layerSidebar_open', JSON.stringify(action.payload))
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    // Initialize from localStorage
    initializeFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const savedExpanded = localStorage.getItem('layerTree_expanded')
        if (savedExpanded) {
          try {
            state.expandedNodes = JSON.parse(savedExpanded)
          } catch (error) {
            console.warn('Failed to parse saved expanded nodes:', error)
          }
        }

        const savedSidebarOpen = localStorage.getItem('layerSidebar_open')
        if (savedSidebarOpen) {
          try {
            state.sidebarOpen = JSON.parse(savedSidebarOpen)
          } catch (error) {
            console.warn('Failed to parse saved sidebar state:', error)
          }
        }
      }
    }
  }
})

export const {
  setLayerTree,
  setSearchQuery,
  setExpandedNodes,
  toggleNodeExpansion,
  setSelectedNodes,
  toggleNodeSelection,
  toggleLayerVisibility,
  updateLayerOpacity,
  updateLayerName,
  reorderLayers,
  openSettingsPanel,
  closeSettingsPanel,
  openAttributesPanel,
  closeAttributesPanel,
  toggleProjectProperties,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setError,
  initializeFromStorage
} = layersSlice.actions

export default layersSlice.reducer