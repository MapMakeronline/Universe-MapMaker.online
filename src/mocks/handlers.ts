/**
 * MSW Mock Handlers for Layer Management API
 * Provides mock endpoints for development and testing
 */

import { http, HttpResponse } from 'msw'
import { LayerNode } from '../state/layers/types'

// Mock layer tree data
const mockLayerTree: LayerNode[] = [
  {
    id: 'base-layers',
    name: 'Warstwy bazowe',
    type: 'group',
    visible: true,
    children: [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        type: 'raster',
        visible: true,
        opacity: 1,
        order: 1,
        source: {
          wms: {
            url: 'https://tile.openstreetmap.org',
            layer: 'osm'
          }
        },
        legendUrl: 'https://example.com/osm-legend.png'
      },
      {
        id: 'satellite',
        name: 'Satelita',
        type: 'raster',
        visible: false,
        opacity: 0.8,
        order: 2,
        minZoom: 0,
        maxZoom: 18
      },
      {
        id: 'terrain',
        name: 'Teren',
        type: 'raster',
        visible: false,
        opacity: 0.9,
        order: 3
      }
    ]
  },
  {
    id: 'data-layers',
    name: 'Warstwy danych',
    type: 'group',
    visible: true,
    children: [
      {
        id: 'transport',
        name: 'Transport',
        type: 'group',
        visible: true,
        children: [
          {
            id: 'roads',
            name: 'Drogi',
            type: 'wms',
            visible: false,
            opacity: 0.7,
            order: 1,
            minZoom: 8,
            maxZoom: 22,
            source: {
              wms: {
                url: 'https://example.com/wms',
                layer: 'roads',
                format: 'image/png',
                tiled: true
              }
            },
            legendUrl: 'https://example.com/roads-legend.png'
          },
          {
            id: 'railways',
            name: 'Koleje',
            type: 'wfs',
            visible: true,
            opacity: 1,
            order: 2,
            source: {
              wfs: {
                url: 'https://example.com/wfs',
                typeName: 'railways'
              }
            }
          },
          {
            id: 'airports',
            name: 'Lotniska',
            type: 'vector',
            visible: false,
            opacity: 0.8,
            order: 3
          }
        ]
      },
      {
        id: 'boundaries',
        name: 'Granice administracyjne',
        type: 'group',
        visible: true,
        children: [
          {
            id: 'countries',
            name: 'Państwa',
            type: 'mvt',
            visible: true,
            opacity: 0.6,
            order: 1,
            source: {
              mvt: {
                url: 'https://example.com/mvt/countries/{z}/{x}/{y}.pbf'
              }
            },
            legendUrl: 'https://example.com/countries-legend.png'
          },
          {
            id: 'provinces',
            name: 'Województwa',
            type: 'wms',
            visible: false,
            opacity: 0.5,
            order: 2,
            source: {
              wms: {
                url: 'https://example.com/wms',
                layer: 'provinces'
              }
            }
          }
        ]
      },
      {
        id: 'poi',
        name: 'Punkty zainteresowania',
        type: 'group',
        visible: false,
        children: [
          {
            id: 'hospitals',
            name: 'Szpitale',
            type: 'wfs',
            visible: false,
            opacity: 1,
            order: 1,
            source: {
              wfs: {
                url: 'https://example.com/wfs',
                typeName: 'hospitals'
              }
            }
          },
          {
            id: 'schools',
            name: 'Szkoły',
            type: 'wfs',
            visible: false,
            opacity: 1,
            order: 2,
            source: {
              wfs: {
                url: 'https://example.com/wfs',
                typeName: 'schools'
              }
            }
          }
        ]
      }
    ]
  }
]

// Mock attributes data for WFS layers
const mockAttributes: Record<string, any[]> = {
  railways: [
    {
      id: 1,
      name: 'Warszawa Centralna - Kraków Główny',
      type: 'Magistrala',
      length: 292.5,
      electrified: 'Tak',
      maxSpeed: 160,
      operator: 'PKP PLK'
    },
    {
      id: 2,
      name: 'Warszawa Wschodnia - Białystok',
      type: 'Główna',
      length: 189.2,
      electrified: 'Tak',
      maxSpeed: 120,
      operator: 'PKP PLK'
    },
    {
      id: 3,
      name: 'Gdańsk Główny - Warszawa Centralna',
      type: 'Magistrala',
      length: 339.1,
      electrified: 'Tak',
      maxSpeed: 200,
      operator: 'PKP PLK'
    }
  ],
  hospitals: [
    {
      id: 1,
      name: 'Szpital Wojewódzki',
      address: 'ul. Główna 1, Warszawa',
      beds: 450,
      emergency: 'Tak',
      phone: '+48 22 123 45 67',
      specializations: 'Kardiologia, Neurologia, Chirurgia'
    },
    {
      id: 2,
      name: 'Centrum Medyczne',
      address: 'ul. Zdrowa 15, Kraków',
      beds: 280,
      emergency: 'Nie',
      phone: '+48 12 987 65 43',
      specializations: 'Pediatria, Ginekologia'
    }
  ],
  schools: [
    {
      id: 1,
      name: 'Szkoła Podstawowa Nr 1',
      address: 'ul. Szkolna 5, Warszawa',
      students: 420,
      teachers: 28,
      type: 'Publiczna',
      grades: '1-8'
    },
    {
      id: 2,
      name: 'Liceum Ogólnokształcące im. A. Mickiewicza',
      address: 'ul. Edukacyjna 10, Kraków',
      students: 650,
      teachers: 45,
      type: 'Publiczna',
      grades: '1-3'
    }
  ]
}

let currentLayerTree = [...mockLayerTree]

// Helper function to find and update layer in tree
const updateLayerInTree = (
  tree: LayerNode[],
  layerId: string,
  updates: Partial<LayerNode>
): LayerNode[] => {
  return tree.map(node => {
    if (node.id === layerId) {
      return { ...node, ...updates }
    }
    if (node.children) {
      return {
        ...node,
        children: updateLayerInTree(node.children, layerId, updates)
      }
    }
    return node
  })
}

// Helper function to find layer by ID
const findLayerById = (tree: LayerNode[], layerId: string): LayerNode | null => {
  for (const node of tree) {
    if (node.id === layerId) return node
    if (node.children) {
      const found = findLayerById(node.children, layerId)
      if (found) return found
    }
  }
  return null
}

export const handlers = [
  // Get layer tree
  http.get('/api/layers/tree', () => {
    return HttpResponse.json(currentLayerTree)
  }),

  // Update layer visibility
  http.post('/api/layers/visibility', async ({ request }) => {
    const { id, visible } = await request.json() as { id: string; visible: boolean }

    currentLayerTree = updateLayerInTree(currentLayerTree, id, { visible })

    return HttpResponse.json({ success: true })
  }),

  // Update layer opacity
  http.post('/api/layers/opacity', async ({ request }) => {
    const { id, opacity } = await request.json() as { id: string; opacity: number }

    currentLayerTree = updateLayerInTree(currentLayerTree, id, { opacity })

    return HttpResponse.json({ success: true })
  }),

  // Update layer properties
  http.patch('/api/layers/:id', async ({ params, request }) => {
    const layerId = params.id as string
    const updates = await request.json() as Partial<LayerNode>

    currentLayerTree = updateLayerInTree(currentLayerTree, layerId, updates)

    const updatedLayer = findLayerById(currentLayerTree, layerId)
    return HttpResponse.json(updatedLayer)
  }),

  // Reorder layers
  http.post('/api/layers/reorder', async ({ request }) => {
    const { parentId, orderedIds } = await request.json() as {
      parentId: string | null;
      orderedIds: string[]
    }

    // For simplicity, just return success
    // In real implementation, would reorder the tree structure
    return HttpResponse.json({ success: true })
  }),

  // Add new layer
  http.post('/api/layers/add', async ({ request }) => {
    const layerData = await request.json() as Partial<LayerNode> & { parentId?: string }

    const newLayer: LayerNode = {
      id: `layer-${Date.now()}`,
      name: layerData.name || 'Nowa warstwa',
      type: layerData.type || 'vector',
      visible: layerData.visible ?? true,
      opacity: layerData.opacity ?? 1,
      ...layerData
    }

    // Add to appropriate parent or root
    if (layerData.parentId) {
      currentLayerTree = updateLayerInTree(currentLayerTree, layerData.parentId, {
        children: [
          ...(findLayerById(currentLayerTree, layerData.parentId)?.children || []),
          newLayer
        ]
      })
    } else {
      currentLayerTree.push(newLayer)
    }

    return HttpResponse.json(newLayer, { status: 201 })
  }),

  // Add new group
  http.post('/api/layers/add-group', async ({ request }) => {
    const { name, parentId } = await request.json() as { name: string; parentId?: string }

    const newGroup: LayerNode = {
      id: `group-${Date.now()}`,
      name,
      type: 'group',
      visible: true,
      children: []
    }

    if (parentId) {
      currentLayerTree = updateLayerInTree(currentLayerTree, parentId, {
        children: [
          ...(findLayerById(currentLayerTree, parentId)?.children || []),
          newGroup
        ]
      })
    } else {
      currentLayerTree.push(newGroup)
    }

    return HttpResponse.json(newGroup, { status: 201 })
  }),

  // Delete layer
  http.delete('/api/layers/:id', async ({ params }) => {
    const layerId = params.id as string

    const removeLayerFromTree = (tree: LayerNode[]): LayerNode[] => {
      return tree
        .filter(node => node.id !== layerId)
        .map(node => ({
          ...node,
          children: node.children ? removeLayerFromTree(node.children) : undefined
        }))
    }

    currentLayerTree = removeLayerFromTree(currentLayerTree)

    return HttpResponse.json({ success: true })
  }),

  // Get layer settings
  http.get('/api/layers/settings/:id', async ({ params }) => {
    const layerId = params.id as string
    const layer = findLayerById(currentLayerTree, layerId)

    if (!layer) {
      return HttpResponse.json({ error: 'Layer not found' }, { status: 404 })
    }

    return HttpResponse.json(layer)
  }),

  // Export layer configuration
  http.get('/api/layers/export', ({ request }) => {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'

    let content: string
    let mimeType: string

    switch (format) {
      case 'xml':
        content = `<?xml version="1.0" encoding="UTF-8"?>
<layers>
  <!-- Layer configuration would be here -->
</layers>`
        mimeType = 'application/xml'
        break
      case 'qgis':
        content = JSON.stringify({ layers: currentLayerTree }, null, 2)
        mimeType = 'application/json'
        break
      default:
        content = JSON.stringify(currentLayerTree, null, 2)
        mimeType = 'application/json'
    }

    return HttpResponse.text(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="layers.${format}"`
      }
    })
  }),

  // Import layer configuration
  http.post('/api/layers/import', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return HttpResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Simulate file processing
    try {
      const content = await file.text()
      const importedLayers = JSON.parse(content) as LayerNode[]

      // Replace current tree with imported data
      currentLayerTree = importedLayers

      return HttpResponse.json(currentLayerTree, { status: 201 })
    } catch (error) {
      return HttpResponse.json({ error: 'Invalid file format' }, { status: 400 })
    }
  }),

  // Reset layers
  http.post('/api/layers/reset', () => {
    currentLayerTree = [...mockLayerTree]
    return HttpResponse.json(currentLayerTree)
  }),

  // Search layers
  http.get('/api/layers/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    if (!query) {
      return HttpResponse.json([])
    }

    const searchInTree = (nodes: LayerNode[]): LayerNode[] => {
      const results: LayerNode[] = []

      for (const node of nodes) {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(node)
        }
        if (node.children) {
          results.push(...searchInTree(node.children))
        }
      }

      return results
    }

    const searchResults = searchInTree(currentLayerTree)
    return HttpResponse.json(searchResults)
  }),

  // Get layer legend
  http.get('/api/layers/legend/:id', async ({ params }) => {
    const layerId = params.id as string
    const layer = findLayerById(currentLayerTree, layerId)

    if (!layer || !layer.legendUrl) {
      return HttpResponse.json({ error: 'Legend not found' }, { status: 404 })
    }

    return HttpResponse.json({ url: layer.legendUrl })
  }),

  // Get layer attributes
  http.get('/api/layers/attributes/:id', async ({ params }) => {
    const layerId = params.id as string
    const layer = findLayerById(currentLayerTree, layerId)

    if (!layer) {
      return HttpResponse.json({ error: 'Layer not found' }, { status: 404 })
    }

    // Return mock attributes for WFS layers
    if (layer.type === 'wfs' && mockAttributes[layerId]) {
      return HttpResponse.json(mockAttributes[layerId])
    }

    // Return empty array for other layer types
    return HttpResponse.json([])
  }),

  // Get project properties
  http.get('/api/layers/project/properties', () => {
    return HttpResponse.json({
      name: 'Projekt mapy',
      description: 'Przykładowy projekt z warstwami geograficznymi',
      baseLayer: 'osm',
      clustering: true,
      popups: true,
      mapOpacity: 1,
      bounds: {
        north: 54.8,
        south: 49.0,
        east: 24.15,
        west: 14.12
      },
      center: {
        lat: 52.237049,
        lng: 21.017532
      },
      zoom: 6
    })
  }),

  // Update project properties
  http.post('/api/layers/project/properties', async ({ request }) => {
    const properties = await request.json()

    // In a real implementation, would save to database
    return HttpResponse.json({ success: true })
  })
]