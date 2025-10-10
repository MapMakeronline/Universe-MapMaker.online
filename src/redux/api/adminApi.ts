import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/lib/api/client';

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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Token ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminStats', 'User'],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStatsResponse, void>({
      query: () => '/api/admin-stats/stats',
      providesTags: ['AdminStats'],
    }),

    updateUserLicense: builder.mutation<
      { success: boolean },
      { userId: number; licenseType: 'free' | 'paid' }
    >({
      query: ({ userId, licenseType }) => ({
        url: `/api/admin-stats/users/${userId}/license`,
        method: 'PATCH',
        body: { license_type: licenseType },
      }),
      invalidatesTags: ['AdminStats', 'User'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useUpdateUserLicenseMutation,
} = adminApi;
