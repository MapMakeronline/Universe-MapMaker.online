// Auth API service for Django backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

export interface LoginCredentials {
  username: string; // email will be used as username
  password: string;
}

export interface RegisterData {
  username: string; // email will be used as username
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  zip_code?: string;
  nip?: string;
  company_name?: string;
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
  theme?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  [key: string]: string[] | string;
}

class AuthService {
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

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
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

    const result = await response.json();

    // Save token to localStorage
    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();

    // Save token to localStorage
    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  async logout(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      return;
    }

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeader(),
      });
    } finally {
      // Always remove token from localStorage
      this.removeToken();
    }
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
