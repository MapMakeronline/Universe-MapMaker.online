/**
 * Camera Utilities for Trail Animation
 *
 * Google Maps Navigation style camera positioning:
 * - Camera sits BEHIND marker (not ahead)
 * - Camera looks in direction of travel (bearing)
 * - Fixed navigation zoom (17.5) and pitch (50°)
 *
 * @see src/features/trails/hooks/useTrailAnimationWithMarker.ts
 */

import * as turf from '@turf/turf';

/**
 * Calculate camera center point positioned BEHIND marker
 *
 * Google Maps Navigation pattern:
 * - Marker travels along trail
 * - Camera sits 80m BEHIND marker
 * - Camera looks FORWARD in direction of travel
 * - Result: Marker visible in front, road ahead visible
 *
 * Geometry:
 * - Marker bearing = direction of travel (e.g., 0° = north)
 * - Camera bearing = bearing + 180° (opposite direction)
 * - Camera looks at marker using original bearing
 *
 * @param markerPoint - Current marker position [lng, lat]
 * @param bearing - Direction of movement in degrees (0-360)
 * @param offsetMeters - Distance camera sits behind marker (default: 80m)
 * @returns Camera center point [lng, lat] positioned behind marker
 *
 * @example
 * // Marker at Warsaw, traveling north (0°)
 * const markerPos = [21.0122, 52.2297];
 * const bearing = 0; // North
 * const cameraPos = getCameraCenterBehindMarker(markerPos, bearing, 80);
 * // cameraPos ≈ [21.0122, 52.2290] (80m south of marker)
 *
 * // Mapbox camera configuration:
 * map.jumpTo({
 *   center: cameraPos,      // 80m behind marker
 *   bearing: bearing,       // Look north (same as marker direction)
 *   pitch: 50,              // Perspective view
 *   zoom: 17.5,             // Navigation zoom
 * });
 * // Result: Marker visible in front, camera looking forward
 */
export function getCameraCenterBehindMarker(
  markerPoint: [number, number],
  bearing: number,
  offsetMeters: number = 80
): [number, number] {
  const point = turf.point(markerPoint);

  // CRITICAL: Camera BEHIND marker (not ahead!)
  // bearing + 180° = opposite direction (camera moves away from marker)
  // Example: Marker goes north (0°) → Camera goes south (180°)
  const cameraBearing = (bearing + 180) % 360;

  // Calculate camera position using turf.destination
  // (point, distance_km, bearing, units)
  const cameraPoint = turf.destination(
    point,
    offsetMeters / 1000, // Convert meters to kilometers
    cameraBearing,
    'kilometers'
  );

  return cameraPoint.geometry.coordinates as [number, number];
}
