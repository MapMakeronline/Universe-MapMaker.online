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
 * ✅ PERFORMANCE FIX: Split heavy calculations (trail stats) from light calculations (current position)
 * - Trail stats (turf.length): Cached per trail, recalculated only when trail changes
 * - Current position (turf.along, bearing): Calculated on every progress change (60 FPS during animation)
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
  // ✅ PERFORMANCE: Cache heavy trail calculations (only recalculate when trail changes)
  // This prevents 60x/sec recalculation of turf.length during animation
  const trailStats = useMemo(() => {
    try {
      const totalDistance = turf.length(trail, { units: 'meters' });

      if (totalDistance === 0) {
        console.warn('⚠️ useTrailProgress: Trail has zero length');
      }

      return { totalDistance };
    } catch (error) {
      console.error('❌ useTrailProgress: Trail stats calculation error:', error);
      return { totalDistance: 0 };
    }
  }, [trail]); // ✅ Only recalculate when trail changes (not on progress change)

  // ✅ PERFORMANCE: Light calculations (depend on progress, executed 60x/sec during animation)
  return useMemo(() => {
    const { totalDistance } = trailStats;

    // Guard: Handle empty or invalid trail
    if (totalDistance === 0) {
      return {
        totalDistance: 0,
        currentDistance: 0,
        currentPoint: null,
        currentBearing: 0,
        remainingDistance: 0,
      };
    }

    try {
      // Calculate current distance from start (meters)
      const currentDistance = Math.min(progress * totalDistance, totalDistance);

      // Get current point on trail using turf.along
      const currentPointFeature = turf.along(trail, currentDistance / 1000, {
        units: 'kilometers',
      });
      const currentPoint = currentPointFeature.geometry.coordinates as [number, number];

      // Calculate bearing (direction for camera)
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

      // Calculate remaining distance (meters)
      const remainingDistance = totalDistance - currentDistance;

      // ✅ PERFORMANCE: Reduced console spam (only log every 5% progress change)
      const progressPercent = Math.round(progress * 100);
      if (progressPercent % 5 === 0 && progress > 0) {
        console.log('📍 useTrailProgress:', {
          progress: `${progressPercent}%`,
          currentDistance: `${(currentDistance / 1000).toFixed(2)} km`,
          totalDistance: `${(totalDistance / 1000).toFixed(2)} km`,
          bearing: `${currentBearing.toFixed(1)}°`,
        });
      }

      return {
        totalDistance,
        currentDistance,
        currentPoint,
        currentBearing,
        remainingDistance,
      };
    } catch (error) {
      console.error('❌ useTrailProgress: Position calculation error:', error);
      // Return safe defaults on error
      return {
        totalDistance,
        currentDistance: 0,
        currentPoint: null,
        currentBearing: 0,
        remainingDistance: totalDistance,
      };
    }
  }, [trailStats, trail, progress]); // ✅ Depends on progress (light calculations) and trailStats (cached)
}

export default useTrailProgress;
