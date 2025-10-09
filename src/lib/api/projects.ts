// Projects API service for GeoCraft Backend
// Handles project CRUD operations, import/export, and publishing

import { apiClient } from './client';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  ExportProjectOptions,
} from './types';

class ProjectsService {
  /**
   * Get all projects for the authenticated user
   */
  async getProjects(): Promise<ProjectsResponse> {
    return apiClient.get<ProjectsResponse>('/dashboard/projects/');
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    return apiClient.post<Project>('/api/projects/create/', data);
  }

  /**
   * Update project metadata
   */
  async updateProject(data: UpdateProjectData): Promise<{ success: boolean; message: string }> {
    return apiClient.put('/dashboard/projects/update/', data);
  }

  /**
   * Delete a project
   * Backend: POST /api/projects/remove/
   */
  async deleteProject(projectName: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/api/projects/remove/', { project: projectName });
  }

  /**
   * Publish/unpublish a project
   * Backend: POST /api/projects/app/publish or /api/projects/app/unpublish
   */
  async publishProject(projectName: string, publish: boolean): Promise<{ success: boolean }> {
    const endpoint = publish ? '/api/projects/app/publish' : '/api/projects/app/unpublish';
    return apiClient.post(endpoint, { project: projectName });
  }

  /**
   * Export project to various formats
   */
  async exportProject(
    projectName: string,
    options?: ExportProjectOptions
  ): Promise<Blob> {
    const params = new URLSearchParams({
      project_name: projectName,
      ...(options?.format && { format: options.format }),
      ...(options?.paper_size && { paper_size: options.paper_size }),
      ...(options?.orientation && { orientation: options.orientation }),
      ...(options?.dpi && { dpi: options.dpi.toString() }),
    });

    const response = await fetch(
      `${apiClient.getBaseURL()}/api/projects/export?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Import QGS project file
   * Backend: POST /api/projects/import/qgs/
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
   * Backend: POST /api/projects/import/qgz/
   */
  async importQGZ(file: File, projectName?: string): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('qgz', file);
    if (projectName) {
      formData.append('project', projectName);
    }

    return apiClient.post('/api/projects/import/qgz/', formData);
  }

  /**
   * Check subdomain availability
   */
  async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean }> {
    return apiClient.post('/api/projects/subdomainAvailability', { subdomain });
  }

  /**
   * Change project domain
   */
  async changeDomain(projectName: string, newDomain: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/domain/change', {
      project_name: projectName,
      domain: newDomain,
    });
  }

  /**
   * Get project layer order
   */
  async getLayersOrder(projectName: string): Promise<{ layers: string[] }> {
    return apiClient.post('/api/projects/order', { project_name: projectName });
  }

  /**
   * Change layer tree order
   */
  async changeLayersOrder(
    projectName: string,
    order: string[]
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/tree/order', {
      project_name: projectName,
      order,
    });
  }

  /**
   * Get project storage usage
   */
  async getProjectSpace(projectName: string): Promise<{ size_mb: number }> {
    return apiClient.post('/api/projects/space/get', { project_name: projectName });
  }

  /**
   * Upload project logo
   * Backend: POST /api/projects/logo/update/
   */
  async updateLogo(projectName: string, logo: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('project', projectName);
    formData.append('logo', logo);

    return apiClient.post('/api/projects/logo/update/', formData);
  }

  /**
   * Set project metadata (description, keywords, etc.)
   * Backend: POST /api/projects/metadata
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
   * Search projects
   */
  async searchProjects(query: string): Promise<{ projects: Project[] }> {
    return apiClient.post('/api/projects/search', { query });
  }

  /**
   * Get project thumbnail URL
   */
  getThumbnailUrl(projectName: string): string {
    return `${apiClient.getBaseURL()}/api/projects/thumbnail/${projectName}/`;
  }

  /**
   * Prepare project print/preview image
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
   * Restore project from backup
   */
  async restoreProject(projectName: string, version?: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/restore', {
      project_name: projectName,
      version,
    });
  }

  /**
   * Repair corrupted project
   */
  async repairProject(projectName: string): Promise<{ success: boolean; issues_fixed: string[] }> {
    return apiClient.post('/api/projects/repair', { project_name: projectName });
  }

  /**
   * Reload project (refresh from QGIS)
   */
  async reloadProject(projectName: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/projects/reload', { project_name: projectName });
  }

  /**
   * Set project basemap
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

  // Helper method to get auth token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}

export const projectsApi = new ProjectsService();
