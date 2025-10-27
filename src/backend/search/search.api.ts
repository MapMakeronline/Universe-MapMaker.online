/**
 * RTK Query API for Search & Filtering Endpoints
 *
 * Backend documentation: docs/backend/projects_api_docs.md (lines 1486-1700)
 *
 * Endpoints:
 * - GET /api/projects/search - Search phrase in project layers
 * - POST /api/projects/distinct - Filter values by column and function
 * - POST /api/projects/filter/min-max - Get min/max for numeric column
 * - GET /api/projects/filter/numeric-columns - Get numeric columns list
 * - POST /api/projects/global-search - Advanced search (equals + range conditions)
 */

import { baseApi } from '../client/base-api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Search result for a single layer
 */
export interface SearchLayerResult {
  gid: number;
  column_name: string;
  value: string | number;
}

/**
 * Search response - dictionary of layer_id → results
 */
export interface SearchResponse {
  data: Record<string, SearchLayerResult[]>;
  success: boolean;
  message: string;
}

/**
 * Search request parameters
 */
export interface SearchParams {
  project: string;
  searched_phrase: string;
  exactly?: boolean;
  ignore_capitalization?: boolean;
}

/**
 * Distinct/filter request parameters
 */
export interface DistinctParams {
  project: string;
  selectedLayer: {
    value: {
      id: string;
    };
  };
  selectedColumn: {
    value: string;
  };
  selectedFunction: {
    value: 'equal' | 'not_equal' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';
  };
  value: any;
}

/**
 * Min-max request parameters
 */
export interface MinMaxParams {
  project: string;
  selectedLayer: {
    value: {
      id: string;
    };
  };
  selectedColumn: {
    value: string;
  };
}

/**
 * Min-max response
 */
export interface MinMaxResponse {
  data: {
    min: number;
    max: number;
  };
  success: boolean;
  message: string;
}

/**
 * Numeric columns response
 */
export interface NumericColumnsResponse {
  data: string[];
  success: boolean;
  message: string;
}

/**
 * Global search request parameters
 */
export interface GlobalSearchParams {
  projectName: string;
  equalsConditions: Record<string, any>;
  rangeConditions: Record<string, { min: number; max: number }>;
}

/**
 * Global search response
 */
export interface GlobalSearchResponse {
  data: {
    features: any[]; // GeoJSON features
    count: number;
  };
  success: boolean;
  message: string;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Search phrase in project layers
     *
     * @endpoint GET /api/projects/search
     * @example
     * const { data } = useSearchInProjectQuery({
     *   project: 'moj_projekt',
     *   searched_phrase: 'test',
     *   exactly: false,
     *   ignore_capitalization: true
     * });
     */
    searchInProject: builder.query<SearchResponse, SearchParams>({
      query: ({ project, searched_phrase, exactly, ignore_capitalization }) => ({
        url: '/api/projects/search',
        params: {
          project,
          searched_phrase,
          exactly,
          ignore_capitalization,
        },
      }),
      providesTags: (result, error, { project }) => [
        { type: 'Search', id: project },
      ],
    }),

    /**
     * Filter values by column and comparison function
     *
     * @endpoint POST /api/projects/distinct
     * @example
     * const [filterDistinct] = useFilterDistinctMutation();
     * const result = await filterDistinct({
     *   project: 'moj_projekt',
     *   selectedLayer: { value: { id: 'layer_123' } },
     *   selectedColumn: { value: 'cena' },
     *   selectedFunction: { value: 'greater_than' },
     *   value: 100000
     * });
     */
    filterDistinct: builder.mutation<SearchResponse, DistinctParams>({
      query: (body) => ({
        url: '/api/projects/distinct',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Search', id: project },
      ],
    }),

    /**
     * Get min/max values for numeric column
     *
     * @endpoint POST /api/projects/filter/min-max
     * @example
     * const [getMinMax] = useGetMinMaxMutation();
     * const { data } = await getMinMax({
     *   project: 'moj_projekt',
     *   selectedLayer: { value: { id: 'layer_123' } },
     *   selectedColumn: { value: 'cena' }
     * });
     * console.log(data.data.min, data.data.max); // 50000, 500000
     */
    getMinMax: builder.mutation<MinMaxResponse, MinMaxParams>({
      query: (body) => ({
        url: '/api/projects/filter/min-max',
        method: 'POST',
        body,
      }),
    }),

    /**
     * Get list of numeric columns for a layer
     *
     * @endpoint GET /api/projects/filter/numeric-columns
     * @example
     * const { data } = useGetNumericColumnsQuery({
     *   project: 'moj_projekt',
     *   layer_id: 'layer_123'
     * });
     * console.log(data.data); // ['cena', 'powierzchnia', 'liczba_pokoi']
     */
    getNumericColumnsForFilter: builder.query<NumericColumnsResponse, { project: string; layer_id: string }>({
      query: ({ project, layer_id }) => ({
        url: '/api/projects/filter/numeric-columns',
        params: { project, layer_id },
      }),
      providesTags: (result, error, { layer_id }) => [
        { type: 'Layer', id: layer_id },
      ],
    }),

    /**
     * Advanced global search with equals + range conditions
     *
     * @endpoint POST /api/projects/global-search
     * @example
     * const [advancedGlobalSearch] = useAdvancedGlobalSearchMutation();
     * const result = await advancedGlobalSearch({
     *   projectName: 'moj_projekt',
     *   equalsConditions: {
     *     typ: 'mieszkanie',
     *     miasto: 'Warszawa'
     *   },
     *   rangeConditions: {
     *     cena: { min: 300000, max: 500000 },
     *     powierzchnia: { min: 40, max: 80 }
     *   }
     * });
     */
    advancedGlobalSearch: builder.mutation<GlobalSearchResponse, GlobalSearchParams>({
      query: (body) => ({
        url: '/api/projects/global-search',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { projectName }) => [
        { type: 'Search', id: projectName },
      ],
    }),
  }),
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  useSearchInProjectQuery,
  useLazySearchInProjectQuery,
  useFilterDistinctMutation,
  useGetMinMaxMutation,
  useGetNumericColumnsForFilterQuery,
  useLazyGetNumericColumnsForFilterQuery,
  useAdvancedGlobalSearchMutation,
} = searchApi;
