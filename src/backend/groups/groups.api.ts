/**
 * Groups API - RTK Query Module
 *
 * Backend endpoints for managing layer groups in QGIS projects.
 *
 * Endpoints:
 * - POST /api/groups/add - Create new group
 * - POST /api/groups/layer/remove - Remove groups/layers
 * - POST /api/groups/inspire/add - Create INSPIRE group
 * - POST /api/groups/name - Change group name
 * - GET /api/groups/export - Export group to ZIP
 * - POST /api/groups/krajowy/version/add - Create app version
 * - GET /api/groups/krajowy/version/get - Get app history
 * - POST /api/groups/krajowy/restore - Restore app
 * - POST /api/groups/selection - Set group visibility
 *
 * See: docs/backend/groups_api_docs.md
 */

import { baseApi } from '../client/base-api';
import type {
  ApiResponse,
  AddGroupRequest,
  AddGroupResponse,
  RemoveGroupLayersRequest,
  ChangeGroupNameRequest,
  ChangeGroupNameResponse,
  SetGroupVisibilityRequest,
} from '../types';

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create new group in project
     *
     * POST /api/groups/add
     *
     * Creates a new group in the QGIS project layer tree.
     * Optionally can be nested under a parent group.
     *
     * @param project - Project name (e.g., "moj_projekt")
     * @param group_name - Name for the new group
     * @param parent - Optional parent group name (empty string for root level)
     *
     * @returns Group data with id, name, visible, type, children, etc.
     */
    addGroup: builder.mutation<ApiResponse<AddGroupResponse>, AddGroupRequest>({
      query: (body) => ({
        url: '/api/groups/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        'Layers',
      ],
    }),

    /**
     * Remove groups and layers from project
     *
     * POST /api/groups/layer/remove
     *
     * Removes selected groups and/or layers from the project.
     * Optionally deletes data from PostGIS database.
     *
     * @param project - Project name
     * @param groups - Array of group names to remove
     * @param layers - Array of layer IDs to remove
     * @param remove_from_database - If true, also deletes from PostGIS
     */
    removeGroupsAndLayers: builder.mutation<ApiResponse<null>, RemoveGroupLayersRequest>({
      query: (body) => ({
        url: '/api/groups/layer/remove',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        'Layers',
      ],
    }),

    /**
     * Change group name
     *
     * POST /api/groups/name
     *
     * Renames an existing group in the project.
     *
     * @param project - Project name
     * @param group_name - Current group name
     * @param new_name - New name for the group
     */
    changeGroupName: builder.mutation<ApiResponse<ChangeGroupNameResponse>, ChangeGroupNameRequest>({
      query: (body) => ({
        url: '/api/groups/name',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        'Layers',
      ],
    }),

    /**
     * Set group visibility
     *
     * POST /api/groups/selection
     *
     * Changes visibility of a group and/or its layers in the project.
     *
     * @param project - Project name
     * @param group_name - Group name (optional)
     * @param groups - Array of group names (optional)
     * @param layer_id - Single layer ID (optional)
     * @param layers - Array of layer IDs (optional)
     * @param checked - Visibility state (true = visible, false = hidden)
     */
    setGroupVisibility: builder.mutation<ApiResponse<null>, SetGroupVisibilityRequest>({
      query: (body) => ({
        url: '/api/groups/selection',
        method: 'POST',
        body,
      }),
      // Note: We don't invalidate tags here because visibility changes
      // are handled optimistically in Redux state without refetching
    }),

    /**
     * Export group to ZIP
     *
     * GET /api/groups/export
     *
     * Exports a group with all its layers to GML/GPKG format in ZIP archive.
     *
     * @param project - Project name
     * @param group - Group name to export
     * @param epsg - EPSG code for coordinate system (e.g., 2180, 3857)
     *
     * @returns ZIP file download
     */
    exportGroup: builder.mutation<Blob, { project: string; group: string; epsg: number }>({
      query: ({ project, group, epsg }) => ({
        url: `/api/groups/export?project=${encodeURIComponent(project)}&group=${encodeURIComponent(group)}&epsg=${epsg}`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * Create INSPIRE group
     *
     * POST /api/groups/inspire/add
     *
     * Creates an INSPIRE-compliant group with standard layers:
     * - OfficialDocumentation (MultiPolygon)
     * - SpatialPlan (MultiPolygon)
     * - SuplementaryRegulation (MultiLineString)
     * - ZoningElement (MultiPolygon)
     *
     * @param project - Project name
     * @param group_name - Name for the INSPIRE group
     * @param parent - Optional parent group name
     */
    addInspireGroup: builder.mutation<ApiResponse<any>, AddGroupRequest>({
      query: (body) => ({
        url: '/api/groups/inspire/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        'Layers',
      ],
    }),

    /**
     * Create app version (for national law applications)
     *
     * POST /api/groups/krajowy/version/add
     *
     * Creates a historical version of a national law application.
     * Exports current layers to GML and creates a GeoJSON backup.
     *
     * @param project - Project name
     * @param group_name - National law app group name
     *
     * @returns Version info with timestamp and version ID
     */
    addAppVersion: builder.mutation<
      ApiResponse<{ poczatekWersjiObiektu: string; wersjaId: string }>,
      { project: string; group_name: string }
    >({
      query: (body) => ({
        url: '/api/groups/krajowy/version/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
      ],
    }),

    /**
     * Get app history (for national law applications)
     *
     * GET /api/groups/krajowy/version/get
     *
     * Retrieves all historical versions of a national law application
     * as a ZIP archive with GML files.
     *
     * @param project - Project name
     * @param group_name - National law app group name
     * @param epsg - Optional EPSG code (default: 2180)
     *
     * @returns ZIP file download
     */
    getAppHistory: builder.mutation<Blob, { project: string; group_name: string; epsg?: number }>({
      query: ({ project, group_name, epsg = 2180 }) => ({
        url: `/api/groups/krajowy/version/get?project=${encodeURIComponent(project)}&group_name=${encodeURIComponent(group_name)}&epsg=${epsg}`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * Restore app (for national law applications)
     *
     * POST /api/groups/krajowy/restore
     *
     * Restores a national law application to the previous version
     * from backup. This operation:
     * 1. Reads backup from folder
     * 2. Restores layers to PostgreSQL using ogr2ogr
     * 3. Removes last saved GML version
     * 4. Cleans backup folder
     *
     * @param project - Project name
     * @param group_name - National law app group name
     */
    restoreApp: builder.mutation<ApiResponse<null>, { project: string; group_name: string }>({
      query: (body) => ({
        url: '/api/groups/krajowy/restore',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { project }) => [
        { type: 'Project', id: project },
        'Layers',
      ],
    }),
  }),
});

export const {
  useAddGroupMutation,
  useRemoveGroupsAndLayersMutation,
  useChangeGroupNameMutation,
  useSetGroupVisibilityMutation,
  useExportGroupMutation,
  useAddInspireGroupMutation,
  useAddAppVersionMutation,
  useGetAppHistoryMutation,
  useRestoreAppMutation,
} = groupsApi;
