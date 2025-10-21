'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import LayersIcon from '@mui/icons-material/Layers';
import StorageIcon from '@mui/icons-material/Storage';

// TODO: Migrate to @/backend/admin API
// Temporary mock hooks until backend admin endpoints are implemented
const useGetAdminStatsQuery = () => ({ data: undefined, isLoading: false, error: null });
const useGetAllProjectsQuery = () => ({ data: undefined, isLoading: false, error: null });

export default function DatabaseOverviewTab() {
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: projectsData, isLoading: projectsLoading } = useGetAllProjectsQuery();

  if (statsLoading || projectsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statsData || !projectsData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Nie udało się załadować danych z bazy danych
      </Alert>
    );
  }

  const stats = statsData.system_stats;
  const users = statsData.users.slice(0, 10); // Top 10 users
  const projects = projectsData.projects.slice(0, 10); // Latest 10 projects

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Przegląd Bazy Danych
      </Typography>

      {/* System Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Użytkownicy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.total_users}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    +{stats.new_users_30d} ostatnie 30 dni
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Projekty
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.total_projects}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Wszystkie projekty
                  </Typography>
                </Box>
                <FolderIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Warstwy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.total_layers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Wszystkie warstwy
                  </Typography>
                </Box>
                <LayersIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Wykorzystanie
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {(stats.total_storage / 1024 / 1024 / 1024).toFixed(2)} GB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Storage
                  </Typography>
                </Box>
                <StorageIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Users */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Ostatnio zarejestrowani użytkownicy
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Użytkownik</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Projekty</TableCell>
              <TableCell>Warstwy</TableCell>
              <TableCell>Data rejestracji</TableCell>
              <TableCell>Licencja</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.username}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.project_count}</TableCell>
                <TableCell>{user.layer_count}</TableCell>
                <TableCell>
                  {new Date(user.date_joined).toLocaleDateString('pl-PL')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.license_type === 'paid' ? 'Płatna' : 'Darmowa'}
                    size="small"
                    color={user.license_type === 'paid' ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Recent Projects */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Ostatnio utworzone projekty
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Projekt</TableCell>
              <TableCell>Właściciel</TableCell>
              <TableCell>Kategoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data utworzenia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {project.custom_project_name || project.project_name}
                  </Typography>
                </TableCell>
                <TableCell>{project.owner.username}</TableCell>
                <TableCell>
                  <Chip label={project.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.published ? 'Opublikowany' : 'Nieopublikowany'}
                    size="small"
                    color={project.published ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {project.creationDate
                    ? new Date(project.creationDate).toLocaleDateString('pl-PL')
                    : 'Brak danych'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
