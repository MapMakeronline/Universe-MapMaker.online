'use client';

import React from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';

interface AuthBrandingProps {
  title?: string;
  subtitle?: string;
}

/**
 * Branding section for authentication pages
 * Shows logo, title, and optional subtitle
 */
export function AuthBranding({
  title = 'MapMaker.Online',
  subtitle,
}: AuthBrandingProps) {
  const theme = useTheme();

  return (
    <Box sx={{ color: 'white', display: { xs: 'none', md: 'block' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            bgcolor: 'white',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
          >
            M
          </Typography>
        </Box>
        <Typography variant="h4" component="h1" fontWeight="700">
          {title}
        </Typography>
      </Box>

      {subtitle && (
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
