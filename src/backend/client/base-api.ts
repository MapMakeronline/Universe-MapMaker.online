/**
 * RTK Query Base API Configuration
 *
 * Single source of truth for all backend communication.
 * All modules (auth, projects, layers, qgis, users) extend this base API.
 *
 * Benefits:
 * - Centralized auth token management
 * - Automatic request/response interceptors
 * - Built-in caching and invalidation
 * - Type-safe endpoints
 * - Auto-generated React hooks
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

/**
 * Base query configuration with authentication
 */
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online',
  prepareHeaders: (headers) => {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    // Let RTK Query handle Content-Type automatically
    return headers;
  },
  // Add timeout for slow connections
  timeout: 30000, // 30 seconds
});

/**
 * Base API with enhanced error handling
 */
const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    // Log error for debugging
    console.error('🔴 API Error:', {
      endpoint: typeof args === 'string' ? args : args.url,
      status: result.error.status,
      data: result.error.data,
    });

    // Handle 401 Unauthorized - redirect to login
    if (result.error.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
  }

  return result;
};

/**
 * Base API - All modules extend this
 *
 * Tag Types:
 * - Auth: Login, register, password reset
 * - Projects: Project list, detail, CRUD
 * - PublicProjects: Published projects (separate cache)
 * - Layers: Layer tree, visibility, opacity
 * - QGIS: QGS import/export, tree.json
 * - Users: User profile, settings
 * - Admin: Admin panel data
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    'Auth',
    'Project',        // Single project (detail)
    'Projects',       // List of projects
    'PublicProjects', // Published projects list
    'Layers',
    'LayerAttributes', // Layer attribute column names
    'LayerStyle',     // Layer styling (QML/SLD)
    'QGIS',
    'Users',
    'Admin',
  ],
  endpoints: () => ({}), // Empty - modules will inject endpoints
});

export default baseApi;
