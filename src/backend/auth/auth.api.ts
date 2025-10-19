/**
 * Auth Module - RTK Query API
 *
 * Endpoints:
 * - login: User authentication
 * - register: New user registration
 * - logout: Clear auth token
 * - resetPassword: Password reset request
 * - confirmPasswordReset: Confirm password reset with token
 * - getCurrentUser: Get authenticated user info
 */

import { baseApi } from '../client/base-api';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ApiResponse,
} from '../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      // Save token to localStorage on success
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.error('Login failed:', err);
        }
      },
    }),

    // Register
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
      // Save token to localStorage on success
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.error('Registration failed:', err);
        }
      },
    }),

    // Logout
    logout: builder.mutation<void, void>({
      queryFn: () => {
        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return { data: undefined };
      },
      invalidatesTags: ['Auth', 'Projects', 'Layers', 'Users'],
    }),

    // Get Current User
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/user',
      providesTags: ['Auth'],
    }),

    // Reset Password Request
    resetPassword: builder.mutation<ApiResponse<null>, { email: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Confirm Password Reset
    confirmPasswordReset: builder.mutation<
      ApiResponse<null>,
      { token: string; password: string }
    >({
      query: (data) => ({
        url: '/auth/reset-password/confirm',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useResetPasswordMutation,
  useConfirmPasswordResetMutation,
} = authApi;
