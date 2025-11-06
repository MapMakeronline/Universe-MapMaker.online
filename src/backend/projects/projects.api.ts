/**
 * Projects Module - RTK Query API
 *
 * Migrated from src/redux/api/projectsApi.ts
 * Now uses baseApi for centralized backend communication
 *
 * Endpoints:
 * - getProjects: Fetch user projects
 * - getPublicProjects: Fetch published projects
 * - createProject: Create new project
 * - updateProject: Update metadata
 * - deleteProject: Delete/trash project
 * - togglePublish: Publish/unpublish
 * - importQGS/importQGZ: Import QGIS files
 * - exportProject: Export as QGS/QGZ
 * - changeDomain: Update subdomain
 * - updateLogo: Upload project logo
 * - setMetadata: Update project metadata
 * - getProjectData: Fetch project tree.json
 * - ... (20+ more endpoints)
 */

import { baseApi } from '../client/base-api';
import type {
  ProjectsResponse,
  Project,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from '../types';
import type { QGISProjectTree } from '@/types/qgis';

// Get token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

export const projectsApi = baseApi.injectEndpoints({
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
     * Fetch all published projects
     */
    getPublicProjects: builder.query<ProjectsResponse, void>({
      query: () => '/dashboard/projects/public/',
      transformResponse: (response: any) => ({
        list_of_projects: response.projects || [],
        count: response.count || 0,
      }),
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
     * Create new project
     */
    createProject: builder.mutation<
      { data: DbInfo; success: boolean; message: string },
      CreateProjectData
    >({
      query: (data) => ({
        url: '/api/projects/create/',
        method: 'POST',
        body: {
          project: data.project,
          domain: data.project
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/^-+|-+$/g, '')
            .substring(0, 63)
            || 'project',
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
     * Delete project
     */
    deleteProject: builder.mutation<
      { message: string },
      { project: string; remove_permanently?: boolean }
    >({
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
     * Toggle publish status
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
        { type: 'PublicProjects', id: 'LIST' },
      ],
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
     * POST /api/projects/import/qgs/
     * Import QGS file
     */
    importQGS: builder.mutation<
      { message: string },
      { project: string; qgsFile: File }
    >({
      query: ({ project, qgsFile }) => {
        const formData = new FormData();
        formData.append('project', project);
        formData.append('qgs', qgsFile);
        return {
          url: '/api/projects/import/qgs/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
        { type: 'QGIS', id: arg.project },
      ],
    }),

    /**
     * POST /api/projects/import/qgz/
     * Import QGZ file
     */
    importQGZ: builder.mutation<
      { message: string },
      { project: string; qgzFile: File }
    >({
      query: ({ project, qgzFile }) => {
        const formData = new FormData();
        formData.append('project', project);
        formData.append('qgz', qgzFile);
        return {
          url: '/api/projects/import/qgz/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
        { type: 'QGIS', id: arg.project },
      ],
    }),

    /**
     * POST /api/projects/export
     * Export project as QGS/QGZ
     */
    exportProject: builder.mutation<
      Blob,
      { project: string; project_type: 'qgs' | 'qgz' }
    >({
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
     * GET /api/projects/app/set
     * Download APP set (all layers as GML for national application)
     */
    downloadAppSet: builder.mutation<
      Blob,
      { project: string }
    >({
      queryFn: async ({ project }, api, extraOptions, baseQuery) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

        try {
          const response = await fetch(`${baseUrl}/api/projects/app/set?project=${project}`, {
            method: 'GET',
            headers: {
              'Authorization': `Token ${token}`,
            },
          });

          if (!response.ok) {
            return { error: { status: response.status, data: await response.text() } };
          }

          const blob = await response.blob();

          // Trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project}_app.gml`;
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
     * Check subdomain availability
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
     * Change subdomain
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
     * POST /api/projects/logo
     * Upload project logo
     */
    updateLogo: builder.mutation<
      { message: string },
      { project: string; logo: File }
    >({
      query: ({ project, logo }) => {
        const formData = new FormData();
        formData.append('project', project);
        formData.append('logo', logo);
        return {
          url: '/api/projects/logo',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/metadata
     * Set project metadata
     */
    setMetadata: builder.mutation<
      { message: string },
      { project: string; metadata: Record<string, any> }
    >({
      query: ({ project, metadata }) => ({
        url: '/api/projects/metadata',
        method: 'POST',
        body: { project, ...metadata },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * GET /api/projects/new/json
     * Get project tree.json (layer hierarchy)
     *
     * ✅ OPTIMIZATION: Uses localStorage cache with 10-minute TTL
     * - First load: fetches from server (may take 1-3s for large projects)
     * - Subsequent loads: instant from localStorage cache
     * - Cache expires after 10 minutes to ensure fresh data
     */
    getProjectData: builder.query<
      QGISProjectTree,
      { project: string; published?: boolean; save?: boolean }
    >({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBQ) {
        const { project, published = false, save = false } = arg;

        // Check localStorage cache first (10 minute TTL)
        const cacheKey = `tree_cache_${project}_${published}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            const maxAge = 10 * 60 * 1000; // 10 minutes

            if (age < maxAge) {
              console.log(`✅ Using cached tree.json (age: ${(age / 1000).toFixed(0)}s)`);
              return { data };
            } else {
              console.log(`⏰ Cache expired (age: ${(age / 1000).toFixed(0)}s), fetching fresh tree.json`);
              localStorage.removeItem(cacheKey);
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse tree.json cache, fetching fresh data');
            localStorage.removeItem(cacheKey);
          }
        }

        // Fetch from server
        console.log(`🌐 Fetching fresh tree.json for project: ${project}`);
        const result = await fetchWithBQ({
          url: '/api/projects/new/json',
          params: { project, published, save },
        });

        if (result.error) {
          return { error: result.error };
        }

        // Cache successful response in localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            timestamp: Date.now(),
          }));
          console.log(`💾 Cached tree.json for ${project} (10 minute TTL)`);
        } catch (e) {
          console.warn('⚠️ Failed to cache tree.json (localStorage full?)', e);
        }

        return { data: result.data as QGISProjectTree };
      },
      providesTags: (result, error, arg) => [
        { type: 'QGIS', id: arg.project },
      ],
    }),

    /**
     * GET /api/projects/getLayersOrder
     * Get layer order
     */
    getLayersOrder: builder.query<
      { layers: string[] },
      { project: string }
    >({
      query: ({ project }) => ({
        url: '/api/projects/getLayersOrder',
        params: { project },
      }),
      providesTags: (result, error, arg) => [
        { type: 'QGIS', id: `${arg.project}-order` },
      ],
    }),

    /**
     * POST /api/projects/tree/order
     * Change layer/group order in project tree
     *
     * IMPORTANT: This endpoint exists but has different signature than implemented!
     * Backend expects: { project, object_type, object_id, new_parent_name, position }
     * Current code sends: { project, layers: [] }
     *
     * TODO: Refactor drag & drop logic to call this endpoint for each move operation:
     * - When user drags layer → call with { object_type: "layer", object_id, new_parent_name, position }
     * - Parse drag & drop position (before/after/inside) to backend position (0-based index)
     *
     * Backend docs: docs/backend/projects_api_docs.md line 556-596
     */
    changeLayersOrder: builder.mutation<
      { data: string; success: boolean; message: string },
      {
        project: string;
        object_type: 'layer' | 'group';
        object_id: string;
        new_parent_name: string;
        position: number;
      }
    >({
      query: ({ project, object_type, object_id, new_parent_name, position }) => ({
        url: '/api/projects/tree/order',
        method: 'POST',
        body: { project, object_type, object_id, new_parent_name, position },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'QGIS', id: `${arg.project}-order` },
        { type: 'QGIS', id: arg.project },
      ],
    }),

    /**
     * GET /api/projects/spaceproject
     * Get project disk space
     */
    getProjectSpace: builder.query<
      { size: number; size_mb: string },
      { project: string }
    >({
      query: ({ project }) => ({
        url: '/api/projects/spaceproject',
        params: { project },
      }),
    }),

    /**
     * GET /api/projects/search
     * Search projects
     */
    searchProjects: builder.query<
      ProjectsResponse,
      { query: string; category?: string }
    >({
      query: ({ query, category }) => ({
        url: '/api/projects/search',
        params: { q: query, category },
      }),
    }),

    /**
     * POST /api/projects/reload
     * Reload project from QGS file
     */
    reloadProject: builder.mutation<
      { message: string },
      { project: string }
    >({
      query: ({ project }) => ({
        url: '/api/projects/reload',
        method: 'POST',
        body: { project },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'QGIS', id: arg.project },
        { type: 'Project', id: arg.project },
      ],
    }),

    /**
     * POST /api/projects/repair
     * Repair project
     */
    repairProject: builder.mutation<
      { message: string },
      { project: string }
    >({
      query: ({ project }) => ({
        url: '/api/projects/repair',
        method: 'POST',
        body: { project },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'QGIS', id: arg.project },
        { type: 'Project', id: arg.project },
      ],
    }),

    /**
     * POST /api/projects/restore
     * Restore deleted project
     */
    restoreProject: builder.mutation<
      { message: string },
      { project: string }
    >({
      query: ({ project }) => ({
        url: '/api/projects/restore',
        method: 'POST',
        body: { project },
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),

    /**
     * POST /api/projects/basemap
     * Set basemap
     */
    setBasemap: builder.mutation<
      { message: string },
      { project: string; basemap: string }
    >({
      query: ({ project, basemap }) => ({
        url: '/api/projects/basemap',
        method: 'POST',
        body: { project, basemap },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'QGIS', id: arg.project },
      ],
    }),

    /**
     * POST /api/projects/print/image
     * Prepare print image
     */
    preparePrintImage: builder.mutation<
      { image_url: string },
      { project: string; bbox: string; width: number; height: number }
    >({
      query: ({ project, bbox, width, height }) => ({
        url: '/api/projects/print/image',
        method: 'POST',
        body: { project, bbox, width, height },
      }),
    }),

    /**
     * GET /api/projects/layer/distinct-values
     * Get distinct values for layer column
     */
    getDistinctValues: builder.query<
      { values: (string | number)[] },
      { project: string; layer: string; column: string }
    >({
      query: ({ project, layer, column }) => ({
        url: '/api/projects/layer/distinct-values',
        params: { project, layer, column },
      }),
    }),

    /**
     * GET /api/projects/layer/min-max
     * Get min/max values for numeric column
     */
    getMinMaxValues: builder.query<
      { min: number; max: number },
      { project: string; layer: string; column: string }
    >({
      query: ({ project, layer, column }) => ({
        url: '/api/projects/layer/min-max',
        params: { project, layer, column },
      }),
    }),

    /**
     * GET /api/projects/layer/numeric-columns
     * Get numeric columns for layer
     */
    getNumericColumns: builder.query<
      { columns: string[] },
      { project: string; layer: string }
    >({
      query: ({ project, layer }) => ({
        url: '/api/projects/layer/numeric-columns',
        params: { project, layer },
      }),
    }),

    /**
     * GET /api/projects/global-search
     * Global search across all projects
     */
    globalSearch: builder.query<
      { results: any[] },
      { query: string }
    >({
      query: ({ query }) => ({
        url: '/api/projects/global-search',
        params: { q: query },
      }),
    }),

    /**
     * POST /api/projects/services/publish
     * Publish selected layers as WMS/WFS to GeoServer
     *
     * Request: { project_name: string, children: LayerTree[] }
     * Response: { data: { wms_url, wfs_url }, success: boolean, message: string }
     */
    publishWMSWFS: builder.mutation<
      { data: { wms_url: string; wfs_url: string }; success: boolean; message: string },
      { project_name: string; children: any[] }
    >({
      query: (data) => ({
        url: '/api/projects/services/publish',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project_name },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /**
     * POST /api/projects/services/unpublish
     * Remove WMS/WFS services from GeoServer
     *
     * Request: { project: string }
     * Response: { success: boolean, message: string }
     */
    unpublishWMSWFS: builder.mutation<
      { success: boolean; message: string },
      { project: string }
    >({
      query: (data) => ({
        url: '/api/projects/services/unpublish',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetProjectsQuery,
  useGetPublicProjectsQuery,
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
  useGetProjectDataQuery,
  useGetLayersOrderQuery,
  useChangeLayersOrderMutation,
  useGetProjectSpaceQuery,
  useSearchProjectsQuery,
  useReloadProjectMutation,
  useRepairProjectMutation,
  useRestoreProjectMutation,
  useSetBasemapMutation,
  usePreparePrintImageMutation,
  useGetDistinctValuesQuery,
  useGetMinMaxValuesQuery,
  useGetNumericColumnsQuery,
  useGlobalSearchQuery,
  usePublishWMSWFSMutation,
  useUnpublishWMSWFSMutation,
  useDownloadAppSetMutation,
} = projectsApi;
