'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
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
  const mapRef = useMap();
  const isMapLoaded = useAppSelector(state => state.map.isLoaded);

  // WORKAROUND: Force re-render when mapRef.current changes
  // React doesn't track ref.current changes, so we use a state to trigger re-render
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Update mapInstance state when mapRef.current becomes available
  // This useEffect MUST run after every render to detect when mapRef.current changes
  useEffect(() => {
    console.log('⚙️ Checking for mapRef.current:', layer.name, {
      hasMapRef: !!mapRef.current,
      hasMapInstance: !!mapInstance,
      isMapLoaded
    });

    if (mapRef.current && !mapInstance) {
      console.log('🗺️ Map ref available, updating mapInstance state:', layer.name);
      setMapInstance(mapRef.current);
    }
  }); // NO DEPENDENCIES - run after EVERY render to detect mapRef.current

  // DEBUG: Log layer state
  console.log('🔍 WMSLayerRenderer mount/update:', {
    layerName: layer.name,
    layerId: layer.id,
    visible: layer.visible,
    projectName,
    isMapLoaded,
    hasMapRef: !!mapRef.current,
    hasMapInstance: !!mapInstance
  });

  // Add WMS layer when map becomes available
  useEffect(() => {
    // Wait for mapInstance state to be set (this will trigger re-render!)
    if (!mapInstance) {
      console.log('⏳ WMS waiting for map instance:', layer.name, { isMapLoaded, hasMapInstance: !!mapInstance });
      return;
    }

    if (!layer.visible) {
      console.log('👁️ WMS layer hidden, skipping:', layer.name);
      return;
    }

    if (!projectName) {
      console.warn('⚠️ WMS missing projectName:', layer.name);
      return;
    }

    if (!layer.id) {
      console.warn('⚠️ WMS missing layer.id:', layer.name);
      return;
    }

    const map = mapInstance.getMap();

    console.log('✅ Map ready, adding WMS layer:', layer.name);

    console.log('🗺️ Adding WMS layer:', layer.name, {
      projectName,
      layerId: layer.id,
      opacity: layer.opacity
    });

    const result = addWMSLayer(map, {
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
        removeQGISLayer(map, result.layerId);
        console.log('🗑️ Removed WMS layer:', layer.name);
      }
    };
  }, [mapInstance, projectName, layer.id, layer.visible]); // Depend on mapInstance state!

  // Update visibility
  useEffect(() => {
    if (!mapInstance || !layer.id) return;

    const map = mapInstance.getMap();
    const layerId = `qgis-wms-layer-${projectName}-${layer.id}`;

    if (map.getLayer(layerId)) {
      updateQGISLayerVisibility(map, layerId, layer.visible);
      console.log(`👁️ Updated WMS visibility: ${layer.name} = ${layer.visible}`);
    }
  }, [mapInstance, layer.visible, layer.id, projectName]);

  // Update opacity
  useEffect(() => {
    if (!mapInstance || !layer.id) return;

    const map = mapInstance.getMap();
    const layerId = `qgis-wms-layer-${projectName}-${layer.id}`;

    if (map.getLayer(layerId)) {
      updateQGISLayerOpacity(map, layerId, layer.opacity || 1);
      console.log(`🎨 Updated WMS opacity: ${layer.name} = ${layer.opacity}`);
    }
  }, [mapInstance, layer.opacity, layer.id, projectName]);

  return null; // No UI rendering needed
}
