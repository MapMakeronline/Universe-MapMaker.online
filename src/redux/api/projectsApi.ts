/**
 * RTK Query API for Projects
 *
 * Phase 3: RTK Query Migration + Advanced Features
 * Replaces manual async thunks with auto-generated hooks and caching
 *
 * Benefits:
 * - Auto-generated hooks: useGetProjectsQuery, useCreateProjectMutation
 * - Automatic caching and invalidation
 * - Optimistic updates
 * - Built-in loading/error states
 * - ~85% less boilerplate code
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ProjectsResponse,
  Project,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from '@/api/typy/types';
import type { QGISProjectTree } from '@/types/qgis';

// Get token from localStorage (same as apiClient)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Base query with auth headers
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

/**
 * Projects API with RTK Query
 *
 * Endpoints:
 * - getProjects: Fetch all user projects (requires auth)
 * - getPublicProjects: Fetch all published projects (no auth required)
 * - createProject: Create new project
 * - updateProject: Update project metadata
 * - deleteProject: Delete project
 * - togglePublish: Publish/unpublish project
 * - exportProject: Export project as QGS/QGZ
 * - checkSubdomainAvailability: Check if subdomain is available
 * - changeDomain: Change project subdomain
 */
export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery,
  tagTypes: ['Projects', 'Project', 'PublicProjects'],
  endpoints: (builder) => ({
    /**
     * GET /dashboard/projects/
     * Fetch all projects for authenticated user
     */
    getProjects: builder.query<ProjectsResponse, void>({
      query: () => '/dashboard/projects/',
      providesTags: (result) =>
        result
          ? [
              ...result.list_of_projects.map(({ project_name }) => ({
                type: 'Project' as const,
                id: project_name
              })),
              { type: 'Projects', id: 'LIST' },
            ]
          : [{ type: 'Projects', id: 'LIST' }],
    }),

    /**
     * GET /dashboard/projects/public/
     * Fetch all published projects (no authentication required)
     * Available for guests and logged-in users
     */
    getPublicProjects: builder.query<ProjectsResponse, void>({
      query: () => '/dashboard/projects/public/',
      transformResponse: (response: any) => {
        // Backend returns { success: true, projects: [...], count: N }
        // Transform to match ProjectsResponse format { list_of_projects: [...] }
        return {
          list_of_projects: response.projects || [],
          count: response.count || 0,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.list_of_projects.map(({ project_name }) => ({
                type: 'Project' as const,
                id: `public-${project_name}`
              })),
              { type: 'PublicProjects', id: 'LIST' },
            ]
          : [{ type: 'PublicProjects', id: 'LIST' }],
    }),

    /**
     * POST /api/projects/create/
     * Create a new project with PostgreSQL database and QGS file
     *
     * Backend response format:
     * {
     *   "data": { host, port, db_name, login, password },
     *   "success": true,
     *   "message": "Projekt zostaĹ‚ pomyĹ›lnie utworzony"
     * }
     *
     * IMPORTANT: Use data.db_name for real project_name (with suffix _1, _2, etc.)
     *
     * NOTE: Changed from /api/projects/create/ to /dashboard/projects/create/
     * due to backend returning "Method GET not allowed" error
     */
    createProject: builder.mutation<
      { data: DbInfo; success: boolean; message: string },
      CreateProjectData
    >({
      query: (data) => ({
        url: '/api/projects/create/',
        method: 'POST',
        body: {
          project: data.project, // Backend expects "project" (will add suffix if duplicate)
          domain: data.project
            .toLowerCase()
            .replace(/\s+/g, '-')          // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '')     // Remove special characters
            .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
            .substring(0, 63)               // Max 63 chars (backend requirement)
            || 'project',                   // Fallback if empty
          // NOTE: categories field removed - backend has incompatible serializer (expects list but validates as string)
          // Backend will use default value 'Inne'
          projectDescription: data.projectDescription || '',
          keywords: data.keywords || '',
        },
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),


    /**
     * PUT /dashboard/projects/update/
     * Update project metadata
     */
    updateProject: builder.mutation<
      { message: string },
      UpdateProjectData
    >({
      query: (data) => ({
        url: '/dashboard/projects/update/',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/remove/
     * Delete a project (move to trash or permanently delete)
     */
    deleteProject: builder.mutation<{ message: string }, { project: string; remove_permanently?: boolean }>({
      query: ({ project, remove_permanently = false }) => ({
        url: '/api/projects/remove/',
        method: 'POST',
        body: { project, remove_permanently },
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/publish
     * Toggle project publish status
     */
    togglePublish: builder.mutation<
      { message: string },
      { project: string; publish: boolean }
    >({
      query: ({ project, publish }) => ({
        url: '/api/projects/publish',
        method: 'POST',
        body: { project, publish },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
        { type: 'PublicProjects', id: 'LIST' }, // Refresh public projects when publish status changes
      ],
      // Optimistic update for instant UI feedback
      async onQueryStarted({ project, publish }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          projectsApi.util.updateQueryData('getProjects', undefined, (draft) => {
            const foundProject = draft.list_of_projects.find(p => p.project_name === project);
            if (foundProject) {
              foundProject.published = publish;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * POST /api/projects/export
     * Export project as QGS or QGZ file
     * Returns file blob for download
     */
    exportProject: builder.mutation<Blob, { project: string; project_type: 'qgs' | 'qgz' }>({
      queryFn: async ({ project, project_type }, api, extraOptions, baseQuery) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        try {
          const response = await fetch(`${baseUrl}/api/projects/export`, {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ project, project_type }),
          });

          if (!response.ok) {
            return { error: { status: response.status, data: await response.text() } };
          }

          const blob = await response.blob();

          // Trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project}.${project_type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          return { data: blob };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
    }),

    /**
     * POST /api/projects/subdomainAvailability
     * Check if subdomain is available
     */
    checkSubdomainAvailability: builder.mutation<
      { data: { subdomain: string; available: boolean }; success: boolean; message: string },
      { subdomain: string }
    >({
      query: ({ subdomain }) => ({
        url: '/api/projects/subdomainAvailability',
        method: 'POST',
        body: { subdomain },
      }),
    }),

    /**
     * POST /api/projects/domain/change
     * Change project subdomain
     */
    changeDomain: builder.mutation<
      { message: string },
      { project: string; subdomain: string }
    >({
      query: ({ project, subdomain }) => ({
        url: '/api/projects/domain/change',
        method: 'POST',
        body: { project, subdomain },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
        { type: 'PublicProjects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/import/qgs/
     * Import QGS file to existing project
     *
     * Process:
     * 1. Removes old QGS file
     * 2. Saves new QGS file
     * 3. Imports vector/raster layers to database
     * 4. Configures WFS and styles
     * 5. Generates layer tree (tree.json)
     *
     * NOTE: Uses custom queryFn to support upload progress tracking
     */
    importQGS: builder.mutation<
      { data: string; success: boolean; message: string },
      { project: string; qgsFile: File; onProgress?: (progress: number) => void }
    >({
      queryFn: async ({ project, qgsFile, onProgress }, _api, _extraOptions, baseQuery) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        console.log('đźš€ importQGS mutation called with:');
        console.log('  - project:', project);
        console.log('  - qgsFile:', qgsFile.name, qgsFile.size, 'bytes');
        console.log('  - baseUrl:', baseUrl);
        console.log('  - token:', token ? 'âś… present' : 'âťŚ missing');

        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('project', project);
          formData.append('qgs', qgsFile);

          // Upload progress tracking
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              onProgress(percentComplete);
            }
          });

          // Response handlers
          xhr.addEventListener('load', () => {
            console.log('đź“Ą Response received, status:', xhr.status);
            console.log('đź“„ Response text:', xhr.responseText.substring(0, 500)); // First 500 chars

            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                console.log('âś… Parsed response data:', data);

                // Check if backend returned an error despite 200 status
                if (data.success === false || data.error) {
                  console.error('âťŚ Backend returned error in 200 response:', data);
                  resolve({
                    error: {
                      status: xhr.status,
                      data: {
                        message: data.message || data.error || 'Import QGS failed',
                        details: data
                      }
                    }
                  });
                } else {
                  console.log('đźŽ‰ Import successful!');
                  resolve({ data });
                }
              } catch (error) {
                resolve({ error: { status: xhr.status, data: 'Invalid JSON response' } });
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                resolve({
                  error: {
                    status: xhr.status,
                    data: {
                      message: errorData.message || errorData.detail || 'HTTP Error',
                      details: errorData
                    }
                  }
                });
              } catch {
                resolve({ error: { status: xhr.status, data: { message: xhr.responseText || 'Unknown error' } } });
              }
            }
          });

          xhr.addEventListener('error', (e) => {
            console.error('âťŚ XHR error event:', e);
            resolve({ error: { status: 'FETCH_ERROR', error: 'Network error' } });
          });

          xhr.addEventListener('abort', (e) => {
            console.warn('âš ď¸Ź XHR abort event:', e);
            resolve({ error: { status: 'FETCH_ERROR', error: 'Upload aborted' } });
          });

          // Send request
          const requestUrl = `${baseUrl}/api/projects/import/qgs/`;
          console.log('đź“ˇ Sending POST request to:', requestUrl);
          xhr.open('POST', requestUrl);
          xhr.setRequestHeader('Authorization', `Token ${token}`);
          console.log('đź“¤ Sending FormData with project:', project, 'and file:', qgsFile.name);
          xhr.send(formData);
          console.log('âśď¸Ź Request sent, waiting for response...');
        });
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/import/qgz/
     * Import compressed QGIS project file (.qgz)
     *
     * Same functionality as importQGS but for compressed format.
     * Includes upload progress tracking.
     *
     * Backend Process:
     * 1. Extracts .qgz archive
     * 2. Reads .qgs file inside
     * 3. Imports layers to PostGIS (same as importQGS)
     * 4. Configures WFS and styles
     * 5. Generates layer tree
     *
     * NOTE: Uses custom queryFn to support upload progress tracking
     */
    importQGZ: builder.mutation<
      { data: string; success: boolean; message: string },
      { project: string; qgzFile: File; onProgress?: (progress: number) => void }
    >({
      queryFn: async ({ project, qgzFile, onProgress }, _api, _extraOptions, baseQuery) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        console.log('đźš€ importQGZ mutation called with:');
        console.log('  - project:', project);
        console.log('  - qgzFile:', qgzFile.name, qgzFile.size, 'bytes');
        console.log('  - baseUrl:', baseUrl);
        console.log('  - token:', token ? 'âś… present' : 'âťŚ missing');

        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('project', project);
          formData.append('qgz', qgzFile); // Note: 'qgz' field name, not 'qgs'

          // Upload progress tracking
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              onProgress(percentComplete);
            }
          });

          // Response handlers
          xhr.addEventListener('load', () => {
            console.log('đź“Ą Response received, status:', xhr.status);
            console.log('đź“„ Response text:', xhr.responseText.substring(0, 500));

            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                console.log('âś… Parsed response data:', data);

                if (data.success === false || data.error) {
                  console.error('âťŚ Backend returned error in 200 response:', data);
                  resolve({
                    error: {
                      status: xhr.status,
                      data: {
                        message: data.message || data.error || 'Import QGZ failed',
                        details: data
                      }
                    }
                  });
                } else {
                  console.log('đźŽ‰ Import QGZ successful!');
                  resolve({ data });
                }
              } catch (error) {
                resolve({ error: { status: xhr.status, data: 'Invalid JSON response' } });
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                resolve({
                  error: {
                    status: xhr.status,
                    data: {
                      message: errorData.message || errorData.detail || 'HTTP Error',
                      details: errorData
                    }
                  }
                });
              } catch {
                resolve({ error: { status: xhr.status, data: { message: xhr.responseText || 'Unknown error' } } });
              }
            }
          });

          xhr.addEventListener('error', (e) => {
            console.error('âťŚ XHR error event:', e);
            resolve({ error: { status: 'FETCH_ERROR', error: 'Network error' } });
          });

          xhr.addEventListener('abort', (e) => {
            console.warn('âš ď¸Ź XHR abort event:', e);
            resolve({ error: { status: 'FETCH_ERROR', error: 'Upload aborted' } });
          });

          // Send request
          const requestUrl = `${baseUrl}/api/projects/import/qgz/`;
          console.log('đź“ˇ Sending POST request to:', requestUrl);
          xhr.open('POST', requestUrl);
          xhr.setRequestHeader('Authorization', `Token ${token}`);
          console.log('đź“¤ Sending FormData with project:', project, 'and file:', qgzFile.name);
          xhr.send(formData);
          console.log('âśď¸Ź Request sent, waiting for response...');
        });
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/logo/update/
     * Update project logo
     *
     * Uploads a new logo image for the project.
     * Logo is displayed in project cards and map header.
     */
    updateLogo: builder.mutation<
      { success: boolean; message?: string },
      { project: string; logo: File }
    >({
      queryFn: async ({ project, logo }) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('project', project);
          formData.append('logo', logo);

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve({ data });
              } catch {
                resolve({ error: { status: xhr.status, data: 'Invalid JSON response' } });
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                resolve({ error: { status: xhr.status, data: errorData } });
              } catch {
                resolve({ error: { status: xhr.status, data: { message: xhr.responseText } } });
              }
            }
          });

          xhr.addEventListener('error', () => {
            resolve({ error: { status: 'FETCH_ERROR', error: 'Network error' } });
          });

          const requestUrl = `${baseUrl}/api/projects/logo/update/`;
          xhr.open('POST', requestUrl);
          xhr.setRequestHeader('Authorization', `Token ${token}`);
          xhr.send(formData);
        });
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/metadata
     * Set project metadata (description, keywords, categories)
     */
    setMetadata: builder.mutation<
      { success: boolean },
      { project: string; description?: string; keywords?: string; categories?: string }
    >({
      query: (data) => ({
        url: '/api/projects/metadata',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/order
     * Get layer tree order
     */
    getLayersOrder: builder.query<
      { layers: string[] },
      { project_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/order',
        method: 'POST',
        body: data,
      }),
      providesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
      ],
    }),

    /**
     * POST /api/projects/tree/order
     * Change layer tree order
     */
    changeLayersOrder: builder.mutation<
      { success: boolean },
      { project_name: string; order: string[] }
    >({
      query: (data) => ({
        url: '/api/projects/tree/order',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
      ],
    }),

    /**
     * POST /api/projects/space/get
     * Get project storage usage
     */
    getProjectSpace: builder.query<
      { size_mb: number },
      { project_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/space/get',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * POST /api/projects/search
     * Search projects
     */
    searchProjects: builder.query<
      { projects: Project[] },
      { query: string }
    >({
      query: (data) => ({
        url: '/api/projects/search',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * POST /api/projects/reload
     * Reload project (refresh from QGIS)
     */
    reloadProject: builder.mutation<
      { success: boolean },
      { project_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/reload',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
      ],
    }),

    /**
     * POST /api/projects/repair
     * Repair corrupted project
     */
    repairProject: builder.mutation<
      { success: boolean; issues_fixed: string[] },
      { project_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/repair',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
      ],
    }),

    /**
     * POST /api/projects/restore
     * Restore project from backup
     */
    restoreProject: builder.mutation<
      { success: boolean },
      { project_name: string; version?: string }
    >({
      query: (data) => ({
        url: '/api/projects/restore',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/basemap/set
     * Set project basemap
     */
    setBasemap: builder.mutation<
      { success: boolean },
      { project_name: string; type: 'osm' | 'mapbox' | 'google' | 'bing'; url?: string; api_key?: string }
    >({
      query: (data) => ({
        url: '/api/projects/basemap/set',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
      ],
    }),

    /**
     * POST /api/projects/print
     * Prepare project print/preview image
     */
    preparePrintImage: builder.mutation<
      { image_url: string },
      { project_name: string; bbox: [number, number, number, number]; width: number; height: number; dpi?: number }
    >({
      query: (data) => ({
        url: '/api/projects/print',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * GET /api/projects/new/json
     * Fetch project data structure (tree.json) for map view
     *
     * This endpoint is used when opening a project to load:
     * - Layer tree structure
     * - Project extent (bbox)
     * - Logo availability
     * - Layer visibility/styling
     *
     * Authentication: Optional
     * - Owner: Full access (edit mode)
     * - Public project: Read-only access
     * - Private project: Requires ownership
     */
    getProjectData: builder.query<
      QGISProjectTree & {
        name: string;
        extent: [number, number, number, number];
        logoExists: boolean;
        large: boolean;
      },
      { project: string; published?: boolean; save?: boolean }
    >({
      query: ({ project, published = false, save = false }) => ({
        url: `/api/projects/new/json`,
        params: { project, published, save },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
      ],
    }),

    // ========================================================================
    // NEW ENDPOINTS - Backend Compatibility (2025-01-13)
    // ========================================================================

    /**
     * POST /api/projects/distinct
     * Get distinct values for a column (for filtering)
     */
    getDistinctValues: builder.query<
      { values: Array<string | number> },
      { project_name: string; layer_name: string; column_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/distinct',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * POST /api/projects/filter/min-max
     * Get min/max values for numeric column
     */
    getMinMaxValues: builder.query<
      { min: number; max: number },
      { project_name: string; layer_name: string; column_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/filter/min-max',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * POST /api/projects/filter/numeric-columns
     * Get all numeric columns in layer
     */
    getNumericColumns: builder.query<
      { columns: string[] },
      { project_name: string; layer_name: string }
    >({
      query: (data) => ({
        url: '/api/projects/filter/numeric-columns',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * POST /api/projects/global-search
     * Search across all layers in project
     */
    globalSearch: builder.query<
      { results: Array<{ layer_name: string; feature_id: number; properties: Record<string, any> }> },
      { project_name: string; query: string; limit?: number }
    >({
      query: (data) => ({
        url: '/api/projects/global-search',
        method: 'POST',
        body: data,
      }),
    }),

  }),
});

/**
 * Auto-generated hooks for components
 *
 * Queries (auto-refetch on mount/focus):
 * - useGetProjectsQuery() - User's own projects (requires auth)
 * - useGetPublicProjectsQuery() - All published projects (no auth required)
 * - useGetProjectDataQuery() - Project data structure for map view
 * - useGetLayersOrderQuery() - Get layer tree order
 * - useGetProjectSpaceQuery() - Get storage usage
 * - useSearchProjectsQuery() - Search projects
 *
 * Mutations (manual trigger):
 * - useCreateProjectMutation()
 * - useUpdateProjectMutation()
 * - useDeleteProjectMutation()
 * - useTogglePublishMutation()
 * - useImportQGSMutation() - Import QGS file to project
 * - useImportQGZMutation() - Import compressed QGZ file to project
 * - useExportProjectMutation() - Export as QGS/QGZ
 * - useCheckSubdomainAvailabilityMutation() - Check subdomain
 * - useChangeDomainMutation() - Change project domain
 * - useUpdateLogoMutation() - Update project logo
 * - useSetMetadataMutation() - Set project metadata
 * - useChangeLayersOrderMutation() - Reorder layers
 * - useReloadProjectMutation() - Reload from QGIS
 * - useRepairProjectMutation() - Repair corrupted project
 * - useRestoreProjectMutation() - Restore from backup
 * - useSetBasemapMutation() - Set project basemap
 * - usePreparePrintImageMutation() - Generate print preview
 */
export const {
  useGetProjectsQuery,
  useGetPublicProjectsQuery,
  useGetProjectDataQuery,
  useGetLayersOrderQuery,
  useGetProjectSpaceQuery,
  useSearchProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useTogglePublishMutation,
  useImportQGSMutation,
  useImportQGZMutation,
  useExportProjectMutation,
  useCheckSubdomainAvailabilityMutation,
  useChangeDomainMutation,
  useUpdateLogoMutation,
  useSetMetadataMutation,
  useChangeLayersOrderMutation,
  useReloadProjectMutation,
  useRepairProjectMutation,
  useRestoreProjectMutation,
  useSetBasemapMutation,
  usePreparePrintImageMutation,
  // New Endpoints - Backend Compatibility
  useGetDistinctValuesQuery,
  useGetMinMaxValuesQuery,
  useGetNumericColumnsQuery,
  useGlobalSearchQuery,
} = projectsApi;
