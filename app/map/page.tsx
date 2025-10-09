'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import MapContainer from '@/components/map/MapContainer';
import LeftPanel from '@/components/panels/LeftPanel';
import RightToolbar from '@/components/panels/RightToolbar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentProject } from '@/store/slices/projectsSlice';
import { loadLayers, resetLayers } from '@/store/slices/layersSlice';
import { setViewState, setMapStyle } from '@/store/slices/mapSlice';
import { unifiedProjectsApi } from '@/lib/api/unified-projects';
import { MAP_STYLES } from '@/lib/mapbox/config';

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const projectName = searchParams.get('project');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectData = async () => {
      // Check authentication first
      if (!isAuthenticated) {
        console.warn('User not authenticated, redirecting to login...');
        setError('Musisz być zalogowany. Przekierowanie do logowania...');
        setTimeout(() => router.push('/auth?tab=0'), 2000);
        return;
      }

      if (!projectName) {
        setError('Nie wybrano projektu. Przekierowanie do dashboardu...');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Reset previous project data
        dispatch(resetLayers());

        // Fetch project data from backend
        const projectData = await unifiedProjectsApi.getProjectData(projectName);

        // Set current project in Redux
        dispatch(setCurrentProject(projectData as any));

        // Load layers into Redux
        dispatch(loadLayers(projectData.layers));

        // Load map state (viewport + style)
        if (projectData.map_state) {
          dispatch(setViewState(projectData.map_state.viewState));

          // Resolve style key to Mapbox URL
          const styleKey = projectData.map_state.mapStyle as keyof typeof MAP_STYLES;
          if (styleKey && MAP_STYLES[styleKey]) {
            // Use the object form with both URL and key
            dispatch(setMapStyle({
              url: MAP_STYLES[styleKey].style,
              key: styleKey,
            }));
          } else {
            // Fallback to full3d if style key is invalid
            console.warn(`Invalid style key: ${styleKey}, falling back to full3d`);
            dispatch(setMapStyle({
              url: MAP_STYLES.full3d.style,
              key: 'full3d',
            }));
          }
        }

        // TODO: Load features (3D buildings, POI, etc.)
        // dispatch(loadFeatures(projectData.features));

        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load project:', err);

        // Handle 401 Unauthorized specifically
        if (err.status === 401 || err.message?.includes('401')) {
          setError('Sesja wygasła. Przekierowanie do logowania...');
          setTimeout(() => router.push('/auth?tab=0'), 2000);
          return;
        }

        setError(err.message || 'Nie udało się załadować projektu');
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectName, dispatch, router, isAuthenticated]);

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

  if (error) {
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
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
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
        <MapContainer>
          {/* Draw Tools, Geocoder, Popups będą dodane tutaj */}
        </MapContainer>
      </Box>

      {/* Prawy toolbar - pomiary, ustawienia */}
      <RightToolbar />
    </Box>
  );
}
