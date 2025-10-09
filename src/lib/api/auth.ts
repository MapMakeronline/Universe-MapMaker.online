// Auth API service - unified with apiClient
// All authentication endpoints for Django backend

import { apiClient } from './client';
import type { User, AuthResponse, LoginCredentials, RegisterData } from './types';

class AuthService {
  /**
   * Register a new user
   * Backend: POST /auth/register
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Save token to localStorage via apiClient
    if (response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  /**
   * Login user
   * Backend: POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    // Save token to localStorage via apiClient
    if (response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  /**
   * Logout user (invalidates token on backend)
   * Backend: POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always remove token from localStorage, even if backend request fails
      apiClient.removeToken();
    }
  }

  /**
   * Get current user profile
   * Backend: GET /auth/profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return apiClient.isAuthenticated() ? localStorage.getItem('authToken') : null;
  }

  /**
   * Manually set auth token (e.g., after external login)
   */
  setToken(token: string): void {
    apiClient.setToken(token);
  }

  /**
   * Manually remove auth token
   */
  removeToken(): void {
    apiClient.removeToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
