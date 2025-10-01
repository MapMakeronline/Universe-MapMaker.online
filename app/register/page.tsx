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
  useTheme,
  alpha,
  Container,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  ArrowForward,
  Google,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    city: '',
    address: '',
    postalCode: '',
    companyName: '',
    nip: '',
  });

  const steps = ['Podstawowe informacje', 'Dodatkowe informacje', 'Ważne informacje'];

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Ostatni krok - rejestracja
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoogleSignUp = () => {
    // Placeholder - w przyszłości integracja z Google
    router.push('/dashboard');
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
        py: 4,
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
            
            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
              Wykonuj operacje matematyczne, analityczne i przekształcające na danych przestrzennych.
              Wykorzystaj w pełni swoje dane, dostosowując je do swoich potrzeb.
            </Typography>
          </Box>

          {/* Right side - Registration Form */}
          <Box sx={{ flex: { xs: 1, md: 0 }, minWidth: { md: 600 } }}>
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
                  Zarejestruj się
                </Typography>

                {/* Google Sign Up - Available from start */}
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleGoogleSignUp}
                    startIcon={<Google />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'none',
                      bgcolor: '#4285f4',
                      color: 'white',
                      borderColor: '#4285f4',
                      '&:hover': {
                        bgcolor: '#357ae8',
                        borderColor: '#357ae8',
                      },
                    }}
                  >
                    Kontynuuj z Google
                  </Button>
                  
                  <Divider sx={{ my: 3 }}>lub</Divider>
                </Box>

                {/* Progress indicator */}
                <Box sx={{ mb: 4 }}>
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Box sx={{ mt: 4 }}>
                  {/* Step 1: Podstawowe informacje */}
                  {currentStep === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          E-mail
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="jan@kowalski.pl"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Hasło *
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
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Powtórz hasło *
                        </Typography>
                        <TextField
                          fullWidth
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Wpisz swoje hasło ponownie"
                          value={formData.confirmPassword}
                          onChange={handleInputChange('confirmPassword')}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Step 2: Dodatkowe informacje */}
                  {currentStep === 1 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Nazwa użytkownika
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz swoją nazwę użytkownika"
                          value={formData.username}
                          onChange={handleInputChange('username')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Imię
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz swoje imię"
                          value={formData.firstName}
                          onChange={handleInputChange('firstName')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Nazwisko
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz swoje nazwisko"
                          value={formData.lastName}
                          onChange={handleInputChange('lastName')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Miasto
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz swoje miasto"
                          value={formData.city}
                          onChange={handleInputChange('city')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Adres
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz swój adres"
                          value={formData.address}
                          onChange={handleInputChange('address')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Kod pocztowy
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="--–--"
                          value={formData.postalCode}
                          onChange={handleInputChange('postalCode')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Nazwa firmy
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Wpisz nazwę swojej firmy"
                          value={formData.companyName}
                          onChange={handleInputChange('companyName')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          NIP
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="--–--–--–--"
                          value={formData.nip}
                          onChange={handleInputChange('nip')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Step 3: Ważne informacje */}
                  {currentStep === 2 && (
                    <Box>
                      <Box sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Ważne informacje
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Korzystanie z serwisu oznacza akceptację regulaminu. Polecamy również sprawdzić Naszą sekcję FAQ.
                        </Typography>
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={acceptTerms}
                              onChange={(e) => setAcceptTerms(e.target.checked)}
                              sx={{ color: 'primary.main' }}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              * Oświadczam, że znam i akceptuję postanowienia regulaminu MapMaker.online
                            </Typography>
                          }
                          sx={{ alignItems: 'flex-start', mb: 1 }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={acceptMarketing}
                              onChange={(e) => setAcceptMarketing(e.target.checked)}
                              sx={{ color: 'primary.main' }}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              Chcę otrzymywać od MapMaker.online: kody zniżkowe, oferty specjalne lub inne treści
                              marketingowe, w tym dopasowane do mnie informacje o usługach i towarach
                              MapMaker.online dostępnych w serwisie, za pośrednictwem komunikacji elektronicznej.
                              W każdej chwili możesz wycofać udzieloną zgodę.
                            </Typography>
                          }
                          sx={{ alignItems: 'flex-start' }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Navigation buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      startIcon={<ArrowBack />}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        '&:disabled': {
                          color: 'transparent',
                        },
                      }}
                    >
                      Wstecz
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={currentStep === 2 && !acceptTerms}
                      endIcon={currentStep === steps.length - 1 ? null : <ArrowForward />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '16px',
                        fontWeight: 600,
                        textTransform: 'none',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        },
                        '&:disabled': {
                          background: alpha(theme.palette.grey[400], 0.5),
                        },
                      }}
                    >
                      {currentStep === steps.length - 1 ? 'Zarejestruj' : 'Dalej'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}