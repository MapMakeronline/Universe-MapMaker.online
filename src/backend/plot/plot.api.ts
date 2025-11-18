/**
 * Plot Search Module - RTK Query API
 *
 * Endpoints for parcel (działka) search and configuration:
 * - getPlotLayerAttributes: Get all layer attributes for filtering (GET /api/layer/attributes)
 * - searchPlotByIds: Get plot geometries by feature IDs (POST /api/layer/features/selected)
 * - getPlotConfig: Get saved plot search configuration (GET /api/projects/plot)
 * - savePlotConfig: Save plot search configuration (POST /api/projects/plot)
 *
 * Documentation: SEARCH_DOCUMENTATION.md (lines 151-376)
 */

import { baseApi } from '../client/base-api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Plot layer attribute (column name → value)
 */
export interface PlotLayerAttribute {
  [columnName: string]: string | number | boolean | null;
}

/**
 * Response from GET /api/layer/attributes
 * Contains attribute types and all feature attributes
 */
export interface GetPlotAttributesResponse {
  status: number;
  data: {
    Types: {
      [columnName: string]: 'Integer' | 'String' | 'Real' | 'Boolean' | 'Date' | 'DateTime';
    };
    Attributes: PlotLayerAttribute[];
  };
  success: boolean;
  message: string;
}

/**
 * Request parameters for GET /api/layer/attributes
 */
export interface GetPlotAttributesRequest {
  project: string;
  layer_id: string;
  search?: string; // Optional search filter
}

/**
 * GeoJSON Feature with geometry and properties
 */
export interface PlotFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: any; // Web Mercator (EPSG:3857)
  };
  properties: {
    [key: string]: any;
  };
}

/**
 * Response from POST /api/layer/features/selected
 * Returns GeoJSON FeatureCollection with bbox in Web Mercator (EPSG:3857)
 */
export interface SearchPlotResponse {
  status: number;
  data: {
    type: 'FeatureCollection';
    bbox: [number, number, number, number]; // [minX, minY, maxX, maxY] in EPSG:3857
    features: PlotFeature[];
  };
  error: boolean;
  message: string;
}

/**
 * Request parameters for POST /api/layer/features/selected
 */
export interface SearchPlotRequest {
  project: string;
  layer_id: string;
  label: number[]; // Array of feature IDs (ogc_fid)
}

/**
 * Plot search configuration
 */
export interface PlotConfig {
  plot_layer: string; // Layer ID for parcels
  plot_number_column: string; // Column name for plot number
  plot_precinct_column: string; // Column name for precinct (obręb)
}

/**
 * Response from GET /api/projects/plot
 */
export interface GetPlotConfigResponse {
  success: boolean;
  data: PlotConfig;
  message: string;
}

/**
 * Request parameters for POST /api/projects/plot
 */
export interface SavePlotConfigRequest {
  project: string;
  plot_layer: string;
  plot_number_column: string;
  plot_precinct_column: string;
}

/**
 * Response from POST /api/projects/plot
 */
export interface SavePlotConfigResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const plotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all layer attributes for plot search (types + values)
     * Used for building precinct/plot number dropdowns
     *
     * @endpoint GET /api/layer/attributes
     * @example
     * const { data } = useGetPlotLayerAttributesQuery({
     *   project: 'UniejowSIP',
     *   layer_id: 'tmp_name_20250202183906'
     * });
     * // Extract unique precincts:
     * const precincts = data.data.Attributes
     *   .map(attr => attr['obreb'])
     *   .filter(v => v != null);
     */
    getPlotLayerAttributes: builder.query<GetPlotAttributesResponse, GetPlotAttributesRequest>({
      query: ({ project, layer_id, search }) => ({
        url: '/api/layer/attributes',
        params: {
          project,
          layer_id,
          ...(search && { search }),
        },
      }),
      providesTags: (result, error, { layer_id }) => [
        { type: 'Layer', id: layer_id },
      ],
    }),

    /**
     * Search plots by feature IDs (get geometries)
     * Backend returns GeoJSON FeatureCollection with bbox in Web Mercator (EPSG:3857)
     *
     * @endpoint POST /api/layer/features/selected
     * @example
     * const [searchPlot] = useSearchPlotByIdsMutation();
     * const result = await searchPlot({
     *   project: 'UniejowSIP',
     *   layer_id: 'tmp_name_20250202183906',
     *   label: [5313, 5314] // ogc_fid values
     * });
     * // result.data.bbox: [minX, minY, maxX, maxY] in EPSG:3857
     * // result.data.features: GeoJSON features with geometry in EPSG:3857
     */
    searchPlotByIds: builder.mutation<SearchPlotResponse, SearchPlotRequest>({
      query: (body) => ({
        url: '/api/layer/features/selected',
        method: 'POST',
        body,
      }),
    }),

    /**
     * Get saved plot search configuration
     * Returns layer ID and column mappings
     *
     * @endpoint GET /api/projects/plot/config (public endpoint, no auth required)
     * @example
     * const { data } = useGetPlotConfigQuery({ project: 'UniejowSIP' });
     * console.log(data.data.plot_layer); // 'tmp_name_20250202183906'
     * console.log(data.data.plot_precinct_column); // 'obreb'
     * console.log(data.data.plot_number_column); // 'numer'
     */
    getPlotConfig: builder.query<GetPlotConfigResponse, { project: string }>({
      query: ({ project }) => ({
        url: '/api/projects/plot',
        params: { project },
      }),
      providesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        { type: 'PlotConfig', id: project },
      ],
    }),

    /**
     * Save plot search configuration
     * Stores layer ID and column mappings in backend
     *
     * @endpoint POST /api/projects/plot
     * @example
     * const [savePlotConfig] = useSavePlotConfigMutation();
     * await savePlotConfig({
     *   project: 'UniejowSIP',
     *   plot_layer: 'tmp_name_20250202183906',
     *   plot_number_column: 'numer',
     *   plot_precinct_column: 'obreb'
     * });
     */
    savePlotConfig: builder.mutation<SavePlotConfigResponse, SavePlotConfigRequest>({
      query: (body) => ({
        url: '/api/projects/plot',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        { type: 'PlotConfig', id: project },
      ],
    }),
  }),
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  useGetPlotLayerAttributesQuery,
  useLazyGetPlotLayerAttributesQuery,
  useSearchPlotByIdsMutation,
  useGetPlotConfigQuery,
  useLazyGetPlotConfigQuery,
  useSavePlotConfigMutation,
} = plotApi;
