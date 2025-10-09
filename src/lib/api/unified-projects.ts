// Unified Projects API Service
// Consolidates projects.ts and dashboard.ts into single source of truth
// Uses apiClient for consistent error handling and authentication

import { apiClient } from './client';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from './types';

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

  /**
   * Get all projects for the authenticated user
   * Endpoint: GET /dashboard/projects/
   */
  async getProjects(): Promise<ProjectsResponse> {
    return apiClient.get<ProjectsResponse>('/dashboard/projects/');
  }

  /**
   * Get public projects (no authentication required)
   * Endpoint: GET /dashboard/projects/public/
   */
  async getPublicProjects(): Promise<{ success: boolean; projects: Project[]; count: number }> {
    return apiClient.get('/dashboard/projects/public/');
  }

  /**
   * Get specific project data with layers, map state, and features
   * Endpoint: GET /dashboard/projects/{projectName}/
   */
  async getProjectData(projectName: string): Promise<ProjectData> {
    return apiClient.get(`/dashboard/projects/${encodeURIComponent(projectName)}/`);
  }

  /**
   * Create a new project
   * Endpoint: POST /dashboard/projects/create/
   *
   * @param data - Project creation data (supports both old and new formats)
   */
  async createProject(data: CreateProjectData | UnifiedCreateProjectData): Promise<{
    success: boolean;
    message: string;
    project: Project
  }> {
    // Transform data to dashboard endpoint format if needed
    const dashboardData = 'project' in data ? {
      project_name: data.project,
      custom_project_name: data.domain,
      description: data.projectDescription,
      keywords: data.keywords,
      category: data.categories?.[0] || 'Inne',
      is_public: false,
    } : data;

    return apiClient.post('/dashboard/projects/create/', dashboardData);
  }

  /**
   * Update project metadata
   * Endpoint: PUT /dashboard/projects/update/
   */
  async updateProject(data: UpdateProjectData | UnifiedUpdateProjectData): Promise<{
    success: boolean;
    message: string
  }> {
    return apiClient.put('/dashboard/projects/update/', data);
  }

  /**
   * Delete a project
   * Endpoint: DELETE /dashboard/projects/delete/?project={projectName}
   *
   * STANDARDIZED: Now uses dashboard endpoint with DELETE method
   */
  async deleteProject(projectName: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/dashboard/projects/delete/?project=${encodeURIComponent(projectName)}`);
  }

  // ============================================================================
  // Project Visibility & Publishing
  // ============================================================================

  /**
   * Toggle project publish status
   * Endpoint: POST /api/projects/publish
   *
   * STANDARDIZED: Single endpoint for both publish/unpublish
   */
  async togglePublish(projectName: string, publish: boolean): Promise<{
    success: boolean;
    message: string
  }> {
    return apiClient.post('/api/projects/publish', {
      project: projectName,
      publish: publish,
    });
  }

  // ============================================================================
  // Import & Export
  // ============================================================================

  /**
   * Export project to QGS or QGZ format
   * Endpoint: POST /api/projects/export
   *
   * STANDARDIZED: Consistent export implementation
   */
  async exportProject(projectName: string, projectType: 'qgs' | 'qgz' = 'qgs'): Promise<Blob> {
    return apiClient.post('/api/projects/export', {
      project: projectName,
      project_type: projectType,
    }, {
      // Return blob for file download
      headers: { 'Accept': 'application/octet-stream' }
    });
  }

  /**
   * Import QGS project file
   * Endpoint: POST /api/projects/import/qgs/
   */
  async importQGS(file: File, projectName?: string): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('qgs', file);
    if (projectName) {
      formData.append('project', projectName);
    }
    return apiClient.post('/api/projects/import/qgs/', formData);
  }

  /**
   * Import QGZ project file (compressed)
   * Endpoint: POST /api/projects/import/qgz/
   */
  async importQGZ(file: File, projectName?: string): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('qgz', file);
    if (projectName) {
      formData.append('project', projectName);
    }
    return apiClient.post('/api/projects/import/qgz/', formData);
  }

  // ============================================================================
  // Project Metadata & Settings
  // ============================================================================

  /**
   * Update project logo
   * Endpoint: POST /api/projects/logo/update/
   */
  async updateLogo(projectName: string, logo: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('project', projectName);
    formData.append('logo', logo);
    return apiClient.post('/api/projects/logo/update/', formData);
  }

  /**
   * Set project metadata (description, keywords, categories)
   * Endpoint: POST /api/projects/metadata
   */
  async setMetadata(
    projectName: string,
    metadata: {
      description?: string;
      keywords?: string;
      categories?: string;
    }
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/metadata', {
      project: projectName,
      ...metadata,
    });
  }

  /**
   * Get project thumbnail URL
   */
  getThumbnailUrl(projectName: string): string {
    return `${apiClient.getBaseURL()}/api/projects/thumbnail/${projectName}/`;
  }

  // ============================================================================
  // Domain Management
  // ============================================================================

  /**
   * Check subdomain availability
   * Endpoint: POST /api/projects/subdomainAvailability
   */
  async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean }> {
    return apiClient.post('/api/projects/subdomainAvailability', { subdomain });
  }

  /**
   * Change project domain
   * Endpoint: POST /api/projects/domain/change
   */
  async changeDomain(projectName: string, newDomain: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/domain/change', {
      project_name: projectName,
      domain: newDomain,
    });
  }

  // ============================================================================
  // Layer Management
  // ============================================================================

  /**
   * Get project layer order
   * Endpoint: POST /api/projects/order
   */
  async getLayersOrder(projectName: string): Promise<{ layers: string[] }> {
    return apiClient.post('/api/projects/order', { project_name: projectName });
  }

  /**
   * Change layer tree order
   * Endpoint: POST /api/projects/tree/order
   */
  async changeLayersOrder(projectName: string, order: string[]): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/tree/order', {
      project_name: projectName,
      order,
    });
  }

  // ============================================================================
  // Project Utilities
  // ============================================================================

  /**
   * Get project storage usage
   * Endpoint: POST /api/projects/space/get
   */
  async getProjectSpace(projectName: string): Promise<{ size_mb: number }> {
    return apiClient.post('/api/projects/space/get', { project_name: projectName });
  }

  /**
   * Search projects
   * Endpoint: POST /api/projects/search
   */
  async searchProjects(query: string): Promise<{ projects: Project[] }> {
    return apiClient.post('/api/projects/search', { query });
  }

  /**
   * Reload project (refresh from QGIS)
   * Endpoint: POST /api/projects/reload
   */
  async reloadProject(projectName: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/reload', { project_name: projectName });
  }

  /**
   * Repair corrupted project
   * Endpoint: POST /api/projects/repair
   */
  async repairProject(projectName: string): Promise<{ success: boolean; issues_fixed: string[] }> {
    return apiClient.post('/api/projects/repair', { project_name: projectName });
  }

  /**
   * Restore project from backup
   * Endpoint: POST /api/projects/restore
   */
  async restoreProject(projectName: string, version?: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/restore', {
      project_name: projectName,
      version,
    });
  }

  /**
   * Set project basemap
   * Endpoint: POST /api/projects/basemap/set
   */
  async setBasemap(
    projectName: string,
    basemap: {
      type: 'osm' | 'mapbox' | 'google' | 'bing';
      url?: string;
      api_key?: string;
    }
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/basemap/set', {
      project_name: projectName,
      ...basemap,
    });
  }

  /**
   * Prepare project print/preview image
   * Endpoint: POST /api/projects/print
   */
  async preparePrintImage(
    projectName: string,
    options: {
      bbox: [number, number, number, number];
      width: number;
      height: number;
      dpi?: number;
    }
  ): Promise<{ image_url: string }> {
    return apiClient.post('/api/projects/print', {
      project_name: projectName,
      ...options,
    });
  }

  /**
   * Import QGIS project from .qgz file
   * POST /projects/import/qgz/
   */
  async importQGZProject(file: File, projectName: string): Promise<any> {
    const formData = new FormData();
    formData.append('project', projectName);
    formData.append('qgz', file);

    return apiClient.post('/projects/import/qgz/', formData);
  }

  /**
   * Import QGIS project from .qgs file
   * POST /projects/import/qgs/
   */
  async importQGSProject(file: File, projectName: string): Promise<any> {
    const formData = new FormData();
    formData.append('project', projectName);
    formData.append('qgs', file);

    return apiClient.post('/projects/import/qgs/', formData);
  }

  /**
   * Import QGIS project (auto-detects file type)
   */
  async importQGISProject(file: File, projectName: string): Promise<any> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'qgz') {
      return this.importQGZProject(file, projectName);
    } else if (extension === 'qgs') {
      return this.importQGSProject(file, projectName);
    } else {
      throw new Error('Unsupported file format. Please use .qgz or .qgs files.');
    }
  }
}

// Export singleton instance
export const unifiedProjectsApi = new UnifiedProjectsService();

// Export for backward compatibility
export { unifiedProjectsApi as projectsApi };
