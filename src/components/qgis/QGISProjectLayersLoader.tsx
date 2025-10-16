'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
import { addProjectLayers } from '@/mapbox/qgis-layers';
import { mapLogger } from '@/tools/logger';

interface QGISProjectLayersLoaderProps {
  projectName: string;
  projectData: any; // QGIS project tree data
}

/**
 * QGIS Project Layers Loader
 *
 * Immediately loads ALL project layers from QGIS Server as WMS tiles.
 * Matches old project behavior: addProjectLayers(map, items, projectName)
 *
 * Flow:
 * 1. Wait for map to load (isMapLoaded = true)
 * 2. Get projectData from RTK Query (/api/projects/new/json)
 * 3. Call addProjectLayers() to add all WMS layers at once
 * 4. Layers appear immediately on map
 *
 * Advantages over component-based rendering:
 * - ✅ Faster - all layers added in one batch
 * - ✅ Simpler - no complex React state management
 * - ✅ Matches old project pattern exactly
 */
export function QGISProjectLayersLoader({ projectName, projectData }: QGISProjectLayersLoaderProps) {
  const mapRef = useMap();
  // PERFORMANCE: Subscribe only to isLoaded (not entire state.map)
  // Prevents re-render when viewState changes during map panning
  const isMapLoaded = useAppSelector((state) => state.map.isLoaded);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !projectData || !projectName) {
      mapLogger.log('⏳ Waiting for map/data:', {
        hasMap: !!mapRef.current,
        isMapLoaded,
        hasProjectData: !!projectData,
        projectName,
      });
      return;
    }

    const map = mapRef.current.getMap();
    const layers = projectData.children || [];

    if (layers.length === 0) {
      mapLogger.warn('⚠️ No layers found in project data');
      return;
    }

    mapLogger.log(`🚀 Loading ${layers.length} layers from QGIS Server for project: ${projectName}`);

    // Add all layers at once (matches old project pattern)
    const layersAdded = addProjectLayers(map, layers, projectName);

    mapLogger.log(`✅ Successfully loaded ${layersAdded} WMS layers from QGIS Server`);
  }, [mapRef, isMapLoaded, projectData, projectName]);

  return null; // No UI rendering needed
}
