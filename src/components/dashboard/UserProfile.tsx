'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Storage,
  ViewModule,
  Public,
  Lock,
  TrendingUp,
  CalendarToday,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import LoginRequiredGuard from './LoginRequiredGuard';

interface UserStats {
  totalProjects: number;
  publicProjects: number;
  privateProjects: number;
  totalViews: number;
  storageUsed: number;
  storageLimit: number;
  layersCount: number;
  joinDate: string;
}

interface SubscriptionInfo {
  plan: string;
  type: string;
  startDate: string;
  endDate: string;
  maxProjects: number;
  maxLayers: number;
  maxStorage: number;
}

const mockUserStats: UserStats = {
  totalProjects: 14,
  publicProjects: 3,
  privateProjects: 11,
  totalViews: 8347,
  storageUsed: 135069, // MB
  storageLimit: 150000, // MB
  layersCount: 245,
  joinDate: '29.10.2020',
};

const mockSubscription: SubscriptionInfo = {
  plan: 'Pakiet Indywidualny',
  type: 'Miesięczny',
  startDate: '29.10.2020',
  endDate: '30.06.2026',
  maxProjects: 100,
  maxLayers: 200,
  maxStorage: 150000,
};

const mockLargestProjects = [
  { name: 'calykraj', usage: 83, size: '52.08 MB' },
  { name: 'terenyinwest', usage: 7, size: '14.87 MB' },
  { name: 'dolnoslaskie', usage: 5, size: '15.0 MB' },
  { name: 'qwert', usage: 0, size: '14.94 MB' },
  { name: 'Reszta', usage: 5, size: '38.11 MB' },
];

export default function UserProfile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const storagePercentage = (mockUserStats.storageUsed / mockUserStats.storageLimit) * 100;

  // Mock user authentication - replace with actual auth state
  const currentUser = {
    isLoggedIn: false, // Change to true to test logged-in state
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = 'primary',
    subtitle
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
  }) => (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div" fontWeight="700" color={`${color}.main`} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: alpha(
                color === 'primary' ? theme.palette.primary.main :
                color === 'success' ? theme.palette.success.main :
                color === 'info' ? theme.palette.info.main :
                color === 'warning' ? theme.palette.warning.main :
                theme.palette.primary.main,
                0.1
              ),
              borderRadius: 2,
              p: { xs: 1, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <LoginRequiredGuard
      isLoggedIn={currentUser.isLoggedIn}
      title="Zaloguj się, aby zobaczyć swój profil"
      message="Ta sekcja wymaga zalogowania. Utwórz konto lub zaloguj się, aby zarządzać swoim profilem i subskrypcją."
    >
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Profil użytkownika
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Zarządzaj swoim kontem i subskrypcją
          </Typography>
        </Box>

      <Grid container spacing={3}>
        {/* User Info Card - Expanded */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3, textAlign: { xs: 'center', sm: 'left' } }}>
                <Avatar
                  sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    mr: { xs: 0, sm: 3 },
                    mb: { xs: 2, sm: 0 },
                  }}
                >
                  T
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Terenyinwestycyjne
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    terenyinwest@gmail.com
                  </Typography>
                  <Chip
                    icon={<CheckCircle />}
                    label="Konto aktywne"
                    color="success"
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Zarządzaj swoim kontem i subskrypcją</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Członek od: {mockUserStats.joinDate}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards - 2x2 Grid */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={6}>
              <StatCard
                title="Projekty"
                value={mockUserStats.totalProjects}
                icon={<ViewModule color="primary" fontSize={isMobile ? 'small' : 'medium'} />}
                subtitle={`${mockUserStats.publicProjects} publicznych`}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                title="Wyświetlenia"
                value={mockUserStats.totalViews.toLocaleString()}
                icon={<TrendingUp color="success" fontSize={isMobile ? 'small' : 'medium'} />}
                color="success"
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                title="Warstwy"
                value={mockUserStats.layersCount}
                icon={<Public color="info" fontSize={isMobile ? 'small' : 'medium'} />}
                color="info"
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                title="Dni aktywności"
                value="1827"
                icon={<CalendarToday color="warning" fontSize={isMobile ? 'small' : 'medium'} />}
                color="warning"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Storage Usage */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 'fit-content', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                Użycie przestrzeni dyskowej
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Wykorzystane miejsce
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(mockUserStats.storageUsed / 1000).toFixed(1)} GB / {mockUserStats.storageLimit / 1000} GB
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={storagePercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {storagePercentage.toFixed(1)}% wykorzystane
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Największe projekty:
              </Typography>
              
              <List dense>
                {mockLargestProjects.map((project, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Storage fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={project.name}
                      secondary={project.size}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {project.usage}%
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Info */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 'fit-content', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                  Aktualny pakiet
                </Typography>
                <Chip
                  label="Aktywny"
                  color="success"
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="700" color="primary.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {mockSubscription.plan}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  Abonament: {mockSubscription.type}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Początek subskrypcji:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {mockSubscription.startDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Koniec subskrypcji:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {mockSubscription.endDate}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Limity pakietu:
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Maksymalna liczba projektów"
                    secondary={`${mockUserStats.totalProjects} / ${mockSubscription.maxProjects}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Maksymalna liczba warstw"
                    secondary={`${mockUserStats.layersCount} / ${mockSubscription.maxLayers}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Maksymalne miejsce na dysku"
                    secondary={`${(mockUserStats.storageUsed / 1000).toFixed(1)} GB / ${mockSubscription.maxStorage / 1000} GB`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Sprawdź korzyści pakietu rocznego
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </LoginRequiredGuard>
  );
}