'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import MapContainer from '@/features/mapa/komponenty/MapContainer';
import LeftPanel from '@/features/warstwy/komponenty/LeftPanel';
import RightToolbar from '@/features/narzedzia/RightToolbar';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentProject } from '@/redux/slices/projectsSlice';
import { loadLayers, resetLayers } from '@/redux/slices/layersSlice';
import { setViewState, setMapStyle } from '@/redux/slices/mapSlice';
import { useGetProjectDataQuery } from '@/redux/api/projectsApi';
import { MAP_STYLES } from '@/mapbox/config';

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const projectName = searchParams.get('project');

  // Fetch project data using RTK Query
  const { data: projectData, isLoading, error, isError } = useGetProjectDataQuery(
    { project: projectName || '', published: false },
    { skip: !projectName } // Don't fetch if no project name
  );

  // Determine if user is owner (edit mode) or viewer (read-only)
  const isOwner = isAuthenticated && currentProject && user?.id === (currentProject as any).owner_id;
  const isReadOnly = !isOwner;

  useEffect(() => {
    if (!projectName) {
      router.push('/dashboard');
      return;
    }

    // Reset previous project data when switching projects
    if (currentProject?.project_name !== projectName) {
      dispatch(resetLayers());
    }
  }, [projectName, currentProject, dispatch, router]);

  useEffect(() => {
    if (!projectData || isLoading) return;

    console.log('📦 Loading project data:', projectData.name);
    console.log(isOwner ? '✏️ Edit mode (owner)' : '👁️ Read-only mode (viewer)');

    // Convert tree.json format to Redux layers format
    const convertedLayers = projectData.children || [];

    // Load layers into Redux
    dispatch(loadLayers(convertedLayers));

    // Load map extent as viewport
    if (projectData.extent && projectData.extent.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = projectData.extent;
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      dispatch(setViewState({
        longitude: centerLng,
        latitude: centerLat,
        zoom: 10, // Default zoom, can be calculated from extent
        bearing: 0,
        pitch: 0,
      }));
    }

    // Set default map style
    dispatch(setMapStyle({
      url: MAP_STYLES.full3d.style,
      key: 'full3d',
    }));
  }, [projectData, isLoading, isOwner, dispatch]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Wczytywanie projektu: {projectName}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (isError || error) {
    const errorMessage = error
      ? ('status' in error && error.status === 404
        ? 'Projekt nie został znaleziony'
        : 'data' in error && typeof error.data === 'string'
        ? error.data
        : 'Nie udało się załadować projektu')
      : 'Wystąpił błąd podczas ładowania projektu';

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 3,
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {errorMessage}
        </Alert>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => router.push('/dashboard')}
        >
          Powrót do dashboardu
        </Typography>
      </Box>
    );
  }

  // No data state
  if (!projectData) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Alert severity="info" sx={{ maxWidth: 500 }}>
          Brak danych projektu
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Lewy panel - warstwy, narzędzia, legenda */}
      <LeftPanel />

      {/* Główna mapa */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          position: 'relative',
          height: '100vh',
        }}
      >
        {/* Read-only mode indicator */}
        {isReadOnly && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 80,
              zIndex: 1000,
              bgcolor: 'rgba(255, 152, 0, 0.9)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              boxShadow: 2,
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            👁️ Tryb podglądu (tylko odczyt)
          </Box>
        )}

        <MapContainer>
          {/* Draw Tools, Geocoder, Popups będą dodane tutaj */}
        </MapContainer>
      </Box>

      {/* Prawy toolbar - pomiary, ustawienia */}
      <RightToolbar />
    </Box>
  );
}
