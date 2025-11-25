/**
 * useTrailAnimationWithMarker - Unified animation hook for camera and marker
 *
 * REFACTORED (2025-11-25): Complete Google Maps navigation replication
 *
 * Features:
 * - Single requestAnimationFrame loop for camera + marker synchronization (60 FPS)
 * - Near-instant marker tracking (LERP speed = 0.85, ~2-3 frames lag)
 * - Smooth camera follow (LERP speed = 0.12, ~5-6 frames lag)
 * - Uses map.jumpTo() for instant camera updates (no easeTo conflicts)
 * - Camera BEHIND marker looking forward (Google Maps style)
 * - Fixed navigation zoom (17.5) and pitch (50°) for consistent view
 * - Shared markerRef from parent component
 *
 * Google Maps Navigation Behavior:
 * - Marker: Sticks closely to trail (high LERP = instant tracking)
 * - Camera: Behind marker, looks in direction of travel (bearing)
 * - Camera: Smooth follow with ~0.3s lag (LERP 0.12)
 * - View: Marker + road ahead visible, cinematic "chase" effect
 * - Zoom: Fixed 17.5 (navigation mode, independent of user zoom)
 * - Pitch: 50° (perspective view, not top-down)
 *
 * Critical Fixes Applied:
 * - ✅ Camera offset direction: bearing + 180° (BEHIND marker, not ahead!)
 * - ✅ Camera LERP speed: 0.12 (was 0.08, faster reaction to turns)
 * - ✅ Removed vertical offset (was causing incorrect positioning)
 * - ✅ Camera follows marker position (not trail position)
 * - ✅ No RAF loop conflicts (single loop controls both)
 * - ✅ No easeTo() interruptions (jumpTo is instant, LERP provides smoothness)
 * - ✅ Proper dependencies (all refs updated in same effect)
 * - ✅ No race conditions (marker and camera update in same frame)
 *
 * Uses Mapbox GL JS map.jumpTo() for camera, marker.setLngLat() for marker
 */

import { useEffect, useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl';
import type mapboxgl from 'mapbox-gl';

// Animation configuration and utilities
import {
  ANIMATION_DURATION,
  CAMERA_OFFSET_METERS,
  NAVIGATION_ZOOM,
  NAVIGATION_PITCH,
  CAMERA_INTERPOLATION_SPEED,
  INTERPOLATION_SPEED,
} from '../config/animation.config';
import { lerpPoint, lerpBearing } from '../utils/lerp.utils';
import { getCameraCenterBehindMarker } from '../utils/camera.utils';

interface UseTrailAnimationWithMarkerProps {
  isPlaying: boolean;
  progress: number;
  setProgress: (progress: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  mapRef: React.RefObject<MapRef>;
  markerRef: React.RefObject<mapboxgl.Marker | null>;
  currentPoint: [number, number] | null;
  currentBearing: number;
  followCamera: boolean;
  visible: boolean; // Marker visibility state
}

// Constants now imported from config/animation.config.ts
// ANIMATION_DURATION = 120000 (2 minutes)
// CAMERA_OFFSET_METERS = 80 (camera 80m behind marker)
// INTERPOLATION_SPEED = 0.85 (marker near-instant tracking)
// CAMERA_INTERPOLATION_SPEED = 0.12 (camera smooth follow)
// NAVIGATION_ZOOM = 17.5 (navigation mode zoom level)
// NAVIGATION_PITCH = 50 (perspective camera angle)

// Camera center calculation now in utils/camera.utils.ts
// Function: getCameraCenterBehindMarker(markerPoint, bearing, offsetMeters)

/**
 * Animation frame update function (60 FPS RAF loop logic)
 *
 * Extracted from Effect #2 (Phase 3 refactoring) to make animation logic testable.
 *
 * Handles:
 * 1. Progress increment (deltaTime / duration)
 * 2. Marker LERP (near-instant tracking, speed 0.85)
 * 3. Camera LERP (smooth follow, speed 0.12)
 * 4. End detection (progress >= 1.0)
 *
 * @param timestamp - RAF timestamp (DOMHighResTimeStamp)
 * @param state - Animation state refs
 * @param callbacks - State setters
 * @param map - Mapbox map instance
 * @param visible - Marker visibility (skip updates if hidden)
 * @returns Should continue animation (false = stop)
 */
function updateAnimationFrame(
  timestamp: number,
  state: {
    lastTimestamp: { current: number | null };
    progress: { current: number };
    markerPos: { current: [number, number] | null };
    markerBearing: { current: number };
    cameraPos: { current: [number, number] | null };
    cameraBearing: { current: number };
    targetPoint: { current: [number, number] | null };
    targetBearing: { current: number };
    followCamera: { current: boolean };
    marker: { current: mapboxgl.Marker | null };
  },
  callbacks: {
    setProgress: (progress: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
  },
  map: mapboxgl.Map,
  visible: boolean
): boolean {
  // Initialize timestamp on first frame
  if (state.lastTimestamp.current === null) {
    state.lastTimestamp.current = timestamp;
  }

  // Calculate elapsed time since last frame
  const deltaTime = timestamp - state.lastTimestamp.current;
  state.lastTimestamp.current = timestamp;

  // 1️⃣ Update progress (60 FPS) - use progressRef for current value
  const progressIncrement = deltaTime / ANIMATION_DURATION;
  const newProgress = Math.min(state.progress.current + progressIncrement, 1.0);
  callbacks.setProgress(newProgress);
  state.progress.current = newProgress; // Update ref immediately

  // 2️⃣ Update marker (60 FPS - smooth LERP interpolation)
  // ✅ Marker ALWAYS follows trail (independent of camera follow state)
  const marker = state.marker.current;
  const targetPos = state.targetPoint.current; // ✅ Use actual trail position as target
  const targetBear = state.targetBearing.current; // ✅ Use actual trail bearing as target
  const currentPos = state.markerPos.current;

  if (marker && targetPos && currentPos && visible) {
    // Linear interpolation (LERP) toward actual trail position
    const newPos = lerpPoint(currentPos, targetPos, INTERPOLATION_SPEED);
    const newBearing = lerpBearing(state.markerBearing.current, targetBear, INTERPOLATION_SPEED);

    // Update marker state
    state.markerPos.current = newPos;
    state.markerBearing.current = newBearing;

    // Update marker on map
    marker.setLngLat(newPos);
    marker.setRotation(newBearing);
    marker.addTo(map);
  }

  // 3️⃣ Update camera (60 FPS - smooth LERP interpolation)
  if (state.followCamera.current) {
    const camPoint = state.markerPos.current; // ✅ Follow marker, not trail
    const camBearing = state.markerBearing.current; // ✅ Use marker bearing

    if (camPoint && state.cameraPos.current) {
      try {
        // Calculate target camera position (marker position + offset)
        const targetCameraPos = getCameraCenterBehindMarker(camPoint, camBearing);
        const currentCameraPos = state.cameraPos.current;

        // Linear interpolation (LERP) toward target camera position
        const newCameraPos = lerpPoint(
          currentCameraPos,
          targetCameraPos,
          CAMERA_INTERPOLATION_SPEED
        );
        const newCamBearing = lerpBearing(
          state.cameraBearing.current,
          camBearing,
          CAMERA_INTERPOLATION_SPEED
        );

        // Update camera state
        state.cameraPos.current = newCameraPos;
        state.cameraBearing.current = newCamBearing;

        // Instant camera update (no easeTo animation conflicts)
        map.jumpTo({
          center: newCameraPos,
          bearing: newCamBearing,
          pitch: NAVIGATION_PITCH,
          zoom: NAVIGATION_ZOOM,
          // Google Maps style: marker in lower 1/3 of screen, more road visible ahead
          padding: { top: 700, bottom: 100, left: 0, right: 0 },
        });
      } catch (error) {
        console.error('❌ Camera update error:', error);
      }
    } else if (!camPoint) {
      console.warn('⚠️ Camera update skipped: camPoint is null');
    }
  }
  // Note: Camera follow disabled - skip LERP update (no log to avoid spam)

  // 4️⃣ Check if animation reached end
  if (newProgress >= 1.0) {
    callbacks.setIsPlaying(false); // Stop animation
    callbacks.setProgress(1.0); // Ensure exactly 1.0
    state.progress.current = 1.0;
    return false; // Signal to stop animation
  }

  return true; // Continue animation
}

/**
 * Initialize marker and camera to start position
 *
 * Extracted from Effect #1 (Phase 2 refactoring) to make initialization logic testable.
 *
 * @param currentPoint - Starting position on trail [lng, lat]
 * @param currentBearing - Starting direction (degrees)
 * @param markerPosRef - Ref to marker position state
 * @param markerBearingRef - Ref to marker bearing state
 * @param cameraPosRef - Ref to camera position state
 * @param cameraBearingRef - Ref to camera bearing state
 * @param mapRef - Reference to Mapbox map
 * @param progress - Current animation progress (for logging)
 * @param isReset - Whether this is a reset to start (for logging)
 */
function initializeAnimationState(
  currentPoint: [number, number],
  currentBearing: number,
  markerPosRef: { current: [number, number] | null },
  markerBearingRef: { current: number },
  cameraPosRef: { current: [number, number] | null },
  cameraBearingRef: { current: number },
  mapRef: React.RefObject<MapRef>,
  progress: number,
  isReset: boolean
): void {
  console.log('✅ Initializing / resetting marker & camera to start', {
    currentPoint: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
    progress,
    isReset,
  });

  // Set marker at trail start
  markerPosRef.current = currentPoint;
  markerBearingRef.current = currentBearing;

  // Set camera BEHIND marker at trail start
  const initialCameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);
  cameraPosRef.current = initialCameraPos;
  cameraBearingRef.current = currentBearing;

  // Physically move camera to initial position
  // Without this, camera stays in bird's eye view until Play is clicked
  const map = mapRef.current?.getMap();
  if (map) {
    map.jumpTo({
      center: initialCameraPos,
      bearing: currentBearing,
      pitch: NAVIGATION_PITCH,
      zoom: NAVIGATION_ZOOM,
      // Google Maps style: marker in lower 1/3 of screen, more road visible ahead
      padding: { top: 700, bottom: 100, left: 0, right: 0 },
    });
    console.log('✅ Camera physically moved to start position', {
      cameraPos: `[${initialCameraPos[0].toFixed(4)}, ${initialCameraPos[1].toFixed(4)}]`,
      bearing: currentBearing,
      zoom: NAVIGATION_ZOOM,
      pitch: NAVIGATION_PITCH,
    });
  } else {
    console.error('❌ mapRef.current is NULL - camera NOT moved!', {
      hasMapRef: !!mapRef.current,
      hasGetMap: !!mapRef.current?.getMap,
    });
  }
}

/**
 * useTrailAnimationWithMarker Hook
 *
 * Unified hook animating both camera and marker in single RAF loop
 *
 * @param isPlaying - Animation play state
 * @param progress - Current progress (0-1)
 * @param setProgress - Function to update progress
 * @param setIsPlaying - Function to update play state
 * @param mapRef - Reference to Mapbox map
 * @param markerRef - Reference to Mapbox marker (shared from parent)
 * @param currentPoint - Current position [lng, lat]
 * @param currentBearing - Current direction (degrees)
 * @param followCamera - Whether camera should follow trail
 * @param visible - Whether marker should be visible
 *
 * @example
 * const markerRef = useRef<mapboxgl.Marker | null>(null);
 *
 * useTrailAnimationWithMarker({
 *   isPlaying,
 *   progress,
 *   setProgress,
 *   setIsPlaying,
 *   mapRef,
 *   markerRef,
 *   currentPoint,
 *   currentBearing,
 *   followCamera,
 *   visible: open,
 * });
 */
export function useTrailAnimationWithMarker({
  isPlaying,
  progress,
  setProgress,
  setIsPlaying,
  mapRef,
  markerRef,
  currentPoint,
  currentBearing,
  followCamera,
  visible,
}: UseTrailAnimationWithMarkerProps): {
  syncCameraPosition: (position: [number, number], bearing: number) => void;
  syncMarkerPosition: (position: [number, number], bearing: number) => void;
  getCurrentMarkerPosition: () => { position: [number, number] | null; bearing: number };
} {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Marker interpolation state (current position that lerps toward currentPointRef)
  const currentMarkerPosRef = useRef<[number, number] | null>(null);
  const currentMarkerBearingRef = useRef<number>(0);

  // Camera interpolation state (current camera position that lerps toward target)
  const currentCameraPosRef = useRef<[number, number] | null>(null);
  const currentCameraBearingRef = useRef<number>(0);

  // Refs to avoid stale closures (declared first, then updated on every render)
  const currentPointRef = useRef<[number, number] | null>(null);
  const currentBearingRef = useRef<number>(0);
  const followCameraRef = useRef<boolean>(true);
  const progressRef = useRef<number>(0);

  // Update refs on every render (passive update, no effect execution)
  currentPointRef.current = currentPoint;
  currentBearingRef.current = currentBearing;
  followCameraRef.current = followCamera;
  progressRef.current = progress;

  // Effect 1: Initialize marker position (visible changes OR progress reset)
  useEffect(() => {
    const shouldBeVisible = !!(currentPoint && visible);
    const resetToStart = progress === 0;
    const shouldInitialize = currentMarkerPosRef.current === null || resetToStart;

    if (!shouldBeVisible) {
      // Hide marker and reset state
      if (markerRef.current) {
        markerRef.current.remove();
      }
      currentMarkerPosRef.current = null;
      currentCameraPosRef.current = null;
      return;
    }

    if (shouldInitialize) {
      // Initialize marker and camera using extracted helper function
      // Note: currentPoint is guaranteed to exist here (checked by shouldBeVisible above)
      initializeAnimationState(
        currentPoint!,
        currentBearing,
        currentMarkerPosRef,
        currentMarkerBearingRef,
        currentCameraPosRef,
        currentCameraBearingRef,
        mapRef,
        progress,
        resetToStart
      );
    }
  }, [visible, markerRef, currentPoint, currentBearing, progress, mapRef]);

  // Effect 2: Unified RAF loop (camera + marker in sync) - MINIMAL DEPS
  useEffect(() => {
    // Cancel animation if paused (but keep cleanup function registered)
    if (!isPlaying) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        lastTimestampRef.current = null;
      }
      // ✅ DON'T return early - allow cleanup function registration to prevent memory leak
    }

    // Only start RAF loop when playing and all guards pass
    if (isPlaying) {
      const map = mapRef.current?.getMap();
      if (!map) {
        console.warn('⚠️ RAF loop: Map not ready');
        // Don't return - allow cleanup registration
      } else if (!markerRef.current || !currentMarkerPosRef.current || !visible) {
        console.warn('⚠️ RAF loop: Marker not ready or not visible');
        // Don't return - allow cleanup registration
      } else {
        // SOLUTION B: Camera jump moved to Timeline.tsx handlePlayPause()
        // Timeline component now handles "when to jump" (UI interaction)
        // Hook only handles "how to animate" (RAF loop logic)

        // Prepare animation state for extracted function
        const animationState = {
          lastTimestamp: lastTimestampRef,
          progress: progressRef,
          markerPos: currentMarkerPosRef,
          markerBearing: currentMarkerBearingRef,
          cameraPos: currentCameraPosRef,
          cameraBearing: currentCameraBearingRef,
          targetPoint: currentPointRef,
          targetBearing: currentBearingRef,
          followCamera: followCameraRef,
          marker: markerRef,
        };

        const animationCallbacks = {
          setProgress,
          setIsPlaying,
        };

        // Unified animation loop (using extracted helper function)
        const animate = (timestamp: number) => {
          const shouldContinue = updateAnimationFrame(
            timestamp,
            animationState,
            animationCallbacks,
            map,
            visible
          );

          if (!shouldContinue) {
            // Animation ended, cleanup
            animationFrameRef.current = null;
            lastTimestampRef.current = null;
            return;
          }

          // Continue animation loop
          animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }

    // ✅ CRITICAL FIX: Cleanup function ALWAYS registered (even when isPlaying=false)
    // This prevents memory leak when component unmounts while paused
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        lastTimestampRef.current = null;
      }
    };
  }, [
    isPlaying,
    visible,
    setProgress,
    setIsPlaying,
    mapRef,
    markerRef,
  ]); // ✅ REMOVED: progress, currentPoint, currentBearing, followCamera (now using refs)

  // Effect 3: Manual seek - instant camera update (ONLY when user seeks slider)
  // Removed to prevent conflict with RAF loop - seek now handled by updating refs only
  // RAF loop will smoothly move camera to new position without restart

  // Expose function to sync camera position refs after external jumpTo
  // Used by Timeline.tsx handlePlayPause() to update refs after instant camera jump
  // ✅ Bug #16 fix: useCallback prevents infinite Timeline effect loop
  const syncCameraPosition = useCallback(
    (position: [number, number], bearing: number) => {
      currentCameraPosRef.current = position;
      currentCameraBearingRef.current = bearing;
      console.log('🔄 Camera position synced to refs', {
        position: `[${position[0].toFixed(4)}, ${position[1].toFixed(4)}]`,
        bearing,
      });
    },
    [] // Empty deps - only refs used (stable), function never needs to change
  );

  // Expose function to sync marker position refs (for manual RAF loop start)
  // Used by Timeline.tsx handlePlayPause() to initialize marker refs before starting animation
  const syncMarkerPosition = useCallback(
    (position: [number, number], bearing: number) => {
      currentMarkerPosRef.current = position;
      currentMarkerBearingRef.current = bearing;
      console.log('🔄 Marker position synced to refs', {
        position: `[${position[0].toFixed(4)}, ${position[1].toFixed(4)}]`,
        bearing,
      });
    },
    [] // Empty deps - only refs used (stable), function never needs to change
  );

  // Expose function to get current marker position
  // Used by Timeline.tsx handleCenterCamera() to jump to actual marker position (not trail position)
  const getCurrentMarkerPosition = (): { position: [number, number] | null; bearing: number } => {
    return {
      position: currentMarkerPosRef.current,
      bearing: currentMarkerBearingRef.current,
    };
  };

  return { syncCameraPosition, syncMarkerPosition, getCurrentMarkerPosition };
}

export default useTrailAnimationWithMarker;
