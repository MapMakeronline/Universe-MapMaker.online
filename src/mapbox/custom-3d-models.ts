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
import { mapLogger } from '@/narzedzia/logger';

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
 * Add a custom 3D model to the map (GLB/GLTF)
 *
 * @param map - Mapbox GL map instance
 * @param model - Model configuration
 * @returns True if model added successfully
 */
export const addCustom3DModel = (
  map: mapboxgl.Map,
  model: Custom3DModel
): boolean => {
  try {
    const sourceId = `model-source-${model.id}`;
    const layerId = `model-layer-${model.id}`;

    // Check if source already exists
    if (map.getSource(sourceId)) {
      mapLogger.warn(`⚠️ Model source already exists: ${model.id}`);
      return false;
    }

    // Add GeoJSON source for model position
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: model.position
          },
          properties: {
            name: model.name,
            modelId: model.id
          }
        }]
      }
    });

    // Add model layer (requires Mapbox GL JS v3.0+)
    map.addLayer({
      id: layerId,
      type: 'model',
      source: sourceId,
      layout: {
        'model-id': model.modelUrl // GLB/GLTF URL
      },
      paint: {
        'model-scale': model.scale,
        'model-rotation': model.rotation,
        'model-opacity': model.opacity || 1.0
      }
    } as any);

    mapLogger.log(`✅ Added custom 3D model: ${model.name} (${model.id})`, {
      url: model.modelUrl,
      position: model.position,
      scale: model.scale,
      rotation: model.rotation
    });

    return true;
  } catch (e) {
    mapLogger.error(`❌ Failed to add 3D model: ${model.id}`, e);
    return false;
  }
};

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
 * Update custom 3D model properties
 *
 * @param map - Mapbox GL map instance
 * @param modelId - Model ID to update
 * @param updates - Properties to update (scale, rotation, position, opacity)
 * @returns True if model updated successfully
 */
export const updateCustom3DModel = (
  map: mapboxgl.Map,
  modelId: string,
  updates: Partial<Pick<Custom3DModel, 'scale' | 'rotation' | 'position' | 'opacity'>>
): boolean => {
  try {
    const layerId = `model-layer-${modelId}`;

    if (!map.getLayer(layerId)) {
      mapLogger.error(`⚠️ Model layer not found: ${modelId}`);
      return false;
    }

    // Update paint properties
    if (updates.scale) {
      map.setPaintProperty(layerId, 'model-scale', updates.scale);
      mapLogger.log(`Updated scale for ${modelId}:`, updates.scale);
    }

    if (updates.rotation) {
      map.setPaintProperty(layerId, 'model-rotation', updates.rotation);
      mapLogger.log(`Updated rotation for ${modelId}:`, updates.rotation);
    }

    if (updates.opacity !== undefined) {
      map.setPaintProperty(layerId, 'model-opacity', updates.opacity);
      mapLogger.log(`Updated opacity for ${modelId}:`, updates.opacity);
    }

    if (updates.position) {
      // Update source data (move model to new position)
      const sourceId = `model-source-${modelId}`;
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: updates.position
            },
            properties: { modelId }
          }]
        });
        mapLogger.log(`Updated position for ${modelId}:`, updates.position);
      }
    }

    mapLogger.log(`✅ Updated 3D model: ${modelId}`);
    return true;
  } catch (e) {
    mapLogger.error(`❌ Failed to update 3D model: ${modelId}`, e);
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

/**
 * Get custom 3D model info
 *
 * @param map - Mapbox GL map instance
 * @param modelId - Model ID
 * @returns Model configuration or null if not found
 */
export const getCustom3DModelInfo = (
  map: mapboxgl.Map,
  modelId: string
): Partial<Custom3DModel> | null => {
  try {
    const layerId = `model-layer-${modelId}`;
    const sourceId = `model-source-${modelId}`;

    const layer = map.getLayer(layerId);
    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

    if (!layer || !source) {
      mapLogger.warn(`⚠️ Model not found: ${modelId}`);
      return null;
    }

    const layerAny = layer as any;
    const sourceData = (source as any)._data;

    const info: Partial<Custom3DModel> = {
      id: modelId,
      modelUrl: layerAny.layout?.['model-id'],
      scale: map.getPaintProperty(layerId, 'model-scale'),
      rotation: map.getPaintProperty(layerId, 'model-rotation'),
      opacity: map.getPaintProperty(layerId, 'model-opacity'),
      position: sourceData?.features?.[0]?.geometry?.coordinates
    };

    mapLogger.log(`📊 Model info for ${modelId}:`, info);
    return info;
  } catch (e) {
    mapLogger.error(`❌ Failed to get model info: ${modelId}`, e);
    return null;
  }
};

/**
 * Check if custom 3D model exists on map
 *
 * @param map - Mapbox GL map instance
 * @param modelId - Model ID to check
 * @returns True if model exists
 */
export const hasCustom3DModel = (map: mapboxgl.Map, modelId: string): boolean => {
  const layerId = `model-layer-${modelId}`;
  const exists = map.getLayer(layerId) !== undefined;

  mapLogger.log(`🔍 Model ${modelId} exists: ${exists ? 'YES' : 'NO'}`);
  return exists;
};

/**
 * Batch add multiple custom 3D models
 *
 * @param map - Mapbox GL map instance
 * @param models - Array of model configurations
 * @returns Number of models added successfully
 */
export const addMultipleCustom3DModels = (
  map: mapboxgl.Map,
  models: Custom3DModel[]
): number => {
  let successCount = 0;

  for (const model of models) {
    if (addCustom3DModel(map, model)) {
      successCount++;
    }
  }

  mapLogger.log(`✅ Added ${successCount}/${models.length} custom 3D models`);
  return successCount;
};

/**
 * Remove all custom 3D models from map
 *
 * @param map - Mapbox GL map instance
 * @returns Number of models removed
 */
export const removeAllCustom3DModels = (map: mapboxgl.Map): number => {
  const modelIds = listCustom3DModels(map);
  let removedCount = 0;

  for (const modelId of modelIds) {
    if (removeCustom3DModel(map, modelId)) {
      removedCount++;
    }
  }

  mapLogger.log(`✅ Removed ${removedCount} custom 3D models`);
  return removedCount;
};
