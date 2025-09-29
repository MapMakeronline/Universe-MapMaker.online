/**
 * Layer Management Module Exports
 * Main entry point for the layer management system
 */

// Main components
export { default as LayerManager, LayerManagerCore } from './LayerManager'
export { default as LayerSidebar } from './LayerSidebar'
export { default as LayerTree } from './DraggableLayerTree'
export { default as DraggableLayerTree } from './DraggableLayerTree'
export { default as DraggableLayerItem } from './DraggableLayerItem'
export { default as LayerTreeItem } from './LayerTreeItem'
export { default as LayerSettingsPanel } from './LayerSettingsPanel'
export { default as AttributesPanel } from './AttributesPanel'
export { default as ProjectProperties } from './ProjectProperties'
export { default as SidebarToggle } from './SidebarToggle'

// Redux state
export * from '../../state/layers/types'
export * from '../../state/layers/hooks'
export { layersApi } from '../../state/layers/layersApi'
export { default as layersReducer } from '../../state/layers/layersSlice'

// Theme
export { darkTheme, lightTheme } from '../../lib/theme'

// MSW mocks (for development/testing)
export { handlers } from '../../mocks/handlers'
export { worker } from '../../mocks/browser'
export { server } from '../../mocks/server'