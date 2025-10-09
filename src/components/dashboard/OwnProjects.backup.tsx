'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Button,
  Avatar,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Share,
  FileCopy,
  Add,
  Public,
  Lock,
  ViewModule,
  Storage,
  Language,
  Settings,
  Upload,
  GetApp,
  TableChart,
  Close,
  CloudUpload,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setProjects, setLoading, setError, setSelectedProject } from '@/store/slices/dashboardSlice';
import { dashboardService } from '@/lib/api/dashboard';
import type { Project as ApiProject } from '@/lib/api/dashboard';
import { ProjectsGridSkeleton } from './ProjectCardSkeleton';
import LoginRequiredGuard from './LoginRequiredGuard';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isPublic: boolean;
  size: string;
  layers: number;
  lastModified: string;
  owner: string;
}

export default function OwnProjects() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { projects: apiProjects, dbInfo, isLoading, error } = useAppSelector((state) => state.dashboard);

  const [databaseDialogOpen, setDatabaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [dialogProjectId, setDialogProjectId] = useState<string | null>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    subdomain: '',
    keywords: '',
    description: '',
    categories: [] as string[],
  });
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    subdomain: '',
    keywords: '',
    description: '',
    categories: [] as string[],
    isPublic: false,
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        const response = await dashboardService.getProjects();
        dispatch(setProjects({
          projects: response.list_of_projects,
          dbInfo: response.db_info,
        }));
      } catch (err: any) {
        console.error('Failed to fetch projects:', err);
        dispatch(setError(err.error || 'Nie udało się pobrać projektów'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchProjects();
  }, [dispatch]);

  // Map API projects to UI format
  const projects: Project[] = apiProjects.map((proj) => ({
    id: proj.project_name,
    title: proj.custom_project_name || proj.project_name,
    description: proj.description || 'Projekt własny',
    image: proj.logoExists ? `/api/logos/${proj.project_name}` : '',
    category: proj.categories || 'Inne',
    isPublic: proj.published,
    size: '0 MB', // TODO: Calculate from backend if available
    layers: 0, // TODO: Get from backend if available
    lastModified: `${proj.project_date} ${proj.project_time}`,
    owner: 'Ty',
  }));



  const handleProjectAction = (action: string, projectId: string) => {
    console.log(`${action} project:`, projectId);
    
    switch (action) {
      case 'database':
        setDialogProjectId(projectId);
        setDatabaseDialogOpen(true);
        break;
      case 'delete':
        setProjectToDelete(projectId);
        setDeleteDialogOpen(true);
        break;
      case 'import':
        setImportDialogOpen(true);
        break;
      case 'settings':
        setDialogProjectId(projectId);
        setSettingsDialogOpen(true);
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  const handleNewProject = () => {
    setNewProjectDialogOpen(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      console.log('Deleting project:', projectToDelete);
      // Here you would call your delete API
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleCreateProject = () => {
    console.log('Creating project:', newProjectData);
    // Here you would call your create project API
    setNewProjectDialogOpen(false);
    setNewProjectData({
      name: '',
      subdomain: '',
      keywords: '',
      description: '',
      categories: [],
    });
  };

  const handleCategoryChange = (category: string) => {
    setNewProjectData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleEditCategoryChange = (category: string) => {
    setEditProjectData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSaveProjectSettings = () => {
    console.log('Saving project settings:', editProjectData);
    // Tutaj będzie API call do zapisu zmian
    setSettingsDialogOpen(false);
    setDialogProjectId(null);
  };

  const handleCloseDatabaseDialog = () => {
    setDatabaseDialogOpen(false);
    setDialogProjectId(null);
  };

  const handleCloseSettingsDialog = () => {
    setSettingsDialogOpen(false);
    setDialogProjectId(null);
  };

  // Załaduj dane projektu przy otwieraniu dialogu ustawień
  useEffect(() => {
    if (settingsDialogOpen && dialogProjectId) {
      const project = mockProjects.find(p => p.id === dialogProjectId);
      if (project) {
        setEditProjectData({
          name: project.title,
          subdomain: `${project.title.toLowerCase().replace(/\s+/g, '')}.mapmaker.online`,
          keywords: `${project.category}, mapa, projekt`,
          description: project.description,
          categories: [project.category],
          isPublic: project.isPublic,
        });
      }
    }
  }, [settingsDialogOpen, dialogProjectId]);

  const ProjectCard = ({ project }: { project: Project }) => {
    const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null);

    const handleCardMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setCardMenuAnchor(event.currentTarget);
    };

    const handleCardMenuClose = () => {
      setCardMenuAnchor(null);
    };

    const handleCardProjectAction = (action: string) => {
      handleCardMenuClose();
      handleProjectAction(action, project.id);
    };

    return (
      <>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            },
            border: '1px solid',
            borderColor: 'divider',
          }}
          onClick={() => window.location.href = '/map'}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="200"
              image={project.image}
              alt={project.title}
              sx={{ 
                bgcolor: 'grey.100',
                backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              {project.isPublic && (
                <Chip
                  label="OPUBLIKOWANY"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.9),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    backdropFilter: 'blur(4px)',
                  }}
                />
              )}
              <Chip
                icon={project.isPublic ? <Public /> : <Lock />}
                label="Prywatny"
                size="small"
                color="default"
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(4px)',
                  ml: project.isPublic ? 0 : 'auto',
                }}
              />
            </Box>
            <IconButton
              aria-label="Więcej opcji"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.background.paper, 1),
                },
                zIndex: 10,
              }}
              onClick={handleCardMenuOpen}
            >
              <MoreVert />
            </IconButton>
          </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
          {project.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {project.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            M
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {project.owner}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ViewModule fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {project.layers}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Storage fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {project.size}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Ostatnia modyfikacja: {project.lastModified}
        </Typography>
      </CardContent>
    </Card>

    {/* Project Menu */}
    <Menu
      anchorEl={cardMenuAnchor}
      open={Boolean(cardMenuAnchor)}
      onClose={handleCardMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        '& .MuiPaper-root': {
          minWidth: 220,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider',
          mt: 0.5,
        }
      }}
    >
      {project.isPublic && (
        <MenuItem onClick={() => handleCardProjectAction('published-view')}>
          <ListItemIcon>
            <Language fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mapa w wersji opublikowanej</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={() => handleCardProjectAction('settings')}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        <ListItemText>Ustawienia</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleCardProjectAction('database')}>
        <ListItemIcon>
          <TableChart fontSize="small" />
        </ListItemIcon>
        <ListItemText>Baza danych</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleCardProjectAction('publish')}>
        <ListItemIcon>
          <Public fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          {project.isPublic ? 'Cofnij publikację' : 'Publikacja mapy'}
        </ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleCardProjectAction('import')}>
        <ListItemIcon>
          <Upload fontSize="small" />
        </ListItemIcon>
        <ListItemText>Importuj projekt</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleCardProjectAction('delete')} sx={{ color: 'error.main' }}>
        <ListItemIcon>
          <Delete fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Usuń projekt</ListItemText>
      </MenuItem>
    </Menu>
  </>
);
};

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Twoje projekty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Zarządzaj swoimi projektami mapowymi
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={handleNewProject}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            fontWeight: 600,
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          Nowy projekt
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading && <ProjectsGridSkeleton count={6} />}

      {/* Error / Unauthenticated State */}
      {error && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%',
              p: 3,
              display: 'inline-flex',
              mb: 3,
              boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
            }}
          >
            <LoginIcon sx={{ fontSize: 56, color: 'white' }} />
          </Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Zaloguj się, aby zobaczyć swoje projekty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Ta sekcja wymaga zalogowania do Twojego konta MapMaker
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => router.push('/auth?tab=0')}
              sx={{
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Zaloguj się
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/auth?tab=1')}
              sx={{
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Utwórz konto
            </Button>
          </Stack>
          <Button
            variant="text"
            onClick={() => router.push('/dashboard?tab=1')}
            sx={{
              mt: 3,
              textTransform: 'none',
              color: 'text.secondary',
            }}
          >
            Wróć do projektów publicznych
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !error && projects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ViewModule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Brak projektów
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Utwórz swój pierwszy projekt, aby zacząć
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleNewProject}>
            Utwórz projekt
          </Button>
        </Box>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && projects.length > 0 && (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      )}



      {/* Floating Action Button - tylko mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleNewProject}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <Add />
      </Fab>

      {/* Database Dialog */}
      <Dialog
        open={databaseDialogOpen}
        onClose={handleCloseDatabaseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
          Baza danych
          <IconButton onClick={handleCloseDatabaseDialog} size="small" aria-label="Zamknij">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {dialogProjectId && (() => {
            const project = mockProjects.find(p => p.id === dialogProjectId);
            if (!project) return null;
            
            // Placeholder database info - można łatwo zmienić później
            const dbInfo = {
              dbName: `db_${project.title.toLowerCase().replace(/\s+/g, '_')}`,
              createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              host: `db-${project.id}.mapmaker.online`,
              port: 5432,
              username: `user_${project.id}_${project.title.toLowerCase().slice(0, 8)}`,
              password: `***${Math.random().toString(36).substring(2, 8)}***`,
              schema: `schema_${project.category.toLowerCase()}`,
              tables: Math.floor(Math.random() * 15) + 5,
              size: project.size
            };
            
            return (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nazwa bazy danych:
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                    {dbInfo.dbName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Projekt utworzony:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {dbInfo.createdDate}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Host:
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                    {dbInfo.host}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Port:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {dbInfo.port}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Login:
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                    {dbInfo.username}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Hasło:
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                    {dbInfo.password}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Schema:
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                    {dbInfo.schema}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Liczba tabel:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {dbInfo.tables}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rozmiar bazy:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {dbInfo.size}
                  </Typography>
                </Box>
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
          Potwierdzenie
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small" aria-label="Zamknij">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Czy na pewno chcesz usunąć {projectToDelete && projects.find(p => p.id === projectToDelete)?.title}?
          </Typography>
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label="Usuń projekt permanentnie i zwolnij miejsce na koncie"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Anuluj
          </Button>
          <Button onClick={handleDeleteProject} variant="contained" color="error">
            Usuń
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Project Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
          Importuj projekt
          <IconButton onClick={() => setImportDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upuść plik tutaj lub kliknij, aby wybrać z dysku
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pliki niestandardowe (*.qgs,*.qgz)
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Wybierz pliki
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            Obsługiwane formaty: QGS, QGZ (pliki projektów QGIS)
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit">
            Anuluj
          </Button>
          <Button variant="contained">
            Importuj
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog
        open={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
          Utwórz nowy projekt
          <IconButton onClick={() => setNewProjectDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Nazwa projektu"
              placeholder="Wpisz minimum 4 znaki"
              fullWidth
              value={newProjectData.name}
              onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
              helperText="Minimum 4 znaki"
            />
            
            <TextField
              label="Subdomena"
              placeholder="Wpisz pod jaką domeną ma zostać wyświetlony Twój projekt"
              fullWidth
              value={newProjectData.subdomain}
              onChange={(e) => setNewProjectData(prev => ({ ...prev, subdomain: e.target.value }))}
            />
            
            <TextField
              label="Słowa kluczowe"
              placeholder="Opisz swój projekt słowami kluczowymi używając przecinków między słowami"
              fullWidth
              value={newProjectData.keywords}
              onChange={(e) => setNewProjectData(prev => ({ ...prev, keywords: e.target.value }))}
            />
            
            <TextField
              label="Opis"
              placeholder="Opisz swój projekt maksymalnie w 120 znakach"
              fullWidth
              multiline
              rows={3}
              value={newProjectData.description}
              onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
              helperText={`${newProjectData.description.length}/120`}
            />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Kategoria:
              </Typography>
              <Grid container spacing={1}>
                {['EMUiA', 'SIP', 'Suikzp', 'MPZP', 'EGiB', 'Inne'].map((category) => (
                  <Grid item xs={6} sm={4} key={category}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newProjectData.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                        />
                      }
                      label={category}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.400',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Upuść plik tutaj lub kliknij, aby wybrać z dysku (*.qgs, *.qgz)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setNewProjectDialogOpen(false)} color="inherit">
            Wyczyść
          </Button>
          <Button onClick={handleCreateProject} variant="contained">
            Stwórz nowy projekt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={handleCloseSettingsDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
          Ustawienia projektu
          <IconButton onClick={handleCloseSettingsDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Nazwa projektu"
              placeholder="Wpisz minimum 4 znaki"
              fullWidth
              value={editProjectData.name}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, name: e.target.value }))}
              helperText="Minimum 4 znaki"
            />
            
            <TextField
              label="Subdomena"
              placeholder="Wpisz pod jaką domeną ma zostać wyświetlony Twój projekt"
              fullWidth
              value={editProjectData.subdomain}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, subdomain: e.target.value }))}
            />
            
            <TextField
              label="Słowa kluczowe"
              placeholder="Opisz swój projekt słowami kluczowymi używając przecinków między słowami"
              fullWidth
              value={editProjectData.keywords}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, keywords: e.target.value }))}
            />
            
            <TextField
              label="Opis"
              placeholder="Opisz swój projekt maksymalnie w 120 znakach"
              fullWidth
              multiline
              rows={3}
              value={editProjectData.description}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, description: e.target.value }))}
              helperText={`${editProjectData.description.length}/120`}
            />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Kategoria:
              </Typography>
              <Grid container spacing={1}>
                {['EMUiA', 'SIP', 'Suikzp', 'MPZP', 'EGiB', 'Inne'].map((category) => (
                  <Grid item xs={6} sm={4} key={category}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editProjectData.categories.includes(category)}
                          onChange={() => handleEditCategoryChange(category)}
                        />
                      }
                      label={category}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Widoczność:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editProjectData.isPublic}
                    onChange={(e) => setEditProjectData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                }
                label="Projekt publiczny"
              />
            </Box>

            {dialogProjectId && (() => {
              const project = mockProjects.find(p => p.id === dialogProjectId);
              return project ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Ostatnia modyfikacja:</strong> {project.lastModified}<br />
                    <strong>Rozmiar:</strong> {project.size}<br />
                    <strong>Liczba warstw:</strong> {project.layers}
                  </Typography>
                </Alert>
              ) : null;
            })()}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseSettingsDialog} color="inherit">
            Anuluj
          </Button>
          <Button onClick={handleSaveProjectSettings} variant="contained">
            Zapisz zmiany
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}