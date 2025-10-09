// Unified User API Service
// Handles user profile, settings, and authentication-related operations

import { apiClient } from '../klient/client';

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

class UnifiedUserService {
  /**
   * Get user profile
   * Endpoint: GET /dashboard/profile/
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/dashboard/profile/');
  }

  /**
   * Update user profile
   * Endpoint: PUT /dashboard/settings/profile/
   */
  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: any }> {
    return apiClient.put('/dashboard/settings/profile/', data);
  }

  /**
   * Change user password
   * Endpoint: PUT /dashboard/settings/password/
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.put('/dashboard/settings/password/', data);
  }

  /**
   * Send contact form
   * Endpoint: POST /dashboard/contact/
   * Note: No authentication required
   */
  async sendContactForm(data: ContactFormData): Promise<{ message: string }> {
    return apiClient.post('/dashboard/contact/', data);
  }
}

// Export singleton instance
export const unifiedUserApi = new UnifiedUserService();

// Export for backward compatibility
export { unifiedUserApi as userApi };
