'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import MapContainer from '@/components/map/MapContainer';
import LeftPanel from '@/components/panels/LeftPanel';
import RightToolbar from '@/components/panels/RightToolbar';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedProject } from '@/store/slices/dashboardSlice';

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projectName = searchParams.get('project');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectName) {
        setError('Nie wybrano projektu. Przekierowanie do dashboardu...');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Set selected project in Redux
        dispatch(setSelectedProject(projectName));

        // TODO: Fetch project data from backend
        // const projectData = await dashboardService.getProjectData(projectName);
        // dispatch(loadLayers(projectData.layers));
        // dispatch(loadMapState(projectData.mapState));

        // For now, just simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load project:', err);
        setError(err.message || 'Nie udało się załadować projektu');
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectName, dispatch, router]);

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