/**
 * CUSTOM 3D MODELS UTILITY
 *
 * Adds support for custom 3D models (GLB/GLTF) on the map.
 * Models are added as Mapbox 'model' layers with full transformation support.
 *
 * Use cases:
 * - Add custom buildings/landmarks (3D models)
 * - Place architectural visualizations on map
 * - Import external 3D assets (GLB/GLTF format)
 * - Control model scale, rotation, and position
 *
 * Note: Requires Mapbox GL JS v3.0+ for model layer support
 */

import mapboxgl from 'mapbox-gl';
import { mapLogger } from '@/tools/logger';

/**
 * Custom 3D Model configuration
 */
export interface Custom3DModel {
  id: string; // Unique identifier
  name: string; // Display name
  modelUrl: string; // GLB or GLTF file URL
  position: [number, number]; // [longitude, latitude]
  scale: [number, number, number]; // [x, y, z] scale factors
  rotation: [number, number, number]; // [x, y, z] rotation in degrees
  opacity?: number; // Optional opacity (0-1, default: 1)
}

/**
 * Remove custom 3D model from map
 *
 * @param map - Mapbox GL map instance
 * @param modelId - Model ID to remove
 * @returns True if model removed successfully
 */
export const removeCustom3DModel = (map: mapboxgl.Map, modelId: string): boolean => {
  try {
    const layerId = `model-layer-${modelId}`;
    const sourceId = `model-source-${modelId}`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    mapLogger.log(`✅ Removed custom 3D model: ${modelId}`);
    return true;
  } catch (e) {
    mapLogger.error(`❌ Failed to remove 3D model: ${modelId}`, e);
    return false;
  }
};

/**
 * List all custom 3D models on the map
 *
 * @param map - Mapbox GL map instance
 * @returns Array of model IDs
 */
export const listCustom3DModels = (map: mapboxgl.Map): string[] => {
  const style = map.getStyle();
  if (!style || !style.layers) return [];

  const modelLayers = style.layers
    .filter((layer: any) => layer.type === 'model' && layer.id.startsWith('model-layer-'))
    .map((layer: any) => layer.id.replace('model-layer-', ''));

  mapLogger.log(`📋 Found ${modelLayers.length} custom 3D models:`, modelLayers);
  return modelLayers;
};
