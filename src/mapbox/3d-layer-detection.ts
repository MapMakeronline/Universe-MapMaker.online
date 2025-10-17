/**
 * UNIVERSAL 3D LAYER DETECTION
 *
 * Automatically detects ALL 3D layers on the map, not just hardcoded '3d-buildings'.
 * Supports:
 * - fill-extrusion (3D buildings with height)
 * - model (custom 3D models - GLB/GLTF)
 *
 * This solves the problem where users have MANY 3D layers with different names,
 * and hardcoded layer detection misses them!
 */

import mapboxgl from 'mapbox-gl';
import { mapLogger } from '@/tools/logger';

/**
 * Detect all 3D layers on the map
 * Returns layer IDs for fill-extrusion and model layers
 *
 * @param map - Mapbox GL map instance
 * @returns Array of 3D layer IDs
 */
export const detect3DLayers = (map: mapboxgl.Map): string[] => {
  const style = map.getStyle();
  if (!style || !style.layers) {
    mapLogger.warn('⚠️ No map style or layers found');
    return [];
  }

  const layers3D = style.layers.filter((layer: any) => {
    // Fill-extrusion: 3D buildings with height
    if (layer.type === 'fill-extrusion') return true;

    // Model: Custom 3D models (GLB/GLTF)
    if (layer.type === 'model') return true;

    return false;
  });

  const layerIds = layers3D.map((layer: any) => layer.id);

  if (layerIds.length > 0) {
    mapLogger.log(`🔍 Detected ${layerIds.length} 3D layers:`, layerIds);
  } else {
    mapLogger.log('ℹ️ No 3D layers detected on map');
  }

  return layerIds;
};

/**
 * Get all fill-extrusion layers (buildings)
 *
 * @param map - Mapbox GL map instance
 * @returns Array of fill-extrusion layer IDs
 */
export const getExtrusionLayers = (map: mapboxgl.Map): string[] => {
  const style = map.getStyle();
  if (!style || !style.layers) return [];

  const extrusionLayers = style.layers
    .filter((layer: any) => layer.type === 'fill-extrusion')
    .map((layer: any) => layer.id);

  mapLogger.log(`🏢 Found ${extrusionLayers.length} fill-extrusion layers:`, extrusionLayers);
  return extrusionLayers;
};

/**
 * Get all model layers (custom 3D objects)
 *
 * @param map - Mapbox GL map instance
 * @returns Array of model layer IDs
 */
export const getModelLayers = (map: mapboxgl.Map): string[] => {
  const style = map.getStyle();
  if (!style || !style.layers) return [];

  const modelLayers = style.layers
    .filter((layer: any) => layer.type === 'model')
    .map((layer: any) => layer.id);

  mapLogger.log(`🎨 Found ${modelLayers.length} model layers:`, modelLayers);
  return modelLayers;
};

/**
 * Get 3D layer statistics
 * Useful for debugging and analytics
 *
 * @param map - Mapbox GL map instance
 * @returns Statistics object
 */
export const get3DLayerStats = (map: mapboxgl.Map) => {
  const extrusionLayers = getExtrusionLayers(map);
  const modelLayers = getModelLayers(map);
  const total3DLayers = detect3DLayers(map);

  const stats = {
    totalLayers: total3DLayers.length,
    extrusionLayers: extrusionLayers.length,
    modelLayers: modelLayers.length,
    layers: {
      extrusion: extrusionLayers,
      model: modelLayers,
      all: total3DLayers
    }
  };

  mapLogger.log('📊 3D Layer Statistics:', stats);
  return stats;
};

/**
 * Check if map has any 3D layers
 * Quick utility to determine if 3D picking should be enabled
 *
 * @param map - Mapbox GL map instance
 * @returns True if map has at least one 3D layer
 */
export const has3DLayers = (map: mapboxgl.Map): boolean => {
  const layers = detect3DLayers(map);
  const hasLayers = layers.length > 0;

  mapLogger.log(`🔍 Map has 3D layers: ${hasLayers ? 'YES' : 'NO'} (${layers.length} layers)`);
  return hasLayers;
};
