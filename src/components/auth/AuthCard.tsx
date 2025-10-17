'use client';

import React from 'react';
import {
  Card,
  CardContent,
  alpha,
  useTheme,
} from '@mui/material';

interface AuthCardProps {
  children: React.ReactNode;
}

/**
 * Styled card component for authentication forms
 * Provides consistent styling with backdrop blur and border
 */
export function AuthCard({ children }: AuthCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        backdropFilter: 'blur(20px)',
        background: alpha(theme.palette.background.paper, 0.95),
        border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
        borderRadius: 3,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        width: '100%',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {children}
      </CardContent>
    </Card>
  );
}
