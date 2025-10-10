'use client';

import React, { useState } from 'react';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/CloudQueue';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import PublicIcon from '@mui/icons-material/Public';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DatabaseIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import Tooltip from '@mui/material/Tooltip';
import { useAppSelector } from '@/redux/hooks';
import {
  useGetAdminStatsQuery,
  useGetAllProjectsQuery,
  useUpdateUserLicenseMutation,
  useDeleteUserMutation,
  type AdminUser,
  type AdminProject,
} from '@/redux/api/adminApi';

export default function AdminPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // RTK Query hooks
  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetAdminStatsQuery();
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useGetAllProjectsQuery();
  const [updateLicense] = useUpdateUserLicenseMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Check if user is admin
  const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

  const handleLicenseChange = async (userId: number, newLicense: 'free' | 'paid') => {
    try {
      await updateLicense({ userId, licenseType: newLicense }).unwrap();
    } catch (err) {
      console.error('Failed to update license:', err);
    }
  };

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id).unwrap();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const formatBytes = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
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

  if (statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {'status' in statsError ? `Błąd ${statsError.status}: Nie udało się załadować danych` : 'Błąd ładowania danych administracyjnych'}
        </Alert>
      </Box>
    );
  }

  // Sort users by newest registration date (desc)
  const sortedUsers = [...(statsData?.users || [])].sort((a, b) => {
    const dateA = new Date(a.date_joined || 0).getTime();
    const dateB = new Date(b.date_joined || 0).getTime();
    return dateB - dateA; // Newest first
  });

  const systemStats = statsData?.system_stats;
  const projects = projectsData?.projects || [];

  // Sort paid users by nearest license expiration (closest expiration first)
  // Note: Backend needs to provide license_expiration_date field for this to work
  // For now, we'll sort by newest registration as fallback
  const sortedPaidUsers = sortedUsers
    .filter((u) => u.license_type === 'paid')
    .sort((a, b) => {
      // If license_expiration_date exists, sort by it (nearest first)
      if ((a as any).license_expiration_date && (b as any).license_expiration_date) {
        const expirationA = new Date((a as any).license_expiration_date).getTime();
        const expirationB = new Date((b as any).license_expiration_date).getTime();
        return expirationA - expirationB; // Nearest expiration first
      }
      // Fallback: sort by registration date
      return new Date(b.date_joined || 0).getTime() - new Date(a.date_joined || 0).getTime();
    });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: 3,
          fontWeight: 600,
          fontSize: { xs: '1.75rem', sm: '2.125rem' }
        }}
      >
        Panel Administratora
      </Typography>

      {/* System Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab label="Wszyscy Użytkownicy" />
          <Tab label="Projekty" />
          <Tab label="Użytkownicy Płatni" />
        </Tabs>
      </Paper>

      {/* Tab 1: All Users */}
      {activeTab === 0 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
            Wszyscy Użytkownicy ({sortedUsers.length})
          </Typography>

          <TableContainer sx={{ overflowX: { xs: 'auto', md: 'visible' } }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Użytkownik</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'table-cell', sm: 'none' } }}>Dane</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                    Licencja
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                    Projekty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Pamięć
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>Data założenia</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Akcje
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user: AdminUser) => {
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
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.is_superuser}
                          title={user.is_superuser ? 'Nie można usunąć superużytkownika' : 'Usuń użytkownika'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {sortedUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Brak użytkowników do wyświetlenia</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 2: All Projects */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
            Wszystkie Projekty ({projects.length})
          </Typography>

          {projectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : projectsError ? (
            <Alert severity="error">
              {'status' in projectsError
                ? `Błąd ${projectsError.status}: Nie udało się załadować projektów`
                : 'Błąd ładowania projektów'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nazwa Projektu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kategoria</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Właściciel</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Domena</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Opublikowany
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status QGS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status DB</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Data utworzenia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project: AdminProject) => (
                    <TableRow key={project.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FolderIcon sx={{ fontSize: '1.2rem', color: theme.palette.primary.main }} />
                          <Typography variant="body2" fontWeight={500}>
                            {project.custom_project_name || project.project_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {project.category || 'Brak'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {project.owner.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.owner.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {project.domain_name || 'Brak'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {project.published ? (
                          <Chip
                            icon={<PublicIcon sx={{ fontSize: '1rem' }} />}
                            label="Tak"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip label="Nie" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={project.qgs_file_exists ? 'Plik QGS istnieje' : 'Brak pliku QGS'}>
                          {project.qgs_file_exists ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={project.database_exists ? 'Baza danych istnieje' : 'Brak bazy danych'}>
                          {project.database_exists ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(project.creationDate)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {projects.length === 0 && !projectsLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Brak projektów do wyświetlenia</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 3: Paid Users Only */}
      {activeTab === 2 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, overflowX: 'auto' }}>
          <Box
            sx={{
              backgroundColor: theme.palette.success.light,
              color: theme.palette.success.contrastText,
              px: 2,
              py: 1.5,
              mb: 2,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Użytkownicy z licencją płatną ({sortedPaidUsers.length})
            </Typography>
          </Box>

          <TableContainer sx={{ overflowX: { xs: 'auto', md: 'visible' } }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Użytkownik</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'table-cell', sm: 'none' } }}>Dane</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                    Licencja
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                    Projekty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Pamięć
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>Data założenia</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPaidUsers.map((user: AdminUser) => {
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
                        <Chip label="Płatna" size="small" color="success" />
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
                            color="success"
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

          {sortedPaidUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Brak użytkowników z płatną licencją</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.error.main,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 2,
            px: 3,
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          <WarningAmberIcon />
          Potwierdzenie usunięcia użytkownika
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f7f9fc', px: 3, py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Czy na pewno chcesz usunąć użytkownika <strong>{userToDelete?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ta operacja jest nieodwracalna i spowoduje usunięcie wszystkich danych użytkownika, w tym projektów i warstw.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            bgcolor: '#f7f9fc',
            px: 3,
            pb: 3,
            pt: 0,
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={isDeleting}
            sx={{
              borderColor: '#d1d5db',
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.text.primary,
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{
              bgcolor: theme.palette.error.main,
              '&:hover': { bgcolor: theme.palette.error.dark },
            }}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń użytkownika'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
