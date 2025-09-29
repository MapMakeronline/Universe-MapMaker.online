/**
 * Types for Layer Management System
 */

export type LayerType = 'group' | 'wms' | 'wfs' | 'raster' | 'vector' | 'mvt'

export interface LayerSource {
  wms?: {
    url: string
    layer: string
    format?: string
    tiled?: boolean
  }
  wfs?: {
    url: string
    typeName: string
  }
  mvt?: {
    url: string
  }
}

export interface LayerNode {
  id: string
  name: string
  type: LayerType
  children?: LayerNode[]
  visible?: boolean
  opacity?: number // 0..1
  legendUrl?: string
  source?: LayerSource
  meta?: Record<string, any>
  minZoom?: number
  maxZoom?: number
  order?: number
}

export interface LayersState {
  tree: LayerNode[]
  expandedNodes: string[]
  selectedNodes: string[]
  searchQuery: string
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean
  settingsPanel: {
    isOpen: boolean
    layerId: string | null
  }
  attributesPanel: {
    isOpen: boolean
    layerId: string | null
  }
  projectProperties: {
    isOpen: boolean
  }
}

export interface LayerUpdateRequest {
  id: string
  visible?: boolean
  opacity?: number
}

export interface LayerReorderRequest {
  parentId: string | null
  orderedIds: string[]
}

export interface LayerSearchMatch {
  nodeId: string
  path: string[]
  matchedText: string
}