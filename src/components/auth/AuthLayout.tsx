'use client';

import React from 'react';
import {
  Box,
  Container,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
  backTo?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
  showDecorations?: boolean;
}

/**
 * Common layout for authentication pages (login, register, forgot-password)
 * Provides:
 * - Gradient background with decorative elements
 * - Back button navigation
 * - Responsive container
 */
export function AuthLayout({
  children,
  backTo = '/',
  maxWidth = 'sm',
  showDecorations = true,
}: AuthLayoutProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      {showDecorations && (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: alpha(theme.palette.primary.light, 0.1),
              filter: 'blur(100px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -200,
              right: -200,
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: alpha(theme.palette.secondary.light, 0.1),
              filter: 'blur(150px)',
            }}
          />
        </>
      )}

      {/* Back Button */}
      <IconButton
        onClick={() => router.push(backTo)}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          zIndex: 10,
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Container
        maxWidth={maxWidth}
        sx={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          py: { xs: 2, sm: 4 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
