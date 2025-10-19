'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
import { updateQGISLayerVisibility } from '@/mapbox/qgis-layers';
import { mapLogger } from '@/tools/logger';
import type { LayerNode } from '@/types-app/layers';

interface LayerVisibilitySyncProps {
  projectName: string;
}

/**
 * Layer Visibility Synchronization Component
 *
 * Syncs Redux layer visibility state with Mapbox GL layers.
 *
 * Flow:
 * 1. User clicks eye icon in LeftPanel
 * 2. Redux layersSlice updates layer.visible
 * 3. This component detects change
 * 4. Updates Mapbox layer visibility via updateQGISLayerVisibility()
 *
 * IMPORTANT: This bridges Redux (UI state) and Mapbox (map rendering)
 */
export function LayerVisibilitySync({ projectName }: LayerVisibilitySyncProps) {
  const mapRef = useMap();
  const layers = useAppSelector((state) => state.layers.layers);
  const isMapLoaded = useAppSelector((state) => state.map.isLoaded);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !projectName) {
      return;
    }

    const map = mapRef.current.getMap();

    // Flatten layer tree to get all layers
    const flattenLayers = (layerNodes: LayerNode[]): LayerNode[] => {
      return layerNodes.reduce<LayerNode[]>((acc, layer) => {
        if (layer.type === 'group' && layer.children) {
          return [...acc, ...flattenLayers(layer.children)];
        }
        return [...acc, layer];
      }, []);
    };

    const allLayers = flattenLayers(layers);

    // Update visibility for each layer
    allLayers.forEach((layer) => {
      // Skip groups
      if (layer.type === 'group') return;

      // Construct layer ID (must match addWMSLayer format)
      const layerId = `qgis-wms-layer-${projectName}-${layer.name}`;

      // Check if layer exists on map
      if (map.getLayer(layerId)) {
        updateQGISLayerVisibility(map, layerId, layer.visible);
        mapLogger.log(`👁️ Synced visibility: ${layer.name} = ${layer.visible}`);
      } else {
        // Layer not on map yet (might be loading)
        mapLogger.log(`⏳ Layer not found on map: ${layerId}`);
      }
    });
  }, [mapRef, isMapLoaded, projectName, layers]); // Re-run when layers state changes

  return null; // No UI rendering
}
