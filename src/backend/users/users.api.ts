/**
 * Users Module - RTK Query API
 *
 * Endpoints:
 * - getUserProfile: Get user profile
 * - updateProfile: Update user info
 * - changePassword: Change password
 * - deleteAccount: Delete user account
 */

import { baseApi } from '../client/base-api';
import type {
  User,
  UpdateProfileData,
  ChangePasswordData,
  ApiResponse,
} from '../types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/user/profile
     * Get user profile
     */
    getUserProfile: builder.query<User, void>({
      query: () => '/api/user/profile',
      providesTags: ['Users'],
    }),

    /**
     * PUT /api/user/profile
     * Update user profile
     */
    updateProfile: builder.mutation<ApiResponse<User>, UpdateProfileData>({
      query: (data) => ({
        url: '/api/user/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users', 'Auth'],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            // Update localStorage user data
            localStorage.setItem('user', JSON.stringify(data.data));
          }
        } catch (err) {
          console.error('Profile update failed:', err);
        }
      },
    }),

    /**
     * POST /api/user/change-password
     * Change password
     */
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordData>({
      query: (data) => ({
        url: '/api/user/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * DELETE /api/user/account
     * Delete account
     */
    deleteAccount: builder.mutation<ApiResponse<null>, { password: string }>({
      query: (data) => ({
        url: '/api/user/account',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Users', 'Auth', 'Projects'],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear all local storage
          localStorage.clear();
          // Redirect to home
          window.location.href = '/';
        } catch (err) {
          console.error('Account deletion failed:', err);
        }
      },
    }),
  }),
});

// Export hooks
export const {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
} = usersApi;
