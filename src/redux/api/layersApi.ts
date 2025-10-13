// Layers API - RTK Query Implementation
// Migrated from src/api/endpointy/layers.ts
// Handles all layer operations: add, edit, delete, style, export, features

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Layer,
  AddGeoJsonLayerData,
  AddShpLayerData,
  UpdateLayerStyleData,
  LayerAttribute,
  ExportLayerOptions,
  LayerStyle,
} from '@/api/typy/types';

// ============================================================================
// Helper function to get auth token
// ============================================================================

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// ============================================================================
// Base query with auth headers
// ============================================================================

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online',
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    // Don't set Content-Type manually - let RTK Query handle it
    return headers;
  },
});

// ============================================================================
// Layers API Definition
// ============================================================================

export const layersApi = createApi({
  reducerPath: 'layersApi',
  baseQuery,
  tagTypes: ['Layer', 'Layers', 'Features', 'LayerAttributes', 'Project'],
  endpoints: (builder) => ({

    // ========================================================================
    // HIGH PRIORITY ENDPOINTS (Most Critical - Used Frequently)
    // ========================================================================

    /**
     * Add GeoJSON layer to project
     * Endpoint: POST /api/layer/add/geojson/
     * Priority: 🔴 High
     * Used by: FeatureEditor
     */
    addGeoJsonLayer: builder.mutation<
      { success: boolean; layer_name: string },
      AddGeoJsonLayerData
    >({
      query: (data) => {
        const formData = new FormData();
        formData.append('project_name', data.project_name);
        formData.append('layer_name', data.layer_name);

        // Handle both File and GeoJSON object
        if (data.geojson instanceof File) {
          formData.append('file', data.geojson);
        } else {
          const geojsonBlob = new Blob([JSON.stringify(data.geojson)], {
            type: 'application/json',
          });
          formData.append('file', geojsonBlob, `${data.layer_name}.geojson`);
        }

        if (data.epsg) {
          formData.append('epsg', data.epsg);
        }

        return {
          url: '/api/layer/add/geojson/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name }, // Invalidate project data to refetch tree.json
        { type: 'Layers', id: arg.project_name },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Add Shapefile layer to project
     * Endpoint: POST /api/layer/add/shp/
     * Priority: 🔴 High
     * Used by: CreateProjectDialog (SHP import tab)
     *
     * Backend expects:
     * - project: string (project_name)
     * - layer_name: string
     * - shp: File (required)
     * - shx: File (optional)
     * - dbf: File (optional)
     * - prj: File (optional)
     * - cpg: File (optional)
     * - qpj: File (optional)
     * - epsg: string (optional)
     * - encoding: string (optional)
     *
     * IMPORTANT: Backend saves file as "uploaded_layer.shp" in qgs/{project}/ folder
     * Multiple SHP files cannot be uploaded simultaneously - must be sequential!
     */
    addShapefileLayer: builder.mutation<
      { success: boolean; message?: string; data?: any },
      AddShpLayerData
    >({
      query: (data) => {
        const formData = new FormData();

        // Backend expects "project" not "project_name"
        formData.append('project', data.project);
        formData.append('layer_name', data.layer_name);

        // CRITICAL: Backend requires 'parent' field (can be empty string)
        formData.append('parent', data.parent || '');

        // Add required SHP file (backend renames to uploaded_layer.shp)
        formData.append('shp', data.shpFile);

        // Add optional supporting files
        if (data.shxFile) formData.append('shx', data.shxFile);
        if (data.dbfFile) formData.append('dbf', data.dbfFile);
        if (data.prjFile) formData.append('prj', data.prjFile);
        if (data.cpgFile) formData.append('cpg', data.cpgFile);
        if (data.qpjFile) formData.append('qpj', data.qpjFile);

        // Optional parameters
        if (data.epsg) formData.append('epsg', data.epsg);
        if (data.encoding) formData.append('encoding', data.encoding);

        return {
          url: '/api/layer/add/shp/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project }, // Invalidate project data to refetch tree.json
        { type: 'Layers', id: arg.project },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Update layer style
     * Endpoint: POST /api/layer/style
     * Priority: 🔴 High
     * Used by: LayerProperties
     */
    updateLayerStyle: builder.mutation<
      { success: boolean },
      UpdateLayerStyleData
    >({
      query: (data) => ({
        url: '/api/layer/style',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.project_name}-${arg.layer_name}` },
        { type: 'Layers', id: arg.project_name },
      ],
    }),

    /**
     * Delete layer from project
     * Endpoint: POST /api/layer/remove/database
     * Priority: 🔴 High
     * Used by: LayerTree
     */
    deleteLayer: builder.mutation<
      { success: boolean },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/remove/database',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.projectName }, // Invalidate project data to refetch tree.json
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layers', id: arg.projectName },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Get layer attributes (columns)
     * Endpoint: POST /api/layer/attributes
     * Priority: 🔴 High
     * Used by: FeatureEditor
     */
    getLayerAttributes: builder.query<
      { attributes: LayerAttribute[] },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/attributes',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Set layer visibility
     * Endpoint: POST /api/layer/selection
     * Priority: 🔴 High
     * Used by: LayerTree
     */
    setLayerVisibility: builder.mutation<
      { success: boolean },
      { projectName: string; layerName: string; visible: boolean }
    >({
      query: ({ projectName, layerName, visible }) => ({
        url: '/api/layer/selection',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          visible,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get layer features as GeoJSON
     * Endpoint: POST /api/layer/features
     * Priority: 🔴 High
     * Used by: MapContainer
     */
    getFeatures: builder.query<
      GeoJSON.FeatureCollection,
      {
        projectName: string;
        layerName: string;
        options?: {
          bbox?: [number, number, number, number];
          filter?: string;
          limit?: number;
          offset?: number;
        };
      }
    >({
      query: ({ projectName, layerName, options }) => ({
        url: '/api/layer/features',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          ...options,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Add new feature to layer
     * Endpoint: POST /api/layer/feature/add
     * Priority: 🔴 High
     * Used by: DrawingTools
     */
    addFeature: builder.mutation<
      { success: boolean; feature_id: number },
      {
        projectName: string;
        layerName: string;
        feature: {
          geometry: GeoJSON.Geometry;
          properties?: Record<string, any>;
        };
      }
    >({
      query: ({ projectName, layerName, feature }) => ({
        url: '/api/layer/feature/add',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          geometry: feature.geometry,
          properties: feature.properties || {},
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Update existing feature (geometry and/or attributes)
     * Endpoint: POST /api/layer/feature/update
     * Priority: 🔴 High
     * Used by: FeatureEditor
     */
    updateFeature: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        featureId: number;
        updates: {
          geometry?: GeoJSON.Geometry;
          properties?: Record<string, any>;
        };
      }
    >({
      query: ({ projectName, layerName, featureId, updates }) => ({
        url: '/api/layer/feature/update',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          feature_id: featureId,
          ...(updates.geometry && { geometry: updates.geometry }),
          ...(updates.properties && { properties: updates.properties }),
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Delete feature from layer
     * Endpoint: POST /api/layer/feature/delete
     * Priority: 🔴 High
     * Used by: FeatureEditor
     */
    deleteFeature: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        featureId: number;
      }
    >({
      query: ({ projectName, layerName, featureId }) => ({
        url: '/api/layer/feature/delete',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          feature_id: featureId,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    // ========================================================================
    // MEDIUM PRIORITY ENDPOINTS (Important but Less Frequent)
    // ========================================================================

    /**
     * Add GML layer to project
     * Endpoint: POST /api/layer/add/gml/
     * Priority: 🟡 Medium
     * Used by: AddDatasetModal
     */
    addGMLLayer: builder.mutation<
      { success: boolean; layer_name: string },
      {
        projectName: string;
        layerName: string;
        file: File;
      }
    >({
      query: ({ projectName, layerName, file }) => {
        const formData = new FormData();
        formData.append('project_name', projectName);
        formData.append('layer_name', layerName);
        formData.append('file', file);

        return {
          url: '/api/layer/add/gml/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Layers', id: arg.projectName },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Reset layer style to default
     * Endpoint: POST /api/layer/style/reset
     * Priority: 🟡 Medium
     * Used by: LayerProperties
     */
    resetLayerStyle: builder.mutation<
      { success: boolean },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/style/reset',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get layer attribute names
     * Endpoint: POST /api/layer/attributes/names
     * Priority: 🟡 Medium
     */
    getAttributeNames: builder.query<
      { columns: string[] },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/attributes/names',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get layer attribute names and types
     * Endpoint: POST /api/layer/attributes/names_and_types
     * Priority: 🟡 Medium
     */
    getAttributeNamesAndTypes: builder.query<
      { columns: Array<{ name: string; type: string }> },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/attributes/names_and_types',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Add column to layer
     * Endpoint: POST /api/layer/column/add
     * Priority: 🟡 Medium
     */
    addColumn: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        columnName: string;
        columnType: string;
      }
    >({
      query: ({ projectName, layerName, columnName, columnType }) => ({
        url: '/api/layer/column/add',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          column_name: columnName,
          column_type: columnType,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Rename column in layer
     * Endpoint: POST /api/layer/column/rename
     * Priority: 🟡 Medium
     */
    renameColumn: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        oldName: string;
        newName: string;
      }
    >({
      query: ({ projectName, layerName, oldName, newName }) => ({
        url: '/api/layer/column/rename',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          old_name: oldName,
          new_name: newName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Remove column from layer
     * Endpoint: POST /api/layer/column/remove
     * Priority: 🟡 Medium
     */
    removeColumn: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        columnName: string;
      }
    >({
      query: ({ projectName, layerName, columnName }) => ({
        url: '/api/layer/column/remove',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          column_name: columnName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Rename layer
     * Endpoint: POST /api/layer/name
     * Priority: 🟡 Medium
     */
    renameLayer: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        newName: string;
      }
    >({
      query: ({ projectName, layerName, newName }) => ({
        url: '/api/layer/name',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          new_name: newName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layers', id: arg.projectName },
      ],
    }),

    /**
     * Export layer to various formats
     * Endpoint: GET /layer/export
     * Priority: 🟡 Medium
     * Note: Uses direct fetch due to Blob response
     */
    exportLayer: builder.mutation<
      Blob,
      {
        projectName: string;
        layerName: string;
        options?: ExportLayerOptions;
      }
    >({
      queryFn: async ({ projectName, layerName, options }, _api, _extraOptions, baseQuery) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        const params = new URLSearchParams({
          project_name: projectName,
          layer_name: layerName,
          ...(options?.format && { format: options.format }),
          ...(options?.epsg && { epsg: options.epsg }),
          ...(options?.filter && { filter: options.filter }),
          ...(options?.selected_only && { selected_only: options.selected_only.toString() }),
        });

        try {
          const response = await fetch(`${baseUrl}/layer/export?${params}`, {
            method: 'GET',
            headers: {
              ...(token && { Authorization: `Token ${token}` }),
            },
          });

          if (!response.ok) {
            return { error: { status: response.status, data: `Export failed: ${response.statusText}` } };
          }

          const blob = await response.blob();
          return { data: blob };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', data: error.message } };
        }
      },
    }),

    /**
     * Batch update multiple features
     * Endpoint: POST /api/layer/multipleSaving
     * Priority: 🟡 Medium
     */
    batchUpdateFeatures: builder.mutation<
      { success: boolean; updated_count: number },
      {
        projectName: string;
        layerName: string;
        features: Array<{
          feature_id: number;
          geometry?: GeoJSON.Geometry;
          properties?: Record<string, any>;
        }>;
      }
    >({
      query: ({ projectName, layerName, features }) => ({
        url: '/api/layer/multipleSaving',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          features,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get layer geometry type and bounds
     * Endpoint: POST /api/layer/geometry
     * Priority: 🟡 Medium
     */
    getGeometry: builder.query<
      {
        geometry_type: string;
        bounds: [number, number, number, number];
        feature_count: number;
      },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/geometry',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Add label to layer
     * Endpoint: POST /api/layer/label
     * Priority: 🟡 Medium
     */
    addLabel: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        labelConfig: {
          field: string;
          size?: number;
          color?: string;
          font?: string;
        };
      }
    >({
      query: ({ projectName, layerName, labelConfig }) => ({
        url: '/api/layer/label',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          ...labelConfig,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Remove label from layer
     * Endpoint: POST /api/layer/label/remove
     * Priority: 🟡 Medium
     */
    removeLabel: builder.mutation<
      { success: boolean },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/label/remove',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get column values (for filtering/classification)
     * Endpoint: POST /api/layer/column/values
     * Priority: 🟡 Medium
     */
    getColumnValues: builder.query<
      { values: Array<string | number> },
      {
        projectName: string;
        layerName: string;
        columnName: string;
        options?: {
          unique?: boolean;
          limit?: number;
        };
      }
    >({
      query: ({ projectName, layerName, columnName, options }) => ({
        url: '/api/layer/column/values',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          column_name: columnName,
          ...options,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    // ========================================================================
    // LOW PRIORITY ENDPOINTS (Rarely Used)
    // ========================================================================

    /**
     * Add existing layer from database
     * Endpoint: POST /api/layer/add/existing
     * Priority: 🟢 Low
     */
    addExistingLayer: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        tableName: string;
      }
    >({
      query: ({ projectName, layerName, tableName }) => ({
        url: '/api/layer/add/existing',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          table_name: tableName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layers', id: arg.projectName },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Clone layer
     * Endpoint: POST /api/layer/clone
     * Priority: 🟢 Low
     */
    cloneLayer: builder.mutation<
      { success: boolean; layer_name: string },
      {
        projectName: string;
        layerName: string;
        newLayerName: string;
      }
    >({
      query: ({ projectName, layerName, newLayerName }) => ({
        url: '/api/layer/clone',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          new_layer_name: newLayerName,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layers', id: arg.projectName },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Get feature coordinates
     * Endpoint: POST /api/layer/feature/coordinates
     * Priority: 🟢 Low
     */
    getFeatureCoordinates: builder.query<
      { coordinates: GeoJSON.Position[] },
      {
        projectName: string;
        layerName: string;
        featureId: number;
      }
    >({
      query: ({ projectName, layerName, featureId }) => ({
        url: '/api/layer/feature/coordinates',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          feature_id: featureId,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Check layer geometry validity
     * Endpoint: POST /api/layer/geometry/check
     * Priority: 🟢 Low
     */
    checkGeometry: builder.query<
      {
        valid: boolean;
        invalid_count: number;
        issues: Array<{ feature_id: number; reason: string }>;
      },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/geometry/check',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Get layer validation details
     * Endpoint: POST /api/layer/validation/details
     * Priority: 🟢 Low
     */
    getValidationDetails: builder.query<
      {
        invalid_geometries: Array<{
          fid: number;
          error: string;
          geometry: GeoJSON.Geometry;
        }>;
      },
      { projectName: string; layerName: string }
    >({
      query: ({ projectName, layerName }) => ({
        url: '/api/layer/validation/details',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    // ========================================================================
    // NEW ENDPOINTS - Backend Compatibility (2025-01-13)
    // ========================================================================

    /**
     * WFS Transaction - Add/Update/Delete features using WFS-T
     * Endpoint: POST /api/layer/transaction/
     * Priority: 🔴 High
     * Used for feature editing when dedicated endpoints are not available
     */
    wfsTransaction: builder.mutation<
      { success: boolean; message?: string },
      {
        projectName: string;
        layerName: string;
        transactionXml: string;
      }
    >({
      query: ({ projectName, layerName, transactionXml }) => ({
        url: '/api/layer/transaction/',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          transaction_xml: transactionXml,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Add raster layer (TIFF, GeoTIFF, etc.)
     * Endpoint: POST /api/layer/add/raster/
     * Priority: 🟡 Medium
     */
    addRasterLayer: builder.mutation<
      { success: boolean; layer_name: string },
      {
        projectName: string;
        layerName: string;
        file: File;
        epsg?: string;
      }
    >({
      query: ({ projectName, layerName, file, epsg }) => {
        const formData = new FormData();
        formData.append('project_name', projectName);
        formData.append('layer_name', layerName);
        formData.append('file', file);
        if (epsg) formData.append('epsg', epsg);

        return {
          url: '/api/layer/add/raster/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.projectName },
        { type: 'Layers', id: arg.projectName },
        { type: 'Layers', id: 'LIST' },
      ],
    }),

    /**
     * Set layer opacity
     * Endpoint: POST /api/layer/opacity/set
     * Priority: 🟡 Medium
     */
    setLayerOpacity: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        opacity: number; // 0-100
      }
    >({
      query: ({ projectName, layerName, opacity }) => ({
        url: '/api/layer/opacity/set',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          opacity,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Set layer scale-dependent visibility
     * Endpoint: POST /api/layer/scale
     * Priority: 🟡 Medium
     */
    setLayerScale: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        minScale?: number;
        maxScale?: number;
      }
    >({
      query: ({ projectName, layerName, minScale, maxScale }) => ({
        url: '/api/layer/scale',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          ...(minScale && { min_scale: minScale }),
          ...(maxScale && { max_scale: maxScale }),
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Set layer published status
     * Endpoint: POST /api/layer/published/set
     * Priority: 🟡 Medium
     */
    setLayerPublished: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        published: boolean;
      }
    >({
      query: ({ projectName, layerName, published }) => ({
        url: '/api/layer/published/set',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          published,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Layer', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

    /**
     * Remove multiple columns at once
     * Endpoint: POST /api/layer/columns/remove
     * Priority: 🟢 Low
     */
    removeColumns: builder.mutation<
      { success: boolean },
      {
        projectName: string;
        layerName: string;
        columnNames: string[];
      }
    >({
      query: ({ projectName, layerName, columnNames }) => ({
        url: '/api/layer/columns/remove',
        method: 'POST',
        body: {
          project_name: projectName,
          layer_name: layerName,
          column_names: columnNames,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LayerAttributes', id: `${arg.projectName}-${arg.layerName}` },
        { type: 'Features', id: `${arg.projectName}-${arg.layerName}` },
      ],
    }),

  }),
});

// ============================================================================
// Export Hooks
// ============================================================================

// High Priority Hooks (10 endpoints)
export const {
  useAddGeoJsonLayerMutation,
  useAddShapefileLayerMutation,
  useUpdateLayerStyleMutation,
  useDeleteLayerMutation,
  useGetLayerAttributesQuery,
  useSetLayerVisibilityMutation,
  useGetFeaturesQuery,
  useAddFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,

  // Medium Priority Hooks (18 endpoints)
  useAddGMLLayerMutation,
  useResetLayerStyleMutation,
  useGetAttributeNamesQuery,
  useGetAttributeNamesAndTypesQuery,
  useAddColumnMutation,
  useRenameColumnMutation,
  useRemoveColumnMutation,
  useRenameLayerMutation,
  useExportLayerMutation,
  useBatchUpdateFeaturesMutation,
  useGetGeometryQuery,
  useAddLabelMutation,
  useRemoveLabelMutation,
  useGetColumnValuesQuery,

  // Low Priority Hooks (7 endpoints)
  useAddExistingLayerMutation,
  useCloneLayerMutation,
  useGetFeatureCoordinatesQuery,
  useCheckGeometryQuery,
  useGetValidationDetailsQuery,
  useRemoveColumnsMutation,

  // New Endpoints - Backend Compatibility (6 endpoints)
  useWfsTransactionMutation,
  useAddRasterLayerMutation,
  useSetLayerOpacityMutation,
  useSetLayerScaleMutation,
  useSetLayerPublishedMutation,
} = layersApi;
