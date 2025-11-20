/**
 * useTrailProgress - Calculate real-time position on trail
 *
 * FAZA 3.3: Geographic calculations using turf.js
 *
 * Features:
 * - Calculate total trail distance (meters)
 * - Get current position based on progress (0-1)
 * - Calculate bearing (direction) for camera
 * - Calculate remaining distance
 *
 * Uses @turf/turf for geographic calculations
 */

import { useMemo } from 'react';
import * as turf from '@turf/turf';
import type { TrailFeature } from '../types';

interface TrailProgressData {
  totalDistance: number;        // Total trail length (meters)
  currentDistance: number;       // Distance from start (meters)
  currentPoint: [number, number] | null;  // Current position [lng, lat]
  currentBearing: number;        // Camera direction (degrees 0-360)
  remainingDistance: number;     // Distance to end (meters)
}

/**
 * useTrailProgress Hook
 *
 * Calculates real-time trail position and bearing
 *
 * @param trail - TrailFeature (LineString GeoJSON)
 * @param progress - Progress along trail (0-1, where 0 = start, 1 = end)
 *
 * @returns TrailProgressData with calculated values
 *
 * @example
 * const { currentPoint, currentBearing, totalDistance } = useTrailProgress(trail, 0.5);
 * // currentPoint: position at 50% of trail
 * // currentBearing: direction at that point
 */
export function useTrailProgress(
  trail: TrailFeature,
  progress: number // 0-1
): TrailProgressData {
  return useMemo(() => {
    try {
      // 1. Calculate total distance (meters)
      const totalDistance = turf.length(trail, { units: 'meters' });

      // Guard: Handle empty or invalid trail
      if (totalDistance === 0) {
        console.warn('⚠️ useTrailProgress: Trail has zero length');
        return {
          totalDistance: 0,
          currentDistance: 0,
          currentPoint: null,
          currentBearing: 0,
          remainingDistance: 0,
        };
      }

      // 2. Calculate current distance from start (meters)
      const currentDistance = Math.min(progress * totalDistance, totalDistance);

      // 3. Get current point on trail using turf.along
      const currentPointFeature = turf.along(trail, currentDistance / 1000, {
        units: 'kilometers',
      });
      const currentPoint = currentPointFeature.geometry.coordinates as [number, number];

      // 4. Calculate bearing (direction for camera)
      // Look ahead 10m (or to end of trail if closer) for smooth bearing
      const lookAheadDistance = Math.min(currentDistance + 10, totalDistance);
      const nextPointFeature = turf.along(trail, lookAheadDistance / 1000, {
        units: 'kilometers',
      });

      const bearing = turf.bearing(
        currentPointFeature.geometry.coordinates,
        nextPointFeature.geometry.coordinates
      );

      // Convert bearing to 0-360 range (turf.bearing returns -180 to 180)
      const currentBearing = bearing < 0 ? bearing + 360 : bearing;

      // 5. Calculate remaining distance (meters)
      const remainingDistance = totalDistance - currentDistance;

      console.log('📍 useTrailProgress:', {
        progress: `${(progress * 100).toFixed(1)}%`,
        currentDistance: `${(currentDistance / 1000).toFixed(2)} km`,
        totalDistance: `${(totalDistance / 1000).toFixed(2)} km`,
        bearing: `${currentBearing.toFixed(1)}°`,
        currentPoint: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
      });

      return {
        totalDistance,
        currentDistance,
        currentPoint,
        currentBearing,
        remainingDistance,
      };
    } catch (error) {
      console.error('❌ useTrailProgress error:', error);
      // Return safe defaults on error
      return {
        totalDistance: 0,
        currentDistance: 0,
        currentPoint: null,
        currentBearing: 0,
        remainingDistance: 0,
      };
    }
  }, [trail, progress]); // Recalculate when trail or progress changes
}

export default useTrailProgress;
