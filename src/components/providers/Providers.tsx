'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { store } from '@/store/store';
import { theme } from '@/lib/theme';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary showDetails={isDevelopment}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}