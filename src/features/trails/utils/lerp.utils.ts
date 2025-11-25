/**
 * LERP (Linear Interpolation) Utilities
 *
 * Used for smooth animation transitions in trail marker and camera movement.
 *
 * LERP Formula: newValue = current + (target - current) * speed
 *
 * @see src/features/trails/hooks/useTrailAnimationWithMarker.ts
 */

/**
 * Linear interpolation between two numbers
 *
 * @param current - Current value
 * @param target - Target value to interpolate towards
 * @param speed - Interpolation speed (0-1)
 *                0 = no movement, 1 = instant jump to target
 *                Typical: 0.12 for smooth, 0.85 for near-instant
 * @returns New interpolated value
 *
 * @example
 * // Smooth camera follow (12% per frame)
 * const newCamPos = lerp(currentCamPos, targetCamPos, 0.12);
 *
 * // Near-instant marker tracking (85% per frame)
 * const newMarkerPos = lerp(currentMarkerPos, targetMarkerPos, 0.85);
 */
export function lerp(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

/**
 * Linear interpolation for [lng, lat] coordinate pairs
 *
 * Interpolates both longitude and latitude simultaneously.
 *
 * @param current - Current [lng, lat] position
 * @param target - Target [lng, lat] position to interpolate towards
 * @param speed - Interpolation speed (0-1)
 * @returns New interpolated [lng, lat] position
 *
 * @example
 * // Marker position update (60 FPS)
 * const currentPos = [21.0122, 52.2297]; // Warsaw
 * const targetPos = [21.0150, 52.2310];
 * const newPos = lerpPoint(currentPos, targetPos, 0.85);
 * // newPos ≈ [21.0146, 52.2308] (85% closer to target)
 */
export function lerpPoint(
  current: [number, number],
  target: [number, number],
  speed: number
): [number, number] {
  return [
    lerp(current[0], target[0], speed), // Longitude
    lerp(current[1], target[1], speed), // Latitude
  ];
}

/**
 * Linear interpolation for bearing (heading) with 360° wrap handling
 *
 * Correctly interpolates bearings that cross the 0°/360° boundary.
 * For example, interpolating from 350° to 10° goes through 0° (not 180°).
 *
 * @param current - Current bearing in degrees (0-360)
 * @param target - Target bearing in degrees (0-360)
 * @param speed - Interpolation speed (0-1)
 * @returns New interpolated bearing in degrees (0-360)
 *
 * @example
 * // Without wrap handling (WRONG):
 * lerp(350, 10, 0.5) = 180  // ❌ Goes backwards through south!
 *
 * // With wrap handling (CORRECT):
 * lerpBearing(350, 10, 0.5) = 0  // ✅ Goes forward through north
 *
 * @example
 * // Camera bearing update (smooth turn)
 * const currentBearing = 350; // Facing mostly north
 * const targetBearing = 10;   // Turning slightly east
 * const newBearing = lerpBearing(currentBearing, targetBearing, 0.12);
 * // newBearing ≈ 352.4° (smooth turn through 0°, not 180°)
 */
export function lerpBearing(current: number, target: number, speed: number): number {
  // Calculate shortest angular distance (handles 360° wrap)
  let delta = target - current;

  // If delta > 180°, turn the other way (shorter path)
  if (delta > 180) {
    delta -= 360; // Example: 350° → 10° becomes -20° (turn left, not +340° right)
  }

  // If delta < -180°, turn the other way (shorter path)
  if (delta < -180) {
    delta += 360; // Example: 10° → 350° becomes +20° (turn right, not -340° left)
  }

  // Apply LERP with normalized delta, then normalize result to 0-360
  return (current + delta * speed + 360) % 360;
}
