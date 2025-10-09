// API Configuration and Base Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  zip_code?: string;
  nip?: string;
  company_name?: string;
  theme: 'light' | 'dark';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  username: string;
  password: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || errorData.detail || `HTTP ${response.status}`,
          errors: errorData,
          detail: errorData.detail,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw {
        message: 'Network error or server unavailable',
        detail: String(error),
      } as ApiError;
    }
  }

  // Auth Endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async getProfile(): Promise<User> {
    return await this.request<User>('/auth/profile');
  }

  // Projects Endpoints (to be implemented)
  async getProjects(): Promise<any[]> {
    // TODO: Implement when projects endpoint is ready
    return [];
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export convenience functions
export const auth = {
  register: (data: RegisterData) => apiClient.register(data),
  login: (data: LoginData) => apiClient.login(data),
  logout: () => apiClient.logout(),
  getProfile: () => apiClient.getProfile(),
  getToken: () => apiClient.getToken(),
  isAuthenticated: () => !!apiClient.getToken(),
};

export default apiClient;
