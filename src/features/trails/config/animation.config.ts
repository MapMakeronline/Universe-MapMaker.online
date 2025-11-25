/**
 * Trail Animation Configuration
 *
 * Single source of truth for all animation timing and behavior constants.
 * Based on Google Maps Navigation style.
 *
 * @see src/features/trails/hooks/useTrailAnimationWithMarker.ts
 */

export const TRAIL_ANIMATION_CONFIG = {
  /** Animation timing (2 minutes total duration) */
  duration: 120_000, // milliseconds

  /** Target frame rate */
  fps: 60,

  /** Google Maps Navigation Style - Camera Settings */
  camera: {
    /** Distance camera sits BEHIND marker (meters) */
    offsetBehindMarker: 80,

    /** Fixed navigation zoom level (Google Maps: 17-18) */
    zoom: 17.5,

    /** Perspective angle in degrees (Google Maps: 45-50°) */
    pitch: 50,

    /**
     * LERP interpolation speed for smooth camera follow
     * 0.12 = ~0.3s lag (Google Maps: 0.12-0.15)
     * Higher = faster reaction, less "chase" effect
     * Lower = slower reaction, more "chase" effect
     */
    lerpSpeed: 0.12,
  },

  /** Marker Settings */
  marker: {
    /**
     * LERP interpolation speed for near-instant marker tracking
     * 0.85 = ~2-3 frames lag (Google Maps style)
     * Higher = more instant (jittery on curves)
     * Lower = more smoothing (marker lags behind trail)
     */
    lerpSpeed: 0.85,
  },
} as const;

/**
 * Export individual constants for backward compatibility
 *
 * These can be imported directly without referencing the full config object.
 * Useful during incremental refactoring.
 */
export const ANIMATION_DURATION = TRAIL_ANIMATION_CONFIG.duration;
export const CAMERA_OFFSET_METERS = TRAIL_ANIMATION_CONFIG.camera.offsetBehindMarker;
export const NAVIGATION_ZOOM = TRAIL_ANIMATION_CONFIG.camera.zoom;
export const NAVIGATION_PITCH = TRAIL_ANIMATION_CONFIG.camera.pitch;
export const CAMERA_INTERPOLATION_SPEED = TRAIL_ANIMATION_CONFIG.camera.lerpSpeed;
export const INTERPOLATION_SPEED = TRAIL_ANIMATION_CONFIG.marker.lerpSpeed;
