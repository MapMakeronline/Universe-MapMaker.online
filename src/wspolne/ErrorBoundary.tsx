'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import Refresh from '@mui/icons-material/Refresh';
import Home from '@mui/icons-material/Home';
import { logger } from '@/narzedzia/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (will appear in production error tracking)
    logger.error('🚨 ErrorBoundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   sendErrorToService(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              {/* Error Icon */}
              <ErrorOutline
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 3,
                }}
              />

              {/* Error Title */}
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Coś poszło nie tak
              </Typography>

              {/* Error Message */}
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Przepraszamy, wystąpił nieoczekiwany błąd. Zespół został
                powiadomiony i pracuje nad rozwiązaniem problemu.
              </Typography>

              {/* Error Details (only in development) */}
              {this.props.showDetails && this.state.error && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    textAlign: 'left',
                    bgcolor: 'grey.50',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  sx={{ minWidth: '140px' }}
                >
                  Odśwież stronę
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{ minWidth: '140px' }}
                >
                  Strona główna
                </Button>
              </Box>

              {/* Try Again Button (for soft reset) */}
              <Button
                variant="text"
                onClick={this.handleReset}
                sx={{ mt: 2 }}
              >
                Spróbuj ponownie
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight Error Boundary for specific components
 *
 * Usage:
 * ```tsx
 * <LightErrorBoundary fallbackMessage="Nie udało się załadować komponentu">
 *   <SpecificComponent />
 * </LightErrorBoundary>
 * ```
 */
export const LightErrorBoundary: React.FC<{
  children: ReactNode;
  fallbackMessage?: string;
}> = ({ children, fallbackMessage = 'Wystąpił błąd' }) => {
  return (
    <ErrorBoundary
      fallback={
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          <Typography color="text.secondary">{fallbackMessage}</Typography>
        </Box>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
