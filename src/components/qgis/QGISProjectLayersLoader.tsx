'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
import { addProjectLayers, removeQGISLayer, getQGISLayers } from '@/mapbox/qgis-layers';
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
  // Subscribe to mapStyle changes to reload layers when basemap changes
  const mapStyle = useAppSelector((state) => state.map.mapStyle);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !projectData || !projectName) {
      return;
    }

    const map = mapRef.current.getMap();
    const layers = projectData.children || [];

    if (layers.length === 0) {
      return;
    }

    // CRITICAL: Wait for map style to load before adding WMS layers
    // Use 'idle' event instead of 'style.load' because style.load may have already fired
    if (!map.isStyleLoaded()) {
      const onMapIdle = () => {
        if (map.isStyleLoaded()) {
          const layersAdded = addProjectLayers(map, layers, projectName);
          if (layersAdded > 0) {
            mapLogger.log(`✅ Loaded ${layersAdded} WMS layers from QGIS Server`);
          }
        } else {
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
      layersToRemove.forEach((layerId) => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          const sourceId = layerId.replace('qgis-wms-layer-', 'qgis-wms-');
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (err) {
          // Silent fail
        }
      });
      mapLogger.log(`🧹 Removed ${layersToRemove.length} obsolete layers`);
    }

    // Add all project layers (addWMSLayer will skip if already exists)
    const layersAdded = addProjectLayers(map, layers, projectName);

    if (layersAdded > 0) {
      mapLogger.log(`✅ Added ${layersAdded} new WMS layers`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, projectData, projectName, mapStyle]); // ADDED mapStyle to reload layers when basemap changes

  return null; // No UI rendering needed
}
