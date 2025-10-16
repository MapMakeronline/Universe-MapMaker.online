'use client';

import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { makeStore, AppStore } from '@/redux/store';
import { themeOptimized as theme } from '@/styles/theme';
import ErrorBoundary from '@/common/ErrorBoundary';
import AuthProvider from '@/features/autoryzacja/AuthProvider';
import { NotificationProvider } from '@/common/NotificationProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Create store instance using useRef to ensure it's created only once per component instance
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <ErrorBoundary showDetails={isDevelopment}>
      <Provider store={storeRef.current}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
            <NotificationProvider />
          </ThemeProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
}
