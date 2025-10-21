/**
 * Layers Module - RTK Query API
 *
 * Endpoints for layer management and import:
 * - addShpLayer: Import Shapefile (.shp + .shx + .dbf + .prj)
 * - addGeoJsonLayer: Import GeoJSON
 * - addGmlLayer: Import GML
 * - addRasterLayer: Import TIF/GeoTIFF
 * - setLayerVisibility: Toggle layer visibility (show/hide)
 * - addWmsLayer: Add WMS external layer (TODO)
 * - addWfsLayer: Add WFS external layer (TODO)
 *
 * All imports use multipart/form-data for file uploads.
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
        // IMPORTANT: Backend requires 'parent' field (even if empty string)
        formData.append('parent', params.parent ?? '');
        if (params.epsg) formData.append('epsg', params.epsg.toString());
        if (params.encoding) formData.append('encoding', params.encoding);

        return {
          url: '/api/layer/add/shp/',
          method: 'POST',
          body: formData,
          // RTK Query automatically sets Content-Type: multipart/form-data for FormData
        };
      },
      invalidatesTags: ['Layers', 'Project'],
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
        // IMPORTANT: Backend requires 'parent' field (even if empty string)
        formData.append('parent', params.parent ?? '');

        return {
          url: '/api/layer/add/geojson/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Layers', 'Project'],
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
        // IMPORTANT: Backend requires 'parent' field (even if empty string)
        formData.append('parent', params.parent ?? '');
        if (params.epsg) formData.append('epsg', params.epsg.toString());

        return {
          url: '/api/layer/add/gml/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Layers', 'Project'],
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
        // IMPORTANT: Backend requires 'parent' field (even if empty string)
        formData.append('parent', params.parent ?? '');

        return {
          url: '/api/layer/add/raster/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Layers', 'Project'],
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
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
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
} = layersApi;
