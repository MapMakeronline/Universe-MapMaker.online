/**
 * Backend Integration - Central Export
 *
 * New unified backend structure:
 * - One RTK Query baseApi for all communication
 * - Module-based organization (auth, projects, layers, users)
 * - No duplicate fetch/axios calls
 * - Automatic caching and invalidation
 *
 * Usage:
 * import { useLoginMutation } from '@/backend';
 * import { useGetProjectsQuery, useCreateProjectMutation } from '@/backend';
 * import { useAddGeoJsonLayerMutation } from '@/backend';
 * import { useGetUserProfileQuery } from '@/backend';
 */

// Export base API for Redux store configuration
export { baseApi } from './client/base-api';

// Export all types
export * from './types';

// Export all modules
export * from './auth';
export * from './projects';
export * from './layers';
export * from './users';
export * from './contact';
