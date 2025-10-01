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
  InputAdornment,
  Link,
  useTheme,
  alpha,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleLogin = () => {
    // Niezależnie od danych, prowadź do dashboard
    router.push('/dashboard');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleJoinUs = () => {
    router.push('/register');
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
              Skorzystaj z szeregu zaawansowanych narzędzi i operacji, aby przekształcić geometrię elementu.
            </Typography>
            
            <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.6 }}>
              Twórz i kształtuj dane przestrzenne według własnych upodobań.
            </Typography>
          </Box>

          {/* Right side - Login Form */}
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
                    onClick={() => router.back()}
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
                  Zaloguj się
                </Typography>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Email/nazwa użytkownika
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Wpisz swój login lub adres e-mail"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                      },
                    }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Hasło
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Wpisz minimum 8 znaków"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
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
                    onClick={handleLogin}
                    sx={{
                      mb: 3,
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
                    Zaloguj
                  </Button>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Link
                      component="button"
                      onClick={handleForgotPassword}
                      sx={{
                        textDecoration: 'none',
                        color: 'text.secondary',
                        fontSize: '14px',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Zapomniałeś hasła?
                    </Link>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleJoinUs}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    Dołącz do Nas!
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}