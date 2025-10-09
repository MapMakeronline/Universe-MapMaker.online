// Integrated version of OwnProjects with full backend support
// This file demonstrates integration with projectsSlice and backend API

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Login as LoginIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchProjects,
  createProject,
  deleteProject as deleteProjectThunk,
  togglePublishProject,
  setCurrentProject,
} from '@/store/slices/projectsSlice';
import { ProjectsGridSkeleton } from './ProjectCardSkeleton';
import { ProjectCard } from './ProjectCard';
import { CreateProjectDialog } from './dialogs/CreateProjectDialog';
import { DeleteProjectDialog } from './dialogs/DeleteProjectDialog';
import type { Project, CreateProjectData } from '@/lib/api/types';

export default function OwnProjectsIntegrated() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const { projects, isLoading, error } = useAppSelector((state) => state.projects);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Local UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch projects on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProjects());
    }
  }, [dispatch, isAuthenticated]);

  // Handlers
  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };

  const handleProjectCreated = async (data: CreateProjectData) => {
    try {
      await dispatch(createProject(data)).unwrap();
      setSnackbar({
        open: true,
        message: 'Projekt został utworzony pomyślnie!',
        severity: 'success',
      });
      setCreateDialogOpen(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error || 'Nie udało się utworzyć projektu',
        severity: 'error',
      });
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await dispatch(deleteProjectThunk(projectToDelete.project_name)).unwrap();
      setSnackbar({
        open: true,
        message: 'Projekt został usunięty',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error || 'Nie udało się usunąć projektu',
        severity: 'error',
      });
    }
  };

  const handleTogglePublish = async (project: Project) => {
    try {
      await dispatch(
        togglePublishProject({
          projectName: project.project_name,
          publish: !project.published,
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: project.published
          ? 'Projekt został ukryty'
          : 'Projekt został opublikowany!',
        severity: 'success',
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error || 'Nie udało się zmienić statusu publikacji',
        severity: 'error',
      });
    }
  };

  const handleOpenProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    router.push('/map');
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
            Zarządzaj swoimi projektami mapowymi
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={handleCreateProject}
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
        )}
      </Box>

      {/* Loading State */}
      {isLoading && <ProjectsGridSkeleton count={6} />}

      {/* Error / Unauthenticated State */}
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
      {isAuthenticated && !isLoading && projects.length === 0 && (
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
      {isAuthenticated && !isLoading && projects.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {projects.map((project) => (
            <ProjectCard
              key={project.project_name}
              project={project}
              onOpen={() => handleOpenProject(project)}
              onDelete={() => handleDeleteProject(project)}
              onTogglePublish={() => handleTogglePublish(project)}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleProjectCreated}
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
