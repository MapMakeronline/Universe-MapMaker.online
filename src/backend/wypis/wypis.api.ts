// RTK Query API for Wypis/Wyrys endpoints
// Based on backend endpoints: /api/projects/wypis/*

import { baseApi } from '../client/base-api';
import type {
  AddWypisConfigurationRequest,
  WypisConfigurationResponse,
  GetWypisConfigurationRequest,
  GetWypisConfigurationSingleResponse,
  GetWypisConfigurationAllResponse,
  RemoveWypisConfigurationRequest,
  GetPlotSpatialDevelopmentRequest,
  GetPlotSpatialDevelopmentResponse,
  CreateWypisRequest,
} from '../types';

/**
 * Wypis/Wyrys API endpoints
 *
 * Backend endpoints:
 * - POST /api/projects/wypis/add/configuration - Add/update configuration
 * - GET /api/projects/wypis/get/configuration - Get configuration(s)
 * - POST /api/projects/wypis/remove - Remove configuration
 * - POST /api/projects/wypis/create - Generate wypis PDF
 */
export const wypisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Add or update wypis configuration
     *
     * Endpoint: POST /api/projects/wypis/add/configuration
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "config_123" (optional - generates new if omitted),
     *   "configuration_name": "MPZP",
     *   "data": { ... configuration data ... }
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "config_id": "config_123"
     * }
     */
    addWypisConfiguration: builder.mutation<
      { success: boolean; config_id: string },
      AddWypisConfigurationRequest
    >({
      query: (body) => ({
        url: '/api/projects/wypis/add/configuration',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'WypisConfiguration', id: 'LIST' },
        { type: 'WypisConfiguration', id: project },
        ...(result?.config_id ? [{ type: 'WypisConfiguration' as const, id: result.config_id }] : []),
      ],
    }),

    /**
     * Get wypis configuration(s)
     *
     * Endpoint: GET /api/projects/wypis/get/configuration
     *
     * Query params:
     * - project: string (required)
     * - config_id: string (optional - if omitted, returns all configs)
     *
     * Response (single):
     * {
     *   "success": true,
     *   "data": { ... }
     * }
     *
     * Response (all):
     * {
     *   "success": true,
     *   "configurations": [
     *     {
     *       "config_id": "id1",
     *       "configuration_name": "MPZP",
     *       "data": { ... }
     *     },
     *     ...
     *   ]
     * }
     */
    getWypisConfiguration: builder.query<
      GetWypisConfigurationSingleResponse | GetWypisConfigurationAllResponse,
      GetWypisConfigurationRequest
    >({
      query: ({ project, config_id }) => {
        const params = new URLSearchParams({ project });
        if (config_id) {
          params.append('config_id', config_id);
        }
        return `/api/projects/wypis/get/configuration?${params}`;
      },
      providesTags: (result, error, { project, config_id }) => {
        if (config_id) {
          return [
            { type: 'WypisConfiguration', id: config_id },
            { type: 'WypisConfiguration', id: project },
          ];
        }
        return [
          { type: 'WypisConfiguration', id: 'LIST' },
          { type: 'WypisConfiguration', id: project },
        ];
      },
    }),

    /**
     * Remove wypis configuration
     *
     * Endpoint: POST /api/projects/wypis/remove
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "config_to_remove"
     * }
     *
     * Response:
     * {
     *   "success": true
     * }
     */
    removeWypisConfiguration: builder.mutation<
      { success: boolean },
      RemoveWypisConfigurationRequest
    >({
      query: (body) => ({
        url: '/api/projects/wypis/remove',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project, config_id }) => [
        { type: 'WypisConfiguration', id: 'LIST' },
        { type: 'WypisConfiguration', id: project },
        { type: 'WypisConfiguration', id: config_id },
      ],
    }),

    /**
     * Get precinct and plot number from map coordinates
     *
     * Endpoint: POST /api/projects/wypis/precinct_and_number
     *
     * Identifies land plot (działka) by clicking on map coordinates.
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "config_123",
     *   "point": [2557123.45, 6952345.67]  // [x, y] coordinates
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "precinct": "WYSZKI",
     *     "number": "15"
     *   }
     * }
     */
    getPrecinctAndNumber: builder.mutation<
      { data: { precinct: string; number: string }; success: boolean; message: string },
      { project: string; config_id: string; point: [number, number] }
    >({
      query: (body) => ({
        url: '/api/projects/wypis/precinct_and_number',
        method: 'POST',
        body,
      }),
      // No cache invalidation needed - read-only query
    }),

    /**
     * Get plot spatial development (planning zones)
     *
     * Endpoint: POST /api/projects/wypis/plotspatialdevelopment
     *
     * Queries planning zones that overlap with given plots and returns
     * available documents for each zone.
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "config_123",
     *   "plot": [{ "precinct": "0001", "number": "123" }]
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "plot": { "precinct": "0001", "number": "123" },
     *       "plot_destinations": [
     *         {
     *           "plan_id": "zone_1",
     *           "includes": true,
     *           "covering": "75%",
     *           "destinations": [
     *             { "name": "Ustalenia ogólne", "includes": true },
     *             { "name": "Purpose A", "includes": false }
     *           ]
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    getPlotSpatialDevelopment: builder.mutation<
      GetPlotSpatialDevelopmentResponse,
      GetPlotSpatialDevelopmentRequest
    >({
      query: (body) => ({
        url: '/api/projects/wypis/plotspatialdevelopment',
        method: 'POST',
        body,
      }),
      // No cache invalidation needed - read-only query
    }),

    /**
     * Generate wypis PDF for selected plots
     *
     * Endpoint: POST /api/projects/wypis/create
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "configuration_id",
     *   "plot": [
     *     {
     *       "plot": { "precinct": "0001", "number": "123" },
     *       "plot_destinations": [ ... ]
     *     }
     *   ]
     * }
     *
     * Response: PDF file (application/pdf)
     *
     * Note: This endpoint returns a Blob, not JSON
     */
    createWypis: builder.mutation<Blob, CreateWypisRequest>({
      query: (body) => ({
        url: '/api/projects/wypis/create',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
      // No cache invalidation needed - PDF generation doesn't modify data
    }),
  }),
});

// Export hooks for use in components
export const {
  useAddWypisConfigurationMutation,
  useGetWypisConfigurationQuery,
  useRemoveWypisConfigurationMutation,
  useGetPrecinctAndNumberMutation,
  useGetPlotSpatialDevelopmentMutation,
  useCreateWypisMutation,
} = wypisApi;
