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

    // CRITICAL: Wait for map style to load before adding WMS layers
    // Use 'idle' event instead of 'style.load' because style.load may have already fired
    if (!map.isStyleLoaded()) {
      mapLogger.log('⏳ Waiting for map style to load (using idle event)');
      const onMapIdle = () => {
        if (map.isStyleLoaded()) {
          mapLogger.log('🗺️ Style loaded (via idle), adding project layers now');
          const layersAdded = addProjectLayers(map, layers, projectName);
          mapLogger.log(`✅ Successfully loaded ${layersAdded} WMS layers from QGIS Server`);
        } else {
          mapLogger.warn('⚠️ Map idle but style not loaded yet, will retry on next idle');
          map.once('idle', onMapIdle); // Retry
        }
      };
      map.once('idle', onMapIdle);
      return;
    }

    // ✅ FIX: Check if layers already exist before adding
    const firstLayerId = `qgis-wms-layer-${projectName}-${layers[0].name}`;
    if (map.getLayer(firstLayerId)) {
      mapLogger.log(`⏭️ Layers already loaded for project: ${projectName} - skipping`);
      return;
    }

    mapLogger.log(`🚀 Loading ${layers.length} layers from QGIS Server for project: ${projectName}`);

    // Add all layers at once (matches old project pattern)
    const layersAdded = addProjectLayers(map, layers, projectName);

    mapLogger.log(`✅ Successfully loaded ${layersAdded} WMS layers from QGIS Server`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, projectData, projectName]); // FIXED: Removed mapRef from dependencies (causes re-render loops)

  return null; // No UI rendering needed
}
