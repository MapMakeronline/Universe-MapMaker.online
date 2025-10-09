// HTTP Client for GeoCraft Backend API
// Provides centralized request handling with authentication, error handling, and logging

import { mapLogger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geocraft-production.up.railway.app';

export interface ApiErrorResponse {
  [key: string]: string[] | string;
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isValidationError(): boolean {
    return this.status === 400;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  getFieldErrors(): Record<string, string> | null {
    if (!this.data || !this.isValidationError()) return null;

    const errors: Record<string, string> = {};
    Object.entries(this.data).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        errors[field] = messages.join(', ');
      } else if (typeof messages === 'string') {
        errors[field] = messages;
      }
    });
    return errors;
  }
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  private getAuthHeader(): HeadersInit {
    const token = this.getToken();
    return token
      ? {
          'Authorization': `Token ${token}`,
        }
      : {};
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: ApiErrorResponse | undefined;

      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: 'Failed to parse error response' };
        }
      }

      const errorMessage =
        errorData?.detail ||
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      mapLogger.error('API Error:', {
        status: response.status,
        message: errorMessage,
        data: errorData,
      });

      // Log detailed validation errors for 400 Bad Request
      if (response.status === 400 && errorData) {
        console.error('🚨 Validation Errors:', JSON.stringify(errorData, null, 2));
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    if (isJson) {
      return response.json();
    }

    // Return text for non-JSON responses
    return (await response.text()) as unknown as T;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    mapLogger.info(`[GET] ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    mapLogger.info(`[POST] ${url}`, data);
    console.log('📤 Sending data:', JSON.stringify(data, null, 2));

    const isFormData = data instanceof FormData;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    mapLogger.info(`[PUT] ${url}`, data);

    const isFormData = data instanceof FormData;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    mapLogger.info(`[PATCH] ${url}`, data);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    mapLogger.info(`[DELETE] ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
