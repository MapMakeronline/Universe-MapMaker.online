'use client';

import React, { useState, Suspense } from 'react';
import {
  Box,
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
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { GoogleLogin } from '@react-oauth/google';
import { useLoginMutation, useRegisterMutation, useGoogleAuthMutation } from '@/backend/auth';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth, setLoading } from '@/redux/slices/authSlice';
import { AuthLayout } from '@/components/auth';

// Force dynamic rendering for this page (uses useSearchParams)
export const dynamic = 'force-dynamic';

function AuthPageContent() {
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // RTK Query mutations
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [googleAuth, { isLoading: isGoogleAuthLoading }] = useGoogleAuthMutation();

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

  // Unified loading state
  const isLoading = isLoginLoading || isRegisterLoading;

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
    dispatch(setLoading(true));

    try {
      if (activeTab === 0) {
        // Login with RTK Query
        const response = await login({
          username: formData.email,
          password: formData.password,
        }).unwrap();

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
          dispatch(setLoading(false));
          return;
        }

        const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        await register({
          username: formData.email.split('@')[0], // Generate username from email
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: firstName,
          last_name: lastName,
        }).unwrap();

        // After successful registration, log in automatically
        const response = await login({
          username: formData.email,
          password: formData.password,
        }).unwrap();

        // Save auth state to Redux
        dispatch(setAuth({
          user: response.user,
          token: response.token,
        }));

        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Handle RTK Query error format
      const errorData = err?.data || err;

      if (errorData.non_field_errors) {
        setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
      } else if (errorData.email) {
        setError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
      } else if (errorData.username) {
        setError(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
      } else if (errorData.password) {
        setError(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password);
      } else if (errorData.detail) {
        setError(errorData.detail);
      } else if (errorData.message) {
        setError(errorData.message);
      } else {
        setError('Wystąpił błąd. Spróbuj ponownie.');
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleAuth = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError('Nie udało się uzyskać danych z Google');
      return;
    }

    dispatch(setLoading(true));
    setError('');

    try {
      // Decode Google JWT to extract profile picture
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleProfile = JSON.parse(jsonPayload);
      const googleAvatar = googleProfile.picture; // Google profile picture URL

      const result = await googleAuth({
        credential: credentialResponse.credential
      }).unwrap();

      // Merge Google avatar with user data
      const userWithAvatar = {
        ...result.user,
        avatar: googleAvatar || result.user.avatar, // Use Google avatar if available
      };

      // Save user with avatar to localStorage
      localStorage.setItem('user', JSON.stringify(userWithAvatar));

      // Dispatch user data to Redux
      dispatch(setAuth({
        user: userWithAvatar,
        token: result.token,
        isAuthenticated: true
      }));

      // Show welcome message for new users
      if (result.is_new_user) {
        console.log('✅ Witamy! Twoje konto zostało utworzone.');
        // TODO: Show toast notification for new users
      } else {
        console.log('✅ Zalogowano pomyślnie!');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(
        err?.data?.error ||
        err?.error ||
        'Logowanie przez Google nie powiodło się. Spróbuj ponownie.'
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <AuthLayout backTo="/" maxWidth="sm">
      <Card
        sx={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          borderRadius: 3,
          width: '100%',
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
              mb: 1,
            }}
          >
            Universe MapMaker
          </Typography>

          {/* Browse as Guest - Top Priority */}
          <Box sx={{ textAlign: 'center', px: 4, py: 2 }}>
            <Button
              variant="text"
              onClick={() => router.push('/dashboard?tab=1')}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(28, 103, 157, 0.08)',
                  color: theme.palette.secondary.main,
                },
              }}
            >
              Przeglądaj jako gość →
            </Button>
          </Box>

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
                  variant="outlined"
                  label="Imię i nazwisko"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(28, 103, 157, 0.15)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      fontSize: '15px',
                      padding: '14px 16px',
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 100px rgba(255, 255, 255, 0.9) inset !important',
                        WebkitTextFillColor: '#000000 !important',
                        borderRadius: '8px',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                  }}
                />
              )}

              {/* Email Field */}
              <TextField
                fullWidth
                variant="outlined"
                label={activeTab === 0 ? "Email lub nazwa użytkownika" : "Email"}
                type={activeTab === 0 ? "text" : "email"}
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={isLoading}
                autoComplete="username"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(28, 103, 157, 0.15)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '15px',
                    padding: '14px 16px',
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 100px rgba(255, 255, 255, 0.9) inset !important',
                      WebkitTextFillColor: '#000000 !important',
                      borderRadius: '8px',
                      transition: 'background-color 5000s ease-in-out 0s',
                    },
                  },
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    borderWidth: '1.5px',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                variant="outlined"
                label="Hasło"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                disabled={isLoading}
                autoComplete="current-password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(28, 103, 157, 0.15)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '15px',
                    padding: '14px 16px',
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 100px rgba(255, 255, 255, 0.9) inset !important',
                      WebkitTextFillColor: '#000000 !important',
                      borderRadius: '8px',
                      transition: 'background-color 5000s ease-in-out 0s',
                    },
                  },
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    borderWidth: '1.5px',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: 'rgba(28, 103, 157, 0.08)',
                            color: theme.palette.secondary.main,
                          },
                        }}
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
                  variant="outlined"
                  label="Potwierdź hasło"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  margin="normal"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(28, 103, 157, 0.15)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      fontSize: '15px',
                      padding: '14px 16px',
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 100px rgba(255, 255, 255, 0.9) inset !important',
                        WebkitTextFillColor: '#000000 !important',
                        borderRadius: '8px',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                  }}
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

              {/* Google OAuth Login - Native Google Button with Custom Wrapper */}
              <Box
                sx={{
                  mt: 3,
                  mb: 2,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  '& > div': {
                    width: '100% !important',
                  },
                  '& iframe': {
                    width: '100% !important',
                    minWidth: '100% !important',
                  }
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleAuth}
                  onError={() => {
                    setError('Logowanie przez Google nie powiodło się');
                  }}
                  text={activeTab === 0 ? 'signin_with' : 'signup_with'}
                  size="large"
                  theme="outline"
                  shape="rectangular"
                />
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  lub użyj email
                </Typography>
              </Divider>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  bgcolor: theme.palette.secondary.main,
                  boxShadow: '0 4px 12px rgba(28, 103, 157, 0.25)',
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark,
                    boxShadow: '0 6px 16px rgba(28, 103, 157, 0.35)',
                  },
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeTab === 0 ? 'Zaloguj się' : 'Zarejestruj się'
                )}
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
    </AuthLayout>
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
