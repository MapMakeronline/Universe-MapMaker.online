/**
 * Custom hooks for Layer Management
 * Provides convenient access to layer state and actions
 */

import { useDispatch, useSelector } from 'react-redux'
import { type RootState, type AppDispatch } from '../store'
import {
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
  initializeFromStorage
} from './layersSlice'
import {
  useGetLayersTreeQuery,
  useUpdateLayerVisibilityMutation,
  useUpdateLayerOpacityMutation,
  useReorderLayersMutation,
  useAddLayerMutation,
  useAddGroupMutation,
  useDeleteLayerMutation,
  useResetLayersMutation,
  useExportLayerConfigMutation,
  useImportLayerConfigMutation
} from './layersApi'
import { LayerNode, LayerReorderRequest } from './types'
import { useMemo, useCallback } from 'react'

// Hook for accessing layer tree data
export const useLayerTree = () => {
  const {
    data: tree = [],
    isLoading,
    error,
    refetch
  } = useGetLayersTreeQuery()

  const {
    expandedNodes,
    selectedNodes,
    searchQuery,
    sidebarOpen,
    settingsPanel,
    attributesPanel,
    projectProperties
  } = useSelector((state: RootState) => state.layers)

  return {
    tree,
    expandedNodes,
    selectedNodes,
    searchQuery,
    sidebarOpen,
    settingsPanel,
    attributesPanel,
    projectProperties,
    isLoading,
    error,
    refetch
  }
}

// Hook for layer tree actions
export const useLayerActions = () => {
  const dispatch = useDispatch<AppDispatch>()

  const [updateVisibility] = useUpdateLayerVisibilityMutation()
  const [updateOpacity] = useUpdateLayerOpacityMutation()
  const [reorderMutation] = useReorderLayersMutation()
  const [addLayer] = useAddLayerMutation()
  const [addGroup] = useAddGroupMutation()
  const [deleteLayer] = useDeleteLayerMutation()
  const [resetLayers] = useResetLayersMutation()
  const [exportConfig] = useExportLayerConfigMutation()
  const [importConfig] = useImportLayerConfigMutation()

  // Search actions
  const handleSearch = useCallback((query: string) => {
    dispatch(setSearchQuery(query))
  }, [dispatch])

  // Node expansion actions
  const handleSetExpanded = useCallback((nodeIds: string[]) => {
    dispatch(setExpandedNodes(nodeIds))
  }, [dispatch])

  const handleToggleExpansion = useCallback((nodeId: string) => {
    dispatch(toggleNodeExpansion(nodeId))
  }, [dispatch])

  // Node selection actions
  const handleSetSelected = useCallback((nodeIds: string[]) => {
    dispatch(setSelectedNodes(nodeIds))
  }, [dispatch])

  const handleToggleSelection = useCallback((nodeId: string) => {
    dispatch(toggleNodeSelection(nodeId))
  }, [dispatch])

  // Layer visibility with API call
  const handleVisibilityToggle = useCallback(async (nodeId: string, visible: boolean) => {
    // Optimistic update
    dispatch(toggleLayerVisibility({ id: nodeId, visible }))

    try {
      await updateVisibility({ id: nodeId, visible }).unwrap()
    } catch (error) {
      // Revert on error
      dispatch(toggleLayerVisibility({ id: nodeId, visible: !visible }))
      console.error('Failed to update layer visibility:', error)
    }
  }, [dispatch, updateVisibility])

  // Layer opacity with API call
  const handleOpacityChange = useCallback(async (nodeId: string, opacity: number) => {
    // Optimistic update
    dispatch(updateLayerOpacity({ id: nodeId, opacity }))

    try {
      await updateOpacity({ id: nodeId, opacity }).unwrap()
    } catch (error) {
      // Could revert on error if needed
      console.error('Failed to update layer opacity:', error)
    }
  }, [dispatch, updateOpacity])

  // Layer name update
  const handleNameUpdate = useCallback((nodeId: string, name: string) => {
    // Optimistic update
    dispatch(updateLayerName({ id: nodeId, name }))

    // TODO: Add API call when backend is ready
    // try {
    //   await updateLayerName({ id: nodeId, name }).unwrap()
    // } catch (error) {
    //   console.error('Failed to update layer name:', error)
    // }
  }, [dispatch])

  // Layer reordering with API call
  const handleReorder = useCallback(async (parentId: string | null, orderedIds: string[]) => {
    const reorderRequest: LayerReorderRequest = { parentId, orderedIds }

    try {
      await reorderMutation(reorderRequest).unwrap()
    } catch (error) {
      console.error('Failed to reorder layers:', error)
    }
  }, [reorderMutation])

  // Panel management
  const handleOpenSettings = useCallback((layerId: string) => {
    dispatch(openSettingsPanel(layerId))
  }, [dispatch])

  const handleCloseSettings = useCallback(() => {
    dispatch(closeSettingsPanel())
  }, [dispatch])

  const handleOpenAttributes = useCallback((layerId: string) => {
    dispatch(openAttributesPanel(layerId))
  }, [dispatch])

  const handleCloseAttributes = useCallback(() => {
    dispatch(closeAttributesPanel())
  }, [dispatch])

  const handleToggleProjectProps = useCallback(() => {
    dispatch(toggleProjectProperties())
  }, [dispatch])

  // Sidebar management
  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar())
  }, [dispatch])

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    dispatch(setSidebarOpen(open))
  }, [dispatch])

  // Layer management
  const handleAddLayer = useCallback(async (layer: Partial<LayerNode> & { parentId?: string }) => {
    try {
      await addLayer(layer).unwrap()
    } catch (error) {
      console.error('Failed to add layer:', error)
    }
  }, [addLayer])

  const handleAddGroup = useCallback(async (name: string, parentId?: string) => {
    try {
      await addGroup({ name, parentId }).unwrap()
    } catch (error) {
      console.error('Failed to add group:', error)
    }
  }, [addGroup])

  const handleDeleteLayer = useCallback(async (layerId: string) => {
    try {
      await deleteLayer(layerId).unwrap()
    } catch (error) {
      console.error('Failed to delete layer:', error)
    }
  }, [deleteLayer])

  const handleReset = useCallback(async () => {
    try {
      await resetLayers().unwrap()
    } catch (error) {
      console.error('Failed to reset layers:', error)
    }
  }, [resetLayers])

  // Import/Export
  const handleExport = useCallback(async (format: 'json' | 'xml' | 'qgis' = 'json') => {
    try {
      const blob = await exportConfig({ format }).unwrap()

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `layers-config.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export configuration:', error)
    }
  }, [exportConfig])

  const handleImport = useCallback(async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      await importConfig(formData).unwrap()
    } catch (error) {
      console.error('Failed to import configuration:', error)
    }
  }, [importConfig])

  // Initialize from localStorage
  const handleInitialize = useCallback(() => {
    dispatch(initializeFromStorage())
  }, [dispatch])

  return {
    // Search
    onSearch: handleSearch,

    // Node expansion
    onSetExpanded: handleSetExpanded,
    onToggleExpansion: handleToggleExpansion,

    // Node selection
    onSetSelected: handleSetSelected,
    onToggleSelection: handleToggleSelection,

    // Layer properties
    onVisibilityToggle: handleVisibilityToggle,
    onOpacityChange: handleOpacityChange,
    onNameUpdate: handleNameUpdate,
    onReorder: handleReorder,

    // Panel management
    onOpenSettings: handleOpenSettings,
    onCloseSettings: handleCloseSettings,
    onOpenAttributes: handleOpenAttributes,
    onCloseAttributes: handleCloseAttributes,
    onToggleProjectProps: handleToggleProjectProps,

    // Sidebar management
    onToggleSidebar: handleToggleSidebar,
    onSetSidebarOpen: handleSetSidebarOpen,

    // Layer management
    onAddLayer: handleAddLayer,
    onAddGroup: handleAddGroup,
    onDeleteLayer: handleDeleteLayer,
    onReset: handleReset,

    // Import/Export
    onExport: handleExport,
    onImport: handleImport,

    // Initialization
    onInitialize: handleInitialize
  }
}

// Hook for filtered tree (with search)
export const useFilteredLayerTree = () => {
  const { tree, searchQuery } = useLayerTree()

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree

    const filterNodes = (nodes: LayerNode[]): LayerNode[] => {
      const filtered: LayerNode[] = []

      for (const node of nodes) {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase())
        const filteredChildren = node.children ? filterNodes(node.children) : []

        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          })
        }
      }

      return filtered
    }

    return filterNodes(tree)
  }, [tree, searchQuery])

  return {
    filteredTree,
    searchQuery,
    hasFilter: searchQuery.trim().length > 0
  }
}

// Hook for layer hierarchy helpers
export const useLayerHelpers = () => {
  const { tree } = useLayerTree()

  // Find node by ID in tree
  const findNodeById = useCallback((nodeId: string, nodes: LayerNode[] = tree): LayerNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node
      }
      if (node.children) {
        const found = findNodeById(nodeId, node.children)
        if (found) return found
      }
    }
    return null
  }, [tree])

  // Get node path (breadcrumb)
  const getNodePath = useCallback((nodeId: string, nodes: LayerNode[] = tree, path: string[] = []): string[] => {
    for (const node of nodes) {
      const currentPath = [...path, node.name]

      if (node.id === nodeId) {
        return currentPath
      }

      if (node.children) {
        const found = getNodePath(nodeId, node.children, currentPath)
        if (found.length > 0) return found
      }
    }
    return []
  }, [tree])

  // Check if node has visible children
  const hasVisibleChildren = useCallback((nodeId: string): boolean => {
    const node = findNodeById(nodeId)
    if (!node?.children) return false

    return node.children.some(child => child.visible || hasVisibleChildren(child.id))
  }, [findNodeById])

  // Get all child IDs
  const getChildIds = useCallback((nodeId: string): string[] => {
    const node = findNodeById(nodeId)
    if (!node?.children) return []

    const getAllIds = (nodes: LayerNode[]): string[] => {
      const ids: string[] = []
      for (const child of nodes) {
        ids.push(child.id)
        if (child.children) {
          ids.push(...getAllIds(child.children))
        }
      }
      return ids
    }

    return getAllIds(node.children)
  }, [findNodeById])

  return {
    findNodeById,
    getNodePath,
    hasVisibleChildren,
    getChildIds
  }
}