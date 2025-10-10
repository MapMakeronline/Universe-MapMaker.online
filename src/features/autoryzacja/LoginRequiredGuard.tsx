'use client';

import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { Login as LoginIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material';

interface LoginRequiredGuardProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  title?: string;
  message?: string;
}

export default function LoginRequiredGuard({
  children,
  isLoggedIn,
  title = 'Zaloguj się, aby uzyskać dostęp',
  message = 'Ta sekcja wymaga zalogowania do Twojego konta MapMaker',
}: LoginRequiredGuardProps) {
  const router = useRouter();
  const theme = useTheme();

  if (!isLoggedIn) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box
          sx={{
            bgcolor: theme.palette.primary.main,
            borderRadius: '50%',
            p: 3,
            display: 'inline-flex',
            mb: 3,
            boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
          }}
        >
          <LoginIcon sx={{ fontSize: 56, color: 'white' }} />
        </Box>

        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {message}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => router.push('/auth?tab=0')}
            sx={{
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Zaloguj się
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push('/auth?tab=1')}
            sx={{
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Utwórz konto
          </Button>
        </Stack>

        <Button
          variant="text"
          onClick={() => router.push('/dashboard?tab=1')}
          sx={{
            mt: 3,
            textTransform: 'none',
            color: 'text.secondary',
          }}
        >
          Wróć do projektów publicznych
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
