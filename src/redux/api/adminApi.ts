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
  categories: string;
  published: boolean;
  domain_name: string;
  project_date: string | null;
  project_time: string | null;
  owner: {
    id: number | null;
    username: string;
    email: string;
  };
  logoExists: boolean;
}

export interface AdminProjectsResponse {
  total_projects: number;
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
      query: () => '/api/admin-stats/projects',
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
