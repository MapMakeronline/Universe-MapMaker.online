'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth, setLoading } from '@/redux/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Restore authentication state from localStorage
 * Returns stored token and user data if available
 */
const restoreAuthState = async (): Promise<{ token: string | null; user: any | null }> => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : null;

    return { token, user };
  } catch (error) {
    console.error('Failed to restore auth state:', error);
    return { token: null, user: null };
  }
};

/**
 * AuthProvider - Restores authentication state from localStorage on app startup
 * Wraps the app to ensure auth state is initialized before rendering protected content
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      dispatch(setLoading(true));

      try {
        const { token, user } = await restoreAuthState();

        if (token && user) {
          dispatch(setAuth({ token, user }));
          console.log('✅ Auth state restored:', user.username);
        } else {
          console.log('ℹ️ No stored auth state found');
        }
      } catch (error) {
        console.error('❌ Failed to restore auth state:', error);
      } finally {
        dispatch(setLoading(false));
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [dispatch]);

  // Don't render children until auth is initialized
  // This prevents flash of "not logged in" content
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
