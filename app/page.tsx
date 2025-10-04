'use client';

import { Box, Button, Container, Typography, Card, CardContent, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Map as MapIcon,
  Group as GroupIcon,
  AccountCircle as AccountCircleIcon,
  Login as LoginIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function LandingPage() {
  const router = useRouter();
  const theme = useTheme();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            mb: 8,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '50%',
                p: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Image
                src="/logo2.svg"
                alt="Universe MapMaker Logo"
                width={80}
                height={80}
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              mb: 2,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            Universe MapMaker
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              opacity: 0.95,
              maxWidth: '800px',
              mx: 'auto',
              textShadow: '0 1px 5px rgba(0, 0, 0, 0.1)',
            }}
          >
            Profesjonalne narzędzie do tworzenia i analizy map z Mapbox GL JS
          </Typography>
        </Box>

        {/* Action Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Register Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                },
              }}
              onClick={() => handleNavigate('/register')}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '50%',
                    p: 2,
                    mb: 3,
                  }}
                >
                  <AccountCircleIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                  Nowy użytkownik?
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                  Załóż darmowe konto i zacznij tworzyć profesjonalne mapy już dziś!
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Zarejestruj się
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Login Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                },
              }}
              onClick={() => handleNavigate('/login')}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    borderRadius: '50%',
                    p: 2,
                    mb: 3,
                  }}
                >
                  <LoginIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                  Masz już konto?
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                  Zaloguj się i kontynuuj pracę nad swoimi projektami mapowymi.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    '&:hover': { bgcolor: theme.palette.secondary.dark },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Zaloguj się
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Public Projects Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                },
              }}
              onClick={() => handleNavigate('/dashboard?tab=public')}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#4a5568',
                    borderRadius: '50%',
                    p: 2,
                    mb: 3,
                  }}
                >
                  <PublicIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                  Publiczne projekty
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                  Przeglądaj projekty udostępnione przez innych użytkowników.
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{
                    borderColor: '#4a5568',
                    color: '#4a5568',
                    '&:hover': {
                      borderColor: '#2d3748',
                      bgcolor: 'rgba(74, 85, 104, 0.04)',
                    },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Przeglądaj
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            p: 4,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 600,
              textAlign: 'center',
              mb: 4,
            }}
          >
            Kluczowe funkcje
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <MapIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Interaktywne mapy
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Twórz dynamiczne mapy z Mapbox GL JS
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <GroupIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Współpraca
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Udostępniaj projekty zespołowi
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <MapIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Analiza GIS
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Zaawansowane narzędzia analityczne
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <PublicIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Eksport danych
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Wieloformatowy eksport wyników
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
