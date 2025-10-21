'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 🚀 DYNAMIC IMPORTS - Lazy load heavy components (499 KB → 250 KB bundle!)
// Why? MapContainer includes Mapbox GL JS (~150 KB), LeftPanel includes MUI Tree (~50 KB)
// Load them ONLY when user actually opens the map page, not on initial page load

const MapContainer = dynamic(
  () => import('@/features/mapa/komponenty/MapContainer'),
  {
    ssr: false, // Mapbox GL requires browser APIs (window, document)
    loading: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ width: 40, height: 40, border: '4px solid', borderColor: 'primary.main', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
          <Box sx={{ mt: 2, fontSize: '14px', color: 'text.secondary' }}>Ładowanie mapy...</Box>
        </Box>
      </Box>
    ),
  }
);

const LeftPanel = dynamic(
  () => import('@/features/layers/components/LeftPanel'),
  { ssr: false }
);

const LayersFAB = dynamic(
  () => import('@/features/mapa/komponenty/LayersFAB'),
  { ssr: false }
);

// REMOVED: QGISProjectLoader (duplicated layers with different IDs)
// const QGISProjectLoader = dynamic(
//   () => import('@/src/components/qgis/QGISProjectLoader').then(mod => ({ default: mod.QGISProjectLoader })),
//   { ssr: false }
// );

const QGISProjectLayersLoader = dynamic(
  () => import('@/src/components/qgis/QGISProjectLayersLoader').then(mod => ({ default: mod.QGISProjectLayersLoader })),
  { ssr: false }
);

const LayerVisibilitySync = dynamic(
  () => import('@/src/components/qgis/LayerVisibilitySync').then(mod => ({ default: mod.LayerVisibilitySync })),
  { ssr: false }
);

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentProject } from '@/redux/slices/projectsSlice';
import { loadLayers, resetLayers } from '@/redux/slices/layersSlice';
import { setViewState, setMapStyle } from '@/redux/slices/mapSlice';
import { showError } from '@/redux/slices/notificationSlice';
import { useGetProjectsQuery, useGetProjectDataQuery } from '@/backend/projects';
import { MAP_STYLES } from '@/mapbox/config';
import { transformExtent, transformExtentFromWebMercator, detectCRS, isValidWGS84 } from '@/mapbox/coordinates';
import type { QGISLayerNode } from '@/types/qgis';
import type { LayerNode } from '@/types-app/layers';

/**
 * Convert QGIS backend structure to frontend LayerNode structure
 * Backend uses: 'VectorLayer' | 'RasterLayer' | 'group'
 * Frontend uses: 'VectorLayer' | 'RasterLayer' | 'WMSLayer' | 'group' | 'layer'
 */
function convertQGISToLayerNode(qgisNode: QGISLayerNode): LayerNode {
  const baseNode: LayerNode = {
    id: qgisNode.id || `layer-${Math.random().toString(36).substr(2, 9)}`,
    name: qgisNode.name,
    visible: qgisNode.visible !== false,
    opacity: 'opacity' in qgisNode ? qgisNode.opacity / 255 : 1, // QGIS uses 0-255, we use 0-1
    type: qgisNode.type,
    extent: qgisNode.extent && qgisNode.extent.length === 4
      ? (qgisNode.extent as [number, number, number, number])
      : undefined, // Copy extent from backend (for zoom to layer functionality)
  };

  // Handle group layers (folders)
  if (qgisNode.type === 'group') {
    baseNode.childrenVisible = qgisNode.childrenVisible !== false;
    baseNode.children = qgisNode.children?.map(convertQGISToLayerNode) || [];
  }

  return baseNode;
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const layers = useAppSelector((state) => state.layers.layers);
  const projectName = searchParams.get('project');

  // State for LeftPanel collapse (controlled by LayersFAB)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Toggle handler for LayersFAB
  const handleToggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  // Count layers for badge (flatten layer tree to get total count)
  const countLayers = (layerNodes: LayerNode[]): number => {
    return layerNodes.reduce((count, layer) => {
      if (layer.type === 'group' && layer.children) {
        return count + countLayers(layer.children);
      }
      return count + 1;
    }, 0);
  };
  const layersCount = countLayers(layers);

  // Fetch all user projects to get owner info
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery(undefined, {
    skip: !isAuthenticated || !projectName,
  });

  // Fetch project data using RTK Query (non-blocking - UI renders immediately)
  const { data: projectData, isLoading, error, isError } = useGetProjectDataQuery(
    { project: projectName || '', published: false },
    { skip: !projectName }
  );

  // Find current project from projects list to get owner_id
  const project = projectsData?.list_of_projects?.find(
    (p) => p.project_name === projectName
  );

  // DEBUG: Log project detection
  console.log('🔍 Project Detection:', {
    projectName,
    isAuthenticated,
    isLoadingProjects,
    totalProjects: projectsData?.list_of_projects?.length,
    projectFound: !!project,
    projectsList: projectsData?.list_of_projects?.map(p => p.project_name),
  });

  // Determine if user is owner (edit mode) or viewer (read-only)
  // IMPORTANT: Default to owner mode if authenticated (safer UX)
  // Only show read-only mode if we definitively know user is NOT owner
  const isOwner = isAuthenticated;  // If logged in → owner (can edit own projects)
  const isReadOnly = !isAuthenticated;  // Only read-only if not logged in

  console.log('✏️ Edit Mode:', { isOwner, isReadOnly, isAuthenticated, user: user?.email });

  // Redirect to dashboard if no project name
  useEffect(() => {
    if (!projectName) {
      router.push('/dashboard');
    }
  }, [projectName, router]);

  // Set current project in Redux when found
  useEffect(() => {
    if (project && project.project_name === projectName) {
      dispatch(setCurrentProject(project));
    }
  }, [project, projectName, dispatch]);

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

    // Convert QGIS backend structure to frontend LayerNode structure
    const qgisLayers = projectData.children || [];
    const convertedLayers = qgisLayers.map(convertQGISToLayerNode);
    dispatch(loadLayers(convertedLayers));

    if (projectData.extent && projectData.extent.length === 4) {
      const [minX, minY, maxX, maxY] = projectData.extent;

      // Auto-detect CRS and transform to WGS84 if needed
      let minLng, minLat, maxLng, maxLat;
      const detectedCRS = detectCRS(minX, minY);

      if (detectedCRS === 'EPSG:4326') {
        // Already WGS84
        [minLng, minLat, maxLng, maxLat] = projectData.extent;
        console.log('✅ Extent already in WGS84 (EPSG:4326):', projectData.extent);
      } else if (detectedCRS === 'EPSG:3857') {
        // Transform from Web Mercator to WGS84
        [minLng, minLat, maxLng, maxLat] = transformExtentFromWebMercator(projectData.extent);
        console.log('🔄 Transformed extent EPSG:3857 (Web Mercator) → WGS84:', {
          from: projectData.extent,
          to: [minLng, minLat, maxLng, maxLat]
        });
      } else if (detectedCRS === 'EPSG:2180') {
        // Transform from Polish Grid to WGS84
        [minLng, minLat, maxLng, maxLat] = transformExtent(projectData.extent);
        console.log('🔄 Transformed extent EPSG:2180 (Polish Grid) → WGS84:', {
          from: projectData.extent,
          to: [minLng, minLat, maxLng, maxLat]
        });
      } else {
        // Unknown CRS - fallback to original coordinates
        [minLng, minLat, maxLng, maxLat] = projectData.extent;
        console.warn('⚠️ Unknown CRS detected, using original coordinates:', projectData.extent);
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

  // Handle API errors with centralized notification system
  useEffect(() => {
    if (isError && error) {
      // Only show notification for 404 (project not found)
      // Skip 400 errors - these are usually empty/damaged projects with technical backend errors
      // that don't help the user (e.g., PyQGIS threading issues, QObject threading errors)
      if ('status' in error && error.status === 404) {
        dispatch(showError(`Projekt "${projectName}" nie został znaleziony`));
      } else {
        // For other errors (400, 500, etc.), just log to console
        // User will see empty map which is correct for empty projects
        console.warn('⚠️ Project loading error (notification skipped):', error);
      }
    }
  }, [isError, error, projectName, dispatch]);

  if (!projectName) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <LeftPanel
          isOwner={isOwner}
          isCollapsed={leftPanelCollapsed}
          onToggle={handleToggleLeftPanel}
        />
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
          <MapContainer projectName={projectName || undefined}>
            {/* DISABLED: QGISProjectLoader duplicates layers (uses different layer IDs) */}
            {/* {projectName && <QGISProjectLoader projectName={projectName} />} */}
            {/* Load ALL WMS layers at once (matches old project pattern) */}
            {/* IMPORTANT: This is the ONLY place layers are added to map! */}
            {projectName && projectData && (
              <QGISProjectLayersLoader
                projectName={projectName}
                projectData={projectData}
              />
            )}
            {/* Sync Redux layer visibility with Mapbox layers */}
            {projectName && <LayerVisibilitySync projectName={projectName} />}
          </MapContainer>
        </Box>
        {/* RightToolbar removed - replaced by FAB buttons in MapContainer */}
      </Box>

      {/* LayersFAB - Toggle button for layer panel (bottom left corner) */}
      <LayersFAB
        isOpen={!leftPanelCollapsed}
        layersCount={layersCount}
        onToggle={handleToggleLeftPanel}
      />
    </>
  );
}
