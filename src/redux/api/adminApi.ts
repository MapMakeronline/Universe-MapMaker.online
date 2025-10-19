import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  project_count: number;
  layer_count: number;
  storage_used: number;
  last_login: string | null;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  license_type: 'free' | 'paid';
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  new_users_30d: number;
  total_projects: number;
  total_layers: number;
  total_storage: number;
}

export interface AdminStatsResponse {
  system_stats: SystemStats;
  users: AdminUser[];
  timestamp: string;
}

export interface AdminProject {
  id: number;
  project_name: string;
  custom_project_name: string;
  description: string;
  category: string;
  published: boolean;
  domain_name: string;
  creationDate: string | null;
  logoExists: boolean;
  owner: {
    id: number | null;
    username: string;
    email: string;
  };
  // Diagnostic fields for project health
  qgs_file_exists: boolean;
  database_exists: boolean;
  is_valid: boolean;
  // Cloud Storage
  qgs_storage_url?: string;
}

export interface AdminProjectsResponse {
  total_projects: number;
  valid_projects: number;
  invalid_projects: number;
  missing_qgs_files: number;
  missing_databases: number;
  projects: AdminProject[];
  timestamp: string;
}

export interface StorageFile {
  type: 'qgs' | 'json';
  project: string;
  filename: string;
  path: string;
  url: string;
  description: string;
  size: string;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Token ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminStats', 'User', 'AdminProjects'],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStatsResponse, void>({
      query: () => '/api/admin-stats/stats',
      providesTags: ['AdminStats'],
    }),

    getAllProjects: builder.query<AdminProjectsResponse, void>({
      query: () => '/dashboard/projects/',
      transformResponse: (response: any) => {
        // Transform /dashboard/projects/ response to AdminProjectsResponse format
        const projects = response.list_of_projects || [];

        return {
          total_projects: projects.length,
          valid_projects: projects.filter((p: any) => p.qgs_file_exists && p.database_exists).length,
          invalid_projects: projects.filter((p: any) => !p.qgs_file_exists || !p.database_exists).length,
          missing_qgs_files: projects.filter((p: any) => !p.qgs_file_exists).length,
          missing_databases: projects.filter((p: any) => !p.database_exists).length,
          projects: projects.map((p: any) => ({
            id: p.id,
            project_name: p.project_name,
            custom_project_name: p.custom_project_name || '',
            description: p.description || '',
            category: p.category || 'Inne',
            published: p.published,
            domain_name: p.domain || '',
            creationDate: p.creationDate,
            logoExists: p.logoExists || false,
            owner: {
              id: p.owner?.id || null,
              username: p.owner?.username || 'Unknown',
              email: p.owner?.email || '',
            },
            qgs_file_exists: p.qgs_file_exists !== false,
            database_exists: p.database_exists !== false,
            is_valid: p.qgs_file_exists !== false && p.database_exists !== false,
            qgs_storage_url: p.qgs_storage_url,
          })),
          timestamp: new Date().toISOString(),
        };
      },
      providesTags: ['AdminProjects'],
    }),

    updateUserLicense: builder.mutation<
      { success: boolean; message?: string },
      { userId: number; licenseType: 'free' | 'paid' }
    >({
      query: ({ userId, licenseType }) => ({
        url: `/api/admin-stats/users/${userId}/license`,
        method: 'PATCH',
        body: { license_type: licenseType },
      }),
      invalidatesTags: ['AdminStats', 'User'],
    }),

    deleteUser: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (userId) => ({
        url: `/api/admin-stats/users/${userId}/delete`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminStats', 'User'],
    }),

    // Storage endpoints
    getStorageFiles: builder.query<StorageFile[], void>({
      query: () => '/dashboard/projects/',
      transformResponse: (response: any) => {
        const projects = response.list_of_projects || [];
        const storageFiles: StorageFile[] = [];

        projects.forEach((project: any) => {
          const projectName = project.project_name;

          // QGS file
          storageFiles.push({
            type: 'qgs',
            project: projectName,
            filename: `${projectName}.qgs`,
            path: `/projects/${projectName}/${projectName}.qgs`,
            url: `https://api.universemapmaker.online/media/projects/${projectName}/${projectName}.qgs`,
            description: 'QGIS Project File',
            size: 'Unknown',
          });

          // tree.json
          storageFiles.push({
            type: 'json',
            project: projectName,
            filename: 'tree.json',
            path: `/projects/${projectName}/tree.json`,
            url: `https://api.universemapmaker.online/media/projects/${projectName}/tree.json`,
            description: 'Layer Tree Configuration',
            size: 'Unknown',
          });

          // config.json
          storageFiles.push({
            type: 'json',
            project: projectName,
            filename: 'config.json',
            path: `/projects/${projectName}/config.json`,
            url: `https://api.universemapmaker.online/media/projects/${projectName}/config.json`,
            description: 'Project Configuration',
            size: 'Unknown',
          });
        });

        return storageFiles;
      },
      providesTags: ['AdminProjects'],
    }),

    // QGIS Server endpoints testing
    testQGISEndpoint: builder.mutation<
      { success: boolean; response: any; status: number },
      { project: string; service: string; request: string }
    >({
      queryFn: async ({ project, service, request }) => {
        try {
          const url = `https://api.universemapmaker.online/ows?SERVICE=${service}&VERSION=1.3.0&REQUEST=${request}&MAP=${project}`;
          const response = await fetch(url);
          const text = await response.text();

          return {
            data: {
              success: response.ok || text.includes('WMS_Capabilities') || text.includes('ServiceException'),
              response: text,
              status: response.status,
            },
          };
        } catch (error: any) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error.message,
            },
          };
        }
      },
    }),

    // Django API endpoints testing
    testDjangoEndpoint: builder.mutation<
      { success: boolean; response: any; status: number; responseTime: number },
      { path: string; method: string; requiresAuth: boolean }
    >({
      queryFn: async ({ path, method, requiresAuth }) => {
        try {
          const startTime = performance.now();
          const headers: HeadersInit = {};

          if (requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
              headers['Authorization'] = `Token ${token}`;
            }
          }

          const response = await fetch(`https://api.universemapmaker.online${path}`, {
            method,
            headers,
          });

          const endTime = performance.now();
          const responseTime = Math.round(endTime - startTime);

          let responseData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          return {
            data: {
              success: response.ok,
              response: responseData,
              status: response.status,
              responseTime,
            },
          };
        } catch (error: any) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error.message,
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAllProjectsQuery,
  useUpdateUserLicenseMutation,
  useDeleteUserMutation,
  useGetStorageFilesQuery,
  useTestQGISEndpointMutation,
  useTestDjangoEndpointMutation,
} = adminApi;
