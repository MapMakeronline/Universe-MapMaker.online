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
  UpdateProfileResponse,
  ChangePasswordData,
  ApiResponse,
} from '../types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /dashboard/settings/profile/
     * Get user profile
     */
    getUserProfile: builder.query<User, void>({
      query: () => '/dashboard/settings/profile/',
      transformResponse: (response: any) => {
        // Backend może zwrócić { data: user } lub bezpośrednio user
        return response.data || response;
      },
      providesTags: ['Users'],
    }),

    /**
     * PUT /dashboard/settings/profile/
     * Update user profile
     *
     * Backend returns: { message: "...", user: {...} }
     */
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileData>({
      query: (data) => ({
        url: '/dashboard/settings/profile/',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users', 'Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Backend returns { message: "...", user: {...} }
          if (data.user) {
            // Update localStorage with new user data
            localStorage.setItem('user', JSON.stringify(data.user));

            // CRITICAL: Update Redux authSlice to sync state across app
            // This ensures UI updates immediately without needing to logout/login
            const { updateUser } = await import('@/redux/slices/authSlice');
            dispatch(updateUser(data.user));
          }
        } catch (err) {
          console.error('Profile update failed:', err);
        }
      },
    }),

    /**
     * PUT /dashboard/settings/password/
     * Change password
     */
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordData>({
      query: (data) => ({
        url: '/dashboard/settings/password/',
        method: 'PUT',
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
