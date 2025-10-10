'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/CloudQueue';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAppSelector } from '@/redux/hooks';
import { useGetAdminStatsQuery, useUpdateUserLicenseMutation, type AdminUser } from '@/redux/api/adminApi';

export default function AdminPanel() {
  const { user } = useAppSelector((state) => state.auth);

  // RTK Query hooks
  const { data, isLoading, error } = useGetAdminStatsQuery();
  const [updateLicense] = useUpdateUserLicenseMutation();

  // Check if user is admin
  const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

  const handleLicenseChange = async (userId: number, newLicense: 'free' | 'paid') => {
    try {
      await updateLicense({ userId, licenseType: newLicense }).unwrap();
    } catch (err) {
      console.error('Failed to update license:', err);
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {'status' in error ? `Błąd ${error.status}: Nie udało się załadować danych` : 'Błąd ładowania danych administracyjnych'}
        </Alert>
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
    }).format(date);
  };

  const users = data?.users || [];
  const systemStats = data?.system_stats;

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
                {systemStats?.total_users || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {systemStats?.active_users || 0} aktywnych
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
                {systemStats?.total_projects || 0}
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
                {systemStats?.total_layers || 0}
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
                {formatBytes(systemStats?.total_storage || 0)}
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
          Statystyki Użytkowników (sortowane po ilości danych)
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Użytkownik</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Licencja
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Projekty
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Pamięć
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Data założenia</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user: AdminUser) => {
                const storagePercentage = (user.storage_used / (systemStats?.total_storage || 1)) * 100;

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
                    <TableCell align="center">
                      <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select
                          value={user.license_type}
                          onChange={(e) => handleLicenseChange(user.id, e.target.value as 'free' | 'paid')}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          <MenuItem value="free">Darmowa</MenuItem>
                          <MenuItem value="paid">Płatna</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={user.project_count}
                        size="small"
                        color={user.project_count > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {formatBytes(user.storage_used)}
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
                        {formatDate(user.date_joined)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={user.is_active ? 'Aktywny' : 'Nieaktywny'}
                        size="small"
                        color={user.is_active ? 'success' : 'default'}
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
    </Box>
  );
}
