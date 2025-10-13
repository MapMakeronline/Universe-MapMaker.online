'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import type { LayerNode } from '@/typy/layers';
import { addWMSLayer, removeQGISLayer, updateQGISLayerVisibility, updateQGISLayerOpacity } from '@/mapbox/qgis-layers';

interface WMSLayerRendererProps {
  projectName: string;
  layer: LayerNode;
}

/**
 * WMS Layer Renderer - renders QGIS layers via WMS as raster tiles on Mapbox
 *
 * Uses QGIS Server WMS (Web Map Service) to fetch raster tiles:
 * 1. Requests tiles via WMS GetMap request
 * 2. QGIS Server renders layer with original QGIS styles
 * 3. Returns PNG tiles (256x256px)
 * 4. Mapbox displays tiles as raster layer
 *
 * Advantages:
 * ✅ Preserves original QGIS styles (colors, symbols, labels)
 * ✅ Handles large datasets efficiently
 * ✅ Supports all QGIS renderer types (categorized, graduated, rule-based)
 * ✅ Server-side rendering (fast)
 *
 * Disadvantages:
 * ⚠️ Not interactive (cannot click features)
 * ⚠️ Raster tiles (no smooth zoom)
 * ⚠️ Cannot modify style on client
 */
export function WMSLayerRenderer({ projectName, layer }: WMSLayerRendererProps) {
  const { current: map } = useMap();

  // Add WMS layer on mount
  useEffect(() => {
    if (!map || !layer.visible || !projectName || !layer.id) return;

    const mapInstance = map.getMap();

    console.log('🗺️ Adding WMS layer:', layer.name, {
      projectName,
      layerId: layer.id,
      opacity: layer.opacity
    });

    const result = addWMSLayer(mapInstance, {
      layerName: layer.id,
      projectName,
      opacity: layer.opacity || 1,
      visible: layer.visible,
      minZoom: 0,
      maxZoom: 22,
      crs: 'EPSG:3857'
    });

    if (result) {
      console.log('✅ WMS layer added:', result.layerId);
    }

    // Cleanup on unmount
    return () => {
      if (result) {
        removeQGISLayer(mapInstance, result.layerId);
        console.log('🗑️ Removed WMS layer:', layer.name);
      }
    };
  }, [map, projectName, layer.id]); // Don't include layer.visible here to avoid recreation

  // Update visibility
  useEffect(() => {
    if (!map || !layer.id) return;

    const mapInstance = map.getMap();
    const layerId = `qgis-wms-layer-${projectName}-${layer.id}`;

    if (mapInstance.getLayer(layerId)) {
      updateQGISLayerVisibility(mapInstance, layerId, layer.visible);
      console.log(`👁️ Updated WMS visibility: ${layer.name} = ${layer.visible}`);
    }
  }, [map, layer.visible, layer.id, projectName]);

  // Update opacity
  useEffect(() => {
    if (!map || !layer.id) return;

    const mapInstance = map.getMap();
    const layerId = `qgis-wms-layer-${projectName}-${layer.id}`;

    if (mapInstance.getLayer(layerId)) {
      updateQGISLayerOpacity(mapInstance, layerId, layer.opacity || 1);
      console.log(`🎨 Updated WMS opacity: ${layer.name} = ${layer.opacity}`);
    }
  }, [map, layer.opacity, layer.id, projectName]);

  return null; // No UI rendering needed
}
