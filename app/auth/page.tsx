'use client';

import React, { useState, Suspense } from 'react';
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
  CircularProgress,
  Alert,
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
import { authService } from '@/api/endpointy/auth';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth, setLoading } from '@/redux/slices/authSlice';

// Force dynamic rendering for this page (uses useSearchParams)
export const dynamic = 'force-dynamic';

function AuthPageContent() {
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // Initialize tab from URL params, default to 0 (login)
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    if (tab === '1' || tab === 'register') return 1;
    return 0;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError('');
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      if (activeTab === 0) {
        // Login
        const response = await authService.login({
          username: formData.email,
          password: formData.password,
        });

        // Save auth state to Redux
        dispatch(setAuth({
          user: response.user,
          token: response.token,
        }));

        // Redirect to dashboard after successful login
        router.push('/dashboard');
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Hasła nie są identyczne');
          setIsLoading(false);
          dispatch(setLoading(false));
          return;
        }

        const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        await authService.register({
          username: formData.email.split('@')[0], // Generate username from email
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: firstName,
          last_name: lastName,
        });

        // After successful registration, log in automatically
        const response = await authService.login({
          username: formData.email,
          password: formData.password,
        });

        // Save auth state to Redux
        dispatch(setAuth({
          user: response.user,
          token: response.token,
        }));

        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.non_field_errors) {
        setError(Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : err.non_field_errors);
      } else if (err.email) {
        setError(Array.isArray(err.email) ? err.email[0] : err.email);
      } else if (err.username) {
        setError(Array.isArray(err.username) ? err.username[0] : err.username);
      } else if (err.password) {
        setError(Array.isArray(err.password) ? err.password[0] : err.password);
      } else if (err.detail) {
        setError(err.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Wystąpił błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    console.log('Google OAuth');
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
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

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
                label={activeTab === 0 ? "Email lub nazwa użytkownika" : "Email"}
                type={activeTab === 0 ? "text" : "email"}
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={isLoading}
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
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
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
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeTab === 0 ? 'Zaloguj się' : 'Zarejestruj się'
                )}
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

export default function AuthPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
