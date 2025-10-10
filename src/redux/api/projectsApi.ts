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
    headers.set('Content-Type', 'application/json');
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
     * Create a new project
     */
    createProject: builder.mutation<Project, CreateProjectData>({
      query: (data) => ({
        url: '/api/projects/create/',
        method: 'POST',
        body: data,
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
      {
        name: string;
        extent: [number, number, number, number];
        logoExists: boolean;
        large: boolean;
        children: any[];
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
  }),
});

/**
 * Auto-generated hooks for components
 *
 * Queries (auto-refetch on mount/focus):
 * - useGetProjectsQuery() - User's own projects (requires auth)
 * - useGetPublicProjectsQuery() - All published projects (no auth required)
 * - useGetProjectDataQuery() - Project data structure for map view
 *
 * Mutations (manual trigger):
 * - useCreateProjectMutation()
 * - useUpdateProjectMutation()
 * - useDeleteProjectMutation()
 * - useTogglePublishMutation()
 * - useExportProjectMutation() - Export as QGS/QGZ
 * - useCheckSubdomainAvailabilityMutation() - Check subdomain
 * - useChangeDomainMutation() - Change project domain
 */
export const {
  useGetProjectsQuery,
  useGetPublicProjectsQuery,
  useGetProjectDataQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useTogglePublishMutation,
  useExportProjectMutation,
  useCheckSubdomainAvailabilityMutation,
  useChangeDomainMutation,
} = projectsApi;
