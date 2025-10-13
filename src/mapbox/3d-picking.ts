/**
 * 3D BUILDING PICKING UTILITIES
 *
 * Provides ray-casting approach for 3D building detection that works correctly
 * with any camera pitch/bearing angle (unlike simple bbox queries).
 *
 * Key features:
 * - Dynamic tolerance based on pitch angle
 * - Distance-based sorting (closest building first)
 * - Supports both click and hover interactions
 * - UNIVERSAL DETECTION: Finds ALL 3D layers, not just '3d-buildings'
 */

import mapboxgl from 'mapbox-gl';
import { detect3DLayers } from './3d-layer-detection';
import { mapLogger } from '@/narzedzia/logger';

/**
 * Query 3D buildings using ray-casting approach
 * Works correctly with any camera pitch/bearing
 *
 * @param map - Mapbox GL map instance
 * @param point - Screen coordinates of click/tap
 * @param tolerance - Pixel tolerance (default: 12px)
 * @returns Array of building features, sorted by distance (closest first)
 */
export const query3DBuildingsAtPoint = (
  map: mapboxgl.Map,
  point: { x: number; y: number },
  tolerance: number = 12
): any[] => {
  try {
    // STEP 1: Automatically detect ALL 3D layers (not just '3d-buildings')
    const layers3D = detect3DLayers(map);

    if (layers3D.length === 0) {
      mapLogger.log('⚠️ No 3D layers found - skipping 3D picking');
      return [];
    }

    mapLogger.log(`🔍 Querying ${layers3D.length} 3D layers:`, layers3D);

    // STEP 2: Dynamic tolerance for high pitch angles
    // When camera is tilted (high pitch), buildings appear smaller on screen
    // Increase tolerance to compensate
    const pitch = map.getPitch();
    const dynamicTolerance = pitch > 45 ? tolerance * 2 : tolerance;

    // STEP 3: Create bbox around click point
    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
      [point.x - dynamicTolerance, point.y - dynamicTolerance],
      [point.x + dynamicTolerance, point.y + dynamicTolerance]
    ];

    // STEP 4: Query ALL 3D layers (universal detection!)
    const features = map.queryRenderedFeatures(bbox, {
      layers: layers3D // ✅ All 3D layers, not just '3d-buildings'!
    });

    if (features.length === 0) {
      mapLogger.log('ℹ️ No 3D features found at point', { point, bbox, layers: layers3D });
      return [];
    }

    // METHOD 2: Sort by distance to click point (closest first)
    // This handles cases where multiple buildings are in the bbox
    const featuresWithDistance = features.map(feature => {
      // Get building center (approximate from polygon coordinates)
      const geometry = feature.geometry as any;
      let center = point;

      if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
        const coords = geometry.coordinates[0];
        // Project all coordinates to screen space
        const projected = coords.map((c: [number, number]) => map.project(c));

        // Calculate centroid in screen space
        const sumX = projected.reduce((sum: number, p: any) => sum + p.x, 0);
        const sumY = projected.reduce((sum: number, p: any) => sum + p.y, 0);
        center = { x: sumX / projected.length, y: sumY / projected.length };
      } else if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]) {
        // For MultiPolygon, use first polygon's centroid
        const firstPolygon = geometry.coordinates[0][0];
        const projected = firstPolygon.map((c: [number, number]) => map.project(c));

        const sumX = projected.reduce((sum: number, p: any) => sum + p.x, 0);
        const sumY = projected.reduce((sum: number, p: any) => sum + p.y, 0);
        center = { x: sumX / projected.length, y: sumY / projected.length };
      }

      // Calculate distance from click to building center
      const dx = center.x - point.x;
      const dy = center.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return { feature, distance };
    });

    // STEP 5: Sort by distance (closest first)
    featuresWithDistance.sort((a, b) => a.distance - b.distance);

    mapLogger.log(`🎯 3D Picking: Found ${features.length} 3D features, closest at ${featuresWithDistance[0].distance.toFixed(1)}px`, {
      pitch,
      tolerance: dynamicTolerance,
      clickPoint: point,
      layers: layers3D,
      closestFeature: {
        layer: featuresWithDistance[0].feature.layer?.id,
        sourceLayer: featuresWithDistance[0].feature.sourceLayer
      }
    });

    return featuresWithDistance.map(f => f.feature);
  } catch (error) {
    mapLogger.error('❌ Error in query3DBuildingsAtPoint:', error);
    return [];
  }
};

/**
 * Query 3D buildings with smaller tolerance for hover detection
 * Used for hover effects to avoid selecting buildings too far from cursor
 *
 * @param map - Mapbox GL map instance
 * @param point - Screen coordinates of mouse/touch position
 * @returns Single closest building feature or null
 */
export const query3DBuildingsForHover = (
  map: mapboxgl.Map,
  point: { x: number; y: number }
): any | null => {
  // Use smaller tolerance for hover (8px instead of 12px)
  const features = query3DBuildingsAtPoint(map, point, 8);
  return features.length > 0 ? features[0] : null;
};

/**
 * Check if 3D buildings layer exists and is visible
 * Useful for determining if 3D picking should be enabled
 *
 * UPDATED: Now uses universal detection to check for ANY 3D layers!
 *
 * @param map - Mapbox GL map instance
 * @returns True if any 3D layers exist
 */
export const has3DBuildingsLayer = (map: mapboxgl.Map): boolean => {
  const layers3D = detect3DLayers(map);
  const hasLayers = layers3D.length > 0;

  mapLogger.log(`🔍 has3DBuildingsLayer: ${hasLayers ? 'YES' : 'NO'} (${layers3D.length} layers)`);
  return hasLayers;
};

/**
 * Get building source ID (composite or mapbox-3d-buildings)
 * Different map styles use different sources for 3D buildings
 *
 * @param map - Mapbox GL map instance
 * @returns Source ID for 3D buildings
 */
export const get3DBuildingsSource = (map: mapboxgl.Map): string => {
  return map.getSource('composite') ? 'composite' : 'mapbox-3d-buildings';
};
