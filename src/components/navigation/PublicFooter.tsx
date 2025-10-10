'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Link,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';
import Image from 'next/image';

export default function PublicFooter() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with newsletter API
    setNewsletterStatus('success');
    setEmail('');
    setTimeout(() => setNewsletterStatus('idle'), 3000);
  };

  const footerLinks = {
    resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    legal: [
      { label: 'Regulamin', href: '/regulamin' },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        pt: 8,
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo and description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Image
                src="/logo.svg"
                alt="Universe MapMaker"
                width={40}
                height={40}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <Typography variant="h6" sx={{ ml: 1, fontWeight: 700 }}>
                Universe MapMaker
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'grey.400', mb: 3, lineHeight: 1.8 }}>
              Profesjonalna platforma do tworzenia interaktywnych map GIS.
              Twórz, publikuj i zarządzaj mapami w chmurze.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                href="https://facebook.com/universemapmaker"
                target="_blank"
                sx={{ color: 'grey.400', '&:hover': { color: theme.palette.primary.main } }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                href="https://twitter.com/universemapmaker"
                target="_blank"
                sx={{ color: 'grey.400', '&:hover': { color: theme.palette.primary.main } }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                href="https://linkedin.com/company/universemapmaker"
                target="_blank"
                sx={{ color: 'grey.400', '&:hover': { color: theme.palette.primary.main } }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                href="https://github.com/universemapmaker"
                target="_blank"
                sx={{ color: 'grey.400', '&:hover': { color: theme.palette.primary.main } }}
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Footer links */}
          <Grid item xs={12} sm={4} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Nawigacja
            </Typography>
            {footerLinks.resources.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                sx={{
                  display: 'block',
                  color: 'grey.400',
                  textDecoration: 'none',
                  mb: 1,
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Grid>

          <Grid item xs={12} sm={4} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Informacje prawne
            </Typography>
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                sx={{
                  display: 'block',
                  color: 'grey.400',
                  textDecoration: 'none',
                  mb: 1,
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Grid>
        </Grid>

        {/* Newsletter */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Divider sx={{ borderColor: 'grey.800', mb: 4 }} />
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
                <EmailIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Newsletter
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Bądź na bieżąco z nowinkami i poradnikami
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="form"
                onSubmit={handleNewsletterSubmit}
                sx={{ display: 'flex', gap: 1 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Twój adres e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'grey.700',
                      },
                      '&:hover fieldset': {
                        borderColor: 'grey.600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Zapisz się
                </Button>
              </Box>
              {newsletterStatus === 'success' && (
                <Typography variant="caption" sx={{ color: 'success.main', mt: 1, display: 'block' }}>
                  ✓ Dziękujemy! Sprawdź swoją skrzynkę e-mail.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Bottom bar */}
        <Divider sx={{ borderColor: 'grey.800', mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'grey.500', textAlign: { xs: 'center', sm: 'left' } }}>
            © {new Date().getFullYear()} Universe MapMaker. Wszystkie prawa zastrzeżone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              Wykonano w 🇵🇱 Polsce
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              •
            </Typography>
            <Link
              href="mailto:kontakt@universemapmaker.online"
              sx={{
                color: 'grey.500',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              kontakt@universemapmaker.online
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
