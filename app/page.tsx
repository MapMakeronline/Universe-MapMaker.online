'use client';

import { Box, Button, Container, Typography, Card, CardContent, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Map as MapIcon,
  Group as GroupIcon,
  AccountCircle as AccountCircleIcon,
  Login as LoginIcon,
  Public as PublicIcon,
  Layers as LayersIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function LandingPage() {
  const router = useRouter();
  const theme = useTheme();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const features = [
    {
      icon: <MapIcon sx={{ fontSize: 48 }} />,
      title: 'Interaktywne mapy',
      description: 'Twórz dynamiczne mapy z Mapbox GL JS i zaawansowanymi narzędziami wizualizacji',
    },
    {
      icon: <LayersIcon sx={{ fontSize: 48 }} />,
      title: 'Zarządzanie warstwami',
      description: 'Hierarchiczne warstwy z pełną kontrolą widoczności, stylów i opacności',
    },
    {
      icon: <GroupIcon sx={{ fontSize: 48 }} />,
      title: 'Współpraca',
      description: 'Udostępniaj projekty zespołowi i pracujcie razem w czasie rzeczywistym',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: 'Analiza GIS',
      description: 'Zaawansowane narzędzia pomiarowe i analityczne dla profesjonalistów',
    },
    {
      icon: <CloudUploadIcon sx={{ fontSize: 48 }} />,
      title: 'Import danych',
      description: 'Importuj dane z formatów GeoJSON, Shapefile, WMS i innych źródeł',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Bezpieczeństwo',
      description: 'Pełna kontrola dostępu i bezpieczne przechowywanie projektów',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(80px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 10 } }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            mb: { xs: 6, md: 10 },
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
              animation: 'fadeInDown 1s ease-out',
              '@keyframes fadeInDown': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-30px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '50%',
                p: { xs: 2.5, md: 3.5 },
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 60, md: 100 },
                  height: { xs: 60, md: 100 },
                  position: 'relative',
                }}
              >
                <img
                  src="/logo2.svg"
                  alt="Universe MapMaker Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              mb: 2,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              letterSpacing: '-0.02em',
              animation: 'fadeIn 1s ease-out 0.2s both',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            Universe MapMaker
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1.1rem', sm: '1.35rem', md: '1.6rem' },
              opacity: 0.95,
              maxWidth: '900px',
              mx: 'auto',
              mb: 1,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              lineHeight: 1.6,
              animation: 'fadeIn 1s ease-out 0.4s both',
            }}
          >
            Profesjonalne narzędzie do tworzenia i analizy map
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              opacity: 0.85,
              maxWidth: '700px',
              mx: 'auto',
              animation: 'fadeIn 1s ease-out 0.6s both',
            }}
          >
            Wykorzystaj moc Mapbox GL JS do budowy interaktywnych map geospatialnych
          </Typography>
        </Box>

        {/* Action Cards */}
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          sx={{
            mb: { xs: 6, md: 10 },
            animation: 'fadeInUp 1s ease-out 0.8s both',
            '@keyframes fadeInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(30px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* Register Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
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
                  p: { xs: 3, md: 4 },
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '50%',
                    p: 2.5,
                    mb: 3,
                    boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
                  }}
                >
                  <AccountCircleIcon sx={{ fontSize: 56, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                  Nowy użytkownik
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.7 }}>
                  Załóż darmowe konto i rozpocznij tworzenie profesjonalnych map geospatialnych
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    py: 1.5,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
                  }}
                >
                  Zarejestruj się
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Login Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
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
                  p: { xs: 3, md: 4 },
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    borderRadius: '50%',
                    p: 2.5,
                    mb: 3,
                    boxShadow: `0 8px 24px ${theme.palette.secondary.main}40`,
                  }}
                >
                  <LoginIcon sx={{ fontSize: 56, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                  Masz konto
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.7 }}>
                  Zaloguj się i kontynuuj pracę nad swoimi projektami mapowymi
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    '&:hover': { bgcolor: theme.palette.secondary.dark },
                    py: 1.5,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: `0 4px 14px ${theme.palette.secondary.main}40`,
                  }}
                >
                  Zaloguj się
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Public Projects Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
                },
              }}
              onClick={() => handleNavigate('/dashboard?tab=1')}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: { xs: 3, md: 4 },
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#10b981',
                    borderRadius: '50%',
                    p: 2.5,
                    mb: 3,
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <PublicIcon sx={{ fontSize: 56, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                  Publiczne projekty
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.7 }}>
                  Przeglądaj mapy udostępnione przez społeczność użytkowników
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{
                    borderColor: '#10b981',
                    color: '#10b981',
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#059669',
                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                      borderWidth: 2,
                    },
                    py: 1.5,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
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
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Kluczowe funkcje
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              mb: 5,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Wszystko czego potrzebujesz do profesjonalnej pracy z mapami
          </Typography>

          <Grid container spacing={{ xs: 3, md: 4 }}>
            {features.map((feature, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    color: 'white',
                    p: 3,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box sx={{ mb: 2, opacity: 0.95 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer CTA */}
        <Box
          sx={{
            textAlign: 'center',
            mt: { xs: 6, md: 8 },
            color: 'white',
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
            © 2025 Universe MapMaker. Wszystkie prawa zastrzeżone.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
