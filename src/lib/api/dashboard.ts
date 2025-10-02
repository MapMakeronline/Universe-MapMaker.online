// Dashboard API service for Django backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geocraft-production.up.railway.app';

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

export interface UpdateProjectData {
  project: string;
  custom_project_name?: string;
  domain?: string;
  keywords?: string;
  description?: string;
  category?: string;
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
}

export const dashboardService = new DashboardService();
