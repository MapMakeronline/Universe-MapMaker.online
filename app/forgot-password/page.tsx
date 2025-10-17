'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { AuthLayout, AuthCard, AuthBranding } from '@/components/auth';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    // W przyszłości tutaj będzie logika wysyłania emaila
  };

  const handleBackToLogin = () => {
    router.push('/auth?tab=0');
  };

  return (
    <AuthLayout backTo="/auth?tab=0" maxWidth="lg">
      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
        {/* Left side - Branding */}
        <Box sx={{ flex: 1 }}>
          <AuthBranding
            title="MapMaker.Online"
            subtitle="Zapomniałeś hasła? Pomożemy Ci je odzyskać."
          />
        </Box>

        {/* Right side - Forgot Password Form */}
        <Box sx={{ flex: { xs: 1, md: 0 }, minWidth: { md: 450 } }}>
          <AuthCard>
            {/* Back button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton
                onClick={handleBackToLogin}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
            </Box>

            <Typography variant="h4" component="h2" fontWeight="700" gutterBottom>
              Zapomniałeś hasła?
            </Typography>

            {!isSubmitted ? (
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  E-mail
                </Typography>
                <TextField
                  fullWidth
                  placeholder="jan@kowalski.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    },
                  }}
                >
                  Wyślij przypomnienie
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 3, color: 'success.main' }}>
                  ✓ Link do resetowania hasła został wysłany na Twój adres email.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sprawdź swoją skrzynkę odbiorczą i kliknij w link, aby zresetować hasło.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleBackToLogin}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Powrót do logowania
                </Button>
              </Box>
            )}
          </AuthCard>
        </Box>
      </Box>
    </AuthLayout>
  );
}
