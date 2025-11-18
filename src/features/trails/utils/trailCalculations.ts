/**
 * Trail Calculations - Geographic calculations for trails (Frontend only)
 *
 * Uses @turf/turf for accurate geographic calculations:
 * - Distance (meters/kilometers)
 * - Duration (estimated walking time)
 * - Bearing (direction between points)
 * - Interpolation (smooth animation points)
 *
 * All calculations run in browser
 */

import * as turf from '@turf/turf';
import type { TrailFeature } from '../types';

/**
 * Calculate total distance of trail in meters
 *
 * @param trail - TrailFeature to measure
 * @returns Distance in meters
 */
export function calculateDistance(trail: TrailFeature): number {
  try {
    const line = turf.lineString(trail.geometry.coordinates);
    const lengthKm = turf.length(line, { units: 'kilometers' });
    return lengthKm * 1000; // Convert to meters
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
}

/**
 * Calculate estimated walking duration in minutes
 *
 * Uses Naismith's rule for hiking:
 * - 5 km/h on flat terrain (3 mph)
 * - Add time for elevation gain (future enhancement)
 *
 * @param distanceMeters - Distance in meters
 * @param elevationGain - Optional elevation gain in meters
 * @returns Duration in minutes
 */
export function calculateDuration(
  distanceMeters: number,
  elevationGain?: number
): number {
  const baseSpeedKmH = 5; // Average walking speed
  const baseTimeMinutes = (distanceMeters / 1000 / baseSpeedKmH) * 60;

  // Naismith's rule: add 1 minute per 10m elevation gain
  const elevationTimeMinutes = elevationGain ? elevationGain / 10 : 0;

  return Math.round(baseTimeMinutes + elevationTimeMinutes);
}

/**
 * Calculate bearing (direction) between two points
 *
 * @param from - Starting point [lng, lat]
 * @param to - Ending point [lng, lat]
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  from: [number, number],
  to: [number, number]
): number {
  try {
    const bearing = turf.bearing(from, to);
    // Normalize to 0-360 range
    return bearing < 0 ? bearing + 360 : bearing;
  } catch (error) {
    console.error('Error calculating bearing:', error);
    return 0;
  }
}

/**
 * Interpolate points along trail for smooth animation
 *
 * Creates evenly spaced points along the trail line
 * Useful for smooth camera animation (FAZA 3)
 *
 * @param trail - TrailFeature to interpolate
 * @param steps - Number of points to generate (default: 100)
 * @returns Array of interpolated points [lng, lat]
 */
export function interpolatePoints(
  trail: TrailFeature,
  steps: number = 100
): [number, number][] {
  try {
    const line = turf.lineString(trail.geometry.coordinates);
    const length = turf.length(line, { units: 'kilometers' });
    const points: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
      const distance = (i / steps) * length;
      const point = turf.along(line, distance, { units: 'kilometers' });
      points.push(point.geometry.coordinates as [number, number]);
    }

    return points;
  } catch (error) {
    console.error('Error interpolating points:', error);
    return trail.geometry.coordinates;
  }
}

/**
 * Get point along trail at specific distance from start
 *
 * @param trail - TrailFeature
 * @param distanceMeters - Distance from start in meters
 * @returns Point coordinates [lng, lat] or null if distance exceeds trail length
 */
export function getPointAtDistance(
  trail: TrailFeature,
  distanceMeters: number
): [number, number] | null {
  try {
    const line = turf.lineString(trail.geometry.coordinates);
    const distanceKm = distanceMeters / 1000;
    const totalLength = turf.length(line, { units: 'kilometers' });

    if (distanceKm > totalLength) {
      return null;
    }

    const point = turf.along(line, distanceKm, { units: 'kilometers' });
    return point.geometry.coordinates as [number, number];
  } catch (error) {
    console.error('Error getting point at distance:', error);
    return null;
  }
}

/**
 * Calculate bounding box for trail (for map.fitBounds)
 *
 * @param trail - TrailFeature
 * @returns Bounding box [[minLng, minLat], [maxLng, maxLat]]
 */
export function calculateBounds(
  trail: TrailFeature
): [[number, number], [number, number]] {
  try {
    const line = turf.lineString(trail.geometry.coordinates);
    const bbox = turf.bbox(line);
    // bbox format: [minLng, minLat, maxLng, maxLat]
    return [
      [bbox[0], bbox[1]], // southwest corner
      [bbox[2], bbox[3]], // northeast corner
    ];
  } catch (error) {
    console.error('Error calculating bounds:', error);
    // Fallback: use first and last point
    const coords = trail.geometry.coordinates;
    const first = coords[0];
    const last = coords[coords.length - 1];
    return [
      [Math.min(first[0], last[0]), Math.min(first[1], last[1])],
      [Math.max(first[0], last[0]), Math.max(first[1], last[1])],
    ];
  }
}

/**
 * Simplify trail geometry (reduce number of points)
 *
 * Uses Douglas-Peucker algorithm
 * Useful for large GPS tracks with many points
 *
 * @param trail - TrailFeature to simplify
 * @param tolerance - Simplification tolerance in kilometers (default: 0.001 = 1 meter)
 * @returns Simplified TrailFeature
 */
export function simplifyTrail(
  trail: TrailFeature,
  tolerance: number = 0.001
): TrailFeature {
  try {
    const line = turf.lineString(trail.geometry.coordinates);
    const simplified = turf.simplify(line, { tolerance, highQuality: true });

    return {
      ...trail,
      geometry: {
        type: 'LineString',
        coordinates: simplified.geometry.coordinates as [number, number][],
      },
    };
  } catch (error) {
    console.error('Error simplifying trail:', error);
    return trail;
  }
}

/**
 * Calculate statistics for trail
 *
 * @param trail - TrailFeature
 * @returns Trail statistics (distance, duration, point count, bounds)
 */
export function calculateTrailStats(trail: TrailFeature): {
  distance: number; // meters
  distanceKm: number;
  duration: number; // minutes
  durationHours: number;
  pointCount: number;
  bounds: [[number, number], [number, number]];
  startPoint: [number, number];
  endPoint: [number, number];
} {
  const distance = calculateDistance(trail);
  const duration = calculateDuration(distance, trail.properties.elevationGain);
  const coords = trail.geometry.coordinates;

  return {
    distance,
    distanceKm: parseFloat((distance / 1000).toFixed(2)),
    duration,
    durationHours: parseFloat((duration / 60).toFixed(1)),
    pointCount: coords.length,
    bounds: calculateBounds(trail),
    startPoint: coords[0],
    endPoint: coords[coords.length - 1],
  };
}

/**
 * Format distance for display
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "5.2 km" or "850 m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30min" or "45min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
