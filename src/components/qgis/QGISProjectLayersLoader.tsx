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

    // Smart sync: Only remove layers that no longer exist in projectData
    // This prevents unnecessary re-loading of unchanged layers
    const layerIdPattern = `qgis-wms-layer-${projectName}-`;
    const mapLayers = map.getStyle().layers;
    const existingLayerIds = mapLayers?.filter(l => l.id.startsWith(layerIdPattern)).map(l => l.id) || [];

    // Collect all layer names from projectData (recursively, including groups)
    const collectLayerNames = (items: any[]): string[] => {
      const names: string[] = [];
      items.forEach(item => {
        if (item.type === 'VectorLayer' || item.type === 'RasterLayer') {
          names.push(item.name);
        }
        if (item.type === 'group' && item.children) {
          names.push(...collectLayerNames(item.children));
        }
      });
      return names;
    };

    const currentLayerNames = collectLayerNames(layers);
    const expectedLayerIds = currentLayerNames.map(name => `qgis-wms-layer-${projectName}-${name}`);

    // Remove only layers that are NO LONGER in projectData
    const layersToRemove = existingLayerIds.filter(id => !expectedLayerIds.includes(id));

    if (layersToRemove.length > 0) {
      mapLogger.log(`🧹 Removing ${layersToRemove.length} obsolete layers (no longer in project)`);
      layersToRemove.forEach((layerId) => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            mapLogger.log(`  🗑️ Removed obsolete layer: ${layerId}`);
          }
          const sourceId = layerId.replace('qgis-wms-layer-', 'qgis-wms-');
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (err) {
          mapLogger.warn(`  ⚠️ Failed to remove layer ${layerId}:`, err);
        }
      });
    }

    // Add all project layers (addWMSLayer will skip if already exists)
    mapLogger.log(`🔄 Syncing ${layers.length} layers with QGIS Server`);
    const layersAdded = addProjectLayers(map, layers, projectName);

    if (layersAdded > 0) {
      mapLogger.log(`✅ Successfully added ${layersAdded} new WMS layers`);
    } else {
      mapLogger.log(`⏭️ All layers already loaded - no changes needed`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, projectData, projectName]); // FIXED: Removed mapRef from dependencies (causes re-render loops)

  return null; // No UI rendering needed
}
