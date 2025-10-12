// OwnProjects with RTK Query (Phase 3)
// Demonstrates RTK Query migration from async thunks
// ~85% less boilerplate compared to async thunks

'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Add from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { setCurrentProject } from '@/redux/slices/projectsSlice';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useImportQGSMutation,
  useDeleteProjectMutation,
  useTogglePublishMutation,
} from '@/redux/api/projectsApi';
import { useAddShapefileLayerMutation } from '@/redux/api/layersApi';
import { ProjectsGridSkeleton } from './ProjectCardSkeleton';
import { ProjectCard } from './ProjectCard';
import { CreateProjectDialog } from '../dialogi/CreateProjectDialog';
import type { ShapefileSet } from '../dialogi/CreateProjectDialog';
import { DeleteProjectDialog } from '../dialogi/DeleteProjectDialog';
import { ProjectSettingsDialog } from '../dialogi/ProjectSettingsDialog';
import type { Project, CreateProjectData } from '@/api/typy/types';

export default function OwnProjectsRTK() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Auth state
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // RTK Query hooks - auto-fetch, auto-cache, auto-refetch
  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useGetProjectsQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
    pollingInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // RTK Query mutations
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [importQGS, { isLoading: isImporting }] = useImportQGSMutation();
  const [addShapefileLayer] = useAddShapefileLayerMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [togglePublish, { isLoading: isToggling }] = useTogglePublishMutation();

  // Local UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectForSettings, setProjectForSettings] = useState<Project | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Extract and sort projects array (newest first)
  const projects = projectsData?.list_of_projects
    ? [...projectsData.list_of_projects].sort((a, b) => {
        // Sort by created_at descending (newest first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
    : [];

  // Handlers
  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };

  const handleProjectCreated = async (data: CreateProjectData) => {
    try {
      await createProject(data).unwrap();
      setSnackbar({
        open: true,
        message: 'Projekt został utworzony pomyślnie!',
        severity: 'success',
      });
      setCreateDialogOpen(false);
      // RTK Query automatically refetches due to cache invalidation
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Nie udało się utworzyć projektu',
        severity: 'error',
      });
    }
  };

  const handleImportQGIS = async (
    file: File,
    projectName: string,
    domain: string,
    description?: string,
    onProgress?: (progress: number) => void
  ) => {
    try {
      // STEP 1: Create empty project first (backend requirement)
      const createData: CreateProjectData = {
        project: projectName,
        domain: domain || projectName.toLowerCase(),
        projectDescription: description || `Importowany projekt QGIS: ${file.name}`,
        keywords: 'qgis, import',
        categories: ['Inne'],
      };

      const createdProject = await createProject(createData).unwrap();
      console.log('✅ STEP 1: Project created:', createdProject);

      // CRITICAL: Use db_name from response - this is the REAL project_name (with suffix _1, _2, etc.)
      const backendProjectName = createdProject.data.db_name;
      console.log('🎯 STEP 2: Using backend project_name from db_name:', backendProjectName);

      // STEP 3: Import QGS file to the created project (RTK Query with progress tracking)
      console.log('📤 STEP 3: Starting QGS import with file:', file.name, 'size:', file.size);
      const importResult = await importQGS({
        project: backendProjectName,
        qgsFile: file,
        onProgress, // Pass progress callback from dialog
      }).unwrap();
      console.log('✅ STEP 4: QGS import completed:', importResult);

      setSnackbar({
        open: true,
        message: `Projekt "${projectName}" został utworzony i zaimportowany pomyślnie!`,
        severity: 'success',
      });
      setCreateDialogOpen(false);

      // RTK Query automatically invalidates cache and refetches
    } catch (error: any) {
      // Error will be handled by CreateProjectDialog
      throw error;
    }
  };

  /**
   * Import Shapefile project workflow:
   * 1. Create empty project
   * 2. For each shapefile: upload as layer (sequential)
   * 3. Navigate to project map
   */
  const handleImportShapefile = async (
    shapefiles: ShapefileSet[],
    projectName: string,
    domain: string,
    description?: string,
    onProgress?: (current: number, total: number) => void
  ) => {
    try {
      // STEP 1: Create empty project
      const createData: CreateProjectData = {
        project: projectName,
        domain: domain || projectName.toLowerCase(),
        projectDescription: description || `Projekt Shapefile: ${shapefiles.length} warstw`,
        keywords: 'shapefile, import',
        categories: ['Inne'],
      };

      const createdProject = await createProject(createData).unwrap();
      console.log('✅ STEP 1: Project created:', createdProject);

      // CRITICAL: Use db_name from response (real project_name with suffix)
      const backendProjectName = createdProject.data.db_name;
      console.log('🎯 STEP 2: Using backend project_name from db_name:', backendProjectName);

      // STEP 2.5: Wait for backend to initialize QGS file (template)
      console.log('⏳ STEP 2.5: Waiting 1s for backend QGS initialization...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      console.log('✅ STEP 2.5: Delay complete, proceeding to layer import');

      // STEP 3: Import each shapefile as a layer (sequential - backend limitation)
      console.log(`📤 STEP 3: Starting import of ${shapefiles.length} shapefiles...`);

      for (let i = 0; i < shapefiles.length; i++) {
        const shp = shapefiles[i];
        console.log(`📤 Importing shapefile ${i + 1}/${shapefiles.length}: ${shp.name}`);

        // Update progress
        if (onProgress) {
          onProgress(i + 1, shapefiles.length);
        }

        // Import shapefile as layer
        await addShapefileLayer({
          project: backendProjectName,
          layer_name: shp.name,
          shpFile: shp.shpFile,
          shxFile: shp.shxFile,
          dbfFile: shp.dbfFile,
          prjFile: shp.prjFile,
          cpgFile: shp.cpgFile,
          qpjFile: shp.qpjFile,
        }).unwrap();

        console.log(`✅ Imported shapefile ${i + 1}/${shapefiles.length}: ${shp.name}`);
      }

      console.log('✅ STEP 4: All shapefiles imported successfully');

      setSnackbar({
        open: true,
        message: `Projekt "${projectName}" został utworzony z ${shapefiles.length} warstwami!`,
        severity: 'success',
      });
      setCreateDialogOpen(false);

      // RTK Query automatically invalidates cache and refetches
    } catch (error: any) {
      // Error will be handled by CreateProjectDialog
      throw error;
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject({ project: projectToDelete.project_name, remove_permanently: false }).unwrap();
      setSnackbar({
        open: true,
        message: 'Projekt został usunięty',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      // RTK Query automatically updates cache
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Nie udało się usunąć projektu',
        severity: 'error',
      });
    }
  };

  const handleTogglePublish = async (project: Project) => {
    try {
      await togglePublish({
        project: project.project_name,
        publish: !project.published,
      }).unwrap();
      setSnackbar({
        open: true,
        message: project.published
          ? 'Projekt został ukryty'
          : 'Projekt został opublikowany!',
        severity: 'success',
      });
      // Optimistic update already applied, cache updated automatically
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Nie udało się zmienić statusu publikacji',
        severity: 'error',
      });
    }
  };

  const handleOpenProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    router.push(`/map?project=${project.project_name}`);
  };

  const handleOpenSettings = (project: Project) => {
    setProjectForSettings(project);
    setSettingsDialogOpen(true);
  };

  // Render
  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="700"
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Twoje projekty
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Zarządzaj swoimi projektami mapowymi (RTK Query)
          </Typography>
        </Box>
        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => refetch()}
              disabled={isLoading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              Odśwież
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              size="large"
              onClick={handleCreateProject}
              disabled={isCreating}
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
        )}
      </Box>

      {/* Loading State */}
      {isLoading && <ProjectsGridSkeleton count={6} />}

      {/* Error State */}
      {error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Błąd ładowania projektów
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {(error as any)?.data?.message || 'Nie udało się pobrać projektów'}
          </Typography>
          <Button variant="contained" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Box>
      )}

      {/* Unauthenticated State */}
      {!isAuthenticated && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LoginIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h5" fontWeight="700" gutterBottom>
            Zaloguj się, aby zobaczyć swoje projekty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Ta sekcja wymaga zalogowania do Twojego konta MapMaker
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => router.push('/auth?tab=0')}
            sx={{ px: 4, py: 1.5, textTransform: 'none', fontWeight: 600 }}
          >
            Zaloguj się
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {isAuthenticated && !isLoading && !error && projects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Brak projektów
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Utwórz swój pierwszy projekt, aby zacząć
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateProject}>
            Utwórz projekt
          </Button>
        </Box>
      )}

      {/* Projects Grid */}
      {isAuthenticated && !isLoading && !error && projects.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {projects.map((project) => (
            <ProjectCard
              key={project.project_name}
              project={project}
              onOpen={() => handleOpenProject(project)}
              onDelete={() => handleDeleteProject(project)}
              onTogglePublish={() => handleTogglePublish(project)}
              onSettings={() => handleOpenSettings(project)}
              onOpenInMap={() => router.push(`/map?project=${project.project_name}`)}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleProjectCreated}
        onImportQGIS={handleImportQGIS}
        onImportShapefile={handleImportShapefile}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        project={projectToDelete}
        onConfirm={handleConfirmDelete}
      />

      <ProjectSettingsDialog
        open={settingsDialogOpen}
        onClose={() => {
          setSettingsDialogOpen(false);
          setProjectForSettings(null);
        }}
        project={projectForSettings}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
