/**
 * Konfiguracja dostępnych warstw mapy
 * Struktura drzewa z kategoriami i podkategoriami
 */

import { Layer, LayerCategory } from '../types/layers.types'

// Warstwy bazowe - tylko jedna może być aktywna na raz
export const baseLayers: Layer[] = [
  {
    id: 'streets',
    name: 'Ulice',
    type: 'base',
    visible: true,
    icon: '🗺️',
    mapboxStyle: 'mapbox://styles/mapbox/streets-v12',
    description: 'Standardowa mapa ulic z etykietami'
  },
  {
    id: 'satellite',
    name: 'Satelita',
    type: 'base',
    visible: false,
    icon: '🛰️',
    mapboxStyle: 'mapbox://styles/mapbox/satellite-v9',
    description: 'Zdjęcia satelitarne wysokiej rozdzielczości'
  },
  {
    id: 'outdoors',
    name: 'Na zewnątrz',
    type: 'base',
    visible: false,
    icon: '🏔️',
    mapboxStyle: 'mapbox://styles/mapbox/outdoors-v12',
    description: 'Mapa turystyczna z szlakami i topografią'
  },
  {
    id: 'dark',
    name: 'Ciemna',
    type: 'base',
    visible: false,
    icon: '🌙',
    mapboxStyle: 'mapbox://styles/mapbox/dark-v11',
    description: 'Ciemny motyw idealny na noc'
  }
]

// Warstwy danych - można włączać/wyłączać niezależnie
export const dataLayers: Layer[] = [
  // Transport
  {
    id: 'transport',
    name: 'Transport',
    type: 'category',
    visible: true,
    icon: '🚗',
    children: [
      {
        id: 'roads',
        name: 'Drogi',
        type: 'overlay',
        visible: false,
        icon: '🛣️',
        description: 'Sieć dróg krajowych i regionalnych',
        sourceId: 'roads-source',
        layerId: 'roads-layer'
      },
      {
        id: 'railways',
        name: 'Koleje',
        type: 'overlay',
        visible: false,
        icon: '🚂',
        description: 'Linie kolejowe i stacje',
        sourceId: 'railways-source',
        layerId: 'railways-layer'
      },
      {
        id: 'airports',
        name: 'Lotniska',
        type: 'overlay',
        visible: false,
        icon: '✈️',
        description: 'Międzynarodowe i krajowe lotniska',
        sourceId: 'airports-source',
        layerId: 'airports-layer'
      }
    ]
  },

  // Przyroda
  {
    id: 'nature',
    name: 'Przyroda',
    type: 'category',
    visible: true,
    icon: '🌳',
    children: [
      {
        id: 'parks',
        name: 'Parki',
        type: 'overlay',
        visible: false,
        icon: '🏞️',
        description: 'Parki narodowe i miejskie',
        sourceId: 'parks-source',
        layerId: 'parks-layer'
      },
      {
        id: 'forests',
        name: 'Lasy',
        type: 'overlay',
        visible: false,
        icon: '🌲',
        description: 'Obszary leśne i rezerwaty',
        sourceId: 'forests-source',
        layerId: 'forests-layer'
      },
      {
        id: 'water',
        name: 'Woda',
        type: 'overlay',
        visible: false,
        icon: '💧',
        description: 'Rzeki, jeziora i zbiorniki wodne',
        sourceId: 'water-source',
        layerId: 'water-layer'
      }
    ]
  },

  // Granice administracyjne
  {
    id: 'boundaries',
    name: 'Granice',
    type: 'category',
    visible: true,
    icon: '📍',
    children: [
      {
        id: 'cities',
        name: 'Miasta',
        type: 'overlay',
        visible: false,
        icon: '🏘️',
        description: 'Granice miast i gmin',
        sourceId: 'cities-source',
        layerId: 'cities-layer'
      },
      {
        id: 'voivodeships',
        name: 'Województwa',
        type: 'overlay',
        visible: false,
        icon: '🗺️',
        description: 'Granice województw',
        sourceId: 'voivodeships-source',
        layerId: 'voivodeships-layer'
      },
      {
        id: 'country',
        name: 'Kraju',
        type: 'overlay',
        visible: false,
        icon: '🇵🇱',
        description: 'Granica państwa',
        sourceId: 'country-source',
        layerId: 'country-layer'
      }
    ]
  }
]

// Funkcje pomocnicze do zarządzania warstwami

/**
 * Zwraca wszystkie warstwy w płaskiej strukturze
 */
export const getAllLayers = (): Layer[] => {
  const allLayers: Layer[] = [...baseLayers]

  dataLayers.forEach(category => {
    if (category.children) {
      allLayers.push(...category.children)
    }
  })

  return allLayers
}

/**
 * Znajduje warstwę po ID
 */
export const findLayerById = (layerId: string): Layer | undefined => {
  // Szukaj w warstwach bazowych
  const baseLayer = baseLayers.find(layer => layer.id === layerId)
  if (baseLayer) return baseLayer

  // Szukaj w kategoriach i ich dzieciach
  for (const category of dataLayers) {
    if (category.id === layerId) return category

    if (category.children) {
      const childLayer = category.children.find(child => child.id === layerId)
      if (childLayer) return childLayer
    }
  }

  return undefined
}

/**
 * Zwraca wszystkie widoczne warstwy overlay
 */
export const getVisibleOverlays = (): Layer[] => {
  return getAllLayers().filter(layer =>
    layer.type === 'overlay' && layer.visible
  )
}

/**
 * Zwraca aktywną warstwę bazową
 */
export const getActiveBaseLayer = (): Layer | undefined => {
  return baseLayers.find(layer => layer.visible)
}

/**
 * Struktura kategorii dla TreeView
 */
export const layerCategories: LayerCategory[] = [
  {
    id: 'base-layers',
    name: 'Warstwy bazowe',
    icon: '🗺️',
    layers: baseLayers,
    expanded: true
  },
  {
    id: 'data-layers',
    name: 'Warstwy danych',
    icon: '📊',
    layers: dataLayers,
    expanded: true
  }
]

// Konfiguracja domyślna
export const defaultLayersConfig = {
  activeBaseLayer: 'streets',
  visibleOverlays: [],
  expandedCategories: ['base-layers', 'data-layers']
}

console.log('[LAYERS] Konfiguracja warstw załadowana:', {
  baseLayers: baseLayers.length,
  dataCategories: dataLayers.length,
  totalOverlays: getAllLayers().filter(l => l.type === 'overlay').length
})