'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth, setLoading } from '@/redux/slices/authSlice';
import { restoreAuthState } from '@/narzedzia/auth/auth-init';

interface AuthProviderProps {
  children: React.ReactNode;
}

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
