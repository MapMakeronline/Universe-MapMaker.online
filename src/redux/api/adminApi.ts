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
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAllProjectsQuery,
  useUpdateUserLicenseMutation,
  useDeleteUserMutation,
} = adminApi;
