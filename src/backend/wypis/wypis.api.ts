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
     * Request body (multipart/form-data):
     * - project: string (required)
     * - config_id: string (optional)
     * - configuration: JSON string (required)
     * - file: ZIP file with PDFs (required - all purposes/arrangements documents)
     *
     * Response:
     * {
     *   "success": true,
     *   "config_complete": true,
     *   "config_id": "generated_or_provided_id"
     * }
     */
    addWypisConfiguration: builder.mutation<
      WypisConfigurationResponse,
      FormData | AddWypisConfigurationRequest
    >({
      query: (body) => ({
        url: '/api/projects/wypis/add/configuration',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => {
        // Extract project name from FormData or JSON
        const project = arg instanceof FormData
          ? arg.get('project') as string
          : arg.project

        return [
          { type: 'WypisConfiguration', id: 'LIST' },
          { type: 'WypisConfiguration', id: project },
        ]
      },
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
     * Generate wypis PDF for selected plots
     *
     * Endpoint: POST /api/projects/wypis/create
     *
     * Request body:
     * {
     *   "project": "project_name",
     *   "config_id": "configuration_id",
     *   "plot": [
     *     { "precinct": "0001", "number": "123" },
     *     { "precinct": "0001", "number": "124" }
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
  useCreateWypisMutation,
} = wypisApi;
