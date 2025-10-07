// Auth State Initialization
// This file provides utilities to restore auth state from localStorage

import { authService } from './api/auth';

export interface StoredAuthState {
  token: string | null;
  user: any | null;
}

/**
 * Check if user is authenticated by verifying token exists in localStorage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('authToken');
  return !!token;
}

/**
 * Get stored auth token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Restore auth state from localStorage
 * This should be called on app initialization
 */
export async function restoreAuthState(): Promise<StoredAuthState> {
  const token = getStoredToken();

  if (!token) {
    return { token: null, user: null };
  }

  try {
    // Verify token is still valid by fetching user profile
    const user = await authService.getProfile();
    return { token, user };
  } catch (error) {
    // Token is invalid, clear it
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    return { token: null, user: null };
  }
}
