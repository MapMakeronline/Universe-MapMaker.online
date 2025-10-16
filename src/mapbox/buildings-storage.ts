/**
 * BUILDINGS STORAGE UTILITIES
 *
 * Handles localStorage storage for 3D buildings (auto-save/recovery)
 *
 * REFACTORED: Removed unused functions (YAGNI principle)
 * - Kept only saveBuildingsToLocalStorage (actually used)
 * - Removed: load, clear, download, upload, stats (dead code)
 */

import type { MapFeature } from '@/redux/slices/featuresSlice';

/**
 * GeoJSON FeatureCollection structure for buildings
 */
export interface BuildingGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: string;
    geometry: {
      type: 'Point' | 'Polygon' | 'MultiPolygon';
      coordinates: any;
    };
    properties: {
      name: string;
      height?: number;
      min_height?: number;
      building?: string;
      created_at?: string;
      updated_at?: string;
      // Custom attributes from user
      [key: string]: any;
    };
  }>;
  metadata?: {
    projectName: string;
    exportDate: string;
    buildingCount: number;
  };
}

/**
 * Convert Redux features to GeoJSON FeatureCollection
 * Only exports features of type 'building'
 *
 * @param buildings - Array of MapFeature objects (buildings only)
 * @param projectName - Optional project name for metadata
 * @returns GeoJSON FeatureCollection
 */
export const exportBuildingsToGeoJSON = (
  buildings: MapFeature[],
  projectName?: string
): BuildingGeoJSON => {
  const buildingFeatures = buildings.filter(b => b.type === 'building');

  return {
    type: 'FeatureCollection',
    features: buildingFeatures.map(building => ({
      type: 'Feature',
      id: building.id,
      geometry: building.geometry || {
        type: 'Point',
        coordinates: building.coordinates
      },
      properties: {
        name: building.name,
        // Convert attributes array to flat object
        ...building.attributes?.reduce((acc, attr) => ({
          ...acc,
          [attr.key]: attr.value
        }), {}),
        // Add metadata
        created_at: building.createdAt,
        updated_at: building.updatedAt,
        // Add layer info
        layer: building.layer,
        sourceLayer: building.sourceLayer
      }
    })),
    metadata: projectName ? {
      projectName,
      exportDate: new Date().toISOString(),
      buildingCount: buildingFeatures.length
    } : undefined
  };
};

/**
 * Save buildings to localStorage (temporary frontend storage)
 * Useful for auto-save and recovery after page refresh
 *
 * @param projectName - Project identifier
 * @param buildings - Array of MapFeature buildings
 */
export const saveBuildingsToLocalStorage = (
  projectName: string,
  buildings: MapFeature[]
): void => {
  try {
    const geojson = exportBuildingsToGeoJSON(buildings, projectName);
    const key = `buildings_${projectName}`;
    localStorage.setItem(key, JSON.stringify(geojson));

    console.log(`✅ Saved ${buildings.length} buildings to localStorage`, {
      key,
      sizeKB: Math.round(JSON.stringify(geojson).length / 1024)
    });
  } catch (error) {
    console.error('Failed to save buildings to localStorage:', error);
  }
};
