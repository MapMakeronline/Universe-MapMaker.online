/**
 * BUILDINGS STORAGE UTILITIES
 *
 * Handles GeoJSON export, import, and storage for 3D buildings
 * Supports:
 * - Frontend localStorage storage (temporary)
 * - GeoJSON export for backend integration
 * - File download for offline backup
 *
 * Integration Path:
 * Frontend (localStorage) → GeoJSON export → Backend API → PostGIS → QGIS Server
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
 * Convert GeoJSON back to MapFeature array
 * Used for importing previously exported buildings
 *
 * @param geojson - GeoJSON FeatureCollection
 * @returns Array of MapFeature objects
 */
export const importBuildingsFromGeoJSON = (
  geojson: BuildingGeoJSON
): MapFeature[] => {
  return geojson.features.map(feature => {
    // Extract standard properties
    const { name, created_at, updated_at, layer, sourceLayer, ...customProps } = feature.properties;

    // Get coordinates (either from Point geometry or polygon centroid)
    let coordinates: [number, number] = [0, 0];
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
      // Calculate centroid for polygon
      const coords = feature.geometry.coordinates[0];
      const sumLng = coords.reduce((sum: number, c: any) => sum + c[0], 0);
      const sumLat = coords.reduce((sum: number, c: any) => sum + c[1], 0);
      coordinates = [sumLng / coords.length, sumLat / coords.length];
    }

    return {
      id: String(feature.id),
      type: 'building',
      name: name || `Building ${feature.id}`,
      layer: layer || '3d-buildings',
      sourceLayer: sourceLayer || 'building',
      coordinates,
      geometry: feature.geometry,
      attributes: Object.entries(customProps).map(([key, value]) => ({
        key,
        value: String(value)
      })),
      createdAt: created_at,
      updatedAt: updated_at,
      selected: false
    };
  });
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

/**
 * Load buildings from localStorage
 * Returns null if no data exists for project
 *
 * @param projectName - Project identifier
 * @returns Array of MapFeature buildings or null
 */
export const loadBuildingsFromLocalStorage = (
  projectName: string
): MapFeature[] | null => {
  try {
    const key = `buildings_${projectName}`;
    const data = localStorage.getItem(key);

    if (!data) {
      console.log(`ℹ️ No buildings found in localStorage for project: ${projectName}`);
      return null;
    }

    const geojson: BuildingGeoJSON = JSON.parse(data);
    const buildings = importBuildingsFromGeoJSON(geojson);

    console.log(`✅ Loaded ${buildings.length} buildings from localStorage`, {
      key,
      metadata: geojson.metadata
    });

    return buildings;
  } catch (error) {
    console.error('Failed to load buildings from localStorage:', error);
    return null;
  }
};

/**
 * Clear buildings from localStorage for specific project
 *
 * @param projectName - Project identifier
 */
export const clearBuildingsFromLocalStorage = (projectName: string): void => {
  try {
    const key = `buildings_${projectName}`;
    localStorage.removeItem(key);
    console.log(`✅ Cleared buildings from localStorage: ${key}`);
  } catch (error) {
    console.error('Failed to clear buildings from localStorage:', error);
  }
};

/**
 * Download buildings as GeoJSON file
 * Creates a downloadable .geojson file for backup or backend integration
 *
 * @param projectName - Project identifier (used in filename)
 * @param buildings - Array of MapFeature buildings
 */
export const downloadBuildingsGeoJSON = (
  projectName: string,
  buildings: MapFeature[]
): void => {
  try {
    const geojson = exportBuildingsToGeoJSON(buildings, projectName);

    // Create blob with formatted JSON (pretty print)
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json'
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}_buildings_${Date.now()}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Downloaded ${buildings.length} buildings as GeoJSON`, {
      filename: link.download,
      sizeKB: Math.round(blob.size / 1024)
    });
  } catch (error) {
    console.error('Failed to download buildings GeoJSON:', error);
  }
};

/**
 * Get storage statistics for project
 * Useful for UI display and debugging
 *
 * @param projectName - Project identifier
 * @returns Storage stats or null
 */
export const getBuildingsStorageStats = (
  projectName: string
): { count: number; sizeKB: number; lastUpdate: string } | null => {
  try {
    const key = `buildings_${projectName}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    const geojson: BuildingGeoJSON = JSON.parse(data);

    return {
      count: geojson.features.length,
      sizeKB: Math.round(data.length / 1024),
      lastUpdate: geojson.metadata?.exportDate || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
};

/**
 * Upload buildings to backend API (FUTURE IMPLEMENTATION)
 * This is a placeholder for backend integration
 *
 * @param projectName - Project identifier
 * @param buildings - Array of MapFeature buildings
 * @returns Promise with API response
 */
export const uploadBuildingsToBackend = async (
  projectName: string,
  buildings: MapFeature[]
): Promise<{ success: boolean; layerId?: number; message?: string }> => {
  // PLACEHOLDER: This will be implemented when backend endpoint is ready
  const geojson = exportBuildingsToGeoJSON(buildings, projectName);

  console.warn('⚠️ Backend upload not yet implemented. GeoJSON ready for upload:', {
    projectName,
    buildingCount: buildings.length,
    geojson
  });

  // FUTURE IMPLEMENTATION:
  // const response = await fetch('/api/layers/create-from-geojson/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     project: projectName,
  //     layer_name: 'Buildings_3D_Edited',
  //     geojson,
  //     style: {
  //       fillColor: '#ff9800',
  //       strokeColor: '#ffffff',
  //       strokeWidth: 1
  //     }
  //   })
  // });
  //
  // return await response.json();

  return {
    success: false,
    message: 'Backend integration not yet implemented'
  };
};
