'use client';

import React, { useEffect } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import MapContainer from '@/features/mapa/komponenty/MapContainer';
import LeftPanel from '@/features/warstwy/komponenty/LeftPanel';
import RightToolbar from '@/features/narzedzia/RightToolbar';
import { QGISProjectLoader } from '@/src/components/qgis/QGISProjectLoader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentProject } from '@/redux/slices/projectsSlice';
import { loadLayers, resetLayers } from '@/redux/slices/layersSlice';
import { setViewState, setMapStyle } from '@/redux/slices/mapSlice';
import { useGetProjectDataQuery } from '@/redux/api/projectsApi';
import { MAP_STYLES } from '@/mapbox/config';
import { transformExtent, isValidWGS84 } from '@/mapbox/coordinates';

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const projectName = searchParams.get('project');

  // Fetch project data using RTK Query (non-blocking - UI renders immediately)
  const { data: projectData, isLoading, error, isError } = useGetProjectDataQuery(
    { project: projectName || '', published: false },
    { skip: !projectName }
  );

  // Determine if user is owner (edit mode) or viewer (read-only)
  const isOwner = isAuthenticated && currentProject && user?.id === (currentProject as any).owner_id;
  const isReadOnly = !isOwner;

  // Redirect to dashboard if no project name
  useEffect(() => {
    if (!projectName) {
      router.push('/dashboard');
    }
  }, [projectName, router]);

  // Reset layers when switching projects
  useEffect(() => {
    if (currentProject?.project_name !== projectName) {
      dispatch(resetLayers());
    }
  }, [projectName, currentProject, dispatch]);

  // Load project data when available (optional - doesn't block UI)
  useEffect(() => {
    if (!projectData || isLoading) return;

    console.log('📦 Loading project data:', projectData.name);
    console.log(isOwner ? '✏️ Edit mode (owner)' : '👁️ Read-only mode (viewer)');

    const convertedLayers = projectData.children || [];
    dispatch(loadLayers(convertedLayers));

    if (projectData.extent && projectData.extent.length === 4) {
      const [minX, minY, maxX, maxY] = projectData.extent;

      // Check if coordinates need transformation (EPSG:2180 → EPSG:4326)
      let minLng, minLat, maxLng, maxLat;

      if (isValidWGS84(minX, minY) && isValidWGS84(maxX, maxY)) {
        // Already WGS84
        [minLng, minLat, maxLng, maxLat] = projectData.extent;
        console.log('✅ Extent already in WGS84:', projectData.extent);
      } else {
        // Transform from EPSG:2180 (Polish Grid) to EPSG:4326 (WGS84)
        [minLng, minLat, maxLng, maxLat] = transformExtent(projectData.extent);
        console.log('🔄 Transformed extent EPSG:2180 → WGS84:', {
          from: projectData.extent,
          to: [minLng, minLat, maxLng, maxLat]
        });
      }

      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      // Validate final coordinates before dispatching
      if (isValidWGS84(centerLng, centerLat)) {
        dispatch(setViewState({
          longitude: centerLng,
          latitude: centerLat,
          zoom: 10,
          bearing: 0,
          pitch: 0,
        }));
      } else {
        console.error('❌ Invalid WGS84 coordinates after transformation:', {
          centerLng,
          centerLat,
          originalExtent: projectData.extent
        });
      }
    }

    dispatch(setMapStyle({
      url: MAP_STYLES.full3d.style,
      key: 'full3d',
    }));
  }, [projectData, isLoading, isOwner, dispatch]);

  if (!projectName) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <LeftPanel />
        <Box component="main" sx={{ flexGrow: 1, position: 'relative', height: '100vh' }}>
          {isLoading && (
            <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, bgcolor: 'rgba(255, 255, 255, 0.95)', px: 3, py: 1.5, borderRadius: 2, boxShadow: 2, fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 16, height: 16, border: '2px solid', borderColor: 'primary.main', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              Wczytywanie projektu: {projectName}
            </Box>
          )}
          {isReadOnly && (
            <Box sx={{ position: 'absolute', top: 16, right: 80, zIndex: 1000, bgcolor: 'rgba(255, 152, 0, 0.9)', color: 'white', px: 2, py: 1, borderRadius: 1, boxShadow: 2, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              👁️ Tryb podglądu (tylko odczyt)
            </Box>
          )}
          <MapContainer />
          {projectName && <QGISProjectLoader projectName={projectName} />}
        </Box>
        <RightToolbar />
      </Box>
      <Snackbar open={isError} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: 24 }}>
        <Alert severity="warning" variant="filled" sx={{ width: '100%', maxWidth: 600 }}>
          {error && 'status' in error && error.status === 404 ? `Projekt "${projectName}" nie został znaleziony` : error && 'status' in error && error.status === 400 ? `Nie można wczytać danych projektu "${projectName}". Projekt może być pusty lub uszkodzony.` : `Błąd podczas ładowania projektu "${projectName}"`}
        </Alert>
      </Snackbar>
    </>
  );
}
