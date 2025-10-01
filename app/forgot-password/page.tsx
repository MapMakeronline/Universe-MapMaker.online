'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  useTheme,
  alpha,
  Container,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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
    router.push('/login');
  };

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

      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
          {/* Left side - Branding */}
          <Box sx={{ flex: 1, color: 'white', display: { xs: 'none', md: 'block' } }}>
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
                <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                  M
                </Typography>
              </Box>
              <Typography variant="h4" component="h1" fontWeight="700">
                MapMaker.Online
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              Zapomniałeś hasła? Pomożemy Ci je odzyskać.
            </Typography>
          </Box>

          {/* Right side - Forgot Password Form */}
          <Box sx={{ flex: { xs: 1, md: 0 }, minWidth: { md: 450 } }}>
            <Card
              sx={{
                backdropFilter: 'blur(20px)',
                background: alpha(theme.palette.background.paper, 0.95),
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                borderRadius: 3,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
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
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}