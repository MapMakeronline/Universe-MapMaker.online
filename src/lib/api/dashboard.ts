// Dashboard API service for Django backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

export interface Project {
  project_name: string;
  custom_project_name: string;
  published: boolean;
  logoExists: boolean;
  description: string;
  keywords: string;
  project_date: string;
  project_time: string;
  domain_name: string;
  domain_url: string;
  categories: string;
  qgs_exists: boolean;
}

export interface DbInfo {
  login: string;
  password: string;
  host: string;
  port: string;
}

export interface ProjectsResponse {
  list_of_projects: Project[];
  db_info: DbInfo;
}

export interface CreateProjectData {
  project: string; // Backend expects "project" not "project_name"
  domain: string; // Backend expects "domain" not "custom_project_name"
  projectDescription?: string; // Backend expects "projectDescription" not "description"
  keywords?: string;
  category?: string; // Backend service.py uses "category" (singular)
  is_public?: boolean;
}

export interface UpdateProjectData {
  project: string;
  custom_project_name?: string;
  domain?: string;
  keywords?: string;
  description?: string;
  category?: string;
  is_public?: boolean;
}

export interface UpdateProfileData {
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  nip?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  theme?: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ContactFormData {
  subject: string;
  name: string;
  email: string;
  message: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  zip_code: string;
  nip: string;
  company_name: string;
  theme: string;
  statistics?: {
    total_projects: number;
    public_projects: number;
    private_projects: number;
  };
}

class DashboardService {
  private getAuthHeader(): HeadersInit {
    const token = this.getToken();
    return token
      ? {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/dashboard/profile/`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async getProjects(): Promise<ProjectsResponse> {
    const response = await fetch(`${API_URL}/dashboard/projects/`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async createProject(data: CreateProjectData): Promise<{ success: boolean; message: string; project: Project }> {
    const response = await fetch(`${API_URL}/dashboard/projects/create/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async updateProject(data: UpdateProjectData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/dashboard/projects/update/`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: any }> {
    const response = await fetch(`${API_URL}/dashboard/settings/profile/`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/dashboard/settings/password/`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async sendContactForm(data: ContactFormData): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/dashboard/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async deleteProject(projectName: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/dashboard/projects/delete/?project=${encodeURIComponent(projectName)}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async getPublicProjects(): Promise<{ success: boolean; projects: Project[]; count: number }> {
    const response = await fetch(`${API_URL}/dashboard/projects/public/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async toggleProjectPublish(projectName: string, publish: boolean): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/projects/publish`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        project: projectName,
        publish: publish
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async exportProject(projectName: string, projectType: 'qgs' | 'qgz' = 'qgs'): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/projects/export`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        project: projectName,
        project_type: projectType
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.blob();
  }

  async getProjectData(projectName: string): Promise<{
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
  }> {
    const response = await fetch(`${API_URL}/dashboard/projects/${encodeURIComponent(projectName)}/`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }
}

export const dashboardService = new DashboardService();
