/**
 * Layers Module - RTK Query API
 *
 * Endpoints for layer management, import, and styling:
 * - addShpLayer: Import Shapefile (.shp + .shx + .dbf + .prj)
 * - addGeoJsonLayer: Import GeoJSON
 * - addGmlLayer: Import GML
 * - addRasterLayer: Import TIF/GeoTIFF
 * - setLayerVisibility: Toggle layer visibility (show/hide)
 * - identifyFeature: Query features at point or bbox
 * - deleteLayer: Remove layers from project (POST /api/layer/remove/database)
 * - getLayerAttributes: Get attribute column names and record count
 * - importLayerStyle: Import QML/SLD style file
 * - addLabel: Add labels to layer based on column values
 *
 * All imports use multipart/form-data for file uploads.
 * Documentation: docs/backend/layer_api_docs.md
 */

import { baseApi } from '../client/base-api';
import type { Layer } from '../types';

/**
 * Response from layer add/import endpoints
 */
interface AddLayerResponse {
  data: {
    id: string;
    name: string;
    type: string;
    extent?: [number, number, number, number];
    database?: {
      used: number;
      total: number;
    };
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for Shapefile import
 */
interface AddShpLayerParams {
  project: string;
  layer_name: string;
  parent?: string;
  epsg?: number;
  encoding?: string;
}

/**
 * Parameters for GeoJSON import
 */
interface AddGeoJsonLayerParams {
  project: string;
  layer_name: string;
  parent?: string;
}

/**
 * Parameters for GML import
 */
interface AddGmlLayerParams {
  project: string;
  layer_name: string;
  parent?: string;
  epsg?: number;
}

/**
 * Parameters for Raster (TIF/GeoTIFF) import
 */
interface AddRasterLayerParams {
  project: string;
  layer_name: string;
  parent?: string;
}

/**
 * Parameters for setting layer visibility
 */
interface SetLayerVisibilityParams {
  project: string;
  layer_id: string;
  checked: boolean;
  layers?: string[]; // Additional layer IDs
}

/**
 * Response from visibility change
 */
interface SetVisibilityResponse {
  data: string;
  success: boolean;
  message: string;
}

/**
 * Parameters for identify/query feature coordinates
 */
interface IdentifyFeatureParams {
  project: string;
  layer_id: string;
  point?: [number, number]; // [lon, lat]
  bbox?: [number, number][];  // [[lon1, lat1], [lon2, lat2], ...]
  layer_type: 'point' | 'line' | 'polygon';
}

/**
 * Response from identify feature coordinates
 */
interface IdentifyFeatureResponse {
  data: {
    coordinates: any[];
    features: any[];
  };
  success: boolean;
  message: string;
}

export const layersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Import Shapefile
     * POST /api/layer/add/shp/
     * Requires: .shp, .shx, .dbf, .prj files
     */
    addShpLayer: builder.mutation<AddLayerResponse, { params: AddShpLayerParams; files: FormData }>({
      query: ({ params, files }) => {
        // Add parameters to FormData
        const formData = files;
        formData.append('project', params.project);
        formData.append('layer_name', params.layer_name);
        // IMPORTANT: Backend REQUIRES 'parent' field (despite docs saying optional)
        // Send empty string for root-level layers
        formData.append('parent', params.parent || '');
        if (params.epsg) formData.append('epsg', params.epsg.toString());
        if (params.encoding) formData.append('encoding', params.encoding);

        // DEBUG: Log all FormData entries
        console.log('🔍 RTK Query - Sending FormData to /api/layer/add/shp/:');
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }

        return {
          url: '/api/layer/add/shp/',
          method: 'POST',
          body: formData,
          // RTK Query automatically sets Content-Type: multipart/form-data for FormData
        };
      },
      // Invalidate QGIS tag to trigger tree.json refetch
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

    /**
     * Import GeoJSON
     * POST /api/layer/add/geojson/
     * Requires: .geojson or .json file
     */
    addGeoJsonLayer: builder.mutation<AddLayerResponse, { params: AddGeoJsonLayerParams; files: FormData }>({
      query: ({ params, files }) => {
        const formData = files;
        formData.append('project', params.project);
        formData.append('layer_name', params.layer_name);
        // IMPORTANT: Backend REQUIRES 'parent' field (despite docs saying optional)
        formData.append('parent', params.parent || '');

        return {
          url: '/api/layer/add/geojson/',
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate QGIS tag to trigger tree.json refetch
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

    /**
     * Import GML
     * POST /api/layer/add/gml/
     * Requires: .gml file
     */
    addGmlLayer: builder.mutation<AddLayerResponse, { params: AddGmlLayerParams; files: FormData }>({
      query: ({ params, files }) => {
        const formData = files;
        formData.append('project', params.project);
        formData.append('layer_name', params.layer_name);
        // IMPORTANT: Backend REQUIRES 'parent' field (despite docs saying optional)
        formData.append('parent', params.parent || '');
        if (params.epsg) formData.append('epsg', params.epsg.toString());

        return {
          url: '/api/layer/add/gml/',
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate QGIS tag to trigger tree.json refetch
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

    /**
     * Import Raster (TIF/GeoTIFF)
     * POST /api/layer/add/raster/
     * Requires: .tif or .tiff file
     * Backend automatically reprojects to EPSG:3857 and optimizes
     */
    addRasterLayer: builder.mutation<AddLayerResponse, { params: AddRasterLayerParams; files: FormData }>({
      query: ({ params, files }) => {
        const formData = files;
        formData.append('project', params.project);
        formData.append('layer_name', params.layer_name);
        // IMPORTANT: Backend REQUIRES 'parent' field (despite docs saying optional)
        formData.append('parent', params.parent || '');

        return {
          url: '/api/layer/add/raster/',
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate QGIS tag to trigger tree.json refetch
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

    /**
     * Set Layer Visibility
     * POST /api/layer/selection
     * Toggles layer visibility (show/hide)
     *
     * IMPORTANT: Backend requires 'layers' array to be non-empty.
     * We send the toggled layer_id in the array.
     */
    setLayerVisibility: builder.mutation<SetVisibilityResponse, SetLayerVisibilityParams>({
      query: (params) => ({
        url: '/api/layer/selection',
        method: 'POST',
        body: {
          project: params.project,
          layer_id: params.layer_id,
          checked: params.checked,
          // Backend validation requires layers array to be non-empty
          // Send the layer_id in the array (additional layers can be added via params.layers)
          layers: params.layers && params.layers.length > 0
            ? params.layers
            : [params.layer_id],
        },
      }),
      // Invalidate project data to trigger re-fetch of tree.json with updated visibility
      // IMPORTANT: Use 'QGIS' tag - getProjectData uses 'QGIS' tag
      invalidatesTags: (result, error, arg) => [
        { type: 'QGIS', id: arg.project },
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),

    /**
     * Identify Feature Coordinates
     * POST /api/layer/feature/coordinates
     * Query features at a specific point or bbox
     *
     * Backend endpoint: /api/layer/feature/coordinates
     * Documentation: docs/backend/layer_api_docs.md (lines 1575-1620)
     *
     * Use cases:
     * - Click on map to identify features
     * - Query features by point [lon, lat]
     * - Query features by bbox [[lon1, lat1], [lon2, lat2], ...]
     */
    identifyFeature: builder.mutation<IdentifyFeatureResponse, IdentifyFeatureParams>({
      query: (params) => ({
        url: '/api/layer/feature/coordinates',
        method: 'POST',
        body: {
          project: params.project,
          layer_id: params.layer_id,
          point: params.point,
          bbox: params.bbox,
          layer_type: params.layer_type,
        },
      }),
      // No cache invalidation needed - this is a read-only query
    }),

    /**
     * Delete Layer
     * POST /api/layer/remove/database
     * Removes layers from project and optionally from database
     *
     * Backend endpoint: /api/layer/remove/database
     * Documentation: docs/backend/layer_api_docs.md (lines 271-331)
     */
    deleteLayer: builder.mutation<{
      data: { used: number; total: number };
      success: boolean;
      message: string;
    }, {
      project: string;
      layers: Array<{ id: string | null; source_table: string }>;
    }>({
      query: (params) => ({
        url: '/api/layer/remove/database',
        method: 'POST',
        body: params,
      }),
      // Invalidate cache after deletion
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

    /**
     * Get Layer Attributes
     * GET /api/layer/attributes/names
     * Retrieves list of attribute column names and record count
     *
     * Backend endpoint: /api/layer/attributes/names
     * Documentation: docs/backend/layer_api_docs.md (lines 1266-1304)
     *
     * Response:
     * {
     *   data: {
     *     feature_names: ["gid", "nazwa", "powierzchnia", "geom"],
     *     layer_id: "layer_123",
     *     record_count: 150
     *   },
     *   success: boolean,
     *   message: string
     * }
     */
    getLayerAttributes: builder.query<{
      data: {
        feature_names: string[];
        layer_id: string;
        record_count: number;
      };
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
    }>({
      query: ({ project, layer_id }) => ({
        url: '/api/layer/attributes/names',
        params: { project, layer_id },
      }),
      // Cache by layer_id
      providesTags: (result, error, { layer_id }) => [
        { type: 'LayerAttributes', id: layer_id },
      ],
    }),

    /**
     * Import Layer Style (QML/SLD)
     * POST /api/layer/style/add
     * Imports style from QML or SLD file
     *
     * Backend endpoint: /api/layer/style/add
     * Documentation: docs/backend/layer_api_docs.md (lines 820-856)
     *
     * Files:
     * - new_style.qml or new_style.sld (required)
     */
    importLayerStyle: builder.mutation<{
      data: { id: string; [key: string]: any };
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
      files: FormData; // Must contain new_style.qml or new_style.sld
    }>({
      query: ({ project, layer_id, files }) => {
        const formData = files;
        formData.append('project', project);
        formData.append('layer_id', layer_id);

        return {
          url: '/api/layer/style/add',
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate layer style and project data
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'LayerStyle', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),

    /**
     * Add Label to Layer
     * POST /api/layer/label
     * Adds labels to layer based on column values
     *
     * Backend endpoint: /api/layer/label
     * Documentation: docs/backend/layer_api_docs.md (lines 1685-1742)
     *
     * Features:
     * - Automatic white buffer around text for readability
     * - Centered labels for polygons
     * - Scale-based visibility
     */
    addLabel: builder.mutation<{
      data: string;
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
      textColor: [number, number, number, number]; // RGBA [0-255, 0-255, 0-255, 0-255]
      fontSize: number;
      minScale: number;
      maxScale: number;
      columnName: string;
    }>({
      query: (params) => ({
        url: '/api/layer/label',
        method: 'POST',
        body: params,
      }),
      // Invalidate project data to reflect label changes
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'LayerStyle', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useAddShpLayerMutation,
  useAddGeoJsonLayerMutation,
  useAddGmlLayerMutation,
  useAddRasterLayerMutation,
  useSetLayerVisibilityMutation,
  useIdentifyFeatureMutation,
  useDeleteLayerMutation,
  useGetLayerAttributesQuery,
  useLazyGetLayerAttributesQuery,
  useImportLayerStyleMutation,
  useAddLabelMutation,
} = layersApi;
