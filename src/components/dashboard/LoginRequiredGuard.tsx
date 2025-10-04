'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Stack,
  Box,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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

  if (!isLoggedIn) {
    return (
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <LoginIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>

          <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            {title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {message}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth?tab=0')}
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1.5,
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
                textTransform: 'none',
                px: 4,
                py: 1.5,
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
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
