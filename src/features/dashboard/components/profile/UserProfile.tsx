'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Person from '@mui/icons-material/Person';
import Storage from '@mui/icons-material/Storage';
import ViewModule from '@mui/icons-material/ViewModule';
import Public from '@mui/icons-material/Public';
import Lock from '@mui/icons-material/Lock';
import TrendingUp from '@mui/icons-material/TrendingUp';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Schedule from '@mui/icons-material/Schedule';
import LoginRequiredGuard from '@/features/autoryzacja/LoginRequiredGuard';
import { useAppSelector } from '@/redux/hooks';
import type { User as UserProfileData } from '@/backend/types';
import UserAvatar from '@/common/components/UserAvatar';

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

  // Get auth state from Redux (user data populated from login)
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  // Use Redux user data directly (no API call needed)
  const profileData = user;
  const isLoading = false;
  const error = null;

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

  // Get user display name
  const getDisplayName = () => {
    if (profileData?.first_name && profileData?.last_name) {
      return `${profileData.first_name} ${profileData.last_name}`;
    }
    if (profileData?.company_name) {
      return profileData.company_name;
    }
    return profileData?.username || user?.username || 'User';
  };

  const getUserInitial = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <LoginRequiredGuard
      isLoggedIn={isAuthenticated}
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

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Profile Content */}
        {!isLoading && !error && profileData && (
          <Grid container spacing={3}>
            {/* Left Column - User Profile Card (wider) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 'fit-content', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, textAlign: 'center' }}>
                    <UserAvatar
                      user={user}
                      isAuthenticated={isAuthenticated}
                      size={100}
                      sx={{
                        mb: 2,
                        fontSize: '2.5rem',
                      }}
                      showIcon={true}
                    />
                    <Typography variant="h5" fontWeight="700" gutterBottom>
                      {getDisplayName()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom sx={{ wordBreak: 'break-all' }}>
                      {profileData.email}
                    </Typography>
                    <Chip
                      icon={<CheckCircle />}
                      label="Konto aktywne"
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Zarządzaj swoim kontem i subskrypcją</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Członek od: {mockUserStats.joinDate}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Subscription & Storage */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>

                {/* Subscription Info - FIRST */}
                <Grid item xs={12}>
                  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="600">
                          Aktualny pakiet
                        </Typography>
                        <Chip
                          label="Aktywny"
                          color="success"
                          size="small"
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight="700" color="primary.main">
                          {mockSubscription.plan}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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

                {/* Storage Usage - SECOND */}
                <Grid item xs={12}>
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

              </Grid>
            </Grid>
          </Grid>
        )}
      </Box>
    </LoginRequiredGuard>
  );
}
