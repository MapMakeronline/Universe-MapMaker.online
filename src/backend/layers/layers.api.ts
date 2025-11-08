/**
 * Layers Module - RTK Query API
 *
 * Endpoints for layer management, import, and styling:
 * - addLayer: Create new empty vector layer (POST /api/layer/add)
 * - addShpLayer: Import Shapefile (.shp + .shx + .dbf + .prj)
 * - addGeoJsonLayer: Import GeoJSON
 * - addGmlLayer: Import GML
 * - addRasterLayer: Import TIF/GeoTIFF
 * - setLayerVisibility: Toggle layer visibility (show/hide)
 * - identifyFeature: Query features at point or bbox
 * - deleteLayer: Remove layers from project
 * - getLayerAttributes: Get attribute column names and record count
 * - importLayerStyle: Import QML/SLD style file
 * - addLabel: Add labels to layer based on column values
 * - renameLayer: Change layer name (POST /api/layer/name)
 * - setLayerOpacity: Set layer transparency 0-255 (POST /api/layer/opacity/set)
 * - setLayerScale: Set scale visibility range (POST /api/layer/scale)
 * - setLayerPublished: Set layer publish status (POST /api/layer/published/set)
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
 * Parameters for creating new empty vector layer
 * Backend endpoint: POST /api/layer/add
 * Documentation: docs/backend/layer_api_docs.md (lines 77-167)
 *
 * IMPORTANT: Backend serializer requires 'format' field (ValidateAddLayerSerializer)
 * even though it's not used in the actual logic. Use 'format: "vector"' for new layers.
 */
interface AddLayerParams {
  project: string;
  name: string;
  format: string; // Required by backend serializer, use "vector" for new empty layers
  geometry_type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  properties?: Array<{
    column_name: string;
    column_type: 1 | 2 | 4 | 6 | 10 | 14 | 16; // Boolean | Integer | Integer64 | Double | String | Date | DateTime
  }>;
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
 * Parameters for renaming layer
 * Backend endpoint: POST /api/layer/name
 * Documentation: docs/backend/layer_api_docs.md (lines 334-375)
 */
interface RenameLayerParams {
  project: string;
  layer_id: string;
  new_name: string;
}

/**
 * Response from rename layer
 */
interface RenameLayerResponse {
  data: {
    layer_name: string;
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for setting layer opacity
 * Backend endpoint: POST /api/layer/opacity/set
 * Documentation: docs/backend/layer_api_docs.md (lines 906-947)
 */
interface SetLayerOpacityParams {
  project: string;
  layer_id: string;
  opacity: number; // 0-255 (0 = transparent, 255 = opaque)
}

/**
 * Response from set opacity
 */
interface SetLayerOpacityResponse {
  data: {
    opacity: number;
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for setting layer visibility scale
 * Backend endpoint: POST /api/layer/scale
 * Documentation: docs/backend/layer_api_docs.md (lines 2388-2440)
 */
interface SetLayerScaleParams {
  project: string;
  layer_id: string;
  max_scale: number; // Maximum scale (e.g., 100)
  min_scale: number; // Minimum scale (e.g., 10000)
  turn_off?: boolean; // Turn off scale restriction
}

/**
 * Response from set scale
 */
interface SetLayerScaleResponse {
  data: {
    scale_visibility: boolean;
    max_scale: number;
    min_scale: number;
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for setting layer publish status
 * Backend endpoint: POST /api/layer/published/set
 * Documentation: docs/backend/layer_api_docs.md (lines 2689-2732)
 */
interface SetLayerPublishedParams {
  project: string;
  layer_id: string;
  published: boolean;
}

/**
 * Response from set published
 */
interface SetLayerPublishedResponse {
  data: {
    layer_id: string;
    published: boolean;
  };
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
     * Create New Empty Vector Layer
     * POST /api/layer/add
     * Creates a new empty vector layer with specified geometry type and optional columns
     *
     * Backend endpoint: /api/layer/add
     * Documentation: docs/backend/layer_api_docs.md (lines 77-167)
     *
     * Geometry Types:
     * - Point, LineString, Polygon
     * - MultiPoint, MultiLineString, MultiPolygon
     *
     * Column Types:
     * - 1 = Boolean
     * - 2 = Integer
     * - 4 = Integer64
     * - 6 = Double
     * - 10 = String
     * - 14 = Date
     * - 16 = DateTime
     */
    addLayer: builder.mutation<AddLayerResponse, AddLayerParams>({
      query: (params) => ({
        url: '/api/layer/add',
        method: 'POST',
        body: params,
      }),
      // Invalidate QGIS tag to trigger tree.json refetch
      invalidatesTags: ['Layers', 'Project', 'QGIS'],
    }),

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
     * Get Layer Attributes With Types
     * GET /api/layer/attributes
     * Retrieves all layer attributes with column names and types
     *
     * Backend endpoint: /api/layer/attributes
     * Documentation: docs/backend/layer_api_docs.md (lines 1363-1408)
     *
     * Response:
     * {
     *   data: {
     *     Types: {
     *       "gid": "Integer",
     *       "nazwa": "String",
     *       "powierzchnia": "Real"
     *     },
     *     Attributes: {
     *       "gid": [1, 2, 3, ...],
     *       "nazwa": ["Działka A", "Działka B", ...],
     *       "powierzchnia": [100.5, 250.3, ...]
     *     }
     *   },
     *   success: boolean,
     *   message: string
     * }
     */
    getLayerAttributesWithTypes: builder.query<{
      data: {
        Types: Record<string, string>;
        Attributes: Record<string, (string | number)[]>;
      };
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
    }>({
      query: ({ project, layer_id }) => ({
        url: '/api/layer/attributes',
        params: { project, layer_id },
      }),
      // Transform response if backend returns JSON as string
      transformResponse: (response: any) => {
        if (typeof response === 'string') {
          try {
            return JSON.parse(response);
          } catch (error) {
            console.error('Failed to parse layer attributes response:', error);
            return response;
          }
        }
        return response;
      },
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
     * - 'style' field (required) - QML or SLD file
     * Note: Backend expects field name 'style', not 'new_style.qml' or 'new_style.sld'
     */
    importLayerStyle: builder.mutation<{
      data: { id: string; [key: string]: any };
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
      files: FormData; // Must contain 'style' field with QML or SLD file
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

    /**
     * Rename Layer
     * POST /api/layer/name
     * Changes layer name in project
     *
     * Backend endpoint: /api/layer/name
     * Documentation: docs/backend/layer_api_docs.md (lines 334-375)
     */
    renameLayer: builder.mutation<RenameLayerResponse, RenameLayerParams>({
      query: (params) => ({
        url: '/api/layer/name',
        method: 'POST',
        body: params,
      }),
      // Invalidate cache after rename
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'Layer', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),

    /**
     * Set Layer Opacity
     * POST /api/layer/opacity/set
     * Changes layer transparency (0-255)
     *
     * Backend endpoint: /api/layer/opacity/set
     * Documentation: docs/backend/layer_api_docs.md (lines 906-947)
     *
     * Note: Opacity range is 0-255 (not 0-100%)
     * - 0 = fully transparent
     * - 255 = fully opaque
     */
    setLayerOpacity: builder.mutation<SetLayerOpacityResponse, SetLayerOpacityParams>({
      query: (params) => ({
        url: '/api/layer/opacity/set',
        method: 'POST',
        body: params,
      }),
      // Invalidate cache after opacity change
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'LayerStyle', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),

    /**
     * Set Layer Scale Visibility
     * POST /api/layer/scale
     * Sets scale range for layer visibility
     *
     * Backend endpoint: /api/layer/scale
     * Documentation: docs/backend/layer_api_docs.md (lines 2388-2440)
     *
     * Conditions:
     * - max_scale must be less than min_scale
     * - For layers with >10k features, min_scale cannot exceed 10000
     */
    setLayerScale: builder.mutation<SetLayerScaleResponse, SetLayerScaleParams>({
      query: (params) => ({
        url: '/api/layer/scale',
        method: 'POST',
        body: params,
      }),
      // Invalidate cache after scale change
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'Layer', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),

    /**
     * Get Column Values
     * GET /api/layer/column/values
     * Get all unique values from a column
     *
     * Backend endpoint: /api/layer/column/values
     * Documentation: docs/backend/layer_api_docs.md (lines 1452-1487)
     *
     * @example
     * const { data } = useGetColumnValuesQuery({
     *   project: 'moj_projekt',
     *   layer_id: 'dzialki_layer',
     *   column_name: 'obreb'
     * });
     * // data: ["0001", "0002", "0003"]
     */
    getColumnValues: builder.query<{
      data: (string | number)[];
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
      column_name: string;
    }>({
      query: ({ project, layer_id, column_name }) => ({
        url: '/api/layer/column/values',
        params: { project, layer_id, column_name },
      }),
      providesTags: (result, error, { layer_id, column_name }) => [
        { type: 'Layer', id: `${layer_id}-${column_name}` },
      ],
    }),

    /**
     * Set Layer Published Status
     * POST /api/layer/published/set
     * Sets whether layer is published
     *
     * Backend endpoint: /api/layer/published/set
     * Documentation: docs/backend/layer_api_docs.md (lines 2689-2732)
     */
    setLayerPublished: builder.mutation<SetLayerPublishedResponse, SetLayerPublishedParams>({
      query: (params) => ({
        url: '/api/layer/published/set',
        method: 'POST',
        body: params,
      }),
      // Invalidate cache after publish status change
      invalidatesTags: (result, error, { layer_id }) => [
        { type: 'Layer', id: layer_id },
        { type: 'Project', id: 'QGIS' },
        'Layers',
      ],
    }),

    /**
     * Get Layer Features (Row-Based)
     * GET /api/layer/features
     * Retrieves all layer features in row-based JSON format
     *
     * Backend endpoint: /api/layer/features
     * Documentation: User guide
     *
     * Response:
     * {
     *   data: [
     *     { gid: 1, nazwa: "Działka A", powierzchnia: 100.5 },
     *     { gid: 2, nazwa: "Działka B", powierzchnia: 250.3 }
     *   ],
     *   success: boolean,
     *   message: string
     * }
     *
     * IMPORTANT: This endpoint returns row-based data (easier for table display)
     * compared to getLayerAttributesWithTypes which returns column-based data.
     */
    getLayerFeatures: builder.query<{
      data: Array<Record<string, any>>;
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
      limit?: number; // Optional pagination limit
    }>({
      query: ({ project, layer_id, limit }) => ({
        url: '/api/layer/features',
        params: {
          project,
          layer_id,
          limit: limit || 999999, // Request all features (no pagination)
        },
      }),
      // Transform response: Parse string → Extract GeoJSON features → Convert to row-based
      transformResponse: (response: any) => {
        // Step 1: Parse string to JSON if needed
        let parsed = response;
        if (typeof response === 'string') {
          try {
            parsed = JSON.parse(response);
          } catch (error) {
            console.error('❌ Failed to parse layer features response:', error);
            return { data: [], success: false, message: 'Parse error' };
          }
        }

        // Step 2: Check if backend returned GeoJSON FeatureCollection
        if (parsed.data && parsed.data.type === 'FeatureCollection' && Array.isArray(parsed.data.features)) {
          console.log('🔄 Converting GeoJSON FeatureCollection to row-based format');
          console.log(`📊 Backend returned ${parsed.data.features.length} features`);
          // Extract properties from each feature (row-based)
          const rows = parsed.data.features.map((feature: any) => feature.properties || {});
          console.log('✅ Converted features:', { totalFeatures: rows.length, sample: rows[0] });
          return {
            data: rows,
            success: parsed.success !== false,
            message: parsed.message || ''
          };
        }

        // Step 3: If already row-based, return as-is
        console.log('✅ Using response as-is:', parsed);
        return parsed;
      },
      // Cache by layer_id
      providesTags: (result, error, { layer_id }) => [
        { type: 'LayerAttributes', id: layer_id },
      ],
    }),

    /**
     * Get Layer Constraints
     * GET /api/layer/constraints
     * Retrieves column constraints (NOT NULL, UNIQUE, AUTO_INCREMENT)
     *
     * Backend endpoint: /api/layer/constraints
     * Documentation: User guide
     *
     * Response:
     * {
     *   data: {
     *     not_null_fields: ["gid", "nazwa"],
     *     unique_fields: ["gid"],
     *     sequence_fields: ["gid"]
     *   },
     *   success: boolean,
     *   message: string
     * }
     *
     * Usage: Form validation in attribute table editor
     * - not_null_fields: Require input
     * - unique_fields: Check uniqueness before save
     * - sequence_fields: Disable editing (auto-generated)
     */
    getLayerConstraints: builder.query<{
      data: {
        not_null_fields: string[];
        unique_fields: string[];
        sequence_fields: string[];
      };
      success: boolean;
      message: string;
    }, {
      project: string;
      layer_id: string;
    }>({
      query: ({ project, layer_id }) => ({
        url: '/api/layer/constraints',
        params: { project, layer_id },
      }),
      // Cache constraints (rarely change)
      providesTags: (result, error, { layer_id }) => [
        { type: 'LayerConstraints', id: layer_id },
      ],
    }),

    /**
     * Save Multiple Records (Batch Update/Insert)
     * POST /api/layer/multipleSaving
     * Saves multiple attribute records at once
     *
     * Backend endpoint: /api/layer/multipleSaving
     * Documentation: User guide
     *
     * Request:
     * {
     *   project: "moj_projekt",
     *   layer: "layer_123",
     *   data: [
     *     { gid: 1, nazwa: "Nowa nazwa", powierzchnia: 150.5 },
     *     { gid: 2, nazwa: "Inna nazwa", powierzchnia: 200.3 }
     *   ]
     * }
     *
     * Response:
     * {
     *   data: "",
     *   success: boolean,
     *   message: "Zapisano 2 rekordy"
     * }
     *
     * IMPORTANT: Backend uses `gid` as primary key
     * - If record has `gid` → UPDATE
     * - If record has no `gid` → INSERT (probably, needs testing)
     */
    saveMultipleRecords: builder.mutation<{
      data: string;
      success: boolean;
      message: string;
    }, {
      project: string;
      layer: string;
      data: Array<Record<string, any>>;
    }>({
      query: (body) => ({
        url: '/api/layer/multipleSaving',
        method: 'POST',
        body,
      }),
      // Invalidate layer attributes cache after save
      invalidatesTags: (result, error, { layer }) => [
        { type: 'LayerAttributes', id: layer },
        { type: 'Layer', id: layer },
        'Layers',
      ],
    }),

    /**
     * Export Layer
     * GET /api/layer/export
     * Downloads layer in specified format (Shapefile, GeoJSON, GML, KML)
     *
     * Backend endpoint: /api/layer/export
     * Documentation: docs/backend/layer_api_docs.md
     *
     * Returns: Binary file (blob)
     * - ESRI SHAPEFILE: .zip containing .shp, .shx, .dbf, .prj, .cpg
     * - GEOJSON: .geojson file
     * - GML: .gml file (OGC standard)
     * - KML: .kml file (Google Earth)
     *
     * IMPORTANT: This is a download endpoint (returns blob, not JSON).
     * RTK Query doesn't handle blob responses well, so we use queryFn.
     */
    exportLayer: builder.query<Blob, {
      project: string;
      layer_id: string;
      epsg: number;
      layer_format: 'ESRI SHAPEFILE' | 'GML' | 'KML' | 'GEOJSON';
    }>({
      queryFn: async ({ project, layer_id, epsg, layer_format }, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          // Build URL with query params
          const url = `/api/layer/export?project=${encodeURIComponent(project)}&layer_id=${encodeURIComponent(layer_id)}&epsg=${epsg}&layer_format=${encodeURIComponent(layer_format)}`;

          // Use RTK Query's fetchWithBQ (includes auth token automatically)
          const result = await fetchWithBQ({
            url,
            method: 'GET',
            responseHandler: 'content-type', // Let RTK Query detect content type
          });

          if (result.error) {
            return { error: result.error };
          }

          // Convert response to blob
          const blob = result.data as Blob;
          return { data: blob };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message || 'Failed to export layer',
            },
          };
        }
      },
      // No caching needed for exports (always fresh download)
      keepUnusedDataFor: 0,
    }),
  }),
});

// Export auto-generated hooks
export const {
  useAddLayerMutation,
  useAddShpLayerMutation,
  useAddGeoJsonLayerMutation,
  useAddGmlLayerMutation,
  useAddRasterLayerMutation,
  useSetLayerVisibilityMutation,
  useIdentifyFeatureMutation,
  useDeleteLayerMutation,
  useGetLayerAttributesQuery,
  useLazyGetLayerAttributesQuery,
  useGetLayerAttributesWithTypesQuery,
  useLazyGetLayerAttributesWithTypesQuery,
  useGetColumnValuesQuery,
  useLazyGetColumnValuesQuery,
  useImportLayerStyleMutation,
  useAddLabelMutation,
  useRenameLayerMutation,
  useSetLayerOpacityMutation,
  useSetLayerScaleMutation,
  useSetLayerPublishedMutation,
  useLazyExportLayerQuery,
  // Attribute Table hooks
  useGetLayerFeaturesQuery,
  useLazyGetLayerFeaturesQuery,
  useGetLayerConstraintsQuery,
  useLazyGetLayerConstraintsQuery,
  useSaveMultipleRecordsMutation,
} = layersApi;
