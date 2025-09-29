/**
 * TypeScript definicje dla systemu warstw mapy
 * Typy dla drawera, drzewa warstw i zarządzania nimi
 */

// Typ warstwy mapy
export type LayerType = 'base' | 'overlay' | 'category'

// Pozycja drawera
export type DrawerAnchor = 'left' | 'right'

// Stan widoczności warstwy
export interface LayerVisibility {
  visible: boolean
  opacity?: number  // 0-1, domyślnie 1
}

// Główna definicja warstwy
export interface Layer {
  id: string                    // Unikalny identyfikator
  name: string                  // Nazwa wyświetlana użytkownikowi
  type: LayerType              // Typ warstwy
  visible: boolean             // Czy warstwa jest widoczna
  icon?: string                // Emoji lub ikona
  description?: string         // Opis warstwy dla tooltip
  opacity?: number             // Przezroczystość (0-1)
  children?: Layer[]           // Podwarstwy (dla kategorii)

  // Konfiguracja Mapbox (dla warstw overlay)
  sourceId?: string            // ID źródła danych w Mapbox
  layerId?: string             // ID warstwy w Mapbox
  mapboxStyle?: string         // URL stylu Mapbox (dla warstw bazowych)

  // Metadane
  group?: string               // Grupa warstwy
  tags?: string[]              // Tagi do filtrowania
  zIndex?: number              // Kolejność warstw
  minZoom?: number             // Minimalny zoom
  maxZoom?: number             // Maksymalny zoom
}

// Kategoria warstw dla organizacji w TreeView
export interface LayerCategory {
  id: string
  name: string
  icon?: string
  layers: Layer[]
  expanded: boolean           // Czy kategoria jest rozwinięta
}

// Stan drawera
export interface DrawerState {
  isOpen: boolean
  anchor: DrawerAnchor
  width: number
  persistent?: boolean        // Czy drawer ma być stały
}

// Konfiguracja drawera
export interface DrawerConfig {
  defaultAnchor: DrawerAnchor
  defaultWidth: number
  mobileWidth: number
  animationDuration: number
  backdropClick: boolean      // Czy kliknięcie tła zamyka drawer
}

// Stan drzewa warstw
export interface LayersTreeState {
  expandedCategories: string[]   // ID rozwiniętych kategorii
  selectedLayers: string[]       // ID zaznaczonych warstw
  activeBaseLayer: string        // ID aktywnej warstwy bazowej
  visibleOverlays: string[]      // ID widocznych warstw overlay
  searchQuery: string            // Zapytanie wyszukiwania
}

// Props dla komponentu LayerItem
export interface LayerItemProps {
  layer: Layer
  level: number               // Poziom zagnieżdżenia (0, 1, 2...)
  isSelected: boolean
  isVisible: boolean
  onToggleVisibility: (layerId: string) => void
  onSelect: (layerId: string) => void
  onContextMenu?: (layerId: string, event: React.MouseEvent) => void
  showCheckbox?: boolean
  disabled?: boolean
}

// Props dla komponentu LayersTree
export interface LayersTreeProps {
  categories: LayerCategory[]
  treeState: LayersTreeState
  onLayerToggle: (layerId: string) => void
  onBaseLayerChange: (layerId: string) => void
  onCategoryToggle: (categoryId: string) => void
  onSearch?: (query: string) => void
  showSearch?: boolean
  maxHeight?: string
  className?: string
}

// Props dla głównego komponentu MapDrawer
export interface MapDrawerProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  anchor?: DrawerAnchor
  width?: number
  children?: React.ReactNode
  showResetButton?: boolean
  onReset?: () => void
  className?: string
}

// Hook useDrawer return type
export interface UseDrawerReturn {
  isOpen: boolean
  anchor: DrawerAnchor
  width: number
  toggle: () => void
  open: () => void
  close: () => void
  setAnchor: (anchor: DrawerAnchor) => void
  setWidth: (width: number) => void
}

// Hook useLayers return type
export interface UseLayersReturn {
  layers: Layer[]
  categories: LayerCategory[]
  treeState: LayersTreeState
  toggleLayer: (layerId: string) => void
  setBaseLayer: (layerId: string) => void
  toggleCategory: (categoryId: string) => void
  resetLayers: () => void
  searchLayers: (query: string) => void
  getVisibleLayers: () => Layer[]
  getActiveBaseLayer: () => Layer | undefined
  syncWithMap: (mapInstance: mapboxgl.Map) => void
}

// Event handlery dla warstw
export interface LayersEventHandlers {
  onLayerAdd?: (layer: Layer) => void
  onLayerRemove?: (layerId: string) => void
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void
  onBaseLayerChange?: (layerId: string) => void
  onLayersReset?: () => void
}

// Konfiguracja dla localStorage
export interface LayersStorageConfig {
  key: string
  saveExpandedCategories: boolean
  saveVisibleLayers: boolean
  saveActiveBaseLayer: boolean
  saveDrawerState: boolean
}

// Error types dla systemu warstw
export interface LayersError {
  type: 'layer_not_found' | 'invalid_layer' | 'mapbox_error' | 'storage_error'
  message: string
  layerId?: string
  originalError?: Error
}

// Kontekst dla udostępnienia stanu warstw
export interface LayersContextValue {
  layers: Layer[]
  treeState: LayersTreeState
  drawerState: DrawerState
  actions: {
    toggleLayer: (layerId: string) => void
    setBaseLayer: (layerId: string) => void
    toggleDrawer: () => void
    resetLayers: () => void
  }
}

// Typy dla search/filter funkcjonalności
export interface LayerFilter {
  type?: LayerType[]
  tags?: string[]
  visible?: boolean
  searchQuery?: string
}

export interface LayerSearchResult {
  layer: Layer
  category?: LayerCategory
  matchScore: number
  matchedFields: string[]
}

// TODO: Rozszerzyć o typy dla drag & drop warstw
// TODO: Dodać typy dla animacji warstw
// TODO: Dodać typy dla custom layer renderers