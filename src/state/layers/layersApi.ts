/**
 * RTK Query API for Layer Management
 * Handles communication with backend layer services
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { LayerNode, LayerUpdateRequest, LayerReorderRequest } from './types'

export const layersApi = createApi({
  reducerPath: 'layersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/layers',
    prepareHeaders: (headers) => {
      // Add auth headers if needed
      // headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['LayerTree', 'LayerSettings', 'ProjectProperties'],
  endpoints: (builder) => ({
    // Get complete layer tree
    getLayersTree: builder.query<LayerNode[], void>({
      query: () => '/tree',
      providesTags: ['LayerTree'],
      // Transform response if needed
      transformResponse: (response: any) => {
        // Ensure proper structure and defaults
        const processNode = (node: any): LayerNode => ({
          id: node.id,
          name: node.name,
          type: node.type,
          visible: node.visible ?? true,
          opacity: node.opacity ?? 1,
          children: node.children?.map(processNode),
          legendUrl: node.legendUrl,
          source: node.source,
          meta: node.meta,
          minZoom: node.minZoom,
          maxZoom: node.maxZoom,
          order: node.order
        })

        return Array.isArray(response) ? response.map(processNode) : []
      }
    }),

    // Update layer visibility
    updateLayerVisibility: builder.mutation<void, { id: string; visible: boolean }>({
      query: ({ id, visible }) => ({
        url: '/visibility',
        method: 'POST',
        body: { id, visible }
      }),
      // Optimistic update
      async onQueryStarted({ id, visible }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          layersApi.util.updateQueryData('getLayersTree', undefined, (draft) => {
            const updateNode = (nodes: LayerNode[]): void => {
              for (const node of nodes) {
                if (node.id === id) {
                  node.visible = visible
                  return
                }
                if (node.children) {
                  updateNode(node.children)
                }
              }
            }
            updateNode(draft)
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: ['LayerTree']
    }),

    // Update layer opacity
    updateLayerOpacity: builder.mutation<void, { id: string; opacity: number }>({
      query: ({ id, opacity }) => ({
        url: '/opacity',
        method: 'POST',
        body: { id, opacity }
      }),
      // Optimistic update
      async onQueryStarted({ id, opacity }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          layersApi.util.updateQueryData('getLayersTree', undefined, (draft) => {
            const updateNode = (nodes: LayerNode[]): void => {
              for (const node of nodes) {
                if (node.id === id) {
                  node.opacity = opacity
                  return
                }
                if (node.children) {
                  updateNode(node.children)
                }
              }
            }
            updateNode(draft)
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: ['LayerTree']
    }),

    // Update multiple layer properties
    updateLayer: builder.mutation<LayerNode, LayerUpdateRequest>({
      query: (layerUpdate) => ({
        url: `/${layerUpdate.id}`,
        method: 'PATCH',
        body: layerUpdate
      }),
      invalidatesTags: ['LayerTree', 'LayerSettings']
    }),

    // Reorder layers
    reorderLayers: builder.mutation<void, LayerReorderRequest>({
      query: (reorderRequest) => ({
        url: '/reorder',
        method: 'POST',
        body: reorderRequest
      }),
      // Optimistic update
      async onQueryStarted({ parentId, orderedIds }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          layersApi.util.updateQueryData('getLayersTree', undefined, (draft) => {
            const reorderNodes = (nodes: LayerNode[]): void => {
              for (const node of nodes) {
                if (node.id === parentId && node.children) {
                  const reorderedChildren = orderedIds
                    .map(id => node.children?.find(child => child.id === id))
                    .filter(Boolean) as LayerNode[]

                  node.children = reorderedChildren
                  return
                }
                if (node.children) {
                  reorderNodes(node.children)
                }
              }
            }

            if (parentId === null) {
              // Reorder root level
              const reordered = orderedIds
                .map(id => draft.find(node => node.id === id))
                .filter(Boolean) as LayerNode[]

              draft.splice(0, draft.length, ...reordered)
            } else {
              reorderNodes(draft)
            }
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: ['LayerTree']
    }),

    // Add new layer
    addLayer: builder.mutation<LayerNode, Partial<LayerNode> & { parentId?: string }>({
      query: ({ parentId, ...layer }) => ({
        url: '/add',
        method: 'POST',
        body: { ...layer, parentId }
      }),
      invalidatesTags: ['LayerTree']
    }),

    // Add new group
    addGroup: builder.mutation<LayerNode, { name: string; parentId?: string }>({
      query: (group) => ({
        url: '/add-group',
        method: 'POST',
        body: group
      }),
      invalidatesTags: ['LayerTree']
    }),

    // Delete layer or group
    deleteLayer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['LayerTree']
    }),

    // Get layer settings/properties
    getLayerSettings: builder.query<LayerNode, string>({
      query: (id) => `/settings/${id}`,
      providesTags: (result, error, id) => [{ type: 'LayerSettings', id }]
    }),

    // Export layer configuration
    exportLayerConfig: builder.mutation<Blob, { format: 'json' | 'xml' | 'qgis' }>({
      query: ({ format }) => ({
        url: `/export?format=${format}`,
        method: 'GET',
        responseHandler: (response) => response.blob()
      })
    }),

    // Import layer configuration
    importLayerConfig: builder.mutation<LayerNode[], FormData>({
      query: (formData) => ({
        url: '/import',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: ['LayerTree']
    }),

    // Reset all layers to default
    resetLayers: builder.mutation<LayerNode[], void>({
      query: () => ({
        url: '/reset',
        method: 'POST'
      }),
      invalidatesTags: ['LayerTree']
    }),

    // Search layers
    searchLayers: builder.query<LayerNode[], string>({
      query: (searchQuery) => `/search?q=${encodeURIComponent(searchQuery)}`,
      // Only trigger if search query is not empty
      skip: (searchQuery) => !searchQuery.trim()
    }),

    // Get layer legend
    getLayerLegend: builder.query<string, string>({
      query: (layerId) => `/legend/${layerId}`,
      // Cache legend URLs for 5 minutes
      keepUnusedDataFor: 300
    }),

    // Get layer attributes (for WFS layers)
    getLayerAttributes: builder.query<Record<string, any>[], string>({
      query: (layerId) => `/attributes/${layerId}`,
      providesTags: (result, error, layerId) => [{ type: 'LayerSettings', id: layerId }]
    }),

    // Get project properties
    getProjectProperties: builder.query<Record<string, any>, void>({
      query: () => '/project/properties',
      providesTags: ['ProjectProperties']
    }),

    // Update project properties
    updateProjectProperties: builder.mutation<void, Record<string, any>>({
      query: (properties) => ({
        url: '/project/properties',
        method: 'POST',
        body: properties
      }),
      invalidatesTags: ['ProjectProperties']
    })
  })
})

export const {
  useGetLayersTreeQuery,
  useUpdateLayerVisibilityMutation,
  useUpdateLayerOpacityMutation,
  useUpdateLayerMutation,
  useReorderLayersMutation,
  useAddLayerMutation,
  useAddGroupMutation,
  useDeleteLayerMutation,
  useGetLayerSettingsQuery,
  useExportLayerConfigMutation,
  useImportLayerConfigMutation,
  useResetLayersMutation,
  useSearchLayersQuery,
  useGetLayerLegendQuery,
  useGetLayerAttributesQuery,
  useGetProjectPropertiesQuery,
  useUpdateProjectPropertiesMutation
} = layersApi