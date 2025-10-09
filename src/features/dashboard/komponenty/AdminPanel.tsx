'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Storage as StorageIcon,
  CloudQueue as CloudIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/redux/hooks';
import { apiClient } from '@/api/klient/client';

interface UserStats {
  id: number;
  username: string;
  email: string;
  projectCount: number;
  layerCount: number;
  storageUsed: number; // MB
  lastLogin: string;
  isActive: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalLayers: number;
  totalStorage: number; // MB
  activeUsers: number;
}

export default function AdminPanel() {
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Real API call to backend
      const response = await apiClient.get<{
        system_stats: {
          total_users: number;
          active_users: number;
          total_projects: number;
          total_layers: number;
          total_storage: number;
        };
        users: Array<{
          id: number;
          username: string;
          email: string;
          project_count: number;
          layer_count: number;
          storage_used: number;
          last_login: string | null;
          is_active: boolean;
        }>;
      }>('/admin/stats');

      // Map backend response to frontend format
      const mappedUsers: UserStats[] = response.users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        projectCount: u.project_count,
        layerCount: u.layer_count,
        storageUsed: u.storage_used,
        lastLogin: u.last_login || new Date().toISOString(),
        isActive: u.is_active,
      }));

      const mappedStats: SystemStats = {
        totalUsers: response.system_stats.total_users,
        activeUsers: response.system_stats.active_users,
        totalProjects: response.system_stats.total_projects,
        totalLayers: response.system_stats.total_layers,
        totalStorage: response.system_stats.total_storage,
      };

      setUsers(mappedUsers);
      setSystemStats(mappedStats);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError(err.message || 'Failed to load admin statistics');

      // Fallback to mock data if API fails (for development)
      const mockUsers: UserStats[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@mapmaker.com',
          projectCount: 5,
          layerCount: 23,
          storageUsed: 124.5,
          lastLogin: '2025-10-09T10:30:00',
          isActive: true,
        },
        {
          id: 2,
          username: 'admin@universemapmaker.online',
          email: 'admin@universemapmaker.online',
          projectCount: 0,
          layerCount: 0,
          storageUsed: 0,
          lastLogin: '2025-10-09T00:05:00',
          isActive: true,
        },
      ];

      const mockSystemStats: SystemStats = {
        totalUsers: mockUsers.length,
        totalProjects: mockUsers.reduce((sum, u) => sum + u.projectCount, 0),
        totalLayers: mockUsers.reduce((sum, u) => sum + u.layerCount, 0),
        totalStorage: mockUsers.reduce((sum, u) => sum + u.storageUsed, 0),
        activeUsers: mockUsers.filter(u => u.isActive).length,
      };

      setUsers(mockUsers);
      setSystemStats(mockSystemStats);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Nie masz uprawnień do przeglądania tego panelu. Tylko administratorzy mają dostęp.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const formatBytes = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Panel Administratora
      </Typography>

      {/* System Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Użytkownicy
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {systemStats?.totalUsers || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {systemStats?.activeUsers || 0} aktywnych
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Projekty
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {systemStats?.totalProjects || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Wszystkich projektów
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Warstwy
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {systemStats?.totalLayers || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Wszystkich warstw
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Pamięć
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {formatBytes(systemStats?.totalStorage || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Całkowite zużycie
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
          Statystyki Użytkowników
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Użytkownik</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Projekty
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Warstwy
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Pamięć
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ostatnie logowanie</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const storagePercentage = (user.storageUsed / (systemStats?.totalStorage || 1)) * 100;

                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={user.projectCount}
                        size="small"
                        color={user.projectCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={user.layerCount}
                        size="small"
                        color={user.layerCount > 0 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {formatBytes(user.storageUsed)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(storagePercentage, 100)}
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          color={
                            storagePercentage > 80 ? 'error' : storagePercentage > 50 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(user.lastLogin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={user.isActive ? 'Aktywny' : 'Nieaktywny'}
                        size="small"
                        color={user.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Brak użytkowników do wyświetlenia</Typography>
          </Box>
        )}
      </Paper>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Uwaga:</strong> Dane są obecnie mockowane. Pełna integracja z backendem będzie dostępna po
          implementacji endpointu <code>/api/admin/users-stats</code> w Django.
        </Typography>
      </Alert>
    </Box>
  );
}
