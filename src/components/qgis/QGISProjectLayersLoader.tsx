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
      mapLogger.log('⏸️ QGISProjectLayersLoader: Waiting for map to load...');
      return;
    }

    const map = mapRef.current.getMap();
    const layers = projectData.children || [];

    if (layers.length === 0) {
      mapLogger.log('⚠️ No layers found in projectData');
      return;
    }

    mapLogger.log(`🔄 QGISProjectLayersLoader triggered (mapStyle: ${mapStyle})`);

    // Helper to add layers after style loads
    const addLayersWhenReady = () => {
      mapLogger.log('✅ Map style loaded, adding QGIS layers...');

      // Remove all existing QGIS layers first (clean slate)
      const layerIdPattern = `qgis-wms-layer-${projectName}-`;
      const mapLayers = map.getStyle().layers;
      const existingLayerIds = mapLayers?.filter(l => l.id.startsWith(layerIdPattern)).map(l => l.id) || [];

      if (existingLayerIds.length > 0) {
        mapLogger.log(`🧹 Removing ${existingLayerIds.length} existing QGIS layers before re-adding...`);
        existingLayerIds.forEach((layerId) => {
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
      }

      // Add all project layers (fresh)
      mapLogger.log(`➕ Adding ${layers.length} project layers...`);
      const layersAdded = addProjectLayers(map, layers, projectName);

      if (layersAdded > 0) {
        mapLogger.log(`✅ Successfully added ${layersAdded} WMS layers from QGIS Server`);
      } else {
        mapLogger.log(`⚠️ No layers were added (this may indicate an issue)`);
      }

      // CRITICAL FIX: Re-add layers after 3D features rebuild the style
      // When Buildings3D applies 3D features, Mapbox rebuilds the style from scratch,
      // which removes our QGIS layers. We need to wait for that rebuild to complete
      // and then re-add our layers.
      const reAddLayersAfter3D = () => {
        if (!map.isStyleLoaded()) {
          mapLogger.log('⏳ Waiting for 3D features to finish applying...');
          map.once('idle', reAddLayersAfter3D);
          return;
        }

        // Check if QGIS layers still exist after 3D rebuild
        const currentLayers = map.getStyle().layers;
        const qgisLayersExist = currentLayers?.some(l => l.id.startsWith(layerIdPattern));

        if (!qgisLayersExist) {
          mapLogger.log('🔄 Re-adding QGIS layers after 3D features rebuild...');
          const reAddedCount = addProjectLayers(map, layers, projectName);
          if (reAddedCount > 0) {
            mapLogger.log(`✅ Re-added ${reAddedCount} QGIS layers after 3D rebuild`);
          }
        } else {
          mapLogger.log('✅ QGIS layers survived 3D rebuild, no re-add needed');
        }
      };

      // Wait 500ms for 3D features to potentially trigger style rebuild
      setTimeout(() => {
        reAddLayersAfter3D();
      }, 500);
    };

    // CRITICAL: Wait for map style to load before adding WMS layers
    if (!map.isStyleLoaded()) {
      mapLogger.log('⏳ Waiting for map style to load...');
      const onMapIdle = () => {
        if (map.isStyleLoaded()) {
          addLayersWhenReady();
        } else {
          map.once('idle', onMapIdle); // Retry
        }
      };
      map.once('idle', onMapIdle);
      return;
    }

    // Style already loaded - add layers immediately
    addLayersWhenReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, projectData, projectName, mapStyle]); // ADDED mapStyle to reload layers when basemap changes

  return null; // No UI rendering needed
}
