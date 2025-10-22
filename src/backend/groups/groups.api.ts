/**
 * Groups Module - RTK Query API
 *
 * Endpoints for group management in QGIS projects:
 * - addGroup: Create new group
 * - removeGroupsAndLayers: Delete groups and layers
 * - addInspireGroup: Create INSPIRE-compliant group
 * - renameGroup: Change group name
 * - exportGroup: Export group as GML/GPKG ZIP
 * - setGroupVisibility: Toggle group visibility
 *
 * Documentation: docs/backend/groups_api_docs.md
 */

import { baseApi } from '../client/base-api';

/**
 * Response from add group endpoint
 */
interface AddGroupResponse {
  data: {
    id: string;
    name: string;
    [key: string]: any;
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for adding a group
 */
interface AddGroupParams {
  project: string;
  group_name: string;
  parent?: string; // Parent group name (empty string for root level)
}

/**
 * Parameters for removing groups and layers
 */
interface RemoveGroupsAndLayersParams {
  project: string;
  groups?: string[]; // Array of group names to remove
  layers?: string[]; // Array of layer IDs to remove
  remove_from_database?: boolean; // Whether to delete from PostgreSQL (default: false)
}

/**
 * Response from remove groups/layers endpoint
 */
interface RemoveGroupsAndLayersResponse {
  data: string;
  success: boolean;
  message: string;
}

/**
 * Parameters for adding INSPIRE group
 */
interface AddInspireGroupParams {
  project: string;
  group_name: string;
  parent?: string; // Parent group name
}

/**
 * Response from add INSPIRE group
 */
interface AddInspireGroupResponse {
  data: {
    layers: any[];
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for renaming a group
 */
interface RenameGroupParams {
  project: string;
  group_name: string; // Current group name
  new_name: string; // New group name
}

/**
 * Response from rename group
 */
interface RenameGroupResponse {
  data: {
    group_name: string;
  };
  success: boolean;
  message: string;
}

/**
 * Parameters for setting group visibility
 */
interface SetGroupVisibilityParams {
  project: string;
  group_name?: string; // Single group name
  groups?: string[]; // Array of group names
  checked: boolean; // Visibility (true/false)
}

/**
 * Response from set group visibility
 */
interface SetGroupVisibilityResponse {
  data: string;
  success: boolean;
  message: string;
}

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Add Group
     * POST /api/groups/add
     * Creates a new group in QGIS project
     *
     * Documentation: docs/backend/groups_api_docs.md (lines 16-60)
     */
    addGroup: builder.mutation<AddGroupResponse, AddGroupParams>({
      query: (params) => ({
        url: '/api/groups/add',
        method: 'POST',
        body: {
          project: params.project,
          group_name: params.group_name,
          parent: params.parent || '', // Empty string for root level
        },
      }),
      // Invalidate project data to trigger re-fetch of tree.json
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),

    /**
     * Remove Groups and Layers
     * POST /api/groups/layer/remove
     * Deletes selected groups and layers from project
     *
     * Documentation: docs/backend/groups_api_docs.md (lines 63-105)
     *
     * IMPORTANT:
     * - groups: array of group NAMES (not IDs)
     * - layers: array of layer IDs
     * - remove_from_database: if true, deletes from PostgreSQL (default: false)
     */
    removeGroupsAndLayers: builder.mutation<RemoveGroupsAndLayersResponse, RemoveGroupsAndLayersParams>({
      query: (params) => ({
        url: '/api/groups/layer/remove',
        method: 'POST',
        body: {
          project: params.project,
          groups: params.groups || [],
          layers: params.layers || [],
          remove_from_database: params.remove_from_database || false,
        },
      }),
      // Invalidate project data to trigger re-fetch of tree.json
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),

    /**
     * Add INSPIRE Group
     * POST /api/groups/inspire/add
     * Creates INSPIRE-compliant group with standard layers
     *
     * Documentation: docs/backend/groups_api_docs.md (lines 108-158)
     *
     * Creates layers:
     * - OfficialDocumentation (MultiPolygon)
     * - SpatialPlan (MultiPolygon)
     * - SuplementaryRegulation (MultiLineString)
     * - ZoningElement (MultiPolygon)
     */
    addInspireGroup: builder.mutation<AddInspireGroupResponse, AddInspireGroupParams>({
      query: (params) => ({
        url: '/api/groups/inspire/add',
        method: 'POST',
        body: {
          project: params.project,
          group_name: params.group_name,
          parent: params.parent || '',
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),

    /**
     * Rename Group
     * POST /api/groups/name
     * Changes group name
     *
     * Documentation: docs/backend/groups_api_docs.md (lines 161-202)
     */
    renameGroup: builder.mutation<RenameGroupResponse, RenameGroupParams>({
      query: (params) => ({
        url: '/api/groups/name',
        method: 'POST',
        body: {
          project: params.project,
          group_name: params.group_name,
          new_name: params.new_name,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),

    /**
     * Set Group Visibility
     * POST /api/groups/selection
     * Toggles group visibility (cascades to children)
     *
     * Documentation: docs/backend/groups_api_docs.md (lines 372-414)
     */
    setGroupVisibility: builder.mutation<SetGroupVisibilityResponse, SetGroupVisibilityParams>({
      query: (params) => ({
        url: '/api/groups/selection',
        method: 'POST',
        body: {
          project: params.project,
          group_name: params.group_name,
          groups: params.groups,
          checked: params.checked,
        },
      }),
      // Invalidate project data to trigger re-fetch of tree.json with updated visibility
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
        'Layers',
      ],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useAddGroupMutation,
  useRemoveGroupsAndLayersMutation,
  useAddInspireGroupMutation,
  useRenameGroupMutation,
  useSetGroupVisibilityMutation,
} = groupsApi;
