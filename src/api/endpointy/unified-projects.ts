// Unified Projects API Service
// Consolidates projects.ts and dashboard.ts into single source of truth
// Uses apiClient for consistent error handling and authentication

import { apiClient } from '../klient/client';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from '../typy/types';

export interface UnifiedCreateProjectData {
  project_name: string;
  custom_project_name?: string;
  description?: string;
  keywords?: string;
  category?: string;
  is_public?: boolean;
}

export interface UnifiedUpdateProjectData {
  project: string;
  custom_project_name?: string;
  domain?: string;
  keywords?: string;
  description?: string;
  category?: string;
  is_public?: boolean;
}

export interface ProjectData {
  success: boolean;
  project_name: string;
  custom_project_name: string;
  layers: any[];
  map_state: {
    viewState: {
      longitude: number;
      latitude: number;
      zoom: number;
      bearing: number;
      pitch: number;
    };
    mapStyle: string;
  };
  features: any[];
  created_at: string;
}

class UnifiedProjectsService {
  // ============================================================================
  // Core Project Operations
  // ============================================================================

  // REMOVED: Duplicate of RTK Query useGetProjectsQuery
  // Use: import { useGetProjectsQuery } from '@/redux/api/projectsApi'

  // REMOVED: Duplicate of RTK Query useGetPublicProjectsQuery
  // Use: import { useGetPublicProjectsQuery } from '@/redux/api/projectsApi'

  /**
   * Get specific project data with layers, map state, and features
   * Endpoint: GET /api/projects/new/json
   */
  async getProjectData(projectName: string): Promise<ProjectData> {
    return apiClient.get(`/api/projects/new/json?project=${encodeURIComponent(projectName)}&published=false`);
  }

  // REMOVED: Duplicate of RTK Query useCreateProjectMutation
  // Use: import { useCreateProjectMutation } from '@/redux/api/projectsApi'
  // NOTE: Legacy used /dashboard/projects/create/ (old endpoint)
  //       RTK Query uses /api/projects/create/ (correct endpoint with db_name)

  // REMOVED: Duplicate of RTK Query useUpdateProjectMutation
  // Use: import { useUpdateProjectMutation } from '@/redux/api/projectsApi'

  // REMOVED: Duplicate of RTK Query useDeleteProjectMutation
  // Use: import { useDeleteProjectMutation } from '@/redux/api/projectsApi'

  // REMOVED: Duplicate of RTK Query useTogglePublishMutation
  // Use: import { useTogglePublishMutation } from '@/redux/api/projectsApi'
  // NOTE: Backend has bug - returns 500 but actually publishes (workaround in ProjectSettingsDialog)

  // REMOVED: Duplicate of RTK Query useExportProjectMutation
  // Use: import { useExportProjectMutation } from '@/redux/api/projectsApi'

  // REMOVED: Duplicate of RTK Query useImportQGSMutation
  // Use: import { useImportQGSMutation } from '@/redux/api/projectsApi'
  // NOTE: RTK Query version has upload progress tracking via XMLHttpRequest

  // REMOVED: Duplicate of RTK Query useImportQGZMutation
  // Use: import { useImportQGZMutation } from '@/redux/api/projectsApi'
  // NOTE: RTK Query version has upload progress tracking via XMLHttpRequest

  // ============================================================================
  // REMOVED: All functions below migrated to RTK Query
  // ============================================================================

  // REMOVED: updateLogo - Use: useUpdateLogoMutation
  // REMOVED: setMetadata - Use: useSetMetadataMutation
  // REMOVED: getLayersOrder - Use: useGetLayersOrderQuery
  // REMOVED: changeLayersOrder - Use: useChangeLayersOrderMutation
  // REMOVED: getProjectSpace - Use: useGetProjectSpaceQuery
  // REMOVED: searchProjects - Use: useSearchProjectsQuery
  // REMOVED: reloadProject - Use: useReloadProjectMutation
  // REMOVED: repairProject - Use: useRepairProjectMutation
  // REMOVED: restoreProject - Use: useRestoreProjectMutation
  // REMOVED: setBasemap - Use: useSetBasemapMutation
  // REMOVED: preparePrintImage - Use: usePreparePrintImageMutation
  // REMOVED: importQGZProject - Use: useImportQGZMutation
  // REMOVED: importQGSProject - Use: useImportQGSMutation
  // REMOVED: importQGISProject - Auto-detect in component, use above mutations

  /**
   * Get project thumbnail URL
   * NOTE: This is a helper method, not an API call - OK to keep
   */
  getThumbnailUrl(projectName: string): string {
    return `${apiClient.getBaseURL()}/api/projects/thumbnail/${projectName}/`;
  }
}

// Export singleton instance
export const unifiedProjectsApi = new UnifiedProjectsService();

// Export for backward compatibility
export { unifiedProjectsApi as projectsApi };
