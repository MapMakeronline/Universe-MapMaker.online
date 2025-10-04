'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@mui/material/styles';

export default function AuthPage() {
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 1 : 0;

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication logic
    console.log('Auth submit:', activeTab === 0 ? 'Login' : 'Register', formData);
    router.push('/dashboard');
  };

  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    console.log('Google OAuth');
    router.push('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4,
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => router.push('/')}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Container maxWidth="sm">
        <Card
          sx={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pt: 4,
              pb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '50%',
                p: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <img
                src="/logo2.svg"
                alt="MapMaker Logo"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Universe MapMaker
          </Typography>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Tab label="Zaloguj się" sx={{ fontWeight: 600, fontSize: '1rem' }} />
            <Tab label="Zarejestruj się" sx={{ fontWeight: 600, fontSize: '1rem' }} />
          </Tabs>

          <CardContent sx={{ px: 4, pb: 4 }}>
            <form onSubmit={handleSubmit}>
              {/* Register: Name Field */}
              {activeTab === 1 && (
                <TextField
                  fullWidth
                  label="Imię i nazwisko"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  required
                />
              )}

              {/* Email Field */}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Hasło"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
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
              />

              {/* Register: Confirm Password */}
              {activeTab === 1 && (
                <TextField
                  fullWidth
                  label="Potwierdź hasło"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  margin="normal"
                  required
                />
              )}

              {/* Forgot Password Link (Login only) */}
              {activeTab === 0 && (
                <Box sx={{ textAlign: 'right', mt: 1 }}>
                  <MuiLink
                    href="/forgot-password"
                    sx={{
                      color: theme.palette.secondary.main,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Zapomniałeś hasła?
                  </MuiLink>
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  bgcolor: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark,
                  },
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {activeTab === 0 ? 'Zaloguj się' : 'Zarejestruj się'}
              </Button>

              {/* Divider */}
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  lub
                </Typography>
              </Divider>

              {/* Google OAuth Button */}
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleAuth}
                sx={{
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {activeTab === 0 ? 'Zaloguj przez Google' : 'Zarejestruj przez Google'}
              </Button>
            </form>

            {/* Switch Prompt */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 0 ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {activeTab === 0 ? 'Zarejestruj się' : 'Zaloguj się'}
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Browse as Guest */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="text"
            onClick={() => router.push('/dashboard?tab=1')}
            sx={{
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Przeglądaj jako gość →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
